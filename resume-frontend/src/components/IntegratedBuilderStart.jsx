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
  
  const [step, setStep] = useState(1); // 1: choose path, 2: fill details
  const [path, setPath] = useState(''); // 'job-first', 'resume-first', 'manual'
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Choose your path
  const handlePathChoice = (selectedPath) => {
    setPath(selectedPath);
    setStep(2);
  };

  // Step 2: Process based on chosen path
  const handleProceed = async () => {
    setError('');
    
    try {
      setIsLoading(true);

      // Save job description if provided
      if (jobDescription.trim()) {
        localStorage.setItem('jobDescription', jobDescription.trim());
      }

      // If user uploaded a resume, parse it
      if (file) {
        await handleResumeUpload();
      } else {
        // No resume to parse, just go to builder
        onClose();
        navigate('/builder');
      }
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
              Choose the best starting point for your resume. Our AI will help optimize it regardless of which path you choose!
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Option 1: I have a job posting */}
              <div 
                onClick={() => handlePathChoice('job-first')}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#fafafa'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#fafafa';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🎯</span>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>I have a specific job in mind</h3>
                </div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  Perfect! Paste the job description and optionally upload your current resume. 
                  Our AI will tailor everything to match the role.
                </p>
              </div>

              {/* Option 2: I have a resume to import */}
              <div 
                onClick={() => handlePathChoice('resume-first')}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#fafafa'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#fafafa';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📄</span>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>I want to import my existing resume</h3>
                </div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  Upload your current resume and we'll extract all the information. 
                  Add a job description later for AI optimization.
                </p>
              </div>

              {/* Option 3: Start from scratch */}
              <div 
                onClick={() => handlePathChoice('manual')}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#fafafa'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#fafafa';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✨</span>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>I want to start fresh</h3>
                </div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  Build your resume from scratch with our guided builder. 
                  Add a job description for AI-powered suggestions.
                </p>
              </div>
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
                {path === 'job-first' && '🎯 Job-Targeted Resume'}
                {path === 'resume-first' && '📄 Import Your Resume'}
                {path === 'manual' && '✨ Fresh Start'}
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

            {/* Job Description Section */}
            {(path === 'job-first' || path === 'manual') && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500, 
                  color: '#374151' 
                }}>
                  {path === 'job-first' ? 'Job Description *' : 'Job Description (Optional)'}
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get AI-powered resume optimization..."
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
            )}

            {/* Resume Upload Section */}
            {(path === 'job-first' || path === 'resume-first') && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500, 
                  color: '#374151' 
                }}>
                  {path === 'resume-first' ? 'Your Resume *' : 'Current Resume (Optional)'}
                </label>
                <div style={{
                  border: file ? '2px solid #3b82f6' : '2px dashed #d1d5db',
                  borderRadius: 8,
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: file ? '#f0f9ff' : '#fafafa',
                  transition: 'all 0.2s'
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
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {path === 'manual' && (
                <button 
                  onClick={handleStartManual}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500,
                    minWidth: 160
                  }}
                >
                  {isLoading ? 'Starting...' : 'Start Building'}
                </button>
              )}

              {path !== 'manual' && (
                <>
                  <button 
                    onClick={handleStartManual}
                    disabled={isLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '2px solid #d1d5db',
                      borderRadius: 8,
                      background: 'white',
                      cursor: 'pointer',
                      minWidth: 140
                    }}
                  >
                    Skip & Build Manually
                  </button>
                  <button 
                    onClick={handleProceed}
                    disabled={isLoading || (path === 'job-first' && !jobDescription.trim()) || (path === 'resume-first' && !file)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: 8,
                      background: '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 500,
                      minWidth: 160,
                      opacity: (path === 'job-first' && !jobDescription.trim()) || (path === 'resume-first' && !file) ? 0.5 : 1
                    }}
                  >
                    {isLoading ? 'Processing...' : 'Continue to Builder'}
                  </button>
                </>
              )}
            </div>

            {/* Help text */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#f9fafb', 
              borderRadius: 8,
              fontSize: '0.85rem',
              color: '#6b7280'
            }}>
              <strong>💡 Pro Tip:</strong> Our new Go-based parser is faster and more reliable! 
              We use AI only as a backup to ensure the best possible results.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedBuilderStart;