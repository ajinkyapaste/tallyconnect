const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');
const fyIdx = str.indexOf('setFyYear');
const creditIdx = str.indexOf('Total Credit (Sales)');

console.log('fyIdx:', fyIdx, 'creditIdx:', creditIdx);
console.log('Slice between:');
console.log(str.substring(fyIdx, creditIdx + 300));
