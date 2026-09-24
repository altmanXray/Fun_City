/* 调试：god 对 std 单局，打印 god 每手的评分依据 */
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
const board = mk();
const names = { 1: '黑(std)', 2: '白(god)' };

function five(i, j, c) {
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

let turn = 2; // god 执白后手，std 执黑先手
let over = false;
let blackMoves = [[9, 9], [8, 10], [10, 8], [7, 9], [10, 10], [8, 8]]; // std 的脚本走子
let bi = 0;
for (let ply = 0; ply < 60 && !over; ply++) {
    let mv;
    if (turn === 1) {
        mv = bi < blackMoves.length ? { i: blackMoves[bi][0], j: blackMoves[bi][1] } : AI.chooseAiMove(board, 1, 2, 'std');
        bi++;
        if (board[mv.i][mv.j] !== 0) { /* 被占则找邻近空位 */ for (let dd = 1; dd < 4; dd++) { for (const [di, dj] of [[0, 1], [1, 0], [0, 1], [1, 1]]) { const r = mv.i + di * dd, c = mv.j + dj * dd; if (r >= 0 && r < N && c >= 0 && c < N && board[r][c] === 0) { mv = { i: r, j: c }; } } } }
    } else {
        const t0 = Date.now();
        mv = AI.chooseAiMove(board, 2, 1, 'god');
        console.log(`god手${Math.ceil((ply + 1) / 2)} 耗时${Date.now() - t0}ms → (${mv.i},${mv.j})`);
    }
    if (board[mv.i][mv.j] !== 0) { console.log('非法手，跳过'); continue; }
    board[mv.i][mv.j] = turn;
    console.log(`  ${names[turn]} → (${mv.i},${mv.j})`);
    if (five(mv.i, mv.j, turn)) { console.log(`${names[turn]} 连五获胜`); over = true; break; }
    turn = 3 - turn;
}
