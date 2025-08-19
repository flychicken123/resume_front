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
      console.log('Raw response text:', text);
      let json = null;
      try { 
        json = JSON.parse(text); 
        console.log('Parsed JSON response:', json);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
      }
      if (!resp.ok || !json) {
        throw new Error((json && (json.error || json.message)) || `Parse failed (${resp.status})`);
      }
      
      // Handle both AI-structured response and fallback response
      let structuredData = null;
      if (json.structured) {
        console.log('Using AI-structured data:', json.structured);
        // Check if structured data has any meaningful content
        const hasContent = json.structured.name || json.structured.email || json.structured.phone || 
                          json.structured.summary || (json.structured.experience && json.structured.experience.length > 0) ||
                          (json.structured.education && json.structured.education.length > 0) ||
                          (json.structured.skills && json.structured.skills.length > 0);
        
        if (hasContent) {
          structuredData = json.structured;
        } else {
          console.log('AI-structured data is empty, trying extracted data');
        }
      }
      
      if (!structuredData && json.extracted) {
        console.log('Using extracted data:', json.extracted);
        // Check if extracted data has any meaningful content
        const hasExtractedContent = json.extracted.email || json.extracted.phone || 
                                   (json.extracted.sections && Object.keys(json.extracted.sections).length > 0);
        
        if (hasExtractedContent) {
          // Convert extracted format to structured format
          structuredData = {
            name: '',
            email: json.extracted.email || '',
            phone: json.extracted.phone || '',
            summary: json.extracted.sections?.summary || '',
            experience: json.extracted.sections?.experience ? [{
              company: '',
              role: '',
              location: '',
              startDate: '',
              endDate: '',
              bullets: json.extracted.sections.experience.split('\n').filter(line => line.trim())
            }] : [],
            education: json.extracted.sections?.education ? [{
              school: '',
              degree: '',
              field: '',
              startDate: '',
              endDate: ''
            }] : [],
            skills: json.extracted.sections?.skills ? json.extracted.sections.skills.split('\n').filter(line => line.trim()) : []
          };
        }
      }
      
      if (structuredData) {
        console.log('Applying imported data:', structuredData);
        applyImportedData(structuredData);
        
        // Save contact info to backend for future job applications
        if (structuredData.name || structuredData.email || structuredData.phone) {
          const token = localStorage.getItem('resumeToken');
          if (token) {
            console.log('Saving contact info to backend:', {
              name: structuredData.name,
              email: structuredData.email,
              phone: structuredData.phone
            });
            
            fetch(`${getAPIBaseURL()}/api/user/save-contact-info`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: structuredData.name || '',
                email: structuredData.email || '',
                phone: structuredData.phone || '',
                resume_name: `Imported Resume ${new Date().toLocaleDateString()}`
              })
            }).then(resp => resp.json())
            .then(data => {
              if (data.success) {
                console.log('Contact info saved successfully, resume ID:', data.resume_id);
                // Store the resume ID for later use
                if (data.resume_id) {
                  localStorage.setItem('lastResumeId', data.resume_id);
                }
              } else {
                console.error('Failed to save contact info');
              }
            }).catch(err => {
              console.error('Error saving contact info:', err);
            });
          }
        }
        
        // Add a small delay to ensure state update completes
        setTimeout(() => {
          onClose();
          navigate('/builder');
        }, 100);
      } else {
        console.log('No usable data found in response');
        console.log('Raw text length:', json.extracted?.raw_text?.length || 0);
        console.log('Sections found:', Object.keys(json.extracted?.sections || {}));
        alert('Could not extract any data from the resume. This might be due to:\n\n1. File format not supported\n2. File is corrupted or password protected\n3. Text extraction failed\n\nPlease try another file or continue manually.');
        return;
      }
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


