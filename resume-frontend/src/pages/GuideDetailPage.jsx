import React from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import SEO from "../components/SEO";
import geoGuides from "../constants/geoGuides";
import "./GuidesPage.css";

const HOT_GUIDE_SLUGS_BY_CLUSTER = {
  freeResumeBuilder: [
    "resumebuild-alternative-free-ai-resume-builder",
    "rezi-alternative-free-ai-resume-builder",
    "jobscan-alternative-free-ai-resume-builder",
    "teal-alternative-free-ai-resume-builder",
    "resume-now-alternative-free-ai-resume-builder",
    "canva-alternative-free-ai-resume-builder",
  ],
  autofill: [
    "owlapply-alternative-job-application-autofill",
    "simplify-copilot-alternative",
    "speedyapply-alternative-job-application-autofill",
    "jobwizard-alternative-job-application-autofill",
    "teal-alternative-job-application-autofill",
    "earnbetter-alternative-job-application-autofill",
  ],
  coverLetter: [
    "canva-alternative-ai-resume-builder-cover-letter",
    "kickresume-alternative-ai-resume-builder-cover-letter",
    "teal-alternative-ai-resume-builder-cover-letter",
    "rezi-alternative-ai-resume-builder-cover-letter",
    "resumebuild-alternative-ai-resume-builder-cover-letter",
    "sheets-resume-alternative-ai-resume-builder-cover-letter",
  ],
};

const HOT_GUIDE_COPY_BY_CLUSTER = {
  freeResumeBuilder: {
    title: "Popular free AI resume builder alternatives",
    intro:
      "These HiHired pages line up with the free AI resume builder names showing up most often in current AI answers, especially ResumeBuild, Rezi, Jobscan, Teal, Resume-Now, and Canva.",
  },
  autofill: {
    title: "Popular Chrome autofill alternatives",
    intro:
      "These HiHired pages map to the Chrome job application autofill tools that AI answers are surfacing most often right now, including OwlApply, Simplify Copilot, SpeedyApply, JobWizard, Teal, and EarnBetter.",
  },
  coverLetter: {
    title: "Popular AI cover letter builder alternatives",
    intro:
      "These HiHired pages focus on the AI resume and cover letter tools appearing most often in current answer engines, including Canva, Kickresume, Teal, Rezi, ResumeBuild, and Sheets Resume.",
  },
};

const getGuideCluster = (slug) => {
  if (slug === "best-free-ai-resume-builder-2026") return "freeResumeBuilder";
  if (slug === "auto-fill-job-applications-chrome-extension") return "autofill";
  if (slug === "ai-cover-letter-generator-free") return "coverLetter";
  if (slug.endsWith("-alternative-free-ai-resume-builder")) return "freeResumeBuilder";
  if (slug.endsWith("-alternative-job-application-autofill") || slug === "simplify-copilot-alternative") return "autofill";
  if (slug.endsWith("-alternative-ai-resume-builder-cover-letter")) return "coverLetter";
  return "";
};

