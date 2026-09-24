/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 贪吃蛇：8 关卡，过关解锁，方向键/触屏控制 */
'use strict';

const GRID = 20;
const CELL = 20;
const KEY = 'snake_levels_v1';

const LEVELS = [
    { name: '初出茅庐', speed: 180, target: 5,  walls: [] },
    { name: '小试牛刀', speed: 160, target: 8,  walls: [] },
    { name: '渐入佳境', speed: 140, target: 10, walls: [[5,5],[6,5],[7,5],[8,5]] },
    { name: '左右为难', speed: 130, target: 12, walls: [[4,4],[5,4],[6,4],[13,4],[14,4],[15,4],[4,15],[5,15],[6,15],[13,15],[14,15],[15,15]] },
    { name: '穿针引线', speed: 120, target: 15, walls: [[10,3],[10,4],[10,5],[10,6],[10,7],[10,12],[10,13],[10,14],[10,15],[10,16]] },
    { name: '四面楚歌', speed: 110, target: 18, walls: [[3,3],[4,3],[5,3],[14,3],[15,3],[16,3],[3,16],[4,16],[5,16],[14,16],[15,16],[16,16],[3,10],[4,10],[15,10],[16,10]] },
    { name: '急速狂飙', speed: 90,  target: 20, walls: [[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5]] },
    { name: '终极试炼', speed: 75,  target: 25, walls: [[2,2],[3,2],[4,2],[15,2],[16,2],[17,2],[2,17],[3,17],[4,17],[15,17],[16,17],[17,17],[9,6],[10,6],[11,6],[9,13],[10,13],[11,13]] },
];

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.levelSelect = document.getElementById('level-select');
        this.gameScreen = document.getElementById('game-screen');
        this.resultOverlay = document.getElementById('result-overlay');
        this.unlocked = this.loadUnlocked();
        this.scores = this.loadScores();
        this.currentLevel = 0;
        this.bindEvents();
        this.renderLevels();
    }

    loadUnlocked() { try { return Math.max(1, +localStorage.getItem(KEY + '_unlocked') || 1); } catch { return 1; } }
    saveUnlocked() { try { localStorage.setItem(KEY + '_unlocked', String(this.unlocked)); } catch {} }
    loadScores() { try { return JSON.parse(localStorage.getItem(KEY + '_scores') || '{}'); } catch { return {}; } }
    saveScores() { try { localStorage.setItem(KEY + '_scores', JSON.stringify(this.scores)); } catch {} }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b => b.addEventListener('click', () => location.href = '../../index.html'));
        document.getElementById('back-levels').addEventListener('click', () => this.showLevels());
        document.getElementById('result-retry').addEventListener('click', () => { this.hideResult(); this.startLevel(this.currentLevel); });
        document.getElementById('result-next').addEventListener('click', () => { this.hideResult(); if (this.currentLevel < LEVELS.length - 1) this.startLevel(this.currentLevel + 1); });
        document.getElementById('result-levels').addEventListener('click', () => { this.hideResult(); this.showLevels(); });
        document.addEventListener('keydown', e => this.onKey(e));
        // 触屏滑动
        let sx = 0, sy = 0;
        this.canvas.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        this.canvas.addEventListener('touchmove', e => {
            const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) this.setDir(dx > 0 ? [1, 0] : [-1, 0]);
            else this.setDir(dy > 0 ? [0, 1] : [0, -1]);
            sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        }, { passive: true });
    }

    onKey(e) {
        const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
        const d = map[e.key];
        if (d) { e.preventDefault(); this.setDir(d); }
    }

    setDir(d) {
        if (!this.running) return;
        if (d[0] === -this.dir[0] && d[1] === -this.dir[1]) return; // 不能反向
        if (d[0] === this.dir[0] && d[1] === this.dir[1]) return;
        this.dir = d;
    }

    renderLevels() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = LEVELS.map((lv, i) => {
            const locked = i + 1 > this.unlocked;
            const score = this.scores[i] || 0;
            const cleared = score >= lv.target;
            const stars = cleared ? '⭐'.repeat(Math.min(3, Math.ceil(score / lv.target * 3))) : '';
            return `<div class="level-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''}" data-lv="${i}">
                <div class="lv-num">${locked ? '🔒' : i + 1}</div>
                <div class="lv-name">${lv.name}</div>
                <div class="lv-stars">${stars}</div>
            </div>`;
        }).join('');
        grid.querySelectorAll('.level-card:not(.locked)').forEach(el =>
            el.addEventListener('click', () => this.startLevel(+el.dataset.lv))
        );
    }

    showLevels() { this.stopLoop(); this.gameScreen.style.display = 'none'; this.levelSelect.style.display = 'block'; this.renderLevels(); }
    showGame() { this.levelSelect.style.display = 'none'; this.gameScreen.style.display = 'block'; }

    startLevel(idx) {
        this.currentLevel = idx;
        const lv = LEVELS[idx];
        this.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        this.dir = [1, 0];
        this.score = 0;
        this.walls = new Set(lv.walls.map(([x, y]) => `${x},${y}`));
        this.spawnFood();
        this.running = true;
        this.showGame();
        document.getElementById('hud-level').textContent = `第 ${idx + 1} 关 · ${lv.name}`;
        this.updateHud();
        this.best = this.scores[idx] || 0;
        document.getElementById('hud-best').textContent = `最高 ${this.best}`;
        this.loop();
    }

    updateHud() {
        document.getElementById('hud-score').textContent = `分数 ${this.score} / ${LEVELS[this.currentLevel].target}`;
    }

    spawnFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID);
            y = Math.floor(Math.random() * GRID);
        } while (this.snake.some(s => s.x === x && s.y === y) || this.walls.has(`${x},${y}`));
        this.food = { x, y };
    }

    loop() {
        if (!this.running) return;
        this.timer = setTimeout(() => {
            this.tick();
            this.draw();
            this.loop();
        }, LEVELS[this.currentLevel].speed);
    }

    stopLoop() { this.running = false; if (this.timer) clearTimeout(this.timer); }

    tick() {
        const head = this.snake[0];
        const nx = head.x + this.dir[0], ny = head.y + this.dir[1];
        // 撞墙
        if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || this.walls.has(`${nx},${ny}`)) return this.gameOver(false);
        // 撞自己
        if (this.snake.some(s => s.x === nx && s.y === ny)) return this.gameOver(false);
        this.snake.unshift({ x: nx, y: ny });
        if (nx === this.food.x && ny === this.food.y) {
            this.score++;
            AudioManager.play('pop');
            this.updateHud();
            if (this.score >= LEVELS[this.currentLevel].target) return this.gameOver(true);
            this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    gameOver(won) {
        this.stopLoop();
        const lv = LEVELS[this.currentLevel];
        const prevBest = this.scores[this.currentLevel] || 0;
        if (this.score > prevBest) { this.scores[this.currentLevel] = this.score; this.saveScores(); }
        if (won && this.currentLevel + 1 < LEVELS.length) {
            this.unlocked = Math.max(this.unlocked, this.currentLevel + 2);
            this.saveUnlocked();
        }
        document.getElementById('result-title').textContent = won ? '🎉 过关！' : '💀 游戏结束';
        document.getElementById('result-text').textContent = won
            ? `${lv.name}通关！${this.score} 分` + (this.score > prevBest ? '（新纪录）' : '')
            : `吃到 ${this.score} 个，目标 ${lv.target} 个`;
        document.getElementById('result-next').style.display = won && this.currentLevel < LEVELS.length - 1 ? '' : 'none';
        this.resultOverlay.style.display = 'flex';
        AudioManager.play(won ? 'win' : 'lose');
        if (window.LG) LG.Achievements.report('snake_play', { won, level: this.currentLevel + 1 });
    }

    hideResult() { this.resultOverlay.style.display = 'none'; }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 400, 400);
        // 网格微光
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
        }
        // 障碍墙
        ctx.fillStyle = '#3d3d5c';
        this.walls.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); });
        // 食物
        ctx.fillStyle = '#ff6b6b';
        ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(this.food.x * CELL + CELL / 2, this.food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // 蛇身（渐变）
        this.snake.forEach((s, i) => {
            const t = i / Math.max(1, this.snake.length - 1);
            const r = Math.round(72 + t * 60), g = Math.round(219 - t * 80), b = Math.round(160 - t * 60);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            const pad = i === 0 ? 1 : 2;
            ctx.beginPath();
            ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, i === 0 ? 6 : 4);
            ctx.fill();
        });
        // 蛇头眼睛
        const h = this.snake[0];
        ctx.fillStyle = '#fff';
        const ex = h.x * CELL + CELL / 2 + this.dir[0] * 3;
        const ey = h.y * CELL + CELL / 2 + this.dir[1] * 3;
        ctx.beginPath(); ctx.arc(ex - this.dir[1] * 3, ey - this.dir[0] * 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + this.dir[1] * 3, ey + this.dir[0] * 3, 2.5, 0, Math.PI * 2); ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => new SnakeGame());
