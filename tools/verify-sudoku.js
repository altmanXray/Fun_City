/* FHDCC · LittleGame | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
// 数独唯一解生成验证：与 games/sudoku/script.js 相同的算法副本
const settings = { easy: 40, medium: 30, hard: 25, expert: 20 };

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValid(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
    if (board[x][col] === num) return false;
  }
  const sr = Math.floor(row / 3) * 3;
  const sc = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[sr + i][sc + j] === num) return false;
  return true;
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (const num of shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(board, limit) {
  let count = 0;
  const solve = () => {
    if (count >= limit) return;
    let er = -1, ec = -1;
    for (let row = 0; row < 9 && er === -1; row++) {
      for (let col = 0; col < 9; col++) if (board[row][col] === 0) { er = row; ec = col; break; }
    }
    if (er === -1) { count++; return; }
    for (let num = 1; num <= 9; num++) {
      if (isValid(board, er, ec, num)) {
        board[er][ec] = num;
        solve();
        board[er][ec] = 0;
        if (count >= limit) return;
      }
    }
  };
  solve();
  return count;
}

function generate(clues) {
  const solution = Array(9).fill(null).map(() => Array(9).fill(0));
  fillBoard(solution);
  const board = solution.map((r) => [...r]);
  const positions = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push({ r, c });
  shuffleArray(positions);
  let removed = 0;
  const target = 81 - clues;
  for (let i = 0; i < positions.length && removed < target; i++) {
    const { r, c } = positions[i];
    const backup = board[r][c];
    board[r][c] = 0;
    if (countSolutions(board, 2) === 1) removed++;
    else board[r][c] = backup;
  }
  return { board, solution, cluesLeft: 81 - removed };
}

let allOk = true;
for (const [name, clues] of Object.entries(settings)) {
  const times = [];
  const results = [];
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now();
    const { board, solution, cluesLeft } = generate(clues);
    times.push(Date.now() - t0);
    const solCount = countSolutions(board, 3);
    // 验证题目确实可由原解填充（一致性）
    let consistent = true;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) consistent = false;
    results.push({ solCount, cluesLeft, consistent });
  }
  const uniq = results.every((x) => x.solCount === 1);
  const cons = results.every((x) => x.consistent);
  const minClues = Math.min(...results.map((x) => x.cluesLeft));
  const maxClues = Math.max(...results.map((x) => x.cluesLeft));
  const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
  const maxT = Math.max(...times);
  console.log(`${name}: 唯一解 ${uniq ? '✓' : '✗'} | 与原解一致 ${cons ? '✓' : '✗'} | 提示数 ${minClues}~${maxClues}（目标 ${clues}） | 平均 ${avg}ms 最长 ${maxT}ms`);
  if (!uniq || !cons) allOk = false;
}
console.log(allOk ? '\n全部通过：所有难度生成的谜题均唯一解' : '\n存在失败！');
process.exit(allOk ? 0 : 1);
