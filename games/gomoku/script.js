/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
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
        this.levelCaret = document.getElementById('level-caret');
        this.levelMenu = document.getElementById('level-menu');
        this.aiLevel = this.loadAiLevel();
        this.undoCount = 0;
        this.winLine = null;

        this.bindEvents();
        this.reset();
        this.setupCanvas();
    }

    loadAiLevel() {
        try {
            const saved = localStorage.getItem('gomoku_ai_level');
            if (saved && AI_LEVELS[saved]) return saved;
        } catch (e) { /* 忽略 */ }
        return 'std';
    }

    toggleLevelMenu(open) {
        const willOpen = open != null ? open : !this.levelMenu.classList.contains('open');
        // 用内联样式控制显隐（关键定位已内联，不受样式表缓存影响）
        this.levelMenu.classList.toggle('open', willOpen);
        this.levelMenu.style.display = willOpen ? 'flex' : 'none';
        if (willOpen) {
            const cur = this.levelMenu.querySelector('.level-opt.active');
            (cur || this.levelMenu.querySelector('.level-opt'))?.focus();
        } else {
            this.levelCaret.focus();
        }
    }

    setAiLevel(key) {
        if (!AI_LEVELS[key] || key === this.aiLevel) {
            this.toggleLevelMenu(false);
            return;
        }
        // 对局进行中锁定档位（防临胜换档刷榜）：需重新开始后切换
        if (this.mode === 'pve' && this.history.length > 0 && !this.gameOver) {
            if (window.LG && LG.UI) LG.UI.toast('对局中不能换档，重新开始后可切换');
            this.toggleLevelMenu(false);
            return;
        }
        this.aiLevel = key;
        try { localStorage.setItem('gomoku_ai_level', key); } catch (e) { /* 忽略 */ }
        this.toggleLevelMenu(false);
        this.updateLevelPills();
        this.updateBestDisplay();
        AudioManager.play('click');
    }

    updateLevelPills() {
        const locked = this.mode === 'pve' && this.history.length > 0 && !this.gameOver;
        document.querySelectorAll('.level-opt').forEach(b => {
            b.classList.toggle('active', b.dataset.level === this.aiLevel);
            b.classList.toggle('locked', locked && b.dataset.level !== this.aiLevel);
        });
        this.levelCaret.querySelector('.level-name').textContent = AI_LEVELS[this.aiLevel].label;
        this.levelCaret.classList.toggle('locked', locked);
    }

    // 模式切换：布局恒定，双人时档位下拉仅置灰（仍可预先选好，切回人机生效）
    updateModeUI() {
        this.levelCaret.classList.toggle('dim', this.mode !== 'pve');
    }

    // 当前档位的最佳成绩 key（标准档兼容旧键）
    levelBestKey() {
        return `gomoku_best_win_${this.aiLevel}`;
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

        // 档位下拉：点箭头开合，点选项切换，Esc 关闭，↑↓ 选择，Enter 确认，点页面其他处收起
        this.levelCaret.addEventListener('click', () => this.toggleLevelMenu());
        document.querySelectorAll('.level-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setAiLevel(btn.dataset.level);
            });
        });
        document.addEventListener('click', (e) => {
            if (this.levelMenu.classList.contains('open') && !e.target.closest('.mode-btn-wrap')) {
                this.toggleLevelMenu(false);
            }
        });
        this.levelMenu.addEventListener('keydown', (e) => {
            if (!this.levelMenu.classList.contains('open')) return;
            const opts = [...this.levelMenu.querySelectorAll('.level-opt:not(.locked)')];
            const activeEl = this.levelMenu.querySelector('.level-opt.active');
            const cur = Math.max(0, opts.indexOf(activeEl));
            if (e.key === 'Escape') { this.toggleLevelMenu(false); this.levelCaret.focus(); e.stopPropagation(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(cur + 1, opts.length - 1)]?.focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(cur - 1, 0)]?.focus(); }
            else if (e.key === 'Enter') { e.preventDefault(); opts[cur]?.click(); }
        });
        this.levelCaret.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); this.toggleLevelMenu(true); this.levelMenu.querySelector('.level-opt:not(.locked)')?.focus(); }
        });

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
        this.updateModeUI();
        this.updateLevelPills();
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
        if (this.mode === 'pve') {
            const key = this.levelBestKey();
            let best = GameUtils.loadBestTime(key);
            // 标准档兼容旧版记录
            if (this.aiLevel === 'std') {
                const legacy = GameUtils.loadBestTime('gomoku_best_win');
                if (legacy !== null && (best === null || legacy < best)) best = legacy;
            }
            this.bestDisplay.textContent = GameUtils.formatTimeText(best);
        } else {
            this.bestDisplay.textContent = GameUtils.formatTimeText(GameUtils.loadBestTime(this.bestKey));
        }
    }

    recordWin() {
        if (this.mode === 'pve') {
            GameUtils.saveBestTime(this.levelBestKey(), this.timer.elapsed());
            // 标准档同步维护旧键，保证旧页面/旧数据一致
            if (this.aiLevel === 'std') GameUtils.saveBestTime(this.bestKey, this.timer.elapsed());
        } else {
            GameUtils.saveBestTime(this.bestKey, this.timer.elapsed());
        }
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
        this.updateLevelPills(); // 首手落子后锁定档位
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
                if (window.LG && this.mode === 'pve') {
                    LG.Records.add({ game: 'gomoku', mode: `fastest_${this.aiLevel}`, value: ms });
                }
            }
            AudioManager.play(humanWin ? 'win' : 'lose');
            if (window.LG) {
                LG.Achievements.report(humanWin ? 'gomoku_win' : 'gomoku_lose', {
                    vsAI: this.mode === 'pve',
                    level: this.mode === 'pve' ? this.aiLevel : undefined,
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
        const move = chooseAiMove(this.board, WHITE, BLACK, this.aiLevel);
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
        const thinking = this.mode === 'pve' && this.current === WHITE;
        this.statusText.textContent = thinking ? '机器人思考中' : (this.mode === 'pve' ? '轮到你落子' : (this.current === BLACK ? '轮到黑棋落子' : '轮到白棋落子'));
        this.statusText.classList.toggle('thinking', thinking); // 动态省略号
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
        this.updateLevelPills(); // 终局后解锁档位（下局生效）
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

/* ================= 机器人强度档位 =================
   菜鸡：失误注入（次优手 + 防守打折，rng 可注入便于测试）
   标准：单步评分（原逻辑）
   专家：双威胁识别 + 满额防守权重
   大师 / 我Chovy / 超级大神：专家评分 + α-β 极小化极大（深度 2 / 5 / 7，深档带时间预算） */
const AI_LEVELS = {
    caiji: { label: '菜鸡', blunder: true },
    std: { label: '标准', defendW: 0.85 },
    expert: { label: '专家', doubleThreat: true, defendW: 1.0 },
    master: { label: '大师', doubleThreat: true, defendW: 1.0, depth: 2 },
    chovy: { label: '我Chovy', doubleThreat: true, defendW: 1.0, depth: 5, budget: 600 },
    god: { label: '超级大神', doubleThreat: true, defendW: 1.0, depth: 7, budget: 1200 }
};

// 落子于 (i,j) 后四个方向各自的连子形态 {count, open}
function dirPatterns(board, i, j, color) {
    const out = [];
    for (const [di, dj] of DIRS) {
        let count = 1;
        let r = i + di, c = j + dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r += di; c += dj; }
        const openA = inBounds(r, c) && board[r][c] === EMPTY;
        r = i - di; c = j - dj;
        while (inBounds(r, c) && board[r][c] === color) { count++; r -= di; c -= dj; }
        const openB = inBounds(r, c) && board[r][c] === EMPTY;
        out.push({ count, open: (openA ? 1 : 0) + (openB ? 1 : 0) });
    }
    return out;
}

// 双威胁加分：活四 > 双冲四 > 冲四+活三 > 双活三（均低于连五）
function threatBonus(pats) {
    let four = 0, open4 = 0, open3 = 0;
    for (const p of pats) {
        if (p.count >= 4) { four++; if (p.open === 2) open4++; }
        else if (p.count === 3 && p.open === 2) open3++;
    }
    if (open4 > 0) return 80000;
    if (four >= 2) return 60000;
    if (four >= 1 && open3 >= 1) return 40000;
    if (open3 >= 2) return 30000;
    return 0;
}

// 单点价值 = 基础棋型分 (+ 双威胁分)
function moveScore(board, i, j, color, useDT) {
    let s = scorePoint(board, i, j, color);
    if (useDT) s += threatBonus(dirPatterns(board, i, j, color));
    return s;
}

// 候选点（邻域2格），h 用于排序（攻防合计）
function genCandidates(board, ai, human, useDT, limit) {
    const list = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY) continue;
            if (!hasNeighbor(board, i, j, 2)) continue;
            const a = moveScore(board, i, j, ai, useDT);
            const d = moveScore(board, i, j, human, useDT);
            list.push({ i, j, a, d, h: a + d });
        }
    }
    list.sort((x, y) => y.h - x.h);
    return limit ? list.slice(0, limit) : list;
}

