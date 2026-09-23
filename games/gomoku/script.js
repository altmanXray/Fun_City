/* FHDCC · LittleGame | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
const BOARD_SIZE = 19;
const EMPTY = 0;
const BLACK = 1; // 玩家（人机模式下）/ 先手
const WHITE = 2; // AI / 后手

class Gomoku {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.statusText = document.getElementById('status-text');
        this.turnDot = document.getElementById('turn-dot');
        this.messagePanel = document.getElementById('message-panel');
        this.messageTitle = document.getElementById('message-title');
        this.messageText = document.getElementById('message-text');

        this.mode = 'pve'; // 'pve' 人机 | 'pvp' 双人
        this.logicalSize = 0;
        this.startOverlay = document.getElementById('start-overlay');
        this.started = false;
        this.timer = new GameTimer(document.getElementById('time'));
        this.bestDisplay = document.getElementById('best-time');
        this.bestKey = 'gomoku_best_win';
        this.undoBtn = document.getElementById('undo-btn');
        this.boardWrap = document.querySelector('.board-wrap');
        this.statusRow = document.querySelector('.status-chip');
        this.undoCount = 0;
        this.winLine = null;

        this.bindEvents();
        this.reset();
        this.setupCanvas();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = '../../index.html';
            });
        });
        document.getElementById('restart-btn').addEventListener('click', () => this.reset());
        document.getElementById('message-restart-btn').addEventListener('click', () => this.reset());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
                this.reset();
            });
        });

        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.startOverlay.addEventListener('click', () => this.start());
        window.addEventListener('resize', () => this.setupCanvas());
    }

    reset() {
        this.board = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(EMPTY));
        this.current = BLACK;
        this.history = [];
        this.gameOver = false;
        this.aiThinking = false;
        this.lastMove = null;
        this.undoCount = 0;
        this.winLine = null;
        this.started = false;
        this.startOverlay.classList.remove('hidden');
        this.timer.reset();
        this.updateBestDisplay();
        this.hideMessage();
        this.updateUndoBtn();
        this.updateStatus();
        this.draw();
    }

    start() {
        this.started = true;
        this.startOverlay.classList.add('hidden');
        this.timer.start();
    }

    updateBestDisplay() {
        this.bestDisplay.textContent = GameUtils.formatTimeText(GameUtils.loadBestTime(this.bestKey));
    }

    recordWin() {
        GameUtils.saveBestTime(this.bestKey, this.timer.elapsed());
        this.updateBestDisplay();
    }

    // ---------- 画布 ----------
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const cssSize = rect.width;
        if (!cssSize) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(cssSize * dpr);
        this.canvas.height = Math.round(cssSize * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.logicalSize = cssSize;
        this.draw();
    }

    get padding() {
        return this.logicalSize * 0.045;
    }

    get step() {
        return (this.logicalSize - this.padding * 2) / (BOARD_SIZE - 1);
    }

    pointToPixel(i, j) {
        return {
            x: this.padding + j * this.step,
            y: this.padding + i * this.step
        };
    }

    draw() {
        const ctx = this.ctx;
        const size = this.logicalSize;
        if (!size) return;
        ctx.clearRect(0, 0, size, size);

        const step = this.step;
        const pad = this.padding;
        const end = pad + step * (BOARD_SIZE - 1);

        // 网格线
        ctx.strokeStyle = 'rgba(90, 55, 15, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < BOARD_SIZE; i++) {
            const p = pad + i * step;
            ctx.moveTo(pad, p);
            ctx.lineTo(end, p);
            ctx.moveTo(p, pad);
            ctx.lineTo(p, end);
        }
        ctx.stroke();

        // 星位（19 路：角星 + 边星 + 天元）
        const stars = [3, 9, 15];
        ctx.fillStyle = 'rgba(70, 42, 12, 0.75)';
        stars.forEach(i => stars.forEach(j => {
            const { x, y } = this.pointToPixel(i, j);
            ctx.beginPath();
            ctx.arc(x, y, Math.max(2.5, step * 0.09), 0, Math.PI * 2);
            ctx.fill();
        }));

        // 棋子
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (this.board[i][j] !== EMPTY) {
                    this.drawStone(i, j, this.board[i][j]);
                }
            }
        }

        // 最后一手标记
        if (this.lastMove) {
            const { x, y } = this.pointToPixel(this.lastMove.i, this.lastMove.j);
            ctx.strokeStyle = '#e5484d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, step * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 连珠线：贯穿获胜五子中心的半透明高亮线
        if (this.winLine && this.winLine.length >= 5) {
            const head = this.pointToPixel(this.winLine[0].i, this.winLine[0].j);
            const tail = this.pointToPixel(this.winLine[this.winLine.length - 1].i, this.winLine[this.winLine.length - 1].j);
            ctx.save();
            ctx.strokeStyle = 'rgba(229, 72, 77, 0.55)';
            ctx.lineWidth = step * 0.18;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.lineTo(tail.x, tail.y);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawStone(i, j, color) {
        const ctx = this.ctx;
        const { x, y } = this.pointToPixel(i, j);
        const r = this.step * 0.42;
        const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
        if (color === BLACK) {
            grad.addColorStop(0, '#6a6a6a');
            grad.addColorStop(1, '#0d0d0d');
        } else {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#cbcbcb');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ---------- 交互 ----------
    handleClick(e) {
        if (!this.started) return;
        if (this.gameOver || this.aiThinking) return;
        if (this.mode === 'pve' && this.current === WHITE) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const j = Math.round((x - this.padding) / this.step);
        const i = Math.round((y - this.padding) / this.step);

        if (i < 0 || i >= BOARD_SIZE || j < 0 || j >= BOARD_SIZE) return;
        // 点击须足够靠近交叉点
        const { x: px, y: py } = this.pointToPixel(i, j);
        if (Math.hypot(x - px, y - py) > this.step * 0.5) return;
        if (this.board[i][j] !== EMPTY) return;

        this.place(i, j, this.current);

        if (this.gameOver) return;

        if (this.mode === 'pve' && this.current === WHITE) {
            this.aiThinking = true;
            setTimeout(() => this.aiMove(), 260);
        }
    }

    place(i, j, color) {
        this.board[i][j] = color;
        this.history.push({ i, j, color });
        this.lastMove = { i, j };
        AudioManager.play('click');

        if (checkWin(this.board, i, j, color)) {
            this.gameOver = true;
            this.winLine = this.getWinLine(i, j, color);
            this.timer.stop();
            const ms = this.timer.elapsed();
            // 人机模式仅玩家（黑）获胜计入最快胜绩；AI 获胜不再覆盖玩家记录
            const humanWin = this.mode === 'pvp' || color === BLACK;
            if (humanWin) {
                this.recordWin();
                if (window.LG) {
                    LG.Records.add({ game: 'gomoku', mode: 'fastest_win', value: ms });
                }
            }
            AudioManager.play(humanWin ? 'win' : 'lose');
            if (window.LG) {
                LG.Achievements.report(humanWin ? 'gomoku_win' : 'gomoku_lose', {
                    vsAI: this.mode === 'pve',
                    ms
                });
            }
            this.draw();
            this.showWin(color);
            return;
        }
        if (this.history.length === BOARD_SIZE * BOARD_SIZE) {
            this.gameOver = true;
            this.timer.stop();
            this.draw();
            this.showDraw();
            return;
        }
        this.current = color === BLACK ? WHITE : BLACK;
        this.updateStatus();
        this.draw();
    }

    aiMove() {
        if (this.gameOver) { this.aiThinking = false; return; }
        const move = chooseAiMove(this.board, WHITE, BLACK);
        if (move) this.place(move.i, move.j, WHITE);
        this.aiThinking = false;
    }

    // 以 (i,j) 为中心取连成五子（及以上）的整条线，供绘制高亮
    getWinLine(i, j, color) {
        for (const [di, dj] of DIRS) {
            const line = [{ i, j }];
            let r = i + di, c = j + dj;
            while (inBounds(r, c) && this.board[r][c] === color) { line.push({ i: r, j: c }); r += di; c += dj; }
            r = i - di; c = j - dj;
            while (inBounds(r, c) && this.board[r][c] === color) { line.unshift({ i: r, j: c }); r -= di; c -= dj; }
            if (line.length >= 5) return line;
        }
        return null;
    }

    undo() {
        // 终局后不允许悔棋（按钮同步置灰）；AI 思考中同样不可操作
        if (this.gameOver || this.aiThinking || this.history.length === 0) return;

        this.undoCount++;
        this.updateUndoBtn();

        // 人机模式：一次撤销回退到玩家可落子（撤 AI + 玩家两手）
        const steps = (this.mode === 'pve' && this.history.length >= 2) ? 2 : 1;
        for (let k = 0; k < steps; k++) {
            const last = this.history.pop();
            if (!last) break;
            this.board[last.i][last.j] = EMPTY;
            this.current = last.color;
        }
        const prev = this.history[this.history.length - 1];
        this.lastMove = prev ? { i: prev.i, j: prev.j } : null;
        this.updateStatus();
        this.draw();
    }

    updateUndoBtn() {
        this.undoBtn.textContent = this.undoCount > 0 ? `悔棋（已${this.undoCount}次）` : '悔棋';
        this.undoBtn.disabled = this.gameOver;
    }

    // ---------- UI ----------
    updateStatus() {
        this.turnDot.classList.toggle('black', this.current === BLACK);
        this.turnDot.classList.toggle('white', this.current === WHITE);
        if (this.mode === 'pve') {
            this.statusText.textContent = this.current === BLACK ? '轮到你落子' : '机器人思考中…';
        } else {
            this.statusText.textContent = this.current === BLACK ? '轮到黑棋落子' : '轮到白棋落子';
        }
    }

    // 人机模式落败时，按本局悔棋次数分档吐槽
    loseTaunt() {
        const n = this.undoCount;
        if (n >= 5) {
            return { title: '🦖 你又菜又不要脸', text: `悔棋 ${n} 次还是输了。等你反应过来，恐龙都复活两轮了。` };
        }
        if (n >= 3) {
            return { title: '🤡 你太JER菜了', text: `悔棋 ${n} 次还是输了。若迟钝是一种天赋，阁下已是宗师级别。` };
        }
        if (n >= 1) {
            return { title: '😼 玩家太菜了', text: `悔棋 ${n} 次还是输了。贼走了关门，屁放了闻香——主打一个仪式感。` };
        }
        return { title: '😾 机器人获胜', text: '再接再厉，换个思路试试。' };
    }

    showWin(color) {
        let title, text;
        if (this.mode === 'pve') {
            if (color === BLACK) {
                title = '🎉 你赢了！';
                text = this.undoCount > 0
                    ? `五子连珠，漂亮！（顶着 ${this.undoCount} 次悔棋取胜）`
                    : '五子连珠，漂亮！';
            } else {
                const taunt = this.loseTaunt();
                title = taunt.title;
                text = taunt.text;
            }
        } else {
            title = color === BLACK ? '⚫ 黑棋获胜' : '⚪ 白棋获胜';
            text = '成功连成五子！';
        }
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.showMessagePanel();
    }

    showDraw() {
        this.messageTitle.textContent = '平局';
        this.messageText.textContent = '棋盘已满，势均力敌。';
        this.showMessagePanel();
    }

    // 结算横幅显示在棋盘下方（不遮棋盘与连珠线）：终局收起状态行、
    // 棋盘微缩一档腾出一屏空间；操作行保留，悔棋按钮置灰可见
    showMessagePanel() {
        this.messagePanel.style.display = 'flex';
        this.statusRow.style.display = 'none';
        this.boardWrap.classList.add('ended');
        this.updateUndoBtn();
        this.setupCanvas();
    }

    hideMessage() {
        this.messagePanel.style.display = 'none';
        this.statusRow.style.display = '';
        this.boardWrap.classList.remove('ended');
        this.setupCanvas();
    }
}

// ---------- 规则与 AI（纯函数） ----------
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function inBounds(i, j) {
    return i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE;
}

function checkWin(board, i, j, color) {
    for (const [di, dj] of DIRS) {
        let count = 1;
        let r = i + di, c = j + dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r += di; c += dj; }
        r = i - di; c = j - dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r -= di; c -= dj; }
        if (count >= 5) return true;
    }
    return false;
}

// 某方向上以 (i,j) 为 color 时的连子威胁分
function lineScore(count, openEnds) {
    if (count >= 5) return 1000000;
    if (count === 4) return openEnds === 2 ? 100000 : (openEnds === 1 ? 10000 : 0);
    if (count === 3) return openEnds === 2 ? 8000 : (openEnds === 1 ? 500 : 0);
    if (count === 2) return openEnds === 2 ? 300 : (openEnds === 1 ? 50 : 0);
    if (count === 1) return openEnds === 2 ? 20 : (openEnds === 1 ? 5 : 0);
    return 0;
}

// 假设在空点 (i,j) 落 color，评估该点的进攻/防守价值
function scorePoint(board, i, j, color) {
    let total = 0;
    for (const [di, dj] of DIRS) {
        let count = 1;
        let r = i + di, c = j + dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r += di; c += dj; }
        const openA = inBounds(r, c) && board[r][c] === EMPTY;
        r = i - di; c = j - dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r -= di; c -= dj; }
        const openB = inBounds(r, c) && board[r][c] === EMPTY;
        total += lineScore(count, (openA ? 1 : 0) + (openB ? 1 : 0));
    }
    return total;
}

function hasNeighbor(board, i, j, radius) {
    for (let di = -radius; di <= radius; di++) {
        for (let dj = -radius; dj <= radius; dj++) {
            if (di === 0 && dj === 0) continue;
            const r = i + di, c = j + dj;
            if (inBounds(r, c) && board[r][c] !== EMPTY) return true;
        }
    }
    return false;
}

function chooseAiMove(board, ai, human) {
    const center = (BOARD_SIZE - 1) / 2;

    // 空棋盘直接走天元
    let hasStone = false;
    for (let i = 0; i < BOARD_SIZE && !hasStone; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY) { hasStone = true; break; }
        }
    }
    if (!hasStone) return { i: center, j: center };

    let best = null;
    let bestScore = -Infinity;
    let bestAttack = -Infinity, attackMove = null;
    let bestDefend = -Infinity, defendMove = null;

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY) continue;
            if (!hasNeighbor(board, i, j, 2)) continue;

            const attack = scorePoint(board, i, j, ai);
            const defend = scorePoint(board, i, j, human);

            if (attack > bestAttack) { bestAttack = attack; attackMove = { i, j }; }
            if (defend > bestDefend) { bestDefend = defend; defendMove = { i, j }; }

            // 靠近中心的微弱偏好用于打破平分
            const centerBias = ((BOARD_SIZE - 1) - Math.abs(i - center) - Math.abs(j - center)) * 0.1;
            const combined = attack * 1.0 + defend * 0.85 + centerBias;
            if (combined > bestScore) {
                bestScore = combined;
                best = { i, j };
            }
        }
    }

    // AI 能直接连五：制胜
    if (bestAttack >= 1000000) return attackMove;
    // 对手将连五或成活四：必须封堵
    if (bestDefend >= 100000) return defendMove;

    return best || attackMove;
}

document.addEventListener('DOMContentLoaded', () => new Gomoku());
