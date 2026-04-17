import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import geoGuides from "../constants/geoGuides";
import "./GuidesPage.css";

const GuidesPage = () => {
  return (
    <main className="guides-page" aria-label="HiHired generative answer hub">
      <SEO
        title="Free AI Resume Builder, Auto-Fill & Cover Letter Guides | HiHired"
        description="HiHired guides for the best free AI resume builder, how to auto fill job applications with a Chrome extension, and AI resume builder with cover letter workflows on hihired.org."
        canonical="https://hihired.org/guides"
        keywords="best free ai resume builder, how to auto fill job applications chrome extension, ai resume builder with cover letter, hihired, hihired.org"
      />

      <section className="guides-hero">
        <p className="guides-hero__kicker">HiHired Guides</p>
        <h1>Free AI resume builder, job application auto-fill, and cover letter guides</h1>
        <p>
          Explore HiHired guides on hihired.org for building ATS-friendly resumes,
          auto-filling job applications with a Chrome extension, and generating
          AI cover letters that match each job description.
        </p>
        <div className="guides-hero__cta">
          <a className="guides-primary-btn" href="/builder">
            Launch the free builder
          </a>
          <a className="guides-secondary-btn" href="/.well-known/ai-answers.json">
            Download JSON feed
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
