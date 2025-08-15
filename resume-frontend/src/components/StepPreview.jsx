import React, { useEffect } from 'react';
import { useResume } from '../context/ResumeContext';

const StepPreview = ({ onDownload }) => {
  const { data, setData } = useResume();
  
  console.log('StepPreview component rendered');
  console.log('Current format:', data.selectedFormat);
  console.log('Current font size:', data.selectedFontSize);
  
  // Font size scaling factors - increased small and medium for better readability
  const fontSizeScaling = {
    'small': 0.9,   // Increased from 0.8
    'medium': 1.1,  // Increased from 1.0  
    'large': 1.2,
    'extra-large': 1.4
  };
  
  const scale = fontSizeScaling[data.selectedFontSize || 'medium'] || 1.0;
  
  // Helper function to scale font sizes (match LivePreview exactly)
  const scaleFont = (baseSize) => {
    const size = parseInt(baseSize);
    return `${Math.round(size * scale)}pt`; // Use pt for consistency with CSS
  };

  // Update CSS custom properties when font size changes (match industry-manager template)
  useEffect(() => {
    const root = document.documentElement;
    // Use the same font sizes as LivePreview industry-manager template
    root.style.setProperty('--font-size-base', scaleFont('9pt'));      // Container base
    root.style.setProperty('--font-size-header', scaleFont('18pt'));   // Header/name
    root.style.setProperty('--font-size-section', scaleFont('12pt'));  // Section titles
    root.style.setProperty('--font-size-content', scaleFont('10pt'));  // Company/job titles
    root.style.setProperty('--font-size-details', scaleFont('9pt'));   // Contact/dates
    root.style.setProperty('--font-size-list', scaleFont('9pt'));      // Bullet points
    
    console.log('StepPreview CSS custom properties updated:');
    console.log('--font-size-base:', scaleFont('9pt'));
    console.log('--font-size-header:', scaleFont('18pt'));
    console.log('--font-size-section:', scaleFont('12pt'));
    console.log('--font-size-content:', scaleFont('10pt'));
    console.log('--font-size-details:', scaleFont('9pt'));
  }, [data.selectedFontSize, scale]);

  // Get template class based on selected format
  const getTemplateClass = () => {
    const format = data.selectedFormat || 'temp1';
    switch (format) {
      case 'modern':
        return 'preview modern';
      case 'industry-manager':
        return 'preview industry-manager';
      default:
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
    <div className="preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Live Format Controls */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '1rem', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
          Format Controls:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Template:</label>
          <select 
            value={data.selectedFormat || 'temp1'} 
            onChange={(e) => setData(prev => ({ ...prev, selectedFormat: e.target.value }))}
            style={{ 
              padding: '0.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="temp1">Classic Professional</option>
            <option value="modern">Modern Clean</option>
            <option value="industry-manager">Industry Manager</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Font Size:</label>
          <select 
            value={data.selectedFontSize || 'medium'} 
            onChange={(e) => setData(prev => ({ ...prev, selectedFontSize: e.target.value }))}
            style={{ 
              padding: '0.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>
      </div>
      
      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          background: '#f0f9ff', 
          padding: '4px 8px', 
          fontSize: '10px', 
          color: '#0369a1',
          borderBottom: '1px solid #e5e7eb'
        }}>
          Font Size: {data.selectedFontSize || 'medium'} (Scale: {scale})
        </div>
      )}
      <div className={getTemplateClass()} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'auto',
          marginBottom: '2rem',
          padding: '1rem',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0
        }}>
          <button 
            onClick={onDownload} 
            style={{ 
              padding: '0.75rem 2rem', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Download Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepPreview;