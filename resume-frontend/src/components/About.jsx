import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-container">
        <h2 className="about-title">About HiHired</h2>
        
        <div className="about-content">
          <div className="about-main">
            <h3>🚀 Your Path to Career Success</h3>
            <p>
              HiHired is your ultimate AI-powered resume builder designed to help you land your dream job. 
              We understand that crafting the perfect resume can be overwhelming, which is why we've created 
              an intelligent platform that makes the process simple, effective, and results-driven.
            </p>
            
            <h3>✨ What Makes Us Different</h3>
            <div className="about-features-grid">
              <div className="about-feature-item">
                <div className="about-feature-icon">🤖</div>
                <h4>AI-Powered Optimization</h4>
                <p>Our advanced AI analyzes job descriptions and optimizes your resume with relevant keywords and skills to pass ATS systems.</p>
              </div>
              
              <div className="about-feature-item">
                <div className="about-feature-icon">🎯</div>
                <h4>Job-Specific Tailoring</h4>
                <p>Upload any job description and our AI will customize your resume to match the role perfectly, highlighting relevant experience.</p>
              </div>
              
              <div className="about-feature-item">
                <div className="about-feature-icon">📱</div>
                <h4>Mobile-Friendly</h4>
                <p>Build your resume on any device - desktop, tablet, or phone. Your progress is always saved and synced.</p>
              </div>
              
              <div className="about-feature-item">
                <div className="about-feature-icon">⚡</div>
                <h4>Lightning Fast</h4>
                <p>Create a professional resume in minutes, not hours. Our streamlined process gets you from start to finish quickly.</p>
              </div>
              
              <div className="about-feature-item">
                <div className="about-feature-icon">🎨</div>
                <h4>Professional Templates</h4>
                <p>Choose from dozens of recruiter-approved templates that look great and perform well with ATS systems.</p>
              </div>
              
              <div className="about-feature-item">
                <div className="about-feature-icon">💰</div>
                <h4>100% Free</h4>
                <p>No hidden fees, no premium paywalls. All features are completely free to use, forever.</p>
              </div>
            </div>
            
            <h3>🎯 Our Mission</h3>
            <p>
              We believe everyone deserves access to professional resume-building tools that actually work. 
              Our mission is to democratize career success by providing cutting-edge AI technology that helps 
              job seekers stand out in today's competitive market. Whether you're a recent graduate, career 
              changer, or experienced professional, HiHired is here to accelerate your job search journey.
            </p>
            
            <h3>📈 Proven Results</h3>
            <p>
              Thousands of users have successfully landed interviews and jobs using HiHired. Our AI-powered 
              approach has helped candidates across all industries - from tech to healthcare, finance to 
              creative fields - create resumes that get noticed by top companies like Amazon, Google, Meta, 
              and Nike.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 
