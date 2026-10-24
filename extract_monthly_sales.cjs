const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');

// Find where MonthlySales component starts in f_002123
const start = str.indexOf('Monthly Sales & Summary');
const end = str.indexOf('FeedbackModal', start);

console.log('MonthlySales start:', start, 'end:', end);
console.log('Snippet length:', end - start);
fs.writeFileSync('d:/Prototype/monthly_sales_f2123.txt', str.substring(start - 1000, end));
console.log('Saved to d:/Prototype/monthly_sales_f2123.txt');
