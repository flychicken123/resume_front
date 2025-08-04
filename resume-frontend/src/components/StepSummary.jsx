import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateSummaryAI } from '../api';

const StepSummary = () => {
  const { data, setData } = useResume();
  const [loading, setLoading] = useState(false);

  const handleAIGenerate = async () => {
    try {
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
      setData({ ...data, summary: suggestion });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label>Professional Summary</label>
      <textarea
        rows="4"
        value={data.summary}
        onChange={(e) => setData({ ...data, summary: e.target.value })}
        placeholder="Optional: let AI help you craft a summary..."
      />
      <button
        type="button"
        onClick={handleAIGenerate}
        disabled={loading}
        style={{ marginTop: 8 }}
      >
        {loading ? 'Generating...' : 'Generate with AI'}
      </button>
    </div>
  );
}
export default StepSummary;