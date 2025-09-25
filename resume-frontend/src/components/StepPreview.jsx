import React, { useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';

const StepPreview = ({ onDownload }) => {
  const { data } = useResume();
  const normalizedFormat = normalizeTemplateId(data.selectedFormat);
  const toText = (val) => {
    if (val == null) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.filter(Boolean).join(', ');
    if (typeof val === 'object') {
      try {
        const values = Object.values(val);
        const flattened = values.every((v) => Array.isArray(v)) ? values.flat() : values;
        return flattened.filter(Boolean).join(', ');
      } catch (e) { return ''; }
    }
    return String(val);
  };
  

  
  const parseSkills = (value) => {
    const toArray = (input) =>
      input
        .replace(/\r?\n/g, ',')
        .split(/[,;]+/)
        .map((skill) => skill.trim())
        .filter(Boolean);

    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => {
          if (typeof item === "string") return toArray(item);
          return toArray(toText(item));
        });
    }
    return toArray(String(value));
  };


  // Font size scaling factors - increased small and medium for better readability
  const fontSizeScaling = {
    'small': 1.0,
    'medium': 1.2,
    'large': 1.5,
    'extra-large': 1.8
  };
  
  const scale = fontSizeScaling[data.selectedFontSize || 'medium'] || 1.2;
