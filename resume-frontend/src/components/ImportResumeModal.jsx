import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const ImportResumeModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { applyImportedData } = useResume();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert('Please choose a resume file (.pdf, .docx, .txt).');
      return;
    }
    try {
      setIsLoading(true);
      const form = new FormData();
      form.append('resume', file);
      const resp = await fetch(`${getAPIBaseURL()}/api/resume/parse`, {
        method: 'POST',
        body: form,
      });
      const text = await resp.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) {}
      if (!resp.ok || !json) {
        throw new Error((json && (json.error || json.message)) || `Parse failed (${resp.status})`);
      }
      if (json.structured) {
        applyImportedData(json.structured);
      }
      onClose();
      navigate('/builder');
    } catch (e) {
      console.error('Parse error:', e);
      alert('Failed to parse the resume. Please try another file or continue manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManual = () => {
    onClose();
    navigate('/builder');
  };

  return (
    <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.25)', zIndex:210, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', borderRadius:12, padding:'1.75rem', width:'92%', maxWidth:520, position:'relative', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'}}>
        <button onClick={onClose} aria-label="Close" style={{position:'absolute', top:12, right:12, background:'none', border:'none', fontSize:22, cursor:'pointer'}}>×</button>
        <h3 style={{marginTop:0, marginBottom:'0.75rem'}}>Import Your Existing Resume</h3>
        <p style={{color:'#6b7280', marginTop:0}}>Save time by importing your current resume, or start manually.</p>
        <div style={{border:'1px dashed #d1d5db', borderRadius:8, padding:'1rem', marginBottom:'1rem'}}>
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        </div>
        <div style={{display:'flex', gap:'0.75rem', justifyContent:'center'}}>
          <button type="button" onClick={handleManual} disabled={isLoading} style={{padding:'0.75rem 1rem', border:'2px solid #d1d5db', borderRadius:8, background:'white', cursor:'pointer', minWidth:160}}>Start Manually</button>
          <button type="button" onClick={handleUpload} disabled={isLoading} style={{padding:'0.75rem 1rem', border:'none', borderRadius:8, background:'#3b82f6', color:'white', cursor:'pointer', minWidth:160}}>
            {isLoading ? 'Parsing…' : 'Import & Prefill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResumeModal;
