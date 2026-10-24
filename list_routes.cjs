const fs = require('fs');
const path = require('path');
const dir = 'd:/Prototype/tally-backend/routes';

fs.readdirSync(dir).forEach(f => {
  if (!f.endsWith('.js')) return;
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = c.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(/router\.(get|post|put|delete)\(\s*['"`]([^'"`]+)/);
    if (m) {
      console.log(`${f} [${m[1].toUpperCase()}] ${m[2]}`);
    }
  });
});
