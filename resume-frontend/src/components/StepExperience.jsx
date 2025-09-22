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

const StepExperience = () => {
  const { data, setData } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [aiMode, setAiMode] = useState({});
  const location = useLocation();

  const experiences = Array.isArray(data?.experiences) ? data.experiences : [];

  const updateExperiences = useCallback((updater) => {
    setData((prev) => {
      const current = Array.isArray(prev?.experiences) ? prev.experiences : [];
      const next = updater(current);
      if (!next) {
        return prev;
      }
      if (current.length === next.length && current.every((item, idx) => item === next[idx])) {
        return prev;
      }
      return { ...prev, experiences: next };
    });
  }, [setData]);

  useEffect(() => {
    if (!Array.isArray(data?.experiences)) {
      updateExperiences(() => []);
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
  return (
    <div>
      <h2>Work Experience</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
        * Required fields. Experience will only appear in your resume when both Job Title and Employer are filled.
      </p>
      {getJobDescription() && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
            🎯 <strong>AI Optimization Available:</strong> Use the "Check with AI" button to optimize your experiences based on the job description.
          </p>
        </div>
      )}

      {(experiences.length === 0) ? (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>No work experience added yet.</strong>
          </p>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem', marginBottom: '1rem' }}>
            If you're a student or new graduate without work experience, you can skip this section and highlight your projects instead.
          </p>
        </div>
      ) : experiences.map((exp, idx) => (
        <div key={idx} style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Experience {idx + 1}</h3>
            <button
              onClick={() => removeExperience(idx)}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                JOB TITLE *
              </label>
              <input
                type="text"
                value={exp.jobTitle}
                onChange={e => handleChange(idx, 'jobTitle', e.target.value)}
                placeholder="e.g., Software Engineer"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                EMPLOYER *
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={e => handleChange(idx, 'company', e.target.value)}
                placeholder="e.g., Google"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                CITY
              </label>
              <input
                type="text"
                value={exp.city}
                onChange={e => handleChange(idx, 'city', e.target.value)}
                placeholder="e.g., San Francisco"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                STATE/REGION
              </label>
              <input
                type="text"
                value={exp.state}
                onChange={e => handleChange(idx, 'state', e.target.value)}
                placeholder="e.g., CA"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                START DATE
              </label>
              <input
                type="date"
                value={exp.startDate}
                onChange={e => handleChange(idx, 'startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                END DATE
              </label>
              <input
                type="date"
                value={exp.endDate}
                onChange={e => handleChange(idx, 'endDate', e.target.value)}
                disabled={exp.currentlyWorking}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  cursor: exp.currentlyWorking ? 'not-allowed' : 'pointer',
                  background: exp.currentlyWorking ? '#f9fafb' : 'white',
                  opacity: exp.currentlyWorking ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500
            }}>
              <input
                type="checkbox"
                checked={exp.currentlyWorking}
                onChange={e => handleChange(idx, 'currentlyWorking', e.target.checked)}
                style={{
                  margin: 0,
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#3b82f6'
                }}
              />
              <span>I currently work here</span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              Experience Description
            </label>
            <textarea
              rows="4"
              value={exp.description}
              onChange={e => handleChange(idx, 'description', e.target.value)}
              placeholder="Describe your responsibilities, achievements, and key contributions..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => checkWithAI(idx)}
              disabled={loadingIndex === idx || !(exp.description || '').trim()}
              style={{
                background: aiMode[idx] ? '#10b981' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: loadingIndex === idx || !(exp.description || '').trim() ? 'not-allowed' : 'pointer',
                opacity: loadingIndex === idx || !(exp.description || '').trim() ? 0.5 : 1
              }}
              title={getJobDescription() ? 'Optimize experience for the job posting' : 'Improve grammar and professionalism'}
            >
              {loadingIndex === idx ? 'Checking...' : aiMode[idx] ? '✓ AI Enhanced' : '✨ Check with AI'}
            </button>
          </div>
        </div>
      ))}

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
          marginTop: '1rem'
        }}
      >
        + {experiences.length === 0 ? 'Add Work Experience' : 'Add Another Experience'}
      </button>

      {experiences.length > 0 && (
        <div style={{ marginTop: '1.5rem', background: '#f9fafb', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
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
            fontSize: '0.9rem'
          }}
        >
          Remove all experiences
        </button>
      )}
    </div>
  );
};

export default StepExperience;



