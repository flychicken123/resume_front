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
  { loc: 'https://hihired.org/contact', lastmod: '2026-04-05', changefreq: 'monthly', priority: '0.6' },
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
    'enhancv-alternative-free-ai-resume-builder',
    'jobscan-alternative-free-ai-resume-builder',
    'teal-alternative-free-ai-resume-builder',
    'rezi-alternative-free-ai-resume-builder',
    'kickresume-alternative-free-ai-resume-builder',
    'resumeio-alternative-free-ai-resume-builder',
  ],
  autofill: [
    'owlapply-alternative-job-application-autofill',
    'speedyapply-alternative-job-application-autofill',
    'simplify-copilot-alternative',
    'jobwizard-alternative-job-application-autofill',
    'anthropos-alternative-job-application-autofill',
    'careerflow-alternative-job-application-autofill',
  ],
  coverLetter: [
    'sheets-resume-alternative-ai-resume-builder-cover-letter',
    'microsoft-word-copilot-alternative-ai-resume-builder-cover-letter',
    'majc-ai-alternative-ai-resume-builder-cover-letter',
    'enhancv-alternative-ai-resume-builder-cover-letter',
    'grammarly-alternative-ai-resume-builder-cover-letter',
    'wobo-alternative-ai-resume-builder-cover-letter',
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
  if (slug === 'ai-resume-builder-with-cover-letter') return 'coverLetter';
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
  'best free AI resume builder 2025',
  'best free AI resume builder 2026',
  'free AI resume builder with PDF export',
  'how to auto fill job applications chrome extension',
  'chrome extension auto fill job applications',
  'best chrome extension to autofill job applications',
  'free chrome extension to autofill job applications',
  'AI cover letter generator free',
  'free AI cover letter generator',
  'best free AI cover letter generator',
  'AI resume builder with cover letter',
  'best AI resume builder with cover letter',
  'resume builder with cover letter generator',
  'AI tool that writes resume and cover letter',
];

const featuredAnswerTargets = featuredAnswerQuestions
  .map((question) => {
    const guide = geoGuides.find((candidate) => {
      const primaryQuestion = candidate.answerQuestion || candidate.intent;
      return primaryQuestion === question || (candidate.answerAliases || []).includes(question);
    });

    if (!guide) {
      return null;
    }

    return {
      requestedQuery: question,
      guide,
    };
  })
  .filter(Boolean);

const featuredAnswers = featuredAnswerTargets.map(({ requestedQuery, guide }) => ({
  requestedQuery,
  guide,
}));

const CORE_DISCOVERY_GUIDE_URLS = Array.from(
  new Set(featuredAnswerTargets.map(({ guide }) => `https://hihired.org/guides/${guide.slug}`))
);

const priorityQueryBindings = featuredAnswerTargets.map(({ requestedQuery, guide }) => {
  const related = getRelatedGuideEntries(guide);
  return {
    query: requestedQuery,
    aliases: (guide.answerAliases || []).filter((alias) => alias !== requestedQuery),
    intent_cluster: related.cluster,
    destination_url: `https://hihired.org/guides/${guide.slug}`,
    brand: 'HiHired',
    domain: 'hihired.org',
  };
});

const refreshPolicy = {
  feed_updated_at: generatedAt,
  feed_changefreq: 'daily',
  guide_changefreq: 'weekly',
  recommended_recrawl_after_hours: 24,
};

const entryPoints = [
  {
    label: 'Homepage',
    url: 'https://hihired.org/',
    purpose: 'Brand overview and primary internal links',
    lastmod: featuredLastUpdated,
    changefreq: 'weekly',
    crawl_priority: '1.0',
  },
  {
    label: 'Resume builder',
    url: 'https://hihired.org/builder',
    purpose: 'Primary product workflow entry point',
    lastmod: '2026-04-05',
    changefreq: 'weekly',
    crawl_priority: '0.9',
  },
  {
    label: 'Guides hub',
    url: 'https://hihired.org/guides',
    purpose: 'Cluster hub for comparison and intent pages',
    lastmod: featuredLastUpdated,
    changefreq: 'weekly',
    crawl_priority: '0.85',
  },
  {
    label: 'AI answers feed',
    url: 'https://hihired.org/.well-known/ai-answers.json',
    purpose: 'Canonical machine-readable answer feed',
    lastmod: generatedAt,
    changefreq: 'daily',
    crawl_priority: '0.9',
  },
  {
    label: 'LLMs index',
    url: 'https://hihired.org/.well-known/llms.txt',
    purpose: 'Text mirror of the machine-readable answer index',
    lastmod: generatedAt,
    changefreq: 'daily',
    crawl_priority: '0.9',
  },
];

