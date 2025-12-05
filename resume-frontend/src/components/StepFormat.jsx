import React, { useState, useCallback, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_OPTIONS, normalizeTemplateId } from '../constants/templates';
import { trackReferrer, trackBuilderStart, trackTemplateSelectedEvent } from './Analytics';
import TemplateThumbnail from './TemplateThumbnail';
import { inferTemplatePreference } from '../api';
import './StepFormat.css';

const StepFormat = ({ onNext }) => {
  const { data, setData } = useResume();
  const [styleText, setStyleText] = useState('');
  const [isInferring, setIsInferring] = useState(false);
  const [inferError, setInferError] = useState('');

  // Track referrer when component loads
  useEffect(() => {
    trackReferrer();
    trackBuilderStart('format_step');
  }, []);

  const formats = TEMPLATE_OPTIONS.map(({ id, name, description }) => ({ id, name, description }));

  const fontSizes = [
    { id: 'small', name: 'Small', description: 'Compact text size' },
    { id: 'medium', name: 'Medium', description: 'Standard text size' },
    { id: 'large', name: 'Large', description: 'Larger, more readable text' },
    { id: 'extra-large', name: 'Extra Large', description: 'Maximum readability' }
  ];

  const handleFormatSelect = useCallback((formatId) => {
    const normalizedFormat = normalizeTemplateId(formatId);
    setData(prevData => ({ ...prevData, selectedFormat: normalizedFormat }));
    trackTemplateSelectedEvent(normalizedFormat, { page: window.location.pathname, source: 'format_step' });
  }, [setData]);

  const handleFontSizeSelect = useCallback((fontSizeId) => {
    setData(prevData => ({ ...prevData, selectedFontSize: fontSizeId }));
  }, [setData]);

  const handleInferPreference = async () => {
    const trimmed = (styleText || '').trim();
    if (!trimmed || isInferring) {
      return;
    }
    setIsInferring(true);
    setInferError('');
    try {
      const result = await inferTemplatePreference(trimmed);
      const templateId = normalizeTemplateId(result.template_id || result.templateId || '');
      const fontSizeId = (result.font_size_id || result.fontSizeId || '').trim();

      if (templateId) {
        handleFormatSelect(templateId);
      }
      if (fontSizeId) {
        handleFontSizeSelect(fontSizeId);
      }
    } catch (error) {
      setInferError(error?.message || 'Unable to understand your style description. Please try again.');
    } finally {
      setIsInferring(false);
    }
  };

  const selectedFormatId = normalizeTemplateId(data.selectedFormat);

  return (
    <div className="step-content" style={{ 
      flex: 'none', 
      height: 'fit-content', 
      padding: '1rem',
      maxWidth: '100%'
    }}>
      <h2 style={{ marginBottom: '0.25rem' }}>Choose Your Template and Format</h2>
      <p style={{ marginBottom: '1rem' }}>Pick a template style and font size, or describe your style and let AI choose for you.</p>

      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="format-style-text" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
          Describe your resume style (optional)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            id="format-style-text"
            type="text"
            value={styleText}
            onChange={(e) => setStyleText(e.target.value)}
            placeholder='e.g., "Modern clean look with medium font"'
            style={{
              flex: '1 1 260px',
              minWidth: '220px',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
            }}
          />
          <button
            type="button"
            onClick={handleInferPreference}
            disabled={isInferring || !styleText.trim()}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '999px',
              border: '1px solid #3b82f6',
              background: isInferring ? '#bfdbfe' : '#eff6ff',
              color: '#1d4ed8',
              fontWeight: 600,
              cursor: isInferring || !styleText.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isInferring ? 'Understanding style...' : 'Let AI pick for me'}
          </button>
        </div>
        {inferError && (
          <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
            {inferError}
          </span>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Templates</h3>
        <div className="template-options-grid">
          {formats.map((format) => (
            <div
              key={format.id}
              onClick={() => handleFormatSelect(format.id)}
              style={{
                padding: '0.75rem',
                border: selectedFormatId === format.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                backgroundColor: selectedFormatId === format.id ? '#eff6ff' : '#ffffff',
                transition: 'all 0.2s ease',
                boxShadow: selectedFormatId === format.id ? '0 12px 26px rgba(59, 130, 246, 0.18)' : '0 4px 12px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div style={{ marginBottom: '0.6rem' }}>
                <TemplateThumbnail templateId={format.id} width={190} />
              </div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#1f2937', fontSize: '1rem' }}>{format.name}</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Font Size</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {fontSizes.map((fontSize) => (
            <div
              key={fontSize.id}
              onClick={() => handleFontSizeSelect(fontSize.id)}
              style={{
                padding: '0.75rem',
                border: data.selectedFontSize === fontSize.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: data.selectedFontSize === fontSize.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#1f2937', fontSize: '1rem' }}>{fontSize.name}</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{fontSize.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepFormat; 

