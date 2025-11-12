import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

const problemCards = [
  {
    title: "The Problems We Tackle",
    description:
      "Traditional resume building is manual, inconsistent, and frequently filtered out by applicant tracking systems before a recruiter ever sees it.",
    bullets: [
      "Applicants juggle countless document versions and still miss the keywords hiring teams expect.",
      "Formatting tasks steal time from tailoring achievements to the role at hand.",
      "Career changers and graduates struggle to translate experience into recruiter-ready language.",
    ],
  },
  {
    title: "Who We Serve",
    description:
      "HiHired supports job seekers across industries who need to ship professional materials quickly and keep them aligned with every application.",
    bullets: [
      "Students and early-career talent preparing for internships or first roles.",
      "Experienced professionals pivoting into new domains or geographies.",
      "Freelancers, contractors, and high-volume applicants managing dozens of job submissions each month.",
    ],
  },
  {
    title: "Industry Context",
    description:
      "Hiring teams rely on automation long before a human review happens, which means your resume has to be machine-readable and data-rich from the start.",
    bullets: [
      "Over 90% of enterprises use ATS filters and AI ranking prior to recruiter review.",
      "Language mismatch and formatting errors trigger instant rejections.",
      "Recruiting teams need structured proof points to compare candidates quickly—we surface those automatically.",
    ],
  },
];

const serviceOfferings = [
  {
    icon: "🧠",
    title: "AI Resume Studio",
    description:
      "Live editor with AI-assisted copy suggestions, dynamic sections, and ATS-ready exports in minutes.",
  },
  {
    icon: "🔍",
    title: "Job Match Intelligence",
    description:
      "Analyze any job description, highlight keyword gaps, and auto-recommend updates grounded in the role.",
  },
  {
    icon: "🎨",
    title: "Template Gallery",
    description:
      "Recruiter-approved templates with real-time previews so every version stays polished and machine readable.",
  },
  {
    icon: "📊",
    title: "Insight Dashboard",
    description:
      "Engagement analytics and recruiter feedback loops help you iterate quickly and learn what resonates.",
  },
  {
    icon: "🤝",
    title: "Employer Integrations",
    description:
      "API-ready architecture powering pilots with staffing agencies, career centers, and hiring partners.",
  },
  {
    icon: "🧭",
    title: "Guided Playbooks",
    description:
      "Prompt libraries, tone controls, and contextual hints that keep applicants confident and on-message.",
  },
];

const productBreakdown = [
  {
    title: "AI Resume Studio",
    stage: "Public Beta",
    summary:
      "Draft, tailor, and export ATS-ready resumes with live AI assistance, tone controls, and recruiter-calibrated sections.",
    bullets: [
      "Smart suggestions for achievements, metrics, and skills based on your background.",
      "Template swap with instant reflow to keep formatting pristine on every export.",
      "One-click download to PDF or DOCX with recruiter-approved spacing and hierarchy.",
    ],
    image: "/templates/modern.png",
    ctaLabel: "Launch Builder",
    type: "link",
    to: "/builder",
  },
  {
    title: "Job Match Intelligence",
    stage: "Closed Beta",
    summary:
      "Analyze any job description, surface keyword gaps, and receive inline rewrites aligned to the role's requirements.",
    bullets: [
      "Keyword, skill, and responsibility coverage scoring backed by ATS heuristics.",
      "Gap-highlighting overlay that shows exactly where to strengthen your resume.",
      "Context-aware prompts that adapt to industry, seniority, and locale.",
    ],
    image: "/og-image.jpg",
    ctaLabel: "Try Job Match",
    type: "anchor",
    href: "job-match",
  },
  {
    title: "Template Gallery",
    stage: "Production Ready",
    summary:
      "Choose from recruiter-built layouts optimized for readability, ATS parsing, and personal branding across roles.",
    bullets: [
      "Classic, modern, and executive templates purpose-built for tech, product, and business talent.",
      "Live preview paired with resume content so users see exactly what hiring teams receive.",
      "Mobile-responsive editing so layout choices stay intact across devices.",
    ],
    image: "/templates/executive.png",
    ctaLabel: "Browse Templates",
    type: "anchor",
    href: "templates-showcase",
  },
];

const stageStatus = {
  headline: "Public beta with production-ready resume exports",
  summary:
    "The Resume Studio and Job Match Intelligence are shipping weekly enhancements while we pilot employer dashboards with hiring partners.",
  checklist: [
    "Core AI resume builder and template gallery are stable for all free and paid users.",
    "Job Match scoring is released in beta with anonymized feedback loops improving the AI.",
    "Hiring insights dashboard is in closed pilot with three staffing agencies.",
  ],
};

