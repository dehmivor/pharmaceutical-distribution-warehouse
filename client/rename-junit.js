const fs = require('fs');
const path = require('path');

// Sửa đường dẫn src thành tương đối
const src = path.join(__dirname, 'test-results', 'junit.xml');
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = [
  now.getFullYear(),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
  pad(now.getHours()),
  pad(now.getMinutes()),
  pad(now.getSeconds())
].join('-');
const dest = path.join(__dirname, 'test-results', `junit-${timestamp}.xml`);

if (fs.existsSync(src)) {
  fs.renameSync(src, dest);
  console.log('Renamed to', dest);
} else {
  console.log('File not found:', src);
}
