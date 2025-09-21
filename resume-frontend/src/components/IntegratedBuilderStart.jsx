import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getAPIBaseURL } from '../api';

const IntegratedBuilderStart = ({ onClose }) => {
  const navigate = useNavigate();
  const { applyImportedData } = useResume();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResumeUpload = async (resumeFile) => {
    const form = new FormData();
    form.append('resume', resumeFile);

    const resp = await fetch(`${getAPIBaseURL()}/api/resume/parse`, {
      method: 'POST',
      body: form
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

    if (!json.structured) {
      throw new Error('Could not extract usable data from resume');
    }

    applyImportedData(json.structured);
    setTimeout(() => {
      onClose();
      navigate('/builder');
    }, 100);
  };

  const handleImportResume = async () => {
    if (!file) {
      setError('Please select a resume file to import');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await handleResumeUpload(file);
    } catch (err) {
      console.error('Resume import failed:', err);
      setError(err.message || 'Something went wrong while importing the resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartManual = () => {
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

        <div>
          <h2 style={{ margin: '0 0 0.75rem 0', color: '#1f2937' }}>
            📄 Choose Your Starting Point
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Import an existing resume or start from scratch. You can add a job description later in the builder.
          </p>

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

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
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
                Upload your existing resume and we will pre-fill the builder automatically.
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
                  style={{ cursor: 'pointer', display: 'block' }}
                >
                  {file ? (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                      <div style={{ fontWeight: 500, color: '#3b82f6' }}>{file.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Click to change file
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                      <div style={{ fontWeight: 500, color: '#374151' }}>Click to upload resume</div>
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
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {isLoading ? 'Importing…' : 'Import Resume'}
              </button>
            </div>

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
                Build your resume from scratch using our guided builder and templates.
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
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {isLoading ? 'Loading…' : 'Start Building'}
              </button>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: 8,
            fontSize: '0.85rem',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            💡 You can paste a job description later inside the builder's Job Description tab to enable AI optimization.
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedBuilderStart;
