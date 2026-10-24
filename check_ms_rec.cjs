const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const start = content.indexOf('const MonthlySales =');
const end = content.indexOf('const FeedbackModal =');

console.log('MonthlySales start:', start, 'FeedbackModal at:', end);
console.log('Snippet length in recovered_App.jsx:', end - start);
fs.writeFileSync('d:/Prototype/monthly_sales_recovered.txt', content.substring(start, end));
