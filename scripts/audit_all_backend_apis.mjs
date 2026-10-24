import fs from 'fs';
import path from 'path';

const backendRoutesDir = 'd:/Prototype/tally-backend/routes';
const serverJsPath = 'd:/Prototype/tally-backend/server.js';
const frontendSrcDir = 'd:/Prototype/tally-frontend/src';

// 1. Read server.js to map routers to their mount paths
const serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Parse imports in server.js
const importMap = {};
const importRegex = /import\s+(?:(\w+)|\{\s*([\w\s,]+)\s*\})\s+from\s+["'](\.[^"']+)["']/g;
let m;
while ((m = importRegex.exec(serverJs)) !== null) {
  const defaultImport = m[1];
  const namedImports = m[2];
  const importPath = m[3];
  if (defaultImport) {
    importMap[defaultImport] = importPath;
  }
  if (namedImports) {
    namedImports.split(',').forEach(n => {
      importMap[n.trim()] = importPath;
    });
  }
}

// Parse app.use in server.js
const mountMap = [];
const appUseRegex = /app\.use\(\s*(?:["']([^"']+)["']\s*,\s*)?(?:[^,()]+,\s*)*(\w+)\s*\)/g;
while ((m = appUseRegex.exec(serverJs)) !== null) {
  const prefix = m[1] || '';
  const routerName = m[2];
  if (importMap[routerName]) {
    mountMap.push({
      prefix: prefix.replace(/\/+$/, ''),
      routerName,
      fileRel: importMap[routerName]
    });
  }
}

// Also check direct routes in server.js
const allEndpoints = [];
const serverRouteRegex = /app\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
while ((m = serverRouteRegex.exec(serverJs)) !== null) {
  allEndpoints.push({
    method: m[1].toUpperCase(),
    path: m[2],
    sourceFile: 'server.js',
    mountPrefix: ''
  });
}

// Helper to recursively list route files
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const routeFiles = getFiles(backendRoutesDir);

// 2. Parse routes from each route file
for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const normalizedFileRel = './routes/' + path.relative(backendRoutesDir, file).replace(/\\/g, '/');
  
  // Find matching mounts in server.js
  const matchingMounts = mountMap.filter(mount => {
    const p1 = mount.fileRel.replace(/\.js$/, '');
    const p2 = normalizedFileRel.replace(/\.js$/, '');
    return p1 === p2;
  });

  const prefixes = matchingMounts.length > 0 ? matchingMounts.map(m => m.prefix) : [''];

  const routeRegex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
  while ((m = routeRegex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const routePath = m[2];

    for (const prefix of prefixes) {
      let fullPath = (prefix + (routePath === '/' ? '' : routePath)) || '/';
      if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;

      allEndpoints.push({
        method,
        path: fullPath,
        subPath: routePath,
        sourceFile: path.relative('d:/Prototype/tally-backend', file).replace(/\\/g, '/'),
        prefix
      });
    }
  }
}

// 3. Scan frontend files for API calls
function getFrontendFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFrontendFiles(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const frontendFiles = getFrontendFiles(frontendSrcDir);
const frontendContents = frontendFiles.map(f => ({
  file: path.relative('d:/Prototype/tally-frontend', f).replace(/\\/g, '/'),
  content: fs.readFileSync(f, 'utf8')
}));

// 4. Cross-reference endpoints
const results = allEndpoints.map(ep => {
  // Normalize path pattern for regex search in frontend
  // e.g. /users/:id/role -> /users/ or /role
  const pathParts = ep.path.split('/').filter(Boolean);
  const staticParts = pathParts.filter(p => !p.startsWith(':'));
  const staticPath = '/' + staticParts.join('/');
  
  let connectedFiles = [];
  
  for (const fc of frontendContents) {
    // Check direct path match e.g. '/company' or '/sync-queue/pending'
    if (fc.content.includes(ep.path) || (staticParts.length > 0 && fc.content.includes(staticPath))) {
      connectedFiles.push(fc.file);
    } else if (ep.path.includes(':')) {
      // dynamic route check
      const basePrefix = ep.path.split('/:')[0];
      if (basePrefix && fc.content.includes(basePrefix)) {
        connectedFiles.push(fc.file);
      }
    }
  }

  // Deduplicate
  connectedFiles = [...new Set(connectedFiles)];

  let category = 'User-facing (UI)';
  if (ep.path.startsWith('/api/mobile') || ep.path.includes('mobile-')) {
    category = 'Mobile App (Flutter/Android)';
  } else if (
    ep.path.startsWith('/sync') ||
    ep.path.startsWith('/agent') ||
    ep.path.startsWith('/sync-queue') ||
    ep.path.includes('/bulk-sync') ||
    ep.path.includes('/mark-inactive') ||
    ep.path.startsWith('/voucher-command')
  ) {
    category = 'Agent & Tally Connector (Desktop Worker)';
  } else if (ep.path.startsWith('/auth') || ep.path.startsWith('/api/auth')) {
    category = 'Auth & Security';
  } else if (ep.path.startsWith('/company') || ep.path.startsWith('/ledger') || ep.path.startsWith('/voucher-entry') || ep.path.startsWith('/bill') || ep.path.startsWith('/orders') || ep.path.startsWith('/inventory') || ep.path.startsWith('/stock') || ep.path.startsWith('/reports') || ep.path.startsWith('/dashboard') || ep.path.startsWith('/users')) {
    category = 'Core ERP Data';
  }

  return {
    ...ep,
    isConnected: connectedFiles.length > 0,
    connectedIn: connectedFiles,
    category
  };
});

// Group by category and print summary
const total = results.length;
const connected = results.filter(r => r.isConnected).length;
const notConnected = results.filter(r => !r.isConnected).length;

console.log(`\n======================================================`);
console.log(`TOTAL BACKEND ENDPOINTS: ${total}`);
console.log(`CONNECTED IN FRONTEND: ${connected}`);
console.log(`NOT CONNECTED DIRECTLY IN WEB UI: ${notConnected}`);
console.log(`======================================================\n`);

const byCategory = {};
for (const r of results) {
  if (!byCategory[r.category]) {
    byCategory[r.category] = { total: 0, connected: 0, notConnected: 0, endpoints: [] };
  }
  byCategory[r.category].total++;
  if (r.isConnected) byCategory[r.category].connected++;
  else byCategory[r.category].notConnected++;
  byCategory[r.category].endpoints.push(r);
}

for (const [cat, data] of Object.entries(byCategory)) {
  console.log(`### ${cat} (Total: ${data.total}, Connected: ${data.connected}, Unconnected: ${data.notConnected})`);
  for (const ep of data.endpoints) {
    const mark = ep.isConnected ? '✅ CONNECTED' : '⏳ UNCONNECTED';
    console.log(`  ${mark} [${ep.method}] ${ep.path} (from ${ep.sourceFile}) ${ep.isConnected ? '-> ' + ep.connectedIn.slice(0, 2).join(', ') : ''}`);
  }
  console.log('');
}

fs.writeFileSync('scripts/audit_results.json', JSON.stringify({ total, connected, notConnected, byCategory, results }, null, 2));
