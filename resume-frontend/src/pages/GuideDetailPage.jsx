import React from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import SEO from "../components/SEO";
import geoGuides from "../constants/geoGuides";
import "./GuidesPage.css";

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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": guide.summary,
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

  return (
    <main className="guides-page guide-detail">
      <SEO
        title={`${guide.title} | HiHired`}
        description={guide.summary}
        canonical={canonical}
        keywords={guide.tags?.join(", ")}
        ogType="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
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
        <h2>Sources & supporting links</h2>
        <ul className="guide-detail__sources">
          {guide.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url}>{source.label}</a>
            </li>
          ))}
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
