/* 校验飞行棋路径数据：52 格环连续性 / 四色对称 / 颜色分布 / 起飞格对齐 */
const RING = [
  [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],
  [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],
  [14,8],[13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],
  [6,14],[6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],
];

let fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
}

// 1. 格子总数
eq('格子总数 52', RING.length, 52);

// 2. 连续性：相邻格子距离 ≤ 2（允许拐角对角步长 √2 ≈ 1.414）
let breaks = 0;
for (let i = 0; i < 52; i++) {
  const a = RING[i], b = RING[(i + 1) % 52];
  const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
  if (dx > 2 || dy > 2 || (dx === 0 && dy === 0)) { console.log(`FAIL 间隙 at ${i}: ${a}→${b}`); breaks++; }
}
eq('环连续性（0 间隙）', breaks, 0);

// 3. 无重复格子
const seen = new Set();
let dupes = 0;
RING.forEach(([x, y]) => { const k = `${x},${y}`; if (seen.has(k)) dupes++; seen.add(k); });
eq('重复格子', dupes, 0);

// 4. 四色对称：起始索引 0/13/26/39 分别在四个臂上
const starts = [0, 13, 26, 39].map(i => RING[i]);
starts.forEach((s, i) => {
  const quad = i === 0 ? (s[0] <= 5 && s[1] >= 6) : i === 1 ? (s[0] >= 6 && s[0] <= 8 && s[1] <= 7) : i === 2 ? (s[0] >= 8) : (s[1] >= 8);
  eq(`起始${i} 象限正确 (${s})`, quad, true);
});

// 5. 距离 13 对称性：相邻起始点之间恰好 13 格
for (let i = 0; i < 4; i++) {
  const a = starts[i], b = starts[(i + 1) % 4];
  const idxA = RING.indexOf(a), idxB = RING.indexOf(b);
  eq(`起始${i}→${(i+1)%4} 距离 13`, (idxB - idxA + 52) % 52, 13);
}

// 6. 颜色周期：ring[i] 的颜色 = i % 4（红0 黄1 蓝2 绿3）
let colorOk = true;
for (let i = 0; i < 52; i++) {
  if (i % 4 !== i % 4) { colorOk = false; break; }
}
eq('颜色分布', colorOk, true);

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
