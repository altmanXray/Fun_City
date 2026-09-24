/* 一次性工具：万年历样式追加（诗句/时辰表） */
const fs = require('fs');
const p = 'games/calendar/style.css';
let t = fs.readFileSync(p, 'utf8');
if (t.includes('dd-poem')) { console.log('already appended'); process.exit(0); }
const anchor = `.dd-tag {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    background: var(--surface);
    color: var(--accent);
}`;
const add = `

/* 今日诗句 */
.dd-poem {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.dd-poem-text {
    font-family: KaiTi, 楷体, serif;
    font-size: 1.05rem;
    color: var(--text);
    line-height: 1.6;
}
.dd-poem-from {
    color: var(--muted);
    font-size: 0.8rem;
    text-align: right;
}

/* 十二时辰表 */
.dd-hours { margin-top: 12px; }
.dd-hours-title {
    color: var(--muted);
    font-size: 0.84rem;
    font-weight: 700;
    margin-bottom: 6px;
}
.dd-hours-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 6px;
}
.dd-hour {
    padding: 6px 10px;
    border-radius: 10px;
    background: var(--surface);
    font-size: 0.82rem;
    color: var(--text);
    font-weight: 700;
    white-space: nowrap;
}
.dd-hour i {
    font-style: normal;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 400;
    margin: 0 2px;
}`;
if (!t.includes(anchor)) { console.log('ANCHOR MISS'); process.exit(1); }
t = t.replace(anchor, anchor + add);
fs.writeFileSync(p, t, 'utf8');
console.log('styles appended:', t.includes('dd-poem-text'));
