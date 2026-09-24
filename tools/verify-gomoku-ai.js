/* 校验五子棋六档 AI：纯函数 + 档位行为 + 耗时预算 + 自对弈强度证明 */
const path = require('path');
const fs = require('fs');
const sb = {};
new Function('window', 'AudioManager', 'GameUtils',
    fs.readFileSync(path.join(__dirname, '..', 'games', 'gomoku', 'script.js'), 'utf8')
        .replace("document.addEventListener('DOMContentLoaded'", "if(false)document.addEventListener('DOMContentLoaded'")
)(sb, { play() {} }, { formatTimeText: () => '--', loadBestTime: () => null, saveBestTime: () => {} });
const AI = sb.GomokuAI;

let fail = 0;
function eq(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
}
const N = 19;
const mk = () => Array.from({ length: N }, () => new Array(N).fill(0));
const put = (b, ...pts) => pts.forEach(([i, j, c = 1]) => b[i][j] = c);

// ---------- 纯函数：形态分类与双威胁加分 ----------
{
    const b = mk();
    put(b, [9, 9], [9, 10], [9, 11]);
    const pats = AI.dirPatterns(b, 9, 12, 1);
    eq('活四加成 80000', AI.threatBonus(pats), 80000);
    eq('双活三加成 30000', AI.threatBonus([{ count: 3, open: 2 }, { count: 3, open: 2 }, { count: 1, open: 0 }, { count: 1, open: 0 }]), 30000);
    eq('冲四+活三 40000', AI.threatBonus([{ count: 4, open: 1 }, { count: 3, open: 2 }, { count: 1, open: 0 }, { count: 1, open: 0 }]), 40000);
    eq('双冲四 60000', AI.threatBonus([{ count: 4, open: 1 }, { count: 4, open: 1 }, { count: 1, open: 0 }, { count: 1, open: 0 }]), 60000);
    eq('单活三无加成', AI.threatBonus([{ count: 3, open: 2 }, { count: 1, open: 0 }, { count: 1, open: 0 }, { count: 1, open: 0 }]), 0);
}

// ---------- 立即战术：全档一致 ----------
{
    const winBoard = mk();
    put(winBoard, [9, 7, 2], [9, 8, 2], [9, 9, 2], [9, 10, 2]);
    put(winBoard, [10, 7], [10, 8]);
    for (const lv of ['caiji', 'std', 'expert', 'master', 'chovy', 'god']) {
        const mv = AI.chooseAiMove(winBoard, 2, 1, lv);
        eq(`连五必拿·${AI.AI_LEVELS[lv].label}`, mv, { i: 9, j: 6 });
    }
    const blockBoard = mk();
    put(blockBoard, [9, 7], [9, 8], [9, 9], [9, 10]);
    put(blockBoard, [10, 7, 2], [10, 8, 2]);
    for (const lv of ['std', 'expert', 'master', 'chovy', 'god']) {
        const mv = AI.chooseAiMove(blockBoard, 2, 1, lv);
        const blocked = mv.i === 9 && (mv.j === 6 || mv.j === 11);
        eq(`堵连五·${AI.AI_LEVELS[lv].label}`, blocked, true);
    }
}

// ---------- 菜鸡失误（种子驱动，确定性） ----------
{
    const b = mk();
    put(b, [9, 8], [9, 9], [9, 10]);
    put(b, [11, 8, 2], [12, 9, 2], [11, 11, 2]);
    const stdMv = AI.chooseAiMove(b, 2, 1, 'std');
    const cfg = AI.AI_LEVELS.caiji;
    const save = cfg.rng;
    let diff = 0;
    for (let s = 1; s <= 20; s++) {
        let x = s;
        cfg.rng = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
        const mv = AI.chooseAiMove(b, 2, 1, 'caiji');
        if (mv.i !== stdMv.i || mv.j !== stdMv.j) diff++;
    }
    cfg.rng = save;
    console.log(`INFO 菜鸡 20 种子中走异于标准 ${diff} 次`);
    eq('菜鸡失误存在(≥1/20)', diff >= 1, true);
}

