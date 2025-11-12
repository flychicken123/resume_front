import React from 'react';
import './SimpleHero.css';
import { setLastStep } from '../utils/exitTracking';
import { trackCTAClick } from './Analytics';
import TRUSTED_COMPANIES from '../constants/trustedCompanies';

const resumePreviewSrc = '/templates/modern.png';

const SimpleHero = ({ onCreateClick, onJobsClick }) => {
  const handleCreate = () => {
    setLastStep('clicked_create_from_hero');
    trackCTAClick('hero_create_cta', { page: window.location.pathname });
    onCreateClick?.();
  };

  const handleBrowseJobs = () => {
    setLastStep('clicked_jobs_from_hero');
    trackCTAClick('hero_jobs_cta', { page: window.location.pathname });
    onJobsClick?.();
  };

  return (
    <div className="simple-hero">
      <div className="hero-container">
        <div className="hero-left">
          <span className="hero-eyebrow">Launch your resume in minutes</span>
          <h1 className="hero-headline">
            Build an ATS-ready resume with AI guidance
          </h1>

          <p className="hero-description">
            Start for free, polish every section with smart suggestions, and see how your resume
            scores against real openings. Upgrade only if you need unlimited downloads, advanced
            formatting, or premium cover letters.
          </p>

          <div className="hero-trusted">
            <span className="hero-trusted-heading">
              Trusted by professionals hired at
            </span>
            <div className="hero-company-logos" role="list">
              {TRUSTED_COMPANIES.map(({ name, logo }) => (
                <span key={name} className="hero-company-logo" role="listitem">
                  <img src={logo} alt={`${name} logo`} loading="lazy" />
                  <span className="hero-company-name">{name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="hero-job-match-note">
            <span className="hero-job-match-icon" aria-hidden="true">💼</span>
            Match your resume to live job openings without leaving HiHired.
          </div>

          <div className="hero-buttons">
            <button className="btn-create" onClick={handleCreate}>
              Create my resume
            </button>
            <button type="button" className="btn-jobs" onClick={handleBrowseJobs}>
              Browse jobs
            </button>
          </div>

          <div className="hero-quick-stats">
            <div className="hero-stat">
              <strong>3 steps</strong>
              <span>Profile · Experience · Polish</span>
            </div>
            <div className="hero-stat">
              <strong>&lt;5 min</strong>
              <span>Average time to first draft</span>
            </div>
            <div className="hero-stat">
              <strong>ATS safe</strong>
              <span>Templates recruiters trust</span>
            </div>
            <div className="hero-stat">
              <strong>Daily jobs</strong>
              <span>Fresh matches every morning</span>
            </div>
          </div>

          <div className="ai-feature">
            <div className="ai-icon" aria-hidden="true">✨</div>
            <div className="ai-content">
              <h3>AI suggestions, your voice</h3>
              <p>
                Get tailored bullet ideas, keyword checks, and instant rewrites
                while you edit. Accept, tweak, or skip — you stay in control.
              </p>
              <button className="btn-try-ai" onClick={handleCreate}>
                Try the builder ->
              </button>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="resume-preview">
            <img
              src={resumePreviewSrc}
              alt="HiHired live resume preview"
              className="hero-preview-image"
            />
            <div className="hero-preview-badge">
              <span role="img" aria-hidden="true">⚡</span>
              Live preview updates as you type
            </div>
            <div className="hero-preview-steps" aria-hidden="true">
              <div className="preview-step">
                <span className="preview-step-number">1</span>
                <span className="preview-step-text">Choose a template</span>
              </div>
              <div className="preview-step">
                <span className="preview-step-number">2</span>
                <span className="preview-step-text">Let AI draft your story</span>
              </div>
              <div className="preview-step">
                <span className="preview-step-number">3</span>
                <span className="preview-step-text">Download &amp; share instantly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHero;
