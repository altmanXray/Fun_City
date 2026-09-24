/* 一次性工具：全站把 Fun City 改名为 Fun City（FHDCC 标识与仓库地址不受影响） */
const fs = require('fs');
const path = require('path');
const skip = new Set(['node_modules', '.cache', '.git', '.agents', '.zcode']);
const files = [];
(function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(f.name)) continue;
        const p = path.join(dir, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.(html|md|js|css)$/.test(f.name)) files.push(p);
    }
})('.');
let changed = 0, total = 0, bad = 0;
for (const p of files) {
    let t = fs.readFileSync(p, 'utf8');
    const n = (t.match(/Fun City/g) || []).length;
    if (!n) continue;
    t = t.replace(/Fun City/g, 'Fun City');
    fs.writeFileSync(p, t, 'utf8');
    changed++; total += n;
    if ((t.match(/\uFFFD/g) || []).length) { console.log('BAD BYTES', p); bad++; }
}
console.log(`files changed: ${changed} | replacements: ${total} | badBytes files: ${bad}`);
