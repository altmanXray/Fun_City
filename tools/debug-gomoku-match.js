/* god vs std 多开局对战：不同开局打破确定性 */
const path = require('path');
const fs = require('fs');
const sb = {};
new Function('window', 'AudioManager', 'GameUtils',
    fs.readFileSync(path.join(__dirname, '..', 'games', 'gomoku', 'script.js'), 'utf8')
        .replace("document.addEventListener('DOMContentLoaded'", "if(false)document.addEventListener('DOMContentLoaded'")
)(sb, { play() {} }, { formatTimeText: () => '--', loadBestTime: () => null, saveBestTime: () => {} });
const AI = sb.GomokuAI;

const N = 19;
const mk = () => Array.from({ length: N }, () => new Array(N).fill(0));

function five(i, j, c, board) {
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

// 5 个不同开局首手（god 执黑先手，首手由 seeds 给定打破对称）
const openings = [[9, 9], [6, 6], [12, 12], [6, 12], [12, 6]];
let wins = 0, losses = 0, draws = 0;
const results = [];
for (const [si, sj] of openings) {
    const board = mk();
    board[si][sj] = 1; // god 先手第一手
    let turn = 2;
    let over = false, winner = 0, moves = 0;
    let tmax = 0;
    while (!over && moves < 120) {
        const lvl = turn === 1 ? 'god' : 'std';
        const t0 = Date.now();
        const mv = AI.chooseAiMove(board, turn, turn === 1 ? 2 : 1, lvl);
        const dt = Date.now() - t0;
        if (turn === 1) tmax = Math.max(tmax, dt);
        if (!mv || board[mv.i][mv.j] !== 0) { over = true; winner = 3 - turn; break; }
        board[mv.i][mv.j] = turn;
        if (five(mv.i, mv.j, turn, board)) { winner = turn; over = true; break; }
        turn = 3 - turn;
        moves++;
    }
    if (!over) draws++;
    else if (winner === 1) wins++;
    else losses++;
    results.push(`开局(${si},${sj}): ${winner === 1 ? 'god胜' : winner === 2 ? 'std胜' : '平'} god最慢手${tmax}ms`);
}
results.forEach(r => console.log(r));
console.log(`god 执黑 ${wins}胜 ${losses}负 ${draws}平（5 开局）`);
process.exit(0);
