import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JobsPage.css';
import SEO from '../components/SEO';
import { setLastStep } from '../utils/exitTracking';
import { trackBuilderStart, trackCTAClick } from '../components/Analytics';

const JOB_MATCH_STEPS = [
  {
    title: 'Discover verified openings',
    description:
      'Browse curated roles sourced directly from company career pages and refreshed every morning.',
    icon: '🔍',
  },
  {
    title: 'Instant resume alignment',
    description:
      'Paste the job post to see how your resume stacks up with tailored bullet suggestions and keyword coverage.',
    icon: '🤖',
  },
  {
    title: 'One-click application kit',
    description:
      'Generate a polished PDF, job match report, and optional cover letter ready to send.',
    icon: '📄',
  },
];

const JobsPage = () => {
  const navigate = useNavigate();

  const handleStartMatching = () => {
    setLastStep('jobs_page_match_cta');
    trackCTAClick('jobs_page_match_cta', { page: window.location.pathname });
    trackBuilderStart('jobs_page_match_cta');
    navigate('/builder');
  };

  return (
    <div className="jobs-page">
      <SEO
        title="Find Jobs Matched to Your Resume | HiHired Job Match"
        description="Browse verified job openings, see how your resume scores, and generate tailored application materials in one workspace."
        canonical="https://hihired.org/jobs"
        keywords="job match, resume matching, job search, ai job finder"
      />

      <section className="jobs-hero">
        <div className="jobs-hero-content">
          <span className="jobs-hero-pill">New</span>
          <h1>Find jobs your resume was built for</h1>
          <p>
            HiHired surfaces fresh roles from top teams every morning, then helps you tailor your resume and application to each posting with a single click.
          </p>
          <div className="jobs-hero-actions">
            <button className="jobs-cta" type="button" onClick={handleStartMatching}>
              Start Matching Jobs
            </button>
            <span className="jobs-hero-note">No credit card required · export when you&apos;re ready</span>
          </div>
        </div>
      </section>

      <section className="jobs-steps">
        {JOB_MATCH_STEPS.map(({ title, description, icon }) => (
          <div key={title} className="jobs-step-card">
            <div className="jobs-step-icon" aria-hidden="true">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </section>

      <section className="jobs-footer-cta">
        <h2>Bring your resume and see which roles fit today</h2>
        <p>
          Upload your latest version or start fresh, then let Job Match highlight the openings and bullet points that move you to the interview.
        </p>
        <button className="jobs-footer-button" type="button" onClick={handleStartMatching}>
          Open Job Match
        </button>
      </section>
    </div>
  );
};

export default JobsPage;
