// src/components/StepExperience.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateExperienceAI, improveExperienceGrammarAI } from '../api';
import { useLocation } from 'react-router-dom';

const createEmptyExperience = () => ({
  jobTitle: '',
  company: '',
  city: '',
  state: '',
  remote: false,
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: ''
});

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const coerceDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const timestampDate = new Date(value);
    return Number.isNaN(timestampDate.getTime()) ? null : timestampDate;
  }

  const str = String(value).trim();
  if (!str || /^present$/i.test(str)) {
    return null;
  }

  if (ISO_DATE_REGEX.test(str)) {
    const [yearStr, monthStr, dayStr] = str.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  if (/^\d{8}$/.test(str)) {
    const year = Number(str.slice(0, 4));
    const month = Number(str.slice(4, 6));
    const day = Number(str.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (/^\d{6}$/.test(str)) {
    const year = Number(str.slice(0, 4));
    const month = Number(str.slice(4, 6));
    return new Date(Date.UTC(year, month - 1, 1));
  }

  const normalized = str.replace(/[.]/g, '-').replace(/\//g, '-');

  let match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month - 1, day));
  }

  match = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    return new Date(Date.UTC(year, month - 1, day));
  }

  match = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  match = normalized.match(/^(\d{1,2})-(\d{4})$/);
  if (match) {
    const month = Number(match[1]);
    const year = Number(match[2]);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  if (/^\d{4}$/.test(str)) {
    const year = Number(str);
    return new Date(Date.UTC(year, 0, 1));
  }

  if (/^(\d{10}|\d{13})$/.test(str)) {
    const unix = Number(str);
    const millis = str.length === 13 ? unix : unix * 1000;
    const numericDate = new Date(millis);
    if (!Number.isNaN(numericDate.getTime())) {
      return numericDate;
    }
  }

  let parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  if (str.includes(' ')) {
    parsed = new Date(str.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const normalizeDateValue = (value) => {
  const parsed = coerceDate(value);
  if (!parsed) {
    return '';
  }

  const year = parsed.getUTCFullYear();
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const formatDateRange = (exp) => {
  if (!exp) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const start = coerceDate(exp.startDate);
  const end = coerceDate(exp.endDate);

  if (start && exp.currentlyWorking) {
    return `${formatter.format(start)} - Present`;
  }

  if (start && end) {
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  if (start) {
    return formatter.format(start);
  }

  if (!exp.currentlyWorking && end) {
    return formatter.format(end);
  }

  return '';
};
const StepExperience = () => {
  const { data, setData } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [aiMode, setAiMode] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const location = useLocation();

  const experiences = Array.isArray(data?.experiences) ? data.experiences : [];
  const hasExperienceDescriptions = experiences.some(
    (exp) => exp && (exp.description || '').trim()
  );
  const bulkButtonDisabled = bulkLoading || loadingIndex !== null || !hasExperienceDescriptions;

  const updateExperiences = useCallback((updater) => {
    setData((prev) => {
      const current = Array.isArray(prev?.experiences) ? prev.experiences : [];
      const next = updater(current);
      if (!Array.isArray(next)) {
        return prev;
      }
      return { ...prev, experiences: next };
    });
  }, [setData]);

  useEffect(() => {
    if (!Array.isArray(data?.experiences)) {
      updateExperiences(() => []);
      return;
    }

    const normalized = data.experiences.map((exp) => {
      if (!exp) return createEmptyExperience();
      const normalizedStart = normalizeDateValue(exp.startDate);
      const normalizedEnd = normalizeDateValue(exp.endDate);
      if (normalizedStart === exp.startDate && normalizedEnd === exp.endDate) {
        return exp;
      }
      return {
        ...exp,
        startDate: normalizedStart,
        endDate: normalizedEnd,
      };
    });

    const hasChanges = normalized.some((exp, idx) => exp !== data.experiences[idx]);
    if (hasChanges) {
      updateExperiences(() => normalized);
    }
  }, [data?.experiences, updateExperiences]);

  const getJobDescription = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'build' && pathParts[2]) {
      return decodeURIComponent(pathParts[2]);
    }
    return localStorage.getItem('jobDescription') || '';
  };

  const addExperience = () => {
    updateExperiences((current) => [...current, createEmptyExperience()]);
  };

  const removeExperience = (idx) => {
    updateExperiences((current) => current.filter((_, i) => i !== idx));
  };

  const skipExperience = () => {
    updateExperiences(() => []);
  };

  const handleChange = (idx, field, value) => {
    updateExperiences((current) => {
      const next = [...current];
      if (!next[idx]) {
        next[idx] = createEmptyExperience();
      }

      if (field === 'currentlyWorking') {
        next[idx] = {
          ...next[idx],
          currentlyWorking: value,
          endDate: value ? '' : next[idx].endDate,
        };
      } else if (field === 'remote') {
        next[idx] = { ...next[idx], remote: value };
      } else if (field === 'startDate' || field === 'endDate') {
        next[idx] = { ...next[idx], [field]: normalizeDateValue(value) };
      } else {
        next[idx] = { ...next[idx], [field]: value };
      }

      return next;
    });
  };

  const checkWithAI = async (idx) => {
    try {
      setLoadingIndex(idx);
      const experience = experiences[idx];
      if (!experience) {
        return;
      }

      const desc = (experience.description || '').trim();
      if (!desc) {
        alert('Please enter your experience description first.');
        return;
      }

      const jobDesc = getJobDescription();
      const improvedText = jobDesc
        ? await generateExperienceAI(desc, jobDesc)
        : await improveExperienceGrammarAI(desc);

      updateExperiences((current) => {
        const next = [...current];
        if (!next[idx]) {
          next[idx] = createEmptyExperience();
        }
        next[idx] = { ...next[idx], description: improvedText };
        return next;
      });

      setAiMode((prev) => ({ ...prev, [idx]: true }));
    } catch (err) {
      console.error('AI experience enhancement failed', err);
      alert('Failed to check with AI. Please try again.');
    } finally {
      setLoadingIndex(null);
    }
  };

  const checkAllWithAI = async () => {
    if (!hasExperienceDescriptions || bulkLoading) {
      if (!hasExperienceDescriptions) {
        alert('Add descriptions to your experiences before running an AI check.');
      }
      return;
    }

    try {
      setBulkLoading(true);
      for (let idx = 0; idx < experiences.length; idx += 1) {
        const experience = experiences[idx];
        if (!experience || !(experience.description || '').trim()) {
          continue;
        }
        await checkWithAI(idx);
      }
    } finally {
      setBulkLoading(false);
      setLoadingIndex(null);
    }
  };

  return (
    <div>
      <h2>Work Experience</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
        * Required fields. Experience will only appear in your resume when both Job Title and Employer are filled.
      </p>
      {getJobDescription() && (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
            🎯 <strong>AI Optimization Available:</strong> Use the "Check with AI" button to optimize your experiences based on the job description.
          </p>
        </div>
      )}

      {experiences.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1.25rem',
          }}
        >
          <button
            onClick={checkAllWithAI}
            disabled={bulkButtonDisabled}
            style={{
              background: bulkButtonDisabled ? '#bfdbfe' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              cursor: bulkButtonDisabled ? 'not-allowed' : 'pointer',
              opacity: bulkButtonDisabled ? 0.6 : 1,
              boxShadow: bulkButtonDisabled ? 'none' : '0 12px 30px rgba(37, 99, 235, 0.25)',
              transition: 'background 0.2s ease, opacity 0.2s ease',
            }}
            title={
              !hasExperienceDescriptions
                ? 'Add descriptions to your experiences first.'
                : loadingIndex !== null
                ? 'Finish the current AI check before running all.'
                : undefined
            }
          >
            {bulkLoading ? 'Checking all experiences...' : '✨ Check all experiences with AI'}
          </button>
        </div>
      )}

      {experiences.length === 0 ? (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>No work experience added yet.</strong>
          </p>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem', marginBottom: '1rem' }}>
            If you're a student or new graduate without work experience, you can skip this section and highlight your projects instead.
          </p>
        </div>
      ) : (
        experiences.map((exp, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {[exp.jobTitle, exp.company, [exp.city, exp.state].filter(Boolean).join(', ')]
                    .filter(Boolean)
                    .join(' • ') || `Experience ${idx + 1}`}
                </div>
                {formatDateRange(exp) && (
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {formatDateRange(exp)}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeExperience(idx)}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ minWidth: '220px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  JOB TITLE *
                </label>
                <input
                  type="text"
                  value={exp.jobTitle}
                  onChange={(e) => handleChange(idx, 'jobTitle', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ minWidth: '220px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  EMPLOYER *
                </label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleChange(idx, 'company', e.target.value)}
                  placeholder="e.g., Google"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ minWidth: '220px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  CITY
                </label>
                <input
                  type="text"
                  value={exp.city}
                  onChange={(e) => handleChange(idx, 'city', e.target.value)}
                  placeholder="e.g., Seattle"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ minWidth: '220px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  STATE/REGION
                </label>
                <input
                  type="text"
                  value={exp.state}
                  onChange={(e) => handleChange(idx, 'state', e.target.value)}
                  placeholder="e.g., WA"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  START DATE
                </label>
                <input
                  type="month"
                  value={normalizeDateValue(exp.startDate)}
                  onChange={(e) => handleChange(idx, 'startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.875rem',
                  }}
                >
                  END DATE
                </label>
                <input
                  type="month"
                  value={normalizeDateValue(exp.endDate)}
                  onChange={(e) => handleChange(idx, 'endDate', e.target.value)}
                  disabled={exp.currentlyWorking}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    cursor: exp.currentlyWorking ? 'not-allowed' : 'pointer',
                    background: exp.currentlyWorking ? '#f9fafb' : 'white',
                    opacity: exp.currentlyWorking ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={exp.currentlyWorking}
                  onChange={(e) => handleChange(idx, 'currentlyWorking', e.target.checked)}
                  style={{
                    margin: 0,
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                  }}
                />
                <span>I currently work here</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={exp.remote}
                  onChange={(e) => handleChange(idx, 'remote', e.target.checked)}
                  style={{
                    margin: 0,
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                  }}
                />
                <span>Remote role</span>
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                Experience Description
              </label>
              <textarea
                rows="4"
                value={exp.description}
                onChange={(e) => handleChange(idx, 'description', e.target.value)}
                placeholder="Jot down bullet ideas or keywords (e.g., 'increased API speed 30%', 'led 4 engineers')—AI will turn them into polished entries."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => checkWithAI(idx)}
                disabled={bulkLoading || loadingIndex === idx || !(exp.description || '').trim()}
                style={{
                  background: aiMode[idx] ? '#10b981' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor:
                    bulkLoading || loadingIndex === idx || !(exp.description || '').trim()
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: bulkLoading || loadingIndex === idx || !(exp.description || '').trim() ? 0.5 : 1,
                }}
                title={
                  bulkLoading
                    ? 'Bulk AI check in progress'
                    : getJobDescription()
                    ? 'Optimize experience for the job posting'
                    : 'Improve grammar and professionalism'
                }
              >
                {loadingIndex === idx ? 'Checking...' : aiMode[idx] ? '✓ AI Enhanced' : '✨ Check with AI'}
              </button>
            </div>
          </div>
        ))
      )}

      <button
        onClick={addExperience}
        style={{
          background: '#f3f4f6',
          color: '#374151',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '1rem',
          width: '100%',
          fontSize: '1rem',
          cursor: 'pointer',
          marginTop: '1rem',
        }}
      >
        + {experiences.length === 0 ? 'Add Work Experience' : 'Add Another Experience'}
      </button>

      {experiences.length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#6b7280',
          }}
        >
          <strong>Preview tip:</strong> Bullet points render automatically in the resume preview. Focus on writing concise, high-impact sentences.
        </div>
      )}

      {experiences.length > 0 && (
        <button
          onClick={skipExperience}
          style={{
            marginTop: '1rem',
            display: 'block',
            background: 'none',
            color: '#ef4444',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Remove all experiences
        </button>
      )}
    </div>
  );
};

export default StepExperience;
