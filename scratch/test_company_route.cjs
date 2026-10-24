const http = require('http');

async function testLogin(username, password, loginType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ username, password, loginType });
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.write(payload);
    req.end();
  });
}

async function testGet(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.end();
  });
}

async function main() {
  const user = await testLogin('demo-ui@test.local', 'Demo@1234', 'USER');
  const userComps = await testGet('/company', user.token);
  console.log('USER /company:');
  console.log(JSON.stringify(userComps.body, null, 2));

  const admin = await testLogin('sudhirtally@gmail.com', '12345678', 'ADMIN');
  const adminComps = await testGet('/company', admin.token);
  console.log('\nADMIN sudhirtally /company:');
  console.log(JSON.stringify(adminComps.body, null, 2));

  const admin2 = await testLogin('tallyconnect@gmail.com', 'abcd@123', 'ADMIN');
  const admin2Comps = await testGet('/company', admin2.token);
  console.log('\nADMIN tallyconnect /company:');
  console.log(JSON.stringify(admin2Comps.body, null, 2));
}

main().catch(console.error);
