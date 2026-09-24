/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/**
 * Fun City 历法核心库：公历↔农历互转、干支、二十四节气、节日、建除十二神
 * 供 万年历 / 八字 / 紫微 页面共用；在页面 script.js 之前引入。
 * 数据：1900-2100 紧凑农历表（公版数据，多实现交叉验证）；节气由太阳黄经牛顿迭代求解。
 */
(function () {
    'use strict';

    // 农历年信息表（1900-2100）：0xf 位闰月月份（0 无闰），0x10000 位闰月大小，
    // 0x8000..0x10 十二位为正月至腊月大小（1=30 天大月，0=29 天小月）
    const LUNAR_INFO = [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
        0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
        0x0d520
    ];

    const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const DAY_PRE = ['初', '十', '廿', '三'];

    // 节气：从立春起按黄经 315° 步进 15°
    const TERM_NAMES = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
        '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪',
        '大雪', '冬至', '小寒', '大寒'];
    // 十二节（换月柱用）：立春 惊蛰 清明 立夏 芒种 小暑 立秋 白露 寒露 立冬 大雪 小寒
    const JIE_INDEX = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    const RAD = Math.PI / 180;

    // ---------- 农历基础 ----------
    function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
    function leapDays(y) { return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
    function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
    function yearDays(y) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
        return sum + leapDays(y);
    }

    // 真·儒略日（JD，从 -4712-01-01 12:00 UT 起连续计数；h 为 UT 小时）
    function toJDN(y, m, d, h = 12) {
        if (m <= 2) { y -= 1; m += 12; }
        const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + h / 24;
    }
    // JD → 公历（UT）；返回 {y, m, d}
    function fromJDN(jd) {
        const z = Math.floor(jd + 0.5);
        const f = jd + 0.5 - z;
        let a = z;
        if (z >= 2299161) {
            const alpha = Math.floor((z - 1867216.25) / 36524.25);
            a = z + 1 + alpha - Math.floor(alpha / 4);
        }
        const b = a + 1524;
        const c = Math.floor((b - 122.1) / 365.25);
        const dd = Math.floor(365.25 * c);
        const e = Math.floor((b - dd) / 30.6001);
        const dayF = b - dd - Math.floor(30.6001 * e) + f;
        const month = e < 14 ? e - 1 : e - 13;
        const year = month > 2 ? c - 4716 : c - 4715;
        return { y: year, m: month, d: Math.floor(dayF) };
    }

    // 公历 → 农历（返回 {year, month, day, isLeap, monthName, dayName, yearGanZhi, animal}；月从 1 起）
    function solarToLunar(y, m, d) {
        const base = toJDN(1900, 1, 31); // 农历 1900 年正月初一
        let offset = toJDN(y, m, d) - base;
        if (offset < 0) return null;

        let ly = 1900;
        for (; ly <= 2100; ly++) {
            const days = yearDays(ly);
            if (offset < days) break;
            offset -= days;
        }
        if (ly > 2100) return null;

        const leap = leapMonth(ly);
        // 展开当年农历月序列：正月至腊月，闰月插在同名月之后，再顺序消耗偏移天数
        const months = [];
        for (let m = 1; m <= 12; m++) {
            months.push({ m, isLeap: false });
            if (m === leap && leap > 0) months.push({ m, isLeap: true });
        }
        let month = 1, isLeap = false;
        for (const mo of months) {
            const md = mo.isLeap ? leapDays(ly) : monthDays(ly, mo.m);
            if (offset < md) { month = mo.m; isLeap = mo.isLeap; break; }
            offset -= md;
        }
        const day = offset + 1;
        return {
            year: ly,
            month,
            day,
            isLeap,
            monthName: (isLeap ? '闰' : '') + MONTH_NAMES[month - 1] + '月',
            dayName: lunarDayName(day),
            yearGanZhi: ganZhi60((ly - 4) % 60),
            animal: ANIMALS[(ly - 4) % 12]
        };
    }

    function lunarDayName(day) {
        const pre = DAY_PRE[Math.floor((day - 1) / 10)];
        const ones = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        const n = ((day - 1) % 10) + 1;
        if (day === 10) return '初十';
        if (day === 20) return '二十';
        if (day === 30) return '三十';
        return pre + ones[n - 1];
    }

    function ganZhi60(idx) {
        idx = ((idx % 60) + 60) % 60;
        return STEMS[idx % 10] + BRANCHES[idx % 12];
    }

    // ---------- 干支历 ----------
    // 日干支：锚点 2000-01-01（正午 JD 2451545）= 戊午（六十甲子第 54 位，甲子=0）
    function dayGanZhiIndex(y, m, d) {
        return ((Math.round(toJDN(y, m, d)) + 49) % 60 + 60) % 60;
    }
    function dayGanZhi(y, m, d) {
        return ganZhi60(dayGanZhiIndex(y, m, d));
    }

    // 时干支（五鼠遁）：hour 取 0-23，23 点起子时
    function hourGanZhi(y, m, d, hour) {
        const dayIdx = dayGanZhiIndex(y, m, d);
        const hBranch = Math.floor(((hour + 1) % 24) / 2); // 23-1 子=0
        const hStem = (dayIdx % 10 * 2 + hBranch) % 10;
        return STEMS[hStem] + BRANCHES[hBranch];
    }

    // ---------- 节气（太阳黄经牛顿迭代） ----------
    function sunLongitude(jd) {
        const T = (jd - 2451545.0) / 36525;
        const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
        return ((L0 + C) % 360 + 360) % 360;
    }

    // 太阳视黄经 = 几何黄经 + 章动 − 光行差（用于节气时刻，精度约 ±5 分钟）
    function sunApparentLongitude(jd) {
        const T = (jd - 2451545.0) / 36525;
        const omega = (125.04 - 1934.136 * T) * RAD; // 月球升交点黄经
        const nutation = -0.00478 * Math.sin(omega);
        return ((sunLongitude(jd) + nutation - 0.00569) % 360 + 360) % 360;
    }

    // 求某公历年份内 24 节气的北京时间；返回 [{name, y, m, d, hh, mm, jd}]
    // 内部辅助：JD → 公历年份
    function LC_fromJDNYear(jd) {
        return fromJDN(Math.floor(jd + 0.5)).y;
    }
    function solarTermsOfYear(year) {
        const out = [];
        for (let i = 0; i < 24; i++) {
            const target = ((315 + i * 15) % 360);
            // 初值：当年春分点附近（黄经 0° 约在 3 月 20 日，JD 2451623.75），按目标黄经回推天数
            // 春分基准 + 黄经差/日速 —— 保证初值落在目标节气 ±3 天内，牛顿迭代不会跳到相邻节气
            let jd = 2451623.75 + (year - 2000) * 365.2425 + target / 0.98565;
            // 逼近到目标年（JD 对应年可能差一年时平移）
            const yOf = (j) => LC_fromJDNYear(j);
            let guard = 0;
            while (yOf(jd) !== year && guard++ < 3) {
                jd += (year - yOf(jd)) * 365.2425;
            }
            for (let k = 0; k < 10; k++) {
                let diff = sunApparentLongitude(jd) - target;
                diff = ((diff + 180) % 360 + 360) % 360 - 180;
                if (Math.abs(diff) < 1e-7) break;
                const lon2 = sunApparentLongitude(jd + 0.5);
                let speed = lon2 - sunApparentLongitude(jd - 0.5);
                speed = ((speed + 180) % 360 + 360) % 360 - 180;
                jd -= diff / speed;
            }
            // 归到北京时间的公历日期：bj 从当日 0 点起算的“简化 JD”
            const bj = jd + 8 / 24; // 真 JD（UT）
            const dObj = fromJDN(bj); // 含当日 0 时判断：frac 为日内比例
            const fracDay = bj + 0.5 - Math.floor(bj + 0.5);
            const totalMin = Math.round(fracDay * 24 * 60);
            if (dObj.y === year) {
                out.push({
                    name: TERM_NAMES[i],
                    y: dObj.y, m: dObj.m, d: dObj.d,
                    hh: Math.floor(totalMin / 60) % 24,
                    mm: totalMin % 60,
                    jd
                });
            }
        }
        return out;
    }

    // ---------- 节日 ----------
    const SOLAR_FESTIVALS = {
        '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '4-1': '愚人节',
        '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节', '8-1': '建军节',
        '9-10': '教师节', '10-1': '国庆节', '12-24': '平安夜', '12-25': '圣诞节'
    };
    const LUNAR_FESTIVALS = {
        '1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '5-5': '端午节',
        '7-7': '七夕节', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节',
        '10-1': '寒衣节', '12-8': '腊八节', '12-23': '小年'
    };

    // ---------- 建除十二神（民俗趣味，参考性质） ----------
    const JIANCHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
    const JIANCHU_TEXT = {
        建: { yi: '出行、上任、拜师', ji: '动土、开仓' },
        除: { yi: '扫除、祛病、解除', ji: '嫁娶、远行' },
        满: { yi: '祭祀、祈福、结亲', ji: '服药、栽种' },
        平: { yi: '修整、和解、修路', ji: '开业、祈福' },
        定: { yi: '订婚、签约、安床', ji: '诉讼、出行' },
        执: { yi: '捕捉、求职、守约', ji: '搬迁、开市' },
        破: { yi: '破屋、求医', ji: '诸事不宜（大事勿用）' },
        危: { yi: '安床、祭祀', ji: '登高、行船' },
        成: { yi: '开业、嫁娶、入学', ji: '诉讼、安葬' },
        收: { yi: '纳财、收租、入宅', ji: '放债、开市' },
        开: { yi: '开业、开工、动土', ji: '安葬、破土' },
        闭: { yi: '安葬、修坟、收敛', ji: '开市、出行' }
    };

    /**
     * 某日的建除十二神。
     * monthBranch：节气月的月支（寅月起于立春）；dayBranchIdx：日支序（子=0）
     */
    function jianChu(monthBranchIdx, dayBranchIdx) {
        const idx = ((dayBranchIdx - monthBranchIdx) % 12 + 12) % 12;
        const shen = JIANCHU[idx];
        return { shen, ...JIANCHU_TEXT[shen] };
    }

    // ---------- 纳音（六十甲子每对两柱，按序 30 对） ----------
    const NAYIN_NAMES = [
        '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
        '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '砂中金', '山下火', '平地木', '壁上土', '金箔金',
        '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'
    ];
    // 干支六十序号 → 纳音全名
    function nayinName(gzIdx) {
        return NAYIN_NAMES[Math.floor((((gzIdx % 60) + 60) % 60) / 2)];
    }

    window.LunarCore = {
        LUNAR_INFO, STEMS, BRANCHES, ANIMALS, MONTH_NAMES, TERM_NAMES, JIE_INDEX,
        leapMonth, leapDays, monthDays, yearDays,
        solarToLunar, lunarDayName, ganZhi60,
        toJDN, fromJDN, dayGanZhi, dayGanZhiIndex, hourGanZhi,
        sunLongitude, solarTermsOfYear,
        nayinName, NAYIN_NAMES,
        SOLAR_FESTIVALS, LUNAR_FESTIVALS,
        jianChu
    };
})();
