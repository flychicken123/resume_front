import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_OPTIONS } from '../constants/templates';
import { trackReferrer, trackBuilderStart } from '../components/Analytics';
import SEO from '../components/SEO';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { updateData } = useResume();

  // Track referrer when component loads
  React.useEffect(() => {
    trackReferrer();
    trackBuilderStart('templates_page');
  }, []);

  const templates = TEMPLATE_OPTIONS;

  const handleTemplateSelect = (templateId) => {
    updateData({ selectedFormat: templateId });
    trackReferrer();
    trackBuilderStart(`template_${templateId}`);
    navigate('/builder');
  };

  return (
    <div className="templates-page">
      <SEO
        title="Free Resume Templates & ATS-Ready AI Resume Builder | HiHired"
        description="Browse ATS-friendly resume templates on hihired.org, then continue with HiHired's free AI resume builder, AI cover letter generator, and Chrome auto-fill workflow for job applications."
        keywords="free resume templates, ats resume templates, professional resume designs, resume formats, hi hired templates, free ai resume builder, ai cover letter generator, chrome auto fill job applications"
        canonical="https://hihired.org/templates"
      />
      <div className="templates-header">
        <h1>Choose Your Resume Template</h1>
        <p>Select a professional template that matches your industry and personal style</p>
      </div>
      
      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card" onClick={() => handleTemplateSelect(template.id)}>
            <div className="template-image">
              <img src={template.image} alt={template.name} />
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <button className="select-template-btn">Use This Template</button>
            </div>
          </div>
        ))}
      </div>

      <section style={{ maxWidth: '1120px', margin: '48px auto 0', padding: '0 20px 40px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px 28px', background: '#f8fafc' }}>
          <p style={{ margin: '0 0 10px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
            Next steps on hihired.org
          </p>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.8rem', color: '#0f172a' }}>
            From resume template to job application workflow
          </h2>
          <p style={{ margin: '0 0 18px', color: '#475569', lineHeight: 1.7, maxWidth: '900px' }}>
            After choosing a template, explore the HiHired guides people search for most: best free AI resume builder,
            chrome extension auto fill job applications, and AI cover letter generator free workflows.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Link to="/guides/best-free-ai-resume-builder-2026" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
              <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>best free AI resume builder</p>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>See how HiHired combines ATS-ready templates, AI tailoring, and recruiter-ready PDF export.</p>
            </Link>
            <Link to="/guides/auto-fill-job-applications-chrome-extension" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
              <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>chrome extension auto fill job applications</p>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Learn how HiHired Auto-Fill carries the same resume profile into Workday, Greenhouse, Lever, and LinkedIn forms.</p>
            </Link>
            <Link to="/guides/ai-cover-letter-generator-free" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
              <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>AI cover letter generator free</p>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Generate a matching AI cover letter from the same resume and target job description on HiHired.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TemplatesPage;
