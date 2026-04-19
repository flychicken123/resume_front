/**
 * Pre-render guide pages as static HTML for SEO/GEO.
 * Run: node scripts/prerender-guides.js
 * Output: public/guides/<slug>/index.html
 */
const fs = require('fs');
const path = require('path');

const FEATURED_GUIDE_SLUGS = [
  'best-free-ai-resume-builder-2026',
  'auto-fill-job-applications-chrome-extension',
  'ai-cover-letter-generator-free',
];

const guidesPath = path.join(__dirname, '..', 'src', 'constants', 'geoGuides.js');
let guidesSource = fs.readFileSync(guidesPath, 'utf-8');
guidesSource = guidesSource.replace('export default geoGuides;', 'module.exports = geoGuides;');
const tmpPath = path.join(__dirname, '__geoGuides_tmp.js');
fs.writeFileSync(tmpPath, guidesSource);
const geoGuides = require(tmpPath);
fs.unlinkSync(tmpPath);

const publicDir = path.join(__dirname, '..', 'public');
const templateHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveUrl(href = '/') {
  return href.startsWith('http') ? href : `https://hihired.org${href.startsWith('/') ? href : `/${href}`}`;
}

function replaceMeta(html, title, description, canonical, ogType = 'website') {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta name="title" content="[^"]*"/, `<meta name="title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`);
  html = html.replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="${ogType}"`);
  html = html.replace(/<meta property="twitter:title" content="[^"]*"/, `<meta property="twitter:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="twitter:description" content="[^"]*"/, `<meta property="twitter:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="twitter:url" content="[^"]*"/, `<meta property="twitter:url" content="${canonical}"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);
  return html;
}

function injectStructuredData(html, payloads) {
  const scripts = payloads
    .filter(Boolean)
    .map((payload) => `<script type="application/ld+json">${JSON.stringify(payload)}</script>`)
    .join('\n');
  return html.replace('</head>', `${scripts}\n</head>`);
}

function generateGuidesIndexHtml() {
  const title = 'Free AI Resume Builder, Auto-Fill & Cover Letter Guides | HiHired';
  const description = 'HiHired guides for the best free AI resume builder, how to auto fill job applications with a Chrome extension, and AI resume builder with cover letter workflows on hihired.org.';
  const canonical = 'https://hihired.org/guides';

  const featuredGuides = FEATURED_GUIDE_SLUGS
    .map((slug) => geoGuides.find((guide) => guide.slug === slug))
    .filter(Boolean);

  const quickAnswersHtml = featuredGuides
    .map((guide) => `
      <article style="border:1px solid #e5e7eb;border-radius:16px;padding:20px;background:#fff;">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${escapeHtml(guide.answerQuestion || guide.intent)}</p>
        <h3 style="margin:0 0 10px;font-size:20px;color:#0f172a;">${escapeHtml(guide.title)}</h3>
        <p style="margin:0 0 14px;color:#334155;line-height:1.7;">${escapeHtml(guide.answer)}</p>
        <a href="/guides/${guide.slug}" style="color:#2563eb;font-weight:600;text-decoration:none;">Read answer →</a>
      </article>
    `)
    .join('');

  const cardsHtml = geoGuides
    .map((guide) => `
      <article style="border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:20px;background:#fff;">
        <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">${escapeHtml(guide.intent)}</p>
        <h2 style="margin:0 0 8px;font-size:28px;"><a href="/guides/${guide.slug}" style="color:#0f172a;text-decoration:none;">${escapeHtml(guide.title)}</a></h2>
        <p style="color:#475569;font-size:16px;line-height:1.7;">${escapeHtml(guide.summary)}</p>
        <p style="margin:12px 0 0;color:#1e293b;line-height:1.7;font-weight:600;">${escapeHtml(guide.answer)}</p>
        <div style="margin-top:12px;">
          ${(guide.tags || []).map((tag) => `<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:999px;font-size:12px;margin:0 6px 6px 0;">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <a href="/guides/${guide.slug}" style="display:inline-block;margin-top:14px;color:#2563eb;font-weight:600;text-decoration:none;">Read guide →</a>
      </article>
    `)
    .join('\n');

  const bodyHtml = `
    <div id="seo-prerender" style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;">
      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 12px 32px rgba(15,23,42,0.06);margin-bottom:24px;">
        <p style="color:#2563eb;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:13px;margin:0 0 10px;">HiHired Guides</p>
        <h1 style="font-size:40px;line-height:1.15;color:#0f172a;margin:0 0 14px;">Free AI resume builder, job application auto-fill, and cover letter guides</h1>
        <p style="color:#475569;font-size:17px;line-height:1.8;margin:0 0 18px;">Explore HiHired guides on hihired.org for building ATS-friendly resumes, auto-filling job applications with a Chrome extension, and generating AI cover letters that match each job description.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="/builder" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">Launch the free builder</a>
          <a href="/.well-known/ai-answers.json" style="display:inline-block;padding:12px 20px;border:1px solid #cbd5e1;color:#0f172a;border-radius:10px;text-decoration:none;font-weight:600;">Download JSON feed</a>
        </div>
      </section>

      <section style="margin-bottom:24px;">
        <h2 style="font-size:28px;color:#0f172a;margin:0 0 16px;">Quick answers to popular AI-search questions</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">${quickAnswersHtml}</div>
      </section>

      <section>${cardsHtml}</section>
    </div>
  `;

  const collectionStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HiHired Guides',
    description,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: geoGuides.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://hihired.org/guides/${guide.slug}`,
        name: guide.title,
      })),
    },
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: featuredGuides.map((guide) => ({
      '@type': 'Question',
      name: guide.answerQuestion || guide.intent,
      acceptedAnswer: {
        '@type': 'Answer',
        text: guide.answer,
      },
    })),
  };

  let html = templateHtml;
  html = replaceMeta(html, title, description, canonical);
  html = injectStructuredData(html, [collectionStructuredData, faqStructuredData]);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

