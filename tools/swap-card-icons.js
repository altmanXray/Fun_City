/* 一次性工具：大厅卡片 emoji → 白色线稿 SVG 图标（与 Fun City 徽章同风格） */
const fs = require('fs');
const path = require('path');
const W = 'stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const W4 = 'stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const icons = {
    '🎯': '<svg viewBox="0 0 64 64" class="icon-svg"><circle cx="32" cy="32" r="24" ' + W + '/><circle cx="32" cy="32" r="14" ' + W + '/><circle cx="32" cy="32" r="4" fill="#FFFFFF"/></svg>',
    '🔢': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="12" y="12" width="40" height="40" rx="7" ' + W + '/><path d="M25.3 12v40 M38.6 12v40 M12 25.3h40 M12 38.6h40" ' + W4 + '/></svg>',
    '🧠': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="8" y="16" width="22" height="32" rx="4" ' + W + '/><rect x="30" y="22" width="24" height="30" rx="4" fill="#FFFFFF" opacity="0.25" ' + W + '/><path d="M35 32c2.5-3 6.5-.8 5 2.5-1 2.3-5 4.5-5 4.5s-4-2.2-5-4.5c-1.5-3.3 2.5-5.5 5-2.5Z" fill="#FFFFFF" stroke="none"/></svg>',
    '🧮': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="10" y="10" width="44" height="44" rx="8" ' + W + '/><text x="32" y="39" font-size="15" font-weight="800" text-anchor="middle" font-family="Arial,sans-serif" fill="#FFFFFF">2048</text></svg>',
    '⚫': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="10" y="10" width="44" height="44" rx="5" ' + W + '/><path d="M22 10v44 M35 10v44 M10 22h44 M10 35h44" stroke="#FFFFFF" stroke-width="3.5" fill="none"/><circle cx="28.5" cy="28.5" r="5.5" fill="#FFFFFF"/><circle cx="41.5" cy="41.5" r="5.5" fill="#FFFFFF"/></svg>',
    '🧭': '<svg viewBox="0 0 64 64" class="icon-svg"><circle cx="32" cy="32" r="24" ' + W + '/><path d="M42 22 L35 37 L22 42 L29 27 Z" fill="#FFFFFF"/><circle cx="32" cy="32" r="3.5" fill="#FFFFFF"/></svg>',
    '✨': '<svg viewBox="0 0 64 64" class="icon-svg"><path d="M40 8 A26 26 0 1 0 56 42 A20.5 20.5 0 0 1 40 8 Z" ' + W + ' stroke-linejoin="round"/><path d="M48 10 L50.5 17.5 L58 20 L50.5 22.5 L48 30 L45.5 22.5 L38 20 L45.5 17.5 Z" fill="#FFFFFF"/></svg>',
    '📅': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="8" y="14" width="48" height="42" rx="7" ' + W + '/><path d="M8 28h48" ' + W4 + '/><path d="M21 8v12 M43 8v12" ' + W + '/><circle cx="23" cy="38" r="4.5" fill="#FFFFFF"/><circle cx="41" cy="38" r="4.5" fill="#FFFFFF"/><circle cx="23" cy="48" r="4.5" fill="#FFFFFF"/></svg>',
    '📜': '<svg viewBox="0 0 64 64" class="icon-svg"><rect x="14" y="8" width="36" height="48" rx="4" ' + W + '/><path d="M22 22h20 M22 31h20 M22 40h13" ' + W + '/></svg>',
    '🌌': '<svg viewBox="0 0 64 64" class="icon-svg"><circle cx="32" cy="32" r="13" ' + W + '/><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#FFFFFF" stroke-width="3.5" fill="none" transform="rotate(-18 32 32)"/><circle cx="9" cy="22" r="3.5" fill="#FFFFFF"/><circle cx="55" cy="44" r="3.5" fill="#FFFFFF"/></svg>'
};
const p = path.join(__dirname, '..', 'index.html');
let t = fs.readFileSync(p, 'utf8');
let n = 0;
for (const [emo, svg] of Object.entries(icons)) {
    const needle = '<span class="icon-text">' + emo + '</span>';
    if (!t.includes(needle)) { console.log('MISS', emo); process.exit(1); }
    t = t.replace(needle, svg);
    n++;
}
fs.writeFileSync(p, t, 'utf8');
console.log('replaced', n, 'icons');
