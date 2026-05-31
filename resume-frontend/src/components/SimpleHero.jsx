import React from 'react';
import './SimpleHero.css';
import { setLastStep } from '../utils/exitTracking';
import { trackCTAClick } from './Analytics';

const resumePreviewSrc = '/templates/modern.png';

const APPLICATION_PLATFORMS = ['Workday', 'Greenhouse', 'Lever', 'LinkedIn', 'Indeed', 'iCIMS'];

const SimpleHero = ({ onCreateClick }) => {
  const handleCreate = () => {
    setLastStep('clicked_create_from_hero');
    trackCTAClick('hero_create_cta', { page: window.location.pathname });
    onCreateClick?.();
  };

  return (
    <div className="simple-hero">
      <div className="hero-container">
        <div className="hero-left">
          <h1 className="hero-headline">
            Build a tailored resume, then autofill the application
          </h1>
          <p className="hero-description">
            HiHired turns one saved profile into job-specific resumes, cover letters,
            and faster applications across the job sites you already use.
          </p>

          <div className="hero-primary-cta">
            <div className="hero-cta-buttons">
              <button className="btn-create" onClick={handleCreate}>
                Build my resume free
              </button>
              <a
                className="btn-create hero-extension-link"
                href="https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('hero_chrome_extension_cta', { page: window.location.pathname })}
              >
                Install Chrome extension
              </a>
            </div>
            <span className="hero-cta-note">No credit card required. Free PDF export.</span>
          </div>

          <div className="hero-logos">
            <span className="hero-logos-label">
              Autofill-ready for common application platforms
            </span>
            <div className="hero-logos-row" role="list">
              {APPLICATION_PLATFORMS.map((name) => (
                <span
                  key={name}
                  className="hero-platform-chip"
                  role="listitem"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-product-visual" aria-label="HiHired resume builder preview">
            <div className="resume-preview">
              <img
                src={resumePreviewSrc}
                alt="HiHired tailored resume preview"
                className="hero-preview-image"
              />
              <div className="hero-preview-badge">
                Tailored resume preview
              </div>
            </div>

            <div className="workflow-strip" aria-hidden="true">
              <span>Import resume</span>
              <span className="workflow-arrow">-&gt;</span>
              <span>Customize</span>
              <span className="workflow-arrow">-&gt;</span>
              <span>Export PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHero;
