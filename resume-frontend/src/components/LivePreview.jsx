import React, { useState, useEffect, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import './LivePreview.css';

const LivePreview = ({ isVisible = true, onToggle, onDownload }) => {
  const { data } = useResume();
  const [pages, setPages] = useState([]);
  const contentRef = useRef(null);

  // Page dimensions in pixels (8.5" x 11" at 96 DPI)
  const PAGE_HEIGHT = 1056;
  const PAGE_WIDTH = 816;
  const CONTENT_MARGIN = 20; // Reduced from 40 - less margin means more space for content
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - (CONTENT_MARGIN * 2);

  // Estimate height for different content types (more realistic estimates)
  const estimateSectionHeight = (content, type) => {
    if (!content) return 0;
    
    switch (type) {
      case 'header':
        return 40; // More realistic header height
        
      case 'summary':
        // More realistic line estimation
        const lines = Math.ceil(content.length / 100); // More realistic chars per line
        const summaryHeight = Math.max(20, lines * 16); // More realistic line height
        return summaryHeight;
        
      case 'experience':
        if (Array.isArray(content)) {
          const totalHeight = content.reduce((total, exp) => {
            let height = 35; // Realistic job header height
            if (exp.description) {
              const descLines = Math.ceil(exp.description.length / 90); // Realistic chars per line
              height += descLines * 16; // Realistic line height
            }
            return total + height + 8; // Realistic spacing between jobs
          }, 0);
          return totalHeight;
        }
        return 40;
        
      case 'education':
        if (Array.isArray(content)) {
          const eduHeight = content.length * 30; // More realistic per education item
          return eduHeight;
        }
        return 30;
        
      case 'skills':
        // More realistic skills section estimation
        const skillLines = Math.ceil(content.length / 120); // More realistic chars per line
        const skillsHeight = Math.max(20, skillLines * 16); // More realistic
        return skillsHeight;
        
      default:
        return 20;
    }
  };

  // Split content into pages based on estimated heights
  const splitContentIntoPages = () => {
    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;
    
    // Helper function to add section to current page
    const addToCurrentPage = (section) => {
      currentPage.push(section);
      currentHeight += section.estimatedHeight;
    };
    
    // Helper function to start new page
    const startNewPage = () => {
      if (currentPage.length > 0) {
        newPages.push([...currentPage]);
      }
      currentPage = [];
      currentHeight = 0;
    };

    // Helper function to check if content can fit on current page
    const canFitOnCurrentPage = (contentHeight) => {
      return (currentHeight + contentHeight) <= AVAILABLE_HEIGHT;
    };

    // Helper function to split long content across pages
    const splitLongContent = (content, type, maxHeight) => {
      if (type === 'summary') {
        // Split summary more aggressively - try sentences first, then words if needed
        let sentences = content.split('. ');
        
        // If there are very few sentences, split on other punctuation too
        if (sentences.length <= 2) {
          sentences = content.split(/[.!?;]\s+/);
        }
        
        // If still very few parts, split on commas or by word count
        if (sentences.length <= 2) {
          const words = content.split(' ');
          const wordsPerPart = Math.ceil(words.length / 3); // Force at least 3 parts
          sentences = [];
          for (let i = 0; i < words.length; i += wordsPerPart) {
            sentences.push(words.slice(i, i + wordsPerPart).join(' '));
          }
        }
        
        const parts = [];
        let currentPart = '';
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i];
          const connector = currentPart ? '. ' : '';
          const testPart = currentPart + connector + sentence;
          const testHeight = estimateSectionHeight(testPart, type);
          
          // More aggressive - allow up to 80% of max height to ensure splitting
          if (testHeight > maxHeight * 0.8 && currentPart) {
            // Current part is full, start new part
            parts.push(currentPart);
            currentPart = sentence;
          } else {
            currentPart = testPart;
          }
        }
        
        if (currentPart) {
          parts.push(currentPart);
        }
        
        // Force at least 2 parts if content is long enough
        if (parts.length === 1 && content.length > 200) {
          const midPoint = Math.floor(content.length / 2);
          const splitPoint = content.lastIndexOf(' ', midPoint);
          if (splitPoint > 0) {
            return [content.substring(0, splitPoint), content.substring(splitPoint + 1)];
          }
        }
        
        return parts;
      }
      
      if (type === 'experience' && Array.isArray(content)) {
        // Split experience array by individual jobs
        const parts = [];
        let currentPart = [];
        let currentHeight = 0;
        
        for (const exp of content) {
          const expHeight = estimateSectionHeight([exp], 'experience');
          
          // Check if adding this experience would exceed max height
          if (currentHeight + expHeight > maxHeight * 0.95 && currentPart.length > 0) {
            // Current part is full, start new part
            parts.push([...currentPart]);
            currentPart = [exp];
            currentHeight = expHeight;
          } else {
            // Add to current part
            currentPart.push(exp);
            currentHeight += expHeight;
          }
        }
        
        if (currentPart.length > 0) {
          parts.push(currentPart);
        }
        
        return parts.length > 1 ? parts : [content];
      }
      
      // For other types, return as is
      return [content];
    };

    // Create all sections first
    const allSections = [];
    
    // Header section
    if (data.name || data.email || data.phone) {
      const headerHeight = estimateSectionHeight(data.name, 'header');
      allSections.push({
        type: 'header',
        content: { name: data.name, email: data.email, phone: data.phone },
        estimatedHeight: headerHeight,
        priority: 1 // Must be on first page
      });
    }

    // Summary section
    if (data.summary) {
      const summaryHeight = estimateSectionHeight(data.summary, 'summary');
      allSections.push({
        type: 'summary',
        content: data.summary,
        estimatedHeight: summaryHeight,
        priority: 2,
        canSplit: true
      });
    }

    // Experience section
    if (data.experiences && data.experiences.length > 0) {
      const totalExpHeight = estimateSectionHeight(data.experiences, 'experience');
      allSections.push({
        type: 'experience',
        content: data.experiences,
        estimatedHeight: totalExpHeight,
        priority: 3,
        canSplit: true  // Allow experience section to be split across pages
      });
    }

    // Education section
    if (data.education) {
      const eduHeight = estimateSectionHeight(data.education, 'education');
      allSections.push({
        type: 'education',
        content: data.education,
        estimatedHeight: eduHeight,
        priority: 4
      });
    }

    // Skills section
    if (data.skills) {
      const skillsHeight = estimateSectionHeight(data.skills, 'skills');
      allSections.push({
        type: 'skills',
        content: data.skills,
        estimatedHeight: skillsHeight,
        priority: 5
      });
    }

    // Now pack sections into pages aggressively
    let sectionIndex = 0;
    
    while (sectionIndex < allSections.length) {
      const section = allSections[sectionIndex];
      
      if (canFitOnCurrentPage(section.estimatedHeight)) {
        // Section fits completely on current page
        addToCurrentPage(section);
        sectionIndex++;
      } else if (section.canSplit && currentHeight < AVAILABLE_HEIGHT * 0.9) {
        // Try to split the section if there's reasonable space left
        const remainingHeight = AVAILABLE_HEIGHT - currentHeight;
        const parts = splitLongContent(section.content, section.type, remainingHeight - 5);
        
        if (parts.length > 1) {
          // Add first part to current page
          const firstPartHeight = estimateSectionHeight(parts[0], section.type);
          addToCurrentPage({
            ...section,
            content: parts[0],
            estimatedHeight: firstPartHeight,
            isContinued: true
          });
          
          // Start new page for remaining parts
          startNewPage();
          
          // Add remaining parts
          for (let i = 1; i < parts.length; i++) {
            const partHeight = estimateSectionHeight(parts[i], section.type);
            const isLast = i === parts.length - 1;
            
            if (canFitOnCurrentPage(partHeight)) {
              addToCurrentPage({
                ...section,
                content: parts[i],
                estimatedHeight: partHeight,
                isContinuation: true,
                isContinued: !isLast
              });
            } else {
              startNewPage();
              addToCurrentPage({
                ...section,
                content: parts[i],
                estimatedHeight: partHeight,
                isContinuation: true,
                isContinued: !isLast
              });
            }
          }
          
          sectionIndex++;
        } else {
          // Can't split effectively, move to new page
          startNewPage();
          addToCurrentPage(section);
          sectionIndex++;
        }
      } else {
        // Section doesn't fit, start new page
        startNewPage();
        
        // Try to fit it on the new page
        if (canFitOnCurrentPage(section.estimatedHeight)) {
          addToCurrentPage(section);
          sectionIndex++;
        } else {
          // Section is too large even for a new page, add it anyway
          addToCurrentPage(section);
          sectionIndex++;
        }
      }
    }

    // Add the last page if it has content
    if (currentPage.length > 0) {
      newPages.push([...currentPage]);
    }

    return newPages;
  };

  // Recalculate pages when data changes
  useEffect(() => {
    const newPages = splitContentIntoPages();
    setPages(newPages);
  }, [data]);

  if (!isVisible) {
    return null;
  }

  // Format styles copied exactly from StepFormat.jsx templates - scaled up for live preview
  const getFormatStyles = (format) => {
    const scaleFactor = 2; // Scale up from StepFormat's 6-10px to 12-20px for readability
    
    switch (format) {
      case 'temp1':
        // Classic Professional - exactly like StepFormat temp1
        return {
          container: { 
            fontFamily: 'Calibri, Arial, sans-serif', 
            fontSize: `${7 * scaleFactor}px`, 
            lineHeight: '1.2',
            padding: `${8 * scaleFactor}px`,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible' // Changed from 'hidden' for full preview
          },
          header: { 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: `${10 * scaleFactor}px`, 
            marginBottom: `${3 * scaleFactor}px`, 
            color: '#1f2937'
          },
          contact: { 
            textAlign: 'center', 
            color: '#6b7280', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${6 * scaleFactor}px`
          },
          sectionTitle: { 
            color: '#1f2937', 
            fontWeight: 'bold', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`, 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1 * scaleFactor}px`, 
            textAlign: 'left'
          },
          company: { 
            color: '#374151', 
            fontWeight: 'bold', 
            fontSize: `${6 * scaleFactor}px`
          },
          bullet: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginLeft: `${4 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`
          },
          summary: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          skills: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`
          },
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      
      case 'industry-manager':
        // Executive Professional - exactly like StepFormat industry-manager
        return {
          container: { 
            fontFamily: 'Georgia, serif', 
            fontSize: `${7 * scaleFactor}px`, 
            lineHeight: '1.2',
            padding: `${8 * scaleFactor}px`,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible'
          },
          header: { 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: `${10 * scaleFactor}px`, 
            marginBottom: `${3 * scaleFactor}px`, 
            color: '#2c3e50'
          },
          contact: { 
            textAlign: 'center', 
            color: '#7f8c8d', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${6 * scaleFactor}px`
          },
          sectionTitle: { 
            color: '#2c3e50', 
            fontWeight: 'bold', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`, 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1 * scaleFactor}px`, 
            textAlign: 'left'
          },
          thickLine: {
            borderBottom: '2px solid #34495e', 
            marginBottom: `${4 * scaleFactor}px`
          },
          company: { 
            color: '#2c3e50', 
            fontWeight: 'bold', 
            fontSize: `${6 * scaleFactor}px`
          },
          bullet: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginLeft: `${4 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`
          },
          summary: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          skills: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`
          },
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      
      case 'modern':
        // Contemporary Tech - exactly like StepFormat modern
        return {
          container: { 
            fontFamily: 'Segoe UI, sans-serif', 
            fontSize: `${7 * scaleFactor}px`, 
            lineHeight: '1.2',
            padding: `${8 * scaleFactor}px`,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible'
          },
          headerContainer: {
            borderBottom: '3px solid #3498db', 
            paddingBottom: `${4 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          header: { 
            fontWeight: '600', 
            fontSize: `${10 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`, 
            color: '#2c3e50',
            textAlign: 'center'
          },
          contact: { 
            color: '#7f8c8d', 
            fontSize: `${6 * scaleFactor}px`,
            textAlign: 'center'
          },
          sectionTitle: { 
            color: '#3498db', 
            fontWeight: '600', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`, 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1 * scaleFactor}px`, 
            textAlign: 'left'
          },
          company: { 
            color: '#2c3e50', 
            fontWeight: '600', 
            fontSize: `${6 * scaleFactor}px`
          },
          bullet: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginLeft: `${4 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`
          },
          summary: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          skills: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`
          },
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      
             default:
         // Default to Classic Professional
         return getFormatStyles('temp1');
    }
  };

  // Render experience items
  const renderExperiences = (experiences, styles) => {
    if (!experiences || experiences.length === 0) return null;

    return experiences.map((exp, idx) => {
      if (typeof exp === 'string') {
        const lines = exp.split('\n');
        const headerLine = lines[0] || '';
        const descriptionLines = lines.slice(1);
        
        const headerParts = headerLine.split('|').map(part => part.trim());
        const jobTitle = headerParts[0] || 'Job Title';
        const company = headerParts[1] || 'Company';
        const location = headerParts[2] || '';
        const dates = headerParts[3] || '';
        
        return (
          <div key={idx} style={styles.item}>
            <div style={styles.company}>{jobTitle}</div>
            <div style={styles.date}>
              {company} {location && `• ${location}`} {dates && `• ${dates}`}
            </div>
            <div style={{ marginTop: '2px' }}>
              {descriptionLines.map((line, lineIdx) => (
                line.trim() && (
                  <div key={lineIdx} style={styles.bullet}>
                    • {line.trim()}
                  </div>
                )
              ))}
            </div>
          </div>
        );
      } else {
        const location = exp.city && exp.state ? `${exp.city}, ${exp.state}` : exp.city || exp.state || '';
        
        let startDate = '';
        let endDate = '';
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          startDate = start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
        if (exp.endDate && !exp.currentlyWorking) {
          const end = new Date(exp.endDate);
          endDate = end.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
        const dates = startDate && endDate ? `${startDate} - ${endDate}` : 
                     startDate && exp.currentlyWorking ? `${startDate} - Present` :
                     startDate ? startDate : '';
        
        return (
          <div key={idx} style={styles.item}>
            <div style={styles.company}>
              {exp.jobTitle || 'Job Title'} | {exp.company || 'Company'} {location && `• ${location}`} {dates && `• ${dates}`}
            </div>
            {exp.description && (
              <div style={{ marginTop: '2px' }}>
                {exp.description.split('\n').map((line, lineIdx) => (
                  line.trim() && (
                    <div key={lineIdx} style={styles.bullet}>
                      • {line.trim()}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        );
      }
    });
  };

  // Render education items
  const renderEducation = (education, styles) => {
    if (!education) return null;

    if (Array.isArray(education)) {
      return education.map((edu, idx) => (
        <div key={idx} style={styles.item}>
          <div style={styles.company}>
            {edu.degree} {edu.field && `in ${edu.field}`} | {edu.school} | {edu.graduationYear}
          </div>
          {edu.gpa && (
            <div style={styles.date}>
              GPA: {edu.gpa}
            </div>
          )}
        </div>
      ));
    } else {
      return (
        <div style={styles.item}>
          <div style={styles.company}>Degree</div>
          <div style={styles.date}>University • Year</div>
        </div>
      );
    }
  };

  // Render a single section
  const renderSection = (title, content, styles) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return null;
    }

    return (
      <div>
        {/* Add thick line for industry-manager template */}
        {data.selectedFormat === 'industry-manager' && styles.thickLine && (
          <div style={styles.thickLine}></div>
        )}
        <div style={styles.sectionTitle}>{title}</div>
        {content}
      </div>
    );
  };

  // Render page content based on section type
  const renderPageContent = (pageSections, styles) => {
    return pageSections.map((section, idx) => {
      switch (section.type) {
        case 'header':
          return (
            <div key={idx}>
              {(data.selectedFormat === 'modern') ? (
                <div style={styles.headerContainer}>
                  {section.content.name && (
                    <div style={styles.header}>
                      {section.content.name}
                    </div>
                  )}
                  {(section.content.email || section.content.phone) && (
                    <div style={styles.contact}>
                      {[section.content.email, section.content.phone].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {section.content.name && (
                    <div style={styles.header}>
                      {section.content.name}
                    </div>
                  )}
                  {(section.content.email || section.content.phone) && (
                    <div style={styles.contact}>
                      {[section.content.email, section.content.phone].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        case 'summary':
          let summaryTitle = 'SUMMARY';
          if (section.isContinuation && !section.isContinued) {
            summaryTitle = 'SUMMARY (continued)';
          } else if (section.isContinuation) {
            summaryTitle = 'SUMMARY (continued)';
          } else if (section.isContinued) {
            summaryTitle = 'SUMMARY';
          }
          
          return renderSection(summaryTitle, <div style={styles.summary}>{section.content}</div>, styles);
        case 'experience':
          return renderSection('EXPERIENCE', renderExperiences(section.content, styles), styles);
        case 'education':
          return renderSection('EDUCATION', renderEducation(section.content, styles), styles);
        case 'skills':
          return renderSection('SKILLS', <div style={styles.skills}>{section.content}</div>, styles);
        default:
          return null;
      }
    });
  };

  const styles = getFormatStyles(data.selectedFormat || 'temp1');

  // Determine if we should show multiple pages
  const shouldShowMultiPage = pages.length > 1;

  return (
    <div className="live-preview-container">
      {/* Download PDF Button */}
      {onDownload && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '15px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={onDownload}
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            📄 Download PDF
          </button>
        </div>
      )}

      {/* Single Page View */}
      {!shouldShowMultiPage && (
        <div
          ref={contentRef}
          className="single-page-container"
          style={styles.container}
        >
          {/* Resume Content */}
          <div style={{ height: 'auto', overflow: 'visible' }}>
            {/* Header - handle modern template's special container */}
            {(data.selectedFormat === 'modern') ? (
              <div style={styles.headerContainer}>
                {data.name && (
                  <div style={styles.header}>
                    {data.name}
                  </div>
                )}
                {(data.email || data.phone) && (
                  <div style={styles.contact}>
                    {[data.email, data.phone].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
            ) : (
              <>
                {data.name && (
                  <div style={styles.header}>
                    {data.name}
                  </div>
                )}
                {(data.email || data.phone) && (
                  <div style={styles.contact}>
                    {[data.email, data.phone].filter(Boolean).join(' • ')}
                  </div>
                )}
              </>
            )}

            {data.summary && (
              renderSection('SUMMARY', <div style={styles.summary}>{data.summary}</div>, styles)
            )}

            {data.experiences && data.experiences.length > 0 && (
              renderSection('EXPERIENCE', renderExperiences(data.experiences, styles), styles)
            )}

            {data.education && (
              renderSection('EDUCATION', renderEducation(data.education, styles), styles)
            )}

            {data.skills && (
              renderSection('SKILLS', <div style={styles.skills}>{data.skills}</div>, styles)
            )}
          </div>
        </div>
      )}

      {/* Multi-Page View - Dynamic Content Splitting */}
      {shouldShowMultiPage && (
        <div className="multi-page-container">
          {pages.map((pageSections, pageIndex) => (
            <div key={pageIndex} className="page-wrapper" style={styles.container}>
              {/* Page Content - Rendered based on section types */}
              <div className="page-content">
                {renderPageContent(pageSections, styles)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LivePreview; 