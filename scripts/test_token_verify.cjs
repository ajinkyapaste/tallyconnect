const jwt = require('../tally-backend/node_modules/jsonwebtoken');

(async () => {
  const res = await fetch('https://tallymobile.utkarshmishra.online/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'tallyconnect@gmail.com',
      password: 'abcd@123',
      loginType: 'ADMIN'
    })
  });
  console.log('Login status:', res.status);
  const data = await res.json();
  console.log('User data:', data.user);
  if (data.token) {
    console.log('Token:', data.token);
    const decoded = jwt.decode(data.token, { complete: true });
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));

    // Test verifying with process.env.JWT_SECRET from .env
    const secret = "qTDbDAfreT22Y07hpQf8/zqLr9OXf6dgEb3qbgooB6g=";
    try {
      jwt.verify(data.token, secret);
      console.log('VERIFIED with env secret!');
    } catch (err) {
      console.log('FAILED with env secret:', err.message);
    }
  }
})();
