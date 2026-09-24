/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 万年历：公历月历 + 每日百科（农历/干支纳音/冲煞/建除/彭祖百忌/节气/节日/时辰表/今日诗句） */
/* ---------- 每日百科数据（民俗参考向） ---------- */
const TERM_TEXT = {
    '立春': '春季开始，东风解冻万物复苏。民俗"咬春"吃春饼萝卜。',
    '雨水': '降水渐增，草木萌动。乍暖还寒，注意保暖祛湿。',
    '惊蛰': '春雷惊百虫，春耕开始。传统吃梨，润燥清火。',
    '春分': '昼夜均分，燕子归来。民间有竖蛋、放风筝的习俗。',
    '清明': '气清景明，万物皆显。扫墓祭祖、踏青插柳。',
    '谷雨': '雨生百谷，牡丹花开。食香椿、喝谷雨茶。',
    '立夏': '夏季开始，万物繁茂。民俗称人、吃立夏蛋。',
    '小满': '麦粒渐满，未至全熟。防湿热，宜清淡饮食。',
    '芒种': '有芒之谷可种，农事繁忙。煮梅食新，酸甜开胃。',
    '夏至': '白昼最长，阳气至极。"冬至饺子夏至面"。',
    '小暑': '暑热渐盛，蟋蟀居宇。晒衣晒书，防暑降温。',
    '大暑': '一年中最热，湿热交蒸。喝伏茶、晒伏姜消暑。',
    '立秋': '秋季开始，凉风至。民俗"贴秋膘"进补。',
    '处暑': '暑气渐止，秋意渐起。早睡早起解秋乏。',
    '白露': '露凝而白，天转凉爽。"白露身不露"，勿再赤膊。',
    '秋分': '昼夜再次均分，秋高气爽。古有秋祭月传统。',
    '寒露': '露气寒冷，将凝结成霜。登高赏菊，添衣保暖。',
    '霜降': '初霜出现，草木黄落。民间讲究吃柿子润肺。',
    '立冬': '冬季开始，万物收藏。北方吃饺子"补冬"。',
    '小雪': '初雪可见，天地初寒。腌菜储冬，围炉将启。',
    '大雪': '雪盛时节，进补正当时。腌肉挂腊，静待新年。',
    '冬至': '白昼最短，数九开始。北方饺子南方汤圆，团圆进补。',
    '小寒': '天渐寒冷，正值二九。腊八将近，喝粥暖身。',
    '大寒': '一年最冷，岁末将至。扫尘备年，静候新春。'
};
const FESTIVAL_TEXT = {
    '春节': '辞旧迎新、阖家团圆，一年中最隆重的传统节日。',
    '元宵节': '正月十五闹花灯、吃汤圆，团团圆圆。',
    '龙抬头': '二月二龙抬头，理发纳吉，春耕开始。',
    '端午节': '赛龙舟、包粽子，纪念屈原。',
    '七夕节': '牛郎织女鹊桥相会，中国的情人节。',
    '中元节': '七月十五祭祖感恩，慎终追远。',
    '中秋节': '赏月吃月饼，人月两团圆。',
    '重阳节': '九九重阳，登高赏菊、敬老爱老。',
    '腊八节': '喝腊八粥，年味渐浓。',
    '小年': '祭灶扫尘，忙年开始。',
    '除夕': '辞旧岁、守岁迎新，灯火通明到天明。',
    '元旦': '公历新年第一天。',
    '情人节': '西方情人节，赠玫瑰表心意。',
    '妇女节': '致敬每一位了不起的"她"。',
    '劳动节': '致敬每一位劳动者。',
    '青年节': '五四青年节，青春正当时。',
    '儿童节': '祝大小朋友节日快乐。',
    '建军节': '致敬人民子弟兵。',
    '教师节': '师恩难忘，感谢引路人。',
    '国庆节': '祖国生日，普天同庆。',
    '圣诞节': '西方传统节日，平安相聚。'
};
// 彭祖百忌（日干/日支）
const PENGZU_GAN = ['甲不开仓', '乙不栽植', '丙不修灶', '丁不剃头', '戊不受田', '己不破券', '庚不经络', '辛不合酱', '壬不泱水', '癸不词讼'];
const PENGZU_ZHI = ['子不问卜', '丑不冠带', '寅不祭祀', '卯不穿井', '辰不哭泣', '巳不远行', '午不苫盖', '未不服药', '申不安床', '酉不会客', '戌不吃犬', '亥不嫁娶'];
// 煞方（三合日支分组）
const SHA_FANG = [[8, 0,4], [2, 6, 10], [5, 9, 1], [11, 3, 7]]; // 申子辰煞南 / 寅午戌煞北 / 巳酉丑煞东 / 亥卯未煞西
const SHA_NAME = ['南', '北', '东', '西'];
const HOUR_RANGES = ['23-1', '1-3', '3-5', '5-7', '7-9', '9-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];

class CalendarApp {
    constructor() {
        this.grid = document.getElementById('cal-grid');
        this.yearSel = document.getElementById('year-sel');
        this.monthSel = document.getElementById('month-sel');
        this.detail = document.getElementById('day-detail');
        this.poems = null;
        this.loadPoems();

        const now = new Date();
        this.curYear = now.getFullYear();
        this.curMonth = now.getMonth() + 1; // 1-12
        this.selected = null; // {y,m,d}
        this.termCache = {}; // year -> [{name,m,d,hh,mm}] 与日期索引

        this.bindEvents();
        this.fillSelects();
        this.select(this.curYear, this.curMonth, now.getDate());
        this.render();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => { window.location.href = '../../index.html'; });
        });
        document.getElementById('prev-btn').addEventListener('click', () => this.shiftMonth(-1));
        document.getElementById('next-btn').addEventListener('click', () => this.shiftMonth(1));
        document.getElementById('today-btn').addEventListener('click', () => {
            const now = new Date();
            this.curYear = now.getFullYear();
            this.curMonth = now.getMonth() + 1;
            this.select(this.curYear, this.curMonth, now.getDate());
            this.render();
        });
        this.yearSel.addEventListener('change', () => {
            this.curYear = +this.yearSel.value;
            this.render();
        });
        this.monthSel.addEventListener('change', () => {
            this.curMonth = +this.monthSel.value;
            this.render();
        });
    }

    fillSelects() {
        let yOpts = '';
        for (let y = 1900; y <= 2100; y++) yOpts += `<option value="${y}">${y}</option>`;
        this.yearSel.innerHTML = yOpts;
        let mOpts = '';
        for (let m = 1; m <= 12; m++) mOpts += `<option value="${m}">${m}</option>`;
        this.monthSel.innerHTML = mOpts;
    }

    shiftMonth(delta) {
        let m = this.curMonth + delta;
        let y = this.curYear;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        if (y < 1900 || y > 2100) return;
        this.curYear = y;
        this.curMonth = m;
        this.render();
        AudioManager.play('click');
    }

    // 某年的节气日期索引：'m-d' -> {name, hh, mm}
    termIndex(year) {
        if (!this.termCache[year]) {
            const map = {};
            LunarCore.solarTermsOfYear(year).forEach(t => {
                map[`${t.m}-${t.d}`] = { name: t.name, hh: t.hh, mm: t.mm };
            });
            this.termCache[year] = map;
        }
        return this.termCache[year];
    }

    /** 某日小字内容（优先级：节气 > 农历节日 > 公历节日 > 初一月名 > 农历日） */
    daySub(y, m, d, lunar) {
        const term = this.termIndex(y)[`${m}-${d}`];
        if (term) return { text: term.name, cls: 'term' };
        const lfKey = `${lunar.month}-${lunar.day}`;
        if (LunarCore.LUNAR_FESTIVALS[lfKey]) return { text: LunarCore.LUNAR_FESTIVALS[lfKey], cls: 'lfestival' };
        const sf = LunarCore.SOLAR_FESTIVALS[`${m}-${d}`];
        if (sf) return { text: sf, cls: 'sfestival' };
        if (lunar.day === 1) return { text: lunar.monthName, cls: 'month-first' };
        return { text: lunar.dayName, cls: '' };
    }

    // 当日农历节日（含除夕：次日为正月初一）
    lunarFestivals(y, m, d, lunar) {
        const out = [];
        const lf = LunarCore.LUNAR_FESTIVALS[`${lunar.month}-${lunar.day}`];
        if (lf) out.push(lf);
        const next = LunarCore.solarToLunar(...nextDay(y, m, d));
        if (next && next.month === 1 && next.day === 1) out.push('除夕');
        return out;
    }

    // 节气月支（用于建除）：最近的「节」≤ 当日
    jieMonthBranch(y, m, d) {
        const terms = [
            ...LunarCore.solarTermsOfYear(y - 1),
            ...LunarCore.solarTermsOfYear(y),
            ...LunarCore.solarTermsOfYear(y + 1)
        ];
        const jieNames = LunarCore.TERM_NAMES.filter((_, i) => LunarCore.JIE_INDEX.includes(i));
        const dayJD = LunarCore.toJDN(y, m, d, 12);
        let branch = null;
        terms
            .filter(t => LunarCore.JIE_INDEX.includes(LunarCore.TERM_NAMES.indexOf(t.name)))
            .sort((a, b) => a.jd - b.jd)
            .forEach(t => {
                if (t.jd <= dayJD) {
                    const k = jieNames.indexOf(t.name);
                    branch = (2 + k) % 12; // 寅=2 起
                }
            });
        return branch;
    }

    select(y, m, d) {
        this.selected = { y, m, d };
    }

    render() {
        this.yearSel.value = this.curYear;
        this.monthSel.value = this.curMonth;

        const first = new Date(this.curYear, this.curMonth - 1, 1);
        const offset = (first.getDay() + 6) % 7; // 周一=0
        const start = new Date(this.curYear, this.curMonth - 1, 1 - offset);
        const today = new Date();

        let html = '';
        for (let i = 0; i < 42; i++) {
            const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate();
            const inMonth = m === this.curMonth && y === this.curYear;
            const isToday = y === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate();
            const isSel = this.selected && this.selected.y === y && this.selected.m === m && this.selected.d === d;
            const lunar = LunarCore.solarToLunar(y, m, d);
            const sub = lunar ? this.daySub(y, m, d, lunar) : { text: '', cls: '' };
            const weekend = i % 7 >= 5;
            const cls = [
                'cal-cell',
                inMonth ? '' : 'other',
                isToday ? 'today' : '',
                isSel ? 'selected' : '',
                weekend ? 'weekend' : ''
            ].filter(Boolean).join(' ');
            html += `<div class="${cls}" data-date="${y}-${m}-${d}">
                <span class="cal-day">${d}</span>
                <span class="cal-sub ${sub.cls}">${sub.text}</span>
            </div>`;
        }
        this.grid.innerHTML = html;

        this.grid.querySelectorAll('.cal-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const [y, m, d] = cell.dataset.date.split('-').map(Number);
                this.select(y, m, d);
                AudioManager.play('click');
                this.render();
            });
        });

        this.renderDetail();
    }

    renderDetail() {
        if (!this.selected) { this.detail.innerHTML = ''; return; }
        const { y, m, d } = this.selected;
        const lunar = LunarCore.solarToLunar(y, m, d);
        if (!lunar) { this.detail.innerHTML = ''; return; }
        const weekday = '一二三四五六日'[(new Date(y, m - 1, d).getDay() + 6) % 7];
        const term = this.termIndex(y)[`${m}-${d}`];
        const lfest = this.lunarFestivals(y, m, d, lunar);
        const sfest = LunarCore.SOLAR_FESTIVALS[`${m}-${d}`] ? [LunarCore.SOLAR_FESTIVALS[`${m}-${d}`]] : [];

        const branch = this.jieMonthBranch(y, m, d);
        const dayIdx = LunarCore.dayGanZhiIndex(y, m, d);
        const jc = branch != null ? LunarCore.jianChu(branch, dayIdx % 12) : null;
        const dayGZ = LunarCore.ganZhi60(dayIdx);
        const dayNayin = LunarCore.nayinName(dayIdx);

        // 年柱（农历年干支）/ 月柱（节气月干支，五虎遁）
        const yearGZ = lunar.yearGanZhi;
        const monthGZ = branch != null ? this.monthGZ(y, m, d, branch, lunar.year) : null;

        // 冲煞：日支六冲生肖 + 三合煞方
        const dayZhi = dayIdx % 12;
        const chongAnimal = LunarCore.ANIMALS[(dayZhi + 6) % 12];
        let sha = '';
        SHA_FANG.forEach((grp, gi) => { if (grp.includes(dayZhi)) sha = SHA_NAME[gi]; });

        // 彭祖百忌
        const pzGan = PENGZU_GAN[dayIdx % 10];
        const pzZhi = PENGZU_ZHI[dayZhi];

        // 最近的节气（含当日）
        const near = this.nearestTerm(y, m, d);
        const shownTerm = term || near;

        // 节日简介（取第一个有文案的）
        const allFest = [...lfest, ...sfest];
        const festIntro = allFest.map(f => FESTIVAL_TEXT[f]).filter(Boolean)[0] || '';

        // 今日诗句（按年内日序轮换 300 首；点击展开/收起全诗）
        const poem = this.poemOfDay(y, m, d);
        const poemHtml = poem ? `
            <div class="dd-poem" id="dd-poem">
                <button class="dd-poem-toggle" type="button" title="点击展开全诗">${poem.text}<i class="dd-poem-more">展开全诗 ▾</i></button>
                <div class="dd-poem-full" style="display:none;">${poem.full.map(l => `<div>${l}</div>`).join('')}</div>
                <span class="dd-poem-from">——《${poem.title}》${poem.author}</span>
            </div>` : '';

        // 时辰干支表（子时从 23 点起）
        const HOUR_H = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
        const hourRows = HOUR_RANGES.map((rg, h) => {
            const gz = LunarCore.hourGanZhi(y, m, d, HOUR_H[h]);
            return `<span class="dd-hour">${LunarCore.BRANCHES[h]}时 <i>${rg}</i> ${gz}</span>`;
        }).join('');

        // 农历月大小
        const monthLen = LunarCore.monthDays(lunar.year, lunar.month);
        const monthSize = monthLen === 30 ? '大' : '小';

        this.detail.innerHTML = `
            <div class="dd-head">
                <span class="dd-solar">${y} 年 ${m} 月 ${d} 日 · 周${weekday}</span>
                <span class="dd-lunar">${lunar.yearGanZhi}${lunar.animal}年 ${lunar.monthName}${lunar.dayName}（${monthSize}月）</span>
            </div>
            <div class="dd-rows">
                <div class="dd-row"><b>干支</b>　${yearGZ}年 · ${monthGZ || '--'}月 · ${dayGZ}日（纳音 ${dayNayin}）</div>
                <div class="dd-row"><b>冲煞</b>　冲${chongAnimal} · 煞${sha}（民俗参考）</div>
                ${jc ? `<div class="dd-row"><b>建除</b>　${jc.shen}（宜：${jc.yi}；忌：${jc.ji}）</div>` : ''}
                <div class="dd-row"><b>百忌</b>　${pzGan} · ${pzZhi}</div>
                ${shownTerm ? `<div class="dd-row"><b>节气</b>　${term
                    ? `${term.name} · ${String(term.hh).padStart(2, '0')}:${String(term.mm).padStart(2, '0')}（北京时间）—— ${TERM_TEXT[term.name] || ''}`
                    : `${shownTerm.name}（${shownTerm.days > 0 ? '还有 ' + shownTerm.days + ' 天' : '已过 ' + (-shownTerm.days) + ' 天'}）—— ${TERM_TEXT[shownTerm.name] || ''}`}</div>` : ''}
                ${allFest.length ? `<div class="dd-row"><b>节日</b>　${allFest.join(' · ')}${festIntro ? '：' + festIntro : ''}</div>` : ''}
            </div>
            ${poemHtml}
            <div class="dd-hours">
                <div class="dd-hours-title">十二时辰</div>
                <div class="dd-hours-grid">${hourRows}</div>
            </div>
        `;
        // 诗句点击展开/收起全诗
        const toggle = this.detail.querySelector('.dd-poem-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const full = this.detail.querySelector('.dd-poem-full');
                const more = this.detail.querySelector('.dd-poem-more');
                const show = full.style.display === 'none';
                full.style.display = show ? '' : 'none';
                more.textContent = show ? '收起 ▴' : '展开全诗 ▾';
            });
        }
    }

    /** 节气月干支（五虎遁：年干定寅月干，顺推至月支） */
    monthGZ(y, m, d, monthBranch, lunarYear) {
        const yearStem = (((lunarYear - 4) % 60) + 60) % 60 % 10;
        const offset = ((monthBranch - 2) % 12 + 12) % 12; // 距寅月
        const stem = (yearStem * 2 + 2 + offset) % 10;
        return LunarCore.STEMS[stem] + LunarCore.BRANCHES[monthBranch];
    }

    /** 今日诗句：按年内日序在 300 首唐诗中轮换 */
    poemOfDay(y, m, d) {
        if (!this.poems || !this.poems.length) return null;
        const jan1 = LunarCore.toJDN(y, 1, 1);
        const dayOfYear = Math.round(LunarCore.toJDN(y, m, d) - jan1);
        const p = this.poems[((dayOfYear % this.poems.length) + this.poems.length) % this.poems.length];
        const text = (p.paragraphs[0] || '').slice(0, 24);
        return { text, full: p.paragraphs, title: p.title, author: p.author };
    }

    async loadPoems() {
        if (this.poems) return; // 内存缓存：本次会话只拉一次
        try {
            const res = await fetch('../schulte/poems-tang300.json?v=4');
            if (res.ok) {
                this.poems = await res.json();
                if (this.selected) this.renderDetail(); // 诗库晚于首屏时补渲染
            }
        } catch (e) { this.poems = null; }
    }

    nearestTerm(y, m, d) {
        const list = [...LunarCore.solarTermsOfYear(y - 1), ...LunarCore.solarTermsOfYear(y), ...LunarCore.solarTermsOfYear(y + 1)]
            .map(t => ({ name: t.name, days: Math.round(LunarCore.toJDN(t.y, t.m, t.d, 12) - LunarCore.toJDN(y, m, d, 12)), hh: t.hh, mm: t.mm }))
            .sort((a, b) => Math.abs(a.days) - Math.abs(b.days));
        return list[0];
    }
}

function nextDay(y, m, d) {
    const dt = new Date(y, m - 1, d + 1);
    return [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
}

document.addEventListener('DOMContentLoaded', () => new CalendarApp());
