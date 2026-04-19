/**
 * Generate AI-answer discovery assets from geoGuides.
 * Outputs:
 *   - public/.well-known/ai-answers.json
 *   - public/sitemap-answers.xml
 *   - public/sitemap.xml
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

const staticRoutes = [
  { loc: 'https://hihired.org/', lastmod: featuredLastUpdated, changefreq: 'weekly', priority: '1.0' },
  { loc: 'https://hihired.org/builder', lastmod: '2026-04-05', changefreq: 'weekly', priority: '0.9' },
  { loc: 'https://hihired.org/guides', lastmod: featuredLastUpdated, changefreq: 'weekly', priority: '0.85' },
  { loc: 'https://hihired.org/templates', lastmod: '2026-04-05', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://hihired.org/pricing', lastmod: '2026-04-05', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://hihired.org/job-application', lastmod: '2026-04-05', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://hihired.org/contact', lastmod: '2026-04-05', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://hihired.org/login', lastmod: '2026-04-05', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://hihired.org/privacy', lastmod: '2026-04-05', changefreq: 'yearly', priority: '0.4' },
  { loc: 'https://hihired.org/terms', lastmod: '2026-04-05', changefreq: 'yearly', priority: '0.4' },
];

function resolveUrl(href = '/') {
  return href.startsWith('http') ? href : `https://hihired.org${href.startsWith('/') ? href : `/${href}`}`;
}

function toSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
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

const guideEntries = geoGuides.map((guide) => ({
  loc: `https://hihired.org/guides/${guide.slug}`,
  lastmod: guide.lastUpdated,
  changefreq: 'weekly',
  priority: '0.7',
}));

fs.writeFileSync(
  path.join(publicDir, 'sitemap-answers.xml'),
  toSitemapXml([
    {
      loc: 'https://hihired.org/guides',
      lastmod: featuredLastUpdated,
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...guideEntries,
  ]),
  'utf-8'
);

fs.writeFileSync(
  path.join(publicDir, 'sitemap.xml'),
  toSitemapXml([...staticRoutes, ...guideEntries]),
  'utf-8'
);

console.log('✅ Generated public/.well-known/ai-answers.json');
console.log('✅ Generated public/sitemap-answers.xml');
console.log('✅ Generated public/sitemap.xml');
