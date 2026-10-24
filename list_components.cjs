const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.match(/^const\s+([A-Za-z0-9_]+)\s*=\s*(\([^\)]*\)|[A-Za-z0-9_]+)\s*=>/)) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  } else if (line.match(/^function\s+([A-Za-z0-9_]+)/)) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
