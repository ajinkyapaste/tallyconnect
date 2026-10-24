import fs from 'fs';
const text = fs.readFileSync('./src/App.jsx', 'utf8');
const lines = text.split('\n');
lines.forEach((l, i) => {
  if (l.includes("currentTab === '") || l.includes('currentTab === "')) {
    console.log('line:', i + 1, l.trim());
  }
});
