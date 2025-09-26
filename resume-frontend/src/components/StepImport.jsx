import React, { useState } from 'react';
import { parseResumeFile } from '../api';
import { useFeedback } from '../context/FeedbackContext';
import { setLastStep } from '../utils/exitTracking';
import { useResume } from '../context/ResumeContext';

const StepImport = ({ onSkip, jobDescription }) => {
  const [tab, setTab] = useState(jobDescription ? 'jobdesc' : 'file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localJobDesc, setLocalJobDesc] = useState(jobDescription || '');
  const { applyImportedData } = useResume();
  const { triggerFeedbackPrompt } = useFeedback();

  const handleNext = async () => {
    if (tab === 'file' && selectedFile) {
      setLoading(true);
      setError('');
      try {
        const parsed = await parseResumeFile(selectedFile);
        if (parsed && parsed.structured) {
          applyImportedData(parsed.structured);
        }
        setLastStep('resume_import_success');
        triggerFeedbackPrompt({
          scenario: 'resume_import',
          metadata: { result: 'success', aiUsed: parsed?.aiUsed },
        });
        onSkip();
      } catch (err) {
        setError('Failed to parse resume. Please try again.');
        setLastStep('resume_import_error');
        triggerFeedbackPrompt({
          scenario: 'resume_import',
          metadata: { result: 'error', message: err?.message || '' },
          force: true,
        });
      } finally {
        setLoading(false);
      }
    } else {
      onSkip();
    }
  };

  return (
    <div>
      <h2>Let's import your career history</h2>
      <p>Import your information from an existing resume, LinkedIn profile, or add it manually.</p>
      {localJobDesc && (
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1rem' 
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>Job Description for Resume Tailoring:</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{localJobDesc}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button type="button" onClick={() => setTab('file')} style={{ fontWeight: tab === 'file' ? 'bold' : 'normal' }}>Resume File</button>
        <button type="button" onClick={() => setTab('linkedin')} style={{ fontWeight: tab === 'linkedin' ? 'bold' : 'normal' }}>LinkedIn Import</button>
        <button type="button" onClick={() => setTab('paste')} style={{ fontWeight: tab === 'paste' ? 'bold' : 'normal' }}>Paste Text</button>
        <button type="button" onClick={() => setTab('jobdesc')} style={{ fontWeight: tab === 'jobdesc' ? 'bold' : 'normal' }}>Job Description</button>
      </div>
      {tab === 'file' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ marginBottom: '1rem' }}
            onChange={e => setSelectedFile(e.target.files[0])}
          />
          <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>.doc, .docx or .pdf, up to 50 MB.</div>
          <button
            type="button"
            disabled={!selectedFile || loading}
            style={{ marginTop: '1rem' }}
            onClick={handleNext}
          >
            {loading ? 'Parsing...' : 'Next'}
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>
      )}
      {tab === 'linkedin' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button type="button" disabled style={{ marginBottom: '1rem' }}>Connect to LinkedIn (Coming Soon)</button>
        </div>
      )}
      {tab === 'paste' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <textarea placeholder="Paste your resume text here..." rows={8} style={{ width: '100%', maxWidth: 400, marginBottom: '1rem' }} />
          <button type="button" disabled>Next</button>
        </div>
      )}
      {tab === 'jobdesc' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <textarea 
            placeholder="Paste job description here to tailor your resume..." 
            rows={8} 
            style={{ width: '100%', maxWidth: 400, marginBottom: '1rem' }}
            value={localJobDesc}
            onChange={(e) => {
              setLocalJobDesc(e.target.value);
              // Update the job description in the URL
              const newJobDesc = e.target.value;
              const encodedJobDesc = encodeURIComponent(newJobDesc);
              window.history.replaceState(null, '', `/build/${encodedJobDesc}`);
            }}
          />
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            Add a job description to help tailor your resume for specific positions.
          </p>
          <button type="button" onClick={onSkip}>Continue to Personal Details</button>
        </div>
      )}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button type="button" onClick={onSkip} style={{ background: 'none', color: '#3b82f6', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Skip and enter manually</button>
      </div>
      <div style={{marginTop: '2rem'}}>
        <h4>Steps to create your resume:</h4>
        <ol>
          <li>Import or enter your information</li>
          <li>Review and edit your details</li>
          <li>Preview and download your resume</li>
        </ol>
      </div>
    </div>
  );
};

export default StepImport;


