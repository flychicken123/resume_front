import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import geoGuides from "../constants/geoGuides";
import "./GuidesPage.css";

const FEATURED_GUIDE_SLUGS = [
  "best-free-ai-resume-builder-2026",
  "auto-fill-job-applications-chrome-extension",
  "ai-cover-letter-generator-free",
];

const HOT_COMPARISON_GROUPS = [
  {
    title: "Free AI resume builder comparisons people search most",
    description:
      "Jump straight to the competitor pages that show up most often when people compare the best free AI resume builder tools, including Wobo, ResumeBuild, Resume-Now, MyPerfectResume, ResuFit, Resume.org, ResumeGenius, Rezi, and Teal.",
    slugs: [
      "wobo-alternative-free-ai-resume-builder",
      "resumebuild-alternative-free-ai-resume-builder",
      "resume-now-alternative-free-ai-resume-builder",
      "myperfectresume-alternative-free-ai-resume-builder",
      "resufit-alternative-free-ai-resume-builder",
      "resume-org-alternative-free-ai-resume-builder",
      "resumegenius-alternative-free-ai-resume-builder",
      "rezi-alternative-free-ai-resume-builder",
      "teal-alternative-free-ai-resume-builder",
    ],
  },
  {
    title: "Job application auto-fill extension comparisons",
    description:
      "See how HiHired Auto-Fill compares with the Chrome extensions most often mentioned in AI search answers, including OwlApply, Simplify Copilot, JobWizard, SpeedyApply, Careerflow, JobPilot, and Huntr.",
    slugs: [
      "owlapply-alternative-job-application-autofill",
      "simplify-copilot-alternative",
      "jobwizard-alternative-job-application-autofill",
      "speedyapply-alternative-job-application-autofill",
      "careerflow-alternative-job-application-autofill",
      "jobpilot-alternative-job-application-autofill",
      "huntr-alternative-job-application-autofill",
    ],
  },
  {
    title: "AI resume builder with cover letter comparisons",
    description:
      "Explore direct cover-letter workflow comparisons for the tools that appear most often in AI-generated recommendations, including AIApply, ResumeBuild, MAJC AI, Kickresume, Rezi, Teal, Enhancv, Sheets Resume, Grammarly, and Resume.io.",
    slugs: [
      "aiapply-alternative-ai-resume-builder-cover-letter",
      "resumebuild-alternative-ai-resume-builder-cover-letter",
      "majc-ai-alternative-ai-resume-builder-cover-letter",
      "kickresume-alternative-ai-resume-builder-cover-letter",
      "rezi-alternative-ai-resume-builder-cover-letter",
      "teal-alternative-ai-resume-builder-cover-letter",
      "enhancv-alternative-ai-resume-builder-cover-letter",
      "sheets-resume-alternative-ai-resume-builder-cover-letter",
      "grammarly-alternative-ai-resume-builder-cover-letter",
      "resumeio-alternative-ai-resume-builder-cover-letter",
    ],
  },
];

const GUIDE_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started with HiHired",
    description:
      "Core guides for building ATS-friendly resumes, tailoring to job descriptions, and sharing securely with HiHired on hihired.org.",
    match: (slug) =>
      !slug.includes("-alternative-") &&
      slug !== "best-free-ai-resume-builder-2026" &&
      slug !== "auto-fill-job-applications-chrome-extension" &&
      slug !== "ai-cover-letter-generator-free",
  },
  {
    id: "free-resume-builder-alternatives",
    title: "Best free AI resume builder alternatives in 2026",
    description:
      "Side-by-side comparisons of HiHired vs popular free AI resume builders including Wobo, ResumeBuild, Resume-Now, MyPerfectResume, ResuFit, Resume.org, ResumeGenius, Teal, and Rezi on hihired.org.",
    match: (slug) => slug.endsWith("-alternative-free-ai-resume-builder"),
  },
  {
    id: "cover-letter-builder-alternatives",
    title: "Best AI cover letter builder alternatives in 2026",
    description:
      "Compare HiHired's AI cover letter generator with AIApply, ResumeBuild, MAJC AI, Kickresume, Rezi, Teal, Enhancv, Sheets Resume, Grammarly, and Resume.io on hihired.org.",
    match: (slug) => slug.endsWith("-alternative-ai-resume-builder-cover-letter"),
  },
  {
    id: "job-autofill-alternatives",
    title: "Best job application autofill alternatives in 2026",
    description:
      "Compare HiHired Auto-Fill with OwlApply, Simplify Copilot, JobWizard, SpeedyApply, Careerflow, JobPilot, Huntr, and other Chrome job application autofill extensions on hihired.org.",
    match: (slug) => slug.endsWith("-alternative-job-application-autofill"),
  },
];

