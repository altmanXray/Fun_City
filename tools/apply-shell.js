/* 一次性工具：给全部页面注入早期品牌底色（防跳转白屏闪）+ View Transitions 由 theme.css 提供 */
const fs = require('fs');
const path = require('path');
const skip = new Set(['node_modules', '.cache', '.git', '.agents', '.zcode', 'design']);
const EARLY = '<style>html{background:linear-gradient(135deg,#5865d9,#9a5bc6) fixed}</style>';
const files = [];
(function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(f.name)) continue;
        const p = path.join(dir, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.html$/.test(f.name)) files.push(p);
    }
})('.');
let n = 0;
for (const p of files) {
    let t = fs.readFileSync(p, 'utf8');
    if (t.includes('html{background:linear-gradient')) { continue; }
    // 插在 charset 之后，保证样式表加载前就有品牌底色
    t = t.replace(/(<meta charset="UTF-8">)/, `$1\n    ${EARLY}`);
    if (!t.includes('html{background:linear-gradient')) { console.log('FAIL', p); process.exit(1); }
    fs.writeFileSync(p, t, 'utf8');
    n++;
}
console.log('early background injected:', n, 'pages');
