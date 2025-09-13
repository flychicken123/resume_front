import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getAPIBaseURL } from '../api';

const IntegratedBuilderStart = ({ onClose }) => {
  const navigate = useNavigate();
  const { applyImportedData } = useResume();
  
  const [step, setStep] = useState(1); // 1: job description (optional), 2: resume import choice
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [error, setError] = useState('');

  // Fetch job description from URL. Returns the description string if found.
  const fetchJobFromUrl = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a job posting URL');
      return '';
    }
    
    setError('');
    setIsFetchingJob(true);
    
    try {
      const response = await fetch(`${getAPIBaseURL()}/api/job/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch job description');
      }
      
      const data = await response.json();
      if (data.description) {
        // Format the description with title and company if available
        let formattedDescription = '';
        if (data.title) {
          formattedDescription += `Position: ${data.title}\n`;
        }
        if (data.company) {
          formattedDescription += `Company: ${data.company}\n\n`;
        }
        formattedDescription += data.description;
        
        setJobDescription(formattedDescription);
        return formattedDescription;
      } else {
        throw new Error('No job description found at this URL');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch job description from URL');
      return '';
    } finally {
      setIsFetchingJob(false);
    }
  };
  
  // Step 1: Continue to step 2 (save job description if provided)
  const handleJobDescriptionNext = async () => {
    // If URL is provided but no description yet, fetch it first
    if (jobUrl.trim() && !jobDescription.trim()) {
      const desc = await fetchJobFromUrl();
      if (desc && desc.trim()) {
        localStorage.setItem('jobDescription', desc.trim());
      }
      setStep(2);
      return;
    }

    // Regular flow - save description if exists and continue
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
              Add a job posting to get AI-powered optimization. Provide a URL or paste the description directly.
            </p>

            {/* Job URL Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500, 
                color: '#374151' 
              }}>
                Job Posting URL (Optional)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://example.com/job-posting"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={fetchJobFromUrl}
                  disabled={!jobUrl.trim() || isFetchingJob}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 8,
                    background: !jobUrl.trim() || isFetchingJob ? '#e5e7eb' : '#10b981',
                    color: !jobUrl.trim() || isFetchingJob ? '#9ca3af' : 'white',
                    cursor: !jobUrl.trim() || isFetchingJob ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {isFetchingJob ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#6b7280', 
                marginTop: '0.5rem', 
                marginBottom: 0 
              }}>
                💡 Paste a job posting URL and click Fetch to automatically extract the description
              </p>
            </div>

            {/* OR Divider */}
            <div style={{ 
              position: 'relative', 
              textAlign: 'center', 
              margin: '1.5rem 0' 
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: 0, 
                right: 0, 
                height: '1px', 
                background: '#e5e7eb' 
              }} />
              <span style={{ 
                position: 'relative', 
                background: 'white', 
                padding: '0 1rem', 
                color: '#9ca3af', 
                fontSize: '0.875rem', 
                fontWeight: 500 
              }}>
                OR
              </span>
            </div>

            {/* Job Description Textarea */}
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
                  minHeight: '150px',
                  maxHeight: '250px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  background: jobDescription && jobUrl ? '#f0f9ff' : 'white'
                }}
              />
              {jobDescription && jobUrl && (
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#0369a1', 
                  marginTop: '0.5rem', 
                  marginBottom: 0 
                }}>
                  ✅ Job description fetched from URL
                </p>
              )}
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#6b7280', 
                marginTop: '0.5rem', 
                marginBottom: 0 
              }}>
                💡 Our AI will analyze the job requirements and optimize your resume accordingly
              </p>
            </div>
            
            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

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
