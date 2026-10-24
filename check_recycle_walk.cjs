const fs = require('fs');
const path = require('path');

const base = 'C:\\$Recycle.Bin\\S-1-5-21-1121951541-399437690-1993749755-1002';
if (fs.existsSync(base)) {
  const items = fs.readdirSync(base);
  for (const item of items) {
    const full = path.join(base, item);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const sub = fs.readdirSync(full);
        console.log('Dir in Recycle:', item, sub.slice(0, 5));
        // Check for App.jsx in this dir
        function walk(d) {
          try {
            fs.readdirSync(d).forEach(f => {
              const p = path.join(d, f);
              if (fs.statSync(p).isDirectory()) walk(p);
              else if (f === 'App.jsx' || (f.endsWith('.jsx') && fs.statSync(p).size > 100000)) {
                console.log('  *** FOUND IN RECYCLE:', p, fs.statSync(p).size, fs.statSync(p).mtime);
              }
            });
          } catch(e) {}
        }
        walk(full);
      }
    } catch(e) {}
  }
}
