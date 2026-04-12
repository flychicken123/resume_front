/**
 * Pre-render guide pages as static HTML for SEO/GEO.
 * Run: node scripts/prerender-guides.js
 * Output: public/guides/<slug>/index.html
 */
const fs = require('fs');
const path = require('path');

// We need to extract geoGuides data. Since it uses ES module export,
// we'll parse it manually or use a simple require trick.
const guidesPath = path.join(__dirname, '..', 'src', 'constants', 'geoGuides.js');
let guidesSource = fs.readFileSync(guidesPath, 'utf-8');

// Convert ES module to CommonJS for Node
guidesSource = guidesSource.replace('export default geoGuides;', 'module.exports = geoGuides;');
const tmpPath = path.join(__dirname, '__geoGuides_tmp.js');
fs.writeFileSync(tmpPath, guidesSource);
const geoGuides = require(tmpPath);
fs.unlinkSync(tmpPath);

const publicDir = path.join(__dirname, '..', 'public');
const templateHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Also generate the guides index page
function generateGuidesIndexHtml() {
  const title = 'Resume & Job Application Guides | HiHired';
  const description = 'Free guides on building resumes with AI, tailoring to job descriptions, auto-filling applications, and passing ATS systems. Practical tips from HiHired.';
  const canonical = 'https://hihired.org/guides';

  let cardsHtml = geoGuides.map(g => `
    <article style="border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px;">
      <p style="color:#6b7280;font-size:14px;margin-bottom:4px;">${escapeHtml(g.intent)}</p>
      <h2 style="margin:0 0 8px;"><a href="/guides/${g.slug}" style="color:#1a1a2e;text-decoration:none;">${escapeHtml(g.title)}</a></h2>
      <p style="color:#444;font-size:15px;line-height:1.6;">${escapeHtml(g.summary)}</p>
      <p style="margin-top:8px;"><strong>${escapeHtml(g.answer)}</strong></p>
      <div style="margin-top:12px;">
        ${g.tags.map(t => `<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:2px 10px;border-radius:4px;font-size:12px;margin-right:6px;">${escapeHtml(t)}</span>`).join('')}
      </div>
      <a href="/guides/${g.slug}" style="display:inline-block;margin-top:12px;color:#2563eb;font-weight:600;">Read guide →</a>
    </article>
  `).join('\n');

  const bodyHtml = `
    <div id="seo-prerender" style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <h1 style="font-size:32px;color:#1a1a2e;">Resume & Job Application Guides</h1>
      <p style="color:#666;font-size:16px;margin-bottom:32px;">Free, practical guides to help you build better resumes, tailor them to jobs, and auto-fill applications faster.</p>
      ${cardsHtml}
      <div style="text-align:center;margin-top:40px;padding:24px;background:#f0f9ff;border-radius:12px;">
        <h2>Ready to build your resume?</h2>
        <p>Import your resume and get a tailored version in 5 minutes.</p>
        <a href="/builder" style="display:inline-block;padding:12px 32px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Create my resume — free</a>
      </div>
    </div>
  `;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": canonical,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": geoGuides.map((g, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://hihired.org/guides/${g.slug}`,
        "name": g.title
      }))
    }
  };

  let html = templateHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  // Replace all meta description variants (name, og, twitter)
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta name="title" content="[^"]*"/, `<meta name="title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`);
  html = html.replace(/<meta property="twitter:title" content="[^"]*"/, `<meta property="twitter:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="twitter:description" content="[^"]*"/, `<meta property="twitter:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="twitter:url" content="[^"]*"/, `<meta property="twitter:url" content="${canonical}"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  return html;
}

