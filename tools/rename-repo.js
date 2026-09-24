const fs = require('fs');
const lines = fs.readFileSync(process.env.TEMP + '/gcred6.txt', 'utf8').trim().split('\n');
const tok = (lines.find(l => l.startsWith('password=')) || '').slice(9);
if (!tok) { console.log('no token'); process.exit(1); }
fetch('https://api.github.com/repos/altmanXray/Little-game', {
  method: 'PATCH',
  headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'funcity' })
}).then(r => r.json()).then(j => {
  console.log(j.full_name ? 'OK: ' + j.full_name : 'ERR: ' + JSON.stringify(j).slice(0, 300));
}).catch(e => console.log('ERR:', e.message));
