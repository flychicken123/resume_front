import React, { useState } from 'react';
import { getAPIBaseURL } from '../api';

const StepJobDescription = ({ jobDescription, onJobDescriptionChange }) => {
  const [jobUrl, setJobUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleJobDescriptionUpdate = (value) => {
    setMessage('');
    setError('');
    onJobDescriptionChange(value);
  };

  const handleClear = () => {
    setJobUrl('');
    handleJobDescriptionUpdate('');
  };

  const fetchFromUrl = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a job posting URL.');
      setMessage('');
      return;
    }

    setIsFetching(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${getAPIBaseURL()}/api/job/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: jobUrl.trim() })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to fetch job description');
      }

      const data = await response.json();
      if (!data.description) {
        throw new Error('No job description found at this URL');
      }

      let formatted = '';
      if (data.title) {
        formatted += `Position: ${data.title}\n`;
      }
      if (data.company) {
        formatted += `Company: ${data.company}\n\n`;
      }
      formatted += data.description;

      handleJobDescriptionUpdate(formatted);
      setMessage('Job description imported from the posting.');
    } catch (err) {
      setError(err.message || 'Unable to fetch the job description.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.75rem' }}>Job Description</h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Paste a job description or fetch it from a posting so our AI can tailor your resume and cover letter.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://example.com/job-posting"
          style={{
            flex: '1 1 260px',
            minWidth: '240px',
            padding: '0.85rem',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="button"
          onClick={fetchFromUrl}
          disabled={isFetching}
          style={Object.assign({
            padding: '0.85rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            background: isFetching ? '#e5e7eb' : '#3b82f6',
            color: isFetching ? '#9ca3af' : 'white',
            fontWeight: 600,
            cursor: isFetching ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          })}
        >
          {isFetching ? 'Fetching…' : 'Fetch from URL'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            background: 'white',
            color: '#374151',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Tip: Fetching from a job posting URL automatically captures the description, title, and company name.
      </p>

      <label htmlFor="job-description-textarea" style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 600,
        color: '#374151'
      }}>
        Job Description (optional)
      </label>
      <textarea
        id="job-description-textarea"
        value={jobDescription}
        onChange={(e) => handleJobDescriptionUpdate(e.target.value)}
        placeholder="Paste the job description here to enable AI tailoring across your resume and cover letters."
        rows={10}
        style={{
          width: '100%',
          borderRadius: '12px',
          border: '1px solid #d1d5db',
          padding: '1rem',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          fontFamily: 'inherit',
          background: '#f8fafc'
        }}
      />

      {message && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: '#ecfdf5',
          border: '1px solid #bbf7d0',
          color: '#047857',
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '0.85rem 1rem',
        borderRadius: '10px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        fontSize: '0.88rem',
        lineHeight: 1.5
      }}>
        📌 You can edit this description at any time. We’ll use it to enhance your experience bullets, summary, and cover letter.
      </div>
    </div>
  );
};

export default StepJobDescription;
