const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'tally-frontend', 'src');
const endpoints = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const regex = /api\.(get|post|put|patch|del|delete)\(\s*['"`]([^'"`$?]+)/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        if (m[2].startsWith('/')) {
          endpoints.add(m[2]);
        }
      }
      const fetchRegex = /fetch\(\s*['"`]([^'"`$?]+)/g;
      while ((m = fetchRegex.exec(content)) !== null) {
        if (m[1].startsWith('/')) {
          endpoints.add(m[1]);
        }
      }
    }
  }
}

scanDir(srcDir);
const sorted = Array.from(endpoints).sort();
console.log(`Found ${sorted.length} endpoints in frontend:`);
fs.writeFileSync(path.join(__dirname, 'frontend_endpoints.json'), JSON.stringify(sorted, null, 2));
console.log(sorted.join('\n'));
