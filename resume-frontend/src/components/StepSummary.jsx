import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateSummaryAI, improveSummaryGrammarAI } from '../api';

const StepSummary = () => {
  const { data, setData } = useResume();
  const [loading, setLoading] = useState(false);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [grammarImprovedSummary, setGrammarImprovedSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Load job description from localStorage
  useEffect(() => {
    const savedJobDesc = localStorage.getItem('jobDescription');
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
    }
  }, []);

  const handleAIGenerate = async () => {
    try {
      if (!jobDescription.trim()) {
        alert('AI summary generation requires a job description. You can still write your summary manually, or go back to the home page to start with a job description.');
        return;
      }
      
      setLoading(true);
      // Convert education array to string format for AI
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
      setAiSummary(suggestion);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrammarImprove = async () => {
    try {
      if (!data.summary.trim()) {
        alert('Please enter your summary first.');
        return;
      }
      
      setGrammarLoading(true);
      const improvedText = await improveSummaryGrammarAI(data.summary);
      setGrammarImprovedSummary(improvedText);
    } catch (err) {
      alert(err.message);
    } finally {
      setGrammarLoading(false);
    }
  };

  const useAISummary = () => {
    if (aiSummary) {
      setData({ ...data, summary: aiSummary });
    }
  };

  const useGrammarImprovedSummary = () => {
    if (grammarImprovedSummary) {
      setData({ ...data, summary: grammarImprovedSummary });
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
      
      {/* AI Helper Section - Always available */}
      <div style={{ 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '6px', 
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.95rem' }}>🤖 AI Assistance</h4>
        
        {/* Grammar/Refactor Button - Always Available */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <button
              onClick={handleGrammarImprove}
              disabled={grammarLoading || !data.summary.trim()}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: grammarLoading ? 'not-allowed' : 'pointer',
                opacity: grammarLoading || !data.summary.trim() ? 0.5 : 1
              }}
            >
              {grammarLoading ? '✨ Improving...' : '✨ AI Improve Grammar & Style'}
            </button>
            
            {grammarImprovedSummary && (
              <button
                onClick={useGrammarImprovedSummary}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ✅ Use Improved Version
              </button>
            )}
          </div>
          
          {grammarImprovedSummary && (
            <div style={{ 
              background: 'white', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px', 
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: '#374151',
              marginBottom: '1rem'
            }}>
              <strong>AI-Improved Summary:</strong>
              <div style={{ marginTop: '0.5rem' }}>{grammarImprovedSummary}</div>
            </div>
          )}
        </div>

        {/* Job-Based Generation - Only with job description */}
        {jobDescription && jobDescription.trim() && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <button
                onClick={handleAIGenerate}
                disabled={loading}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? '🎯 Generating...' : '🎯 AI Generate Summary for Job Description'}
              </button>
              
              {aiSummary && (
                <button
                  onClick={useAISummary}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Use Generated Summary
                </button>
              )}
            </div>
            
            {aiSummary && (
              <div style={{ 
                background: 'white', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px', 
                padding: '0.75rem',
                fontSize: '0.875rem',
                color: '#374151'
              }}>
                <strong>Job-Optimized Summary:</strong>
                <div style={{ marginTop: '0.5rem' }}>{aiSummary}</div>
              </div>
            )}
          </div>
        )}

        {(!jobDescription || !jobDescription.trim()) && (
          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '4px', 
            padding: '0.75rem',
            fontSize: '0.85rem',
            color: '#92400e'
          }}>
            💡 <strong>Job-Based Generation Unavailable:</strong> To get AI summary generation based on job requirements, go back to the home page and start with a job description.
          </div>
        )}
      </div>
    </div>
  );
}
export default StepSummary;