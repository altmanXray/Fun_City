/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* Fun City 共享工具：统一「时间显示」与「最佳记录」存取
   在各游戏 script.js 之前引入。 */
const GameUtils = {
    // 统一时间格式：秒 + 厘秒，如 "12.34"（不含单位，单位在模板里加「秒」）
    formatTime(ms) {
        return (Math.max(0, Number(ms) || 0) / 1000).toFixed(2);
    },

    // 带单位的时间文本，如 "12.34 秒"；空记录显示 "--"
    formatTimeText(ms) {
        return ms == null ? '--' : `${this.formatTime(ms)} 秒`;
    },

    // 时间类最佳记录（毫秒，越小越好）
    loadBestTime(key) {
        const v = Number(localStorage.getItem(key));
        return Number.isFinite(v) && v > 0 ? v : null;
    },

    // 写入并比较：返回 { isRecord, best, previous }
    saveBestTime(key, ms) {
        const prev = this.loadBestTime(key);
        if (prev === null || ms < prev) {
            localStorage.setItem(key, String(ms));
            return { isRecord: true, best: ms, previous: prev };
        }
        return { isRecord: false, best: prev, previous: prev };
    }
};

/* 统一计时器：开始后按固定频率刷新，显示为「秒.厘秒」。
   用法：const t = new GameTimer(displayEl); t.start(); ... t.stop(); t.elapsed() */
class GameTimer {
    constructor(displayEl) {
        this.displayEl = displayEl;
        this.startTime = null;
        this.handle = null;
    }

    reset() {
        this.stop();
        this.startTime = null;
        if (this.displayEl) this.displayEl.textContent = '0.00';
    }

    start() {
        this.stop();
        this.startTime = Date.now();
        this.render();
        this.handle = setInterval(() => this.render(), 50);
    }

    stop() {
        if (this.handle) {
            clearInterval(this.handle);
            this.handle = null;
        }
    }

    elapsed() {
        return this.startTime === null ? 0 : Date.now() - this.startTime;
    }

    render() {
        if (this.displayEl) this.displayEl.textContent = GameUtils.formatTime(this.elapsed());
    }
}