// 局面评估（对 ai 方为正）：双方最优潜力 + 潜力和
function evalBoard(board, ai, human, useDT) {
    let myBest = 0, opBest = 0, mySum = 0, opSum = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY || !hasNeighbor(board, i, j, 2)) continue;
            const a = moveScore(board, i, j, ai, useDT);
            const d = moveScore(board, i, j, human, useDT);
            if (a > myBest) myBest = a;
            mySum += a;
            if (d > opBest) opBest = d;
            opSum += d;
        }
    }
    return myBest + mySum * 0.05 - (opBest * 1.05 + opSum * 0.05);
}

// α-β 递归（超时即返回当前部分结果，不卡死）
// ext：强制手延伸计数（对抗水平线效应：深度用尽时，若有一手连五仍延伸 2 层）
function abSearch(board, depth, alpha, beta, turn, ai, human, cfg, deadline, ext) {
    ext = ext || 0;
    const width = (ext ? 12 : depth >= 5 ? 6 : depth >= 3 ? 5 : 4);
    const cands = genCandidates(board, ai, human, cfg.doubleThreat, width);

    // 立即连五点（无论深度都能看见：胜方得分，守方必须堵）
    const winNow = cands.find(m => (turn === ai ? m.a : m.d) >= 1000000);
    if (winNow) return turn === ai ? 1e9 + depth * 1e6 : -(1e9 + depth * 1e6);

    if (depth <= 0) {
        // 水平线补救：对手下一手有连五点 → 搜索我方堵防后的局面（延伸上限 2）
        const oppFive = cands.find(m => (turn === ai ? m.d : m.a) >= 1000000);
        if (oppFive && ext < 2 && Date.now() <= deadline) {
            board[oppFive.i][oppFive.j] = turn;
            const val = abSearch(board, 1, alpha, beta, turn === ai ? human : ai, ai, human, cfg, deadline, ext + 1);
            board[oppFive.i][oppFive.j] = EMPTY;
            return val;
        }
        return evalBoard(board, ai, human, cfg.doubleThreat);
    }
    let best = turn === ai ? -Infinity : Infinity;
    for (const m of cands) {
        board[m.i][m.j] = turn;
        let val;
        if ((turn === ai ? m.a : m.d) >= 1000000) {
            // 该手直接连五：越浅（越快）越好
            val = turn === ai ? 1e9 + depth * 1e6 : -(1e9 + depth * 1e6);
        } else {
            val = abSearch(board, depth - 1, alpha, beta, turn === ai ? human : ai, ai, human, cfg, deadline, ext);
        }
        board[m.i][m.j] = EMPTY;
        if (turn === ai) {
            if (val > best) best = val;
            if (best > alpha) alpha = best;
        } else {
            if (val < best) best = val;
            if (best < beta) beta = best;
        }
        if (beta <= alpha || Date.now() > deadline) break;
    }
    return best;
}

