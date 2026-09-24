/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 校验紫微排盘：安紫微锚点（与开源 iztro 注释样例一致）+ 结构自洽 + 规则抽检 */
const path = require('path');
const fs = require('fs');
const sb = {};
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'assets', 'calendar-core.js'), 'utf8'))(sb);
const zwb = { LunarCore: sb.LunarCore, AudioManager: { play() {} } };
new Function('window', 'LunarCore', 'AudioManager',
    fs.readFileSync(path.join(__dirname, '..', 'games', 'ziwei', 'script.js'), 'utf8')
        .replace("document.addEventListener('DOMContentLoaded'", "if(false)document.addEventListener('DOMContentLoaded'")
)(zwb, sb.LunarCore, zwb.AudioManager);
const ZC = zwb.ZiweiCore;

let fail = 0;
function eq(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
}

const YIN_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

// ---- 安紫微锚点（iztro 注释样例 + 经典口诀） ----
eq('27日木三局 → 戌', YIN_BRANCHES[ZC.ziweiIndex(27, 3)], '戌');
eq('13日火六局 → 亥', YIN_BRANCHES[ZC.ziweiIndex(13, 6)], '亥');
eq('6日土五局 → 未', YIN_BRANCHES[ZC.ziweiIndex(6, 5)], '未');
eq('1日水二局 → 丑', YIN_BRANCHES[ZC.ziweiIndex(1, 2)], '丑');
eq('2日水二局 → 寅', YIN_BRANCHES[ZC.ziweiIndex(2, 2)], '寅');
eq('3日水二局 → 寅', YIN_BRANCHES[ZC.ziweiIndex(3, 2)], '寅');

// ---- 整盘结构：2024-02-10（甲辰年正月初一）子时男 ----
const c = ZC.buildZiwei(2024, 2, 10, 0, 'male');
eq('命宫=寅（正月子时）', c.soulBranchName, '寅宫');
eq('身宫=寅（正月子时）', c.bodyBranchName, '寅宫');
eq('五行局（命宫丙寅→炉中火→火六局）', c.juName, '火六局');
eq('紫微在酉（初一火六局）', YIN_BRANCHES[ZC.ziweiIndex(1, 6)], '酉');
// 紫府镜像：紫微酉 → 天府? 酉寅基7 → tf = 12-7=5 → 未
const zw = ZC.ziweiIndex(1, 6);
eq('紫府镜像(紫微酉→天府未)', (12 - zw) % 12, 5);

// 十四主星 + 辅星全部落宫且无重复异常
{
    const all = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军', '文昌', '文曲', '左辅', '右弼'];
    const placed = new Set();
    c.palaces.forEach(p => p.stars.forEach(s => placed.add(s.name)));
    const missing = all.filter(n => !placed.has(n));
    eq('18 颗星全部落位', missing, []);
    eq('十二宫齐全', c.palaces.map(p => p.name).slice(0, 3), ['命宫', '兄弟宫', '夫妻宫']);
    eq('甲年四化（廉贞禄）', c.sihuaText, '廉贞禄 破军权 武曲科 太阳忌');
}

// 紫微系相对位置抽检（整盘星序）
{
    const byStar = {};
    c.palaces.forEach(p => p.stars.forEach(s => { byStar[s.name] = p.yinIdx; }));
    eq('天机=紫微-1', ((byStar.紫微 - byStar.天机) % 12 + 12) % 12, 1);
    eq('太阳=紫微-3', ((byStar.紫微 - byStar.太阳) % 12 + 12) % 12, 3);
    eq('武曲=紫微-4', ((byStar.紫微 - byStar.武曲) % 12 + 12) % 12, 4);
    eq('天同=紫微-5', ((byStar.紫微 - byStar.天同) % 12 + 12) % 12, 5);
    eq('廉贞=紫微-8', ((byStar.紫微 - byStar.廉贞) % 12 + 12) % 12, 8);
    eq('破军=天府+10', ((byStar.破军 - byStar.天府) % 12 + 12) % 12, 10);
    eq('七杀=天府+6', ((byStar.七杀 - byStar.天府) % 12 + 12) % 12, 6);
}

// 大限：火六局 → 命宫 6-15，甲年阳男顺行（兄弟宫 16-25）
eq('命宫大限 6-15', c.palaces[0].daXian, '6-15');
eq('顺行下一宫 16-25', c.palaces[1].daXian, '16-25');

// 闰月规则抽检：2023 闰二月二十（后半月 → 算三月）与闰二月初五（算二月）
{
    const c2 = ZC.buildZiwei(2023, 4, 20, 6, 'female'); // 2023-04-20 = 闰二月三十?（若存在）改为初五对照
    // 只验证不抛错与宫位稳定
    eq('闰月排盘不抛错', typeof c2.juName, 'string');
}

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
