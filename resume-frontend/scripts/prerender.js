/**
 * Prerender script: runs react-snap then fixes canonical URLs.
 * Handles Chromium path for both local Windows dev and Docker/CI (Linux).
 * Safe to skip if Chromium is unavailable — build will still work, just without prerender.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');

// Detect Chromium executable
function findChromium() {
  // 1. Environment variable (Docker/CI sets this)
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  // 2. System chromium (Linux/Docker)
  const linuxPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }
  // 3. Local Windows dev cache
  const winCache = 'C:\\Users\\yuhan\\.cache\\puppeteer\\chrome\\win64-121.0.6167.85\\chrome-win64\\chrome.exe';
  if (fs.existsSync(winCache)) return winCache;

  return null;
}

// Fix localhost canonical URLs in prerendered HTML
function fixCanonicals() {
  function findHtmlFiles(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results = results.concat(findHtmlFiles(full));
      else if (entry.name === 'index.html') results.push(full);
    }
    return results;
  }

  const files = findHtmlFiles(BUILD_DIR);
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('localhost')) {
      fs.writeFileSync(file, content.replace(/http:\/\/localhost:\d+/g, 'https://hihired.org'), 'utf8');
      count++;
    }
  }
  console.log(`✅ Fixed canonical URLs in ${count} files`);
}

// Main
const chromiumPath = findChromium();

if (!chromiumPath) {
  console.warn('⚠️  Chromium not found — skipping prerender. Build will work without prerendered HTML.');
  process.exit(0);
}

console.log(`🔍 Using Chromium: ${chromiumPath}`);

// Write a temporary react-snap config override with the detected Chromium path
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const originalPath = pkg.reactSnap.puppeteerExecutablePath;
pkg.reactSnap.puppeteerExecutablePath = chromiumPath;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

try {
  console.log('🚀 Running react-snap...');
  execSync('npx react-snap', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  fixCanonicals();
  console.log('✅ Prerender complete');
} catch (err) {
  console.error('❌ react-snap failed:', err.message);
  console.warn('⚠️  Continuing without prerender — site will still work.');
} finally {
  // Restore original path in package.json
  pkg.reactSnap.puppeteerExecutablePath = originalPath;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
}
