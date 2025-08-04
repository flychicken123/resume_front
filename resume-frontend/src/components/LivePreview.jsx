import React from 'react';
import { useResume } from '../context/ResumeContext';

const LivePreview = ({ isVisible, onToggle }) => {
  const { data } = useResume();

  if (!isVisible) {
    return null;
  }

  const getFormatStyles = (format) => {
    switch (format) {
      case 'temp1':
        return {
          container: { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '9px', 
            lineHeight: '1.2',
            padding: '10px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          },
          header: { 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '8px',
            textAlign: 'center'
          },
          section: { 
            marginBottom: '12px'
          },
          sectionTitle: { 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          },
          contact: { 
            fontSize: '8px', 
            color: '#6b7280', 
            marginBottom: '8px',
            textAlign: 'center'
          },
          item: { marginBottom: '5px' },
          company: { fontWeight: 'bold', color: '#1f2937', fontSize: '9px' },
          date: { color: '#6b7280', fontSize: '8px' },
          bullet: { marginLeft: '12px', marginBottom: '2px', fontSize: '8px' },
          summary: { fontSize: '8px', lineHeight: '1.2' },
          skills: { fontSize: '8px', lineHeight: '1.2' }
        };
      case 'industry-manager':
        return {
          container: { 
            fontFamily: 'Georgia, serif', 
            fontSize: '9px', 
            lineHeight: '1.3',
            padding: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          },
          header: { 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1a1a1a', 
            marginBottom: '8px', 
            textAlign: 'center' 
          },
          section: { marginBottom: '16px' },
          sectionTitle: { 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#2c3e50', 
            borderBottom: '2px solid #34495e', 
            paddingBottom: '3px', 
            marginBottom: '8px', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          },
          contact: { 
            fontSize: '9px', 
            color: '#7f8c8d', 
            marginBottom: '10px',
            textAlign: 'center'
          },
          item: { marginBottom: '8px' },
          company: { fontWeight: 'bold', color: '#2c3e50', fontSize: '10px' },
          date: { color: '#7f8c8d', fontSize: '9px' },
          bullet: { marginLeft: '15px', marginBottom: '3px', fontSize: '9px' },
          summary: { fontSize: '9px', lineHeight: '1.3' },
          skills: { fontSize: '9px', lineHeight: '1.3' }
        };
      case 'modern':
        return {
          container: { 
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', 
            fontSize: '9px', 
            lineHeight: '1.4',
            padding: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          },
          header: { 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#2c3e50', 
            marginBottom: '8px',
            textAlign: 'left',
            borderBottom: '3px solid #3498db',
            paddingBottom: '8px'
          },
          section: { 
            marginBottom: '16px'
          },
          sectionTitle: { 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#3498db', 
            borderBottom: '1px solid #bdc3c7', 
            paddingBottom: '3px', 
            marginBottom: '8px', 
            textTransform: 'uppercase',
            letterSpacing: '1px'
          },
          contact: { 
            fontSize: '9px', 
            color: '#7f8c8d', 
            marginBottom: '8px',
            textAlign: 'left'
          },
          item: { marginBottom: '8px' },
          company: { fontWeight: '600', color: '#2c3e50', fontSize: '10px' },
          date: { color: '#7f8c8d', fontSize: '9px' },
          bullet: { marginLeft: '15px', marginBottom: '3px', fontSize: '9px' },
          summary: { fontSize: '9px', lineHeight: '1.5' },
          skills: { fontSize: '9px', lineHeight: '1.5' }
        };
      default:
        return {
          container: { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '9px', 
            lineHeight: '1.2',
            padding: '10px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          },
          header: { 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '8px',
            textAlign: 'center'
          },
          section: { 
            marginBottom: '12px'
          },
          sectionTitle: { 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          },
          contact: { 
            fontSize: '8px', 
            color: '#6b7280', 
            marginBottom: '8px',
            textAlign: 'center'
          },
          item: { marginBottom: '5px' },
          company: { fontWeight: 'bold', color: '#1f2937', fontSize: '9px' },
          date: { color: '#6b7280', fontSize: '8px' },
          bullet: { marginLeft: '12px', marginBottom: '2px', fontSize: '8px' },
          summary: { fontSize: '8px', lineHeight: '1.2' },
          skills: { fontSize: '8px', lineHeight: '1.2' }
        };
    }
  };

  const styles = getFormatStyles(data.selectedFormat || 'temp1');

  return (
    <div style={{
      width: '100%',
      height: '100%',
      ...styles.container
    }}>
      {/* Header */}
      {data.name && (
        <div style={styles.header}>
          {data.name}
        </div>
      )}

      {/* Contact Info */}
      {(data.email || data.phone) && (
        <div style={styles.contact}>
          {data.email && <div>{data.email}</div>}
          {data.phone && <div>{data.phone}</div>}
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SUMMARY</div>
          <div style={styles.summary}>
            {data.summary}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experiences && data.experiences.length > 0 && data.experiences[0] && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>EXPERIENCE</div>
          {data.experiences.map((exp, idx) => {
            // Handle both structured objects and legacy strings
            if (typeof exp === 'string') {
              // Legacy string format - parse the string to extract actual information
              const lines = exp.split('\n');
              const headerLine = lines[0] || '';
              const descriptionLines = lines.slice(1);
              
              // Try to parse header for job title, company, location, dates
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
              // New structured object format
              const location = exp.city && exp.state ? `${exp.city}, ${exp.state}` : exp.city || exp.state || '';
              
              // Format dates properly
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
                    {exp.jobTitle || 'Job Title'}
                  </div>
                  <div style={styles.date}>
                    {exp.company || 'Company'} {location && `• ${location}`} {dates && `• ${dates}`}
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
          })}
        </div>
      )}

      {/* Education */}
      {data.education && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>EDUCATION</div>
          {Array.isArray(data.education) ? (
            data.education.map((edu, idx) => (
              <div key={idx} style={styles.item}>
                <div style={styles.company}>
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </div>
                <div style={styles.date}>
                  {edu.school} {edu.graduationYear && `• ${edu.graduationYear}`}
                </div>
                {edu.gpa && (
                  <div style={{ fontSize: '10px', color: '#7f8c8d' }}>
                    GPA: {edu.gpa}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={styles.item}>
              <div style={styles.company}>Degree</div>
              <div style={styles.date}>University • Year</div>
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {data.skills && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SKILLS</div>
          <div style={styles.skills}>
            {data.skills}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePreview; 