/**
 * Prerender script: runs react-snap via JS API then fixes canonical URLs.
 * Handles Chromium path for both local Windows dev and Docker/CI (Linux).
 * Safe to skip if Chromium is unavailable.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

// Detect Chromium executable
function findChromium() {
  // 1. Environment variable (Docker/CI sets PUPPETEER_EXECUTABLE_PATH)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const p = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fs.existsSync(p)) return p;
    console.warn(`PUPPETEER_EXECUTABLE_PATH set to ${p} but file not found`);
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
  const winPath = 'C:\\Users\\yuhan\\.cache\\puppeteer\\chrome\\win64-121.0.6167.85\\chrome-win64\\chrome.exe';
  if (fs.existsSync(winPath)) return winPath;

  return null;
}

// Fix localhost canonical URLs in prerendered HTML
function fixCanonicals() {
  function findHtmlFiles(dir) {
    if (!fs.existsSync(dir)) return [];
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

async function main() {
  const chromiumPath = findChromium();

  if (!chromiumPath) {
    console.warn('⚠️  Chromium not found — skipping prerender. Build will work without prerendered HTML.');
    process.exit(0);
  }

  console.log(`🔍 Using Chromium: ${chromiumPath}`);

  let reactSnap;
  try {
    reactSnap = require('react-snap');
  } catch (e) {
    console.warn('⚠️  react-snap not installed — skipping prerender.');
    process.exit(0);
  }

  const options = {
    ...reactSnap.defaultOptions,
    source: 'build',
    minifyHtml: { collapseWhitespace: true, removeComments: false },
    puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    puppeteerExecutablePath: chromiumPath,
    skipThirdPartyRequests: true,
    include: [
      '/',
      '/builder',
      '/pricing',
      '/privacy',
      '/terms',
      '/contact',
      '/login',
      '/guides',
      '/guides/build-free-resume',
      '/guides/ats-resume-checklist',
      '/guides/tailor-to-job-description',
      '/guides/share-resume-securely',
      '/guides/auto-fill-job-applications-chrome-extension',
      '/guides/tailor-resume-to-job-description-ai'
    ]
  };

  try {
    console.log('🚀 Running react-snap...');
    await reactSnap.run(options);
    fixCanonicals();
    console.log('✅ Prerender complete');
  } catch (err) {
    console.error('❌ react-snap failed:', err.message || err);
    console.warn('⚠️  Continuing without prerender — site will still work.');
    // Don't exit(1) — let the build succeed even if prerender fails
  }
}

main().catch(err => {
  console.error('Unexpected error in prerender:', err);
  process.exit(0); // Don't fail the build
});
