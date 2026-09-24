/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/**
 * Fun City 壳（大厅）：hash 路由 + 常驻舞台 iframe
 *
 * - 点卡片 → location.hash = 游戏key → 舞台 iframe 加载游戏页（游戏文件零改动）
 * - 平台 BGM 在壳内播放，切游戏不断、无需重复解锁
 * - 同源接管子页：返回大厅按钮（克隆替换）、音乐按钮（控制壳 BGM）、
 *   关闭子页 BGM 防双播（声明 data-own-bgm 的游戏例外：壳静音让位）
 * - games[key].nav = true 的游戏走整页跳转（逃生门，按游戏回退）
 */
class GameLobby {
    constructor() {
        this.games = {
            schulte: { name: '舒尔特方格', path: 'schulte/index.html' },
            sudoku: { name: '数独', path: 'sudoku/index.html' },
            memory: { name: '记忆翻牌', path: 'memory/index.html' },
            2048: { name: '2048', path: '2048/index.html' },
            gomoku: { name: '五子棋', path: 'gomoku/index.html' },
            snake: { name: '贪吃蛇', path: 'snake/index.html' },
            breakout: { name: '打砖块', path: 'breakout/index.html' },
            othello: { name: '黑白棋', path: 'othello/index.html' },
            idiom: { name: '成语接龙', path: 'idiom/index.html' },
            mbti: { name: 'MBTI 人格', path: 'mbti/index.html' },
            zodiac: { name: '星座解码', path: 'zodiac/index.html' },
            calendar: { name: '万年历', path: 'calendar/index.html' },
            bazi: { name: '八字命理', path: 'bazi/index.html' },
            ziwei: { name: '紫微斗数', path: 'ziwei/index.html' },
            'daily-fortune': { name: '每日一签', path: 'daily-fortune/index.html' },
            'moon-blocks': { name: '圣杯求签', path: 'moon-blocks/index.html' }
        };
        this.stage = document.getElementById('stage');
        this.frame = document.getElementById('game-frame');
        this.frameKey = '';      // 舞台当前装载的游戏
        this.pausedForOwnBgm = false; // 让位给游戏自有 BGM 时平台音乐暂停

        this.init();
    }

    init() {
        document.querySelectorAll('.game-card:not(.coming-soon)').forEach(card => {
            card.addEventListener('click', () => this.handleGameClick(card));
        });

        this.frame.addEventListener('load', () => this.adoptFrame());
        window.addEventListener('hashchange', () => this.route());
        this.route();
    }

    handleGameClick(card) {
        const gameKey = card.dataset.game;
        const game = this.games[gameKey];
        if (!game) return;
        if (game.nav) {
            // 逃生门：该游戏改走整页跳转
            window.location.href = 'games/' + game.path;
            return;
        }
        location.hash = gameKey;
    }

    route() {
        const key = (location.hash || '').replace(/^#/, '');
        const game = this.games[key];
        if (game && !game.nav) {
            this.openGame(key, game);
        } else {
            this.showLobby();
        }
    }

    openGame(key, game) {
        if (this.frameKey !== key) {
            this.frameKey = key;
            this.frame.src = 'games/' + game.path;
        }
        this.stage.style.display = 'block';
        document.body.classList.add('in-game');
    }

    showLobby() {
        this.stage.style.display = 'none';
        document.body.classList.remove('in-game');
        if (this.frameKey) {
            // 卸载 iframe 释放内存（统一走 src 赋值，避免与下次加载产生导航竞态）
            this.frameKey = '';
            this.frame.src = 'about:blank';
        }
        // 若为游戏自有 BGM 让位过，恢复平台音乐（不改用户偏好）
        if (this.pausedForOwnBgm) {
            this.pausedForOwnBgm = false;
            if (AudioManager.prefs.bgm) AudioManager.startBgm();
        }
    }

    /** iframe 加载完成后的同源接管（游戏文件零改动） */
    adoptFrame() {
        if (!this.frameKey) return; // about:blank 卸载
        let doc, win;
        try {
            doc = this.frame.contentDocument;
            win = this.frame.contentWindow;
            if (!doc || !doc.body) return;
        } catch (e) { return; }

        // 1) 音频分工：默认关闭子页 BGM（防双播）；声明 data-own-bgm 的游戏由其自播，
        //    平台音乐让位（恢复时从上次小节续播）。
        //    注：子页 AudioManager 是 const 全局（不挂 window），跨窗口无法直接引用，
        //    需注入脚本在子页自身环境执行
        const ownBgm = doc.body.hasAttribute('data-own-bgm');
        if (ownBgm) {
            if (!this.pausedForOwnBgm && AudioManager.bgmTimer) {
                this.pausedForOwnBgm = true;
                AudioManager.stopBgm();
            }
        } else {
            this.injectFrameScript(doc, 'AudioManager.stopBgm(); AudioManager.prefs.bgm=false;');
        }

        // 2) 深链进入时，子页手势转发给壳（解锁平台 BGM）
        doc.addEventListener('pointerdown', () => {
            if (AudioManager.unlockNow) AudioManager.unlockNow();
        });

        // 3) 接管「返回大厅」：克隆替换丢弃子页原有监听 → 回壳大厅
        doc.querySelectorAll('.return-lobby-btn').forEach(btn => {
            const nb = btn.cloneNode(true);
            nb.addEventListener('click', (e) => {
                e.preventDefault();
                location.hash = '';
            });
            btn.parentNode.replaceChild(nb, btn);
        });

        // 3.5) 同步主题到 iframe
        try {
            doc.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'violet');
        } catch (e) { /* 忽略 */ }

        // 4) 接管音乐按钮 → 控制壳 BGM（UI 双向同步）
        doc.querySelectorAll('.lg-music-btn').forEach(btn => {
            const nb = btn.cloneNode(true);
            nb.addEventListener('click', (e) => {
                e.preventDefault();
                AudioManager.setBgm(!AudioManager.prefs.bgm);
                this.syncFrameMusic();
            });
            btn.parentNode.replaceChild(nb, btn);
        });
        this.syncFrameMusic();

        // 5) 键盘游戏（2048 方向键等）需要焦点
        try { this.frame.focus(); } catch (e) { /* 忽略 */ }
    }

    /** 向子页注入脚本（在其自身环境执行，可访问其 const 全局） */
    injectFrameScript(doc, code) {
        try {
            const s = doc.createElement('script');
            s.textContent = code;
            doc.documentElement.appendChild(s);
            s.remove();
        } catch (e) { /* 忽略 */ }
    }

    /** 同步子页音乐按钮显示（与壳偏好一致） */
    syncFrameMusic() {
        let doc;
        try { doc = this.frame.contentDocument; } catch (e) { return; }
        if (!doc) return;
        doc.querySelectorAll('.lg-music-btn').forEach(btn => {
            btn.classList.toggle('lg-off', !AudioManager.prefs.bgm);
            btn.title = AudioManager.prefs.bgm ? '关闭背景音乐' : '开启背景音乐';
            const label = btn.querySelector('.lg-music-btn-label');
            if (label) label.textContent = AudioManager.prefs.bgm ? '音乐开' : '音乐关';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameLobby();
});

/* FHDCC 控制台签名 */
console.log('%cFHDCC Fun City %c© 2026 FHDCC · All Rights Reserved', 'font-weight:bold;color:#7c5cff;font-size:14px', 'color:#888');
