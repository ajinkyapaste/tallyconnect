const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines 1565 to 1600:');
for (let i = 1564; i < Math.min(1600, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
