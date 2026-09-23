/**
 * LittleGame 全局音频管理（Web Audio API 实时合成，无音频资产、零依赖）
 *
 * - AudioManager.play(name)：短音效（click/flip/pop/success/error/win/lose）
 * - 背景音乐：轻快的大调五声拨弦循环（约 105 BPM，柔和低音量，无缝循环），
 *   遵守浏览器自动播放策略：首次用户手势后才启动
 * - 偏好持久化于 localStorage lg_audio_v1 = { bgm: bool, sfx: bool }，跨页面一致
 */
const AudioManager = {
    ctx: null,
    masterGain: null,
    sfxGain: null,
    bgmGain: null,
    bgmTimer: null,
    bgmNextTime: 0,
    bgmStep: 0,
    unlocked: false,
    prefs: { bgm: true, sfx: true },

    init() {
        try {
            const saved = JSON.parse(localStorage.getItem('lg_audio_v1'));
            if (saved && typeof saved === 'object') {
                this.prefs.bgm = saved.bgm !== false;
                this.prefs.sfx = saved.sfx !== false;
            }
        } catch (e) { /* 忽略损坏的偏好 */ }

        // 首次用户手势解锁音频上下文，并按偏好启动背景音乐
        const unlock = () => {
            this.unlocked = true;
            this.ensureCtx();
            if (this.prefs.bgm) this.startBgm();
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('pointerdown', unlock);
        document.addEventListener('keydown', unlock);
    },

    ensureCtx() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return this.ctx;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.9;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.3;
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.16;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2400;
        this.bgmGain.connect(lp);
        lp.connect(this.masterGain);
        return this.ctx;
    },

    savePrefs() {
        try {
            localStorage.setItem('lg_audio_v1', JSON.stringify(this.prefs));
        } catch (e) { /* 存储不可用时静默 */ }
    },

    // ---------- 音效 ----------
    play(name) {
        if (!this.prefs.sfx) return;
        const ctx = this.ensureCtx();
        if (!ctx || ctx.state !== 'running') return;
        const t = ctx.currentTime;

        const tone = (freq, start, dur, type = 'sine', vol = 1, endFreq = null) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t + start);
            if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + start + dur);
            g.gain.setValueAtTime(0, t + start);
            g.gain.linearRampToValueAtTime(vol, t + start + 0.012);
            g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(t + start);
            osc.stop(t + start + dur + 0.05);
        };

        switch (name) {
            case 'click':   // 轻点：柔和短促
                tone(660, 0, 0.06, 'triangle', 0.5);
                break;
            case 'flip':    // 翻牌：噪声气流感用两个快速滑音模拟
                tone(320, 0, 0.09, 'sine', 0.5, 640);
                break;
            case 'pop':     // 合并：弹性上滑
                tone(520, 0, 0.1, 'sine', 0.7, 780);
                break;
            case 'success': // 配对成功/答对：两音上行
                tone(659, 0, 0.1, 'triangle', 0.7);
                tone(784, 0.09, 0.14, 'triangle', 0.7);
                break;
            case 'error':   // 出错：低频闷响
                tone(180, 0, 0.16, 'sawtooth', 0.35, 120);
                break;
            case 'win':     // 胜利：四音琶音
                tone(523, 0, 0.12, 'triangle', 0.7);
                tone(659, 0.1, 0.12, 'triangle', 0.7);
                tone(784, 0.2, 0.12, 'triangle', 0.7);
                tone(1047, 0.3, 0.22, 'triangle', 0.8);
                break;
            case 'lose':    // 失败：下行三音
                tone(392, 0, 0.14, 'triangle', 0.6);
                tone(330, 0.13, 0.14, 'triangle', 0.6);
                tone(262, 0.26, 0.24, 'triangle', 0.6);
                break;
        }
    },

    // ---------- 背景音乐（C 大调五声，I-vi-IV-V，105 BPM） ----------
    // 每步 = 八分音符；4 小节 × 8 步 = 32 步一个循环，A/B 两段旋律交替
    BGM_BEAT: 60 / 105,
    BGM_BASS: ['C3', 'A2', 'F3', 'G3'],
    BGM_MELODY_A: ['E4', null, 'G4', null, 'A4', null, 'G4', 'E4',
                   'C4', null, 'E4', null, 'D4', null, 'C4', null,
                   'A3', null, 'C4', null, 'D4', null, 'E4', null,
                   'G4', null, 'E4', 'D4', 'C4', null, null, null],
    BGM_MELODY_B: ['G4', null, 'A4', null, 'C5', null, 'A4', 'G4',
                   'E4', null, 'G4', null, 'A4', 'G4', 'E4', null,
                   'F4', null, 'A4', null, 'C5', null, 'A4', null,
                   'D4', 'E4', 'G4', null, 'C4', null, null, null],
    NOTE_FREQ: {},

    buildNoteTable() {
        if (Object.keys(this.NOTE_FREQ).length) return;
        const names = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        for (const key of ['C3', 'A2', 'F3', 'G3', 'A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5']) {
            const m = key.match(/^([A-G])(\d)$/);
            if (m) this.NOTE_FREQ[key] = 440 * Math.pow(2, (names[m[1]] + (Number(m[2]) - 4) * 12 - 9) / 12);
        }
    },

    pluck(freq, time, dur, vol) {
        // 拨弦感：三角波 + 快速衰减包络
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(vol, time + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(g);
        g.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + dur + 0.1);
    },

    scheduleBgm() {
        const ctx = this.ctx;
        const stepDur = this.BGM_BEAT / 2; // 八分音符
        while (this.bgmNextTime < ctx.currentTime + 0.6) {
            const step = this.bgmStep % 32;
            const loopIndex = Math.floor(this.bgmStep / 32);
            const melody = loopIndex % 2 === 0 ? this.BGM_MELODY_A : this.BGM_MELODY_B;
            const note = melody[step];
            if (note) this.pluck(this.NOTE_FREQ[note], this.bgmNextTime, stepDur * 1.6, 0.5);
            if (step % 8 === 0) {
                // 每小节根音（低八度拨弦）
                const bass = this.BGM_BASS[Math.floor(step / 8)];
                this.pluck(this.NOTE_FREQ[bass], this.bgmNextTime, this.BGM_BEAT * 1.8, 0.35);
            }
            this.bgmNextTime += stepDur;
            this.bgmStep++;
        }
    },

    startBgm() {
        const ctx = this.ensureCtx();
        if (!ctx || ctx.state !== 'running' || this.bgmTimer) return;
        this.buildNoteTable();
        this.bgmNextTime = ctx.currentTime + 0.1;
        this.bgmStep = 0;
        this.bgmTimer = setInterval(() => this.scheduleBgm(), 250);
        this.scheduleBgm();
    },

    stopBgm() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    },

    setBgm(on) {
        this.prefs.bgm = on;
        this.savePrefs();
        if (on) {
            this.ensureCtx();
            this.startBgm();
        } else {
            this.stopBgm();
        }
        this.notifyButtons();
    },

    setSfx(on) {
        this.prefs.sfx = on;
        this.savePrefs();
        this.notifyButtons();
    },

    // 同步页面上所有音乐开关按钮的显示状态
    notifyButtons() {
        document.querySelectorAll('.lg-music-btn').forEach(btn => {
            btn.classList.toggle('lg-off', !this.prefs.bgm);
            btn.title = this.prefs.bgm ? '关闭背景音乐' : '开启背景音乐';
            btn.setAttribute('aria-label', btn.title);
            const label = btn.querySelector('.lg-music-btn-label');
            if (label) label.textContent = this.prefs.bgm ? '音乐开' : '音乐关';
        });
    }
};

AudioManager.init();
