const fs = require('fs');

const raw = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_0021a7.txt');
const str = raw.toString('utf8');

const marker = '"pluginCode":"';
const startIdx = str.indexOf(marker);
if (startIdx === -1) {
  console.error('pluginCode marker not found!');
  process.exit(1);
}

const contentStart = startIdx + marker.length;
// Find the end quote for pluginCode. In JSON, an unescaped quote ends the string.
let endIdx = contentStart;
while (endIdx < str.length) {
  if (str[endIdx] === '"' && str[endIdx - 1] !== '\\') {
    break;
  }
  endIdx++;
}

const jsonString = '"' + str.substring(contentStart, endIdx) + '"';
console.log('JSON string slice length:', jsonString.length);

const decoded = JSON.parse(jsonString);
console.log('Successfully decoded App.jsx!');
console.log('Decoded length:', decoded.length);
console.log('Total lines:', decoded.split('\n').length);

fs.writeFileSync('d:/Prototype/recovered_App.jsx', decoded, 'utf8');
console.log('Written to d:/Prototype/recovered_App.jsx');
