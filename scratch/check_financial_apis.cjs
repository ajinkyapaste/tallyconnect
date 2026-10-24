const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) files.push(...walk(full));
      else files.push(full);
    }
  } catch (e) {}
  return files;
}

const terms = ['balance', 'profit', 'trial', 'cash flow', 'forecast', 'expense', 'pnl'];

console.log('=== SEARCHING BACKEND ROUTES & UTILS ===');
const backendFiles = walk('d:/Prototype/tally-backend');
for (const file of backendFiles) {
  if (file.includes('node_modules') || file.includes('.git')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const term of terms) {
    const regex = new RegExp(term, 'gi');
    const matches = [...content.matchAll(regex)];
    if (matches.length > 0) {
      console.log('Backend [' + term + '] in ' + path.relative('d:/Prototype', file) + ' (' + matches.length + ' matches)');
    }
  }
}

console.log('\n=== SEARCHING FRONTEND SRC ===');
const frontendFiles = walk('d:/Prototype/tally-frontend/src');
for (const file of frontendFiles) {
  if (file.includes('node_modules') || file.includes('.git')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const term of terms) {
    const regex = new RegExp(term, 'gi');
    const matches = [...content.matchAll(regex)];
    if (matches.length > 0) {
      console.log('Frontend [' + term + '] in ' + path.relative('d:/Prototype', file) + ' (' + matches.length + ' matches)');
    }
  }
}
