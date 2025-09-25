import React from 'react';
import LivePreview from './LivePreview';

const PaginationDemo = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Resume Pagination Demo</h2>
      <p>
        This demo renders the live preview inside a fixed-height container so you can verify how content flows across
        multiple pages when it exceeds the printable area.
      </p>
      <div style={{ height: '800px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <LivePreview isVisible={true} />
      </div>
    </div>
  );
};

export default PaginationDemo;
