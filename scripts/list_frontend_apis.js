const fs = require('fs');
const path = require('path');

const src = 'd:/Prototype/tally-frontend/src';

function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (/\.jsx?$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        // match api.get/post/etc or fetch
        const regex = /(api\.(get|post|put|delete|patch)|fetch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
        let match;
        while ((match = regex.exec(l)) !== null) {
          const method = match[2] || 'fetch';
          const endpoint = match[3];
          console.log(`${f}:${i + 1} [${method.toUpperCase()}] ${endpoint}`);
        }
      });
    }
  }
}

scan(src);
