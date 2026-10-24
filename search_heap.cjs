const fs = require('fs');

console.log('Reading heap snapshot...');
const snapshot = fs.readFileSync('d:/Prototype/vite_heap.heapsnapshot', 'utf8');

const marker = 'const LedgerList';
let idx = 0;
let matches = [];

while ((idx = snapshot.indexOf(marker, idx)) !== -1) {
  matches.push(idx);
  idx += marker.length;
}

console.log('Found matches for marker:', matches.length);

matches.forEach((pos, i) => {
  console.log(`\n--- Match ${i + 1} at ${pos} ---`);
  // Look backwards for start of App.jsx (e.g. import React)
  const windowBefore = snapshot.substring(Math.max(0, pos - 5000), pos);
  const reactIdx = windowBefore.lastIndexOf('import React');
  console.log('Distance to import React before:', reactIdx !== -1 ? (windowBefore.length - reactIdx) : 'not found');

  // Look around
  console.log('Snippet around match:');
  console.log(snapshot.substring(pos - 50, pos + 300).replace(/\\n/g, '\n').replace(/\\"/g, '"'));
});
