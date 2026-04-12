import React, { useState } from 'react';
import './TemplateGallery.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackBuilderStart, trackTemplateSelectedEvent, trackCTAClick } from './Analytics';
import { normalizeTemplateId, TEMPLATE_SLUGS, TEMPLATE_OPTIONS } from '../constants/templates';
import TemplateThumbnail from './TemplateThumbnail';

const TemplateGallery = ({ onSelectTemplate, showAuthModal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const templateDisplayConfig = {
    [TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL]: {
      category: 'professional',
      features: ['Traditional Layout', 'ATS Optimized', 'Easy to Scan'],
      color: '#1d4ed8',
      popular: true,
    },
    [TEMPLATE_SLUGS.MODERN_CLEAN]: {
      category: 'modern',
      features: ['Contemporary Style', 'Clean Sections', 'ATS Optimized'],
      color: '#2563eb',
      popular: true,
    },
    [TEMPLATE_SLUGS.EXECUTIVE_SERIF]: {
      category: 'executive',
      features: ['Serif Typography', 'Leadership Focus', 'Refined Layout'],
      color: '#111827',
      popular: false,
    },
    [TEMPLATE_SLUGS.ATTORNEY_TEMPLATE]: {
      category: 'professional',
      features: ['Legal Formatting', 'Courtroom Highlights', 'Bar Admissions Spotlight'],
      color: '#0f172a',
      popular: false,
    },
  };

  const templates = TEMPLATE_OPTIONS.map((template) => {
    const overrides = templateDisplayConfig[template.id] || {};
    return {
      id: template.id,
      name: overrides.name || template.name,
      description: overrides.description || template.description,
      preview: template.image,
      image: template.image,
      features: overrides.features || [],
      popular: overrides.popular ?? false,
      color: overrides.color || '#2563eb',
      category: overrides.category || 'professional',
    };
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: '🎨' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'modern', name: 'Modern', icon: '⚡' },
    { id: 'executive', name: 'Executive', icon: '🏛️' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template) => {
    const normalizedId = normalizeTemplateId(template.id);
    trackBuilderStart('template_selected', { templateId: normalizedId });
    trackTemplateSelectedEvent(normalizedId, { page: window.location.pathname });
    
    if (!user) {
      showAuthModal(true);
    } else if (onSelectTemplate) {
      onSelectTemplate({ ...template, id: normalizedId });
    } else {
      // Navigate to builder with selected template
      navigate('/builder', { state: { selectedTemplate: normalizedId } });
    }
  };

  return (
    <div className="template-gallery">
      <div className="template-gallery-header">
        <h2 className="gallery-title">
          <span className="title-icon">🎨</span>
          Choose Your Perfect Resume Template
        </h2>
        <p className="gallery-subtitle">
          Professional templates designed to pass ATS systems and impress recruiters. 
          Each template is optimized for different industries and career levels.
        </p>
      </div>

      {/* Category Filter */}
      <div className="template-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">
              {category.id === 'all' 
                ? templates.length 
                : templates.filter(t => t.category === category.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`template-card ${hoveredTemplate === template.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            {template.popular && (
              <div className="popular-badge">
                <span>⭐ Popular</span>
              </div>
            )}
            
            <div className="template-preview" style={{ borderColor: template.color }}>
              <div className="template-thumbnail-holder">
                <TemplateThumbnail templateId={template.id} width={240} />
              </div>
              <div className="template-overlay">
                <button 
                  className="use-template-btn"
                  onClick={() => handleTemplateSelect(template)}
                >
                  Use This Template
                </button>
                <button 
                  className="preview-btn"
                  onClick={() => window.open(template.preview, '_blank')}
                >
                  <span>👁️ Full Preview</span>
                </button>
              </div>
            </div>

            <div className="template-info">
              <h3 className="template-name">{template.name}</h3>
              <p className="template-description">{template.description}</p>
              
              <div className="template-features">
                {template.features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="template-gallery-cta">
        <div className="cta-content">
          <h3>Can't decide? Start with our most popular template!</h3>
          <p>You can always change your template later</p>
          <button 
            className="cta-button"
            onClick={() => {
              trackCTAClick('template_gallery_popular_cta', { page: window.location.pathname });
              handleTemplateSelect(templates.find(t => t.id === TEMPLATE_SLUGS.MODERN_CLEAN));
            }}
          >
            Get Started with Modern Professional →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
