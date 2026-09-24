const fs = require('fs');
const path = require('path');
const skip = new Set(['node_modules', '.cache', '.git', '.agents', '.zcode', 'design']);
const pages = [];
(function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(f.name)) continue;
        const p = path.join(dir, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.html$/.test(f.name)) pages.push(p);
    }
})('.');

// 1. 移除所有 theme-switcher.js 引用
let count = 0;
for (const p of pages) {
    let t = fs.readFileSync(p, 'utf8');
    const before = t.length;
    t = t.replace(/\n\s*<script[^>]*theme-switcher[^>]*><\/script>/g, '');
    if (t.length !== before) count++;
    fs.writeFileSync(p, t, 'utf8');
}

// 2. 删除 theme-switcher.js 文件
const sw = 'assets/theme-switcher.js';
if (fs.existsSync(sw)) fs.unlinkSync(sw);

// 3. theme.css 移除所有 [data-theme] 块和主题装饰
let css = fs.readFileSync('assets/theme.css', 'utf8');
// 找到第一个 [data-theme 块的位置
const start = css.indexOf('/* ================= 7 套主题 ================= */');
if (start > 0) {
    // 保留 :root 和基础样式，删除从 7 套主题开始到主题选择器结束的所有内容
    const endMark = '/* ---------- 游戏信息面板';
    const end = css.indexOf(endMark);
    if (end > start) {
        css = css.slice(0, start) + '\n' + css.slice(end);
    }
}
// 移除 bg-tint 变量（还原为原始硬编码）
css = css.replace(/--bg-tint:[^;]+;/, '');
// 还原 body 背景为原始硬编码
css = css.replace(
    /background:\s*linear-gradient\(160deg,\s*var\(--bg-tint\),\s*transparent 34%\),/,
    'background:\n        linear-gradient(160deg, rgba(255, 211, 105, 0.32), transparent 34%),'
);
// 移除 transition
css = css.replace(/transition: background 0\.3s ease, color 0\.3s ease;/, '');
// 移除 radius/btn token 变量（如果被添加了）
css = css.replace(/--radius-card:[^;]+;/, '');
css = css.replace(/--radius-btn:[^;]+;/, '');
fs.writeFileSync('assets/theme.css', css, 'utf8');

// 4. features.js 移除主题按钮
let feat = fs.readFileSync('assets/features.js', 'utf8');
const themeBtnStart = feat.indexOf('// 主题切换按钮');
const themeBtnEnd = feat.indexOf('header.appendChild(bar);', themeBtnStart);
if (themeBtnStart > 0 && themeBtnEnd > themeBtnStart) {
    feat = feat.slice(0, themeBtnStart) + feat.slice(themeBtnEnd);
}
fs.writeFileSync('assets/features.js', feat, 'utf8');

// 5. script.js 移除主题同步
let shell = fs.readFileSync('script.js', 'utf8');
shell = shell.replace(/\n\s*\/\/ 3\.5\) 同步主题到 iframe\n[\s\S]*?catch \(e\) \{ \/\* 忽略 \*\/ \}/, '');
fs.writeFileSync('script.js', shell, 'utf8');

console.log('removed from', count, 'pages; theme.css, features.js, script.js cleaned');
