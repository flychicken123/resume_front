import React from 'react';

const Stepper = ({ steps, currentStep, setStep }) => (
  <div className="stepper">
    {steps.map((label, idx) => (
      <div
        key={idx}
        className={`step ${idx + 1 === currentStep ? 'active' : ''}`}
        style={{ cursor: 'pointer' }}
        onClick={() => setStep(idx + 1)}
      >
        {label}
      </div>
    ))}
  </div>
);

export default Stepper;