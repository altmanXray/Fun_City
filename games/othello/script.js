/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 黑白棋：8×8，翻转规则，AI 对手（位置权重+前瞻） */
'use strict';

const N = 8, CELL = 50, PAD = 2;
const BLACK = 1, WHITE = 2;
const DIRS8 = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

// 位置权重表（角落高、边缘次之、角旁为负）
const WEIGHTS = [
    [120,-20,20,5,5,20,-20,120],
    [-20,-40,-5,-5,-5,-5,-40,-20],
    [20,-5,15,3,3,15,-5,20],
    [5,-5,3,3,3,3,-5,5],
    [5,-5,3,3,3,3,-5,5],
    [20,-5,15,3,3,15,-5,20],
    [-20,-40,-5,-5,-5,-5,-40,-20],
    [120,-20,20,5,5,20,-20,120],
];

function inB(x,y){ return x>=0 && x<N && y>=0 && y<N; }
function opp(c){ return c===BLACK ? WHITE : BLACK; }

function getFlips(board, x, y, color) {
    if (board[y][x] !== 0) return [];
    const flips = [];
    for (const [dx,dy] of DIRS8) {
        const line = [];
        let cx = x+dx, cy = y+dy;
        while (inB(cx,cy) && board[cy][cx] === opp(color)) { line.push([cx,cy]); cx+=dx; cy+=dy; }
        if (line.length && inB(cx,cy) && board[cy][cx] === color) flips.push(...line);
    }
    return flips;
}

function legalMoves(board, color) {
    const moves = [];
    for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
        if (board[y][x]===0 && getFlips(board,x,y,color).length) moves.push({x,y});
    }
    return moves;
}

function apply(board, x, y, color) {
    const flips = getFlips(board, x, y, color);
    if (!flips.length) return board;
    const b = board.map(r=>r.slice());
    b[y][x] = color;
    for (const [fx,fy] of flips) b[fy][fx] = color;
    return b;
}

function countPieces(board) {
    let b=0,w=0;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++) { if(board[y][x]===BLACK)b++; if(board[y][x]===WHITE)w++; }
    return {b, w};
}

