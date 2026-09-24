/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/**
 * Fun City 功能层：本地排行榜 + 成就系统 + 共享 UI（依赖 player.js / audio.js）
 *
 * - LG.Records.add({game, mode, value, extra})   上报一条成绩（自动归属当前玩家）
 * - LG.History.add(tool, {summary, detail, ms})  追加一条测试/命理历史记录（按玩家归属）
 * - LG.Achievements.report(event, data)          上报游戏事件，驱动成就与累计统计
 * - UI 自动装配：
 *   · 所有页面 header 注入 🎵 音乐开关
 *   · 游戏页（<body data-game="xxx">）header 注入 🏆 本游戏排行榜入口
 *   · 大厅页（<body data-lobby>）渲染 👤玩家 / 🏆排行榜 / 🏅成就 工具栏与弹窗
 */
(function () {
    'use strict';

    // ---------- 排行榜 ----------
    const LB_META = {
        schulte: {
            name: '舒尔特方格',
            boards: [
                { mode: 'classic_5', label: '经典 5×5', unit: 'time' },
                ...[3, 4, 5, 6, 7, 8, 9].map(n => ({ mode: `standard_${n}`, label: `标准 ${n}×${n}`, unit: 'time' })),
                { mode: 'poetry', label: '唐诗300首', unit: 'time', extraLabel: '诗目' }
            ]
        },
        sudoku: {
            name: '数独',
            boards: [
                { mode: 'easy', label: '简单', unit: 'time' },
                { mode: 'medium', label: '中等', unit: 'time' },
                { mode: 'hard', label: '困难', unit: 'time' },
                { mode: 'expert', label: '专家', unit: 'time' }
            ]
        },
        memory: {
            name: '记忆翻牌',
            boards: [
                { mode: 'easy', label: '简单（6对）', unit: 'time', tiebreak: 'moves' },
                { mode: 'medium', label: '中等（8对）', unit: 'time', tiebreak: 'moves' },
                { mode: 'hard', label: '困难（12对）', unit: 'time', tiebreak: 'moves' }
            ]
        },
        2048: {
            name: '2048',
            boards: [{ mode: 'score', label: '最高分', unit: 'score' }]
        },
        gomoku: {
            name: '五子棋',
            boards: [
                { mode: 'fastest_caiji', label: '菜鸡·最快获胜', unit: 'time' },
                { mode: 'fastest_std', label: '标准·最快获胜', unit: 'time' },
                { mode: 'fastest_expert', label: '专家·最快获胜', unit: 'time' },
                { mode: 'fastest_master', label: '大师·最快获胜', unit: 'time' },
                { mode: 'fastest_chovy', label: '我Chovy·最快获胜', unit: 'time' },
                { mode: 'fastest_god', label: '超级大神·最快获胜', unit: 'time' }
            ]
        }
    };

    const Records = {
        KEY: 'lg_records_v1',
        MAX: 10,

        readAll() {
            try {
                const data = JSON.parse(localStorage.getItem(this.KEY));
                if (data && typeof data === 'object') return data;
            } catch (e) { /* 损坏重建 */ }
            return {};
        },

        writeAll(data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },

        add({ game, mode, value, extra }) {
            if (!game || !mode || !Number.isFinite(value)) return null;
            const meta = LB_META[game] && LB_META[game].boards.find(b => b.mode === mode);
            if (!meta) return null;
            const playerId = Player.currentId();
            if (!playerId) return null;

            const all = this.readAll();
            if (!all[playerId]) all[playerId] = {};
            if (!all[playerId][game]) all[playerId][game] = {};
            const board = all[playerId][game];
            if (!Array.isArray(board[mode])) board[mode] = [];

            const entry = {
                v: Math.round(value),
                extra: typeof extra === 'string' ? extra.slice(0, 24) : undefined,
                moves: extra && typeof extra === 'object' && Number.isFinite(extra.moves) ? extra.moves : undefined,
                date: new Date().toISOString().slice(0, 10)
            };
            board[mode].push(entry);

            const asc = meta.unit !== 'score';
            board[mode].sort((a, b) => {
                if (asc ? a.v - b.v : b.v - a.v) return asc ? a.v - b.v : b.v - a.v;
                if (meta.tiebreak === 'moves' && a.moves !== b.moves) return (a.moves || 0) - (b.moves || 0);
                return 0;
            });
            board[mode] = board[mode].slice(0, this.MAX);

            this.writeAll(all);
            return entry;
        },

        top(game, mode, playerId) {
            const id = playerId || Player.currentId();
            const all = this.readAll();
            const board = all[id] && all[id][game] && all[id][game][mode];
            return Array.isArray(board) ? board : [];
        }
    };

    // ---------- 测试/命理历史记录（追加式日志，区别于 Top10 榜单） ----------
    const History = {
        KEY: 'lg_history_v1',
        MAX: 50,

        readAll() {
            try {
                const data = JSON.parse(localStorage.getItem(this.KEY));
                if (data && typeof data === 'object') return data;
            } catch (e) { /* 损坏重建 */ }
            return {};
        },

        writeAll(data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },

        // tool: 'mbti' | 'zodiac' | 'bazi' | 'ziwei'；entry: { summary, detail?, ms? }
        add(tool, entry) {
            const id = Player.currentId();
            if (!id || !tool || !entry || !entry.summary) return null;
            const all = this.readAll();
            const mine = all[id] = all[id] || {};
            const list = mine[tool] = mine[tool] || [];
            const record = {
                t: Date.now(),
                ms: Number.isFinite(entry.ms) ? Math.round(entry.ms) : null,
                summary: String(entry.summary).slice(0, 40),
                detail: entry.detail == null ? undefined : String(entry.detail).slice(0, 120)
            };
            list.push(record);
            if (list.length > this.MAX) list.splice(0, list.length - this.MAX);
            this.writeAll(all);
            return record;
        },

        // 某工具历史（新→旧）；playerId 缺省取当前玩家
        list(tool, playerId) {
            const id = playerId || Player.currentId();
            if (!id) return [];
            const mine = this.readAll()[id];
            const list = (mine && mine[tool]) || [];
            return list.slice().sort((a, b) => b.t - a.t);
        },

        clear(tool) {
            const id = Player.currentId();
            if (!id) return;
            const all = this.readAll();
            if (all[id]) {
                delete all[id][tool];
                this.writeAll(all);
            }
        }
    };

    // 测试·命理工具（历史记录归属榜单弹窗「测试·命理」区）
    const TEST_TOOLS = [
        { tool: 'mbti', name: '🧭 MBTI 人格' },
        { tool: 'zodiac', name: '✨ 星座解码' },
        { tool: 'bazi', name: '📜 八字命理' },
        { tool: 'ziwei', name: '🌌 紫微斗数' }
    ];

    // ---------- 成就 ----------
    const ACHIEVEMENTS = [
        { id: 'schulte_first', icon: '🎯', name: '初露锋芒', desc: '舒尔特方格：完成任意模式一局', check: s => s.schulte && s.schulte.wins >= 1 },
        { id: 'schulte_classic_25', icon: '⚡', name: '眼疾手快', desc: '经典 5×5 用时低于 25 秒', check: s => s.schulte && s.schulte.bestClassic != null && s.schulte.bestClassic < 25000 },
        { id: 'schulte_standard_9', icon: '🧠', name: '方格大师', desc: '通过标准 9×9', check: s => !!(s.schulte && s.schulte.standard9) },
        { id: 'poem_10', icon: '📜', name: '初读唐诗', desc: '完成 10 首唐诗', progress: s => [Math.min((s.schulte && s.schulte.poems ? s.schulte.poems.length : 0), 10), 10], check: s => s.schulte && s.schulte.poems && s.schulte.poems.length >= 10 },
        { id: 'poem_50', icon: '📚', name: '熟读唐诗', desc: '完成 50 首唐诗', progress: s => [Math.min((s.schulte && s.schulte.poems ? s.schulte.poems.length : 0), 50), 50], check: s => s.schulte && s.schulte.poems && s.schulte.poems.length >= 50 },
        { id: 'poem_all', icon: '🏆', name: '唐诗三百首', desc: `完成全部唐诗（共 ${window.LG_POEM_COUNT || 300} 首）`, progress: s => [Math.min((s.schulte && s.schulte.poems ? s.schulte.poems.length : 0), window.LG_POEM_COUNT || 300), window.LG_POEM_COUNT || 300], check: s => s.schulte && s.schulte.poems && s.schulte.poems.length >= (window.LG_POEM_COUNT || 300) },
        { id: 'sudoku_first', icon: '🔢', name: '数独新手', desc: '数独：完成任意难度一局', check: s => s.sudoku && s.sudoku.wins >= 1 },
        { id: 'sudoku_hard', icon: '💪', name: '迎难而上', desc: '完成困难数独', check: s => !!(s.sudoku && s.sudoku.hard) },
        { id: 'sudoku_expert', icon: '👑', name: '专家之路', desc: '完成专家数独', check: s => !!(s.sudoku && s.sudoku.expert) },
        { id: 'sudoku_all4', icon: '🎖️', name: '四境皆通', desc: '四种难度的数独各完成一次', check: s => !!(s.sudoku && s.sudoku.easy && s.sudoku.medium && s.sudoku.hard && s.sudoku.expert) },
        { id: 'sudoku_nohint', icon: '🧩', name: '无师自通', desc: '不使用提示完成一局数独', check: s => !!(s.sudoku && s.sudoku.noHintWin) },
        { id: 'memory_first', icon: '🃏', name: '过目不忘', desc: '记忆翻牌：完成任意难度一局', check: s => s.memory && s.memory.wins >= 1 },
        { id: 'memory_hard', icon: '🂠', name: '记忆大师', desc: '完成困难（12 对）记忆翻牌', check: s => !!(s.memory && s.memory.hard) },
        { id: 't512', icon: '🧮', name: '小试身手', desc: '2048：合成 512', check: s => (s.g2048 && s.g2048.maxTile || 0) >= 512 },
        { id: 't1024', icon: '📈', name: '节节高升', desc: '2048：合成 1024', check: s => (s.g2048 && s.g2048.maxTile || 0) >= 1024 },
        { id: 't2048', icon: '🌟', name: '2048 达成', desc: '2048：合成 2048！', check: s => (s.g2048 && s.g2048.maxTile || 0) >= 2048 },
        { id: 'gomoku_first_ai', icon: '⚫', name: '首胜AI', desc: '五子棋人机模式战胜 AI', check: s => s.gomoku && s.gomoku.winsAI >= 1 },
        { id: 'gomoku_fast', icon: '⏱️', name: '速战速决', desc: '60 秒内人机获胜', check: s => s.gomoku && s.gomoku.bestWin != null && s.gomoku.bestWin < 60000 },
        { id: 'gomoku_master', icon: '🎓', name: '大师克星', desc: '战胜大师档机器人', check: s => !!(s.gomoku && s.gomoku.beat_master) },
        { id: 'gomoku_chovy', icon: '🏆', name: '我Chovy克星', desc: '战胜"我Chovy"档机器人', check: s => !!(s.gomoku && s.gomoku.beat_chovy) },
        { id: 'gomoku_god', icon: '🌟', name: '超级大神克星', desc: '战胜超级大神档机器人', check: s => !!(s.gomoku && s.gomoku.beat_god) },
        { id: 'plays_10', icon: '🎮', name: '小有所成', desc: '累计完成 10 局游戏', progress: s => [Math.min(s.plays || 0, 10), 10], check: s => (s.plays || 0) >= 10 },
        { id: 'plays_50', icon: '🎯', name: '游戏达人', desc: '累计完成 50 局游戏', progress: s => [Math.min(s.plays || 0, 50), 50], check: s => (s.plays || 0) >= 50 },
        { id: 'all_games', icon: '🥇', name: '五项全能', desc: '四种游戏各获一胜，且 2048 合成过 512', check: s => !!(s.schulte && s.schulte.wins && s.sudoku && s.sudoku.wins && s.memory && s.memory.wins && s.gomoku && s.gomoku.winsAI && s.g2048 && s.g2048.maxTile >= 512) },
        { id: 'mbti_first', icon: '🧭', name: '认识自己', desc: '完成一次 MBTI 测试', check: s => (s.tests && s.tests.mbti || 0) >= 1 },
        { id: 'zodiac_first', icon: '✨', name: '仰望星空', desc: '完成一次星座解码', check: s => (s.tests && s.tests.zodiac || 0) >= 1 },
        { id: 'bazi_first', icon: '📜', name: '初窥天机', desc: '完成一次八字排盘', check: s => (s.tests && s.tests.bazi || 0) >= 1 },
        { id: 'ziwei_first', icon: '🌌', name: '紫微初探', desc: '完成一次紫微排盘', check: s => (s.tests && s.tests.ziwei || 0) >= 1 }
    ];

    const Achievements = {
        KEY_STATS: 'lg_stats_v1',
        KEY_UNLOCKED: 'lg_achievements_v1',

        readStats() {
            const id = Player.currentId();
            try {
                const all = JSON.parse(localStorage.getItem(this.KEY_STATS));
                if (all && all[id]) return all[id];
            } catch (e) { /* 忽略 */ }
            return {};
        },

        writeStats(stats) {
            const id = Player.currentId();
            if (!id) return;
            let all = {};
            try { all = JSON.parse(localStorage.getItem(this.KEY_STATS)) || {}; } catch (e) { all = {}; }
            all[id] = stats;
            localStorage.setItem(this.KEY_STATS, JSON.stringify(all));
        },

        readUnlocked() {
            const id = Player.currentId();
            try {
                const all = JSON.parse(localStorage.getItem(this.KEY_UNLOCKED));
                if (all && all[id] && typeof all[id] === 'object') return all[id];
            } catch (e) { /* 忽略 */ }
            return {};
        },

        unlockAllFor(map) {
            const id = Player.currentId();
            if (!id) return;
            let all = {};
            try { all = JSON.parse(localStorage.getItem(this.KEY_UNLOCKED)) || {}; } catch (e) { all = {}; }
            all[id] = map;
            localStorage.setItem(this.KEY_UNLOCKED, JSON.stringify(all));
        },

        // 事件入口：更新累计统计并检查全部成就，新成就弹 toast
        report(event, data = {}) {
            if (!Player.currentId()) return;
            const stats = this.readStats();
            stats.plays = stats.plays || 0;

            const touch = (key) => { stats[key] = stats[key] || {}; return stats[key]; };

            switch (event) {
                case 'schulte_win': {
                    const s = touch('schulte');
                    s.wins = (s.wins || 0) + 1;
                    stats.plays++;
                    if (data.mode === 'classic') s.bestClassic = s.bestClassic == null ? data.ms : Math.min(s.bestClassic, data.ms);
                    if (data.mode === 'standard' && data.gridSize >= 9) s.standard9 = true;
                    if (data.mode === 'poetry') {
                        s.poems = s.poems || [];
                        if (data.poemId && !s.poems.includes(data.poemId)) s.poems.push(data.poemId);
                    }
                    break;
                }
                case 'sudoku_win': {
                    const s = touch('sudoku');
                    s.wins = (s.wins || 0) + 1;
                    stats.plays++;
                    s[data.difficulty] = true;
                    if (!data.hints) s.noHintWin = true;
                    break;
                }
                case 'sudoku_lose':
                    stats.plays++;
                    break;
                case 'memory_win': {
                    const s = touch('memory');
                    s.wins = (s.wins || 0) + 1;
                    stats.plays++;
                    s[data.level] = true;
                    break;
                }
                case '2048_merge': {
                    // 合成里程碑（512/1024/2048）：即时驱动成就，不计局数
                    const s = touch('g2048');
                    s.maxTile = Math.max(s.maxTile || 0, data.tile || 0);
                    break;
                }
                case '2048_over': {
                    const s = touch('g2048');
                    stats.plays++;
                    s.maxTile = Math.max(s.maxTile || 0, data.maxTile || 0);
                    break;
                }
                case 'gomoku_win': {
                    const s = touch('gomoku');
                    stats.plays++;
                    if (data.vsAI) {
                        s.winsAI = (s.winsAI || 0) + 1;
                        s.bestWin = s.bestWin == null ? data.ms : Math.min(s.bestWin, data.ms);
                        // 记录战胜过的档位（大师/我Chovy/超级大神 成就用）
                        if (data.level) s['beat_' + data.level] = true;
                    }
                    break;
                }
                case 'gomoku_lose':
                    stats.plays++;
                    break;
                case 'test_done': {
                    // 测试/命理完成事件：data.tool = mbti|zodiac|bazi|ziwei（不计入游戏局数）
                    if (!data.tool) break;
                    const s = touch('tests');
                    s[data.tool] = (s[data.tool] || 0) + 1;
                    break;
                }
            }

            this.writeStats(stats);

            const unlocked = this.readUnlocked();
            let changed = false;
            for (const ach of ACHIEVEMENTS) {
                if (!unlocked[ach.id] && ach.check(stats)) {
                    unlocked[ach.id] = new Date().toISOString();
                    changed = true;
                    UI.toast(`${ach.icon} 成就解锁：${ach.name}`, 'achievement');
                }
            }
            if (changed) this.unlockAllFor(unlocked);
        },

        progressOf(ach) {
            const stats = this.readStats();
            if (ach.progress) {
                const [cur, total] = ach.progress(stats);
                return { cur, total };
            }
            return null;
        }
    };

    // ---------- 共享 UI ----------
    const UI = {
        toastQueue: [],
        toastShowing: false,

        toast(text, type = 'info') {
            this.toastQueue.push({ text, type });
            this.nextToast();
        },

        nextToast() {
            if (this.toastShowing || !this.toastQueue.length) return;
            this.toastShowing = true;
            const { text, type } = this.toastQueue.shift();
            const el = document.createElement('div');
            el.className = `lg-toast ${type === 'achievement' ? 'lg-toast-achievement' : ''}`;
            el.textContent = text;
            document.body.appendChild(el);
            requestAnimationFrame(() => el.classList.add('lg-show'));
            setTimeout(() => {
                el.classList.remove('lg-show');
                setTimeout(() => {
                    el.remove();
                    this.toastShowing = false;
                    this.nextToast();
                }, 350);
            }, 3200);
        },

        // 游戏页 header 操作区：🎵音乐 / 🏆本游戏榜单（测试工具为📜记录）/ 返回大厅，集中一行放在标题下方
        injectGameHeaderActions(header, gameKey) {
            if (!header || header.querySelector('.lg-header-actions')) return;
            const actions = document.createElement('div');
            actions.className = 'lg-header-actions';

            const musicBtn = document.createElement('button');
            musicBtn.className = 'lg-music-btn ghost-btn';
            musicBtn.type = 'button';
            musicBtn.innerHTML = '<span class="lg-music-icon">🎵</span><span class="lg-music-btn-label">音乐开</span>';
            musicBtn.addEventListener('click', () => {
                AudioManager.setBgm(!AudioManager.prefs.bgm);
            });
            actions.appendChild(musicBtn);

            // 游戏页注入本游戏榜单；仅为有榜单体系的游戏注入
            // （测试工具页自带历史记录页；万年历无排行榜体系，均不注入）
            if (gameKey && LB_META[gameKey]) {
                const lbBtn = document.createElement('button');
                lbBtn.className = 'lg-lb-btn ghost-btn';
                lbBtn.type = 'button';
                lbBtn.title = '本游戏排行榜';
                lbBtn.innerHTML = '<span>🏆</span><span>榜单</span>';
                lbBtn.addEventListener('click', () => this.openLeaderboard(gameKey));
                actions.appendChild(lbBtn);
            }

            // 把原"返回大厅"按钮（仅 header 内的）一并收进操作区；事件监听随节点移动保留
            const lobbyBtn = header.querySelector(':scope > .return-lobby-btn');
            if (lobbyBtn) actions.appendChild(lobbyBtn);

            header.appendChild(actions);
            AudioManager.notifyButtons();
        },

        // ---------- 排行榜弹窗 ----------
        openLeaderboard(focusGame) {
            const isTestTool = TEST_TOOLS.some(t => t.tool === focusGame);
            // 展示顺序显式声明（避免 JS 对象把数字键"2048"排到最前）
            const order = ['schulte', 'sudoku', 'memory', '2048', 'gomoku'];
            const games = focusGame ? [focusGame] : order;
            const meta = focusGame ? { [focusGame]: LB_META[focusGame] } : LB_META;
            const player = Player.current();
            const wrap = document.createElement('div');
            wrap.className = 'lg-modal';
            wrap.innerHTML = `
                <div class="lg-modal-content">
                    <div class="lg-modal-head">
                        <h2>${isTestTool ? '📜 测算记录' : '🏆 排行榜'}</h2>
                        <button class="lg-close-btn" aria-label="关闭">✕</button>
                    </div>
                    <p class="lg-modal-sub">当前玩家：<b>${player ? player.name : '--'}</b> · 记录保存在本机浏览器</p>
                    <div class="lg-boards"></div>
                </div>`;
            document.body.appendChild(wrap);
            wrap.querySelector('.lg-close-btn').addEventListener('click', () => wrap.remove());
            wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });

            const boardsEl = wrap.querySelector('.lg-boards');
            for (const gameKey of games) {
                const gameMeta = meta[gameKey];
                if (!gameMeta) continue; // 测试工具无游戏榜单，走下方「测试·命理」区
                const gameSection = document.createElement('div');
                gameSection.className = 'lg-game-section';
                gameSection.innerHTML = `<h3>${gameMeta.name}</h3>`;
                const boards = document.createElement('div');
                boards.className = 'lg-board-list';
                for (const b of gameMeta.boards) {
                    const rows = Records.top(gameKey, b.mode);
                    const table = document.createElement('div');
                    table.className = 'lg-board';
                    let html = `<div class="lg-board-title">${b.label}${rows.length ? '' : ''}</div>`;
                    if (!rows.length) {
                        html += '<div class="lg-board-empty">暂无记录</div>';
                    } else {
                        html += '<table><tbody>' + rows.map((r, i) => {
                            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                            const val = b.unit === 'score'
                                ? r.v.toLocaleString()
                                : GameUtils.formatTime(r.v) + ' 秒' + (b.tiebreak === 'moves' && r.moves != null ? ` · ${r.moves}步` : '');
                            const extra = r.extra && b.extraLabel ? `<span class="lg-extra">${r.extra}</span>` : '';
                            return `<tr><td class="lg-rank">${medal}</td><td class="lg-val">${val}${extra}</td><td class="lg-date">${r.date || ''}</td></tr>`;
                        }).join('') + '</tbody></table>';
                    }
                    table.innerHTML = html;
                    boards.appendChild(table);
                }
                gameSection.appendChild(boards);
                boardsEl.appendChild(gameSection);
            }

            // ---------- 测试·命理：每次测算都入榜（追加式，非 Top10） ----------
            // 大厅显示全部；测试工具页只看自己；游戏页聚焦本游戏时不掺测试记录
            const showTests = !focusGame || isTestTool;
            const tools = isTestTool ? TEST_TOOLS.filter(t => t.tool === focusGame) : TEST_TOOLS;
            const testSection = document.createElement('div');
            testSection.className = 'lg-game-section';
            testSection.innerHTML = `<h3>${isTestTool ? TEST_TOOLS.find(t => t.tool === focusGame).name : '测试 · 命理'}</h3>`;
            const testBoard = document.createElement('div');
            testBoard.className = 'lg-board';
            let testHtml = '';
            for (const t of tools) {
                const rows = History.list(t.tool);
                testHtml += `<div class="lg-board-title">${t.name}${rows.length ? ` · 共 ${rows.length} 次` : ''}</div>`;
                if (!rows.length) {
                    testHtml += '<div class="lg-board-empty">暂无测算记录</div>';
                } else {
                    testHtml += '<table><tbody>' + rows.map(r => {
                        const dt = new Date(r.t);
                        const p2 = n => String(n).padStart(2, '0');
                        const ts = `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
                        const dur = r.ms != null ? GameUtils.formatTime(r.ms) + ' 秒' : '';
                        const extra = r.detail ? `<span class="lg-extra">${r.detail}</span>` : '';
                        return `<tr><td class="lg-val">${r.summary}${extra}</td><td class="lg-date">${ts}${dur ? ' · ' + dur : ''}</td></tr>`;
                    }).join('') + '</tbody></table>';
                }
            }
            testBoard.innerHTML = testHtml;
            if (showTests) {
                testSection.appendChild(testBoard);
                boardsEl.appendChild(testSection);
            }
        },

        // ---------- 成就弹窗 ----------
        openAchievements() {
            const player = Player.current();
            const unlocked = Achievements.readUnlocked();
            const wrap = document.createElement('div');
            wrap.className = 'lg-modal';
            const count = ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
            wrap.innerHTML = `
                <div class="lg-modal-content">
                    <div class="lg-modal-head">
                        <h2>🏅 成就 <span class="lg-ach-count">${count}/${ACHIEVEMENTS.length}</span></h2>
                        <button class="lg-close-btn" aria-label="关闭">✕</button>
                    </div>
                    <p class="lg-modal-sub">当前玩家：<b>${player ? player.name : '--'}</b></p>
                    <div class="lg-ach-list">
                        ${ACHIEVEMENTS.map(a => {
                            const got = unlocked[a.id];
                            const prog = !got && a.progress ? Achievements.progressOf(a) : null;
                            const progHtml = prog ? `<div class="lg-ach-prog"><i style="width:${Math.round(prog.cur / prog.total * 100)}%"></i></div><span class="lg-ach-prog-text">${prog.cur}/${prog.total}</span>` : '';
                            return `<div class="lg-ach ${got ? 'lg-ach-got' : ''}">
                                <span class="lg-ach-icon">${got ? a.icon : '🔒'}</span>
                                <div class="lg-ach-body">
                                    <div class="lg-ach-name">${a.name}${got ? '<span class="lg-ach-date">' + String(unlocked[a.id]).slice(0, 10) + '</span>' : ''}</div>
                                    <div class="lg-ach-desc">${a.desc}</div>
                                    ${progHtml}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            document.body.appendChild(wrap);
            wrap.querySelector('.lg-close-btn').addEventListener('click', () => wrap.remove());
            wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
        },

        // ---------- 玩家面板（大厅） ----------
        openPlayerPanel(refresh) {
            const wrap = document.createElement('div');
            wrap.className = 'lg-modal';
            wrap.innerHTML = `
                <div class="lg-modal-content">
                    <div class="lg-modal-head">
                        <h2>👤 玩家档案</h2>
                        <button class="lg-close-btn" aria-label="关闭">✕</button>
                    </div>
                    <div class="lg-player-list"></div>
                    <div class="lg-player-new">
                        <input type="text" maxlength="12" placeholder="新玩家昵称（最多12字）">
                        <button class="btn">新建档案</button>
                    </div>
                    <p class="lg-modal-sub">档案与记录保存在本机浏览器，更换设备不会同步。</p>
                </div>`;
            document.body.appendChild(wrap);
            wrap.querySelector('.lg-close-btn').addEventListener('click', () => wrap.remove());
            wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });

            const listEl = wrap.querySelector('.lg-player-list');
            const renderList = () => {
                const list = Player.readList();
                const currentId = Player.currentId();
                listEl.innerHTML = '';
                list.forEach(p => {
                    const row = document.createElement('div');
                    row.className = 'lg-player-row' + (p.id === currentId ? ' lg-current' : '');
                    row.innerHTML = `
                        <span class="lg-player-name">${p.name}${p.id === currentId ? '<em>（当前）</em>' : ''}</span>
                        <span class="lg-player-actions">
                            ${p.id !== currentId ? '<button class="ghost-btn lg-player-switch">切换</button>' : ''}
                            <button class="ghost-btn lg-player-rename">改名</button>
                            <button class="ghost-btn lg-player-delete">删除</button>
                        </span>`;
                    row.querySelector('.lg-player-switch') && row.querySelector('.lg-player-switch').addEventListener('click', () => {
                        Player.switchTo(p.id);
                        renderList();
                        refresh && refresh();
                    });
                    row.querySelector('.lg-player-rename').addEventListener('click', () => {
                        const name = prompt('新的昵称：', p.name);
                        if (!name) return;
                        const r = Player.rename(p.id, name);
                        if (!r.ok) { alert(r.msg); return; }
                        renderList();
                        refresh && refresh();
                    });
                    row.querySelector('.lg-player-delete').addEventListener('click', () => {
                        const r = Player.remove(p.id);
                        if (!r.ok) { alert(r.msg); return; }
                        renderList();
                        refresh && refresh();
                    });
                    listEl.appendChild(row);
                });
            };
            renderList();

            const input = wrap.querySelector('.lg-player-new input');
            const createBtn = wrap.querySelector('.lg-player-new button');
            const doCreate = () => {
                const r = Player.create(input.value);
                if (!r.ok) { alert(r.msg); return; }
                input.value = '';
                renderList();
                refresh && refresh();
            };
            createBtn.addEventListener('click', doCreate);
            input.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });
        },

        // ---------- 大厅工具栏 ----------
        buildLobbyToolbar() {
            const header = document.querySelector('.lobby-container header.header, .header');
            if (!header || document.querySelector('.lg-toolbar')) return;
            const current = Player.current();
            const bar = document.createElement('div');
            bar.className = 'lg-toolbar';
            bar.innerHTML = `
                <button class="lg-tool-btn lg-tool-player" title="玩家档案"><span>👤</span><b>${current ? current.name : '玩家1'}</b></button>
                <button class="lg-tool-btn" title="排行榜"><span>🏆</span><b>排行榜</b></button>
                <button class="lg-tool-btn" title="成就"><span>🏅</span><b>成就</b></button>
                <button class="lg-tool-btn lg-music-btn" type="button" title="背景音乐"><span class="lg-music-icon">🎵</span><b class="lg-music-btn-label">音乐开</b></button>`;
            const [playerBtn, lbBtn, achBtn, musicBtn] = bar.querySelectorAll('.lg-tool-btn');
            const refreshLobby = () => {
                const p = Player.current();
                playerBtn.querySelector('b').textContent = p ? p.name : '玩家1';
            };
            playerBtn.addEventListener('click', () => this.openPlayerPanel(refreshLobby));
            lbBtn.addEventListener('click', () => this.openLeaderboard());
            achBtn.addEventListener('click', () => this.openAchievements());
            musicBtn.addEventListener('click', () => {
                AudioManager.setBgm(!AudioManager.prefs.bgm);
            });
            header.appendChild(bar);
            AudioManager.notifyButtons();
        },

    };

    // ---------- 启动装配 ----------
    document.addEventListener('DOMContentLoaded', () => {
        Player.ensureDefault();

        // 一次性迁移：五子棋旧榜单 fastest_win → fastest_std（按档位拆分后）
        try {
            if (!localStorage.getItem('lg_gomoku_lb_migrated')) {
                const all = JSON.parse(localStorage.getItem('lg_records_v1') || '{}');
                for (const pid of Object.keys(all)) {
                    const g = all[pid] && all[pid].gomoku;
                    if (g && Array.isArray(g.fastest_win) && g.fastest_win.length) {
                        const tgt = Array.isArray(g.fastest_std) ? g.fastest_std.slice() : [];
                        g.fastest_win.forEach(e => {
                            if (!tgt.some(t => t.v === e.v && t.date === e.date)) tgt.push(e);
                        });
                        tgt.sort((a, b) => a.v - b.v);
                        g.fastest_std = tgt.slice(0, 10);
                        delete g.fastest_win;
                    }
                }
                localStorage.setItem('lg_records_v1', JSON.stringify(all));
                localStorage.setItem('lg_gomoku_lb_migrated', '1');
            }
        } catch (e) { /* 迁移失败不影响运行 */ }

        const header = document.querySelector('header.header');
        const isLobby = document.body.hasAttribute('data-lobby');

        // 大厅的音乐开关集成在工具栏里；游戏页注入独立操作区
        if (!isLobby) {
            UI.injectGameHeaderActions(header, document.body.getAttribute('data-game'));
        }
        if (isLobby) {
            UI.buildLobbyToolbar();
        }
    });

    // 暴露全局接口（游戏脚本调用）
    window.LG = { Records, History, Achievements, UI, Player, meta: LB_META };
})();
