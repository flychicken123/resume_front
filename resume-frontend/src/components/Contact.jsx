import React, { useEffect, useMemo, useRef, useState } from 'react';



import { useNavigate } from 'react-router-dom';



import './Contact.css';



import { getAPIBaseURL } from '../api';



import { setLastStep } from '../utils/exitTracking';



import { useFeedback } from '../context/FeedbackContext';



const Contact = () => {



  const navigate = useNavigate();



  const { openFeedbackWidget } = useFeedback();



  const apiBaseUrl = useMemo(() => getAPIBaseURL(), []);

  useEffect(() => {
    if (window.location.hash === '#about-us') {
      const el = document.getElementById('about-us');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);



  const [formData, setFormData] = useState({ name: '', email: '', message: '' });



  const [status, setStatus] = useState('idle');



  const [error, setError] = useState('');



  const sectionRef = useRef(null);



  const hasTrackedViewRef = useRef(false);



  useEffect(() => {



    const sectionEl = sectionRef.current;



    const recordView = () => {



      if (!hasTrackedViewRef.current) {



        hasTrackedViewRef.current = true;



        setLastStep('view_contact');



      }



    };



    if (!sectionEl) {



      return;



    }



    const checkViewport = () => {



      const el = sectionRef.current;



      if (!el || hasTrackedViewRef.current) {



        return;



      }



      const rect = el.getBoundingClientRect();



      if (rect.top < window.innerHeight && rect.bottom > 0) {



        recordView();



      }



    };



    if (typeof IntersectionObserver === 'undefined') {



      checkViewport();



      if (hasTrackedViewRef.current) {



        return;



      }



      const handleWindowChange = () => {



        checkViewport();



      };



      window.addEventListener('scroll', handleWindowChange, { passive: true });



      window.addEventListener('resize', handleWindowChange);



      window.addEventListener('focus', handleWindowChange);



      return () => {



        window.removeEventListener('scroll', handleWindowChange);



        window.removeEventListener('resize', handleWindowChange);



        window.removeEventListener('focus', handleWindowChange);



      };



    }



    const observer = new IntersectionObserver((entries) => {



      entries.forEach((entry) => {



        if (entry.isIntersecting) {



          recordView();



        }



      });



    }, { threshold: 0.25 });



    observer.observe(sectionEl);



    return () => {



      observer.disconnect();



    };



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



  const handleFeedbackClick = () => {



    setLastStep('contact_feedback_widget');



    openFeedbackWidget();



  };



  return (



    <div ref={sectionRef} className="contact-section" id="contact">



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



                <p>We typically respond to all inquiries within 1-2 business days.</p>



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



              <div className="contact-method">



                <div className="contact-icon contact-icon-text">Feedback</div>



                <h4>Product Feedback</h4>



                <p>Tell us what's working well and where we can do better. Your insights shape our roadmap.</p>



                <button



                  type="button"



                  className="contact-email-btn contact-feedback-btn"



                  onClick={handleFeedbackClick}



                >



                  Give Feedback



                </button>



              </div>



            <div className="contact-form-wrapper">
              <h3>📨 Send Us a Message</h3>
              <p>Fill out the form below and our team will get back to you shortly.</p>
              <form className="contact-form" onSubmit={handleSubmit}>
                <label className="contact-field">
                  <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                  />
                </label>
                <label className="contact-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="contact-field">
                  <span>Message</span>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help..."
                    rows="4"
                    required
                  />
                </label>
                {error && <p className="contact-error">{error}</p>}
                {status === 'success' && (<p className="contact-success">Thanks! We'll reply shortly.</p>)}
                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* ── About Us ─────────────────────────────── */}
            <div id="about-us" className="contact-about-section">
              <h2 className="contact-about-title">About HiHired</h2>
              <p className="contact-about-intro">
                HiHired is your AI-powered career coach — built to help job seekers craft
                standout resumes, land interviews, and take control of their job search.
              </p>
              <h3 className="contact-about-subtitle">What Makes Us Different</h3>
              <div className="contact-about-grid">
                <div className="contact-about-card">
                  <span className="contact-about-icon">🤖</span>
                  <h4>AI-Powered Optimization</h4>
                  <p>Advanced AI analyzes job descriptions and rewrites your resume with the right keywords to pass ATS systems.</p>
                </div>
                <div className="contact-about-card">
                  <span className="contact-about-icon">🎯</span>
                  <h4>Job-Specific Tailoring</h4>
                  <p>Paste any job description and our AI customizes your resume to match the role — highlighting your most relevant experience.</p>
                </div>
                <div className="contact-about-card">
                  <span className="contact-about-icon">📱</span>
                  <h4>Mobile-Friendly</h4>
                  <p>Build your resume on any device. Your progress is always saved and synced.</p>
                </div>
                <div className="contact-about-card">
                  <span className="contact-about-icon">⚡</span>
                  <h4>Lightning Fast</h4>
                  <p>Go from blank page to polished resume in minutes, not hours.</p>
                </div>
                <div className="contact-about-card">
                  <span className="contact-about-icon">🎨</span>
                  <h4>Professional Templates</h4>
                  <p>Recruiter-approved templates that look great and perform well with ATS systems.</p>
                </div>
                <div className="contact-about-card">
                  <span className="contact-about-icon">💰</span>
                  <h4>Free to Start</h4>
                  <p>Get started at no cost. Upgrade only when you need more power.</p>
                </div>
              </div>
              <div className="contact-about-mission">
                <h3>Our Mission</h3>
                <p>To make professional-quality resumes accessible to every job seeker — regardless of background or experience — by combining the best of AI with a simple, human-centered design.</p>
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