// AI：贪心（权重最高 + 行动力考虑）
function aiMove(board, color) {
    const moves = legalMoves(board, color);
    if (!moves.length) return null;
    let best = null, bestScore = -Infinity;
    for (const m of moves) {
        const nb = apply(board, m.x, m.y, color);
        let score = WEIGHTS[m.y][m.x];
        // 对手下一手合法数越少越好
        const oppMoves = legalMoves(nb, opp(color)).length;
        score -= oppMoves * 2;
        // 翻转数
        score += getFlips(board, m.x, m.y, color).length;
        if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
}

class Othello {
    constructor() {
        this.svg = document.getElementById('board');
        this.resultOverlay = document.getElementById('result-overlay');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.humanColor = BLACK;
        this.reset();
        this.bindEvents();
    }

    reset() {
        this.board = Array.from({length:N},()=>new Array(N).fill(0));
        this.board[3][3]=WHITE; this.board[3][4]=BLACK;
        this.board[4][3]=BLACK; this.board[4][4]=WHITE;
        this.current = BLACK;
        this.over = false;
        this.consecutivePass = 0;
        this.hideResult();
        this.updateScore();
        this.draw();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b=>b.addEventListener('click',()=>location.href='../../index.html'));
        document.getElementById('restart-btn').addEventListener('click',()=>this.reset());
        document.getElementById('result-restart').addEventListener('click',()=>this.reset());
        this.svg.addEventListener('click', e => {
            const cell = e.target.closest('[data-x]');
            if (!cell || this.over || this.current !== this.humanColor) return;
            const x = +cell.dataset.x, y = +cell.dataset.y;
            const flips = getFlips(this.board, x, y, this.current);
            if (!flips.length) return;
            this.board = apply(this.board, x, y, this.current);
            AudioManager.play('click');
            this.nextTurn();
        });
    }

    nextTurn() {
        this.updateScore();
        this.draw();
        if (this.over) return;

        // 先换到对方，再检查对方是否有合法落子
        this.current = opp(this.current);
        const moves = legalMoves(this.board, this.current);

        if (!moves.length) {
            this.consecutivePass++;
            if (this.consecutivePass >= 2) return this.endGame();
            // 对方跳过，换回当前方
            this.turnIndicator.textContent = `${this.current===BLACK?'黑棋':'白棋'}无合法落子，跳过`;
            this.current = opp(this.current);
            // 检查当前方（回到自己）是否也走不了
            if (!legalMoves(this.board, this.current).length) {
                this.consecutivePass++;
                if (this.consecutivePass >= 2) return this.endGame();
            }
        } else {
            this.consecutivePass = 0;
        }

        this.updateTurnUI();
        if (this.current === WHITE) {
            this.turnIndicator.textContent = '白棋思考中…';
            setTimeout(() => {
                if (this.over) return;
                const mv = aiMove(this.board, WHITE);
                if (mv) {
                    this.board = apply(this.board, mv.x, mv.y, WHITE);
                    AudioManager.play('flip');
                }
                this.nextTurn();
            }, 500 + Math.random() * 400);
        } else {
            this.turnIndicator.textContent = '轮到黑棋（你）';
            this.draw();
        }
    }

    updateTurnUI() {
        this.turnIndicator.textContent = this.current === BLACK ? '轮到黑棋（你）' : '白棋思考中…';
    }

    updateLegal() {
        if (this.current !== this.humanColor || this.over) return;
        this.turnIndicator.textContent = '轮到黑棋（你）';
        this.draw();
    }

    updateScore() {
        const {b, w} = countPieces(this.board);
        document.getElementById('score-black').textContent = b;
        document.getElementById('score-white').textContent = w;
        return {b, w};
    }

    endGame() {
        this.over = true;
        const {b, w} = this.updateScore();
        const title = document.getElementById('result-title');
        const text = document.getElementById('result-text');
        if (b > w) { title.textContent = '🎉 黑棋获胜！'; text.textContent = `黑 ${b} : 白 ${w}`; AudioManager.play('win'); }
        else if (w > b) { title.textContent = '🤖 白棋获胜'; text.textContent = `白 ${w} : 黑 ${b}`; AudioManager.play('lose'); }
        else { title.textContent = '🤝 平局'; text.textContent = `${b} : ${w}`; }
        this.resultOverlay.style.display = 'flex';
        this.draw();
    }

    hideResult() { this.resultOverlay.style.display = 'none'; }

    draw() {
        const showLegal = this.current === this.humanColor && !this.over;
        const legalSet = showLegal ? new Set(legalMoves(this.board, this.current).map(m=>`${m.x},${m.y}`)) : new Set();
        let svg = '';
        for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
            const isLegal = legalSet.has(`${x},${y}`);
            svg += `<rect x="${x*CELL+PAD}" y="${y*CELL+PAD}" width="${CELL-PAD*2}" height="${CELL-PAD*2}" rx="3" class="cell ${isLegal?'legal':''}" data-x="${x}" data-y="${y}"/>`;
            if (isLegal) svg += `<circle cx="${x*CELL+CELL/2}" cy="${y*CELL+CELL/2}" r="5" class="legal-dot"/>`;
            const p = this.board[y][x];
            if (p) {
                const cx = x*CELL+CELL/2, cy = y*CELL+CELL/2;
                svg += `<g class="disc"><circle cx="${cx}" cy="${cy}" r="${CELL/2-6}" fill="${p===BLACK?'#1a1a1a':'#f5f5f5'}" stroke="${p===BLACK?'#333':'#ccc'}" stroke-width="1.5"/>`;
                if (p===WHITE) svg += `<circle cx="${cx-4}" cy="${cy-4}" r="${CELL/2-14}" fill="rgba(255,255,255,0.5)"/>`;
                svg += `</g>`;
            }
        }
        this.svg.innerHTML = svg;
    }
}

document.addEventListener('DOMContentLoaded', () => { window.__othello = new Othello(); });
