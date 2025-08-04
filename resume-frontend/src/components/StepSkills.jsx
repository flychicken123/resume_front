import React from 'react';
import { useResume } from '../context/ResumeContext';

const StepSkills = () => {
  const { data, setData } = useResume();
  return (
    <div>
      <label>Skills (comma separated)</label>
      <input
        type="text"
        value={data.skills}
        onChange={(e) => setData({ ...data, skills: e.target.value })}
        placeholder="Go, Python, AWS"
      />
    </div>
  );
}
export default StepSkills;