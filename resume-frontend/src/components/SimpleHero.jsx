import React from 'react';
import './SimpleHero.css';
import { setLastStep } from '../utils/exitTracking';
import { trackCTAClick } from './Analytics';

import googleLogo from '../assets/logos/google.png';
import amazonLogo from '../assets/logos/amazon.png';
import microsoftLogo from '../assets/logos/microsoft.png';
import netflixLogo from '../assets/logos/netflix.png';
import salesforceLogo from '../assets/logos/salesforce.png';
import stripeLogo from '../assets/logos/stripe.png';

const resumePreviewSrc = '/templates/modern.png';

const LOGO_COMPANIES = [
  { name: 'Google', logo: googleLogo },
  { name: 'Amazon', logo: amazonLogo },
  { name: 'Microsoft', logo: microsoftLogo },
  { name: 'Netflix', logo: netflixLogo },
  { name: 'Salesforce', logo: salesforceLogo },
  { name: 'Stripe', logo: stripeLogo },
];

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
            Land more interviews with a resume tailored to each job
          </h1>
          <p className="hero-description">
            Import your resume, paste a job description, and get an ATS-optimized
            version in under 5 minutes. Free to start.
          </p>

          <div className="hero-primary-cta">
            <button className="btn-create" onClick={handleCreate}>
              Create my resume
            </button>
            <span className="hero-cta-note">No credit card required</span>
          </div>

          <div className="hero-logos">
            <span className="hero-logos-label">
              Trusted by professionals hired at
            </span>
            <div className="hero-logos-row" role="list">
              {LOGO_COMPANIES.map(({ name, logo }) => (
                <img
                  key={name}
                  src={logo}
                  alt={name}
                  className="hero-logo-img"
                  loading="lazy"
                  role="listitem"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="resume-preview">
            <img
              src={resumePreviewSrc}
              alt="HiHired resume preview"
              className="hero-preview-image"
            />
            <div className="hero-preview-badge">
              Live preview as you type
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHero;
