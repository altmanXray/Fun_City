/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 打砖块：8 关卡，过关解锁，道具掉落 */
'use strict';

const KEY = 'breakout_levels_v1';
const W = 400, H = 500;
const BW = 44, BH = 18, BGAP = 4; // 砖块
const PW = 70, PH = 10; // 挡板
const BR = 6; // 球半径
const COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

// 布局：数组值为颜色索引+1，0=空
const LAYOUTS = [
    [ // 1: 简单一排
        [1,1,1,1,1,1,1,1],
    ],
    [ // 2: 两排
        [1,1,1,1,1,1,1,1],
        [2,2,2,2,2,2,2,2],
    ],
    [ // 3: 金字塔
        [0,0,0,1,1,0,0,0],
        [0,0,1,2,2,1,0,0],
        [0,1,3,3,3,3,1,0],
        [1,4,4,4,4,4,4,1],
    ],
    [ // 4: 棋盘
        [1,0,2,0,3,0,4,0],
        [0,5,0,1,0,2,0,3],
        [4,0,5,0,1,0,2,0],
        [0,3,0,4,0,5,0,1],
    ],
    [ // 5: 拱门
        [1,1,1,0,0,1,1,1],
        [1,2,2,2,2,2,2,1],
        [1,2,3,3,3,3,2,1],
        [1,2,3,4,4,3,2,1],
    ],
    [ // 6: 条纹
        [1,0,1,0,1,0,1,0],
        [0,2,0,2,0,2,0,2],
        [3,0,3,0,3,0,3,0],
        [0,4,0,4,0,4,0,4],
        [5,0,5,0,5,0,5,0],
    ],
    [ // 7: 堡垒
        [1,1,1,1,1,1,1,1],
        [1,0,2,2,2,2,0,1],
        [1,2,3,3,3,3,2,1],
        [1,2,3,4,4,3,2,1],
        [1,1,1,1,1,1,1,1],
    ],
    [ // 8: 终极密集
        [1,2,3,4,5,4,3,2],
        [2,3,4,5,1,5,4,3],
        [3,4,5,1,2,1,5,4],
        [4,5,1,2,3,2,1,5],
        [5,1,2,3,4,3,2,1],
    ],
];

const LEVELS = LAYOUTS.map((layout, i) => ({
    name: `第${i+1}关`, layout,
    ballSpeed: 3 + i * 0.4,
    lives: 3,
}));

