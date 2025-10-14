import React, { useEffect, useMemo, useState } from 'react';
import { getAPIBaseURL } from '../api';
import {
  createJobDescriptionEntry,
  ensureJobDescriptionList,
} from '../utils/jobDescriptions';

const StepJobDescription = ({ jobDescriptions, onJobDescriptionsChange }) => {
  const entries = useMemo(
    () => ensureJobDescriptionList(jobDescriptions),
    [jobDescriptions]
  );

  const [entryStatus, setEntryStatus] = useState({});

  useEffect(() => {
    setEntryStatus((prev) => {
      const next = {};
      entries.forEach((entry) => {
        next[entry.id] = prev[entry.id] || {
          message: '',
          error: '',
          isFetching: false,
        };
      });
      return next;
    });
  }, [entries]);

  const updateEntries = (updater) => {
    if (typeof onJobDescriptionsChange !== 'function') {
      return;
    }
    const next =
      typeof updater === 'function' ? updater(entries) : ensureJobDescriptionList(updater);
    onJobDescriptionsChange(ensureJobDescriptionList(next));
  };

  const updateEntryStatus = (id, patch) => {
    setEntryStatus((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { message: '', error: '', isFetching: false }),
        ...patch,
      },
    }));
  };

  const handleUrlChange = (id, value) => {
    updateEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, url: value } : entry
      )
    );
  };

  const handleTextChange = (id, value) => {
    updateEntryStatus(id, { message: '', error: '' });
    updateEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, text: value } : entry
      )
    );
  };

  const handleClear = (id) => {
    updateEntryStatus(id, { message: '', error: '' });
    updateEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, url: '', text: '' } : entry
      )
    );
  };

  const handleRemove = (id) => {
    if (entries.length === 1) {
      handleClear(id);
      return;
    }
    updateEntries((current) => current.filter((entry) => entry.id !== id));
    setEntryStatus((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddEntry = () => {
    updateEntries((current) => [
      ...current,
      createJobDescriptionEntry(),
    ]);
  };

  const fetchFromUrl = async (id) => {
    const targetEntry = entries.find((entry) => entry.id === id);
    const candidateUrl = typeof targetEntry?.url === 'string' ? targetEntry.url.trim() : '';

    if (!candidateUrl) {
      updateEntryStatus(id, {
        error: 'Please enter a job posting URL.',
        message: '',
      });
      return;
    }

    updateEntryStatus(id, { isFetching: true, error: '', message: '' });

    try {
      const response = await fetch(`${getAPIBaseURL()}/api/job/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: candidateUrl }),
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

      updateEntries((current) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                url: candidateUrl,
                text: formatted,
              }
            : entry
        )
      );

      updateEntryStatus(id, {
        error: '',
        message: 'Job description imported from the posting.',
      });
    } catch (err) {
      updateEntryStatus(id, {
        error: err.message || 'Unable to fetch the job description.',
        message: '',
      });
    } finally {
      updateEntryStatus(id, { isFetching: false });
    }
  };

  return (
    <div
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.75rem' }}>Job Description</h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Add one or more job descriptions so our AI can tailor your resume and cover letter to the exact roles you care about.
        </p>
      </div>

      {entries.map((entry, idx) => {
        const status = entryStatus[entry.id] || {
          message: '',
          error: '',
          isFetching: false,
        };

        return (
          <div
            key={entry.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#1f2937',
                }}
              >
                Job Description {entries.length > 1 ? `#${idx + 1}` : ''}
              </h3>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(entry.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#dc2626',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="url"
                value={entry.url}
                onChange={(e) => handleUrlChange(entry.id, e.target.value)}
                placeholder="https://example.com/job-posting"
                style={{
                  flex: '1 1 260px',
                  minWidth: '240px',
                  padding: '0.85rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: 'white',
                }}
              />
              <button
                type="button"
                onClick={() => fetchFromUrl(entry.id)}
                disabled={status.isFetching}
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: status.isFetching ? '#e5e7eb' : '#3b82f6',
                  color: status.isFetching ? '#9ca3af' : 'white',
                  fontWeight: 600,
                  cursor: status.isFetching ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {status.isFetching ? 'Fetching…' : 'Fetch from URL'}
              </button>
              <button
                type="button"
                onClick={() => handleClear(entry.id)}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>

            <label
              htmlFor={`job-description-textarea-${entry.id}`}
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Job Description (optional)
            </label>
            <textarea
              id={`job-description-textarea-${entry.id}`}
              value={entry.text}
              onChange={(e) => handleTextChange(entry.id, e.target.value)}
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
                background: 'white',
              }}
            />

            {status.message && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  color: '#047857',
                  fontSize: '0.9rem',
                }}
              >
                {status.message}
              </div>
            )}

            {status.error && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.9rem',
                }}
              >
                {status.error}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAddEntry}
        style={{
          padding: '0.85rem 1.5rem',
          borderRadius: '10px',
          border: '1px solid #3b82f6',
          background: 'white',
          color: '#3b82f6',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1.5rem',
        }}
      >
        Add Another Job Description
      </button>

      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          fontSize: '0.88rem',
          lineHeight: 1.5,
        }}
      >
        📌 Add multiple job descriptions to tailor your resume to different roles in one go. We’ll use every entry when generating content and suggestions.
      </div>
    </div>
  );
};

export default StepJobDescription;
