import React from 'react';
import './SimpleHero.css';
import { setLastStep } from '../utils/exitTracking';
import { trackCTAClick } from './Analytics';

const SimpleHero = ({ onImportClick, onCreateClick }) => {
  const handleImport = () => {
    setLastStep('clicked_import_from_hero');
    trackCTAClick('hero_import_cta', { page: window.location.pathname });
    onImportClick?.();
  };

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
            Free AI Resume Builder - 100% Free Forever
          </h1>
          
          <p className="hero-description">
            Build your perfect resume for free with AI assistance. No signup required, no hidden fees. 
            Get professional templates, AI-powered writing help, and instant PDF downloads - all 100% free. 
            Join thousands creating winning resumes in minutes!
          </p>
          
          <div className="hero-buttons">
            <button className="btn-import" onClick={handleImport}>
              Import your resume
            </button>
            <button className="btn-create" onClick={handleCreate}>
              Create my resume
            </button>
          </div>
          
          <div className="ai-feature">
            <div className="ai-icon">✏️</div>
            <div className="ai-content">
              <h3>Let AI do the work!</h3>
              <p>
                Describe your role in a few words, and we'll generate tailored 
                content for your work experience section.
              </p>
              <button className="btn-try-ai" onClick={handleCreate}>
                Get Started →
              </button>
            </div>
          </div>
        </div>
        
        <div className="hero-right">
          <div className="resume-preview">
            <div className="resume-placeholder">
              <div className="resume-header">
                <div className="resume-name">SARAH JOHNSON</div>
                <div className="resume-contact">
                  <span>📍 New York, NY</span>
                  <span>📞 (555) 123-4567</span>
                  <span>✉️ sarah.j@email.com</span>
                </div>
              </div>
              
              <div className="resume-section">
                <h3>EXPERIENCE</h3>
                <div className="job-entry">
                  <div className="job-header">
                    <strong>Senior Marketing Manager</strong>
                    <span className="job-date">2022 - Present</span>
                  </div>
                  <em>TechCorp Inc.</em>
                  <ul>
                    <li>Manage digital marketing campaigns with $500K+ annual budget</li>
                    <li>Increased lead generation by 45% through targeted strategies</li>
                    <li>Lead team of 5 marketing specialists and coordinate with sales</li>
                  </ul>
                </div>
                
                <div className="job-entry">
                  <div className="job-header">
                    <strong>Marketing Manager</strong>
                    <span className="job-date">2021 - 2022</span>
                  </div>
                  <em>StartupXYZ</em>
                  <ul>
                    <li>Developed and executed comprehensive marketing strategies</li>
                    <li>Launched 10+ successful product campaigns</li>
                    <li>Built brand presence from 0 to 50K social media followers</li>
                  </ul>
                </div>
                
                <div className="job-entry">
                  <div className="job-header">
                    <strong>Marketing Specialist</strong>
                    <span className="job-date">2019 - 2021</span>
                  </div>
                  <em>Digital Agency</em>
                  <ul>
                    <li>Created content for social media and email campaigns</li>
                    <li>Analyzed campaign metrics and improved ROI by 30%</li>
                    <li>Managed client accounts and delivered monthly reports</li>
                  </ul>
                </div>
              </div>
              
              <div className="resume-section">
                <h3>EDUCATION</h3>
                <div className="education-entry">
                  <strong>Bachelor of Business Administration</strong>
                  <em>NYU Stern School of Business - 2019</em>
                </div>
              </div>
              
              <div className="resume-section">
                <h3>SKILLS</h3>
                <div className="skills-list">
                  Google Analytics • SEO/SEM • Social Media Marketing • Adobe Creative Suite • 
                  HubSpot • Salesforce • Content Strategy • Data Analysis
                </div>
              </div>
            </div>
            
            <div className="resume-badges">
              <div className="badge-lightning">⚡</div>
              <div className="badge-text">
                <strong>Build Your Resume Fast</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default SimpleHero;
