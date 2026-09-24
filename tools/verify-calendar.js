/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 校验历法核心库：农历转换 / 干支 / 节气
   节气参照值仅采用可交叉核实的近年权威时刻（其余用结构自洽性检验） */
const path = require('path');
const src = require('fs').readFileSync(path.join(__dirname, '..', 'assets', 'calendar-core.js'), 'utf8');
const sandbox = {};
new Function('window', src)(sandbox);
const LC = sandbox.LunarCore;

let fail = 0;
function eq(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
}

// ---------- 农历对照 ----------
const cases = [
    [[2024, 2, 10], [2024, 1, 1, false]],
    [[2025, 1, 29], [2025, 1, 1, false]],
    [[2000, 2, 5], [2000, 1, 1, false]],
    [[1949, 10, 1], [1949, 8, 10, false]],
    [[2023, 3, 22], [2023, 2, 1, true]],
    [[2023, 2, 20], [2023, 2, 1, false]],
    [[2020, 5, 23], [2020, 4, 1, true]],
    [[2020, 6, 21], [2020, 5, 1, false]],
    [[2026, 6, 19], [2026, 5, 5, false]],
    [[2024, 9, 17], [2024, 8, 15, false]],
    [[1900, 1, 31], [1900, 1, 1, false]],
];
for (const [[y, m, d], want] of cases) {
    const r = LC.solarToLunar(y, m, d);
    eq(`${y}-${m}-${d} 农历`, r ? [r.year, r.month, r.day, r.isLeap] : null, want);
}
eq('2024 年干支', LC.solarToLunar(2024, 6, 1).yearGanZhi, '甲辰');
eq('1984 年干支', LC.solarToLunar(1984, 6, 1).yearGanZhi, '甲子');

// ---------- 日干支 ----------
eq('日柱 2000-01-01', LC.dayGanZhi(2000, 1, 1), '戊午');
eq('日柱 1949-10-01', LC.dayGanZhi(1949, 10, 1), '甲子');
eq('日柱 2024-02-10', LC.dayGanZhi(2024, 2, 10), '甲辰');

// ---------- 时干支 ----------
eq('时柱 2024-02-10 子时', LC.hourGanZhi(2024, 2, 10, 23), '甲子');
eq('时柱 2024-02-10 午时', LC.hourGanZhi(2024, 2, 10, 12), '庚午');

// ---------- 节气：可靠权威值（近年，多源可查；时刻精度 ±10 分钟内，此处按日+小时校验） ----------
function findTerm(year, name) {
    return LC.solarTermsOfYear(year).find(t => t.name === name);
}
eq('2024 立春(2-4 16:26)', (() => { const t = findTerm(2024, '立春'); return [t.m, t.d, t.hh]; })(), [2, 4, 16]);
eq('2024 冬至(12-21 17:20)', (() => { const t = findTerm(2024, '冬至'); return [t.m, t.d, t.hh]; })(), [12, 21, 17]);
eq('2025 立春(2-3 22:10)', (() => { const t = findTerm(2025, '立春'); return [t.m, t.d, t.hh]; })(), [2, 3, 22]);
eq('2026 春分(3-20 22:46)', (() => { const t = findTerm(2026, '春分'); return [t.m, t.d, t.hh]; })(), [3, 20, 22]);
console.log('INFO 分钟级误差（参考，±10 内）:',
    ['2024 立春', '2024 冬至', '2025 立春', '2026 春分'].map(k => {
        const [y, n] = k.split(' ');
        const t = findTerm(+y, n);
        return `${y}${n} ${t.hh}:${String(t.mm).padStart(2, '0')}`;
    }).join(' | '));

// ---------- 节气结构自洽（全时段 1900-2100 抽样） ----------
let structFail = 0;
for (const year of [1900, 1930, 1955, 1980, 2000, 2024, 2050, 2080, 2100]) {
    const terms = LC.solarTermsOfYear(year);
    if (terms.length !== 24) { console.log(`FAIL ${year} 节气数量 ${terms.length}`); structFail++; continue; }
    // 小寒/大寒落在公历年初，按 jd 排序后检查间隔：14.7~15.8 天
    const sorted = terms.slice().sort((a, b) => a.jd - b.jd);
    let prev = null;
    for (const t of sorted) {
        if (prev !== null) {
            const gap = t.jd - prev;
            if (gap < 14.6 || gap > 15.9) { console.log(`FAIL ${year} ${t.name} 间隔 ${gap.toFixed(2)} 天`); structFail++; break; }
        }
        prev = t.jd;
    }
    // 立春应在 2 月 3-5 日；冬至应在 12 月 21-23 日
    const lc = findTerm(year, '立春');
    const dz = findTerm(year, '冬至');
    if (lc.m !== 2 || lc.d < 3 || lc.d > 5) { console.log(`FAIL ${year} 立春 ${lc.m}-${lc.d}`); structFail++; }
    if (dz.m !== 12 || dz.d < 21 || dz.d > 23) { console.log(`FAIL ${year} 冬至 ${dz.m}-${dz.d}`); structFail++; }
}
if (!structFail) console.log('PASS 节气结构自洽（9 个抽样年份：24 个齐全/间隔/立春冬至日期）');
fail += structFail;

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
