import React from 'react';
import { useResume } from '../context/ResumeContext';

const StepFormat = () => {
  const { data, setData } = useResume();

  const formats = [
    {
      id: 'temp1',
      name: 'Classic Professional',
      preview: (
        <div style={{ width: '100%', height: '280px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', fontSize: '7px', lineHeight: '1.2', fontFamily: 'Calibri, Arial, sans-serif', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px', marginBottom: '3px', color: '#1f2937' }}>JOHN DOE</div>
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '6px', marginBottom: '6px' }}>john.doe@email.com • (555) 123-4567 • San Francisco, CA</div>
          
          {/* Summary */}
          <div style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '6px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>SUMMARY</div>
          <div style={{ color: '#374151', fontSize: '6px', marginBottom: '4px' }}>Senior software engineer with 5+ years experience building scalable web applications and leading development teams.</div>
          
          {/* Experience */}
          <div style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '6px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EXPERIENCE</div>
          <div style={{ color: '#374151', fontWeight: 'bold', fontSize: '6px' }}>Senior Software Engineer | TechCorp | San Francisco, CA | Jan 2022 - Present</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Led development of 3 major web applications serving 100K+ users</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Managed team of 5 developers and improved code quality by 40%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Implemented CI/CD pipeline reducing deployment time by 60%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Mentored 3 junior developers and established coding standards</div>
          
          <div style={{ color: '#374151', fontWeight: 'bold', fontSize: '6px', marginTop: '3px' }}>Software Developer | StartupXYZ | Austin, TX | Mar 2020 - Dec 2021</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Built full-stack applications using React, Node.js, and MongoDB</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Collaborated with UX team to improve user experience by 25%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Optimized database queries reducing load times by 35%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Participated in agile development with 2-week sprint cycles</div>
          
          <div style={{ color: '#374151', fontWeight: 'bold', fontSize: '6px', marginTop: '3px' }}>Junior Developer | Digital Solutions | Seattle, WA | Jun 2019 - Feb 2020</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Developed responsive web applications using JavaScript and CSS</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Fixed 50+ bugs and improved application stability</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Assisted in code reviews and documentation updates</div>
          
          {/* Skills */}
          <div style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '6px', marginTop: '3px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>SKILLS</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>JavaScript • React • Node.js • Python • AWS • Docker • Git • MongoDB • Express.js • TypeScript • Jest • CI/CD</div>
          
          {/* Education */}
          <div style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '6px', marginTop: '3px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EDUCATION</div>
          <div style={{ color: '#374151', fontWeight: 'bold', fontSize: '6px' }}>BS Computer Science | Stanford University | 2020</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>GPA: 3.8/4.0 • Dean's List • Computer Science Honor Society • Relevant Coursework: Data Structures, Algorithms, Database Systems</div>
        </div>
      )
    },
    {
      id: 'industry-manager',
      name: 'Executive Professional',
      preview: (
        <div style={{ width: '100%', height: '280px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', fontSize: '7px', lineHeight: '1.2', fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px', marginBottom: '3px', color: '#2c3e50' }}>SARAH JOHNSON</div>
          <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '6px', marginBottom: '6px' }}>sarah.johnson@email.com • (555) 987-6543 • Chicago, IL</div>
          
          {/* Summary with thick line */}
          <div style={{ borderBottom: '2px solid #34495e', marginBottom: '4px' }}></div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>SUMMARY</div>
          <div style={{ color: '#374151', fontSize: '6px', marginBottom: '4px' }}>Strategic business leader with 12+ years of experience driving operational excellence and managing multi-million dollar portfolios.</div>
          
          {/* Experience with thick line */}
          <div style={{ borderBottom: '2px solid #34495e', marginBottom: '4px' }}></div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EXPERIENCE</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px' }}>Senior Operations Director | Fortune 500 Corp | Chicago, IL | Jan 2021 - Present</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Led strategic initiatives resulting in 25% revenue growth and 15% cost reduction</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Managed cross-functional team of 50+ employees across 3 departments</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Implemented new processes improving efficiency by 30%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Established KPIs and reporting systems for executive leadership</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Negotiated vendor contracts saving $2M annually</div>
          
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px', marginTop: '3px' }}>Operations Manager | Global Industries | Chicago, IL | Mar 2018 - Dec 2020</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Oversaw daily operations for $50M business unit</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Developed and executed strategic plans achieving 20% growth targets</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Managed budget of $15M and delivered projects on time and under budget</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Led process improvement initiatives reducing waste by 25%</div>
          
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px', marginTop: '3px' }}>Business Analyst | Enterprise Solutions | Chicago, IL | Jun 2016 - Feb 2018</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Analyzed business processes and identified improvement opportunities</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Created detailed reports and presentations for senior management</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Collaborated with IT teams to implement system enhancements</div>
          
          {/* Education with thick line */}
          <div style={{ borderBottom: '2px solid #34495e', marginTop: '3px', marginBottom: '4px' }}></div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px', marginBottom: '2px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EDUCATION</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '6px' }}>Master of Business Administration | Northwestern University | 2018</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>GPA: 3.9/4.0 • Dean's List • Beta Gamma Sigma Honor Society</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>Bachelor of Science in Business Management | University of Illinois | 2015</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>GPA: 3.7/4.0 • Magna Cum Laude • Business Honor Society</div>
        </div>
      )
    },
    {
      id: 'modern',
      name: 'Contemporary Tech',
      preview: (
        <div style={{ width: '100%', height: '280px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', fontSize: '7px', lineHeight: '1.2', fontFamily: 'Segoe UI, sans-serif', overflow: 'hidden' }}>
          {/* Header with blue accent */}
          <div style={{ borderBottom: '3px solid #3498db', paddingBottom: '4px', marginBottom: '4px' }}>
            <div style={{ fontWeight: '600', fontSize: '10px', marginBottom: '2px', color: '#2c3e50' }}>ALEX CHEN</div>
            <div style={{ color: '#7f8c8d', fontSize: '6px' }}>alex.chen@email.com • (555) 456-7890 • San Francisco, CA</div>
          </div>
          
          {/* Summary */}
          <div style={{ color: '#3498db', fontWeight: '600', fontSize: '6px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>SUMMARY</div>
          <div style={{ color: '#374151', fontSize: '6px', marginBottom: '4px' }}>Innovative full-stack developer with 4+ years building scalable applications and leading technical initiatives.</div>
          
          {/* Experience */}
          <div style={{ color: '#3498db', fontWeight: '600', fontSize: '6px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EXPERIENCE</div>
          <div style={{ color: '#2c3e50', fontWeight: '600', fontSize: '6px' }}>Senior Full-Stack Developer | TechStartup Inc. | San Francisco, CA | Jun 2022 - Present</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Architected and deployed microservices serving 500K+ daily users</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Led migration to cloud infrastructure reducing costs by 40%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Mentored 3 junior developers and established coding standards</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Implemented automated testing achieving 90% code coverage</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Optimized database queries improving performance by 60%</div>
          
          <div style={{ color: '#2c3e50', fontWeight: '600', fontSize: '6px', marginTop: '3px' }}>Software Engineer | Digital Solutions | Austin, TX | Jan 2021 - May 2022</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Developed React applications with 99.9% uptime</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Implemented CI/CD pipeline reducing deployment time by 70%</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Built RESTful APIs using Node.js and Express.js</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Collaborated with design team to implement responsive UI components</div>
          
          <div style={{ color: '#2c3e50', fontWeight: '600', fontSize: '6px', marginTop: '3px' }}>Frontend Developer | WebTech Solutions | Austin, TX | Aug 2020 - Dec 2020</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Built responsive web applications using React and TypeScript</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px', marginBottom: '2px' }}>• Implemented state management using Redux and Context API</div>
          <div style={{ color: '#374151', fontSize: '6px', marginLeft: '4px' }}>• Participated in code reviews and agile development processes</div>
          
          {/* Skills */}
          <div style={{ color: '#3498db', fontWeight: '600', fontSize: '6px', marginTop: '3px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>TECHNICAL SKILLS</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>React • Node.js • TypeScript • AWS • Docker • MongoDB • GraphQL • Jest • Express.js • Redux • PostgreSQL • Redis</div>
          
          {/* Education */}
          <div style={{ color: '#3498db', fontWeight: '600', fontSize: '6px', marginTop: '3px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', paddingBottom: '1px', textAlign: 'left' }}>EDUCATION</div>
          <div style={{ color: '#2c3e50', fontWeight: '600', fontSize: '6px' }}>Bachelor of Science in Computer Science | University of Texas | 2021</div>
          <div style={{ color: '#374151', fontSize: '6px' }}>GPA: 3.9/4.0 • Computer Science Honor Society • Dean's List • Relevant Coursework: Software Engineering, Database Systems, Web Development</div>
        </div>
      )
    }
  ];

  const handleFormatSelect = (formatId) => {
    setData({ ...data, selectedFormat: formatId });
  };

  return (
    <div>
      <h2>Choose Resume Format</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Select a format that best represents your professional style and industry.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {formats.map((format) => (
          <div
            key={format.id}
            onClick={() => handleFormatSelect(format.id)}
            style={{
              border: data.selectedFormat === format.id ? '3px solid #2563eb' : '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '0.5rem',
              cursor: 'pointer',
              background: data.selectedFormat === format.id ? '#f0f9ff' : 'white',
              transition: 'all 0.2s ease',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {data.selectedFormat === format.id && (
              <div style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                zIndex: 10
              }}>
                ✓
              </div>
            )}
            
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '0.5rem',
              border: '1px solid #e5e7eb',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {format.preview}
            </div>
          </div>
        ))}
      </div>

      {data.selectedFormat && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '0.75rem',
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
            ✅ Template selected and ready to use
          </p>
        </div>
      )}
    </div>
  );
};

export default StepFormat; 