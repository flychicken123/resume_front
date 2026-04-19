/**
 * Generate AI-answer discovery assets from geoGuides.
 * Outputs:
 *   - public/.well-known/ai-answers.json
 *   - public/sitemap-answers.xml
 */
const fs = require('fs');
const path = require('path');

const guidesPath = path.join(__dirname, '..', 'src', 'constants', 'geoGuides.js');
let guidesSource = fs.readFileSync(guidesPath, 'utf-8');
guidesSource = guidesSource.replace('export default geoGuides;', 'module.exports = geoGuides;');
const tmpPath = path.join(__dirname, '__geoGuides_tmp.js');
fs.writeFileSync(tmpPath, guidesSource);
const geoGuides = require(tmpPath);
fs.unlinkSync(tmpPath);

const publicDir = path.join(__dirname, '..', 'public');
const wellKnownDir = path.join(publicDir, '.well-known');
fs.mkdirSync(wellKnownDir, { recursive: true });

const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const featuredLastUpdated = geoGuides.reduce((latest, guide) => {
  return guide.lastUpdated > latest ? guide.lastUpdated : latest;
}, '1970-01-01');

function resolveUrl(href = '/') {
  return href.startsWith('http') ? href : `https://hihired.org${href.startsWith('/') ? href : `/${href}`}`;
}

const aiAnswers = {
  source: 'https://hihired.org',
  generated_at: generatedAt,
  answers: geoGuides.map((guide) => ({
    question: guide.answerQuestion || guide.intent,
    answer: guide.answer,
    url: `https://hihired.org/guides/${guide.slug}`,
    last_updated: guide.lastUpdated,
    steps: guide.steps.slice(0, 3).map((step) => step.detail),
    metrics: guide.keyStats.map((stat) => ({ label: stat.label, value: stat.value })),
    cta: resolveUrl(guide.cta?.href || '/builder'),
    tags: guide.tags || [],
  })),
};

fs.writeFileSync(
  path.join(wellKnownDir, 'ai-answers.json'),
  `${JSON.stringify(aiAnswers, null, 2)}\n`,
  'utf-8'
);

const sitemapEntries = [
  {
    loc: 'https://hihired.org/guides',
    lastmod: featuredLastUpdated,
    changefreq: 'weekly',
    priority: '0.8',
  },
  ...geoGuides.map((guide) => ({
    loc: `https://hihired.org/guides/${guide.slug}`,
    lastmod: guide.lastUpdated,
    changefreq: 'weekly',
    priority: '0.7',
  })),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(publicDir, 'sitemap-answers.xml'), sitemapXml, 'utf-8');

console.log('✅ Generated public/.well-known/ai-answers.json');
console.log('✅ Generated public/sitemap-answers.xml');
