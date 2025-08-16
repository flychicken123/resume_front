import React from 'react';

const Stepper = ({ steps, currentStep, setStep }) => (
  <>
    {steps.map((label, idx) => (
      <div
        key={idx}
        className={`stepper-step ${idx + 1 === currentStep ? 'active' : ''} ${idx + 1 < currentStep ? 'completed' : ''}`}
        onClick={() => setStep(idx + 1)}
      >
        {label}
      </div>
    ))}
  </>
);

export default Stepper;