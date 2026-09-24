/* 一次性工具：给源码文件批量加 FHDCC 版权标识（幂等，重复运行会跳过已标记文件） */
const fs = require('fs');
const path = require('path');

const MARK = 'FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。';
const JS_CSS = `/* ${MARK} */\n`;
const HTML = `<!--\n  ${MARK}\n-->\n`;

const files = [
  'index.html', 'script.js', 'style.css',
  'assets/theme.css', 'assets/util.js', 'assets/player.js', 'assets/audio.js', 'assets/features.js',
  'assets/calendar-core.js',
  'games/schulte/index.html', 'games/schulte/script.js', 'games/schulte/style.css',
  'games/sudoku/index.html', 'games/sudoku/script.js', 'games/sudoku/style.css',
  'games/memory/index.html', 'games/memory/script.js', 'games/memory/style.css',
  'games/2048/index.html', 'games/2048/script.js', 'games/2048/style.css',
  'games/gomoku/index.html', 'games/gomoku/script.js', 'games/gomoku/style.css',
  'games/mbti/index.html', 'games/mbti/script.js', 'games/mbti/style.css',
  'games/zodiac/index.html', 'games/zodiac/script.js', 'games/zodiac/style.css',
  'games/calendar/index.html', 'games/calendar/script.js', 'games/calendar/style.css',
  'games/bazi/index.html', 'games/bazi/script.js', 'games/bazi/style.css',
  'games/ziwei/index.html', 'games/ziwei/script.js', 'games/ziwei/style.css',
  'tools/build-poems.js', 'tools/verify-poems.js', 'tools/verify-sudoku.js',
  'tools/verify-calendar.js', 'tools/verify-bazi.js', 'tools/verify-ziwei.js',
  'tools/verify-zodiac-astro.js', 'tools/verify-zodiac-case.js', 'tools/add-mark.js'
];

const ROOT = path.resolve(__dirname, '..');
let ok = 0, skip = 0;
for (const f of files) {
  const p = path.join(ROOT, f);
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('FHDCC')) { skip++; continue; }
  if (f.endsWith('.html')) {
    t = t.replace(/^<!DOCTYPE html>\r?\n/i, (m) => m + HTML);
  } else {
    t = JS_CSS + t;
  }
  fs.writeFileSync(p, t, 'utf8');
  ok++;
}
console.log(`marked: ${ok}, skipped: ${skip}`);
let missing = 0, badBytes = 0;
for (const f of files) {
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (!t.includes('FHDCC')) { console.log('MISS:', f); missing++; }
  if ((t.match(/\uFFFD/g) || []).length) { console.log('BAD BYTES:', f); badBytes++; }
}
console.log(`verify: missing=${missing} badBytes=${badBytes}`);
