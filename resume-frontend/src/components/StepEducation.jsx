import React from 'react';
import { useResume } from '../context/ResumeContext';

const StepEducation = () => {
  const { data, setData } = useResume();

  // Initialize education as an array if it doesn't exist
  React.useEffect(() => {
    if (!data.education || !Array.isArray(data.education) || data.education.length === 0) {
      setData({ ...data, education: [{
        degree: '',
        school: '',
        field: '',
        startMonth: '',
        startYear: '',
        graduationMonth: '',
        graduationYear: '',
        gpa: '',
        honors: '',
        location: ''
      }] });
    }
  }, []);

  const educationList = Array.isArray(data.education) ? data.education : [];

  const addEducation = () => {
    const newEducation = {
      degree: '',
      school: '',
      field: '',
      startMonth: '',
      startYear: '',
      graduationMonth: '',
      graduationYear: '',
      gpa: '',
      honors: '',
      location: ''
    };
    setData({ ...data, education: [...educationList, newEducation] });
  };

  const removeEducation = (idx) => {
    const newList = educationList.filter((_, i) => i !== idx);
    setData({ ...data, education: newList });
  };

  const updateEducation = (idx, field, value) => {
    const newList = [...educationList];
    newList[idx] = { ...newList[idx], [field]: value };
    setData({ ...data, education: newList });
  };

  // Common degree options
  const degreeOptions = [
    { value: '', label: 'Select a degree' },
    { value: 'High School Diploma', label: 'High School Diploma' },
    { value: 'Associate of Arts', label: 'Associate of Arts (AA)' },
    { value: 'Associate of Science', label: 'Associate of Science (AS)' },
    { value: 'Associate of Applied Science', label: 'Associate of Applied Science (AAS)' },
    { value: 'Bachelor of Arts', label: 'Bachelor of Arts (BA)' },
    { value: 'Bachelor of Science', label: 'Bachelor of Science (BS)' },
    { value: 'Bachelor of Business Administration', label: 'Bachelor of Business Administration (BBA)' },
    { value: 'Bachelor of Engineering', label: 'Bachelor of Engineering (BE)' },
    { value: 'Bachelor of Technology', label: 'Bachelor of Technology (BTech)' },
    { value: 'Master of Arts', label: 'Master of Arts (MA)' },
    { value: 'Master of Science', label: 'Master of Science (MS)' },
    { value: 'Master of Business Administration', label: 'Master of Business Administration (MBA)' },
    { value: 'Master of Engineering', label: 'Master of Engineering (ME)' },
    { value: 'Master of Technology', label: 'Master of Technology (MTech)' },
    { value: 'Doctor of Philosophy', label: 'Doctor of Philosophy (PhD)' },
    { value: 'Doctor of Medicine', label: 'Doctor of Medicine (MD)' },
    { value: 'Juris Doctor', label: 'Juris Doctor (JD)' },
    { value: 'Other', label: 'Other' }
  ];

  const monthOptions = [
    { value: '', label: 'Select month' },
    { value: 'January', label: 'January' },
    { value: 'February', label: 'February' },
    { value: 'March', label: 'March' },
    { value: 'April', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'June', label: 'June' },
    { value: 'July', label: 'July' },
    { value: 'August', label: 'August' },
    { value: 'September', label: 'September' },
    { value: 'October', label: 'October' },
    { value: 'November', label: 'November' },
    { value: 'December', label: 'December' },
  ];

  return (
    <div>
      <h2>Education</h2>
      
      {educationList.length === 0 && (
        <div style={{ 
          background: '#f3f4f6', 
          border: '1px solid #d1d5db', 
          borderRadius: '8px', 
          padding: '2rem', 
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            No education entries yet. Add your first education to get started.
          </p>
        </div>
      )}

      {educationList.map((edu, idx) => (
        <div key={idx} style={{ 
          marginBottom: '2rem', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1.5rem',
          position: 'relative'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#374151' }}>
            Education {idx + 1}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Degree */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                Degree *
              </label>
              <select
                value={edu.degree || ''}
                onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  background: 'white'
                }}
              >
                {degreeOptions.map((option, optionIdx) => (
                  <option key={optionIdx} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* School Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                School/University *
              </label>
              <input
                type="text"
                value={edu.school || ''}
                onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                placeholder="e.g., Stanford University"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {/* Field of Study / GPA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: '1 / -1' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Field of Study
                </label>
                <input
                  type="text"
                  value={edu.field || ''}
                  onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                  placeholder="e.g., Computer Science"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  GPA (Optional)
                </label>
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Start Month / Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: '1 / -1' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Start Month (optional)
                </label>
                <select
                  value={edu.startMonth || ''}
                  onChange={(e) => updateEducation(idx, 'startMonth', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Start Year
                </label>
                <input
                  type="number"
                  value={edu.startYear || ''}
                  onChange={(e) => updateEducation(idx, 'startYear', e.target.value)}
                  placeholder="e.g., 2019"
                  min="1900"
                  max="2030"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Graduation Month / Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: '1 / -1' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Graduation Month (optional)
                </label>
                <select
                  value={edu.graduationMonth || ''}
                  onChange={(e) => updateEducation(idx, 'graduationMonth', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={edu.graduationYear || ''}
                  onChange={(e) => updateEducation(idx, 'graduationYear', e.target.value)}
                  placeholder="e.g., 2023"
                  min="1900"
                  max="2030"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                Location
              </label>
              <input
                type="text"
                value={edu.location || ''}
                onChange={(e) => updateEducation(idx, 'location', e.target.value)}
                placeholder="e.g., Stanford, CA"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Honors/Awards - Full Width */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              Honors, Awards, or Additional Notes
            </label>
            <textarea
              rows="3"
              value={edu.honors || ''}
              onChange={(e) => updateEducation(idx, 'honors', e.target.value)}
              placeholder="e.g., Magna Cum Laude, Dean's List, Relevant coursework..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>



          {/* Remove Education Button */}
          {educationList.length > 1 && (
            <button
              type="button"
              onClick={() => removeEducation(idx)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#ef4444',
                padding: '0.25rem',
                borderRadius: '4px'
              }}
              title="Remove this education"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button 
        type="button" 
        onClick={addEducation}
        style={{
          padding: '0.75rem 1.5rem',
          border: '1px solid #2563eb',
          borderRadius: '6px',
          background: 'white',
          color: '#2563eb',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.95rem'
        }}
      >
        + Add Education
      </button>
    </div>
  );
};

export default StepEducation;
  
