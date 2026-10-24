const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const end = content.indexOf('const FeedbackModal =');
console.log(content.substring(end - 3500, end - 1500));
