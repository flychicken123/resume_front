import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';

// Mock the useAuth hook
const mockOnLogin = jest.fn();
const mockOnClose = jest.fn();

const renderLogin = () => {
  return render(
    <Login onLogin={mockOnLogin} onClose={mockOnClose} />
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('renders login form by default', () => {
    renderLogin();
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i, type: 'submit' })).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    renderLogin();
    
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderLogin();
    
    expect(screen.getByLabelText('Close auth modal')).toBeInTheDocument();
  });
});
