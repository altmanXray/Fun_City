/* 一次性工具：档位药丸行样式 → 人机按钮内嵌下拉样式 */
const fs = require('fs');
const p = 'games/gomoku/style.css';
let t = fs.readFileSync(p, 'utf8');
if (t.includes('.level-caret')) { console.log('already swapped'); process.exit(0); }
const start = t.indexOf('/* 机器人强度档位');
const endMark = '.status-chip {';
const end = t.indexOf(endMark);
if (start < 0 || end < 0 || end <= start) { console.log('ANCHOR MISS', start, end); process.exit(1); }
const neu = `/* 机器人强度：人机对战按钮自带下拉选项（布局恒定，无占位行） */
.mode-btn-wrap {
    position: relative;
    display: flex;
}

.mode-btn-wrap .mode-btn {
    border-radius: 12px 0 0 12px;
}

.level-caret {
    padding: 8px 9px;
    border: 2px solid #d8cdf1;
    border-left: none;
    border-radius: 0 12px 12px 0;
    background: var(--surface-soft);
    color: var(--accent);
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.16s ease, border-color 0.16s ease;
}

.level-caret:hover {
    border-color: var(--accent);
}

.level-caret.dim {
    color: var(--muted);
}

.level-menu {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 30;
    min-width: 118px;
    padding: 6px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 10px 28px rgba(40, 25, 90, 0.22);
}

.level-menu.open {
    display: flex;
    flex-direction: column;
}

.level-opt {
    padding: 8px 12px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
}

.level-opt:hover {
    background: var(--surface-soft);
}

.level-opt.active {
    background: linear-gradient(135deg, var(--btn-start), var(--btn-end));
    color: #fff;
}

.level-opt.active::after {
    content: ' ✓';
}

/* 对局进行中档位锁定：选项置灰不可换 */
.level-opt.locked {
    opacity: 0.4;
    cursor: not-allowed;
}

.level-caret.locked {
    opacity: 0.75;
}

`;
t = t.slice(0, start) + neu + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('css swapped:', t.includes('.level-caret') && !t.includes('.level-row'));
