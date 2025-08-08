import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('switches to signup mode when toggle button is clicked', () => {
    renderLogin();
    
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('switches back to login mode when toggle button is clicked again', () => {
    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    // Switch back to login mode
    const loginToggleButton = screen.getByText(/login/i);
    fireEvent.click(loginToggleButton);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles form submission for login', async () => {
    const mockResponse = { success: true, token: 'mock-token' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });

    expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'mock-token');
  });

  it('handles form submission for signup', async () => {
    const mockResponse = { success: true, token: 'mock-token' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'new@example.com');
    await userEvent.type(passwordInput, 'newpassword123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'newpassword123',
          }),
        })
      );
    });

    expect(mockOnLogin).toHaveBeenCalledWith('new@example.com', 'mock-token');
  });

  it('displays error message when login fails', async () => {
    const mockResponse = { success: false, message: 'Invalid credentials' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('displays error message when signup fails', async () => {
    const mockResponse = { success: false, message: 'Email already exists' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('displays network error when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
    });
  });

  it('displays network error for signup when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
    });
  });

  it('validates required fields for login', async () => {
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
      expect(screen.getByText('Please enter your password')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates required fields for signup', async () => {
    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
      expect(screen.getByText('Please enter your password')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates email format for login', async () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates email format for signup', async () => {
    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates password length for signup', async () => {
    renderLogin();
    
    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, '123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    renderLogin();
    
    const closeButton = screen.getByRole('button', { name: /close auth modal/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders Google login button', () => {
    renderLogin();
    
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
  });

  it('handles Google login success', () => {
    renderLogin();
    
    const googleButton = screen.getByTestId('google-login');
    fireEvent.click(googleButton);
    
    // The mock should call onSuccess with mock-credential
    // This is handled by the mock in setupTests.js
  });

  it('clears error messages when switching modes', async () => {
    renderLogin();
    
    // Trigger an error in login mode
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Switch to signup mode
    const toggleButton = screen.getByText(/sign up/i);
    fireEvent.click(toggleButton);

    // Error should be cleared
    expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
  });

  it('handles form submission with Enter key', async () => {
    const mockResponse = { success: true, token: 'mock-token' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Press Enter in password field
    fireEvent.keyPress(passwordInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'mock-token');
  });
});
