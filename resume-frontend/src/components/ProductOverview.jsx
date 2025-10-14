import React from "react";
import "./ProductOverview.css";

const productHighlights = [
  {
    title: "AI Resume Studio",
    description:
      "Live beta web application that guides candidates from blank page to polished resume with AI-assisted copy, templates, and formatting controls.",
  },
  {
    title: "Job Match Intelligence",
    description:
      "Machine learning engine compares resumes to job descriptions, surfaces keyword gaps, and recommends content to boost ATS alignment.",
  },
  {
    title: "Insight Dashboard",
    description:
      "Engagement analytics and recruiter feedback loops help users iterate quickly while we capture signal for future employer offerings.",
  },
];

const deliveryTimeline = [
  {
    label: "Now",
    detail: "Public beta with 5,000+ active users generating resumes weekly.",
  },
  {
    label: "Q1 Roadmap",
    detail: "Interview prep assistant and hiring team dashboards in development.",
  },
  {
    label: "Revenue Model",
    detail:
      "Freemium tiers today with premium AI credits and B2B partnerships piloting.",
  },
];

const differentiators = [
  "AI-generated experience bullets with human-in-the-loop editing.",
  "Template gallery mapped 1:1 with live preview and ATS-safe exports.",
  "Context-aware suggestions that learn from successful placements.",
  "API ready architecture for career centers and staffing partners.",
];

const ProductOverview = () => {
  return (
    <section className="product-section" id="product">
      <div className="product-container">
        <div className="product-header">
          <h2>What We&apos;re Building</h2>
          <p>
            HiHired is a digital-native platform helping job seekers create
            interview-winning resumes in minutes. Our core product is live in
            beta while we scale the AI engine and employer integrations.
          </p>
        </div>

        <div className="product-grid">
          {productHighlights.map((item) => (
            <div className="product-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        <div className="product-details">
          <div className="timeline">
            {deliveryTimeline.map((milestone) => (
              <div className="timeline-item" key={milestone.label}>
                <span className="timeline-label">{milestone.label}</span>
                <p>{milestone.detail}</p>
              </div>
            ))}
          </div>

          <div className="differentiators">
            <h3>Why We Win</h3>
            <ul>
              {differentiators.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="traction-callout">
              <span className="traction-metric">50,000+</span>
              <span className="traction-caption">
                AI-optimized resumes delivered to date
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductOverview;
