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
    <div className="step-content" style={{ 
      flex: 'none', 
      height: 'fit-content', 
      padding: '1rem',
      maxWidth: '100%'
    }}>
      <h2 style={{ marginBottom: '0.25rem' }}>Choose Your Template and Format</h2>
      <p style={{ marginBottom: '1rem' }}>Pick a template style and font size. You can change these anytime.</p>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Templates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {formats.map((format) => (
            <div
              key={format.id}
              onClick={() => handleFormatSelect(format.id)}
              style={{
                padding: '0.75rem',
                border: data.selectedFormat === format.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: data.selectedFormat === format.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
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
