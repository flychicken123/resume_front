import React from 'react';
import { useResume } from '../context/ResumeContext';
import { trackReferrer, trackBuilderStart } from './Analytics';

const StepFormat = ({ onNext }) => {
  const { data, setData } = useResume();

  // Track referrer when component loads
  React.useEffect(() => {
    trackReferrer();
    trackBuilderStart('format_step');
  }, []);

  const formats = [
    { id: 'temp1', name: 'Classic Professional', description: 'Traditional layout with clean typography' },
    { id: 'modern', name: 'Modern Clean', description: 'Contemporary design with blue accents' },
    { id: 'industry-manager', name: 'Industry Manager', description: 'Executive style with serif fonts' }
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', description: 'Compact text size' },
    { id: 'medium', name: 'Medium', description: 'Standard text size' },
    { id: 'large', name: 'Large', description: 'Larger, more readable text' },
    { id: 'extra-large', name: 'Extra Large', description: 'Maximum readability' }
  ];

  const handleFormatSelect = (formatId) => {
    setData(prevData => ({ ...prevData, selectedFormat: formatId }));
  };

  const handleFontSizeSelect = (fontSizeId) => {
    setData(prevData => ({ ...prevData, selectedFontSize: fontSizeId }));
  };

  const handleNext = () => {
    if (data.selectedFormat) {
      onNext();
    }
  };

  return (
    <div className="step-content">
      <h2>Choose Your Resume Format</h2>
      <p>Select a template style and font size that best represents your professional image.</p>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Template Style</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {formats.map((format) => (
            <div
              key={format.id}
              onClick={() => handleFormatSelect(format.id)}
              style={{
                padding: '1.5rem',
                border: data.selectedFormat === format.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: data.selectedFormat === format.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{format.name}</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Font Size</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {fontSizes.map((fontSize) => (
            <div
              key={fontSize.id}
              onClick={() => handleFontSizeSelect(fontSize.id)}
              style={{
                padding: '1.5rem',
                border: data.selectedFontSize === fontSize.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: data.selectedFontSize === fontSize.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{fontSize.name}</h4>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{fontSize.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation">
        <div></div>
        <button onClick={handleNext} disabled={!data.selectedFormat}>
          {data.selectedFormat ? 'Format settings configured ✓' : 'Please select a format'}
        </button>
      </div>
    </div>
  );
};

export default StepFormat; 