// 搜索根：即胜/必堵/活四堵短路 + 迭代加深（超时用上一完整深度的结果，绝不返回垃圾手）
function searchRoot(board, ai, human, cfg) {
    const rootWidth = cfg.depth >= 5 ? 12 : 8;
    const cands = genCandidates(board, ai, human, cfg.doubleThreat, rootWidth);
    if (!cands.length) return null;
    for (const m of cands) if (m.a >= 1000000) return m;            // 己方连五
    for (const m of cands) if (m.d >= 1000000) return m;            // 堵对方连五
    const fourBlock = cands.find(m => m.d >= 100000);
    if (fourBlock) return fourBlock;                                  // 堵对方活四

    const deadline = Date.now() + (cfg.budget || 300);
    const expertPick = (() => {
        // 保底：专家级单步评分选点（迭代加深未完成任何一层时用它）
        let best = cands[0], bs = -Infinity;
        for (const m of cands) {
            const s = m.a + m.d * (cfg.defendW || 1.0);
            if (s > bs) { bs = s; best = m; }
        }
        return best;
    })();

    let best = expertPick;
    // 迭代加深：深度 2 起每次 +2，只有整层算完才更新答案
    for (let depth = 2; depth <= cfg.depth; depth += 2) {
        let alpha = -Infinity;
        let curBest = null, curVal = -Infinity;
        let completed = true;
        for (const m of cands) {
            board[m.i][m.j] = ai;
            const val = abSearch(board, depth - 1, alpha, Infinity, human, ai, human, cfg, deadline);
            board[m.i][m.j] = EMPTY;
            if (Date.now() > deadline) { completed = false; break; }
            if (val > curVal) { curVal = val; curBest = m; }
            if (val > alpha) alpha = val;
        }
        if (completed && curBest) { best = curBest; }
        if (!completed || Date.now() > deadline) break;
    }
    return best;
}