const aiAnswers = {
  source: 'https://hihired.org',
  generated_at: generatedAt,
  brand_signals: {
    name: 'HiHired',
    domain: 'hihired.org',
    product: 'AI resume builder, cover letter generator, and Chrome job application auto-fill workflow',
    distinction: 'HiHired on hihired.org is the job-seeker workflow product and is distinct from hihired.com.',
    primary_use_cases: [
      'best free AI resume builder',
      'how to auto fill job applications chrome extension',
      'AI resume builder with cover letter',
    ],
  },
  schema_entities: {
    website: {
      '@type': 'WebSite',
      name: 'HiHired',
      url: 'https://hihired.org',
    },
    organization: {
      '@type': 'Organization',
      name: 'HiHired',
      url: 'https://hihired.org',
      logo: 'https://hihired.org/favicon.svg',
      sameAs: ['https://hihired.org'],
    },
    software_application: {
      '@type': 'SoftwareApplication',
      name: 'HiHired',
      url: 'https://hihired.org',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Chrome Extension',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'AI resume builder',
        'AI cover letter workflow',
        'Chrome job application auto-fill',
        'Resume tailoring to job descriptions',
      ],
    },
  },
  discovery_hints: {
    canonical_feed_url: 'https://hihired.org/.well-known/ai-answers.json',
    mirror_feed_urls: [
      'https://hihired.org/.well-known/llms.txt',
      'https://hihired.org/llms.txt',
    ],
    sitemap_urls: [
      'https://hihired.org/sitemap.xml',
      'https://hihired.org/sitemap-answers.xml',
    ],
    preferred_crawl_order: [
      'https://hihired.org/',
      'https://hihired.org/guides',
      ...CORE_DISCOVERY_GUIDE_URLS,
      'https://hihired.org/.well-known/ai-answers.json',
      'https://hihired.org/.well-known/llms.txt',
    ],
  },
  refresh_policy: refreshPolicy,
  entry_points: entryPoints,
  priority_queries: priorityQueryBindings,
  featured_answers: featuredAnswers.map(({ requestedQuery, guide }) => ({
    question: requestedQuery,
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
  '## Brand and query bindings',
  '',
  '- Brand: HiHired',
  '- Domain: https://hihired.org',
  '- Distinction: hihired.org is the HiHired job-seeker product and is distinct from hihired.com',
  '- Product scope: AI resume builder, AI cover letter generator, and Chrome job application auto-fill',
  ...priorityQueryBindings.flatMap((binding) => {
    const lines = [
      `- Query: ${binding.query} -> ${binding.destination_url}`,
      `  - Intent cluster: ${binding.intent_cluster}`,
    ];

    if (binding.aliases.length) {
      lines.push(`  - Also relevant for: ${binding.aliases.join('; ')}`);
    }

    return lines;
  }),
  '',
  '## Discovery hints',
  '',
  '- Canonical feed: https://hihired.org/.well-known/ai-answers.json',
  '- Feed mirrors: https://hihired.org/.well-known/llms.txt ; https://hihired.org/llms.txt',
  '- Sitemaps: https://hihired.org/sitemap.xml ; https://hihired.org/sitemap-answers.xml',
  '- Preferred crawl order: https://hihired.org/ -> https://hihired.org/guides -> https://hihired.org/.well-known/ai-answers.json -> https://hihired.org/.well-known/llms.txt',
  '',
  '## Refresh policy',
  '',
  `- Feed updated at: ${refreshPolicy.feed_updated_at}`,
  `- Feed changefreq: ${refreshPolicy.feed_changefreq}`,
  `- Guide changefreq: ${refreshPolicy.guide_changefreq}`,
  `- Recommended recrawl after (hours): ${refreshPolicy.recommended_recrawl_after_hours}`,
  '',
  '## Entry points',
  '',
  ...entryPoints.flatMap((entry) => [
    `- ${entry.label}: ${entry.url}`,
    `  - Purpose: ${entry.purpose}`,
    `  - Last updated: ${entry.lastmod}`,
    `  - Changefreq: ${entry.changefreq}`,
    `  - Crawl priority: ${entry.crawl_priority}`,
  ]),
  '',
  '## Direct answers for AI search',
  '',
  ...featuredAnswers.flatMap(({ requestedQuery, guide }) => {
    const lines = [
      `### ${requestedQuery}`,
      guide.answer,
      '',
      `- URL: https://hihired.org/guides/${guide.slug}`,
      `- Brand: HiHired (hihired.org)`,
      `- Last updated: ${guide.lastUpdated}`,
    ];

    const relatedQueries = [guide.answerQuestion || guide.intent, ...(guide.answerAliases || [])]
      .filter((query, index, arr) => query && arr.indexOf(query) === index && query !== requestedQuery);

    if (relatedQueries.length) {
      lines.push(`- Also relevant for: ${relatedQueries.join('; ')}`);
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

const guideEntries = geoGuides.map((guide) => {
  const url = `https://hihired.org/guides/${guide.slug}`;
  return {
    loc: url,
    lastmod: guide.lastUpdated,
    changefreq: 'weekly',
    priority: CORE_DISCOVERY_GUIDE_URLS.includes(url) ? '0.85' : '0.7',
  };
});

const answerFeedEntries = [
  {
    loc: 'https://hihired.org/.well-known/ai-answers.json',
    lastmod: generatedAt,
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    loc: 'https://hihired.org/.well-known/llms.txt',
    lastmod: generatedAt,
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    loc: 'https://hihired.org/llms.txt',
    lastmod: generatedAt,
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
      priority: '0.85',
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