const demoHighlights = [
  {
    title: "Resume Studio Walkthrough",
    description:
      "Generate tailored experience bullets, swap templates, and export PDF-ready resumes in under five minutes.",
    ctaLabel: "Open Builder",
    type: "link",
    to: "/builder",
  },
  {
    title: "Job Match Analyzer",
    description:
      "Paste a job post to watch the AI surface keyword gaps and suggest edits that improve ATS alignment instantly.",
    ctaLabel: "See Job Match",
    type: "anchor",
    href: "job-match",
  },
  {
    title: "Template Gallery Preview",
    description:
      "Browse responsive, ATS-compliant layouts that mirror what candidates download once they finish editing.",
    ctaLabel: "View Templates",
    type: "anchor",
    href: "templates-showcase",
  },
];

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-container">
        <h2 className="about-title">About Us</h2>

        <nav className="about-nav-menu">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("team")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Meet the Team
          </button>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Contact Us
          </button>
        </nav>

        <div className="about-content">
          <div className="about-main">
            <section className="about-overview">
              <span className="about-pill">Business Overview</span>
              <h3 id="about-what-we-are-building">
                AI-crafted resumes that help real people get noticed faster
              </h3>
              <p>
                HiHired is an AI-powered resume platform that pairs machine
                learning with recruiter-built best practices to deliver
                ATS-ready resumes in minutes. We combine resume building,
                job-aware tailoring, and data-backed coaching so every
                applicant can present their experience with confidence.
              </p>
              <p>
                The platform balances automation with human control—users
                choose the tone, emphasize the wins that matter, and export
                polished resumes ready for any job post or staffing workflow.
              </p>
            </section>

            <div className="about-problem-grid">
              {problemCards.map((card) => (
                <div className="about-problem-card" key={card.title}>
                  <h4>{card.title}</h4>
                  <p>{card.description}</p>
                  <ul>
                    {card.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <section className="about-services" id="templates-showcase">
              <h3>What We Offer Today</h3>
              <p>
                Each module inside HiHired is designed to remove friction
                from the job search—from the first blank page to the analytics
                you share with a hiring team.
              </p>

              <div className="about-features-grid">
                {serviceOfferings.map((feature) => (
                  <div className="about-feature-item" key={feature.title}>
                    <div className="about-feature-icon">{feature.icon}</div>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="about-product-breakdown">
              <h3>Product Snapshots</h3>
              <p>
                Here is what each experience looks like in the product today,
                how far along it is, and what users can expect when they click in.
              </p>

              <div className="about-product-grid">
                {productBreakdown.map((product) => (
                  <div className="about-product-card" key={product.title}>
                    <div className="about-product-media">
                      <img
                        src={product.image}
                        alt={`${product.title} demo screenshot`}
                      />
                    </div>
                    <div className="about-product-copy">
                      <span className="about-product-stage">{product.stage}</span>
                      <h4>{product.title}</h4>
                      <p>{product.summary}</p>
                      <ul>
                        {product.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                      {product.type === "link" ? (
                        <Link className="about-product-cta" to={product.to}>
                          {product.ctaLabel}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="about-product-cta"
                          onClick={() => {
                            document
                              .getElementById(product.href)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                        >
                          {product.ctaLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="about-stage">
              <div className="about-stage-card">
                <span className="about-stage-badge">Current Stage</span>
                <h3>{stageStatus.headline}</h3>
                <p>{stageStatus.summary}</p>
                <ul className="about-stage-list">
                  {stageStatus.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="about-demo">
              <div className="about-demo-media">
                <div className="about-demo-image">
                  <img
                    src="/og-image.jpg"
                    alt="Screenshot of the HiHired AI resume builder interface"
                  />
                </div>
                <span className="about-demo-caption">
                  Resume Studio — personalize sections, fine-tune tone, and
                  export ATS-ready resumes in one place.
                </span>
              </div>

              <div className="about-demo-panel">
                <span className="about-demo-label">Experience HiHired</span>
                <ul className="about-demo-list">
                  {demoHighlights.map((demo) => (
                    <li className="about-demo-item" key={demo.title}>
                      <div className="about-demo-text">
                        <h4>{demo.title}</h4>
                        <p>{demo.description}</p>
                      </div>
                      {demo.type === "link" ? (
                        <Link className="about-demo-cta" to={demo.to}>
                          {demo.ctaLabel}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="about-demo-cta"
                          onClick={() => {
                            document
                              .getElementById(demo.href)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                        >
                          {demo.ctaLabel}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="about-mission">
              <h3>Our Mission</h3>
              <p>
                We believe professional storytelling should be accessible to
                every candidate. Our mission is to democratize career success
                by pairing cutting-edge AI with recruiter insight so people
                can present their accomplishments with clarity and credibility.
              </p>
            </section>

            <section className="about-results">
              <h3>Proven Results</h3>
              <p>
                Candidates using HiHired have shipped more than 50,000
                AI-optimized resumes, improved interview rates by over 3×,
                and landed roles at companies including Amazon, Google,
                Meta, Atlassian, and Nike.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