// 菜鸡：必胜还是拿，但堵四有 20% 失明、30% 概率下次优手、防守权重随机打折
function blunderMove(board, ai, human, cands, rng) {
    const win = cands.find(m => m.a >= 1000000);
    if (win) return win;
    const block = cands.find(m => m.d >= 100000);
    if (block && rng() < 0.8) return block;
    const pool = cands.slice(1, 6).filter(m => m.h > 0);
    if (pool.length && rng() < 0.3) return pool[Math.floor(rng() * pool.length) % pool.length];
    let best = null, bs = -Infinity;
    for (const m of cands) {
        const cb = (14 - Math.abs(m.i - 7) - Math.abs(m.j - 7)) * 0.1;
        const s = m.a + m.d * (0.35 + rng() * 0.4) + cb;
        if (s > bs) { bs = s; best = m; }
    }
    return best || cands[0];
}

function chooseAiMove(board, ai, human, levelKey) {
    const cfg = AI_LEVELS[levelKey] || AI_LEVELS.std;
    const center = (BOARD_SIZE - 1) / 2;

    // 空棋盘直接走天元
    let hasStone = false;
    for (let i = 0; i < BOARD_SIZE && !hasStone; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== EMPTY) { hasStone = true; break; }
        }
    }
    if (!hasStone) return { i: center, j: center };

    const cands = genCandidates(board, ai, human, cfg.doubleThreat);
    if (!cands.length) return null;

    let mv;
    if (cfg.blunder) mv = blunderMove(board, ai, human, cands, cfg.rng || Math.random);
    else if (cfg.depth) mv = searchRoot(board, ai, human, cfg);
    else {
        // 标准 / 专家：单步评分（专家带双威胁加成与满额防守权重）
        let best = null, bestScore = -Infinity;
        for (const m of cands) {
            const cb = (14 - Math.abs(m.i - 7) - Math.abs(m.j - 7)) * 0.1;
            const s = m.a * 1.0 + m.d * (cfg.defendW || 0.85) + cb;
            if (s > bestScore) { bestScore = s; best = m; }
        }
        mv = best || cands[0];
    }
    return mv ? { i: mv.i, j: mv.j } : null;
}

// 供 node/浏览器校验使用
window.GomokuAI = { AI_LEVELS, chooseAiMove, genCandidates, moveScore, dirPatterns, threatBonus, evalBoard, searchRoot, blunderMove };

document.addEventListener('DOMContentLoaded', () => { window.__gomoku = new Gomoku(); });
