import React, { useState } from 'react';
import './TemplateGallery.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackBuilderStart } from './Analytics';
import { normalizeTemplateId, TEMPLATE_SLUGS } from '../constants/templates';

const TemplateGallery = ({ onSelectTemplate, showAuthModal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const templates = [
    {
      id: TEMPLATE_SLUGS.MODERN_CLEAN,
      name: 'Modern Professional',
      category: 'professional',
      description: 'Clean and contemporary design perfect for tech and creative roles',
      preview: 'https://marketplace.canva.com/EAFRuCp3DcY/1/0/1131w/canva-black-white-minimalist-cv-resume-F2IQ3yjiRJY.jpg',
      features: ['ATS-Optimized', 'Clean Layout', 'Tech-Friendly'],
      popular: true,
      color: '#2563eb'
    },
    {
      id: 'executive',
      name: 'Executive',
      category: 'professional',
      description: 'Sophisticated design for senior-level positions',
      preview: 'https://marketplace.canva.com/EAE8mhdnw_g/2/0/1131w/canva-gray-and-white-simple-clean-resume-TFq26l7yBrI.jpg',
      features: ['Leadership Focus', 'Achievement-Based', 'Premium Look'],
      popular: true,
      color: '#1e293b'
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      category: 'creative',
      description: 'Stand out with a unique design for creative professionals',
      preview: 'https://marketplace.canva.com/EAFJMlu5R1k/1/0/1131w/canva-blue-modern-professional-cv-resume-x6ElPaEV50c.jpg',
      features: ['Visual Impact', 'Portfolio Ready', 'Unique Layout'],
      popular: false,
      color: '#8b5cf6'
    },
    {
      id: 'simple',
      name: 'Simple & Clean',
      category: 'simple',
      description: 'Minimalist design that focuses on your content',
      preview: 'https://marketplace.canva.com/EAFoR61Oq7c/1/0/1131w/canva-white-simple-student-cv-resume-M9k2K1qAepI.jpg',
      features: ['Minimalist', 'Easy to Read', 'Classic Style'],
      popular: false,
      color: '#64748b'
    },
    {
      id: 'technical',
      name: 'Technical Pro',
      category: 'professional',
      description: 'Perfect for engineers and technical professionals',
      preview: 'https://marketplace.canva.com/EAFJMSqYqCA/1/0/1131w/canva-professional-resume-cv-eqOQIKD54rc.jpg',
      features: ['Skills Focused', 'Project Showcase', 'Tech Stack'],
      popular: true,
      color: '#059669'
    },
    {
      id: 'academic',
      name: 'Academic',
      category: 'professional',
      description: 'Ideal for researchers and academic positions',
      preview: 'https://marketplace.canva.com/EAE8gA4x-Zs/1/0/1131w/canva-professional-minimalist-cv-resume-tNDmnu6VaHg.jpg',
      features: ['Publications', 'Research Focus', 'Detailed CV'],
      popular: false,
      color: '#7c3aed'
    },
    {
      id: 'startup',
      name: 'Startup Ready',
      category: 'modern',
      description: 'Dynamic template for startup and growth roles',
      preview: 'https://marketplace.canva.com/EAFczWRfcSo/1/0/1131w/canva-white-and-black-minimalist-resume-eI47V5Lq0CU.jpg',
      features: ['Impact Metrics', 'Growth Focus', 'Modern Design'],
      popular: true,
      color: '#dc2626'
    },
    {
      id: 'finance',
      name: 'Finance Professional',
      category: 'professional',
      description: 'Conservative design for finance and consulting',
      preview: 'https://marketplace.canva.com/EAFJTqgsO8o/1/0/1131w/canva-black-and-white-simple-corporate-resume-K7OqfWp6BFE.jpg',
      features: ['Data Driven', 'Results Oriented', 'Professional'],
      popular: false,
      color: '#0f766e'
    },
    {
      id: 'sales',
      name: 'Sales Champion',
      category: 'modern',
      description: 'Results-focused template for sales professionals',
      preview: 'https://marketplace.canva.com/EAFoEJvCF0w/1/0/1131w/canva-gray-minimalist-resume-o94jHJZz5SE.jpg',
      features: ['Metrics Heavy', 'Achievement Focus', 'Bold Design'],
      popular: false,
      color: '#ea580c'
    },
    {
      id: 'marketing',
      name: 'Marketing Expert',
      category: 'creative',
      description: 'Creative yet professional for marketing roles',
      preview: 'https://marketplace.canva.com/EAFGgedXHeg/1/0/1131w/canva-professional-modern-cv-resume-z_p8r_qNxJk.jpg',
      features: ['Campaign Ready', 'Visual Appeal', 'Brand Focused'],
      popular: true,
      color: '#e11d48'
    },
    {
      id: 'healthcare',
      name: 'Healthcare Pro',
      category: 'professional',
      description: 'Clean template for healthcare professionals',
      preview: 'https://marketplace.canva.com/EAFczP0GTzc/1/0/1131w/canva-simple-professional-cv-resume-OFfVNlnB8gI.jpg',
      features: ['Certification Ready', 'Clinical Focus', 'Clean Layout'],
      popular: false,
      color: '#0891b2'
    },
    {
      id: 'educator',
      name: 'Educator',
      category: 'simple',
      description: 'Thoughtful design for teaching professionals',
      preview: 'https://marketplace.canva.com/EAFczJp99mU/1/0/1131w/canva-grey-clean-cv-resume-photo-BW9Rw4B4pV4.jpg',
      features: ['Curriculum Focus', 'Student Impact', 'Clear Format'],
      popular: false,
      color: '#a855f7'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: '🎨' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'creative', name: 'Creative', icon: '🎭' },
    { id: 'modern', name: 'Modern', icon: '✨' },
    { id: 'simple', name: 'Simple', icon: '📄' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template) => {
    const normalizedId = normalizeTemplateId(template.id);
    trackBuilderStart('template_selected', { templateId: normalizedId });
    
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
              <img 
                src={template.preview} 
                alt={`${template.name} resume template`}
                className="template-image"
                loading="lazy"
              />
              
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
            onClick={() => handleTemplateSelect(templates.find(t => t.id === TEMPLATE_SLUGS.MODERN_CLEAN))}
          >
            Get Started with Modern Professional →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;