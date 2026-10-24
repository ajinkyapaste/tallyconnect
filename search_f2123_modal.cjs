const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');
const drillIdx = str.indexOf('Total Credit');
console.log('Total Credit at:', drillIdx);
if (drillIdx !== -1) {
  console.log('Window before:');
  console.log(str.substring(drillIdx - 1500, drillIdx));
}
