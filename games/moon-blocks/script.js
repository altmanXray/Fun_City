/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 圣杯求签（掷筊）：连中三圣筊触发庆祝特效 */
'use strict';

const RESULTS = {
    saint: { label: '圣筊', desc: '一阴一阳，神明允许 ✅', cls: 'saint' },
    laugh: { label: '笑筊', desc: '两阳，神明笑而不答 😄', cls: 'laugh' },
    anger: { label: '怒筊', desc: '两阴，神明拒绝 ❌', cls: 'anger' },
};

class MoonBlocks {
    constructor() {
        this.blockL = document.getElementById('block-left');
        this.blockR = document.getElementById('block-right');
        this.resultText = document.getElementById('result-text');
        this.streakDisplay = document.getElementById('streak-display');
        this.celebration = document.getElementById('celebration');
        this.historyScreen = document.getElementById('history-screen');
        this.throwScreen = document.getElementById('throw-screen');
        this.streak = 0;
        this.history = this.loadHistory();
        this.busy = false;
        this.bindEvents();
    }

    loadHistory() { try { return JSON.parse(localStorage.getItem('moon_blocks_history') || '[]'); } catch { return []; } }
    saveHistory() { try { localStorage.setItem('moon_blocks_history', JSON.stringify(this.history.slice(0, 50))); } catch {} }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b => b.addEventListener('click', () => location.href = '../../index.html'));
        document.getElementById('throw-btn').addEventListener('click', () => this.throw());
        document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
        document.getElementById('back-throw').addEventListener('click', () => {
            this.historyScreen.style.display = 'none';
            this.throwScreen.style.display = '';
        });
    }

    throw() {
        if (this.busy) return;
        this.busy = true;
        this.resultText.textContent = '';
        this.resultText.className = 'result-text';

        // 掷筊动画
        this.blockL.classList.remove('rolling');
        this.blockR.classList.remove('rolling');
        void this.blockL.offsetWidth; // reflow
        this.blockL.classList.add('rolling');
        this.blockR.classList.add('rolling');
        AudioManager.play('flip');

        setTimeout(() => {
            // 随机结果（圣筊概率稍高，游戏体验更好）
            const rand = Math.random();
            let result;
            if (rand < 0.45) result = 'saint';
            else if (rand < 0.75) result = 'laugh';
            else result = 'anger';

            // 翻面：先移除动画类再设 transform（否则 animation forwards 覆盖内联样式）
            this.blockL.classList.remove('rolling');
            this.blockR.classList.remove('rolling');
            const isYang = () => Math.random() < 0.5;
            let lYang, rYang;
            if (result === 'saint') { lYang = true; rYang = false; }
            else if (result === 'laugh') { lYang = true; rYang = true; }
            else { lYang = false; rYang = false; }

            this.blockL.style.transform = lYang ? 'rotateY(180deg)' : 'rotateY(0deg)';
            this.blockR.style.transform = rYang ? 'rotateY(180deg)' : 'rotateY(0deg)';

            // 显示结果
            const info = RESULTS[result];
            this.resultText.textContent = `${info.label} — ${info.desc}`;
            this.resultText.className = `result-text ${info.cls}`;

            // 连中计数
            if (result === 'saint') {
                this.streak++;
                AudioManager.play('success');
                if (this.streak >= 3) {
                    this.showCelebration();
                    this.streak = 0;
                }
            } else {
                this.streak = 0;
            }
            this.updateStreak();

            // 保存记录
            const wish = document.getElementById('wish-input').value.trim();
            this.history.unshift({ time: new Date().toISOString().slice(0, 16).replace('T', ' '), result: info.label, wish: wish || null });
            this.saveHistory();

            setTimeout(() => { this.busy = false; }, 500);
        }, 900);
    }

    updateStreak() {
        this.streakDisplay.textContent = this.streak > 0 ? `🔥 连续圣筊 ×${this.streak}` : '';
    }

    showCelebration() {
        this.celebration.style.display = 'flex';
        AudioManager.play('win');
        // 粒子效果（简单的 DOM 粒子）
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-20px;font-size:${14 + Math.random() * 14}px;z-index:201;pointer-events:none;`;
            p.textContent = ['✨', '🌟', '🎊', '💫'][i % 4];
            p.animate([{ transform: 'translateY(0)' }, { transform: `translateY(100vh) rotate(${360 * Math.random()}deg)` }], { duration: 1500 + Math.random() * 1000, easing: 'ease-in' }).onfinish = () => p.remove();
            document.body.appendChild(p);
        }
        setTimeout(() => { this.celebration.style.display = 'none'; }, 3000);
    }

    showHistory() {
        this.throwScreen.style.display = 'none';
        const el = document.getElementById('history-list');
        if (!this.history.length) el.innerHTML = '<div class="hist-empty">还没有掷筊记录</div>';
        else el.innerHTML = this.history.map(h => `
            <div class="hist-item">
                <span class="h-time">${h.time}</span>
                <span class="h-result ${h.result === '圣筊' ? 'saint' : h.result === '笑筊' ? 'laugh' : 'anger'}">${h.result}</span>
                ${h.wish ? `<span class="h-wish">「${h.wish}」</span>` : ''}
            </div>`).join('');
        this.historyScreen.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', () => new MoonBlocks());
