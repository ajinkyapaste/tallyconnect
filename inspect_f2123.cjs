const fs = require('fs');

const f = 'd:/Prototype/recovered_from_Edge_f_002123.txt';
const raw = fs.readFileSync(f);
console.log('f_002123 size:', raw.length);
console.log('Start 200 chars:');
console.log(raw.toString('utf8', 0, 200));

// Check if it's the Vite bundle or transformed module
const str = raw.toString('utf8');
if (str.includes('/src/App.jsx')) {
  console.log('Includes /src/App.jsx!');
}
