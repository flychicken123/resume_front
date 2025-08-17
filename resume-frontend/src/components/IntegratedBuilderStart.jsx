import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const IntegratedBuilderStart = ({ onClose }) => {
  const navigate = useNavigate();
  const { applyImportedData } = useResume();
  
  const [step, setStep] = useState(1); // 1: job description (optional), 2: resume import choice
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Continue to step 2 (save job description if provided)
  const handleJobDescriptionNext = () => {
    if (jobDescription.trim()) {
      localStorage.setItem('jobDescription', jobDescription.trim());
    }
    setStep(2);
  };

  // Handle import resume choice
  const handleImportResume = async () => {
    if (!file) {
      setError('Please select a resume file to import');
      return;
    }
    
    setError('');
    
    try {
      setIsLoading(true);
      await handleResumeUpload();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUpload = async () => {
    const form = new FormData();
    form.append('resume', file);
    
    const resp = await fetch(`${getAPIBaseURL()}/api/resume/parse`, {
      method: 'POST',
      body: form,
    });
    
    const text = await resp.text();
    let json = null;
    try { 
      json = JSON.parse(text); 
    } catch (e) {
      throw new Error('Failed to parse server response');
    }
    
    if (!resp.ok || !json) {
      throw new Error(json?.error || `Parse failed (${resp.status})`);
    }
    
    // Handle structured response
    if (json.structured) {
      console.log('Resume parsed successfully with method:', json.method);
      applyImportedData(json.structured);
      
      // Small delay to ensure state update
      setTimeout(() => {
        onClose();
        navigate('/builder');
      }, 100);
    } else {
      throw new Error('Could not extract usable data from resume');
    }
  };

  const handleStartManual = () => {
    if (jobDescription.trim()) {
      localStorage.setItem('jobDescription', jobDescription.trim());
    }
    onClose();
    navigate('/builder');
  };

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.4)', 
      zIndex: 210, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white', 
        borderRadius: 16, 
        padding: '2rem', 
        width: '92%', 
        maxWidth: 600, 
        position: 'relative', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close button */}
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
            color: '#6b7280',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          aria-label="Close"
        >
          ×
        </button>

        {step === 1 && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#1f2937' }}>
              🚀 Let's Build Your Resume
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Start by adding a job description if you have one. This is optional but helps our AI optimize your resume!
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500, 
                color: '#374151' 
              }}>
                Job Description (Optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to get AI-powered resume optimization... or leave empty to continue without it."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  maxHeight: '200px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5
                }}
              />
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#6b7280', 
                marginTop: '0.5rem', 
                marginBottom: 0 
              }}>
                💡 Our AI will analyze the job requirements and optimize your resume accordingly
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={handleJobDescriptionNext}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: 8,
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  marginRight: '0.5rem',
                  fontSize: '1.2rem'
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, color: '#1f2937' }}>
                📄 Choose Your Starting Point
              </h2>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <p style={{ color: '#6b7280', marginBottom: '2rem', textAlign: 'center' }}>
              Do you want to import an existing resume or start manually?
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {/* Import Resume Option */}
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '1.5rem',
                background: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📄</span>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>Import Resume</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                  Upload your existing resume and we'll extract all the information automatically.
                </p>
                
                <div style={{
                  border: file ? '2px solid #3b82f6' : '2px dashed #d1d5db',
                  borderRadius: 8,
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: file ? '#f0f9ff' : 'white',
                  transition: 'all 0.2s',
                  marginBottom: '1rem'
                }}>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="resume-upload"
                  />
                  <label 
                    htmlFor="resume-upload" 
                    style={{ 
                      cursor: 'pointer',
                      display: 'block'
                    }}
                  >
                    {file ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                        <div style={{ fontWeight: 500, color: '#3b82f6' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                          Click to change file
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                        <div style={{ fontWeight: 500, color: '#374151' }}>
                          Click to upload resume
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                          Supports PDF, DOCX, DOC, TXT
                        </div>
                      </>
                    )}
                  </label>
                </div>
                
                <button 
                  onClick={handleImportResume}
                  disabled={isLoading || !file}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: 8,
                    background: file ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    cursor: file ? 'pointer' : 'not-allowed',
                    fontWeight: 500
                  }}
                >
                  {isLoading ? 'Importing...' : 'Import Resume'}
                </button>
              </div>

              {/* Start Manually Option */}
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '1.5rem',
                background: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✨</span>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>Start Manually</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
                  Build your resume from scratch using our guided builder.
                </p>
                
                <button 
                  onClick={handleStartManual}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {isLoading ? 'Starting...' : 'Start Building'}
                </button>
              </div>
            </div>

            {/* Help text */}
            <div style={{ 
              padding: '1rem', 
              background: '#f9fafb', 
              borderRadius: 8,
              fontSize: '0.85rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              <strong>💡 Pro Tip:</strong> Our Go-based parser is fast and reliable! 
              We use AI as backup to ensure the best results.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedBuilderStart;