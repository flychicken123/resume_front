import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateSummaryAI, improveSummaryGrammarAI } from '../api';
import { useLocation } from 'react-router-dom';

const StepSummary = () => {
  const { data, setData } = useResume();
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const location = useLocation();
  
  // Extract job description from URL if present
  const getJobDescription = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'build' && pathParts[2]) {
      return decodeURIComponent(pathParts[2]);
    }
    // Fallback to localStorage
    return localStorage.getItem('jobDescription') || '';
  };

  const checkWithAI = async () => {
    try {
      setLoading(true);
      const jobDesc = getJobDescription();
      
      if (jobDesc && (!data.summary || data.summary.trim() === '')) {
        // Generate new summary based on job description
        const educationText = Array.isArray(data.education) 
          ? data.education.map(edu => 
              `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.school}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}`
            ).join(', ')
          : data.education;
        
        const suggestion = await generateSummaryAI({ 
          experience: data.experience, 
          education: educationText, 
          skills: data.skills.split(',').map(s => s.trim()) 
        });
        setData({ ...data, summary: suggestion });
      } else if (data.summary && data.summary.trim()) {
        // Improve existing summary
        const improvedText = await improveSummaryGrammarAI(data.summary);
        setData({ ...data, summary: improvedText });
      } else {
        alert('Please enter a summary first or add experience/education to generate one.');
        return;
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
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>Optional: A brief overview of your professional background and key qualifications.</p>
      
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
      
      {/* AI Check Button */}
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
              ? "Generate summary based on job description" 
              : data.summary 
              ? "Improve grammar and professionalism" 
              : "Add content to generate summary"
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
}
export default StepSummary;