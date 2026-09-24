/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 八字命理：四柱排盘（立春换年·十二节换月）+ 大运流年 + 五行十神 + 简批（依赖 calendar-core.js） */
class BaziApp {
    constructor() {
        this.screens = {
            input: document.getElementById('input-screen'),
            result: document.getElementById('result-screen'),
            history: document.getElementById('history-screen')
        };
        this.termCache = {};
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => { window.location.href = '../../index.html'; });
        });
        document.getElementById('calc-btn').addEventListener('click', () => this.calculate());
        document.getElementById('again-btn').addEventListener('click', () => this.showScreen('input'));
        document.getElementById('history-btn').addEventListener('click', () => this.openHistory());
        document.getElementById('history-btn2').addEventListener('click', () => this.openHistory());
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('input'));
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (!window.LG) return;
            LG.History.clear('bazi');
            this.renderHistory();
        });
        document.querySelectorAll('input[name="hour-known"]').forEach(r => {
            r.addEventListener('change', () => {
                document.getElementById('birth-time').disabled =
                    document.querySelector('input[name="hour-known"]:checked').value === 'no';
            });
        });
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => { s.style.display = 'none'; });
        this.screens[name].style.display = 'block';
        window.scrollTo(0, 0);
    }

    terms(year) {
        if (!this.termCache[year]) this.termCache[year] = LunarCore.solarTermsOfYear(year);
        return this.termCache[year];
    }

    /** 覆盖出生日前后的有序「节」序列（立春=寅月起） */
    jieSequence(y) {
        const names = LunarCore.TERM_NAMES;
        const jieIdx = LunarCore.JIE_INDEX;
        const list = [];
        for (const yy of [y - 1, y, y + 1]) {
            for (const t of this.terms(yy)) {
                if (jieIdx.includes(names.indexOf(t.name))) list.push(t);
            }
        }
        return list.sort((a, b) => a.jd - b.jd);
    }

    calculate() {
        const dateStr = document.getElementById('birth-date').value;
        if (!dateStr) { alert('请先选择出生日期'); return; }
        const [y, m, d] = dateStr.split('-').map(Number);
        const hourKnown = document.querySelector('input[name="hour-known"]:checked').value === 'yes';
        const gender = document.querySelector('input[name="gender"]:checked').value;
        let hour = 12;
        if (hourKnown) {
            const t = document.getElementById('birth-time').value || '12:00';
            const [hh, mm] = t.split(':').map(Number);
            hour = hh + mm / 60;
        }
        const chart = buildChart(y, m, d, hour, hourKnown, gender, (yy) => this.terms(yy));
        this.renderResult(chart);
        AudioManager.play('success');

        if (window.LG) {
            LG.History.add('bazi', {
                summary: `${chart.genderLabel} ${chart.pillars.map(p => p ? p.gz : '--').join(' ')}`,
                detail: `${y}-${m}-${d}${hourKnown ? '' : '（时辰未知）'} · ${chart.dayMaster.desc}命`,
                ms: null
            });
            LG.Achievements.report('test_done', { tool: 'bazi' });
        }
        this.showScreen('result');
    }

    renderResult(c) {
        document.getElementById('bazi-summary').innerHTML = `
            <div class="bs-title">${c.genderLabel} · ${c.lunarText}</div>
            <div class="bs-sub">公历 ${c.y} 年 ${c.m} 月 ${c.d} 日 ${c.hourText} · 日主 <b>${c.dayMaster.gz}</b>（${c.dayMaster.desc}命）</div>
        `;

        const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
        document.getElementById('pillars-block').innerHTML = `
            <div class="pillars">
                <div class="pillar-col"><span class="pillar-label"></span><span class="pillar-ss"></span><span class="pillar-empty">天干</span><span class="pillar-empty">地支</span><span class="pillar-empty">藏干</span></div>
                ${c.pillars.map((p, i) => {
                    if (!p) return `<div class="pillar-col"><span class="pillar-label">${pillarNames[i]}</span><span class="pillar-ss">--</span>
                        <div class="pillar-empty">?</div><div class="pillar-empty">?</div><span class="pillar-cang">未知</span></div>`;
                    return `<div class="pillar-col${i === 2 ? ' day-master' : ''}">
                        <span class="pillar-label">${pillarNames[i]}</span>
                        <span class="pillar-ss">${p.shiShen || (i === 2 ? '日主' : '')}</span>
                        <div class="pillar-gan wx-${p.ganWx}">${p.gan}</div>
                        <div class="pillar-zhi wx-${p.zhiWx}">${p.zhi}</div>
                        <span class="pillar-cang">${p.cang} · ${WX_NAMES[p.zhiWx]}</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="bazi-section" style="margin-top:-6px">
                <h3>💡 十神速览</h3>
                <p class="reading-text">年柱${c.pillars[0] ? c.pillars[0].shiShen : '--'}（祖上/少年）、月柱${c.pillars[1] ? c.pillars[1].shiShen : '--'}（父母/青年）、日支${c.pillars[2].zhiCangSS || '--'}（婚姻宫）、时柱${c.pillars[3] ? c.pillars[3].shiShen : '--'}（子女/晚年）。</p>
            </div>
        `;

        const wxTotal = WX_ORDER.map(k => c.wx[k]);
        const wxMax = Math.max(...wxTotal, 1);
        document.getElementById('wuxing-block').innerHTML = `
            <div class="bazi-section">
                <h3>🌊 五行能量（八字+时辰）</h3>
                <div class="wx-rows">
                    ${WX_ORDER.map(k => `
                        <div class="wx-row">
                            <span>${WX_NAMES[k]} · ${c.wx[k]}</span>
                            <div class="wx-track"><div class="wx-fill wx-${k}-f" style="width:${(c.wx[k] / wxMax) * 100}%"></div></div>
                            <span>${'●'.repeat(Math.min(c.wx[k], 3))}${c.wx[k] > 3 ? '+' : ''}</span>
                        </div>`).join('')}
                </div>
                <p class="wx-text">${c.wxNote}</p>
            </div>
        `;

        const nowYear = new Date().getFullYear();
        document.getElementById('dayun-block').innerHTML = `
            <div class="bazi-section">
                <h3>🧭 大运（${c.dyForward ? '顺行' : '逆行'} · ${c.qiYunText} 起运）</h3>
                <div class="dy-scroll"><table class="dy-table">
                    <tr><th>序</th><th>干支</th><th>岁数</th><th>年份</th></tr>
                    ${c.daYun.map((dy, i) => `
                        <tr class="${dy.fromYear <= nowYear && dy.toYear >= nowYear ? 'now' : ''}">
                            <td>${i + 1}</td><td class="gz">${dy.gz}</td><td>${dy.fromAge}~${dy.toAge}</td><td>${dy.fromYear}~${dy.toYear}</td>
                        </tr>`).join('')}
                </table></div>
            </div>
        `;

        document.getElementById('liunian-block').innerHTML = `
            <div class="bazi-section">
                <h3>📅 近年流年</h3>
                <div class="dy-scroll"><table class="dy-table">
                    <tr><th>年份</th><th>干支</th><th>周岁</th></tr>
                    ${c.liuNian.map(ln => `
                        <tr class="${ln.year === nowYear ? 'now' : ''}">
                            <td>${ln.year}</td><td class="gz">${ln.gz}</td><td>${ln.age >= 0 ? ln.age : '-'}</td>
                        </tr>`).join('')}
                </table></div>
            </div>
        `;

        document.getElementById('reading-block').innerHTML = `
            <div class="bazi-section">
                <h3>🍃 命理小谈（娱乐向）</h3>
                <p class="reading-text">${c.reading}</p>
            </div>
        `;
    }

    openHistory() {
        this.renderHistory();
        this.showScreen('history');
    }

    renderHistory() {
        const wrap = document.getElementById('history-list');
        const list = window.LG ? LG.History.list('bazi') : [];
        if (!list.length) {
            wrap.innerHTML = '<div class="history-empty">还没有排盘记录 📜</div>';
            return;
        }
        wrap.innerHTML = list.map(h => `
            <div class="history-item">
                <div class="history-main">
                    <span class="history-summary">${h.summary}</span>
                    <span class="history-meta">${formatTs(h.t)}${h.detail ? ' · ' + h.detail : ''}</span>
                </div>
            </div>
        `).join('');
    }
}

/* ================= 命理计算（纯函数） ================= */
const WX_NAMES = { jin: '金', mu: '木', shui: '水', huo: '火', tu: '土' };
const WX_ORDER = ['jin', 'mu', 'shui', 'huo', 'tu'];
const GAN_WX = ['mu', 'mu', 'huo', 'huo', 'tu', 'tu', 'jin', 'jin', 'shui', 'shui']; // 甲乙丙丁戊己庚辛壬癸
const ZHI_WX = ['shui', 'tu', 'mu', 'mu', 'tu', 'huo', 'huo', 'tu', 'jin', 'jin', 'tu', 'shui']; // 子丑寅卯辰巳午未申酉戌亥
const ZHI_CANG = ['癸', '己', '甲', '乙', '戊', '丙', '丁', '己', '庚', '辛', '戊', '壬']; // 地支藏干本气
const ELEMS = ['木', '火', '土', '金', '水']; // 生克序：木生火…
const SHI_SHEN = [
    ['比肩', '劫财'], ['食神', '伤官'], ['偏财', '正财'], ['七杀', '正官'], ['偏印', '正印']
];
const DAY_MASTER_DESC = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };

function shiShenOf(dayStemIdx, otherStemIdx) {
    const dWx = GAN_WX[dayStemIdx], oWx = GAN_WX[otherStemIdx];
    const dE = ELEMS.indexOf(WX_NAMES[dWx]), oE = ELEMS.indexOf(WX_NAMES[oWx]);
    const rel = (oE - dE + 5) % 5; // 0同 1我生 2我克 3克我 4生我
    const samePolarity = (dayStemIdx % 2) === (otherStemIdx % 2);
    return SHI_SHEN[rel][samePolarity ? 0 : 1];
}

/**
 * 排盘核心。termsOf(year) 注入节气表以便缓存复用。
 */
function buildChart(y, m, d, hour, hourKnown, gender, termsOf) {
    termsOf = termsOf || ((yy) => LunarCore.solarTermsOfYear(yy));
    const birthJD = LunarCore.toJDN(y, m, d, 12) + (hour - 12) / 24; // 出生时刻（UT·JD）

    // ---- 年柱（立春换年） ----
    const lichunOf = (yy) => termsOf(yy).find(t => t.name === '立春');
    let gzYearNum = y;
    if (lichunOf(y) && birthJD < lichunOf(y).jd) gzYearNum = y - 1;
    else if (lichunOf(y - 1) && birthJD < lichunOf(y - 1).jd + 0.001) gzYearNum = y - 1;
    const yearIdx = ((gzYearNum - 4) % 60 + 60) % 60;
    const yearStem = yearIdx % 10, yearBranch = yearIdx % 12;

    // ---- 月柱（十二节换月，五虎遁起月干） ----
    const jieSeq = [];
    for (const yy of [gzYearNum - 1, gzYearNum, gzYearNum + 1]) {
        for (const t of termsOf(yy)) {
            if (LunarCore.JIE_INDEX.includes(LunarCore.TERM_NAMES.indexOf(t.name))) jieSeq.push(t);
        }
    }
    jieSeq.sort((a, b) => a.jd - b.jd);
    let monthNum = 1, monthJie = jieSeq[0];
    for (const t of jieSeq) {
        if (t.jd <= birthJD) { monthJie = t; }
    }
    // 距出生最近且 ≤ 出生 的节 → 月序（以立春=1 顺数）
    let anchorIdx = -1;
    jieSeq.forEach((t, i) => { if (t.jd <= birthJD) anchorIdx = i; });
    const lichunAnchor = jieSeq.map(t => t.name).lastIndexOf('立春', anchorIdx);
    monthNum = ((anchorIdx - lichunAnchor) % 12 + 12) % 12 + 1; // 1=寅月
    const monthStem = (yearStem * 2 + monthNum + 1) % 10;
    const monthBranch = (2 + monthNum - 1) % 12; // 寅=2

    // ---- 日柱 / 时柱 ----
    const dayIdx = LunarCore.dayGanZhiIndex(y, m, d);
    const hourIdx60 = hourKnown
        ? (() => {
            const hBranch = Math.floor(((Math.floor(hour) + 1) % 24) / 2);
            const hStem = (dayIdx % 10 * 2 + hBranch) % 10;
            return { stem: hStem, branch: hBranch };
        })() : null;

    const STEMS = LunarCore.STEMS, BRANCHES = LunarCore.BRANCHES;
    const mk = (stem, branch) => ({
        gan: STEMS[stem], zhi: BRANCHES[branch],
        gz: STEMS[stem] + BRANCHES[branch],
        ganWx: GAN_WX[stem], zhiWx: ZHI_WX[branch],
        cang: ZHI_CANG[branch]
    });
    const pillars = [
        mk(yearStem, yearBranch),
        mk(monthStem, monthBranch),
        mk(dayIdx % 10, dayIdx % 12),
        hourIdx60 ? mk(hourIdx60.stem, hourIdx60.branch) : null
    ];
    pillars[0].shiShen = shiShenOf(dayIdx % 10, yearStem);
    pillars[1].shiShen = shiShenOf(dayIdx % 10, monthStem);
    if (pillars[3]) pillars[3].shiShen = shiShenOf(dayIdx % 10, hourIdx60.stem);
    const dayCangStem = '甲乙丙丁戊己庚辛壬癸'.indexOf(ZHI_CANG[dayIdx % 12]);
    pillars[2].zhiCangSS = shiShenOf(dayIdx % 10, dayCangStem);

    // ---- 五行统计 ----
    const wx = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 };
    for (const p of pillars) {
        if (!p) continue;
        wx[p.ganWx]++; wx[p.zhiWx]++;
    }

    // ---- 日主强弱（简化：得令 + 同党） ----
    const dayElem = GAN_WX[dayIdx % 10]; // 日主五行
    const monthZhiWx = ZHI_WX[monthBranch];
    const sheng = (a, b) => (ELEMS.indexOf(a) + 1) % 5 === ELEMS.indexOf(b); // a生b
    let score = 0;
    if (monthZhiWx === dayElem || sheng(monthZhiWx, dayElem)) score += 2; // 得令/得生
    for (const p of [pillars[0], pillars[1], pillars[3]]) {
        if (!p) continue;
        for (const k of [p.ganWx, p.zhiWx]) {
            if (k === dayElem || sheng(k, dayElem)) score++;
        }
    }
    const strength = score >= 5 ? '偏强' : score >= 3 ? '中和' : '偏弱';

    // ---- 大运 ----
    const yangYear = yearStem % 2 === 0;
    const forward = gender === 'male' ? yangYear : !yangYear;
    const neighbor = forward
        ? jieSeq.find(t => t.jd > birthJD)
        : [...jieSeq].reverse().find(t => t.jd < birthJD);
    let qiYunYears = 0;
    if (neighbor) qiYunYears = Math.abs(neighbor.jd - birthJD) / 3;
    const qiInt = Math.floor(qiYunYears);
    const qiMon = Math.round((qiYunYears - qiInt) * 12);
    // 月柱六十甲子序：由干支直接求 index
    const monthGZ60 = gz60Index(monthStem, monthBranch);
    const daYun = [];
    for (let k = 1; k <= 8; k++) {
        const idx = ((monthGZ60 + (forward ? k : -k)) % 60 + 60) % 60;
        const fromAge = qiInt + (k - 1) * 10 + (qiMon >= 6 ? 1 : 0);
        daYun.push({
            gz: LunarCore.ganZhi60(idx),
            fromAge,
            toAge: fromAge + 9,
            fromYear: y + fromAge,
            toYear: y + fromAge + 9
        });
    }

    // ---- 流年 ----
    const nowY = new Date().getFullYear();
    const liuNian = [];
    for (let yy = nowY - 4; yy <= nowY + 5; yy++) {
        liuNian.push({ year: yy, gz: LunarCore.ganZhi60(((yy - 4) % 60 + 60) % 60), age: yy - y });
    }

    // ---- 文案 ----
    const missing = WX_ORDER.filter(k => wx[k] === 0).map(k => WX_NAMES[k]);
    const strongest = WX_ORDER.reduce((a, b) => wx[a] >= wx[b] ? a : b);
    const wxNote = missing.length
        ? `五行缺${missing.join('、')}——名字里补过没有？其实缺什么不代表不好，平衡才关键。`
        : `五行俱全，以${WX_NAMES[strongest]}最旺（${wx[strongest]} 个）。`;
    const yongShen = strength === '偏强'
        ? '喜克泄（官杀、食伤、财星）——多听取不同意见，学会放松与输出'
        : strength === '偏弱'
            ? '喜生扶（印星、比劫）——多靠近滋养你的人和环境，稳扎稳打'
            : '五行较为流通，顺势而为即可';
    const dmText = {
        mu: '木主仁：你的底色是生长与坚持，像树一样向下扎根、向上伸展',
        huo: '火主礼：你的底色是热情与表达，自带光源，也容易燃烧过快',
        tu: '土主信：你的底色是包容与踏实，是朋友们口中的"靠谱"本人',
        jin: '金主义：你的底色是果决与原则，爱憎分明，出手利落',
        shui: '水主智：你的底色是灵动与智慧，善于变通，直觉在线'
    }[dayElem];
    const reading = `你是<b>${DAY_MASTER_DESC[dayElem]}命（日主${STEMS[dayIdx % 10]}）</b>，整体格局<b>${strength}</b>（同党 ${score} 分）。${dmText}。${wxNote} 用神取向：${yongShen}。大运${forward ? '顺行' : '逆行'}，${qiInt} 岁${qiMon ? ` ${qiMon} 个月` : ''}起运，每十年换一步心境与场景，行至喜用之地时，记得大胆出手。`;

    const lunar = LunarCore.solarToLunar(y, m, d);
    const hBranchLabel = hourIdx60 ? `${BRANCHES[hourIdx60.branch]}时` : '';
    return {
        y, m, d, hour, hourKnown,
        genderLabel: gender === 'male' ? '乾造（男命）' : '坤造（女命）',
        lunarText: `农历 ${lunar.yearGanZhi}${lunar.animal}年 ${lunar.monthName}${lunar.dayName}`,
        hourText: hourKnown ? `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}（${hBranchLabel}）` : '时辰未知',
        pillars, wx, dayMaster: { gz: STEMS[dayIdx % 10], desc: DAY_MASTER_DESC[dayElem] },
        wxNote, reading,
        dyForward: forward, qiYunText: `${qiInt} 岁${qiMon ? ` ${qiMon} 个月` : ''}`,
        daYun, liuNian
    };
}

function gz60Index(stem, branch) {
    for (let i = 0; i < 60; i++) {
        if (i % 10 === stem && i % 12 === branch) return i;
    }
    return 0;
}

function formatTs(t) {
    const dd = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${dd.getFullYear()}-${p(dd.getMonth() + 1)}-${p(dd.getDate())} ${p(dd.getHours())}:${p(dd.getMinutes())}`;
}

// 供 node 校验脚本使用
window.BaziCore = { buildChart, shiShenOf, gz60Index, WX_NAMES, WX_ORDER, GAN_WX, ZHI_WX };

document.addEventListener('DOMContentLoaded', () => new BaziApp());
