/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 主题切换器：7 套主题 + JS 兜底颜色（绕过 IAB CSS 变量计算引擎 bug） */
'use strict';

const THEMES = [
    { key: 'violet',        name: '紫罗兰',       icon: '🟣', bg: '#5865d9' },
    { key: 'dark',          name: '暗夜',         icon: '🌑', bg: '#1a1a2e' },
    { key: 'ocean',         name: '海洋',         icon: '🌊', bg: '#0ea5e9' },
    { key: 'sunset',        name: '落日',         icon: '🌅', bg: '#f97316' },
    { key: 'forest',        name: '森林',         icon: '🌲', bg: '#059669' },
    { key: 'kitty',         name: 'Hello Kitty', icon: '🎀', bg: '#ffb6c1' },
    { key: 'streetfighter', name: '街霸',         icon: '👊', bg: '#ff6b35' },
];

const ThemeManager = {
    KEY: 'lg_theme_v1',

    CARD_COLORS: {
        violet: '#f4f0ff', dark: '#2a2a3e', ocean: '#ecfeff', sunset: '#fff1e6',
        forest: '#ecfdf5', kitty: '#fff5f8', streetfighter: '#3a2a2a',
    },

    TEXT_COLORS: {
        violet:        { text: '#332f40', muted: '#756b7a', title: '#5d4bc2' },
        dark:          { text: '#e2e2f0', muted: '#8888a8', title: '#a78bfa' },
        ocean:         { text: '#164e63', muted: '#6b9eb5', title: '#0891b2' },
        sunset:        { text: '#431407', muted: '#9a6b55', title: '#ea580c' },
        forest:        { text: '#14532d', muted: '#6b9b78', title: '#16a34a' },
        kitty:         { text: '#4a148c', muted: '#ad6b8a', title: '#e91e63' },
        streetfighter: { text: '#f5f0e0', muted: '#aa9990', title: '#ff6b35' },
    },

    current() {
        try { return localStorage.getItem(this.KEY) || 'violet'; } catch { return 'violet'; }
    },

    apply(key) {
        const valid = THEMES.some(t => t.key === key);
        const theme = valid ? key : 'violet';
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) document.body.setAttribute('data-theme', theme);
        try { localStorage.setItem(this.KEY, theme); } catch {}

        // JS 兜底：直接设大厅卡片与文本颜色（IAB 的 CSS 变量计算引擎在 data-theme 切换后不重算）
        const cardColor = this.CARD_COLORS[theme] || this.CARD_COLORS.violet;
        document.querySelectorAll('.game-card').forEach(c => {
            c.style.setProperty('background-color', cardColor, 'important');
        });
        const tc = this.TEXT_COLORS[theme] || this.TEXT_COLORS.violet;
        document.querySelectorAll('.game-title, .section-title, .subtitle').forEach(el => {
            el.style.setProperty('color', tc.title, 'important');
        });
        document.querySelectorAll('.game-description, .footer p').forEach(el => {
            el.style.setProperty('color', tc.muted, 'important');
        });
        document.querySelectorAll('.tag').forEach(el => {
            el.style.setProperty('color', tc.text, 'important');
        });

        // 同步到 iframe（壳模式）
        const frame = document.getElementById('game-frame');
        if (frame && frame.contentDocument) {
            try {
                frame.contentDocument.documentElement.setAttribute('data-theme', theme);
                if (frame.contentDocument.body) frame.contentDocument.body.setAttribute('data-theme', theme);
            } catch {}
        }
    },

    openPicker() {
        const cur = this.current();
        const old = document.querySelector('.lg-theme-modal');
        if (old) { old.remove(); return; }

        const wrap = document.createElement('div');
        wrap.className = 'lg-theme-modal';
        wrap.innerHTML = `
            <div class="lg-theme-content">
                <div class="lg-theme-head">
                    <h2>🎨 选择主题</h2>
                    <button class="lg-theme-close" aria-label="关闭">✕</button>
                </div>
                <div class="lg-theme-grid">
                    ${THEMES.map(t => `
                        <button class="lg-theme-card ${t.key === cur ? 'active' : ''}" data-theme="${t.key}">
                            <span class="lg-theme-swatch" style="background:${t.bg}">${t.icon}</span>
                            <span class="lg-theme-name">${t.name}</span>
                            ${t.key === cur ? '<span class="lg-theme-check">✓</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        document.body.appendChild(wrap);

        wrap.querySelector('.lg-theme-close').addEventListener('click', () => wrap.remove());
        wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
        wrap.querySelectorAll('.lg-theme-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.apply(btn.dataset.theme);
                wrap.remove();
            });
        });
    },
};

// 初始化：读取 localStorage 并应用 + 挂载全局
(function() {
    ThemeManager.apply(ThemeManager.current());
    window.ThemeManager = ThemeManager;
})();
