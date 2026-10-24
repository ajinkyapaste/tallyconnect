const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/monthly_sales_f2123.txt', 'utf8');
const debitIdx = str.indexOf('Total Debit');
console.log('Total Debit in monthly_sales_f2123:');
console.log(str.substring(Math.max(0, debitIdx - 1500), debitIdx + 300));
