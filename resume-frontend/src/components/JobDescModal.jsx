import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JobDescModal = ({ onClose, onJobDescriptionSubmit }) => {
  const [jobDescription, setJobDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      // Pass job description to parent component instead of URL
      onJobDescriptionSubmit(jobDescription);
      navigate('/builder');
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.25)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        width: '90%',
        maxWidth: '600px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#64748b'
          }}
          aria-label="Close modal"
        >×</button>
        
        <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
          Tell us about the job you're applying for
        </h2>
        
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          We'll use this information to tailor your resume and optimize your experience descriptions.
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            required
          />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Start Building Resume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobDescModal; 