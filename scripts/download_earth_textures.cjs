const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../tally-frontend/public/earth');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('Downloading Earth textures...');
    await downloadFile(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      path.join(targetDir, 'earth_day_2048.jpg')
    );
    await downloadFile(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
      path.join(targetDir, 'earth_lights_2048.png')
    );
    await downloadFile(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
      path.join(targetDir, 'earth_clouds_1024.png')
    );
    console.log('All textures downloaded successfully!');
  } catch (err) {
    console.error('Download error:', err.message);
  }
})();
