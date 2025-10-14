import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateSummaryAI, improveSummaryGrammarAI } from '../api';
import { useLocation } from 'react-router-dom';

const StepSummary = () => {
  const { data, setData } = useResume();
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const location = useLocation();

  const normalizeSkills = () => {
    if (Array.isArray(data.skills)) {
      return data.skills.map((skill) => (skill || '').trim()).filter(Boolean);
    }
    if (typeof data.skills === 'string') {
      return data.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
    return [];
  };

  const buildExperienceText = () => {
    if (!Array.isArray(data.experiences) || data.experiences.length === 0) {
      return '';
    }

    const entries = data.experiences
      .map((exp) => {
        if (!exp) return '';

        const headerParts = [];
        if (exp.jobTitle) headerParts.push(exp.jobTitle);
        if (exp.company) headerParts.push(`at ${exp.company}`);
        const location = [exp.city, exp.state].filter(Boolean).join(', ');
        if (location) headerParts.push(location);

        let dates = '';
        if (exp.startDate || exp.endDate || exp.currentlyWorking) {
          const start = exp.startDate ? exp.startDate : '';
          const end = exp.currentlyWorking ? 'Present' : exp.endDate || '';
          if (start || end) {
            dates = start && end ? `${start} - ${end}` : (start || end);
          }
        }
        if (dates) headerParts.push(`(${dates})`);

        const header = headerParts.join(' ');
        const description = (exp.description || '').trim();

        return [header, description].filter(Boolean).join('\n');
      })
      .filter(Boolean);

    return entries.join('\n\n');
  };

  const buildEducationText = () => {
    if (Array.isArray(data.education) && data.education.length > 0) {
      return data.education
        .map((edu) => {
          if (!edu) return '';
          const degree = edu.degree || '';
          const field = edu.field ? ` in ${edu.field}` : '';
          const school = edu.school ? ` at ${edu.school}` : '';
          const formatMonthYear = (month, year) => {
            const safeMonth = (month || '').toString().trim();
            const safeYear = (year || '').toString().trim();
            if (safeMonth && safeYear) {
              return `${safeMonth} ${safeYear}`;
            }
            if (safeYear) {
              return safeYear;
            }
            if (safeMonth) {
              return safeMonth;
            }
            return '';
          };
          const startFormatted = formatMonthYear(edu.startMonth, edu.startYear);
          const gradFormatted = formatMonthYear(edu.graduationMonth, edu.graduationYear);
          let years = '';
          if (startFormatted && gradFormatted) {
            years = ` (${startFormatted} - ${gradFormatted})`;
          } else if (gradFormatted) {
            years = ` (${gradFormatted})`;
          } else if (startFormatted) {
            years = ` (${startFormatted} - Present)`;
          }
          return `${degree}${field}${school}${years}`.trim();
        })
        .filter(Boolean)
        .join(', ');
    }
    if (typeof data.education === 'string') {
      return data.education;
    }
    return '';
  };

  const getJobDescription = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'build' && pathParts[2]) {
      return decodeURIComponent(pathParts[2]);
    }
    return localStorage.getItem('jobDescription') || '';
  };

  const checkWithAI = async () => {
    try {
      setLoading(true);
      const jobDesc = getJobDescription();
      const experienceText = buildExperienceText();
      const educationText = buildEducationText();
      const skillsList = normalizeSkills();
      const hasSummary = Boolean(data.summary && data.summary.trim());
      const hasContext = Boolean(experienceText || educationText || skillsList.length || jobDesc);

      if (!hasSummary) {
        if (!hasContext) {
          alert('Please enter a summary first or add experience/education to generate one.');
          return;
        }

        const experiencePayload = [
          experienceText,
          jobDesc ? `Job Description:\n${jobDesc}` : ''
        ]
          .filter(Boolean)
          .join('\n\n');

        const suggestion = await generateSummaryAI({
          experience: experiencePayload,
          education: educationText,
          skills: skillsList,
        });
        setData({ ...data, summary: suggestion });
      } else {
        const improvedText = await improveSummaryGrammarAI(data.summary);
        setData({ ...data, summary: improvedText });
      }

      setAiMode(true);
    } catch (err) {
      alert('Failed to check with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Professional Summary</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
        Optional: A brief overview of your professional background and key qualifications.
      </p>

      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>Professional Summary</label>
      <textarea
        rows="4"
        value={data.summary}
        onChange={(e) => setData({ ...data, summary: e.target.value })}
        placeholder="Write a brief overview of your professional background, key skills, and career objectives..."
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '0.95rem',
          resize: 'vertical',
          marginBottom: '1rem'
        }}
      />

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={checkWithAI}
          disabled={loading}
          style={{
            background: aiMode ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
          title={
            getJobDescription() && !data.summary
              ? 'Generate summary based on job description'
              : data.summary
              ? 'Improve grammar and professionalism'
              : 'Add content to generate summary'
          }
        >
          {loading ? 'Checking...' : aiMode ? '✓ AI Enhanced' : '✨ Check with AI'}
        </button>
        {getJobDescription() && !data.summary && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
            💡 Tip: Click "Check with AI" to generate a summary based on your experience and the job description.
          </p>
        )}
      </div>
    </div>
  );
};

export default StepSummary;
