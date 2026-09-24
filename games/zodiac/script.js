/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 星座解码：输入出生信息 → 太阳/月亮/上升/下降星座 + 适配分析（纯 JS 简化天文算法） */
class ZodiacApp {
    constructor() {
        this.screens = {
            input: document.getElementById('input-screen'),
            result: document.getElementById('result-screen'),
            history: document.getElementById('history-screen')
        };
        this.citySel = document.getElementById('birth-city');
        this.lastResult = null;

        this.bindEvents();
        this.fillCities();
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
            LG.History.clear('zodiac');
            this.renderHistory();
        });
        // 不确定出生时间 → 禁用时间输入
        document.querySelectorAll('input[name="time-known"]').forEach(r => {
            r.addEventListener('change', () => {
                document.getElementById('birth-time').disabled =
                    document.querySelector('input[name="time-known"]:checked').value === 'no';
            });
        });
    }

    fillCities() {
        this.citySel.innerHTML = CITIES.map(c => `<option value="${c[0]}">${c[1]}</option>`).join('');
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
        const timeKnown = document.querySelector('input[name="time-known"]:checked').value === 'yes';
        const city = CITIES.find(c => c[0] === this.citySel.value) || CITIES[0];

        let hourLocal = 12, minute = 0;
        if (timeKnown) {
            const t = document.getElementById('birth-time').value || '12:00';
            [hourLocal, minute] = t.split(':').map(Number);
        }
        // 东八区 → 世界时
        const hourUT = hourLocal - 8 + minute / 60;

        const jd = toJD(y, m, d, hourUT);
        const sunLon = sunLongitude(toJD(y, m, d, 12)); // 太阳按当日正午（日界精度足够）
        const sunIdx = Math.floor(sunLon / 30);
        let moonIdx = null, ascIdx = null, descIdx = null;
        if (timeKnown) {
            moonIdx = Math.floor(moonLongitude(jd) / 30);
            const lst = (gmst(jd) + city[2]) % 360;
            const asc = ascendant(lst, city[3]);
            ascIdx = Math.floor(asc / 30);
            descIdx = (ascIdx + 6) % 12;
        }

        const trio = {
            sun: sunIdx,
            moon: moonIdx,
            asc: ascIdx,
            desc: descIdx,
            timeKnown,
            city: city[1],
            y, m, d
        };
        this.lastResult = trio;
        this.renderResult(trio);
        AudioManager.play('success');

        const S = SIGNS;
        if (window.LG) {
            LG.History.add('zodiac', {
                summary: `太阳${S[sunIdx].name}${timeKnown ? ` · 月亮${S[moonIdx].name} · 上升${S[ascIdx].name}` : ' · 时辰未知'}`,
                detail: `${y}-${m}-${d} ${city[1]}`,
                ms: null
            });
            LG.Achievements.report('test_done', { tool: 'zodiac' });
        }
        this.showScreen('result');
    }

    renderResult(t) {
        const S = SIGNS;
        const cards = [
            { role: '☀️ 太阳星座 · 核心自我', sign: t.sun, sub: '你的人生主色调' },
            t.timeKnown
                ? { role: '🌙 月亮星座 · 内心情绪', sign: t.moon, sub: '独处时的你' }
                : { role: '🌙 月亮星座', sign: null, sub: '需要出生时间' },
            t.timeKnown
                ? { role: '⬆️ 上升星座 · 外在面具', sign: t.asc, sub: '别人眼中的你' }
                : { role: '⬆️ 上升星座', sign: null, sub: '需要出生时间' }
        ];
        document.getElementById('trio-cards').innerHTML = cards.map(c => `
            <div class="trio-card">
                <div class="trio-role">${c.role}</div>
                <div class="trio-emoji">${c.sign == null ? '❓' : S[c.sign].emoji}</div>
                <div class="trio-sign">${c.sign == null ? '未知' : S[c.sign].name}</div>
                <div class="trio-sub">${c.sub}</div>
            </div>
        `).join('');

        // 元素能量小结
        const els = [t.sun, t.moon, t.asc].filter(i => i != null).map(i => SIGNS[i].element);
        const elCount = {};
        els.forEach(e => { elCount[e] = (elCount[e] || 0) + 1; });
        const elText = Object.entries(elCount)
            .map(([e, n]) => `${ELEMENTS[e].name}×${n}`)
            .join(' · ');
        document.getElementById('element-summary').innerHTML =
            `<h3>🧬 元素能量</h3><p>你的星图元素分布：${elText}。${ELEMENT_SUMMARY[Object.keys(elCount).sort().join('+')] || '元素分布均衡，理性与感性兼备，能在不同场合切换自如。'}</p>`;

        // 太阳星座完整档案
        const sun = SIGNS[t.sun];
        document.getElementById('sun-profile').innerHTML = `
            <div class="sun-sections">
                <div class="result-section"><h3>${sun.emoji} ${sun.name}座 · ${sun.dateRange}（${ELEMENTS[sun.element].name}象 · ${sun.mode}）</h3><p>${sun.profile}</p></div>
                <div class="result-section"><h3>💗 感情模样</h3><p>${sun.love}</p></div>
                <div class="result-section"><h3>💼 天赋方向</h3><p>${sun.career}</p></div>
                ${t.timeKnown ? `<div class="result-section"><h3>🌙 月亮${SIGNS[t.moon].name}：内心的一面</h3><p>${SIGNS[t.moon].moonText}</p></div>
                <div class="result-section"><h3>⬆️ 上升${SIGNS[t.asc].name}：第一印象</h3><p>${SIGNS[t.asc].ascText}</p></div>
                <div class="result-section"><h3>⬇️ 下降${SIGNS[t.desc].name}：你吸引的人</h3><p>${SIGNS[t.desc].descText}</p></div>` : ''}
            </div>
        `;

        // 适配榜（按太阳星座）
        const compat = compatList(t.sun);
        document.getElementById('compat-block').innerHTML = `
            <div class="sun-sections">
                <div class="result-section">
                    <h3>💞 ${sun.name}座适配榜（按太阳星座）</h3>
                    <div class="compat-list">
                        ${compat.map((c, i) => `
                            <div class="compat-row">
                                <span class="compat-name">${i < 3 ? '🥇🥈🥉'[i] : ''} ${SIGNS[c.sign].emoji} ${SIGNS[c.sign].name}座</span>
                                <div class="compat-track"><div class="compat-fill" style="width:${c.score}%"></div></div>
                                <span class="compat-score">${c.score}</span>
                            </div>`).join('')}
                    </div>
                    <p class="compat-best">✨ 天作之合：${SIGNS[compat[0].sign].name}座 —— ${compat[0].text}</p>
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
        const list = window.LG ? LG.History.list('zodiac') : [];
        if (!list.length) {
            wrap.innerHTML = '<div class="history-empty">还没有测算记录 ✨</div>';
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
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ================= 天文算法（简化版，误差满足星座级精度） ================= */
const RAD = Math.PI / 180;

function toJD(y, m, d, hourUT) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hourUT / 24;
}

// 太阳视黄经（Meeus 低精度，~0.01°）
function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
        + 0.000289 * Math.sin(3 * M);
    return ((L0 + C) % 360 + 360) % 360;
}

// 月亮黄经（ELP2000 截断级数，~0.05°）
function moonLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const s = (x) => Math.sin(x * RAD);
    const lon = Lp
        + 6.288774 * s(Mp)
        + 1.274027 * s(2 * D - Mp)
        + 0.658314 * s(2 * D)
        + 0.213618 * s(2 * Mp)
        - 0.185116 * E * s(M)
        - 0.114332 * s(2 * F)
        + 0.058793 * s(2 * D - 2 * Mp)
        + 0.057066 * E * s(2 * D - M - Mp)
        + 0.053322 * s(2 * D + Mp)
        + 0.045758 * E * s(2 * D - M)
        - 0.040923 * E * s(M - Mp)
        - 0.034720 * s(D)
        - 0.030383 * E * s(M + Mp)
        + 0.015327 * s(2 * D - 2 * F)
        - 0.012528 * s(Mp + 2 * F)
        + 0.010980 * s(Mp - 2 * F)
        + 0.010675 * s(4 * D - Mp)
        + 0.010034 * s(3 * Mp)
        + 0.008548 * s(4 * D - 2 * Mp);
    return ((lon % 360) + 360) % 360;
}

// 格林尼治平恒星时（度）
function gmst(jd) {
    const T = (jd - 2451545.0) / 36525;
    const g = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * T * T - T * T * T / 38710000;
    return ((g % 360) + 360) % 360;
}

// 上升点黄经：lst=本地恒星时(度) lat=地理纬度
function ascendant(lst, lat) {
    const eps = 23.4367 * RAD;
    const th = lst * RAD;
    const phi = lat * RAD;
    let asc = Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / RAD;
    return ((asc % 360) + 360) % 360;
}

/* ================= 数据：城市（id, 名称, 东经, 北纬） ================= */
const CITIES = [
    ['beijing', '北京', 116.41, 39.90], ['shanghai', '上海', 121.47, 31.23],
    ['guangzhou', '广州', 113.26, 23.13], ['shenzhen', '深圳', 114.06, 22.55],
    ['chengdu', '成都', 104.07, 30.67], ['chongqing', '重庆', 106.55, 29.56],
    ['hangzhou', '杭州', 120.16, 30.29], ['nanjing', '南京', 118.80, 32.06],
    ['wuhan', '武汉', 114.31, 30.59], ['xian', '西安', 108.94, 34.34],
    ['zhengzhou', '郑州', 113.63, 34.75], ['jinan', '济南', 117.12, 36.65],
    ['qingdao', '青岛', 120.38, 36.07], ['tianjin', '天津', 117.20, 39.08],
    ['shenyang', '沈阳', 123.43, 41.81], ['changchun', '长春', 125.32, 43.90],
    ['harbin', '哈尔滨', 126.53, 45.80], ['shijiazhuang', '石家庄', 114.51, 38.04],
    ['taiyuan', '太原', 112.55, 37.87], ['lanzhou', '兰州', 103.83, 36.06],
    ['xining', '西宁', 101.78, 36.62], ['yinchuan', '银川', 106.28, 38.47],
    ['huhehaote', '呼和浩特', 111.75, 40.84], ['wulumuqi', '乌鲁木齐', 87.62, 43.83],
    ['lasa', '拉萨', 91.14, 29.65], ['kunming', '昆明', 102.83, 24.88],
    ['guiyang', '贵阳', 106.63, 26.65], ['nanning', '南宁', 108.37, 22.82],
    ['haikou', '海口', 110.32, 20.03], ['fuzhou', '福州', 119.30, 26.08],
    ['xiamen', '厦门', 118.09, 24.48], ['changsha', '长沙', 112.94, 28.23],
    ['nanchang', '南昌', 115.86, 28.68], ['hefei', '合肥', 117.28, 31.86],
    ['taipei', '台北', 121.56, 25.03], ['hongkong', '香港', 114.17, 22.32],
    ['macau', '澳门', 113.55, 22.19]
];

const ELEMENTS = { fire: { name: '火' }, earth: { name: '土' }, air: { name: '风' }, water: { name: '水' } };

const ELEMENT_SUMMARY = {
    'fire': '火象主导：行动力与热情是你的引擎，先冲了再说，人生底色热烈明亮。',
    'earth': '土象主导：踏实与可靠是你的名片，你相信慢慢来比较快。',
    'air': '风象主导：思维与沟通是你的天赋，世界因你的想法而有趣。',
    'water': '水象主导：感受与直觉是你的罗盘，你对情绪的体察细致入微。',
    'fire+fire': '双重火象：能量拉满的永动机，注意别烧到自己。',
    'earth+earth': '双重土象：稳如泰山，偶尔允许自己放飞一次。',
    'air+air': '双重风象：脑子转得比风快，记得落地。',
    'water+water': '双重水象：共情力满格，记得给情绪装个闸门。',
    'fire+air': '火风组合：热情与创意齐飞，天生的发光体。',
    'earth+water': '土水组合：温情与踏实兼具，治愈系担当。',
    'fire+water': '火水组合：外表热烈内心细腻，冰与火之歌。',
    'earth+air': '土风组合：既有想法又能落地，靠谱的创意派。'
};

/* ================= 12 星座档案 ================= */
const SIGNS = [
    { name: '白羊', emoji: '♈', element: 'fire', mode: '本位', dateRange: '3.21 - 4.19',
        profile: '黄道第一宫的开拓者。你直来直去、说干就干，天生的行动派与冒险家；竞争让你兴奋，无聊让你窒息。率真是你最大的魅力，也是偶尔的软肋。',
        love: '喜欢就追，不爱纠缠；热烈直接，需要能接住你火苗、又不会熄灭它的人。', career: '创业、销售、体育、急诊与救援等冲在最前面的领域。',
        moonText: '月亮白羊：情绪来得快去得快，需要被即时回应，藏不住心事。', ascText: '上升白羊：给人爽朗好动的第一印象，走路都带风。', descText: '下降天秤：你容易被优雅得体、擅长协调的人吸引。' },
    { name: '金牛', emoji: '♉', element: 'earth', mode: '固定', dateRange: '4.20 - 5.20',
        profile: '人间清醒的享乐主义者。你稳重务实、审美在线，对美食与品质有执念；认定的事九头牛拉不回，改主意比存钱还难。安全感是你的氧气。',
        love: '慢热长情，爱是陪伴与供养；需要稳定、不玩暧昧的伴侣。', career: '金融、设计、美食、园艺与资产管理等需要耐心与品味的领域。',
        moonText: '月亮金牛：情绪稳定，靠物质与舒适感充电，讨厌变动。', ascText: '上升金牛：温和从容的第一印象，让人觉得可靠好相处。', descText: '下降天蝎：你容易被深邃神秘、有强烈情感浓度的人吸引。' },
    { name: '双子', emoji: '♊', element: 'air', mode: '变动', dateRange: '5.21 - 6.21',
        profile: '黄道第一好奇宝宝。你脑子快、嘴更快，一人分饰多角毫不费力；信息是你的零食，无聊是你的天敌。朋友眼中的你永远有新鲜事。',
        love: '始于聊天陷于有趣；需要能聊到一块、又不粘人的灵魂伴侣。', career: '传媒、写作、市场、翻译、主持等靠信息与表达吃饭的领域。',
        moonText: '月亮双子：情绪需要出口，说出来就好了；喜欢新鲜感。', ascText: '上升双子：机灵健谈的第一印象，天生自来熟。', descText: '下降射手：你容易被乐观开阔、带你见世面的人吸引。' },
    { name: '巨蟹', emoji: '♋', element: 'water', mode: '本位', dateRange: '6.22 - 7.22',
        profile: '披着壳的温柔巨人。你共情力满格，记得所有人的喜好；恋家、护短，把在乎的人照顾得无微不至。坚硬的壳里住着最软的心。',
        love: '爱=安全感+一日三餐的惦记；认准了就是奔着一辈子去。', career: '餐饮、教育、心理、医护、人力资源等以心换心的领域。',
        moonText: '月亮巨蟹：情绪像潮汐，家是最好的充电站；记忆力超群。', ascText: '上升巨蟹：温软亲切的第一印象，让人想靠近。', descText: '下降摩羯：你容易被成熟稳重、事业心强的人吸引。' },
    { name: '狮子', emoji: '♌', element: 'fire', mode: '固定', dateRange: '7.23 - 8.22',
        profile: '自带聚光灯的太阳宠儿。你大方热情、护短爱面子，天生的舞台中心；慷慨是本能，被看见是刚需。你的骄傲背后是滚烫的真心。',
        love: '爱得轰轰烈烈，把伴侣宠成主角；需要掌声，也需要忠诚。', career: '管理、演艺、创意总监、教育等能发光发热的舞台。',
        moonText: '月亮狮子：情绪需要观众，被夸奖能立刻满血复活。', ascText: '上升狮子：气场全开的第一印象，存在感十足。', descText: '下降水瓶：你容易被特立独行、有趣灵魂的人吸引。' },
    { name: '处女', emoji: '♍', element: 'earth', mode: '变动', dateRange: '8.23 - 9.22',
        profile: '细节控的完美主义者。你逻辑缜密、执行力强，一眼看出问题在哪；服务精神满分，是团队里默默兜底的人。嘴上挑剔，心里最软。',
        love: '爱藏在细节里：提醒吃药、改好方案；需要被看见付出。', career: '医疗、审计、编辑、数据分析、项目管理等精细严谨的领域。',
        moonText: '月亮处女：情绪靠"把事情理顺"来平复，焦虑时爱收拾。', ascText: '上升处女：干净利落的第一印象，显得靠谱又谦虚。', descText: '下降双鱼：你容易被浪漫温柔、不按逻辑出牌的人吸引。' },
    { name: '天秤', emoji: '♎', element: 'air', mode: '本位', dateRange: '9.23 - 10.23',
        profile: '优雅的和平使者。你审美出众、八面玲珑，天生擅长权衡与协调；选择困难是甜蜜的负担，和谐是你的执念。你让世界更好看了 10%。',
        love: '颜控+氛围控，爱情要美要体面；怕吵架，更怕孤独。', career: '法律、公关、设计、买手、外交与协调类工作。',
        moonText: '月亮天秤：情绪需要陪伴与安抚，讨厌失衡的关系。', ascText: '上升天秤：得体迷人的第一印象，天生好路人缘。', descText: '下降白羊：你容易被直接坦率、勇往直前的人吸引。' },
    { name: '天蝎', emoji: '♏', element: 'water', mode: '固定', dateRange: '10.24 - 11.22',
        profile: '深海的观察者。你洞察力惊人、意志力恐怖，爱憎分明到极致；表面高冷，内里炽热。要么不动心，动心就是全部。',
        love: '占有欲与忠诚度同高；要灵魂深度的绑定，不要浅尝辄止。', career: '侦查与风控、心理、外科、投研、危机处理等深度领域。',
        moonText: '月亮天蝎：情绪浓烈藏于水下，信任一旦建立便极深。', ascText: '上升天蝎：神秘淡漠的第一印象，气场自带距离感。', descText: '下降金牛：你容易被踏实温暖、给人安定感的人吸引。' },
    { name: '射手', emoji: '♐', element: 'fire', mode: '变动', dateRange: '11.23 - 12.21',
        profile: '永远在路上的乐观主义者。你自由至上、心直口快，远方与意义是你的燃料；理想主义者的悲观，是你偶尔的B面。',
        love: '爱是并肩看世界；抓越紧跑越快，跟得上脚步才留得住你。', career: '旅行、外贸、高等教育、出版、国际事务等开阔的赛道。',
        moonText: '月亮射手：情绪靠"出去走走"治好，讨厌被束缚。', ascText: '上升射手：开朗爱笑的第一印象，自带亲和力。', descText: '下降双子：你容易被聪明健谈、古灵精怪的人吸引。' },
    { name: '摩羯', emoji: '♑', element: 'earth', mode: '本位', dateRange: '12.22 - 1.19',
        profile: '大器晚成的攀登者。你自律、有野心、耐得住寂寞，把目标拆成台阶一步步爬；冷幽默是隐藏款，熟人才知道你多好玩。',
        love: '爱得很克制很长远；不擅长说，但规划里全是你。', career: '管理、金融、工程、体制内深耕等长线积累的赛道。',
        moonText: '月亮摩羯：情绪自己消化，成就感是最好的安抚。', ascText: '上升摩羯：沉稳老成的第一印象，少年老成。', descText: '下降巨蟹：你容易被温柔顾家、情感细腻的人吸引。' },
    { name: '水瓶', emoji: '♒', element: 'air', mode: '固定', dateRange: '1.20 - 2.18',
        profile: '来自未来的怪咖。你独立思考、脑洞清奇，从不随大流；朋友满天下的同时，内心保有一座谁也进不去的孤岛。理性是你的浪漫。',
        love: '要灵魂共鸣更要空间；最理想的关系是"各自精彩，彼此欣赏"。', career: '科技、创新研究、社会学、公益、独立创作者等先锋领域。',
        moonText: '月亮水瓶：情绪偏理性抽离，需要独处空间回血。', ascText: '上升水瓶：独特疏离的第一印象，气质自带辨识度。', descText: '下降狮子：你容易被自信耀眼、热烈坦荡的人吸引。' },
    { name: '双鱼', emoji: '♓', element: 'water', mode: '变动', dateRange: '2.19 - 3.20',
        profile: '黄道最后的 dreamer。你温柔浪漫、共情力惊人，艺术细胞刻在骨子里；偶尔逃避现实，是因为心里装着太美的世界。',
        love: '爱如潮水，全情投入；要浪漫要仪式感，也怕受伤。', career: '艺术、音乐、影视、疗愈与公益等柔软而有创造力的领域。',
        moonText: '月亮双鱼：情绪细腻如丝，音乐与大海能治愈你。', ascText: '上升双鱼：朦胧梦幻的第一印象，眼神会说话。', descText: '下降处女：你容易被细心靠谱、条理分明的人吸引。' }
];

/* ================= 适配规则（按星座间隔角度打分） ================= */
const COMPAT_RULES = [
    { d: 0, score: 88, text: '同频共振，彼此一眼就懂' },
    { d: 1, score: 72, text: '相邻而居，互补大于相似' },
    { d: 2, score: 85, text: '相处轻松，好朋友转正的潜力股' },
    { d: 3, score: 65, text: '互相较劲，爱恨交加' },
    { d: 4, score: 93, text: '天生一对，同气连枝的默契' },
    { d: 5, score: 68, text: '需要磨合，互补得恰到好处时很惊艳' },
    { d: 6, score: 75, text: '对宫相吸，相爱相杀的宿命感' },
    { d: 7, score: 68, text: '需要磨合，互补得恰到好处时很惊艳' },
    { d: 8, score: 93, text: '天生一对，同气连枝的默契' },
    { d: 9, score: 65, text: '互相较劲，爱恨交加' },
    { d: 10, score: 85, text: '相处轻松，好朋友转正的潜力股' },
    { d: 11, score: 72, text: '相邻而居，互补大于相似' }
];

function compatList(signIdx) {
    return COMPAT_RULES
        .map((r) => ({ sign: (signIdx + r.d) % 12, score: r.score, text: r.text }))
        .sort((a, b) => b.score - a.score);
}

document.addEventListener('DOMContentLoaded', () => new ZodiacApp());
