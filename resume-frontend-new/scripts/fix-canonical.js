/**
 * Post-processes react-snap output to replace localhost canonical URLs
 * with the production domain.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const LOCALHOST_RE = /http:\/\/localhost:\d+/g;
const PROD_URL = 'https://hihired.org';

// Find all index.html files in the build directory
const files = glob.sync('**/index.html', { cwd: BUILD_DIR, absolute: true });

let count = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (LOCALHOST_RE.test(content)) {
    const fixed = content.replace(LOCALHOST_RE, PROD_URL);
    fs.writeFileSync(file, fixed, 'utf8');
    count++;
    // Reset regex lastIndex
    LOCALHOST_RE.lastIndex = 0;
  }
}

console.log(`✅ Fixed canonical URLs in ${count} files`);
