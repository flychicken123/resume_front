import React, { useEffect, useMemo, useRef, useState } from 'react';



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


