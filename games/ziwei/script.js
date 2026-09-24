/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 紫微斗数：三合派排盘（命宫/五行局/安紫微十四主星/四化/大限）+ 解读（依赖 calendar-core.js）
   安紫微采用商数借数法（与开源 iztro/MIT 同源算法一致，锚点样例经校验）。 */
class ZiweiApp {
    constructor() {
        this.screens = {
            input: document.getElementById('input-screen'),
            result: document.getElementById('result-screen'),
            history: document.getElementById('history-screen')
        };
        this.termCache = {};
        this.fillHours();
        this.bindEvents();
    }

    fillHours() {
        const sel = document.getElementById('birth-hour');
        sel.innerHTML = HOUR_NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
        sel.value = '6'; // 默认午时
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
            LG.History.clear('ziwei');
            this.renderHistory();
        });
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => { s.style.display = 'none'; });
        this.screens[name].style.display = 'block';
        window.scrollTo(0, 0);
    }

    calculate() {
        const dateStr = document.getElementById('birth-date').value;
        if (!dateStr) { alert('请先选择出生日期'); return; }
        const [y, m, d] = dateStr.split('-').map(Number);
        const h = +document.getElementById('birth-hour').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const chart = buildZiwei(y, m, d, h, gender);
        this.renderResult(chart);
        AudioManager.play('success');

        if (window.LG) {
            LG.History.add('ziwei', {
                summary: `${chart.genderLabel} · ${chart.soulStars || '命无正曜'} · ${chart.juName}`,
                detail: `${y}-${m}-${d} ${HOUR_NAMES[h]}`,
                ms: null
            });
            LG.Achievements.report('test_done', { tool: 'ziwei' });
        }
        this.showScreen('result');
    }

    renderResult(c) {
        document.getElementById('zw-summary').innerHTML = `
            <div class="bs-title">${c.genderLabel} · ${c.juName} · 命宫在${c.soulBranchName}</div>
            <div class="bs-sub">农历 ${c.lunarText} · 命宫主星：${c.soulStars || '无（借对宫）'}</div>
        `;

        // 4×4 盘：外圈十二宫按地支落位（显式定位避免自动放置与中心 2×2 冲突），中心为命主信息
        const BR = LunarCore.BRANCHES;
        // 地支(子基) → [行, 列]（1 起）：巳午未申 / 辰..酉 / 卯..戌 / 寅丑子亥
        const LAYOUT = { 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 4: [2, 1], 9: [2, 4], 3: [3, 1], 10: [3, 4], 2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4] };
        const grid = {}; // 支(子基0-11) -> cell html
        for (let k = 0; k < 12; k++) {
            const p = c.palaces[k];
            const [row, col] = LAYOUT[p.branch];
            grid[p.branch] = `
                <div class="zw-cell${k === 0 ? ' soul' : ''}${p.isBody ? ' body-mark' : ''}" style="grid-row:${row};grid-column:${col}">
                    <div class="zw-stars">
                        ${p.stars.map(s => `<span class="zw-star ${s.type}">${s.name}${s.sihua ? `<i class="sihua ${s.sihua}">${SIHUA_LABEL[s.sihua]}</i>` : ''}</span>`).join('')}
                    </div>
                    <div class="zw-cell-label">
                        <span class="zw-palace-name">${p.name}</span>
                        <span class="zw-daxian">${p.daXian}</span>
                    </div>
                </div>`;
        }
        document.getElementById('chart-block').innerHTML = `
            <div class="zw-chart">
                ${grid[5]}${grid[6]}${grid[7]}${grid[8]}
                ${grid[4]}<div class="zw-center">
                    <div class="zc-1">${c.lunarText}</div>
                    <div class="zc-2">${c.genderLabel} · ${c.juName}</div>
                    <div class="zc-3">命宫：${c.soulBranchName}（${c.soulStars || '无主星'}）<br>身宫：${c.bodyBranchName} · 生年四化：${c.sihuaText}</div>
                </div>${grid[9]}
                ${grid[3]}${grid[10]}
                ${grid[2]}${grid[1]}${grid[0]}${grid[11]}
            </div>
        `;

        document.getElementById('soul-reading').innerHTML = `
            <div class="zw-section">
                <h3>🌟 命宫解读（${c.soulStars || '命无正曜'}）</h3>
                ${c.soulReading.map(t => `<p>${t}</p>`).join('')}
            </div>
        `;

        document.getElementById('palace-readings').innerHTML = `
            <div class="zw-section">
                <h3>🏛️ 十二宫速览</h3>
                <div class="palace-list">
                    ${c.palaces.map(p => `
                        <div class="palace-item">
                            <div class="pi-head">${p.name} · ${BR[p.branch]}宫${p.isBody ? '（身宫）' : ''}｜${p.starNames || '无主星'}</div>
                            <div class="pi-text">${p.reading}</div>
                        </div>`).join('')}
                </div>
            </div>
        `;
    }

    openHistory() {
        this.renderHistory();
        this.showScreen('history');
    }

    renderHistory() {
        const wrap = document.getElementById('history-list');
        const list = window.LG ? LG.History.list('ziwei') : [];
        if (!list.length) {
            wrap.innerHTML = '<div class="history-empty">还没有排盘记录 🌌</div>';
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

function formatTs(t) {
    const dd = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${dd.getFullYear()}-${p(dd.getMonth() + 1)}-${p(dd.getDate())} ${p(dd.getHours())}:${p(dd.getMinutes())}`;
}

/* ================= 数据 ================= */
const HOUR_NAMES = ['子时 23-1点', '丑时 1-3点', '寅时 3-5点', '卯时 5-7点', '辰时 7-9点', '巳时 9-11点', '午时 11-13点', '未时 13-15点', '申时 15-17点', '酉时 17-19点', '戌时 19-21点', '亥时 21-23点'];
const PALACE_NAMES = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '事业宫', '田宅宫', '福德宫', '父母宫'];
const SIHUA_LABEL = { lu: '禄', quan: '权', ke: '科', ji: '忌' };

// 纳音五行（六十甲子按序 30 对 → 五行）
const NAYIN_WX = [
    '金', '火', '木', '土', '金', '火', '木', '土', '金', '木',
    '水', '土', '火', '木', '水', '金', '火', '木', '土', '金',
    '木', '水', '火', '土', '金', '木', '水', '火', '木', '水'
];
const WX_JU = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
const JU_NAME = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

// 生年干四化：[禄, 权, 科, 忌]
const SIHUA_TABLE = {
    甲: { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
    乙: { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
    丙: { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
    丁: { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
    戊: { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '太阳' },
    己: { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
    庚: { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
    辛: { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
    壬: { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
    癸: { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' }
};

const STAR_MEANING = {
    紫微: { key: '领袖气派，自尊心强，天生带着"我来安排"的气场', read: '紫微为帝座：有主见、有格局，喜欢被尊重；要注意的是听劝比发号施令更能成事。' },
    天机: { key: '机智灵敏，点子多，擅长分析与策划', read: '天机主智慧：反应快、心思细，是天生的军师；想得多时记得动起来，别让脑内会议开到半夜。' },
    太阳: { key: '热情博爱，光明磊落，付出型人格', read: '太阳主贵：乐于照亮别人，人缘与口碑都不错；学着把一部分光留给自己。' },
    武曲: { key: '刚毅果决，财星，执行力满分', read: '武曲主财与行动：赚钱执行力一流，说话直；心细一分，路宽一丈。' },
    天同: { key: '福星，温和乐观，知足常乐', read: '天同主福：性情温和、有福气象，抗压靠心态好；偶尔逼自己走出舒适圈，福气会翻倍。' },
    廉贞: { key: '能屈能伸，事业心与桃花并存', read: '廉贞次桃花又主事业：社交手腕高明，感情与工作都浓烈；分寸感是你的关键词。' },
    天府: { key: '稳重包容，库星，擅理财与守成', read: '天府为财库：稳、会管钱、能服人；守成之余别忘开拓，库要进也要出。' },
    太阴: { key: '细腻温柔，田宅主，感情丰富', read: '太阴主富与柔：心思细、审美好，居家型选手；情绪像月亮有圆缺，给自己一点周期性宽容。' },
    贪狼: { key: '多才多艺，欲望与魅力同行', read: '贪狼正桃花：兴趣广、社交强、学什么都快；把欲望排个优先级，你就是全能选手。' },
    巨门: { key: '口才出众，研究心强，爱问为什么', read: '巨门主口：表达力与洞察力双高，适合靠嘴和脑吃饭；言语是刀也是花，看你怎么用。' },
    天相: { key: '稳重公正，宰相之才，热心服务', read: '天相为印星：天生协调者，公正又热心；做好本职之外，也要敢于为自己拍板。' },
    天梁: { key: '荫星，正直豁达，长者风范', read: '天梁主荫：讲原则、能扛事，是朋友圈的老大哥老大姐；操心命要有度，先照顾好自己。' },
    七杀: { key: '冲劲十足，开创力强，敢爱敢恨', read: '七杀主肃杀：执行力与冒险精神爆表，适合开拓性战场；猛之外配一点耐力，无往不利。' },
    破军: { key: '破旧立新，不走寻常路', read: '破军主变革：天生推翻重来的勇气，人生剧情跌宕但精彩；破而后立，先想好立什么。' }
};

const PALACE_EXTRA = {
    命宫: '你的核心性格与人生基调。',
    兄弟宫: '与兄弟姐妹、平辈伙伴的缘分。',
    夫妻宫: '感情模式与婚姻相处之道。',
    子女宫: '与子女的缘分，也代指学生与晚辈。',
    财帛宫: '赚钱方式与理财倾向。',
    疾厄宫: '健康倾向与情绪压力点。',
    迁移宫: '外出运、环境变化与贵人方位。',
    交友宫: '朋友与部属对你的助力。',
    事业宫: '职场表现与事业格局。',
    田宅宫: '家宅不动产与内心安定感。',
    福德宫: '精神世界、兴趣与福气来源。',
    父母宫: '与父母长辈的缘分与庇荫。'
};

/* ================= 排盘核心（纯函数） ================= */
// 全程使用「寅基」索引：0=寅 1=卯 … 10=丑 11=子（紫微顺布自然序）
const YIN_BASE = 2; // 子基中寅=2
const toYin = (ziIdx) => ((ziIdx - YIN_BASE) % 12 + 12) % 12;
const toZi = (yinIdx) => ((yinIdx + YIN_BASE) % 12 + 12) % 12;

/** 安紫微（商数借数法）：day 农历日，ju 局数；返回寅基索引 */
function ziweiIndex(day, ju) {
    let offset = -1, quotient = 0, remainder = -1;
    do {
        offset++;
        const divisor = day + offset;
        quotient = Math.floor(divisor / ju);
        remainder = divisor % ju;
    } while (remainder !== 0);
    quotient %= 12;
    let idx = quotient - 1;
    idx += offset % 2 === 0 ? offset : -offset;
    return ((idx % 12) + 12) % 12;
}

function buildZiwei(y, m, d, hour, gender) {
    const lunar = LunarCore.solarToLunar(y, m, d);
    if (!lunar) throw new Error('日期超出范围');

    // 闰月：上半月算本月，下半月算下月（闰腊月→正月）
    let M = lunar.month;
    if (lunar.isLeap && lunar.day >= 16) M = lunar.month === 12 ? 1 : lunar.month + 1;

    const yearIdx = ((lunar.year - 4) % 60 + 60) % 60;
    const yearStem = yearIdx % 10;
    const yearGan = LunarCore.STEMS[yearStem];

    // 命宫/身宫（寅基）：寅起正月顺数至生月，再逆/顺数生时
    const soulYin = ((M - 1) - hour + 120) % 12;
    const bodyYin = ((M - 1) + hour) % 12;

    // 命宫干支（五虎遁）→ 纳音五行 → 局数
    const yinStemOfSoul = (yearStem * 2 + 2 + soulYin) % 10;
    const gz60 = gzIndexOf(yinStemOfSoul, toZi(soulYin) % 12);
    const nayin = NAYIN_WX[Math.floor(gz60 / 2)];
    const ju = WX_JU[nayin];

    // 安紫微与十四主星（寅基）
    const zw = ziweiIndex(lunar.day, ju);
    const tf = ((12 - zw) % 12 + 12) % 12; // 天府与紫微镜像
    const starPos = { 紫微: zw, 天机: zw - 1, 太阳: zw - 3, 武曲: zw - 4, 天同: zw - 5, 廉贞: zw - 8 };
    starPos.天府 = tf; starPos.太阴 = tf + 1; starPos.贪狼 = tf + 2; starPos.巨门 = tf + 3;
    starPos.天相 = tf + 4; starPos.天梁 = tf + 5; starPos.七杀 = tf + 6; starPos.破军 = tf + 10;
    // 辅星（子基绝对位转寅基）
    starPos.文昌 = toYin((10 - hour + 12) % 12);
    starPos.文曲 = toYin((4 + hour) % 12);
    starPos.左辅 = toYin((4 + M - 1) % 12);
    starPos.右弼 = toYin((10 - (M - 1) + 12) % 12);

    // 四化
    const sh = SIHUA_TABLE[yearGan];
    const sihuaOfStar = {};
    for (const [k, star] of Object.entries(sh)) {
        sihuaOfStar[star] = { lu: '禄', quan: '权', ke: '科', ji: '忌' }[k];
    }

    // 布十二宫（寅基）：命宫起，逆时针布名
    const palaces = [];
    for (let k = 0; k < 12; k++) {
        const yinIdx = ((soulYin - k) % 12 + 12) % 12;
        const stars = Object.entries(starPos)
            .filter(([, pos]) => ((pos % 12) + 12) % 12 === yinIdx)
            .map(([name]) => ({
                name,
                type: STAR_MEANING[name] ? 'major' : 'minor',
                sihua: sihuaOfStar[name] || null
            }));
        // 大限：局数起运，阳男阴女顺行
        const yangYear = yearStem % 2 === 0;
        const forward = gender === 'male' ? yangYear : !yangYear;
        const step = forward ? k : (12 - k) % 12;
        const fromAge = ju + step * 10;
        palaces.push({
            name: PALACE_NAMES[k],
            branch: toZi(yinIdx),
            yinIdx,
            stars,
            starNames: stars.filter(s => s.type === 'major').map(s => s.name + (s.sihua ? SIHUA_LABEL[s.sihua] : '')).join(' ') || null,
            isBody: yinIdx === bodyYin,
            daXian: `${fromAge}-${fromAge + 9}`
        });
    }

    // 命宫解读
    const soulPalace = palaces[0];
    const soulMajors = soulPalace.stars.filter(s => s.type === 'major').map(s => s.name);
    const opposite = palaces[6];
    const opMajors = opposite.stars.filter(s => s.type === 'major').map(s => s.name);
    const soulReading = [];
    if (soulMajors.length === 0) {
        soulReading.push(`命宫无主星，性格底色受环境与对宫（迁移宫${opMajors.join('、') || '亦无主星'}）影响较深——你是"可塑型人才"，在不同圈子里会长成不同的样子。`);
    }
    soulMajors.forEach(n => soulReading.push(`【${n}】${STAR_MEANING[n].key}。${STAR_MEANING[n].read}`));
    if (soulMajors.length >= 2) {
        soulReading.push(`两颗主星同宫：你身上同时存在${soulMajors[0]}的「${STAR_MEANING[soulMajors[0]].key.split('，')[0]}」与${soulMajors[1]}的「${STAR_MEANING[soulMajors[1]].key.split('，')[0]}」，张力即魅力，学会在两种模式间切换就是你的人生课题。`);
    }
    const auxStars = soulPalace.stars.filter(s => s.type === 'minor').map(s => s.name + (s.sihua ? SIHUA_LABEL[s.sihua] : ''));
    if (auxStars.length) soulReading.push(`辅星加持：${auxStars.join('、')}，让你的才情与贵人缘更进一层。`);

    // 各宫短评
    palaces.forEach(p => {
        const majors = p.stars.filter(s => s.type === 'major').map(s => s.name);
        if (majors.length) {
            p.reading = `${PALACE_EXTRA[p.name]}${majors.map(n => `${n}坐守：${STAR_MEANING[n].key.split('，')[0]}。`).join('')}`;
        } else {
            p.reading = `${PALACE_EXTRA[p.name]}此宫无主星，看对宫与流年而定，弹性较大。`;
        }
    });

    const BR = LunarCore.BRANCHES;
    return {
        genderLabel: gender === 'male' ? '乾造（男命）' : '坤造（女命）',
        lunarText: `${lunar.yearGanZhi}${lunar.animal}年 ${lunar.monthName}${lunar.dayName}`,
        juName: JU_NAME[ju],
        soulBranchName: BR[soulPalace.branch] + '宫',
        bodyBranchName: BR[palaces.find(p => p.isBody).branch] + '宫',
        soulStars: soulPalace.starNames,
        sihuaText: Object.entries(sh).map(([k, v]) => `${v}${SIHUA_LABEL[{ 禄: 'lu', 权: 'quan', 科: 'ke', 忌: 'ji' }[k]]}`).join(' '),
        soulReading, palaces
    };
}

function gzIndexOf(stem, branch) {
    for (let i = 0; i < 60; i++) {
        if (i % 10 === stem && i % 12 === branch) return i;
    }
    return 0;
}

// 供 node 校验脚本使用
window.ZiweiCore = { buildZiwei, ziweiIndex, NAYIN_WX, WX_JU, gzIndexOf };

document.addEventListener('DOMContentLoaded', () => new ZiweiApp());
