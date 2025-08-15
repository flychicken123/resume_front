import React, { useState } from 'react';
import LivePreview from './LivePreview';

const PaginationDemo = () => {
  const [demoData, setDemoData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    summary: "Experienced software developer with 10+ years in web development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading development teams.",
    experiences: [
      {
        jobTitle: "Senior Software Engineer",
        company: "Tech Corp",
        city: "San Francisco",
        state: "CA",
        startDate: "2020-01-01",
        endDate: "",
        currentlyWorking: true,
        description: "Led development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines reducing deployment time by 60%. Mentored junior developers and conducted code reviews."
      },
      {
        jobTitle: "Full Stack Developer",
        company: "Startup Inc",
        city: "Austin",
        state: "TX",
        startDate: "2018-03-01",
        endDate: "2019-12-31",
        currentlyWorking: false,
        description: "Built responsive web applications using React and Node.js. Collaborated with design team to implement user-friendly interfaces. Optimized database queries improving performance by 40%."
      },
      {
        jobTitle: "Junior Developer",
        company: "Digital Agency",
        city: "Chicago",
        state: "IL",
        startDate: "2016-06-01",
        endDate: "2018-02-28",
        currentlyWorking: false,
        description: "Developed custom WordPress themes and plugins. Worked on client projects including e-commerce sites and corporate websites. Participated in agile development processes."
      }
    ],
    education: [
      {
        degree: "Bachelor of Science",
        school: "University of Technology",
        field: "Computer Science",
        graduationYear: "2016",
        gpa: "3.8"
      }
    ],
    skills: "JavaScript, React, Node.js, Python, SQL, AWS, Docker, Git, Agile, REST APIs, GraphQL, TypeScript, MongoDB, PostgreSQL, Redis, Jenkins, Kubernetes",
    selectedFormat: "modern"
  });

  const addMoreContent = () => {
    const newExperience = {
      jobTitle: "Additional Role",
      company: "Another Company",
      city: "New York",
      state: "NY",
      startDate: "2015-01-01",
      endDate: "2016-05-31",
      currentlyWorking: false,
      description: "This is additional content to demonstrate pagination. When you have enough content that exceeds the page height, the system will automatically create new pages with proper boundaries, just like in a Word document."
    };

    setDemoData(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExperience]
    }));
  };

  const resetContent = () => {
    setDemoData({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      summary: "Experienced software developer with 10+ years in web development.",
      experiences: [
        {
          jobTitle: "Senior Software Engineer",
          company: "Tech Corp",
          city: "San Francisco",
          state: "CA",
          startDate: "2020-01-01",
          endDate: "",
          currentlyWorking: true,
          description: "Led development of microservices architecture."
        }
      ],
      education: [
        {
          degree: "Bachelor of Science",
          school: "University of Technology",
          field: "Computer Science",
          graduationYear: "2016",
          gpa: "3.8"
        }
      ],
      skills: "JavaScript, React, Node.js, Python, SQL",
      selectedFormat: "modern"
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Resume Pagination Demo</h2>
      <p>This demo shows how the live preview automatically creates multiple pages when content exceeds the page height.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={addMoreContent}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Add More Content
        </button>
        <button 
          onClick={resetContent}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reset Content
        </button>
      </div>

      <div style={{ height: '800px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <LivePreview isVisible={true} />
      </div>
    </div>
  );
};

export default PaginationDemo; 