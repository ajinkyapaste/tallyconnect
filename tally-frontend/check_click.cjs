const fs = require('fs');
const app = fs.readFileSync('src/App.jsx', 'utf8');
const start = app.indexOf('summary-card');
console.log(app.substring(start, start + 1500));
