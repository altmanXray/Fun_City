// 输出质检：重名、名篇全文、游戏端对齐模拟
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('D:/AIwork/little game/games/schulte/poems-tang300.json', 'utf8'));
const HAN_RE = /[\u4e00-\u9fff]/;
const GAME_PUNCT = /[，。！？、；：,.!?;:\s]/;

console.log('总数:', data.length);

// 1. 同作者同标题重名
const titleCount = new Map();
for (const p of data) {
  const k = p.author + '《' + p.title + '》';
  titleCount.set(k, (titleCount.get(k) || 0) + 1);
}
const dups = [...titleCount.entries()].filter(([, n]) => n > 1);
console.log('\n同作者同标题重复:', dups.length);
dups.forEach(([k, n]) => console.log(' ', k, 'x', n));

// 2. 正文含游戏过滤规则外的非汉字字符（会导致游戏端拼音错位）
const weird = new Map();
for (const p of data) {
  for (const ch of p.paragraphs.join('')) {
    if (!HAN_RE.test(ch) && !GAME_PUNCT.test(ch)) {
      const k = ch + ' U+' + ch.codePointAt(0).toString(16).toUpperCase();
      if (!weird.has(k)) weird.set(k, []);
      weird.get(k).push(p.id + '《' + p.title + '》');
    }
  }
}
console.log('\n游戏过滤规则外的字符:', weird.size, '种');
[...weird.entries()].slice(0, 10).forEach(([k, v]) => console.log(' ', k, '→', v.slice(0, 3).join(', ')));

// 3. 名篇抽查
for (const t of ['静夜思', '春晓', '登鹳雀楼', '相思', '回乡偶书']) {
  const p = data.find((x) => x.title === t);
  if (!p) { console.log('\n《' + t + '》未找到'); continue; }
  console.log(`\n${p.id} ${p.author}《${p.title}》`);
  p.paragraphs.forEach((l) => console.log('   ', l));
  console.log('    拼音:', p.pinyin);
}

// 4. 长诗检查
const longest = [...data].sort((a, b) => b.pinyin.split(' ').length - a.pinyin.split(' ').length).slice(0, 3);
longest.forEach((p) => console.log('\n最长:', p.id, p.author, '《' + p.title + '》', p.pinyin.split(' ').length, '字'));

// 5. 空段落/空拼音
const bad = data.filter((p) => !p.paragraphs.length || !p.pinyin || !p.title || !p.author);
console.log('\n空字段条目:', bad.length);
