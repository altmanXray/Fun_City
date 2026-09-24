/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/**
 * Fun City 本地玩家档案（纯前端，数据存于本机浏览器 LocalStorage）
 *
 * - 首次访问自动创建默认档案"玩家1"
 * - 支持同设备多个档案：切换 / 新建 / 改名 / 删除（删除档案会清空其排行榜与成就）
 * - 排行榜、成就、累计统计均按档案归属
 */
const Player = {
    KEY_LIST: 'lg_players',
    KEY_CURRENT: 'lg_current_player',

    readList() {
        try {
            const list = JSON.parse(localStorage.getItem(this.KEY_LIST));
            if (Array.isArray(list)) {
                return list.filter(p => p && p.id && p.name);
            }
        } catch (e) { /* 损坏则重建 */ }
        return [];
    },

    writeList(list) {
        localStorage.setItem(this.KEY_LIST, JSON.stringify(list));
    },

    currentId() {
        const id = localStorage.getItem(this.KEY_CURRENT);
        const list = this.readList();
        return list.some(p => p.id === id) ? id : (list[0] ? list[0].id : null);
    },

    current() {
        const id = this.currentId();
        return this.readList().find(p => p.id === id) || null;
    },

    ensureDefault() {
        let list = this.readList();
        if (!list.length) {
            const player = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: '玩家1', createdAt: new Date().toISOString() };
            list = [player];
            this.writeList(list);
        }
        if (!localStorage.getItem(this.KEY_CURRENT) || !list.some(p => p.id === localStorage.getItem(this.KEY_CURRENT))) {
            localStorage.setItem(this.KEY_CURRENT, list[0].id);
        }
        return this.current();
    },

    create(name) {
        const trimmed = String(name || '').trim() || `玩家${this.readList().length + 1}`;
        if (trimmed.length > 12) return { ok: false, msg: '昵称最多 12 个字符' };
        const player = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: trimmed, createdAt: new Date().toISOString() };
        const list = this.readList();
        list.push(player);
        this.writeList(list);
        return { ok: true, player };
    },

    rename(id, name) {
        const trimmed = String(name || '').trim();
        if (!trimmed) return { ok: false, msg: '昵称不能为空' };
        if (trimmed.length > 12) return { ok: false, msg: '昵称最多 12 个字符' };
        const list = this.readList();
        const player = list.find(p => p.id === id);
        if (!player) return { ok: false, msg: '档案不存在' };
        player.name = trimmed;
        this.writeList(list);
        return { ok: true };
    },

    switchTo(id) {
        const list = this.readList();
        if (!list.some(p => p.id === id)) return { ok: false, msg: '档案不存在' };
        localStorage.setItem(this.KEY_CURRENT, id);
        return { ok: true };
    },

    // 删除档案：仅剩一个时不允许删除；同步清理其排行榜 / 成就 / 统计
    remove(id) {
        const list = this.readList();
        if (list.length <= 1) return { ok: false, msg: '至少保留一个玩家档案' };
        const player = list.find(p => p.id === id);
        if (!player) return { ok: false, msg: '档案不存在' };
        if (!confirm(`确定删除玩家"${player.name}"吗？其排行榜记录与成就将被清除。`)) return { ok: false, msg: '已取消' };

        this.writeList(list.filter(p => p.id !== id));
        for (const key of ['lg_records_v1', 'lg_achievements_v1', 'lg_stats_v1']) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && typeof data === 'object') {
                    delete data[id];
                    localStorage.setItem(key, JSON.stringify(data));
                }
            } catch (e) { /* 忽略 */ }
        }
        if (this.currentId() === null) {
            localStorage.setItem(this.KEY_CURRENT, this.readList()[0].id);
        }
        return { ok: true };
    }
};
