/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 校验星座页天文算法：与已知天文数值/公开星历对照 */
const RAD = Math.PI / 180;

function toJD(y, m, d, h) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + h / 24;
}

function sunLongitude(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    return ((L0 + C) % 360 + 360) % 360;
}

function moonLongitude(jd) {
    const T = (jd - 2451545) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const s = (x) => Math.sin(x * RAD);
    const lon = Lp
        + 6.288774 * s(Mp) + 1.274027 * s(2 * D - Mp) + 0.658314 * s(2 * D) + 0.213618 * s(2 * Mp)
        - 0.185116 * E * s(M) - 0.114332 * s(2 * F) + 0.058793 * s(2 * D - 2 * Mp)
        + 0.057066 * E * s(2 * D - M - Mp) + 0.053322 * s(2 * D + Mp) + 0.045758 * E * s(2 * D - M)
        - 0.040923 * E * s(M - Mp) - 0.034720 * s(D) - 0.030383 * E * s(M + Mp)
        + 0.015327 * s(2 * D - 2 * F) - 0.012528 * s(Mp + 2 * F) + 0.010980 * s(Mp - 2 * F)
        + 0.010675 * s(4 * D - Mp) + 0.010034 * s(3 * Mp) + 0.008548 * s(4 * D - 2 * Mp);
    return ((lon % 360) + 360) % 360;
}

let fail = 0;
const check = (name, got, want, tol) => {
    const diff = Math.min(Math.abs(got - want), 360 - Math.abs(got - want));
    const ok = diff <= tol;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${got.toFixed(3)} want=${want} diff=${diff.toFixed(3)} (tol ${tol})`);
};

// 1. 太阳：2000-01-01 12UT 视黄经 ≈ 280.39°（摩羯 10°）
check('太阳黄经 2000-01-01', sunLongitude(toJD(2000, 1, 1, 12)), 280.39, 0.05);
// 2. 太阳：1992-04-12 0UT ≈ 22.29°（白羊 22°，Meeus 25.b L≈22.30）
check('太阳黄经 1992-04-12', sunLongitude(toJD(1992, 4, 12, 0)), 22.30, 0.05);
// 3. 月亮：Meeus 47.a 完整级数答案 133.163°（1992-04-12 0TD），截断级数容差 0.3°
check('月亮黄经 1992-04-12', moonLongitude(toJD(1992, 4, 12, 0)), 133.163, 0.3);
// 4. 新月检验：2000-01-06 18:14 UT 为已知新月，日月黄经差应 ≈ 0°
const elong = ((moonLongitude(toJD(2000, 1, 6, 18 + 14 / 60)) - sunLongitude(toJD(2000, 1, 6, 18 + 14 / 60))) % 360 + 360) % 360;
check('新月日月黄经差', Math.min(elong, 360 - elong), 0, 1.5);
// 5. 月亮日移 ≈ 13.2°/天
const a = moonLongitude(toJD(2000, 6, 15, 0)), b = moonLongitude(toJD(2000, 6, 16, 0));
check('月亮日移', (b - a + 360) % 360, 13.18, 1.5);
// 6. 太阳分宫：6月21日正午应为双子（黄经约 90°，双子 0-30°区间即 90-120）
const s1 = sunLongitude(toJD(2001, 6, 21, 12));
console.log(`${s1 >= 90 && s1 < 120 ? 'PASS' : 'FAIL'} 夏至太阳黄经落在双子座区间: ${s1.toFixed(2)}`);

// 7. 上升点公式检验
function gmstDeg(jd) {
    const T = (jd - 2451545) / 36525;
    const g = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
    return ((g % 360) + 360) % 360;
}
function ascendant(lst, lat) {
    const eps = 23.4367 * RAD, th = lst * RAD, phi = lat * RAD;
    let asc = Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / RAD;
    return ((asc % 360) + 360) % 360;
}
// 7a. 赤道日出检验：2023-03-20 06:00 UT 格林尼治（赤纬≈0，太阳东方地平），上升点应≈太阳黄经(≈359.7°)
const jdEq = toJD(2023, 3, 20, 6);
const lstEq = gmstDeg(jdEq);
const ascEq = ascendant(lstEq, 0);
const sunEq = sunLongitude(jdEq);
{
    const diff = Math.min(Math.abs(ascEq - sunEq), 360 - Math.abs(ascEq - sunEq));
    const ok = diff < 3;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} 赤道日出上升≈太阳: asc=${ascEq.toFixed(2)} sun=${sunEq.toFixed(2)} diff=${diff.toFixed(2)}`);
}
// 7b. 上升点每 2 小时推进约 1 个星座（30°），全天 24h 恰好走完一圈
{
    let prev = ascendant(gmstDeg(toJD(2000, 6, 15, 0)), 39.9);
    let advances = [];
    for (let h = 2; h <= 24; h += 2) {
        const cur = ascendant(gmstDeg(toJD(2000, 6, 15, h % 24) + (h >= 24 ? 1 : 0)), 39.9);
        advances.push(((cur - prev) % 360 + 360) % 360);
        prev = cur;
    }
    const total = advances.reduce((s, x) => s + x, 0);
    const avg = total / advances.length;
    const ok = avg > 20 && avg < 45 && Math.abs(total - 360) < 5;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} 上升点推进: 均值${avg.toFixed(1)}°/2h 全天合计${total.toFixed(1)}°`);
}

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
