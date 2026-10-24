const fs = require('fs');
const path = require('path');

const chromeCache = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Cache', 'Cache_Data');
const edgeCache = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache', 'Cache_Data');

console.log('Chrome cache exists?', fs.existsSync(chromeCache));
console.log('Edge cache exists?', fs.existsSync(edgeCache));

function searchCache(cacheDir, name) {
  if (!fs.existsSync(cacheDir)) return;
  const files = fs.readdirSync(cacheDir);
  console.log(`Searching ${name} (${files.length} files)...`);
  for (const f of files) {
    const full = path.join(cacheDir, f);
    try {
      const stat = fs.statSync(full);
      if (stat.size > 50000 && stat.size < 2000000) {
        const buf = fs.readFileSync(full);
        if (buf.includes('const LedgerList') || buf.includes('LedgerList') && buf.includes('BillsManager')) {
          console.log(`*** FOUND MATCH IN ${name} cache:`, full, 'size:', stat.size, 'time:', stat.mtime);
          fs.writeFileSync(`d:/Prototype/recovered_from_${name}_${f}.txt`, buf);
          console.log(`Saved as d:/Prototype/recovered_from_${name}_${f}.txt`);
        }
      }
    } catch(e) {}
  }
}

searchCache(chromeCache, 'Chrome');
searchCache(edgeCache, 'Edge');
