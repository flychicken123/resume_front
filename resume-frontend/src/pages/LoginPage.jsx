import React from 'react';
import { Helmet } from 'react-helmet';
import SEO from '../components/SEO';

const LoginPage = () => (
  <div className="login-page">
    <SEO
      title="Login to HiHired | Access Your AI Resume Builder"
      description="Sign in to HiHired to continue building and matching resumes. Access saved resumes, job matches, and personalized career tools."
      canonical="https://hihired.org/login"
      keywords="hihired login, resume builder login, ai resume account"
    />
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <h1>Login</h1>
    <p>Use the top navigation to sign in or create an account.</p>
  </div>
);

export default LoginPage;
