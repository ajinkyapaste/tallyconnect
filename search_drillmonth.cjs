const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');
const drillIdx = str.indexOf('drillMonth &&');
console.log('drillMonth && at:', drillIdx);
if (drillIdx !== -1) {
  console.log(str.substring(drillIdx - 100, drillIdx + 500));
}
