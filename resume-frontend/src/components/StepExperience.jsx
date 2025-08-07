// src/components/StepExperience.jsx
import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateExperienceAI } from '../api';
import { useParams } from 'react-router-dom';

const StepExperience = () => {
  const { data, setData } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [aiExperiences, setAiExperiences] = useState({});
  const params = useParams();
  const jobDescription = params.jobDescription ? decodeURIComponent(params.jobDescription) : '';

  // Initialize experiences as structured objects if not already
  React.useEffect(() => {
    if (!data.experiences || data.experiences.length === 0) {
      setData({ ...data, experiences: [{
        jobTitle: '',
        company: '',
        city: '',
        state: '',
        remote: false,
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: ''
      }] });
    }
  }, []);

  const addExperience = () => {
    const newExperience = {
      jobTitle: '',
      company: '',
      city: '',
      state: '',
      remote: false,
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: ''
    };
    setData({ ...data, experiences: [...data.experiences, newExperience] });
  };

  const removeExperience = (idx) => {
    const newList = data.experiences.filter((_, i) => i !== idx);
    setData({ ...data, experiences: newList });
  };

  const handleChange = (idx, field, value) => {
    const newList = [...data.experiences];
    newList[idx] = { ...newList[idx], [field]: value };
    setData({ ...data, experiences: newList });
  };

  const handleAIGenerate = async (idx) => {
    try {
      setLoadingIndex(idx);
      const experience = data.experiences[idx];
      
      if (!experience.description.trim()) {
        alert('Please enter your job description first before converting.');
        return;
      }
      
      if (!jobDescription.trim()) {
        alert('No job description available. Please start building with a job description to use this feature.');
        return;
      }
      
      // Send only the description to AI for optimization
      const experienceText = experience.description;
      
      const suggestion = await generateExperienceAI(experienceText, jobDescription);
      setAiExperiences(prev => ({ ...prev, [idx]: suggestion }));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const useAIExperience = (idx) => {
    if (aiExperiences[idx]) {
      handleChange(idx, 'description', aiExperiences[idx]);
    }
  };

  const formatExperienceForResume = (exp) => {
    const location = exp.city && exp.state ? `${exp.city}, ${exp.state}` : exp.city || exp.state || '';
    const dates = exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.currentlyWorking ? 'Present' : exp.endDate}` : '';
    
    let formatted = '';
    if (exp.jobTitle && exp.company) {
      formatted += `${exp.jobTitle} | ${exp.company}`;
      if (location) formatted += ` | ${location}`;
      if (dates) formatted += ` | ${dates}`;
    }
    if (exp.description) {
      formatted += `\n${exp.description}`;
    }
    return formatted;
  };

  return (
    <div>
      <h2>Work Experience</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
        * Required fields. Experience will only appear in your resume when both Job Title and Employer are filled.
      </p>
      {jobDescription && (
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
            🎯 <strong>Job Description Available:</strong> Use the "AI Convert" button below each experience to optimize it based on the job requirements.
          </p>
        </div>
      )}
      
      {data.experiences.map((exp, idx) => (
        <div key={idx} style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Experience {idx + 1}</h3>
            {data.experiences.length > 1 && (
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
            )}
          </div>
          
          {/* Job Details Form */}
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
                disabled={exp.remote}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  background: exp.remote ? '#f9fafb' : 'white',
                  opacity: exp.remote ? 0.5 : 1
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                STATE
              </label>
              <input
                type="text"
                value={exp.state}
                onChange={e => handleChange(idx, 'state', e.target.value)}
                placeholder="e.g., CA"
                disabled={exp.remote}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  background: exp.remote ? '#f9fafb' : 'white',
                  opacity: exp.remote ? 0.5 : 1
                }}
              />
            </div>
            
            {/* Remote Work Checkbox */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
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
                  checked={exp.remote || false}
                  onChange={e => handleChange(idx, 'remote', e.target.checked)}
                  style={{ 
                    margin: 0,
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
                <span>Remote work</span>
              </label>
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
          
          {/* Currently Working Checkbox */}
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
          
          {/* Job Description */}
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

          {/* AI Conversion Section */}
          {jobDescription && (
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px', 
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={() => handleAIGenerate(idx)}
                  disabled={loadingIndex === idx || !exp.description.trim()}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: loadingIndex === idx ? 'not-allowed' : 'pointer',
                    opacity: loadingIndex === idx || !exp.description.trim() ? 0.5 : 1
                  }}
                >
                  {loadingIndex === idx ? '🤖 Converting...' : '🤖 AI Convert Based on Job Description'}
                </button>
                
                {aiExperiences[idx] && (
                  <button
                    onClick={() => useAIExperience(idx)}
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
                    ✅ Use AI Version
                  </button>
                )}
              </div>
              
              {aiExperiences[idx] && (
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  <strong>AI-Optimized Description:</strong>
                  <div style={{ marginTop: '0.5rem' }}>{aiExperiences[idx]}</div>
                </div>
              )}
            </div>
          )}
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
        + Add Another Experience
      </button>
    </div>
  );
};

export default StepExperience;