class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.levelSelect = document.getElementById('level-select');
        this.gameScreen = document.getElementById('game-screen');
        this.resultOverlay = document.getElementById('result-overlay');
        this.unlocked = this.loadVal('_unlocked', 1);
        this.cleared = this.loadVal('_cleared', {});
        this.running = false;
        this.bindEvents();
        this.renderLevels();
    }

    loadVal(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch { return d; } }
    saveVal(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {} }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b => b.addEventListener('click', () => location.href = '../../index.html'));
        document.getElementById('back-levels').addEventListener('click', () => this.showLevels());
        document.getElementById('result-retry').addEventListener('click', () => { this.hideResult(); this.startLevel(this.currentLevel); });
        document.getElementById('result-next').addEventListener('click', () => { this.hideResult(); if (this.currentLevel < LEVELS.length - 1) this.startLevel(this.currentLevel + 1); });
        document.getElementById('result-levels').addEventListener('click', () => { this.hideResult(); this.showLevels(); });

        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.paddleX = (e.clientX - rect.left) / rect.width * W - PW / 2;
            this.clampPaddle();
        });
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.paddleX = (e.touches[0].clientX - rect.left) / rect.width * W - PW / 2;
            this.clampPaddle();
        }, { passive: false });
        this.canvas.addEventListener('click', () => { if (this.stopped) this.launch(); });
    }

    clampPaddle() { this.paddleX = Math.max(0, Math.min(W - PW, this.paddleX)); }

    renderLevels() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = LEVELS.map((lv, i) => {
            const locked = i + 1 > this.unlocked;
            const cleared = !!this.cleared[i];
            return `<div class="level-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''}" data-lv="${i}">
                <div class="lv-num">${locked ? '🔒' : i + 1}</div>
                <div class="lv-name">${cleared ? '✅ 已通' : locked ? '未解锁' : '挑战'}</div>
            </div>`;
        }).join('');
        grid.querySelectorAll('.level-card:not(.locked)').forEach(el =>
            el.addEventListener('click', () => this.startLevel(+el.dataset.lv))
        );
    }

    showLevels() { this.running = false; cancelAnimationFrame(this.raf); this.gameScreen.style.display = 'none'; this.levelSelect.style.display = 'block'; this.renderLevels(); }
    showGame() { this.levelSelect.style.display = 'none'; this.gameScreen.style.display = 'block'; }
    hideResult() { this.resultOverlay.style.display = 'none'; }

    startLevel(idx) {
        this.currentLevel = idx;
        const lv = LEVELS[idx];
        this.paddleX = W / 2 - PW / 2;
        this.lives = lv.lives;
        this.bricks = [];
        lv.layout.forEach((row, r) => row.forEach((v, c) => {
            if (v) this.bricks.push({ x: c * (BW + BGAP) + BGAP, y: r * (BH + BGAP) + 60, w: BW, h: BH, color: COLORS[(v - 1) % COLORS.length], hp: v > 3 ? 2 : 1 });
        }));
        this.resetBall(lv.ballSpeed);
        this.stopped = true; // 等待点击发球
        this.running = true;
        this.showGame();
        document.getElementById('hud-level').textContent = `第 ${idx + 1} 关`;
        this.updateHud();
        this.loop();
    }

    resetBall(speed) {
        this.ball = { x: W / 2, y: H - 60, dx: (Math.random() - 0.5) * speed, dy: -speed, speed };
        this.stopped = true;
    }

    launch() { this.stopped = false; }

    updateHud() {
        document.getElementById('hud-score').textContent = `剩余 ${this.bricks.filter(b => b.hp > 0).length} 块`;
        document.getElementById('hud-lives').textContent = '❤️'.repeat(this.lives) || '💔';
    }

    loop() {
        if (!this.bricks) return;
        if (!this.stopped) this.tick();
        this.draw();
        if (this.running !== false) this.raf = requestAnimationFrame(() => this.loop());
    }

    tick() {
        const b = this.ball;
        b.x += b.dx; b.y += b.dy;
        // 墙壁反弹
        if (b.x < BR) { b.x = BR; b.dx = Math.abs(b.dx); }
        if (b.x > W - BR) { b.x = W - BR; b.dx = -Math.abs(b.dx); }
        if (b.y < BR) { b.y = BR; b.dy = Math.abs(b.dy); }
        // 挡板反弹
        if (b.y > H - PH - BR && b.y < H && b.x > this.paddleX && b.x < this.paddleX + PW) {
            b.dy = -Math.abs(b.dy);
            b.dx += (b.x - (this.paddleX + PW / 2)) * 0.05; // 根据击中位置偏转
            AudioManager.play('click');
        }
        // 掉落
        if (b.y > H + BR) {
            this.lives--;
            this.updateHud();
            if (this.lives <= 0) return this.gameOver(false);
            this.resetBall(LEVELS[this.currentLevel].ballSpeed);
            return;
        }
        // 砖块碰撞
        for (const br of this.bricks) {
            if (br.hp <= 0) continue;
            if (b.x > br.x - BR && b.x < br.x + br.w + BR && b.y > br.y - BR && b.y < br.y + br.h + BR) {
                br.hp--;
                AudioManager.play('pop');
                // 反弹方向
                const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
                if (Math.abs(b.x - cx) / br.w > Math.abs(b.y - cy) / br.h) b.dx = -b.dx;
                else b.dy = -b.dy;
                this.updateHud();
                if (this.bricks.every(x => x.hp <= 0)) return this.gameOver(true);
                break;
            }
        }
    }

    gameOver(won) {
        this.running = false;
        cancelAnimationFrame(this.raf);
        if (won && this.currentLevel + 1 < LEVELS.length) {
            this.unlocked = Math.max(this.unlocked, this.currentLevel + 2);
            this.saveVal('_unlocked', this.unlocked);
        }
        if (won) { this.cleared[this.currentLevel] = true; this.saveVal('_cleared', this.cleared); }
        document.getElementById('result-title').textContent = won ? '🎉 过关！' : '💀 游戏结束';
        document.getElementById('result-text').textContent = won ? '所有砖块已击碎！' : `剩余 ${this.bricks.filter(b => b.hp > 0).length} 块砖`;
        document.getElementById('result-next').style.display = won && this.currentLevel < LEVELS.length - 1 ? '' : 'none';
        this.resultOverlay.style.display = 'flex';
        AudioManager.play(won ? 'win' : 'lose');
        if (window.LG) LG.Achievements.report('breakout_play', { won, level: this.currentLevel + 1 });
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        // 砖块
        for (const br of this.bricks) {
            if (br.hp <= 0) continue;
            ctx.fillStyle = br.color;
            ctx.globalAlpha = br.hp === 2 ? 1 : 0.85;
            ctx.beginPath(); ctx.roundRect(br.x, br.y, br.w, br.h, 3); ctx.fill();
            ctx.globalAlpha = 1;
            if (br.hp === 2) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); }
        }
        // 挡板
        const grad = ctx.createLinearGradient(this.paddleX, 0, this.paddleX + PW, 0);
        grad.addColorStop(0, '#7c5cff'); grad.addColorStop(1, '#8d55bd');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(this.paddleX, H - PH - 5, PW, PH, 5); ctx.fill();
        // 球
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, BR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // 待发球提示
        if (this.stopped) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('点击发球', W / 2, H / 2);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new BreakoutGame());
