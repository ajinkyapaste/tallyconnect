const fs = require('fs');
const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_0021a7.txt', 'utf8');
const errIdx = str.indexOf('"message":');
console.log(str.substring(errIdx, errIdx + 200));
