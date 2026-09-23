/* FHDCC · LittleGame | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/**
 * LittleGame 诗库构建脚本（离线工具，不参与游戏运行时）
 *
 * 用途：生成 games/schulte/poems-tang300.json（简体 + 逐字带调拼音）
 *
 * 数据来源（自动下载缓存到 tools/.cache/，删缓存即可重新拉取）：
 *   1. 选目：chinese-poetry 仓库《全唐诗/唐诗三百首.json》（繁体，仅取"收录哪些诗"，
 *      其正文一律弃用；输出正文 100% 来自简体语料，全程无繁转简转换）
 *   2. 正文：npm 包 tangshi@0.0.2 内置简体《全唐诗》语料（42,949 首，原生简体）
 *
 * 匹配方法：
 *   语料组诗条目按"半首一段"切分，故用 滑动窗口拼接相邻段 作为候选单元；
 *   匹配滤字仅保留汉字（排除 [欸] 式校勘括号），标题拼音精确匹配 + 正文声调无关
 *   逐音节评分复核（等长/前缀/后缀对齐，容多音字跨简繁读音差异）；
 *   作者别名表 + 全库标题索引兜底 + 人工映射。输出按正文去重。
 *
 * 运行：cd tools && npm install && npm run build:poems
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pinyin } = require('pinyin-pro');

const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(__dirname, '.cache');
const SELECTION_URL =
  'https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/' +
  '%E5%85%A8%E5%94%90%E8%AF%97/%E5%94%90%E8%AF%97%E4%B8%89%E7%99%BE%E9%A6%96.json';
const CORPUS_TARBALL = 'https://registry.npmjs.org/tangshi/-/tangshi-0.0.2.tgz';
const OUTPUT = path.join(ROOT, 'games', 'schulte', 'poems-tang300.json');

const HAN_RE = /[\u4e00-\u9fff]/;
const matchHan = (text) => Array.from(String(text || '')).filter((c) => HAN_RE.test(c)).join('');

const pyToned = (s) => pinyin(s, { type: 'array', toneType: 'symbol', v: false, nonZh: 'consecutive' });
const pyKey = (s) => pyToned(s).join("'");
const pyPlainArr = (s) => pinyin(s, { type: 'array', toneType: 'none', v: false, nonZh: 'consecutive' });

/** 作者别名：选目称谓 → 语料诗人名（null = 无名氏，走全库标题索引） */
const AUTHOR_ALIAS = {
  明皇帝: '李隆基',
  韋應物: '韦应物',
  丘爲: '丘为',
  李頻: '李频',
  黃拱: '贺知章', // 选目误署，回乡偶书作者为贺知章
  黄拱: '贺知章', // 同上（黄/黃两个码位）
  楊敬述進: '杨敬述',
  許渾: '许浑',
  張佖: '张泌', // 选目作张佖，实为张泌
  不詳: null,
  無名氏: null,
};

/** 剔除条目：非唐诗三百首的污染数据 / 语料无正文者 / 语料缺失的诗 */
const DROP_TITLES = ['頌古三十二首  其二三', '度南澗', '雜曲歌辭 蓋羅縫 一', '贈內人'];

/** 人工映射兜底：选目标题 → { poet, titleIncludes } */
const MANUAL_MAP = {};

/** 展示名修正：语料用名 → 大众熟知名 */
const TITLE_RENAME = { 琵琶引: '琵琶行', 清平调词: '清平调' };

/** 近似重复判定：同作者同标题 + 汉字字符多重集相似度（对个别字的增删改不敏感） */
function isNearDup(aPlain, bPlain) {
  const n = aPlain.length;
  const m = bPlain.length;
  if (!n || !m) return false;
  if (Math.abs(n - m) > Math.max(n, m) * 0.2) return false;
  const freq = new Map();
  for (const s of aPlain) freq.set(s, (freq.get(s) || 0) + 1);
  let common = 0;
  for (const s of bPlain) {
    const c = freq.get(s) || 0;
    if (c > 0) {
      common++;
      freq.set(s, c - 1);
    }
  }
  return common / Math.max(n, m) >= 0.8;
}

// ---------- 标题形态 ----------

function baseCleanTitle(t) {
  return String(t || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/并序$/, '')
    .replace(/\s+/g, '·')
    .replace(/·+/g, '·')
    .replace(/^·|·$/g, '');
}

