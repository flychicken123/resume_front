// src/components/StepExperience.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useResume } from '../context/ResumeContext';
import {
  generateExperienceAI,
  optimizeExperiencesBatchAI,
  improveExperienceGrammarAI,
  extractImpactKeywordsAI,
} from '../api';
import { useLocation } from 'react-router-dom';
import { buildExperienceAIContext } from '../utils/experienceAIContext';
import { coerceDate, normalizeDateValue, normalizeExperienceDates, formatMonthYear } from '../utils/resumeDateUtils';

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

const formatDateRange = (exp) => {
  if (!exp) return '';

  const start = coerceDate(exp.startDate);
  const end = coerceDate(exp.endDate);

  if (start && exp.currentlyWorking) {
    return `${formatMonthYear(exp.startDate)} - Present`;
  }

  if (start && end) {
    return `${formatMonthYear(exp.startDate)} - ${formatMonthYear(exp.endDate)}`;
  }

  if (start) {
    return formatMonthYear(exp.startDate);
  }

  if (!exp.currentlyWorking && end) {
    return formatMonthYear(exp.endDate);
  }

  return '';
};

const StepExperience = () => {
  const { data, setData, setHighlightImpact, setImpactKeywords } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [aiMode, setAiMode] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const location = useLocation();

  const experiences = Array.isArray(data?.experiences) ? data.experiences : [];
  const hasAnyContent = experiences.some(
    (exp) => exp && (exp.description || '').trim()
  );
  const bulkButtonDisabled = bulkLoading || loadingIndex !== null || !hasAnyContent;

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

    const normalized = data.experiences.map((exp) => (
      exp ? normalizeExperienceDates(exp) : createEmptyExperience()
    ));

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

  const moveExperienceUp = (idx) => {
    if (idx <= 0) return;
    updateExperiences((current) => {
      const newArr = [...current];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr;
    });
  };

  const moveExperienceDown = (idx) => {
    updateExperiences((current) => {
      if (idx >= current.length - 1) return current;
      const newArr = [...current];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr;
    });
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
      const experienceContext = buildExperienceAIContext(experience, data);
      const improvedText = jobDesc
        ? await generateExperienceAI(
            desc,
            jobDesc,
            [],
            [],
            experienceContext
          )
        : await improveExperienceGrammarAI(desc, experienceContext);

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
    if (!hasAnyContent || bulkLoading) {
      if (!hasAnyContent) {
        alert('Add descriptions to your experiences or projects before running an AI check.');
      }
      return;
    }

    try {
      setBulkLoading(true);
      const batchItems = experiences
        .map((experience, idx) => {
          const desc = (experience?.description || '').trim();
          if (!experience || !desc) {
            return null;
          }
          return {
            index: idx,
            userExperience: desc,
            experienceContext: buildExperienceAIContext(experience, data),
          };
        })
        .filter(Boolean);

      if (batchItems.length === 0) {
        alert('Add descriptions to your experiences before running an AI check.');
        return;
      }

      const response = await optimizeExperiencesBatchAI({
        experiences: batchItems,
        jobDescription: getJobDescription(),
      });
      const results = Array.isArray(response?.results) ? response.results : [];
      const updates = new Map();
      const failedIndexes = new Set(batchItems.map((item) => item.index));

      results.forEach((result) => {
        const idx = Number(result?.index);
        const improvedText = typeof result?.optimizedExperience === 'string'
          ? result.optimizedExperience.trim()
          : '';
        if (Number.isInteger(idx) && improvedText && result.status !== 'failed' && result.status !== 'skipped') {
          updates.set(idx, result.optimizedExperience);
          failedIndexes.delete(idx);
        }
      });

      if (updates.size > 0) {
        updateExperiences((current) => {
          const next = [...current];
          updates.forEach((description, idx) => {
            if (!next[idx]) {
              next[idx] = createEmptyExperience();
            }
            next[idx] = { ...next[idx], description };
          });
          return next;
        });
        setAiMode((prev) => {
          const next = { ...prev };
          updates.forEach((_, idx) => {
            next[idx] = true;
          });
          return next;
        });
      }

      if (failedIndexes.size > 0) {
        const failedCount = failedIndexes.size;
        alert(
          updates.size > 0
            ? `${failedCount} experience${failedCount === 1 ? '' : 's'} could not be checked with AI. Please retry those individually.`
            : 'Failed to check experiences with AI. Please try again.'
        );
      }
    } catch (err) {
      console.error('Bulk AI experience enhancement failed', err);
      alert('Failed to check experiences with AI. Please try again.');
    } finally {
      setBulkLoading(false);
      setLoadingIndex(null);
    }
  };

  const handleHighlightToggle = async (enabled) => {
    if (!enabled) {
      setHighlightImpact(false);
      setImpactKeywords(null);
      return;
    }

    // Check if there are any descriptions to analyze
    const hasContent = experiences.some(
      (exp) => (exp.description || '').trim()
    );

    if (!hasContent) {
      alert('Add descriptions to your experiences or projects first.');
      return;
    }

    try {
      setHighlightLoading(true);
      const result = await extractImpactKeywordsAI(experiences);
      setImpactKeywords(result);
      setHighlightImpact(true);
    } catch (err) {
      console.error('Failed to extract impact keywords:', err);
      alert('Failed to highlight impact keywords. Please try again.');
    } finally {
      setHighlightLoading(false);
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
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: highlightLoading ? 'wait' : 'pointer',
              padding: '0.5rem 1rem',
              background: data.highlightImpact ? '#ecfdf5' : '#f9fafb',
              border: `1px solid ${data.highlightImpact ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            title="When enabled, AI will identify and bold impact-showing keywords in the preview and PDF"
          >
            <div
              style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                background: data.highlightImpact ? '#10b981' : '#d1d5db',
                borderRadius: '12px',
                transition: 'background 0.2s ease',
                opacity: highlightLoading ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: data.highlightImpact ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <input
              type="checkbox"
              checked={data.highlightImpact || false}
              onChange={(e) => handleHighlightToggle(e.target.checked)}
              disabled={highlightLoading}
              style={{ display: 'none' }}
            />
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: data.highlightImpact ? '#059669' : '#6b7280',
              }}
            >
              {highlightLoading ? 'Analyzing...' : 'Highlight Impact'}
            </span>
          </label>

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
              !hasAnyContent
                ? 'Add descriptions to your experiences or projects first.'
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => moveExperienceUp(idx)}
                  disabled={idx === 0}
                  style={{
                    background: idx === 0 ? '#f3f4f6' : '#e0f2fe',
                    color: idx === 0 ? '#9ca3af' : '#0369a1',
                    border: '1px solid',
                    borderColor: idx === 0 ? '#e5e7eb' : '#bae6fd',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveExperienceDown(idx)}
                  disabled={idx === experiences.length - 1}
                  style={{
                    background: idx === experiences.length - 1 ? '#f3f4f6' : '#e0f2fe',
                    color: idx === experiences.length - 1 ? '#9ca3af' : '#0369a1',
                    border: '1px solid',
                    borderColor: idx === experiences.length - 1 ? '#e5e7eb' : '#bae6fd',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: idx === experiences.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move down"
                >
                  ↓
                </button>
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
