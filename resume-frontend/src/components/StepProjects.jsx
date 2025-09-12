// src/components/StepProjects.jsx
import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { optimizeProjectAI, improveProjectGrammarAI } from '../api';
import { useLocation } from 'react-router-dom';

const StepProjects = () => {
  const { data, setData } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [aiMode, setAiMode] = useState({});
  const location = useLocation();
  
  // Extract job description from URL if present
  const getJobDescription = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'build' && pathParts[2]) {
      return decodeURIComponent(pathParts[2]);
    }
    return '';
  };

  // Initialize projects if not already
  React.useEffect(() => {
    if (!data.projects || data.projects.length === 0) {
      setData({ ...data, projects: [{
        projectName: '',
        description: '',
        technologies: '',
        projectUrl: ''
      }] });
    }
  }, []);

  const addProject = () => {
    const newProject = {
      projectName: '',
      description: '',
      technologies: '',
      projectUrl: ''
    };
    setData({ ...data, projects: [...data.projects, newProject] });
  };

  const updateProject = (index, field, value) => {
    const updatedProjects = [...data.projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setData({ ...data, projects: updatedProjects });
  };

  const removeProject = (index) => {
    const updatedProjects = data.projects.filter((_, i) => i !== index);
    setData({ ...data, projects: updatedProjects });
  };

  // Optimize project with AI based on job description or improve grammar
  const optimizeProjectWithAI = async (index) => {
    setLoadingIndex(index);
    try {
      const project = data.projects[index];
      const projectData = project.description || '';
      
      if (!projectData.trim()) {
        alert('Please add some project description first');
        return;
      }
      
      const jobDesc = getJobDescription();
      
      let optimizedDescription;
      if (jobDesc) {
        // Optimize for job description
        optimizedDescription = await optimizeProjectAI(projectData, jobDesc);
      } else {
        // Just improve grammar and professionalism
        optimizedDescription = await improveProjectGrammarAI(projectData);
      }
      
      updateProject(index, 'description', optimizedDescription);
      
      // Set AI mode for this project
      setAiMode(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error optimizing project:', error);
      alert('Failed to check project with AI. Please try again.');
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="step-content">
      <h2>Projects</h2>
      <p>Showcase your academic, personal, or professional projects. This is especially important if you have limited work experience.</p>
      
      {data.projects && data.projects.map((project, index) => (
        <div key={index} style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Project {index + 1}</h3>
            {data.projects.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeProject(index)}
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
          
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={project.projectName}
                onChange={(e) => updateProject(index, 'projectName', e.target.value)}
                placeholder="e.g., E-Commerce Platform"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Technologies Used</label>
            <input
              type="text"
              value={project.technologies}
              onChange={(e) => updateProject(index, 'technologies', e.target.value)}
              placeholder="e.g., React, Node.js, MongoDB, AWS"
            />
            <small>Separate technologies with commas</small>
          </div>
          
          <div className="form-group">
            <label>Project URL (GitHub, Demo, etc.)</label>
            <input
              type="url"
              value={project.projectUrl}
              onChange={(e) => updateProject(index, 'projectUrl', e.target.value)}
              placeholder="https://github.com/username/project"
            />
          </div>
          
          <div className="form-group">
            <label>Project Description</label>
            <div className="textarea-with-actions">
              <textarea
                value={project.description}
                onChange={(e) => updateProject(index, 'description', e.target.value)}
                placeholder="Describe your project using bullet points (one per line). Start each line with • or just write normally:&#10;• Built a full-stack web application using React and Node.js&#10;• Implemented user authentication and real-time chat features&#10;• Optimized database queries, reducing load time by 40%&#10;• Integrated third-party APIs for payment processing&#10;• Deployed application to AWS with CI/CD pipeline"
                rows={8}
              />
              <div className="textarea-actions" style={{ marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => optimizeProjectWithAI(index)}
                  disabled={loadingIndex === index || !project.description}
                  className="ai-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: aiMode[index] ? '#10b981' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: project.description ? 'pointer' : 'not-allowed',
                    opacity: project.description ? 1 : 0.5,
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  title={getJobDescription() ? "Optimize project for the job posting" : "Improve grammar and professionalism"}
                >
                  {loadingIndex === index ? 'Checking...' : aiMode[index] ? '✓ AI Enhanced' : '✨ Check with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <button 
          type="button" 
          onClick={addProject} 
          className="add-btn"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            width: '100%',
            maxWidth: '300px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#e5e7eb';
            e.target.style.borderColor = '#9ca3af';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
            e.target.style.borderColor = '#d1d5db';
          }}
        >
          + Add Another Project
        </button>
      </div>
      
      <div className="tips-section">
        <h4>💡 Tips for Projects Section:</h4>
        <ul>
          <li>Use bullet points in descriptions - one accomplishment per line</li>
          <li>Include both academic and personal projects that demonstrate your skills</li>
          <li>Focus on projects relevant to the job you're applying for</li>
          <li>Quantify impact where possible (e.g., "Reduced load time by 40%")</li>
          <li>Highlight technologies that match the job requirements</li>
          <li>Include links to live demos or GitHub repositories when available</li>
          <li>Start each bullet with an action verb (Built, Implemented, Designed, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default StepProjects;