const isIndustryManager = normalizedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;

  
  // Helper function to scale font sizes (match LivePreview exactly)
  const scaleFont = (baseSize) => {
    const size = parseInt(baseSize);
    return `${Math.round(size * scale)}pt`; // Use pt for consistency with CSS
  };

  // Update CSS custom properties when font size changes (match executive-serif template)
  useEffect(() => {
    const root = document.documentElement;
    // Use the same font sizes as LivePreview executive-serif template
    root.style.setProperty('--font-size-base', scaleFont('10pt'));     // Container base
    root.style.setProperty('--font-size-header', scaleFont('16pt'));  // Header/name
    root.style.setProperty('--font-size-section', scaleFont('13pt')); // Section titles
    root.style.setProperty('--font-size-content', scaleFont('11pt')); // Company/job titles
    root.style.setProperty('--font-size-details', scaleFont('10pt')); // Contact/dates
    root.style.setProperty('--font-size-list', scaleFont('10pt'));    // Bullet points
    

  }, [data.selectedFontSize, scale]);

  // Get template class based on selected format
  const getTemplateClass = () => {
    const format = normalizedFormat || DEFAULT_TEMPLATE_ID;
    switch (format) {
      case TEMPLATE_SLUGS.MODERN_CLEAN:
        return 'preview modern-clean';
      case TEMPLATE_SLUGS.EXECUTIVE_SERIF:
        return 'preview executive-serif';
      default:
        return 'preview'; // classic-professional template
    }
  };

  // Format experience data
  const formatExperiences = () => {
    if (!data.experiences || data.experiences.length === 0) return null;

    const dash = isIndustryManager ? ' – ' : ' - ';

    return data.experiences
      .map((exp, idx) => {
        if (!exp.jobTitle && !exp.company) return null;

        const startDate = exp.startDate
          ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '';
        const endDate = exp.currentlyWorking
          ? 'Present'
          : exp.endDate
          ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '';
        const dateRange = startDate || endDate
          ? (startDate ? `${startDate}${dash}${endDate || 'Present'}` : endDate)
          : '';

        const location = exp.remote
          ? 'Remote'
          : exp.city && exp.state
          ? `${toText(exp.city)}, ${toText(exp.state)}`
          : toText(exp.city) || toText(exp.state) || '';

        const headerSegments = [
          toText(exp.jobTitle),
          toText(exp.company),
          location,
          dateRange
        ]
          .filter(Boolean)
          .map((segment) => segment.replace(/\s+-\s+/g, ' – '));

        const headerText = isIndustryManager
          ? headerSegments.join(' | ')
          : `${toText(exp.jobTitle)} at ${toText(exp.company)}`;

        const secondaryLine = isIndustryManager
          ? ''
          : [location, dateRange].filter(Boolean).join(' • ');

        const descriptionContent = exp.description
          ? (
              <ul className="bullet-points">
                {exp.description
                  .split(/\r?\n/)
                  .filter((point) => point.trim())
                  .map((point, pointIdx) => (
                    <li key={pointIdx}>{point.trim().replace(/^[\u2022\u25AA-]+\s*/, '')}</li>
                  ))}
              </ul>
            )
          : null;

        const node = (
          <>
            <div className="institution-header">{headerText}</div>
            {!isIndustryManager && secondaryLine && (
              <div className="education-details">{secondaryLine}</div>
            )}
            {descriptionContent}
          </>
        );

        if (isIndustryManager) {
          return (
            <div key={idx} className="section-item">
              <span className="section-item-marker">▪</span>
              <div className="section-item-body">{node}</div>
            </div>
          );
        }

        return (
          <div key={idx} className="experience-item">
            {node}
          </div>
        );
      })
      .filter(Boolean);
  };
  // Format education data
  const formatEducation = () => {
    if (!data.education || data.education.length === 0) return null;

    const dash = isIndustryManager ? ' – ' : ' - ';

    return data.education
      .map((edu, idx) => {
        if (!edu.degree && !edu.school) return null;

        if (isIndustryManager) {
          const degreePart = [toText(edu.degree), edu.field ? toText(edu.field) : '']
            .filter(Boolean)
            .join(' in ');

          let dateRange = '';
          if (edu.startYear && edu.graduationYear) {
            dateRange = `${edu.startYear}${dash}${edu.graduationYear}`;
          } else if (edu.graduationYear) {
            const gradYear = parseInt(edu.graduationYear, 10);
            dateRange = Number.isNaN(gradYear) ? toText(edu.graduationYear) : `${gradYear - 4}${dash}${gradYear}`;
          } else if (edu.startDate && edu.endDate) {
            dateRange = `${toText(edu.startDate)}${dash}${toText(edu.endDate)}`;
          } else if (edu.endDate) {
            dateRange = toText(edu.endDate);
          } else if (edu.startDate) {
            dateRange = `${toText(edu.startDate)}${dash}Present`;
          }

          const location = [
            toText(edu.school),
            [toText(edu.city), toText(edu.state)].filter(Boolean).join(', ')
          ]
            .filter(Boolean)
            .join(', ');

          const segments = [degreePart, dateRange, location]
            .filter(Boolean)
            .map((segment) => segment.replace(/\s+-\s+/g, ' – ').toUpperCase());

          if (segments.length === 0) return null;

          const node = (
            <div className="institution-header">{segments.join(' | ')}</div>
          );

          return (
            <div key={idx} className="section-item">
              <span className="section-item-marker">▪</span>
              <div className="section-item-body">{node}</div>
            </div>
          );
        }

        return (
          <div key={idx} className="education-item">
            <div className="institution-header">
              {toText(edu.degree)} {edu.field && `in ${toText(edu.field)}`}
            </div>
            <div className="education-details">
              {toText(edu.school)} • {toText(edu.graduationYear)} {edu.gpa && `• GPA: ${toText(edu.gpa)}`} {edu.honors && `• ${toText(edu.honors)}`}
            </div>
          </div>
        );
      })
      .filter(Boolean);
  };
  const wrapSectionContent = (content) => {
    if (!content) return content;
    if (!isIndustryManager) return content;
    return <div className="section-content">{content}</div>;
  };

  const formatSkills = () => {
    const skills = parseSkills(data.skills);
    if (skills.length === 0) return null;

    if (isIndustryManager) {
      const columnCount = 2;
      const itemsPerColumn = Math.ceil(skills.length / columnCount);
      const columns = Array.from({ length: columnCount }, (_, columnIndex) =>
        skills.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn)
      );
      const activeColumns = columns.filter((column) => column.length > 0);
      const columnCountResolved = activeColumns.length || 1;

      return (
        <div className="skills-grid">
          {activeColumns.map((column, columnIdx) => (
            <ul
              key={columnIdx}
              className="skills-column"
              style={{
                width: `${100 / columnCountResolved}%`,
                paddingRight: columnIdx < columnCountResolved - 1 ? '18pt' : 0,
                display: 'inline-block',
                verticalAlign: 'top',
                boxSizing: 'border-box'
              }}
            >
              {column.map((skill, skillIdx) => (
                <li key={`${columnIdx}-${skillIdx}`}>{skill}</li>
              ))}
            </ul>
          ))}
        </div>
      );
    }

    return <p>{skills.join(', ')}</p>;
  };

  // Format projects data
  const formatProjects = () => {
    if (!data.projects || data.projects.length === 0) return null;
    
    return data.projects.map((project, idx) => {
      if (!project.projectName) return null;
      
      const node = (
        <div className="experience-item">
          <div className="institution-header">
            {toText(project.projectName)}
          </div>
          {project.technologies && (
            <div className="education-details">
              {toText(project.technologies)}
            </div>
          )}
          {project.projectUrl && (
            <div className="education-details">
              {toText(project.projectUrl)}
            </div>
          )}
          {project.description && (
            <ul className="bullet-points">
              {project.description.split(/\r?\n/).filter(point => point.trim()).map((point, pointIdx) => (
                <li key={pointIdx}>
                  {point.trim().replace(/^[\u2022\u25AA-]+\s*/, '')}
                </li>
              ))}
            </ul>
          )}
        </div>
      );

      if (isIndustryManager) {
        return (
          <div key={idx} className="section-item">
            <span className="section-item-marker">▪</span>
            <div className="section-item-body">{node}</div>
          </div>
        );
      }

      return node;
    }).filter(Boolean);
  };
  const summaryContent = data.summary ? <p>{toText(data.summary)}</p> : null;
  const experiencesContent = formatExperiences();
  const projectsContent = formatProjects();
  const educationContent = formatEducation();

  const skillsContent = formatSkills();
  return (
    <div className="preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      <div className={getTemplateClass()} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="header">
          <div className="name">{toText(data.name) || 'Your Name'}</div>
          <div className="contact-info">
            {data.email && data.phone ? `${data.email} • ${data.phone}` : (data.email || data.phone || 'your.email@example.com • (555) 123-4567')}
          </div>
        </div>
        
        {summaryContent && (
          <>
            <div className="section-header">Summary</div>
            {wrapSectionContent(summaryContent)}
          </>
        )}
        
        {experiencesContent && (
          <>
            <div className="section-header">Experience</div>
            {wrapSectionContent(experiencesContent)}
          </>
        )}
        
        {projectsContent && (
          <>
            <div className="section-header">Projects</div>
            {wrapSectionContent(projectsContent)}
          </>
        )}
        
        {educationContent && (
          <>
            <div className="section-header">Education</div>
            {wrapSectionContent(educationContent)}
          </>
        )}
        
        {skillsContent && (
          <>
            <div className="section-header">Skills</div>
            {wrapSectionContent(skillsContent)}
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



