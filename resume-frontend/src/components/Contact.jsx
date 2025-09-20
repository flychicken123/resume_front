import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Contact.css';
import { getAPIBaseURL } from '../api';
import { setLastStep } from '../utils/exitTracking';

const Contact = () => {
  const navigate = useNavigate();
  const apiBaseUrl = useMemo(() => getAPIBaseURL(), []);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    setLastStep('view_contact');
  }, []);

  const handleEmailClick = () => {
    window.location.href = 'mailto:hihired_support@tactechs.net';
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'loading') {
      return;
    }
    setStatus('loading');
    setError('');
    setLastStep('contact_submit_attempt');
    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setLastStep('contact_submit_success');
    } catch (err) {
      console.error('Contact form submission failed', err);
      setStatus('error');
      setError('We could not send your message. Please email hihired_support@tactechs.net.');
      setLastStep('contact_submit_error');
    }
  };

  const handleStartBuilding = () => {
    navigate('/builder');
  };

  return (
    <div className="contact-section" id="contact">
      <div className="contact-container">
        <h2 className="contact-title">Contact Us</h2>
        
        <div className="contact-content">
          <div className="contact-main">
            <h3>💬 Get in Touch</h3>
            <p>
              Have questions about HiHired? Need help with your resume? Want to share feedback? 
              We'd love to hear from you! Our team is here to help you succeed in your job search journey.
            </p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h4>Email Support</h4>
                <p>Send us an email anytime and we'll get back to you within 24 hours.</p>
                <button 
                  className="contact-email-btn"
                  onClick={handleEmailClick}
                >
                  hihired_support@tactechs.net
                </button>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">⏰</div>
                <h4>Response Time</h4>
                <p>We typically respond to all inquiries within 24 hours during business days.</p>
                <div className="response-time">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">💡</div>
                <h4>What We Can Help With</h4>
                <ul className="help-topics">
                  <li>Resume building questions</li>
                  <li>Technical support</li>
                  <li>Feature requests</li>
                  <li>Feedback and suggestions</li>
                  <li>Partnership opportunities</li>
                </ul>
              </div>
            </div>
            
            <div className="contact-cta">
              <h3>🚀 Ready to Build Your Resume?</h3>
              <p>
                Don't let a poorly crafted resume hold you back from your dream job. 
                Start building your professional resume with HiHired today!
              </p>
              <button className="contact-cta-btn" onClick={handleStartBuilding}>
                Start Building Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 