function generateGuideHtml(guide) {
  const title = `${guide.title} | HiHired`;
  const canonical = `https://hihired.org/guides/${guide.slug}`;
  const description = guide.summary;
  const faqItems = guide.faqs?.length
    ? guide.faqs
    : [{ question: guide.answerQuestion || guide.intent, answer: guide.answer }];

  const stepsHtml = guide.steps
    .map((step, index) => `
      <li id="step-${index + 1}" style="margin-bottom:16px;">
        <strong>${index + 1}. ${escapeHtml(step.title)}</strong>
        <p style="color:#475569;margin:6px 0 0;line-height:1.7;">${escapeHtml(step.detail)}</p>
      </li>
    `)
    .join('');

  const statsHtml = guide.keyStats
    .map((stat) => `
      <div style="text-align:center;padding:16px;">
        <div style="font-size:28px;font-weight:700;color:#2563eb;">${escapeHtml(stat.value)}</div>
        <div style="font-size:13px;color:#64748b;">${escapeHtml(stat.label)}</div>
      </div>
    `)
    .join('');

  const faqHtml = faqItems
    .map((item) => `
      <article style="margin-bottom:18px;">
        <h3 style="margin:0 0 8px;font-size:20px;color:#0f172a;">${escapeHtml(item.question)}</h3>
        <p style="margin:0;color:#475569;line-height:1.7;">${escapeHtml(item.answer)}</p>
      </article>
    `)
    .join('');

  const bodyHtml = `
    <article id="seo-prerender" style="max-width:860px;margin:0 auto;padding:40px 20px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;">
      <nav style="font-size:14px;color:#64748b;margin-bottom:16px;">
        <a href="/" style="color:#2563eb;text-decoration:none;">Home</a> &gt;
        <a href="/guides" style="color:#2563eb;text-decoration:none;">Guides</a> &gt;
        <span>${escapeHtml(guide.title)}</span>
      </nav>

      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
        <p style="color:#2563eb;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 10px;">${escapeHtml(guide.answerQuestion || guide.intent)}</p>
        <h1 style="font-size:38px;line-height:1.15;color:#0f172a;margin:0 0 16px;">${escapeHtml(guide.title)}</h1>
        <p style="font-size:17px;color:#475569;line-height:1.8;margin:0 0 14px;">${escapeHtml(guide.summary)}</p>
        <p style="font-size:17px;color:#1e293b;line-height:1.8;font-weight:600;margin:0 0 16px;padding:18px;background:#eff6ff;border-radius:14px;border-left:4px solid #2563eb;">${escapeHtml(guide.answer)}</p>
        <div style="margin:0 0 12px;">${(guide.tags || []).map((tag) => `<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:999px;font-size:12px;margin:0 6px 6px 0;">${escapeHtml(tag)}</span>`).join('')}</div>
        <time style="color:#64748b;font-size:13px;" datetime="${guide.lastUpdated}">Updated ${guide.lastUpdated}</time>
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
          <a href="${escapeHtml(guide.cta.href)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">${escapeHtml(guide.cta.label)}</a>
          <a href="/.well-known/ai-answers.json" style="display:inline-block;padding:12px 20px;border:1px solid #cbd5e1;color:#0f172a;border-radius:10px;text-decoration:none;font-weight:600;">Download JSON capsule</a>
        </div>
      </section>

      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:28px;margin-top:20px;">
        <h2 style="margin:0 0 16px;font-size:28px;color:#0f172a;">Step-by-step instructions</h2>
        <ol style="padding-left:20px;margin:0;">${stepsHtml}</ol>
      </section>

      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:28px;margin-top:20px;">
        <h2 style="margin:0 0 16px;font-size:28px;color:#0f172a;">Key stats</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;background:#f8fafc;border-radius:16px;padding:12px;">${statsHtml}</div>
      </section>

      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:28px;margin-top:20px;">
        <h2 style="margin:0 0 16px;font-size:28px;color:#0f172a;">Quick FAQ</h2>
        ${faqHtml}
      </section>

      <section style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:28px;margin-top:20px;">
        <h2 style="margin:0 0 16px;font-size:28px;color:#0f172a;">Sources</h2>
        <ul style="margin:0;padding-left:20px;">${guide.sources.map((source) => `<li style="margin-bottom:8px;"><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a></li>`).join('')}</ul>
      </section>
    </article>
  `;

  const howToStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.summary,
    totalTime: 'PT10M',
    supply: [
      { '@type': 'HowToSupply', name: 'HiHired account (optional)' },
      { '@type': 'HowToSupply', name: 'Target job description' },
    ],
    tool: [{ '@type': 'HowToTool', name: 'HiHired AI Resume Builder' }],
    step: guide.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.detail,
      url: `${canonical}#step-${index + 1}`,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'HiHired',
      url: 'https://hihired.org',
    },
    dateModified: guide.lastUpdated,
  };

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    author: {
      '@type': 'Organization',
      name: 'HiHired',
      url: 'https://hihired.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HiHired',
      url: 'https://hihired.org',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hihired.org/favicon.svg',
      },
    },
    url: canonical,
    datePublished: guide.lastUpdated,
    dateModified: guide.lastUpdated,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    keywords: (guide.tags || []).join(', '),
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  let html = templateHtml;
  html = replaceMeta(html, title, description, canonical, 'article');
  html = injectStructuredData(html, [articleStructuredData, howToStructuredData, faqStructuredData]);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

for (const guide of geoGuides) {
  const dir = path.join(publicDir, 'guides', guide.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), generateGuideHtml(guide), 'utf-8');
  console.log(`✅ /guides/${guide.slug}/index.html`);
}

const guidesIndexDir = path.join(publicDir, 'guides');
fs.mkdirSync(guidesIndexDir, { recursive: true });
fs.writeFileSync(path.join(guidesIndexDir, 'index.html'), generateGuidesIndexHtml(), 'utf-8');
console.log('✅ /guides/index.html');
console.log(`\nDone! ${geoGuides.length + 1} pages pre-rendered.`);
