const fs = require('fs');

const str = fs.readFileSync('d:/Prototype/recovered_from_Edge_f_002123.txt', 'utf8');

// Find MonthlySummary in f_002123
const msIdx = str.indexOf('const MonthlySummary =');
console.log('MonthlySummary at:', msIdx);
if (msIdx !== -1) {
  // Let's see how MonthlySummary renders in f_002123
  const returnIdx = str.indexOf('return /* @__PURE__ */ _jsxDEV("div", {\n\t\tclassName: "dashboard-content slide-up"', msIdx);
  console.log('returnIdx:', returnIdx);
  const endIdx = str.indexOf('const FeedbackModal =', returnIdx);
  console.log('endIdx:', endIdx);
  console.log('MonthlySummary body in f_002123:');
  console.log(str.substring(returnIdx, returnIdx + 4000));
}
