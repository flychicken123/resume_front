import React from 'react';
import './ResumeShowcase.css';

const ResumeShowcase = () => {
  const resumeExamples = [
    {
      id: 1,
      image: 'https://marketplace.canva.com/EAFRuCp3DcY/1/0/1131w/canva-black-white-minimalist-cv-resume-F2IQ3yjiRJY.jpg',
      alt: 'Professional Resume Example'
    },
    {
      id: 2,
      image: 'https://marketplace.canva.com/EAE8mhdnw_g/2/0/1131w/canva-gray-and-white-simple-clean-resume-TFq26l7yBrI.jpg',
      alt: 'Executive Resume Example'
    },
    {
      id: 3,
      image: 'https://marketplace.canva.com/EAFJMlu5R1k/1/0/1131w/canva-blue-modern-professional-cv-resume-x6ElPaEV50c.jpg',
      alt: 'Modern Resume Example'
    },
    {
      id: 4,
      image: 'https://marketplace.canva.com/EAFoR61Oq7c/1/0/1131w/canva-white-simple-student-cv-resume-M9k2K1qAepI.jpg',
      alt: 'Simple Resume Example'
    },
    {
      id: 5,
      image: 'https://marketplace.canva.com/EAFJMSqYqCA/1/0/1131w/canva-professional-resume-cv-eqOQIKD54rc.jpg',
      alt: 'Technical Resume Example'
    },
    {
      id: 6,
      image: 'https://marketplace.canva.com/EAFczWRfcSo/1/0/1131w/canva-white-and-black-minimalist-resume-eI47V5Lq0CU.jpg',
      alt: 'Minimalist Resume Example'
    }
  ];

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
            <img 
              src={resume.image} 
              alt={resume.alt}
              className="resume-image"
              loading="lazy"
            />
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