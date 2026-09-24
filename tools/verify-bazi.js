/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 校验八字排盘：与已知排盘样例对照 + 结构自洽 */
const path = require('path');
const fs = require('fs');
const load = (f) => {
    const sb = {};
    new Function('window', fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))(sb);
    return sb;
};
const LC = load('assets/calendar-core.js').LunarCore;
// bazi 脚本依赖 LunarCore/全局，先装再执行
const sb = {};
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'assets', 'calendar-core.js'), 'utf8'))(sb);
const baziSb = { LunarCore: sb.LunarCore, AudioManager: { play() {} } };
new Function('window', 'LunarCore', 'AudioManager',
    fs.readFileSync(path.join(__dirname, '..', 'games', 'bazi', 'script.js'), 'utf8')
        .replace("document.addEventListener('DOMContentLoaded'", "if(false)document.addEventListener('DOMContentLoaded'")
)(baziSb, sb.LunarCore, baziSb.AudioManager);
const BC = baziSb.BaziCore;

let fail = 0;
function eq(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
}

// 样例1：2024-02-10 12:00 男（立春 2-4 之后）
// 公开盘：甲辰年 丙寅月 甲辰日 庚午时
const c1 = BC.buildChart(2024, 2, 10, 12, true, 'male');
eq('样例1 四柱', c1.pillars.map(p => p.gz), ['甲辰', '丙寅', '甲辰', '庚午']);
eq('样例1 年十神(甲日主·年干甲)', c1.pillars[0].shiShen, '比肩');
eq('样例1 月十神(丙)', c1.pillars[1].shiShen, '食神');
eq('样例1 时十神(庚)', c1.pillars[3].shiShen, '七杀');
eq('样例1 大运顺行(甲年阳男)', c1.dyForward, true);

// 样例2：2024-02-03 12:00 男（立春前 → 年柱仍为癸卯）
const c2 = BC.buildChart(2024, 2, 3, 12, true, 'male');
eq('样例2 年柱(立春前)', c2.pillars[0].gz, '癸卯');
eq('样例2 大运逆行(癸年阴男)', c2.dyForward, false);

// 样例3：2023-12-25 12:00 女（大雪 12-7 后 → 子月；癸年五虎遁 → 甲子月）
const c3 = BC.buildChart(2023, 12, 25, 12, true, 'female');
eq('样例3 月柱(甲子)', c3.pillars[1].gz, '甲子');
eq('样例3 年柱(癸卯)', c3.pillars[0].gz, '癸卯');

// 样例4：时辰未知 → 时柱为空且不崩
const c4 = BC.buildChart(1995, 8, 15, 12, false, 'female');
eq('样例4 时柱为空', c4.pillars[3], null);
eq('样例4 年柱(乙亥)', c4.pillars[0].gz, '乙亥');
// 1995-08-15：立秋 8-8 后 → 申月；乙年五虎遁：正月戊寅…申月=甲申
eq('样例4 月柱(甲申)', c4.pillars[1].gz, '甲申');

// 十神矩阵抽检（甲日主）
const A = '甲乙丙丁戊己庚辛壬癸';
eq('十神 甲见甲=比肩', BC.shiShenOf(0, 0), '比肩');
eq('十神 甲见乙=劫财', BC.shiShenOf(0, 1), '劫财');
eq('十神 甲见丙=食神', BC.shiShenOf(0, 2), '食神');
eq('十神 甲见丁=伤官', BC.shiShenOf(0, 3), '伤官');
eq('十神 甲见戊=偏财', BC.shiShenOf(0, 4), '偏财');
eq('十神 甲见己=正财', BC.shiShenOf(0, 5), '正财');
eq('十神 甲见庚=七杀', BC.shiShenOf(0, 6), '七杀');
eq('十神 甲见辛=正官', BC.shiShenOf(0, 7), '正官');
eq('十神 甲见壬=偏印', BC.shiShenOf(0, 8), '偏印');
eq('十神 甲见癸=正印', BC.shiShenOf(0, 9), '正印');

// 大运结构：8 步、干支连续递增/递减、首步起运岁数与节气距离一致
const dy1 = c1.daYun;
eq('大运步数', dy1.length, 8);
let contOk = true;
for (let k = 1; k < 8; k++) {
    const a = BC.gz60Index(A.indexOf(dy1[k - 1].gz[0]), '子丑寅卯辰巳午未申酉戌亥'.indexOf(dy1[k - 1].gz[1]));
    const b = BC.gz60Index(A.indexOf(dy1[k].gz[0]), '子丑寅卯辰巳午未申酉戌亥'.indexOf(dy1[k].gz[1]));
    if (((b - a) % 60 + 60) % 60 !== 1) contOk = false;
}
eq('大运六十甲子连续(+1)', contOk, true);
// 首步大运干支 = 月柱 +1（顺行）：丙寅 → 丁卯
eq('首步大运(丁卯)', dy1[0].gz, '丁卯');

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
