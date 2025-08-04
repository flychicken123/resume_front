import React from 'react';

const buttonStyle = {
  minWidth: '120px',
  padding: '0.75rem 2rem',
  fontSize: '1.08rem',
  fontWeight: 500,
  borderRadius: '8px',
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 0.15s',
  margin: 0
};

const FormNavigation = ({ step, setStep, totalSteps }) => (
  <div className="navigation-btns" style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: 24 }}>
    {step > 0 && (
      <button style={buttonStyle} onClick={() => setStep(step - 1)}>Back</button>
    )}
    {step < totalSteps - 1 ? (
      <button style={buttonStyle} onClick={() => setStep(step + 1)}>Next</button>
    ) : (
      <button style={buttonStyle} onClick={() => alert("Ready to preview and download!")}>Finish</button>
    )}
  </div>
);

export default FormNavigation;