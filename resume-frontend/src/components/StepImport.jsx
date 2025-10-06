import React, { useState, useRef } from 'react';
import { parseResumeFile } from '../api';
import { useFeedback } from '../context/FeedbackContext';
import { setLastStep } from '../utils/exitTracking';
import { useResume } from '../context/ResumeContext';

const StepImport = ({ onSkip }) => {
  const [tab, setTab] = useState('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);
  const { applyImportedData } = useResume();
  const { triggerFeedbackPrompt } = useFeedback();

  const importFromFile = async (file) => {
    if (!file) {
      return;
    }
    setError('');
    setSelectedFileName(file.name);
    setLoading(true);

    try {
      const parsed = await parseResumeFile(file);
      if (parsed && parsed.structured) {
        applyImportedData(parsed.structured);
      }
      setLastStep('resume_import_success');
      triggerFeedbackPrompt({
        scenario: 'resume_import',
        metadata: {
          result: 'success',
          aiUsed: parsed?.aiUsed,
          source: 'file',
          fileName: file.name,
        },
      });
      onSkip();
    } catch (err) {
      console.error('Resume import failed', err);
      setError(err?.message || 'Failed to parse resume. Please try a different file.');
      setLastStep('resume_import_error');
      triggerFeedbackPrompt({
        scenario: 'resume_import',
        metadata: {
          result: 'error',
          source: 'file',
          message: err?.message || 'parse_failed',
        },
        force: true,
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || loading) {
      return;
    }
    importFromFile(file);
  };

  return (
    <div>
      <h2>Let's import your career history</h2>
      <p>Import your information from an existing resume, LinkedIn profile, or add it manually.</p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button
          type="button"
          onClick={() => setTab('file')}
          style={{ fontWeight: tab === 'file' ? 'bold' : 'normal' }}
        >
          Resume File
        </button>
        <button
          type="button"
          onClick={() => setTab('linkedin')}
          style={{ fontWeight: tab === 'linkedin' ? 'bold' : 'normal' }}
          disabled
          title="LinkedIn import coming soon"
        >
          LinkedIn Import
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          style={{ fontWeight: tab === 'paste' ? 'bold' : 'normal' }}
        >
          Paste Text
        </button>
      </div>

      {tab === 'file' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <label
            htmlFor="resume-file-input"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              border: '2px dashed #94a3b8',
              borderRadius: '12px',
              padding: '2rem',
              width: '100%',
              maxWidth: '420px',
              margin: '0 auto',
              cursor: loading ? 'wait' : 'pointer',
              background: '#f8fafc',
              color: '#1f2937',
              transition: 'border-color 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Upload your resume (PDF, DOC, DOCX)</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedFileName || 'Click to browse or drop a file here'}</span>
            <input
              id="resume-file-input"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={loading}
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>.doc, .docx or .pdf, up to 50 MB.</span>
          </label>
          {loading && (
            <div style={{ marginTop: '1rem', color: '#2563eb', fontWeight: 600 }}>Parsing your resume…</div>
          )}
          {error && (
            <div style={{ color: '#b91c1c', marginTop: '1rem' }}>{error}</div>
          )}
        </div>
      )}

      {tab === 'linkedin' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#94a3b8' }}>
          LinkedIn import is coming soon. In the meantime, upload your resume file or paste your details below.
        </div>
      )}

      {tab === 'paste' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <textarea
            placeholder="Paste your resume text here..."
            rows={8}
            style={{ width: '100%', maxWidth: 420, marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
          />
          <button type="button" disabled>Import from text (Coming Soon)</button>
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: 'none', color: '#3b82f6', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
          disabled={loading}
        >
          Skip and enter manually
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
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
