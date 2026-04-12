import React, { useState } from 'react';

const JobDescModal = ({ onClose, onJobDescriptionSubmit, onProceed }) => {
  const [jobDescription, setJobDescription] = useState('');

  const proceed = () => {
    if (typeof onProceed === 'function') onProceed();
  };

  const handleSubmitWithJobDesc = (e) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      onJobDescriptionSubmit(jobDescription);
      onClose();
      proceed();
    } else {
      alert('Please enter a job description to use AI optimization features.');
    }
  };

  const handleSubmitWithoutJobDesc = () => {
    onClose();
    proceed();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '500px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f3f4f6'} onMouseLeave={(e) => e.target.style.background = 'transparent'} aria-label="Close modal">×</button>
        <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.5rem', fontWeight: 600 }}>Build Your Resume</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Choose how you'd like to build your resume:</p>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Job Description (Optional)</label>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here to enable AI optimization..." style={{ width: '100%', minHeight: '120px', maxHeight: '200px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0 }}>💡 With a job description, you'll get AI-powered optimization of your experience descriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button type="button" onClick={handleSubmitWithoutJobDesc} style={{ padding: '0.875rem 1.5rem', border: '2px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease', minWidth: '160px' }}>🚀 Build Without Job Description</button>
          <button type="button" onClick={handleSubmitWithJobDesc} style={{ padding: '0.875rem 1.5rem', border: 'none', borderRadius: '8px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease', minWidth: '160px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}>🤖 Build with AI Optimization</button>
        </div>
      </div>
    </div>
  );
};

export default JobDescModal; 