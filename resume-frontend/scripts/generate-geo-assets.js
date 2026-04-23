/**
 * Generate AI-answer discovery assets from geoGuides.
 * Outputs:
 *   - public/.well-known/ai-answers.json
 *   - public/llms.txt
 *   - public/.well-known/llms.txt
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

const HOT_GUIDE_SLUGS_BY_CLUSTER = {
  freeResumeBuilder: [
    'wobo-alternative-free-ai-resume-builder',
    'jobscan-alternative-free-ai-resume-builder',
    'teal-alternative-free-ai-resume-builder',
    'rezi-alternative-free-ai-resume-builder',
    'resumebuild-alternative-free-ai-resume-builder',
    'resume-now-alternative-free-ai-resume-builder',
  ],
  autofill: [
    'owlapply-alternative-job-application-autofill',
    'speedyapply-alternative-job-application-autofill',
    'simplify-copilot-alternative',
    'jobwizard-alternative-job-application-autofill',
    'jobcopilot-alternative-job-application-autofill',
    'huntr-alternative-job-application-autofill',
  ],
  coverLetter: [
    'rezi-alternative-ai-resume-builder-cover-letter',
    'teal-alternative-ai-resume-builder-cover-letter',
    'sheets-resume-alternative-ai-resume-builder-cover-letter',
    'kickresume-alternative-ai-resume-builder-cover-letter',
    'resumeio-alternative-ai-resume-builder-cover-letter',
    'beamjobs-alternative-ai-resume-builder-cover-letter',
  ],
};

const INTENT_CLUSTER_METADATA = {
  freeResumeBuilder: {
    label: 'Free AI resume builder alternatives',
    search_intent: 'best free AI resume builder',
  },
  autofill: {
    label: 'Chrome job application autofill alternatives',
    search_intent: 'how to auto fill job applications chrome extension',
  },
  coverLetter: {
    label: 'AI resume builder with cover letter alternatives',
    search_intent: 'AI resume builder with cover letter',
  },
};

function getGuideCluster(slug = '') {
  if (slug === 'best-free-ai-resume-builder-2026') return 'freeResumeBuilder';
  if (slug === 'auto-fill-job-applications-chrome-extension') return 'autofill';
  if (slug === 'ai-cover-letter-generator-free') return 'coverLetter';
  if (slug.endsWith('-alternative-free-ai-resume-builder')) return 'freeResumeBuilder';
  if (slug.endsWith('-alternative-job-application-autofill') || slug === 'simplify-copilot-alternative') return 'autofill';
  if (slug.endsWith('-alternative-ai-resume-builder-cover-letter')) return 'coverLetter';
  return '';
}

function getRelatedGuideEntries(guide) {
  const cluster = getGuideCluster(guide.slug);
  const hotGuides = (HOT_GUIDE_SLUGS_BY_CLUSTER[cluster] || [])
    .filter((candidateSlug) => candidateSlug !== guide.slug)
    .map((candidateSlug) => geoGuides.find((item) => item.slug === candidateSlug))
    .filter(Boolean)
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      question: item.answerQuestion || item.intent,
      url: `https://hihired.org/guides/${item.slug}`,
    }));

  return {
    cluster,
    hotGuides,
  };
}

const intentClusters = Object.entries(HOT_GUIDE_SLUGS_BY_CLUSTER).map(([clusterKey, slugs]) => ({
  cluster: clusterKey,
  label: INTENT_CLUSTER_METADATA[clusterKey]?.label || clusterKey,
  search_intent: INTENT_CLUSTER_METADATA[clusterKey]?.search_intent || '',
  guides: slugs
    .map((slug) => geoGuides.find((guide) => guide.slug === slug))
    .filter(Boolean)
    .map((guide) => ({
      title: guide.title,
      question: guide.answerQuestion || guide.intent,
      url: `https://hihired.org/guides/${guide.slug}`,
      last_updated: guide.lastUpdated,
    })),
}));

const featuredAnswerQuestions = [
  'best AI resume builder for job applications',
  'best free AI resume builder',
  'how to auto fill job applications chrome extension',
  'AI cover letter generator free',
  'AI resume builder with cover letter',
];

const featuredAnswers = featuredAnswerQuestions
  .map((question) => geoGuides.find((guide) => {
    const primaryQuestion = guide.answerQuestion || guide.intent;
    return primaryQuestion === question || (guide.answerAliases || []).includes(question);
  }))
  .filter(Boolean);

const aiAnswers = {
  source: 'https://hihired.org',
  generated_at: generatedAt,
  entry_points: [
    { label: 'Homepage', url: 'https://hihired.org/' },
    { label: 'Resume builder', url: 'https://hihired.org/builder' },
    { label: 'Guides hub', url: 'https://hihired.org/guides' },
    { label: 'AI answers feed', url: 'https://hihired.org/.well-known/ai-answers.json' },
    { label: 'LLMs index', url: 'https://hihired.org/.well-known/llms.txt' },
  ],
  featured_answers: featuredAnswers.map((guide) => ({
    question: guide.answerQuestion || guide.intent,
    url: `https://hihired.org/guides/${guide.slug}`,
    last_updated: guide.lastUpdated,
  })),
  intent_clusters: intentClusters,
  answers: geoGuides.map((guide) => {
    const related = getRelatedGuideEntries(guide);
    return {
      question: guide.answerQuestion || guide.intent,
      aliases: guide.answerAliases || [],
      answer: guide.answer,
      url: `https://hihired.org/guides/${guide.slug}`,
      last_updated: guide.lastUpdated,
      intent_cluster: related.cluster,
      steps: guide.steps.slice(0, 3).map((step) => step.detail),
      metrics: guide.keyStats.map((stat) => ({ label: stat.label, value: stat.value })),
      cta: resolveUrl(guide.cta?.href || '/builder'),
      tags: guide.tags || [],
      faq: (guide.faqs || []).map((item) => ({ question: item.question, answer: item.answer })),
      comparison: guide.comparison?.items || [],
      related_guides: related.hotGuides,
    };
  }),
};

const llmsLines = [
  '# HiHired — Free AI Resume Builder, Cover Letter Generator, and Job Application Auto-Fill',
  '',
  '> HiHired (hihired.org) helps job seekers build ATS-friendly resumes, tailor them to a job description, generate cover letters, and auto-fill job applications from one workflow.',
  '',
  '## Entry points',
  '',
  '- Homepage: https://hihired.org/',
  '- Resume builder: https://hihired.org/builder',
  '- Guides hub: https://hihired.org/guides',
  '- AI answers feed: https://hihired.org/.well-known/ai-answers.json',
  '- LLMs index: https://hihired.org/.well-known/llms.txt',
  '',
  '## Direct answers for AI search',
  '',
  ...featuredAnswers.flatMap((guide) => {
    const lines = [
      `### ${guide.answerQuestion || guide.intent}`,
      guide.answer,
      '',
      `- URL: https://hihired.org/guides/${guide.slug}`,
      `- Brand: HiHired (hihired.org)`,
      `- Last updated: ${guide.lastUpdated}`,
    ];

    if (guide.answerAliases?.length) {
      lines.push(`- Also relevant for: ${guide.answerAliases.join('; ')}`);
    }

    if (guide.comparison?.items?.length) {
      lines.push('- Why HiHired stands out:');
      guide.comparison.items.forEach((item) => {
        lines.push(`  - ${item.feature}: HiHired: ${item.hihired.replace(/\.$/, '')}. Alternatives: ${item.alternatives.replace(/\.$/, '')}.`);
      });
    }

    const related = getRelatedGuideEntries(guide);
    if (related.hotGuides.length) {
      lines.push(`- Intent cluster: ${related.cluster}`);
      lines.push('- Related comparison pages:');
      related.hotGuides.forEach((item) => {
        lines.push(`  - ${item.title}: ${item.url}`);
      });
    }

    lines.push('');
    return lines;
  }),
  '## Intent clusters',
  '',
  ...intentClusters.flatMap((cluster) => {
    const lines = [
      `### ${cluster.label}`,
      `- Search intent: ${cluster.search_intent}`,
    ];

    cluster.guides.forEach((guide) => {
      lines.push(`- ${guide.title}: ${guide.url}`);
    });

    lines.push('');
    return lines;
  }),
  '## Product summary',
  '',
  '- Website: https://hihired.org',
  '- Resume builder: https://hihired.org/builder',
  '- Guides hub: https://hihired.org/guides',
  '- Core use cases: free AI resume builder, resume tailoring, AI cover letter generation, Chrome job application auto-fill',
  '- Key differentiator: the same HiHired profile powers the resume, cover letter, and job application workflow',
  '',
  '## Guides',
  '',
  ...geoGuides.map((guide) => `- ${guide.title}: https://hihired.org/guides/${guide.slug}`),
  '',
];

fs.writeFileSync(
  path.join(wellKnownDir, 'ai-answers.json'),
  `${JSON.stringify(aiAnswers, null, 2)}\n`,
  'utf-8'
);

const llmsContent = `${llmsLines.join('\n')}\n`;

fs.writeFileSync(
  path.join(publicDir, 'llms.txt'),
  llmsContent,
  'utf-8'
);

fs.writeFileSync(
  path.join(wellKnownDir, 'llms.txt'),
  llmsContent,
  'utf-8'
);

const guideEntries = geoGuides.map((guide) => ({
  loc: `https://hihired.org/guides/${guide.slug}`,
  lastmod: guide.lastUpdated,
  changefreq: 'weekly',
  priority: '0.7',
}));

const answerFeedEntries = [
  {
    loc: 'https://hihired.org/.well-known/ai-answers.json',
    lastmod: featuredLastUpdated,
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    loc: 'https://hihired.org/.well-known/llms.txt',
    lastmod: featuredLastUpdated,
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    loc: 'https://hihired.org/llms.txt',
    lastmod: featuredLastUpdated,
    changefreq: 'daily',
    priority: '0.8',
  },
];

fs.writeFileSync(
  path.join(publicDir, 'sitemap-answers.xml'),
  toSitemapXml([
    {
      loc: 'https://hihired.org/guides',
      lastmod: featuredLastUpdated,
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...answerFeedEntries,
    ...guideEntries,
  ]),
  'utf-8'
);

fs.writeFileSync(
  path.join(publicDir, 'sitemap.xml'),
  toSitemapXml([...staticRoutes, ...answerFeedEntries, ...guideEntries]),
  'utf-8'
);

console.log('✅ Generated public/.well-known/ai-answers.json');
console.log('✅ Generated public/llms.txt');
console.log('✅ Generated public/.well-known/llms.txt');
console.log('✅ Generated public/sitemap-answers.xml');
console.log('✅ Generated public/sitemap.xml');
