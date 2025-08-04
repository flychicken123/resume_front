import React from 'react';
import { useResume } from '../context/ResumeContext';

const StepPreview = ({ onDownload }) => {
  const { data } = useResume();
  
  // Get template class based on selected format
  const getTemplateClass = () => {
    const format = data.selectedFormat || 'temp1';
    console.log('Selected format for preview:', format);
    switch (format) {
      case 'modern':
        console.log('Applying modern template styles');
        return 'preview modern';
      case 'industry-manager':
        console.log('Applying industry-manager template styles');
        return 'preview industry-manager';
      default:
        console.log('Applying temp1 template styles');
        return 'preview'; // temp1 template
    }
  };

  // Format experience data
  const formatExperiences = () => {
    if (!data.experiences || data.experiences.length === 0) return null;
    
    return data.experiences.map((exp, idx) => {
      if (!exp.jobTitle && !exp.company) return null;
      
      const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
      const endDate = exp.currentlyWorking ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
      
      return (
        <div key={idx} className="experience-item">
          <div className="institution-header">
            {exp.jobTitle} at {exp.company}
          </div>
          <div className="education-details">
            {exp.remote ? 'Remote' : 
             exp.city && exp.state ? `${exp.city}, ${exp.state}` : 
             exp.city || exp.state || ''} • {startDate} - {endDate}
          </div>
          {exp.description && (
            <ul className="bullet-points">
              {exp.description.split('\n').filter(point => point.trim()).map((point, pointIdx) => (
                <li key={pointIdx}>{point.trim()}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  // Format education data
  const formatEducation = () => {
    if (!data.education || data.education.length === 0) return null;
    
    return data.education.map((edu, idx) => {
      if (!edu.degree && !edu.school) return null;
      
      return (
        <div key={idx} className="education-item">
          <div className="institution-header">
            {edu.degree} {edu.field && `in ${edu.field}`}
          </div>
          <div className="education-details">
            {edu.school} • {edu.graduationYear} {edu.gpa && `• GPA: ${edu.gpa}`} {edu.honors && `• ${edu.honors}`}
          </div>
        </div>
      );
    }).filter(Boolean);
  };
  
  return (
    <div className={getTemplateClass()}>
      <div className="header">
        <div className="name">{data.name || 'Your Name'}</div>
        <div className="contact-info">
          {data.email && data.phone ? `${data.email} • ${data.phone}` : (data.email || data.phone || 'your.email@example.com • (555) 123-4567')}
        </div>
      </div>
      
      {data.summary && (
        <>
          <div className="section-header">Summary</div>
          <p>{data.summary}</p>
        </>
      )}
      
      {formatExperiences() && (
        <>
          <div className="section-header">Experience</div>
          {formatExperiences()}
        </>
      )}
      
      {formatEducation() && (
        <>
          <div className="section-header">Education</div>
          {formatEducation()}
        </>
      )}
      
      {data.skills && (
        <>
          <div className="section-header">Skills</div>
          <p>{data.skills}</p>
        </>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button onClick={onDownload} style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 600 }}>
          Download Resume
        </button>
      </div>
    </div>
  );
}

export default StepPreview;