const CATEGORY_PREFIX =
  /^(樂府|乐府|雜曲歌辭|杂曲歌辞|橫吹曲辭|横吹曲辞|相和歌辭|相和歌辞|鼓吹曲辭|鼓吹曲辞|新樂府|新乐府|琴曲歌辭|琴曲歌辞|舞曲歌辭|舞曲歌辞)/;

function titleForms(t) {
  const base = baseCleanTitle(t);
  const out = new Set([base]);
  let stripped = base;
  for (let i = 0; i < 4; i++) {
    const next = stripped.replace(CATEGORY_PREFIX, '').replace(/^·/, '');
    if (next === stripped) break;
    stripped = next;
    out.add(stripped);
  }
  for (const cur of [...out]) {
    const noOrdinal = cur.replace(/·?其?[一二三四五六七八九十]+$/, '');
    if (noOrdinal !== cur && noOrdinal) {
      out.add(noOrdinal);
      out.add(noOrdinal.replace(/[二三四五六七八九十]+首$/, ''));
    }
    const noCount = cur.replace(/[二三四五六七八九十]+首$/, '');
    if (noCount !== cur && noCount) out.add(noCount);
  }
  return [...out].filter(Boolean);
}

function displayTitle(t, pickedSingle) {
  let s = baseCleanTitle(t);
  for (let i = 0; i < 4; i++) {
    const next = s.replace(CATEGORY_PREFIX, '').replace(/^·/, '');
    if (next === s) break;
    s = next;
  }
  if (pickedSingle) s = s.replace(/·?其?[一二三四五六七八九十]+$/, '').replace(/[二三四五六七八九十]+首$/, '');
  return s;
}

// ---------- 下载与缓存 ----------