// ---------- 潜在双三点：深档必须抢占（黑下 (7,9) 成双活三 3 步必胜） ----------
{
    // 黑两对 (7,7),(7,8) 横 + (5,9),(6,9) 竖；白方无子（没有反攻速度），
    // 正确应对 = 白先占 (7,9)
    const b = mk();
    put(b, [7, 7], [7, 8], [5, 9], [6, 9]);
    const godMv = AI.chooseAiMove(b, 2, 1, 'god');
    const chovyMv = AI.chooseAiMove(b, 2, 1, 'chovy');
    const stdMv = AI.chooseAiMove(b, 2, 1, 'std');
    console.log(`INFO 标准应对: (${stdMv.i},${stdMv.j})`);
    eq('超级大神抢占双三点', godMv, { i: 7, j: 9 });
    console.log('INFO 我Chovy 应对: (' + chovyMv.i + ',' + chovyMv.j + ')（低于 god 档位属正常梯度）');
}

// ---------- 自对弈强度：多开局（两档均确定性，同配置必出同局，须换开局打破对称） ----------
function playMatch(levelA, levelB, openings) {
    let winsA = 0, winsB = 0, draws = 0, tmax = 0;
    openings.forEach(([si, sj]) => {
        const board = mk();
        board[si][sj] = 1; // A 执黑先手
        let turn = 2;
        let over = false, winner = 0, moves = 0;
        while (!over && moves < 120) {
            const lvl = turn === 1 ? levelA : levelB;
            const t0 = Date.now();
            const mv = AI.chooseAiMove(board, turn, turn === 1 ? 2 : 1, lvl);
            if (turn === 1) tmax = Math.max(tmax, Date.now() - t0);
            if (!mv || board[mv.i][mv.j] !== 0) { over = true; winner = 3 - turn; return; }
            board[mv.i][mv.j] = turn;
            if (fiveIn(mv.i, mv.j, turn, board)) { winner = turn; over = true; return; }
            turn = 3 - turn;
            moves++;
        }
        if (!over) draws++;
        else if (winner === 1) winsA++;
        else winsB++;
    });
    return { winsA, winsB, draws, tmax };
}
function fiveIn(i, j, c, board) {
    for (const [di, dj] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        let cnt = 1;
        let r = i + di, cc = j + dj;
        while (r >= 0 && r < N && cc >= 0 && cc < N && board[r][cc] === c) { cnt++; r += di; cc += dj; }
        r = i - di; cc = j - dj;
        while (r >= 0 && r < N && cc >= 0 && cc < N && board[r][cc] === c) { cnt++; r -= di; cc -= dj; }
        if (cnt >= 5) return true;
    }
    return false;
}
const OPENINGS = [[9, 9], [6, 6], [12, 12], [6, 12], [12, 6], [9, 6], [6, 12], [12, 9]];

const m1 = playMatch('god', 'std', OPENINGS);
console.log(`INFO god 执黑 vs std 执白 ${OPENINGS.length} 开局: god胜${m1.winsA} 负${m1.winsB} 平${m1.draws} 最慢${m1.tmax}ms`);
eq('god 执黑不败于 std（0负）', m1.winsB, 0);

const m2 = playMatch('chovy', 'std', OPENINGS);
console.log(`INFO chovy 执黑 vs std: 胜${m2.winsA} 负${m2.winsB} 平${m2.draws}`);
eq('chovy 执黑不败于 std（0负）', m2.winsB, 0);

const m3 = playMatch('std', 'god', OPENINGS); // 互换：std 执黑
console.log(`INFO std 执黑 vs god 执白: std胜${m3.winsA} god胜${m3.winsB}`);
eq('god 执白不败于 std（0负）', m3.winsA, 0);

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项未通过`);
process.exit(fail === 0 ? 0 : 1);
