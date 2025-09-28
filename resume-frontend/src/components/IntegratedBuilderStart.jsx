import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { getAPIBaseURL } from '../api';
const IntegratedBuilderStart = ({ onClose }) => {
  const navigate = useNavigate();
  const { applyImportedData, data, loadUserData } = useResume();
  const [file, setFile] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef(null);
  const dragDepthRef = useRef(0);
  const hasMeaningfulContent = (value) =>
    typeof value === 'string' && value.trim().length > 0;
  const hasExistingResume = useMemo(() => {
    if (!data) return false;
    if (
      hasMeaningfulContent(data.name) ||
      hasMeaningfulContent(data.email) ||
      hasMeaningfulContent(data.phone) ||
      hasMeaningfulContent(data.summary) ||
      hasMeaningfulContent(data.skills)
    ) {
      return true;
    }
    const experienceHasDetails =
      Array.isArray(data.experiences) &&
      data.experiences.some((exp) => {
        if (!exp || typeof exp !== 'object') return false;
        return (
          hasMeaningfulContent(exp.jobTitle) ||
          hasMeaningfulContent(exp.company) ||
          hasMeaningfulContent(exp.description) ||
          hasMeaningfulContent(exp.city) ||
          hasMeaningfulContent(exp.state) ||
          hasMeaningfulContent(exp.startDate) ||
          hasMeaningfulContent(exp.endDate)
        );
      });
    if (experienceHasDetails) {
      return true;
    }
    const educationHasDetails =
      Array.isArray(data.education) &&
      data.education.some((ed) => {
        if (!ed || typeof ed !== 'object') return false;
        return (
          hasMeaningfulContent(ed.degree) ||
          hasMeaningfulContent(ed.school) ||
          hasMeaningfulContent(ed.field) ||
          hasMeaningfulContent(ed.graduationYear) ||
          hasMeaningfulContent(ed.gpa) ||
          hasMeaningfulContent(ed.honors) ||
          hasMeaningfulContent(ed.location)
        );
      });
    if (educationHasDetails) {
      return true;
    }
    const projectsHaveDetails =
      Array.isArray(data.projects) &&
      data.projects.some((proj) => {
        if (!proj || typeof proj !== 'object') return false;
        return (
          hasMeaningfulContent(proj.projectName) ||
          hasMeaningfulContent(proj.description) ||
          hasMeaningfulContent(proj.technologies) ||
          hasMeaningfulContent(proj.projectUrl)
        );
      });
    return projectsHaveDetails;
  }, [data]);
  const isProcessing = pendingAction !== null;
  const acceptExts = ['.pdf', '.doc', '.docx', '.txt'];
  const isAcceptedFile = (resumeFile) => {
    if (!resumeFile?.name) return false;
    const lower = resumeFile.name.toLowerCase();
    return acceptExts.some((ext) => lower.endsWith(ext));
  };
  const pickFirstFile = (dataTransfer) => {
    if (!dataTransfer) return null;
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return dataTransfer.files[0];
    }
    if (dataTransfer.items && dataTransfer.items.length > 0) {
      for (let i = 0; i < dataTransfer.items.length; i += 1) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const maybeFile = item.getAsFile();
          if (maybeFile) {
            return maybeFile;
          }
        }
      }
    }
    return null;
  };
  const handleDropFile = (resumeFile) => {
    if (!resumeFile) {
      setError('The dropped item is not a supported file type.');
      return;
    }
    if (!isAcceptedFile(resumeFile)) {
      setError('Unsupported file type. Please drop a PDF, DOC, DOCX, or TXT.');
      return;
    }
    setError('');
    setFile(resumeFile);
  };
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  };
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    const droppedFile = pickFirstFile(event.dataTransfer);
    handleDropFile(droppedFile);
  };
  useEffect(() => {
    const preventDefault = (event) => {
      if (!dropZoneRef.current) return;
      if (!event.dataTransfer) return;
      const hasFiles =
        event.dataTransfer.types?.includes?.('Files') ||
        event.dataTransfer.files?.length;
      if (!hasFiles) return;
      event.preventDefault();
      if (!dropZoneRef.current.contains(event.target)) {
        dragDepthRef.current = 0;
        setIsDragOver(false);
      }
    };
    const listenerOptions = { passive: false };
    window.addEventListener('dragover', preventDefault, listenerOptions);
    window.addEventListener('drop', preventDefault, listenerOptions);
    return () => {
      window.removeEventListener('dragover', preventDefault, listenerOptions);
      window.removeEventListener('drop', preventDefault, listenerOptions);
    };
  }, []);
  const handleResumeUpload = async (resumeFile) => {
    const form = new FormData();
    form.append('resume', resumeFile);
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
    if (isProcessing) {
      return;
    }
    if (!file) {
      setError('Please select a resume file to import');
      return;
    }
    setError('');
    setPendingAction('import');
    try {
      await handleResumeUpload(file);
    } catch (err) {
      console.error('Resume import failed:', err);
      setError(
        err.message || 'Something went wrong while importing the resume',
      );
    } finally {
      setPendingAction(null);
    }
  };
  const handleStartManual = () => {
    if (isProcessing) {
      return;
    }
    onClose();
    navigate('/builder');
  };
  const handleContinueResume = async () => {
    if (isProcessing) {
      return;
    }
    setError('');
    setPendingAction('continue');
    try {
      if (typeof loadUserData === 'function') {
        await loadUserData();
      }
    } catch (err) {
      console.error('Resume continue failed:', err);
    }
    setPendingAction(null);
    onClose();
    navigate('/builder');
  };
  return (
    <div
      style={{
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
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '2rem',
          width: '92%',
          maxWidth: 600,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
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
            borderRadius: '50%',
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
            Import an existing resume or start from scratch. You can add a job
            description later in the builder.
          </p>
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {hasExistingResume && (
              <div
                style={{
                  border: '2px solid #c7d2fe',
                  borderRadius: 12,
                  padding: '1.5rem',
                  background: '#eef2ff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>
                    🔄
                  </span>
                  <h3 style={{ margin: 0, color: '#312e81' }}>
                    Continue Last Resume
                  </h3>
                </div>
                <p
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#4338ca',
                    fontSize: '0.9rem',
                  }}
                >
                  Pick up where you left off with the resume you already
                  started.
                </p>
                <button
                  onClick={handleContinueResume}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#6366f1',
                    color: 'white',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    opacity: isProcessing ? 0.85 : 1,
                  }}
                >
                  {pendingAction === 'continue'
                    ? 'Opening…'
                    : 'Continue Last Resume'}
                </button>
              </div>
            )}
            <div
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '1.5rem',
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>
                  📄
                </span>
                <h3 style={{ margin: 0, color: '#1f2937' }}>Import Resume</h3>
              </div>
              <p
                style={{
                  margin: '0 0 1rem 0',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                Upload your existing resume and we will pre-fill the builder
                automatically.
              </p>
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border:
                    file || isDragOver
                      ? '2px solid #3b82f6'
                      : '2px dashed #d1d5db',
                  borderRadius: 8,
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: file
                    ? '#f0f9ff'
                    : isDragOver
                      ? '#eef2ff'
                      : 'white',
                  transition: 'all 0.2s',
                  marginBottom: '1rem',
                }}
              >
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
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        ✅
                      </div>
                      <div style={{ fontWeight: 500, color: '#3b82f6' }}>
                        {file.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginTop: '0.5rem',
                        }}
                      >
                        Click to change file
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        📎
                      </div>
                      <div style={{ fontWeight: 500, color: '#374151' }}>
                        Click to upload resume
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginTop: '0.5rem',
                        }}
                      >
                        Supports PDF, DOCX, DOC, TXT
                      </div>
                    </>
                  )}
                </label>
              </div>
              <button
                onClick={handleImportResume}
                disabled={isProcessing || !file}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 8,
                  background: !file ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  cursor: !file || isProcessing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  opacity: isProcessing ? 0.85 : 1,
                }}
              >
                {pendingAction === 'import' ? 'Importing…' : 'Import Resume'}
              </button>
            </div>
            <div
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                padding: '1.5rem',
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>
                  ✨
                </span>
                <h3 style={{ margin: 0, color: '#1f2937' }}>Start Manually</h3>
              </div>
              <p
                style={{
                  margin: '0 0 1rem 0',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                Build your resume from scratch using our guided builder and
                templates.
              </p>
              <button
                onClick={handleStartManual}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 8,
                  background: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {pendingAction ? 'Loading…' : 'Start Building'}
              </button>
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: 8,
              fontSize: '0.85rem',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            💡 You can paste a job description later inside the builder's Job
            Description tab to enable AI optimization.
          </div>
        </div>
      </div>
    </div>
  );
};
export default IntegratedBuilderStart;
