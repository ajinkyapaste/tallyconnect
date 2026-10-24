const fs = require('fs');

const content = fs.readFileSync('d:/Prototype/recovered_App.jsx', 'utf8');
const end = content.indexOf('const FeedbackModal =');
console.log(content.substring(end - 1500, end));
