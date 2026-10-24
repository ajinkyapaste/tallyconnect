const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');
const drillIdx = str.indexOf('Total Credit');
console.log('Snippet around Total Credit:');
console.log(str.substring(drillIdx - 800, drillIdx + 800));