async function download(url, label) {
  process.stdout.write(`下载 ${label} ... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} 下载失败 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`${(buf.length / 1024).toFixed(0)} KB`);
  return buf;
}

function extractTarFile(tarBuf, wantedPath) {
  let off = 0;
  while (off + 512 <= tarBuf.length) {
    const header = tarBuf.subarray(off, off + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0[\s\S]*$/, '');
    const size = parseInt(header.subarray(124, 136).toString('utf8').trim() || '0', 8) || 0;
    off += 512;
    if (name === wantedPath) return tarBuf.subarray(off, off + size).toString('utf8');
    off += Math.ceil(size / 512) * 512;
  }
  return null;
}

function loadCached(file, loader) {
  const p = path.join(CACHE_DIR, file);
  if (fs.existsSync(p)) {
    console.log(`使用缓存 ${file}`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return loader().then((text) => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(p, text, 'utf8');
    return JSON.parse(text);
  });
}

// ---------- 评分 ----------

/**
 * 声调无关逐音节评分。返回 {score, start}：start 为候选中对齐选目的音节起点
 * （候选 ≥ 选目时为前缀/后缀对齐位置；候选更短时为 0）。
 */
function scoreText(selPlain, candPlain) {
  const n = selPlain.length;
  const m = candPlain.length;
  if (!n || !m) return { score: 0, start: 0 };
  const rateFrom = (s) => {
    let hit = 0;
    for (let i = 0; i < n; i++) if (candPlain[s + i] === selPlain[i]) hit++;
    return hit / n;
  };
  if (m === n) return { score: rateFrom(0), start: 0 };
  if (m > n) {
    const a = rateFrom(0);
    const b = rateFrom(m - n);
    return a >= b ? { score: a, start: 0 } : { score: b, start: m - n };
  }
  let hitA = 0;
  let hitB = 0;
  for (let i = 0; i < m; i++) {
    if (candPlain[i] === selPlain[i]) hitA++;
    if (candPlain[i] === selPlain[n - m + i]) hitB++;
  }
  return { score: Math.max(hitA, hitB) / n, start: 0 };
}

// ---------- 候选窗口（组诗按半首切段 → 滑动窗口拼接相邻段） ----------

const WINDOW_MAX_SPAN = 12; // 单窗口最多拼接的段数
const unitCache = new Map();

/** 一首语料诗的候选单元集合：滑动窗口 + 整篇 */
function poemUnits(poem) {
  if (unitCache.has(poem)) return unitCache.get(poem);
  const items = (poem.content || []).filter((s) => s && String(s).trim());
  const plains = items.map((it) => pyPlainArr(matchHan(it)));
  const units = [];
  if (items.length > 1) {
    for (let i = 0; i < items.length; i++) {
      for (let span = 1; span <= Math.min(WINDOW_MAX_SPAN, items.length - i); span++) {
        const text = items.slice(i, i + span).join('');
        const plain = plains.slice(i, i + span).flat();
        units.push({ text, plain, whole: false, firstIdx: i, span });
      }
    }
  }
  const joined = items.join('');
  units.push({ text: joined, plain: plains.flat(), whole: true, firstIdx: -1, span: items.length });
  unitCache.set(poem, units);
  return units;
}

// ---------- 主流程 ----------

async function main() {
  const selection = await loadCached('selection.json', () =>
    download(SELECTION_URL, '选目（chinese-poetry 唐诗三百首）').then((b) => b.toString('utf8'))
  );
  const corpus = await loadCached('corpus.json', async () => {
    const tgz = await download(CORPUS_TARBALL, '简体全唐诗语料（npm tangshi）');
    const text = extractTarFile(zlib.gunzipSync(tgz), 'package/json/tangshi.json');
    if (!text) throw new Error('tarball 中未找到 package/json/tangshi.json');
    return text;
  });
  const poets = Object.keys(corpus);
  const total = Object.values(corpus).reduce((n, v) => n + v.length, 0);
  console.log(`选目 ${selection.length} 首 | 语料 ${poets.length} 位诗人 ${total} 首`);

  const poetByPy = new Map();
  for (const name of poets) {
    const key = pyKey(name);
    if (!poetByPy.has(key)) poetByPy.set(key, []);
    poetByPy.get(key).push(name);
  }

  // 语料字符频次表：既做输出校验白名单，也做难度排序的稀有度依据
  const corpusCharFreq = new Map();
  const bumpChars = (s) => {
    for (const c of matchHan(s)) corpusCharFreq.set(c, (corpusCharFreq.get(c) || 0) + 1);
  };
  for (const p of poets) {
    bumpChars(p);
    for (const poem of corpus[p]) {
      bumpChars((poem.title || '') + (poem.content || []).join(''));
    }
  }
  const corpusCharSet = new Set(corpusCharFreq.keys());

  // 全库标题索引（懒构建）
  let globalTitleIndex = null;
  function getTitleIndex() {
    if (globalTitleIndex) return globalTitleIndex;
    process.stdout.write('构建全库标题索引 ... ');
    globalTitleIndex = new Map();
    for (const p of poets) {
      for (const poem of corpus[p]) {
        for (const form of titleForms(poem.title)) {
          const key = pyKey(form);
          if (!globalTitleIndex.has(key)) globalTitleIndex.set(key, []);
          globalTitleIndex.get(key).push({ poet: p, poem });
        }
      }
    }
    console.log(`${globalTitleIndex.size} 个标题形态`);
    return globalTitleIndex;
  }

  function bestTextMatch(selPlain, hits) {
    let best = null;
    for (const h of hits) {
      for (const u of poemUnits(h.poem)) {
        const { score, start } = scoreText(selPlain, u.plain);
        if (!best || score > best.score) best = { poet: h.poet, poem: h.poem, unit: u, score, start };
      }
    }
    return best;
  }

  const results = [];
  const unmatched = [];
  const stats = { title: 0, globalTitle: 0, text: 0, manual: 0, dropped: 0 };
  const ACCEPT = 0.45;

  for (const sel of selection) {
    if (DROP_TITLES.includes(String(sel.title).trim())) {
      stats.dropped++;
      continue;
    }
    const selPlain = pyPlainArr(matchHan(sel.paragraphs.join('')));
    const selTitleKeys = titleForms(sel.title).map(pyKey);

    const alias = AUTHOR_ALIAS[String(sel.author).trim()];
    let candidates = [];
    if (alias === null) candidates = [];
    else if (alias) candidates = corpus[alias] ? [alias] : [];
    else candidates = poetByPy.get(pyKey(String(sel.author || '').trim())) || [];

    let best = null;

    // 路径 1：作者候选池（标题命中集合 + 全池正文评分）
    if (candidates.length) {
      const titleHits = [];
      for (const p of candidates) {
        for (const poem of corpus[p]) {
          let hit = false;
          for (const form of titleForms(poem.title)) {
            if (selTitleKeys.includes(pyKey(form))) { hit = true; break; }
          }
          if (hit) titleHits.push({ poet: p, poem });
        }
      }
      if (titleHits.length) {
        const b = bestTextMatch(selPlain, titleHits);
        if (b) best = { ...b, via: 'title' };
      }
      const pool = [];
      for (const p of candidates) for (const poem of corpus[p]) pool.push({ poet: p, poem });
      const b2 = bestTextMatch(selPlain, pool);
      if (b2 && (!best || b2.score > best.score + 0.05)) best = { ...b2, via: 'text' };
    }

    // 路径 2：全库标题索引（作者失配或前述得分不足）
    if (!best || best.score < ACCEPT) {
      const ghits = [];
      for (const key of selTitleKeys) (getTitleIndex().get(key) || []).forEach((h) => ghits.push(h));
      if (ghits.length) {
        const b = bestTextMatch(selPlain, ghits);
        if (b && (!best || b.score > best.score)) best = { ...b, via: 'globalTitle' };
      }
    }

    // 路径 3：人工映射
    if (!best || best.score < ACCEPT) {
      const manual = MANUAL_MAP[String(sel.title).trim()];
      if (manual && corpus[manual.poet]) {
        const poem = corpus[manual.poet].find((x) => String(x.title).includes(manual.titleIncludes));
        if (poem) {
          let b = null;
          for (const u of poemUnits(poem)) {
            const { score, start } = scoreText(selPlain, u.plain);
            if (!b || score > b.score) b = { poet: manual.poet, poem, unit: u, score, start };
          }
          if (b) best = { ...b, via: 'manual' };
        }
      }
    }

    if (!best || best.score < ACCEPT) {
      unmatched.push(sel);
      continue;
    }
    stats[best.via]++;
    results.push({ sel, ...best });
  }

  console.log(
    `\n匹配结果：成功 ${results.length} 首（标题 ${stats.title} / 正文 ${stats.text} / 全库标题 ${stats.globalTitle} / 人工 ${stats.manual}），剔除 ${stats.dropped} 首，未命中 ${unmatched.length} 首`
  );
  unmatched.forEach((u) => console.log(`  [未命中] ${u.author}《${u.title}》`));

  // ---------- 组装输出 ----------
  const SENT_END = /[。？！；]/;
  const out = [];
  const seen = new Set();
  const nearSeen = new Map();
  let dup = 0;

  for (const r of results) {
    // 按对齐起点从单元文本中截取：start 为汉字序号
    const chars = Array.from(r.unit.text);
    const hanPositions = [];
    chars.forEach((c, idx) => { if (HAN_RE.test(c)) hanPositions.push(idx); });
    const totalHan = hanPositions.length;
    let fromChar = 0;
    let toChar = chars.length;
    const selLen = matchHan(r.sel.paragraphs.join('')).length;
    if (r.start > 0) fromChar = hanPositions[r.start] ?? 0;
    // 整篇且显著更长（并序）：从末尾按选目长度截
    if (r.unit.whole && totalHan - r.start > selLen * 1.15 && totalHan - r.start - selLen >= 2) {
      toChar = (hanPositions[r.start + selLen] ?? chars.length);
      // 截到选目长度：保留含标点的结尾
      let endHan = r.start + selLen;
      toChar = endHan < totalHan ? hanPositions[endHan] : chars.length;
    }
    const bodyText = chars.slice(fromChar, toChar).join('');

    const paragraphs = [];
    let buf = '';
    for (const ch of bodyText) {
      buf += ch;
      if (SENT_END.test(ch)) {
        paragraphs.push(buf.trim());
        buf = '';
      }
    }
    if (buf.trim()) paragraphs.push(buf.trim());

    const dedupeKey = r.poet + '|' + matchHan(paragraphs.join(''));
    if (seen.has(dedupeKey)) {
      dup++;
      continue;
    }
    seen.add(dedupeKey);

    // 近似重复剔除（语料对同一首诗的乐府版/普通版双收录，文本仅个别字差异）
    const title2 = TITLE_RENAME[displayTitle(r.poem.title, !r.unit.whole)] || displayTitle(r.poem.title, !r.unit.whole);
    const hanChars = Array.from(paragraphs.join('')).filter((c) => HAN_RE.test(c)).join('');
    const plain = pyPlainArr(hanChars);
    const nearKey = r.poet + '|' + title2;
    if (nearSeen.has(nearKey)) {
      if (nearSeen.get(nearKey).some((prev) => isNearDup(prev, plain))) {
        dup++;
        continue;
      }
      nearSeen.get(nearKey).push(plain);
    } else {
      nearSeen.set(nearKey, [plain]);
    }

    const title = title2;
    const syllables = pyToned(hanChars);
    out.push({
      author: r.poet || '无名氏',
      paragraphs,
      tags: ['唐诗三百首'],
      title,
      id: `ts-${String(out.length + 1).padStart(3, '0')}`,
      pinyin: syllables.join(' '),
      _check: {
        hanCount: hanChars.length,
        pyCount: syllables.length,
        score: Number(r.score.toFixed(2)),
        via: r.via,
      },
    });
  }
  console.log(`去重剔除 ${dup} 首（选目重复条目）`);

  // ---------- 全量校验 ----------
  const SYLLABLE_RE = /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/i;
  const TRAD_CHARS = '風雲龍鳳鳥語聲頭門萬與東車馬飛見邊還遠學國圖畫讓憶鐵銀錄飯飲餘僕應爲樹樓臺煙陽關嶽絕嶺巒繡簾羅綺燭淚腸斷橋駱賓隱雜闕輞鵜鵡澗許渾綸頻韋淵簫';
  let bad = 0;
  for (const p of out) {
    const problems = [];
    if (p._check.hanCount !== p._check.pyCount) problems.push(`汉字${p._check.hanCount}≠音节${p._check.pyCount}`);
    const badSyl = p.pinyin.split(' ').filter((s) => !SYLLABLE_RE.test(s));
    if (badSyl.length) problems.push(`非法音节:${badSyl.slice(0, 3).join(',')}`);
    const allText = p.title + p.author + p.paragraphs.join('');
    const tradHit = [...new Set(Array.from(TRAD_CHARS).filter((c) => allText.includes(c)))];
    if (tradHit.length) problems.push(`疑似繁体字:${tradHit.slice(0, 5).join('')}`);
    const outsideCorpus = [...new Set(Array.from(allText).filter((c) => HAN_RE.test(c) && !corpusCharSet.has(c)))];
    if (outsideCorpus.length) problems.push(`语料外汉字:${outsideCorpus.slice(0, 5).join('')}`);
    if (problems.length) {
      bad++;
      console.log(`  [校验失败] ${p.id} ${p.author}《${p.title}》 ${problems.join(' | ')}`);
    }
  }
  console.log(`校验：${out.length} 首中 ${bad} 首有问题，${out.length - bad} 首通过`);
  if (bad > 0) {
    console.log('存在校验失败项，已中止写出。');
    process.exit(1);
  }

  // ---------- 难度排序 ----------
  // 主因子：字数（决定舒尔特网格规模，20 字 6×6 … 56 字 9×9，更长为长诗）；
  // 次因子：生僻字比例（全语料字频排名的均值，越小字越常见越好找）。
  // id 在排序前已分配，重排不改 id —— 玩家已有的完成度/最佳成绩不失效。
  const rankByChar = new Map();
  [...corpusCharFreq.entries()].sort((a, b) => b[1] - a[1]).forEach(([c], i) => rankByChar.set(c, i + 1));
  const rarityOf = (p) => {
    const chars = Array.from(matchHan(p.paragraphs.join('')));
    if (!chars.length) return 0;
    let s = 0;
    for (const c of chars) s += Math.log10((rankByChar.get(c) ?? rankByChar.size) + 1);
    return s / chars.length;
  };
  out.forEach((p, i) => { p._sortIdx = i; });
  out.sort(
    (a, b) =>
      a._check.hanCount - b._check.hanCount ||
      rarityOf(a) - rarityOf(b) ||
      a._sortIdx - b._sortIdx
  );
  // 裁剪到 300 首：删去排序最末（最长最难）的余量，使「唐诗300首」名副其实
  const POEM_KEEP = 300;
  if (out.length > POEM_KEEP) {
    console.log(`\n裁剪：${out.length} → ${POEM_KEEP} 首（删去最末 ${out.length - POEM_KEEP} 首长诗）`);
    out.length = POEM_KEEP;
  }
  console.log('\n难度排序后前 10 首（由易到难）：');
  out.slice(0, 10).forEach((p, i) => {
    console.log(`  ${String(i + 1).padStart(3)}. ${p.id} ${p.author}《${p.title}》 ${p._check.hanCount}字 稀有度${rarityOf(p).toFixed(2)}`);
  });
  console.log('最末 3 首：');
  out.slice(-3).forEach((p, i) => {
    console.log(`  ${String(out.length - 2 + i).padStart(3)}. ${p.id} ${p.author}《${p.title}》 ${p._check.hanCount}字`);
  });

  const finalData = out.map(({ _check, _sortIdx, ...rest }) => rest);
  fs.writeFileSync(OUTPUT, JSON.stringify(finalData, null, 2) + '\n', 'utf8');
  console.log(`\n已写出 ${OUTPUT}（${finalData.length} 首，${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB）`);
}

main().catch((e) => {
  console.error('构建失败:', e);
  process.exit(1);
});
