import React from "react";
import "./TeamSection.css";

const teamMembers = [
  {
    name: "Jack Yu",
    role: "Founder & CEO",
    summary: "Builder and operator behind HiHired.",
    highlights: ["Former Tech Lead at TikTok", "Senior engineer at Twilio & eBay"],
    linkedin: "https://www.linkedin.com/in/han-y-1448344b/",
  },
  {
    name: "Xuan Wu",
    role: "Co-Founder & CTO",
    summary: "Leads product engineering and AI systems.",
    highlights: ["Focus on resume intelligence", "Tech Lead in Microsoft's infrastructure team"],
  },
];

const extendedTeam = [
  {
    label: "Product & Engineering Partners",
    detail:
      "Lean team augmented by trusted contractors from Jack's TikTok and Twilio network as we scale feature delivery.",
  },
  {
    label: "Advisors",
    detail:
      "Engaged legal, GTM, and university career advisors on a project basis while we formalize an external advisory board.",
  },
  {
    label: "We're Hiring",
    detail:
      "Seeking founding engineers (Go/React) and AI researchers passionate about career tech and resume intelligence.",
  },
];

const TeamSection = () => {
  return (
    <section className="team-section" id="team">
      <div className="team-container">
        <div className="team-header">
          <h2>Meet the Team</h2>
          <p>
            We&apos;re a product-led crew of operators, engineers, and career
            experts building HiHired for job seekers worldwide.
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <article className="team-card" key={member.name}>
              <div className="team-avatar">{member.name.charAt(0)}</div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <span className="team-role">{member.role}</span>
                <p className="team-summary">{member.summary}</p>
                <ul className="team-highlights">
                  {member.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {member.linkedin ? (
                  <div className="team-links">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="team-founder-contact">
          <h3>Founder Contact</h3>
          <p>
            Seattle-based and available at{" "}
            <a href="mailto:hyu@hihired.org">hyu@hihired.org</a>
            .
          </p>
        </div>

        <div className="team-supporting">
          {extendedTeam.map((item) => (
            <div className="team-supporting-item" key={item.label}>
              <span className="supporting-label">{item.label}</span>
              {item.role ? <span className="supporting-role">{item.role}</span> : null}
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
