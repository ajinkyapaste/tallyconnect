const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines 1520 to 1565:');
for (let i = 1519; i < 1565; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
