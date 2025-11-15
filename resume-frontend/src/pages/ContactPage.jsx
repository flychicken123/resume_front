import React from 'react';
import SEO from '../components/SEO';
import Contact from '../components/Contact';

const ContactPage = () => (
  <>
    <SEO
      title="Contact HiHired | Talk to the Team"
      description="Get in touch with the HiHired team for support, partnership inquiries, or feedback. We're here to help with anything related to AI resume building."
      canonical="https://hihired.org/contact"
    />
    <Contact />
  </>
);

export default ContactPage;
