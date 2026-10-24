const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/monthly_sales_f2123.txt', 'utf8');
const drillIdx = str.indexOf('drillMonth.credit');
console.log('drillMonth.credit at:', drillIdx);
console.log(str.substring(drillIdx - 1500, drillIdx + 500));
