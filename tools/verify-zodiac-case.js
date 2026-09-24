/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 独立复算：1995-08-15 10:30 北京的日/月/升星座（与页面结果核对） */
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
const NAMES = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
const jd = toJD(1995, 8, 15, 10.5 - 8);
const sun = sunLongitude(toJD(1995, 8, 15, 12));
const moon = moonLongitude(jd);
const asc = ascendant((gmstDeg(jd) + 116.41) % 360, 39.90);
console.log('太阳黄经', sun.toFixed(2), '→', NAMES[Math.floor(sun / 30)]);
console.log('月亮黄经', moon.toFixed(2), '→', NAMES[Math.floor(moon / 30)]);
console.log('上升黄经', asc.toFixed(2), '→', NAMES[Math.floor(asc / 30)], '｜下降 →', NAMES[(Math.floor(asc / 30) + 6) % 12]);
