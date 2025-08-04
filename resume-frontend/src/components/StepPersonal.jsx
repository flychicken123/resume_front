import React from 'react';
import { useResume } from '../context/ResumeContext';

const StepPersonal = () => {
  const { data, setData } = useResume();



  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div>
      <h2>Personal Information</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Let's start with your basic information. This will appear at the top of your resume.
      </p>
      
      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., John Smith"
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
            Email Address *
          </label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="e.g., john.smith@email.com"
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
            Phone Number
          </label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="e.g., (555) 123-4567"
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
            Professional Summary
          </label>
          <textarea
            value={data.summary || ''}
            onChange={(e) => handleChange('summary', e.target.value)}
            placeholder="Write a brief professional summary that highlights your key strengths and career objectives..."
            rows="4"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem',
              resize: 'vertical'
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            This summary will appear at the top of your resume to give recruiters a quick overview of your background.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepPersonal;