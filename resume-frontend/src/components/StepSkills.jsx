import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { autoGenerateSkillsAI, categorizeSkillsAI } from '../api';
import { useLocation } from 'react-router-dom';

const StepSkills = () => {
  const { data, setData } = useResume();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [categorizedText, setCategorizedText] = useState('');

  const formatCategorizedForDisplay = (input) => {
    const text = (input || '').trim();
    if (!text) return '';

    // If we already have blank lines between records, keep as is.
    if (/\n\s*\n/.test(text)) {
      return text;
    }

    // If we have multiple "<key>: <value>" pairs separated by semicolons,
    // split them and insert a blank line between each record for readability.
    if (text.includes(':') && text.includes(';')) {
      const parts = text
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length > 1) {
        return parts.join('\n\n');
      }
    }

    return text;
  };

  // Keep the categorized view in sync with persisted resume data so it
  // survives navigation and reloads until the user explicitly closes it.
  useEffect(() => {
    const formatted = formatCategorizedForDisplay(data.skillsCategorized);
    setCategorizedText(formatted);
    // We intentionally only depend on data.skillsCategorized so that typing in
    // the main skills textbox does not toggle the categorized view.
  }, [data.skillsCategorized]);

  const getJobDescription = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'build' && pathParts[2]) {
      return decodeURIComponent(pathParts[2]);
    }
    return localStorage.getItem('jobDescription') || '';
  };

  const handleAutoGenerate = async () => {
    if (!data) return;

    try {
      setLoading(true);
      const jobDescription = getJobDescription();
      const skillsText = await autoGenerateSkillsAI(data, jobDescription);

      if (typeof skillsText === 'string' && skillsText.trim()) {
        setData({ ...data, skills: skillsText });
      } else if (!skillsText) {
        alert('AI could not extract any skills yet. Try adding more experience, projects, or education.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to auto-generate skills:', error);
      alert('Failed to auto-generate skills from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    const current = (data.skills || '').trim();
    if (!current) {
      alert('Please enter some skills first before categorizing.');
      return;
    }

    try {
      setLoading(true);
      const jobDescription = getJobDescription();
      const formatted = await categorizeSkillsAI(current, jobDescription);
      const next = typeof formatted === 'string' ? formatted.trim() : '';

      if (next) {
        const displayValue = formatCategorizedForDisplay(next);
        setCategorizedText(displayValue);
        // Persist categorized skills into shared resume data so the preview can use it.
        setData({ ...data, skillsCategorized: displayValue });
      } else {
        alert('AI could not categorize your skills yet. Try refining your skills list.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to categorize skills:', error);
      alert('Failed to categorize skills with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCategorized = () => {
    // Hide the categorized view and clear the categorized value used by preview.
    setCategorizedText('');
    setData({ ...data, skillsCategorized: '' });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ fontWeight: 500 }}>Skills (comma separated)</label>
        <button
          type="button"
          onClick={handleAutoGenerate}
          disabled={loading}
          style={{
            padding: '0.35rem 0.85rem',
            backgroundColor: loading ? '#e5e7eb' : '#3b82f6',
            color: loading ? '#6b7280' : '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Working with AI...' : 'Auto generate with AI'}
        </button>
      </div>
      <input
        type="text"
        value={data.skills}
        onChange={(e) => setData({ ...data, skills: e.target.value })}
        placeholder="Go, Python, AWS"
        style={{
          width: '100%',
          padding: '0.6rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '0.9rem',
        }}
      />
      {/* Categorize skills button temporarily hidden */}
      {categorizedText && (
        <div style={{ marginTop: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem',
              gap: '0.75rem',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#6b7280',
              }}
            >
              Categorized view
            </label>
            <button
              type="button"
              onClick={handleCloseCategorized}
              style={{
                padding: '0.25rem 0.6rem',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Close view
            </button>
          </div>
          <textarea
            readOnly
            value={categorizedText}
            rows={10}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.6rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.85rem',
              minHeight: '220px',
              resize: 'vertical',
              backgroundColor: '#f9fafb',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StepSkills;
