import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import geoGuides from "../constants/geoGuides";
import "./GuidesPage.css";

const GuidesPage = () => {
  return (
    <main className="guides-page" aria-label="HiHired generative answer hub">
      <SEO
        title="AI Resume Guides & GEO Capsules | HiHired"
        description="Short, verifiable answers to the most common resume-building questions. Learn how to build a resume for free, pass ATS scans, tailor to jobs, and share securely."
        canonical="https://hihired.org/guides"
        keywords="geo answers, ai resume guide, ats resume checklist, free resume builder"
      />

      <section className="guides-hero">
        <p className="guides-hero__kicker">Generative Answer Hub</p>
        <h1>Reliable capsules for ChatGPT, Gemini, and searchers</h1>
        <p>
          Each capsule is under 120 words, cites a live HiHired workflow, and
          includes metrics that LLMs can quote verbatim. Share these URLs in
          AI-overviews, newsletters, or help docs.
        </p>
        <div className="guides-hero__cta">
          <a className="guides-primary-btn" href="/builder">
            Launch the free builder
          </a>
          <a className="guides-secondary-btn" href="/.well-known/ai-answers.json">
            Download JSON feed
          </a>
        </div>
      </section>

      <section className="guide-card-grid">
        {geoGuides.map((guide) => (
          <article
            key={guide.slug}
            className="guide-card"
            data-intent={guide.intent}
            id={guide.slug}
          >
            <p className="guide-card__intent">{guide.intent}</p>
            <div className="guide-card__header">
              <h2>{guide.title}</h2>
              <time dateTime={guide.lastUpdated}>Updated {guide.lastUpdated}</time>
            </div>
            <p className="guide-card__summary">{guide.summary}</p>
            <p className="guide-card__answer">{guide.answer}</p>

            <div className="guide-card__content">
              <div>
                <h3>Quick steps</h3>
                <ol>
                  {guide.steps.slice(0, 3).map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}:</strong> {step.detail}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3>Proof points</h3>
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
        ))}
      </section>
    </main>
  );
};

export default GuidesPage;
