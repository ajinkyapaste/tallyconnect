import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/audit_results.json', 'utf8'));

// Deduplicate endpoints by Method + Path
const uniqueEndpoints = new Map();
for (const ep of data.results) {
  const key = `${ep.method} ${ep.path}`;
  if (!uniqueEndpoints.has(key)) {
    uniqueEndpoints.set(key, ep);
  } else {
    // Merge connected files
    const existing = uniqueEndpoints.get(key);
    existing.connectedIn = [...new Set([...existing.connectedIn, ...ep.connectedIn])];
    existing.isConnected = existing.isConnected || ep.isConnected;
  }
}

const all = Array.from(uniqueEndpoints.values());

// Classify
const webConnected = [];
const agentConnector = [];
const mobileApp = [];
const internalOrDebug = [];
const remainingWebPotential = [];

for (const ep of all) {
  const p = ep.path;
  const isAgent = (
    p.startsWith('/sync') ||
    p.startsWith('/agent') ||
    p.startsWith('/sync-queue') ||
    p.includes('/bulk-sync') ||
    p.includes('/sync') ||
    p.includes('/mark-inactive') ||
    p.startsWith('/voucher-command')
  );
  const isMobile = p.startsWith('/api/mobile') || p.includes('mobile-');
  const isDebugOrInternal = p === '/check-db' || p.includes('/cleanup') || p.includes('/full-sync');

  if (ep.isConnected) {
    webConnected.push(ep);
  } else if (isAgent) {
    agentConnector.push(ep);
  } else if (isMobile) {
    mobileApp.push(ep);
  } else if (isDebugOrInternal) {
    internalOrDebug.push(ep);
  } else {
    remainingWebPotential.push(ep);
  }
}

console.log('=== DEDUPLICATED ENDPOINT METRICS ===');
console.log(`Total Unique Backend Endpoints: ${all.length}`);
console.log(`1. Connected to Web Frontend: ${webConnected.length}`);
console.log(`2. Windows Agent & Tally Connector (Background Services): ${agentConnector.length}`);
console.log(`3. Mobile App (Flutter/Android Dedicated): ${mobileApp.length}`);
console.log(`4. Internal / Debug / Server Cleanup Utilities: ${internalOrDebug.length}`);
console.log(`5. Remaining Potential Web Endpoints: ${remainingWebPotential.length}`);

console.log('\n--- 1. Connected to Web Frontend (Sample) ---');
webConnected.forEach(e => console.log(`  [${e.method}] ${e.path} (${e.connectedIn.slice(0, 2).join(', ')})`));

console.log('\n--- 2. Windows Agent & Tally Connector Background (Not Browser UI) ---');
agentConnector.forEach(e => console.log(`  [${e.method}] ${e.path} (${e.sourceFile})`));

console.log('\n--- 3. Mobile App Dedicated ---');
mobileApp.forEach(e => console.log(`  [${e.method}] ${e.path} (${e.sourceFile})`));

console.log('\n--- 4. Internal / Debug / Server Utilities ---');
internalOrDebug.forEach(e => console.log(`  [${e.method}] ${e.path} (${e.sourceFile})`));

console.log('\n--- 5. Remaining Potential Web Endpoints ---');
remainingWebPotential.forEach(e => console.log(`  [${e.method}] ${e.path} (${e.sourceFile})`));
