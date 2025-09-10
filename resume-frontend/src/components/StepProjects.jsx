// src/components/StepProjects.jsx
import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';

const StepProjects = () => {
  const { data, setData } = useResume();
  const [loadingIndex, setLoadingIndex] = useState(null);

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

  const moveProject = (index, direction) => {
    const updatedProjects = [...data.projects];
    if (direction === 'up' && index > 0) {
      [updatedProjects[index], updatedProjects[index - 1]] = 
      [updatedProjects[index - 1], updatedProjects[index]];
    } else if (direction === 'down' && index < updatedProjects.length - 1) {
      [updatedProjects[index], updatedProjects[index + 1]] = 
      [updatedProjects[index + 1], updatedProjects[index]];
    }
    setData({ ...data, projects: updatedProjects });
  };

  // Generate project description using AI (placeholder for future implementation)
  const improveProjectDescription = async (index) => {
    setLoadingIndex(index);
    try {
      // TODO: Implement AI assistance for project descriptions
      // For now, just show a message
      alert('AI assistance for project descriptions coming soon!');
    } catch (error) {
      console.error('Error improving project description:', error);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="step-content">
      <h2>Projects</h2>
      <p>Showcase your academic, personal, or professional projects. This is especially important if you have limited work experience.</p>
      
      {data.projects && data.projects.map((project, index) => (
        <div key={index} className="experience-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Project {index + 1}</h3>
            <div className="card-actions">
              {index > 0 && (
                <button 
                  type="button" 
                  onClick={() => moveProject(index, 'up')}
                  className="move-btn"
                  title="Move up"
                >
                  ↑
                </button>
              )}
              {index < data.projects.length - 1 && (
                <button 
                  type="button" 
                  onClick={() => moveProject(index, 'down')}
                  className="move-btn"
                  title="Move down"
                >
                  ↓
                </button>
              )}
              {data.projects.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeProject(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
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
                  onClick={() => improveProjectDescription(index)}
                  disabled={loadingIndex === index || !project.description}
                  className="ai-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: project.description ? 'pointer' : 'not-allowed',
                    opacity: project.description ? 1 : 0.5,
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {loadingIndex === index ? 'Improving...' : '✨ Improve with AI'}
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