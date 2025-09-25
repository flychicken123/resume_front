import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_OPTIONS } from '../constants/templates';
import { trackReferrer, trackBuilderStart } from '../components/Analytics';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { updateData } = useResume();

  // Track referrer when component loads
  React.useEffect(() => {
    trackReferrer();
    trackBuilderStart('templates_page');
  }, []);

  const templates = TEMPLATE_OPTIONS;

  const handleTemplateSelect = (templateId) => {
    updateData({ selectedFormat: templateId });
    trackReferrer();
    trackBuilderStart(`template_${templateId}`);
    navigate('/builder');
  };

  return (
    <div className="templates-page">
      <div className="templates-header">
        <h1>Choose Your Resume Template</h1>
        <p>Select a professional template that matches your industry and personal style</p>
      </div>
      
      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card" onClick={() => handleTemplateSelect(template.id)}>
            <div className="template-image">
              <img src={template.image} alt={template.name} />
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <button className="select-template-btn">Use This Template</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesPage;