function generateGuideHtml(guide) {
  const title = `${guide.title} | HiHired`;
  const canonical = `https://hihired.org/guides/${guide.slug}`;
  const description = guide.summary;

  // Build rich body content
  const stepsHtml = guide.steps.map((s, i) => `
    <li style="margin-bottom:16px;">
      <strong>${i + 1}. ${escapeHtml(s.title)}</strong>
      <p style="color:#555;margin:4px 0 0;">${escapeHtml(s.detail)}</p>
    </li>
  `).join('');

  const statsHtml = guide.keyStats.map(s => `
    <div style="text-align:center;padding:16px;">
      <div style="font-size:28px;font-weight:700;color:#2563eb;">${escapeHtml(s.value)}</div>
      <div style="font-size:13px;color:#888;">${escapeHtml(s.label)}</div>
    </div>
  `).join('');

  const tagsHtml = guide.tags.map(t =>
    `<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:2px 10px;border-radius:4px;font-size:12px;margin-right:6px;">${escapeHtml(t)}</span>`
  ).join('');

  const sourcesHtml = guide.sources.map(s =>
    `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.label)}</a></li>`
  ).join('');

  const bodyHtml = `
    <article id="seo-prerender" style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <nav style="font-size:14px;color:#888;margin-bottom:16px;">
        <a href="/" style="color:#2563eb;">Home</a> &gt;
        <a href="/guides" style="color:#2563eb;">Guides</a> &gt;
        <span>${escapeHtml(guide.title)}</span>
      </nav>

      <p style="color:#6b7280;font-size:14px;">${escapeHtml(guide.intent)}</p>
      <h1 style="font-size:32px;color:#1a1a2e;margin:8px 0 16px;">${escapeHtml(guide.title)}</h1>
      <p style="font-size:16px;color:#444;line-height:1.7;">${escapeHtml(guide.summary)}</p>
      <p style="font-size:16px;color:#333;line-height:1.7;font-weight:600;margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #2563eb;">${escapeHtml(guide.answer)}</p>

      <div style="margin:16px 0;">${tagsHtml}</div>
      <time style="color:#888;font-size:13px;" datetime="${guide.lastUpdated}">Updated ${guide.lastUpdated}</time>

      <h2 style="margin-top:32px;">Step-by-step guide</h2>
      <ol style="padding-left:0;list-style:none;">${stepsHtml}</ol>

      <h2>Key stats</h2>
      <div style="display:flex;justify-content:space-around;background:#fafbfc;border-radius:12px;padding:16px;margin:16px 0;">
        ${statsHtml}
      </div>

      <h2>Sources</h2>
      <ul>${sourcesHtml}</ul>

      <div style="text-align:center;margin-top:40px;padding:24px;background:#f0f9ff;border-radius:12px;">
        <h2>Ready to try it?</h2>
        <a href="${escapeHtml(guide.cta.href)}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;font-weight:600;">${escapeHtml(guide.cta.label)}</a>
      </div>
    </article>
  `;

  // HowTo JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": guide.summary,
    "image": "https://hihired.org/og-image.jpg",
    "totalTime": "PT5M",
    "step": guide.steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": s.title,
      "text": s.detail,
      "url": `${canonical}#step-${i + 1}`
    }))
  };

  // Article JSON-LD for Google Discover and search
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.summary,
    "image": "https://hihired.org/og-image.jpg",
    "author": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hihired.org/favicon.svg"
      }
    },
    "url": canonical,
    "datePublished": guide.lastUpdated,
    "dateModified": guide.lastUpdated,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonical
    },
    "keywords": guide.tags.join(", ")
  };

  // FAQ JSON-LD from intent
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": guide.intent,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": guide.answer
      }
    }]
  };

  let html = templateHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  // Replace all meta description variants (name, og, twitter)
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta name="title" content="[^"]*"/, `<meta name="title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`);
  html = html.replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="article"`);
  html = html.replace(/<meta property="twitter:title" content="[^"]*"/, `<meta property="twitter:title" content="${escapeHtml(title)}"`);
  html = html.replace(/<meta property="twitter:description" content="[^"]*"/, `<meta property="twitter:description" content="${escapeHtml(description)}"`);
  html = html.replace(/<meta property="twitter:url" content="[^"]*"/, `<meta property="twitter:url" content="${canonical}"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);
  html = html.replace('</head>', `
    <script type="application/ld+json">${JSON.stringify(articleLd)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  return html;
}

// Generate all guide pages
for (const guide of geoGuides) {
  const dir = path.join(publicDir, 'guides', guide.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = generateGuideHtml(guide);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`✅ /guides/${guide.slug}/index.html`);
}

// Generate guides index
const guidesIndexDir = path.join(publicDir, 'guides');
fs.mkdirSync(guidesIndexDir, { recursive: true });
fs.writeFileSync(path.join(guidesIndexDir, 'index.html'), generateGuidesIndexHtml(), 'utf-8');
console.log('✅ /guides/index.html');

console.log(`\nDone! ${geoGuides.length + 1} pages pre-rendered.`);
