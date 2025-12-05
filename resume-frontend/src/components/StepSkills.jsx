import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { autoGenerateSkillsAI } from '../api';
import { useLocation } from 'react-router-dom';

const StepSkills = () => {
  const { data, setData } = useResume();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

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
          {loading ? 'Generating...' : 'Auto generate with AI'}
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
    </div>
  );
};

export default StepSkills;
