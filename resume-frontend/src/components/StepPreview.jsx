import React, { useEffect, Fragment } from 'react';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';

const StepPreview = ({ onDownload, hideActions = false, dataOverride }) => {
  const resumeContext = useResume();
  const data = dataOverride || resumeContext.data;
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

  // Utility function to render text with impact keywords highlighted (bolded)
  const renderTextWithImpactHighlights = (text, keywords) => {
    if (!text || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return text;
    }

    // Sort keywords by length (longest first) to handle overlapping matches
    const sortedKeywords = [...keywords]
      .filter((k) => k && typeof k === 'string' && k.trim())
      .sort((a, b) => b.length - a.length);

    if (sortedKeywords.length === 0) {
      return text;
    }

    // Build a regex pattern that matches any of the keywords (case-insensitive)
    const escapedKeywords = sortedKeywords.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

    // Split text by the pattern, keeping the matched parts
    const parts = text.split(pattern);

    if (parts.length === 1) {
      return text;
    }

    // Map parts to JSX, bolding the matched keywords
    return parts.map((part, index) => {
      if (!part) return null;
      // Check if this part matches any keyword (case-insensitive)
      const isKeyword = sortedKeywords.some(
        (k) => k.toLowerCase() === part.toLowerCase()
      );
      if (isKeyword) {
        return (
          <strong key={index} style={{ fontWeight: 700 }}>
            {part}
          </strong>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  };

  // Get impact keywords for a specific experience description
  const getExperienceDescriptionKeywords = (experienceIndex) => {
    if (!data.highlightImpact || !data.impactKeywords?.experiences) {
      return [];
    }
    const expKey = `exp-${experienceIndex}`;
    return data.impactKeywords.experiences[expKey]?.description || [];
  };

  // Get impact keywords for a specific project within an experience
  const getProjectKeywords = (experienceIndex, projectIndex, field) => {
    if (!data.highlightImpact || !data.impactKeywords?.experiences) {
      return [];
    }
    const expKey = `exp-${experienceIndex}`;
    const projKey = `proj-${experienceIndex}-${projectIndex}`;
    const projects = data.impactKeywords.experiences[expKey]?.projects;
    if (!projects || !projects[projKey]) {
      return [];
    }
    return projects[projKey][field] || [];
  };
  

  
  const parseSkills = (value) => {
    const toArray = (input) => {
      const text = String(input || '').trim();
      if (!text) return [];

      // If the value looks like categorized skills (multiple lines with keys),
      // treat each non-empty line as a single row so keys appear on their own lines.
      if (text.includes('\n') && text.includes(':')) {
        return text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
      }

      return text
        .replace(/\r?\n/g, ',')
        .split(/[,;]+/)
        .map((skill) => skill.trim())
        .filter(Boolean);
    };

    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => {
          if (typeof item === 'string') return toArray(item);
          return toArray(toText(item));
        });
    }
    return toArray(value);
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
const isAttorneyTemplate = normalizedFormat === TEMPLATE_SLUGS.ATTORNEY_TEMPLATE;

  
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
      case TEMPLATE_SLUGS.ATTORNEY_TEMPLATE:
        return 'preview attorney-template';
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
          ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
          : '';
        const endDate = exp.currentlyWorking
          ? 'Present'
          : exp.endDate
          ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
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
          location,
        ]
          .filter(Boolean)
          .map((segment) => segment.replace(/\s+-\s+/g, ' – '));

        const metaSegments = [
          toText(exp.company),
          dateRange,
        ].filter(Boolean).map((segment) => segment.replace(/\s+-\s+/g, ' – '));

        const headerText = isIndustryManager
          ? headerSegments.join(' • ')
          : `${toText(exp.jobTitle)} at ${toText(exp.company)}`;

        const secondaryLine = isIndustryManager
          ? metaSegments.join(' • ')
          : [location, dateRange].filter(Boolean).join(' • ');

        const expDescKeywords = getExperienceDescriptionKeywords(idx);
        const descriptionContent = exp.description
          ? (
              <ul className="bullet-points">
                {exp.description
                  .split(/\r?\n/)
                  .filter((point) => point.trim())
                  .map((point, pointIdx) => {
                    const cleanedPoint = point.trim().replace(/^[\u2022\u25AA-]+\s*/, '');
                    const highlightedContent = data.highlightImpact && expDescKeywords.length > 0
                      ? renderTextWithImpactHighlights(cleanedPoint, expDescKeywords)
                      : cleanedPoint;
                    return <li key={pointIdx}>{highlightedContent}</li>;
                  })}
              </ul>
            )
          : null;

        const node = (
          <>
            <div className="institution-header">{headerText}</div>
            {secondaryLine && (
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
    const formatMonthYear = (month, year) => {
      const safeMonth = toText(month);
      const safeYear = toText(year);
      if (safeMonth && safeYear) {
        return `${safeMonth} ${safeYear}`;
      }
      if (safeYear) {
        return safeYear;
      }
      if (safeMonth) {
        return safeMonth;
      }
      return '';
    };

    return data.education
      .map((edu, idx) => {
        if (!edu.degree && !edu.school) return null;

        if (isIndustryManager) {
          const degreePart = [toText(edu.degree), edu.field ? toText(edu.field) : '']
            .filter(Boolean)
            .join(' in ');

          const startFormatted = formatMonthYear(edu.startMonth, edu.startYear);
          const gradFormatted = formatMonthYear(edu.graduationMonth, edu.graduationYear);
          let dateRange = '';
          if (startFormatted && gradFormatted) {
            dateRange = `${startFormatted}${dash}${gradFormatted}`;
          } else if (gradFormatted) {
            dateRange = gradFormatted;
          } else if (startFormatted) {
            dateRange = `${startFormatted}${dash}Present`;
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
            {(() => {
              const startFormatted = formatMonthYear(edu.startMonth, edu.startYear);
              const gradFormatted = formatMonthYear(edu.graduationMonth, edu.graduationYear);
              let dateSegment = '';
              if (startFormatted && gradFormatted) {
                dateSegment = `${startFormatted}${dash}${gradFormatted}`;
              } else if (gradFormatted) {
                dateSegment = gradFormatted;
              } else if (startFormatted) {
                dateSegment = `${startFormatted}${dash}Present`;
              } else if (edu.graduationYear) {
                dateSegment = toText(edu.graduationYear);
              }
              const segments = [
                toText(edu.school),
                dateSegment,
                edu.gpa ? `GPA: ${toText(edu.gpa)}` : '',
                edu.honors ? toText(edu.honors) : ''
              ].filter(Boolean);
              return (
                <div className="education-details">
                  {segments.join(' • ')}
                </div>
              );
            })()}
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
    const skills = parseSkills(data.skillsCategorized || data.skills);
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
        <div
          className="skills-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCountResolved}, minmax(0, 1fr))`,
            columnGap: '16pt',
            rowGap: '8pt',
            width: '100%',
          }}
        >
          {activeColumns.map((column, columnIdx) => (
            <ul
              key={columnIdx}
              className="skills-column"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8pt',
                minWidth: 0,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {column.map((skill, skillIdx) => (
                <li key={`${columnIdx}-${skillIdx}`} style={{ minWidth: 0 }}>
                  {skill}
                </li>
              ))}
            </ul>
          ))}
        </div>
      );
    }

    const isCategorized = skills.length > 0 && skills.every((s) => typeof s === 'string' && s.includes(':'));

    if (isCategorized) {
      // Render each "<key>: <value>" on its own line for readability.
      return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {skills.map((skill, idx) => (
            <div key={idx}>{skill}</div>
          ))}
        </div>
      );
    }

    return <p>{skills.join(', ')} </p>;
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
  const renderAttorneyPreview = () => {
    const palette = {
      headerBg: '#DCC3AE',
      sidebarBg: 'transparent',
      accent: '#3C2E27',
      body: '#443730',
      highlight: '#B68A65',
      divider: '#E5D1C0'
    };
    const fontScale = scale;
    const typeface = '"Georgia", "Times New Roman", serif';
    const sectionSpacing = 10 * fontScale;
    const headingGap = 5 * fontScale;
    const contentIndent = 0;

    const containerStyle = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${palette.divider}`,
      borderRadius: '6px',
      background: '#ffffff',
      fontFamily: typeface,
      color: palette.body,
      overflow: 'hidden',
      boxShadow: '0 6px 16px rgba(79, 59, 41, 0.08)'
    };
    const headerStyle = {
      background: palette.headerBg,
      padding: `${12 * fontScale}px ${18 * fontScale}px`,
      textAlign: 'center',
      borderBottom: `5px solid ${palette.highlight}`
    };
    const headerNameStyle = {
      fontSize: `${18 * fontScale}px`,
      fontWeight: 700,
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: palette.accent
    };
    const headerTitleStyle = {
      marginTop: `${4 * fontScale}px`,
      fontSize: `${10.8 * fontScale}px`,
      letterSpacing: '1.6px',
      textTransform: 'uppercase',
      color: palette.accent
    };
    const columnsStyle = {
      display: 'grid',
      gridTemplateColumns: '35% 65%',
      width: '100%',
      minHeight: `${300 * fontScale}px`
    };
    const sidebarStyle = {
      background: palette.sidebarBg,
      padding: `${16 * fontScale}px ${14 * fontScale}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${sectionSpacing}px`,
      boxSizing: 'border-box',
      minWidth: 0,
      borderRight: `1px solid ${palette.divider}`
    };
    const sidebarSectionStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: `${4 * fontScale}px`
    };
    const sidebarHeadingStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: `${headingGap}px`,
      fontSize: `${9 * fontScale}px`,
      fontWeight: 700,
      letterSpacing: '1.4px',
      textTransform: 'uppercase',
      color: palette.accent
    };
    const sidebarHeadingBulletStyle = {
      color: palette.highlight,
      fontWeight: 700,
      fontSize: `${9 * fontScale}px`,
      lineHeight: 1
    };
    const sidebarHeadingTextStyle = {
      flex: 1
    };
    const sidebarContentStyle = {
      paddingLeft: `${contentIndent}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${4 * fontScale}px`
    };
    const sidebarBodyStyle = {
      fontSize: `${8.2 * fontScale}px`,
      lineHeight: 1.6,
      color: palette.body,
      whiteSpace: 'pre-line',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere'
    };
    const listStyle = {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'grid',
      gap: `${4 * fontScale}px`
    };
    const listItemStyle = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: `${6 * fontScale}px`,
      fontSize: `${8.2 * fontScale}px`,
      color: palette.body,
      lineHeight: 1.5
    };
    const listBulletStyle = {
      color: palette.highlight,
      fontWeight: 700,
      fontSize: `${8.2 * fontScale}px`,
      lineHeight: 1
    };
    const listTextStyle = {
      flex: 1,
      wordBreak: 'break-word'
    };
    const mainStyle = {
      background: '#ffffff',
      padding: `${18 * fontScale}px ${20 * fontScale}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${12 * fontScale}px`,
      boxSizing: 'border-box',
      minWidth: 0
    };
    const mainSectionStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: `${6 * fontScale}px`
    };
    const mainHeadingStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: `${headingGap}px`,
      borderBottom: `1px solid ${palette.divider}`,
      paddingBottom: `${6 * fontScale}px`
    };
    const mainHeadingBulletStyle = {
      color: palette.highlight,
      fontWeight: 700,
      fontSize: `${11 * fontScale}px`,
      lineHeight: 1
    };
    const mainHeadingTextStyle = {
      fontSize: `${11 * fontScale}px`,
      fontWeight: 700,
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: palette.accent
    };
    const mainContentStyle = {
      paddingLeft: `${contentIndent}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${6 * fontScale}px`
    };
    const experienceBlockStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: `${4 * fontScale}px`,
      marginBottom: `${9 * fontScale}px`
    };
    const experienceHeaderRowStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: `${8 * fontScale}px`
    };
    const experienceRoleStyle = {
      fontSize: `${9 * fontScale}px`,
      fontWeight: 600,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: palette.accent
    };
    const experienceDateStyle = {
      fontSize: `${8 * fontScale}px`,
      color: palette.highlight,
      whiteSpace: 'nowrap'
    };
    const experienceMetaStyle = {
      fontSize: `${8 * fontScale}px`,
      color: palette.body,
      fontStyle: 'italic',
      letterSpacing: '0.3px'
    };
    const bulletListStyle = {
      margin: `${4 * fontScale}px 0 0 0`,
      padding: 0,
      color: palette.body,
      fontSize: `${8 * fontScale}px`,
      lineHeight: 1.5
    };

    const deriveLocation = () => {
      const direct = toText(data.location);
      if (direct) return direct;
      if (Array.isArray(data.experiences)) {
        const match = data.experiences.find((exp) => exp && (exp.city || exp.state));
        if (match) {
          const city = toText(match.city);
          const state = toText(match.state);
          if (city && state) return `${city}, ${state}`;
          return city || state || '';
        }
      }
      return '';
    };

    const formatDate = (value) => {
      if (!value) return '';
      const parsed = new Date(value);
        if (!Number.isNaN(parsed.valueOf())) {
          return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
      }
      return toText(value);
    };

    const name = toText(data.name) || 'Your Name';
    const role = toText(data.position);
    const locationValue = deriveLocation();
    const contactEntries = [
      data.email ? toText(data.email) : null,
      data.phone ? toText(data.phone) : null,
      locationValue || null
    ].filter(Boolean);
    const summaryText = toText(data.summary);
    const skillsList = parseSkills(data.skillsCategorized || data.skills);
    const educationItems = Array.isArray(data.education)
      ? data.education.filter((edu) =>
          edu && (toText(edu.degree) || toText(edu.school) || toText(edu.field) || toText(edu.graduationYear)))
      : [];
    const experiences = Array.isArray(data.experiences)
      ? data.experiences.filter((exp) => exp && (exp.jobTitle || exp.company || exp.description))
      : [];
    const renderExperience = (exp, idx) => {
      const jobTitle = toText(exp.jobTitle) || 'Role';
      const company = toText(exp.company);
      const location = exp.remote ? 'Remote' : [toText(exp.city), toText(exp.state)].filter(Boolean).join(', ');
      const start = formatDate(exp.startDate);
      const end = exp.currentlyWorking ? 'Present' : formatDate(exp.endDate);
      const range = [start, end].filter(Boolean).join(' – ');
      const secondaryLine = [company, location].filter(Boolean).join(' • ');
      const expDescKeywords = getExperienceDescriptionKeywords(idx);
      return (
        <div key={`exp-${idx}`} style={experienceBlockStyle}>
          <div style={experienceHeaderRowStyle}>
            <div style={experienceRoleStyle}>{jobTitle}</div>
            {range && <div style={experienceDateStyle}>{range}</div>}
          </div>
          {secondaryLine && <div style={experienceMetaStyle}>{secondaryLine}</div>}
          {exp.description && (
            <ul style={bulletListStyle}>
              {exp.description.split(/\r?\n/).filter((line) => line.trim()).map((line, lineIdx) => {
                const cleanedLine = line.replace(/^[•▪-]+\s*/, '');
                const highlightedContent = data.highlightImpact && expDescKeywords.length > 0
                  ? renderTextWithImpactHighlights(cleanedLine, expDescKeywords)
                  : cleanedLine;
                return <li key={`exp-${idx}-line-${lineIdx}`}>{highlightedContent}</li>;
              })}
            </ul>
          )}
        </div>
      );
    };

    return (
      <div className="preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <div style={headerNameStyle}>{name}</div>
            {role && <div style={headerTitleStyle}>{role}</div>}
          </div>
          <div style={columnsStyle}>
            <aside style={sidebarStyle}>
              {contactEntries.length > 0 && (
                <div style={sidebarSectionStyle}>
                  <div style={sidebarHeadingStyle}>
                    <span style={sidebarHeadingBulletStyle}>•</span>
                    <span style={sidebarHeadingTextStyle}>Contact</span>
                  </div>
                  <div style={sidebarContentStyle}>
                    <ul style={listStyle}>
                      {contactEntries.map((entry, idx) => (
                        <li key={`contact-${idx}`} style={listItemStyle}>
                          <span style={listBulletStyle}>•</span>
                          <span style={listTextStyle}>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {educationItems.length > 0 && (
                <div style={sidebarSectionStyle}>
                  <div style={sidebarHeadingStyle}>
                    <span style={sidebarHeadingBulletStyle}>•</span>
                    <span style={sidebarHeadingTextStyle}>Education</span>
                  </div>
                  <div style={sidebarContentStyle}>
                    <div style={sidebarBodyStyle}>
                      {educationItems.map((edu, idx) => {
                        const degreeLine = [toText(edu.degree), toText(edu.field)].filter(Boolean).join(', ');
                        const schoolLine = [toText(edu.school), toText(edu.location)].filter(Boolean).join(' • ');
                        const dateLine = formatDate(edu.graduationDate || edu.graduationYear) || toText(edu.graduationYear);
                        const honorsLine = toText(edu.honors);
                        return (
                          <div
                            key={`edu-${idx}`}
                            style={{
                              marginBottom: idx === educationItems.length - 1 ? 0 : `${8 * fontScale}px`
                            }}
                          >
                            {degreeLine && <div style={{ fontWeight: 600 }}>{degreeLine}</div>}
                            {schoolLine && <div>{schoolLine}</div>}
                            {dateLine && <div>{dateLine}</div>}
                            {honorsLine && <div>{honorsLine}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {skillsList.length > 0 && (
                <div style={sidebarSectionStyle}>
                  <div style={sidebarHeadingStyle}>
                    <span style={sidebarHeadingBulletStyle}>•</span>
                    <span style={sidebarHeadingTextStyle}>Key Skills</span>
                  </div>
                  <div style={sidebarContentStyle}>
                    <ul style={listStyle}>
                      {skillsList.map((skill, idx) => (
                        <li key={`skill-${idx}`} style={listItemStyle}>
                          <span style={listBulletStyle}>•</span>
                          <span style={listTextStyle}>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </aside>
            <main style={mainStyle}>
              {summaryText && (
                <div style={mainSectionStyle}>
                  <div style={mainHeadingStyle}>
                    <span style={mainHeadingBulletStyle}>•</span>
                    <span style={mainHeadingTextStyle}>Profile</span>
                  </div>
                  <div style={mainContentStyle}>
                    <div style={sidebarBodyStyle}>{summaryText}</div>
                  </div>
                </div>
              )}
              {experiences.length > 0 && (
                <div style={mainSectionStyle}>
                  <div style={mainHeadingStyle}>
                    <span style={mainHeadingBulletStyle}>•</span>
                    <span style={mainHeadingTextStyle}>Experience</span>
                  </div>
                  <div style={mainContentStyle}>
                    {experiences.map(renderExperience)}
                  </div>
                </div>
              )}
            </main>
          </div>
          {!hideActions && (
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              borderTop: `1px solid ${palette.divider}`
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
          )}
        </div>
      </div>
    );
  };
  const summaryContent = data.summary ? <p>{toText(data.summary)}</p> : null;
  const experiencesContent = formatExperiences();
  const projectsContent = formatProjects();
  const educationContent = formatEducation();

  const skillsContent = formatSkills();
  if (isAttorneyTemplate) {
    return renderAttorneyPreview();
  }
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
        
        {!hideActions && (
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
        )}
      </div>
    </div>
  );
};

export default StepPreview;












