import React from 'react';
import './ResumeShowcase.css';
import { TEMPLATE_OPTIONS } from '../constants/templates';
import TemplateThumbnail from './TemplateThumbnail';

const ResumeShowcase = () => {
  const resumeExamples = TEMPLATE_OPTIONS.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
  }));

  return (
    <div className="resume-showcase">
      <div className="showcase-header">
        <h2 className="showcase-title">Professional Resume Templates</h2>
        <p className="showcase-subtitle">
          Choose from our collection of ATS-friendly resume templates designed to help you land your dream job
        </p>
      </div>
      
      <div className="resume-grid">
        {resumeExamples.map((resume) => (
          <div key={resume.id} className="resume-example">
            <TemplateThumbnail templateId={resume.id} width={260} />
            <div className="resume-info">
              <h3 className="resume-name">{resume.name}</h3>
              <p className="resume-description">{resume.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="showcase-benefits">
        <div className="benefit">
          <span className="benefit-icon">✅</span>
          <span className="benefit-text">ATS-Optimized</span>
        </div>
        <div className="benefit">
          <span className="benefit-icon">🎨</span>
          <span className="benefit-text">Professional Designs</span>
        </div>
        <div className="benefit">
          <span className="benefit-icon">📝</span>
          <span className="benefit-text">Easy to Customize</span>
        </div>
        <div className="benefit">
          <span className="benefit-icon">⚡</span>
          <span className="benefit-text">Instant Download</span>
        </div>
      </div>
    </div>
  );
};

export default ResumeShowcase;