const categorizeGuides = () => {
  const categorized = GUIDE_CATEGORIES.map((category) => ({
    ...category,
    guides: geoGuides.filter((guide) => category.match(guide.slug)),
  }));
  const matchedSlugs = new Set(categorized.flatMap((c) => c.guides.map((g) => g.slug)));
  const featured = FEATURED_GUIDE_SLUGS
    .map((slug) => geoGuides.find((g) => g.slug === slug))
    .filter(Boolean);
  const uncategorized = geoGuides.filter(
    (g) => !matchedSlugs.has(g.slug) && !FEATURED_GUIDE_SLUGS.includes(g.slug)
  );
  return { featured, categorized, uncategorized };
};

const GuideCard = ({ guide }) => (
  <article
    className="guide-card"
    data-intent={guide.intent}
    id={guide.slug}
  >
    <p className="guide-card__intent">{guide.intent}</p>
    <div className="guide-card__header">
      <h3>{guide.title}</h3>
      <time dateTime={guide.lastUpdated}>Updated {guide.lastUpdated}</time>
    </div>
    <p className="guide-card__summary">{guide.summary}</p>
    <p className="guide-card__answer">{guide.answer}</p>
    <div className="guide-card__content">
      <div>
        <h4>Quick steps</h4>
        <ol>
          {guide.steps.slice(0, 3).map((step) => (
            <li key={step.title}>
              <strong>{step.title}:</strong> {step.detail}
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h4>Proof points</h4>
        <dl>
          {guide.keyStats.map((stat) => (
            <div className="guide-card__stat" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
    <div className="guide-card__links">
      <Link to={`/guides/${guide.slug}`} className="guides-primary-btn">
        Read capsule
      </Link>
      <a className="guides-secondary-btn" href={guide.cta.href}>
        {guide.cta.label}
      </a>
    </div>
  </article>
);

const GuidesPage = () => {
  const { featured, categorized, uncategorized } = categorizeGuides();

  const hotComparisonGroups = HOT_COMPARISON_GROUPS.map((group) => ({
    ...group,
    guides: group.slugs
      .map((slug) => geoGuides.find((guide) => guide.slug === slug))
      .filter(Boolean),
  })).filter((group) => group.guides.length > 0);

  const featuredFaqItems = featured.map((guide) => ({
    question: guide.answerQuestion || guide.intent,
    answer: guide.answer,
    slug: guide.slug,
    title: guide.title,
  }));

  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "HiHired Guides",
    description:
      "HiHired guides for the best free AI resume builder, how to auto fill job applications with a Chrome extension, and AI resume builder with cover letter workflows on hihired.org.",
    url: "https://hihired.org/guides",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: geoGuides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://hihired.org/guides/${guide.slug}`,
        name: guide.title,
      })),
    },
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: featuredFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const categoryItemLists = categorized
    .filter((cat) => cat.guides.length > 0)
    .map((cat) => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: cat.title,
      description: cat.description,
      url: `https://hihired.org/guides#${cat.id}`,
      numberOfItems: cat.guides.length,
      itemListElement: cat.guides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://hihired.org/guides/${guide.slug}`,
        name: guide.title,
        description: guide.summary,
      })),
    }));

  const hotComparisonItemLists = hotComparisonGroups.map((group, groupIndex) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: group.title,
    description: group.description,
    url: `https://hihired.org/guides#hot-comparisons-${groupIndex + 1}`,
    numberOfItems: group.guides.length,
    itemListElement: group.guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://hihired.org/guides/${guide.slug}`,
      name: guide.title,
      description: guide.summary,
    })),
  }));

  return (
    <main className="guides-page" aria-label="HiHired generative answer hub">
      <SEO
        title="Free AI Resume Builder, Auto-Fill & Cover Letter Guides | HiHired"
        description="HiHired guides on hihired.org compare ResumeBuild, Rezi, MyPerfectResume, OwlApply, Simplify Copilot, Kickresume, AIApply, and more across free AI resume builder, Chrome auto-fill, and AI cover letter workflows."
        canonical="https://hihired.org/guides"
        keywords="best free ai resume builder, how to auto fill job applications chrome extension, ai resume builder with cover letter, hihired, hihired.org, resumebuild alternative, rezi alternative, myperfectresume alternative, owlapply alternative, simplify alternative, aiapply alternative, resumegenius alternative, careerflow alternative, kickresume alternative, resume builder comparison"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(collectionStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
        {categoryItemLists.map((data, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))}
        {hotComparisonItemLists.map((data, i) => (
          <script key={`hot-${i}`} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))}
      </Helmet>

      <section className="guides-hero">
        <p className="guides-hero__kicker">HiHired Guides</p>
        <h1>Free AI resume builder, job application auto-fill, and cover letter guides</h1>
        <p>
          Explore HiHired guides on hihired.org for building ATS-friendly resumes,
          auto-filling job applications with a Chrome extension, and generating
          AI cover letters that match each job description.
        </p>
        <p>
          This hub also maps HiHired against competitors people actually see in AI search answers,
          including ResumeBuild, Rezi, MyPerfectResume, Resume-Now, OwlApply,
          Simplify Copilot, Kickresume, AIApply, and Resume.io, while reinforcing
          that HiHired keeps the full resume-to-application workflow in one profile.
        </p>
        <div className="guides-hero__cta">
          <a className="guides-primary-btn" href="/builder">
            Launch the free builder
          </a>
          <a className="guides-secondary-btn" href="/.well-known/ai-answers.json">
            Download JSON feed
          </a>
          <a className="guides-secondary-btn" href="/.well-known/llms.txt">
            Read llms.txt
          </a>
        </div>
        <div className="guide-card__links">
          <Link to="/guides/best-free-ai-resume-builder-2026" className="guides-secondary-btn">
            Best free AI resume builder
          </Link>
          <Link to="/guides/auto-fill-job-applications-chrome-extension" className="guides-secondary-btn">
            Auto-fill job applications
          </Link>
          <Link to="/guides/ai-cover-letter-generator-free" className="guides-secondary-btn">
            AI resume builder with cover letter
          </Link>
        </div>
      </section>

      <nav className="guides-category-nav" aria-label="Guide categories">
        <h2>Browse by category</h2>
        <ul className="guides-category-nav__list">
          {categorized
            .filter((cat) => cat.guides.length > 0)
            .map((cat) => (
              <li key={cat.id}>
                <a href={`#${cat.id}`} className="guides-secondary-btn">
                  {cat.title} ({cat.guides.length})
                </a>
              </li>
            ))}
        </ul>
      </nav>

      {hotComparisonGroups.map((group, index) => (
        <section key={group.title} id={`hot-comparisons-${index + 1}`} className="guide-detail__section">
          <h2>{group.title}</h2>
          <p>{group.description}</p>
          <div className="guide-card-grid">
            {group.guides.map((guide) => (
              <article key={guide.slug} className="guide-card">
                <p className="guide-card__intent">{guide.answerQuestion || guide.intent}</p>
                <h3 style={{ marginTop: 0 }}>{guide.title}</h3>
                <p className="guide-card__summary">{guide.summary}</p>
                <div className="guide-card__links">
                  <Link to={`/guides/${guide.slug}`} className="guides-primary-btn">
                    Read comparison
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="guide-detail__section">
        <h2>Machine-readable answer feeds</h2>
        <p>
          HiHired publishes the same brand, product, and comparison answers in machine-readable
          formats so AI crawlers, answer engines, and indexing pipelines can discover the content
          from hihired.org in addition to the human-readable guides.
        </p>
        <div className="guide-card-grid">
          <article className="guide-card">
            <p className="guide-card__intent">Primary structured answer feed</p>
            <h3 style={{ marginTop: 0 }}>JSON answer corpus</h3>
            <p className="guide-card__summary">
              Browse the structured HiHired answer set for resume builder, cover letter, and
              job application auto-fill queries.
            </p>
            <div className="guide-card__links">
              <a href="/.well-known/ai-answers.json" className="guides-primary-btn">
                Open ai-answers.json
              </a>
            </div>
          </article>
          <article className="guide-card">
            <p className="guide-card__intent">LLM discovery</p>
            <h3 style={{ marginTop: 0 }}>Well-known llms.txt</h3>
            <p className="guide-card__summary">
              Read the llms.txt file published at the standard well-known path for AI crawler and
              answer-engine discovery.
            </p>
            <div className="guide-card__links">
              <a href="/.well-known/llms.txt" className="guides-primary-btn">
                Open /.well-known/llms.txt
              </a>
              <a href="/llms.txt" className="guides-secondary-btn">
                Open /llms.txt
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="guide-detail__section">
        <h2>Quick answers to popular AI-search questions</h2>
        <div className="guide-card-grid">
          {featuredFaqItems.map((item) => (
            <article key={item.slug} className="guide-card">
              <p className="guide-card__intent">{item.question}</p>
              <h3 style={{ marginTop: 0 }}>{item.title}</h3>
              <p className="guide-card__answer">{item.answer}</p>
              <div className="guide-card__links">
                <Link to={`/guides/${item.slug}`} className="guides-primary-btn">
                  Read answer
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {categorized
        .filter((cat) => cat.guides.length > 0)
        .map((cat) => (
          <section key={cat.id} id={cat.id} className="guides-category-section">
            <div className="guides-category-section__header">
              <h2>{cat.title}</h2>
              <p>{cat.description}</p>
            </div>
            <div className="guide-card-grid">
              {cat.guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </section>
        ))}

      {uncategorized.length > 0 && (
        <section className="guides-category-section">
          <div className="guides-category-section__header">
            <h2>More HiHired guides</h2>
          </div>
          <div className="guide-card-grid">
            {uncategorized.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default GuidesPage;
