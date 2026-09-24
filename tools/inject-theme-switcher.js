/* 一次性工具：给全部页面注入 theme-switcher.js + 升级 theme.css 版本 */
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
const TAG = '<script src="assets/theme-switcher.js?v=1"></script>';
const TAG_GAME = '<script src="../../assets/theme-switcher.js?v=1"></script>';
let injected = 0;
for (const p of pages) {
    let t = fs.readFileSync(p, 'utf8');
    if (t.includes('theme-switcher')) continue;
    const isLobby = !p.includes('games');
    const tag = isLobby ? TAG : TAG_GAME;
    // 注在 features.js 之后
    if (t.includes('features.js')) {
        t = t.replace(/(<script[^>]*features\.js[^>]*><\/script>)/, `$1\n    ${tag}`);
    } else {
        t = t.replace('</body>', `    ${tag}\n</body>`);
    }
    // 升级 theme.css 版本
    t = t.replace(/theme\.css\?v=\d+/g, 'theme.css?v=20');
    fs.writeFileSync(p, t, 'utf8');
    injected++;
}
console.log(`injected into ${injected} pages`);