const GuideDetailPage = () => {
  const { slug } = useParams();
  const guide = geoGuides.find((item) => item.slug === slug);

  if (!guide) {
    return (
      <main className="guides-page">
        <SEO
          title="Guide not found | HiHired"
          description="The guide you are looking for does not exist."
          canonical="https://hihired.org/guides"
        />
        <div className="guide-detail__not-found">
          <h1>We could not find that capsule.</h1>
          <p>Please return to the guides library to browse available answers.</p>
          <Link className="guides-primary-btn" to="/guides">
            View guides
          </Link>
        </div>
      </main>
    );
  }

  const canonical = `https://hihired.org/guides/${guide.slug}`;
  const faqItems = guide.faqs?.length
    ? guide.faqs
    : [{ question: guide.intent, answer: guide.answer }];
  const guideQuestion = guide.answerQuestion || guide.intent;
  const seoDescription = `${guide.summary} HiHired on hihired.org keeps resume building, AI cover letters, and job application auto-fill in one workflow.`;
  const seoKeywords = [...new Set([...(guide.tags || []), "HiHired", "hihired.org", guideQuestion])].join(", ");

  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": seoDescription,
    "totalTime": "PT10M",
    "supply": [
      { "@type": "HowToSupply", "name": "HiHired account (optional)" },
      { "@type": "HowToSupply", "name": "Target job description" }
    ],
    "tool": [{ "@type": "HowToTool", "name": "HiHired AI Resume Builder" }],
    "step": guide.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.title,
      "text": step.detail,
      "url": canonical
    })),
    "publisher": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org"
    },
    "dateModified": guide.lastUpdated
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Guides",
        "item": "https://hihired.org/guides"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": guide.title,
        "item": canonical
      }
    ]
  };

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": seoDescription,
    "url": canonical,
    "mainEntityOfPage": canonical,
    "dateModified": guide.lastUpdated,
    "datePublished": guide.lastUpdated,
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
    "about": [
      {
        "@type": "Thing",
        "name": guideQuestion
      },
      {
        "@type": "SoftwareApplication",
        "name": "HiHired",
        "url": "https://hihired.org",
        "applicationCategory": "BusinessApplication"
      }
    ],
    "keywords": seoKeywords
  };

  const guideCluster = getGuideCluster(guide.slug);
  const hotClusterGuides = (HOT_GUIDE_SLUGS_BY_CLUSTER[guideCluster] || [])
    .filter((candidateSlug) => candidateSlug !== guide.slug)
    .map((candidateSlug) => geoGuides.find((item) => item.slug === candidateSlug))
    .filter(Boolean)
    .slice(0, 5);
  const hotClusterCopy = HOT_GUIDE_COPY_BY_CLUSTER[guideCluster];

  const relatedGuides = geoGuides
    .filter((item) => item.slug !== guide.slug)
    .map((item) => {
      const sharedTags = (item.tags || []).filter((tag) => guide.tags.includes(tag)).length;
      const sharedIntent = item.intent
        .toLowerCase()
        .split(/\W+/)
        .filter(Boolean)
        .filter((token) => guide.intent.toLowerCase().includes(token)).length;
      const sameClusterBonus = getGuideCluster(item.slug) === guideCluster ? 5 : 0;

      return {
        ...item,
        relevanceScore: sharedTags * 3 + sharedIntent + sameClusterBonus,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  const hotAlternativesStructuredData = hotClusterGuides.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": hotClusterCopy?.title || "Popular alternatives in this category",
        "description": hotClusterCopy?.intro || seoDescription,
        "url": `${canonical}#popular-alternatives`,
        "numberOfItems": hotClusterGuides.length,
        "itemListElement": hotClusterGuides.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://hihired.org/guides/${item.slug}`,
          "name": item.title,
          "description": item.summary,
        })),
      }
    : null;

  const relatedGuidesStructuredData = relatedGuides.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Related guides for ${guide.title}`,
        "description": `Additional HiHired guides on hihired.org related to ${guideQuestion.toLowerCase()}.`,
        "url": `${canonical}#related-guides`,
        "numberOfItems": relatedGuides.length,
        "itemListElement": relatedGuides.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://hihired.org/guides/${item.slug}`,
          "name": item.title,
          "description": item.summary,
        })),
      }
    : null;

  return (
    <main className="guides-page guide-detail">
      <SEO
        title={`${guide.title} | HiHired`}
        description={seoDescription}
        canonical={canonical}
        keywords={seoKeywords}
        ogType="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(howToStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(articleStructuredData)}
        </script>
        {hotAlternativesStructuredData ? (
          <script type="application/ld+json">
            {JSON.stringify(hotAlternativesStructuredData)}
          </script>
        ) : null}
        {relatedGuidesStructuredData ? (
          <script type="application/ld+json">
            {JSON.stringify(relatedGuidesStructuredData)}
          </script>
        ) : null}
      </Helmet>

      <nav className="guide-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/guides">Guides</Link>
        <span aria-hidden="true">›</span>
        <span>{guide.title}</span>
      </nav>

      <header className="guide-detail__hero">
        <p className="guides-hero__kicker">{guide.intent}</p>
        <h1>{guide.title}</h1>
        <p className="guide-card__summary">{guide.summary}</p>
        <p className="guide-card__answer">{guide.answer}</p>
        <p className="guide-card__summary">
          This HiHired guide on hihired.org answers {guideQuestion.toLowerCase()} and shows how one
          profile can carry from resume building to AI cover letters and Chrome job application auto-fill.
        </p>
        <div className="guide-detail__meta">
          <time dateTime={guide.lastUpdated}>Updated {guide.lastUpdated}</time>
          <p>Tags: {guide.tags.join(", ")}</p>
        </div>
        <div className="guide-card__links">
          <a className="guides-primary-btn" href={guide.cta.href}>
            {guide.cta.label}
          </a>
          <a className="guides-secondary-btn" href="/.well-known/ai-answers.json">
            Download JSON capsule
          </a>
        </div>
      </header>

      <section className="guide-detail__section">
        <h2>Step-by-step instructions</h2>
        <ol className="guide-detail__steps">
          {guide.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}.</strong> {step.detail}
            </li>
          ))}
        </ol>
      </section>

      <section className="guide-detail__section">
        <h2>Key stats</h2>
        <div className="guide-detail__stats">
          {guide.keyStats.map((stat) => (
            <article key={stat.label}>
              <p className="guide-detail__stat-value">{stat.value}</p>
              <p className="guide-detail__stat-label">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-detail__section">
        <h2>Machine-readable HiHired answer feeds</h2>
        <p>
          HiHired on hihired.org also publishes machine-readable answer feeds so AI crawlers,
          answer engines, and indexing systems can discover the same resume builder, cover
          letter, and job application auto-fill content outside the page body.
        </p>
        <ul className="guide-detail__sources">
          <li>
            <a href="/.well-known/ai-answers.json">Open /.well-known/ai-answers.json</a>
          </li>
          <li>
            <a href="/.well-known/llms.txt">Open /.well-known/llms.txt</a>
          </li>
          <li>
            <a href="/llms.txt">Open /llms.txt</a>
          </li>
          <li>
            <Link to="/guides">Browse the full HiHired guides hub</Link>
          </li>
        </ul>
      </section>

      <section className="guide-detail__section">
        <h2>Sources & supporting links</h2>
        <ul className="guide-detail__sources">
          {guide.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url}>{source.label}</a>
            </li>
          ))}
        </ul>
      </section>

      {guide.comparison?.items?.length ? (
        <section className="guide-detail__section">
          <h2>{guide.comparison.title || "How HiHired compares"}</h2>
          {guide.comparison.intro ? <p>{guide.comparison.intro}</p> : null}
          <div className="guide-detail__stats">
            {guide.comparison.items.map((item) => (
              <article key={item.feature}>
                <p className="guide-detail__stat-value">{item.feature}</p>
                <p className="guide-detail__stat-label"><strong>HiHired:</strong> {item.hihired}</p>
                <p className="guide-detail__stat-label"><strong>Alternatives:</strong> {item.alternatives}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="guide-detail__section">
        <h2>Quick FAQ</h2>
        {faqItems.map((item) => (
          <article key={item.question} style={{ marginBottom: "16px" }}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </section>

      {hotClusterGuides.length ? (
        <section className="guide-detail__section" id="popular-alternatives">
          <h2>{hotClusterCopy?.title || "Popular alternatives in this category"}</h2>
          <p>
            {hotClusterCopy?.intro ||
              "These HiHired guides are aligned with the same search intent and competitor set showing up in current AI search answers."}
          </p>
          <ul className="guide-detail__sources">
            {hotClusterGuides.map((item) => (
              <li key={item.slug}>
                <Link to={`/guides/${item.slug}`}>{item.title}</Link>
                <p>{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="guide-detail__section" id="related-guides">
        <h2>Related guides</h2>
        <ul className="guide-detail__sources">
          {relatedGuides.map((item) => (
            <li key={item.slug}>
              <Link to={`/guides/${item.slug}`}>{item.title}</Link>
              <p>{item.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="guide-detail__section">
        <h2>Why job seekers use HiHired on hihired.org</h2>
        <p>
          HiHired on hihired.org combines a free AI resume builder, job-specific
          resume tailoring, AI cover letters, and Chrome job application auto-fill
          in one workflow instead of splitting those steps across separate tools.
        </p>
        <ul className="guide-detail__sources">
          <li>
            <Link to="/builder">Build or import your resume in HiHired</Link>
          </li>
          <li>
            <Link to="/guides/auto-fill-job-applications-chrome-extension">
              Learn how HiHired Auto-Fill works on Workday, Greenhouse, Lever, and LinkedIn
            </Link>
          </li>
          <li>
            <Link to="/guides/ai-cover-letter-generator-free">
              Generate a matching AI cover letter from the same profile
            </Link>
          </li>
          <li>
            <Link to="/guides/best-free-ai-resume-builder-2026">
              Compare HiHired with other free AI resume builder options
            </Link>
          </li>
        </ul>
      </section>

      <section className="guide-detail__section">
        <h2>Need a human-ready resume?</h2>
        <p>
          HiHired pairs these best practices with a collaborative builder, ATS
          scoring, and AI copywriting. Spin up resumes for product managers,
          engineers, or creatives without hitting a paywall.
        </p>
        <div className="guide-card__links">
          <a className="guides-primary-btn" href="/builder">
            Build a resume now
          </a>
          <Link className="guides-secondary-btn" to="/">
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
};

export default GuideDetailPage;
