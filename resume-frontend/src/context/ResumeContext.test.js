import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeProvider, useResume } from './ResumeContext';

// Mock the useAuth hook
const mockUser = { email: 'test@example.com' };
jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

// Test component to use the context
const TestComponent = () => {
  const { 
    resumeData, 
    updateResumeData, 
    saveToDatabase, 
    loadFromDatabase,
    isLoading,
    error 
  } = useResume();

  return (
    <div>
      <div data-testid="name">{resumeData.name || 'No name'}</div>
      <div data-testid="email">{resumeData.email || 'No email'}</div>
      <button 
        data-testid="update-btn" 
        onClick={() => updateResumeData({ name: 'John Doe', email: 'john@example.com' })}
      >
        Update
      </button>
      <button data-testid="save-btn" onClick={() => saveToDatabase()}>
        Save
      </button>
      <button data-testid="load-btn" onClick={() => loadFromDatabase()}>
        Load
      </button>
      <div data-testid="loading">{isLoading ? 'Loading...' : 'Not loading'}</div>
      <div data-testid="error">{error || 'No error'}</div>
    </div>
  );
};

const renderWithProvider = (component) => {
  return render(
    <ResumeProvider>
      {component}
    </ResumeProvider>
  );
};

describe('ResumeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('provides initial resume data', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('name')).toHaveTextContent('No name');
    expect(screen.getByTestId('email')).toHaveTextContent('No email');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('updates resume data when updateResumeData is called', () => {
    renderWithProvider(<TestComponent />);
    
    const updateButton = screen.getByTestId('update-btn');
    fireEvent.click(updateButton);
    
    expect(screen.getByTestId('name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('email')).toHaveTextContent('john@example.com');
  });

  it('saves data to database successfully', async () => {
    const mockResponse = { success: true, message: 'Data saved successfully' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProvider(<TestComponent />);
    
    // Update data first
    const updateButton = screen.getByTestId('update-btn');
    fireEvent.click(updateButton);
    
    // Save to database
    const saveButton = screen.getByTestId('save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/save',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({
            userEmail: 'test@example.com',
            resumeData: {
              name: 'John Doe',
              email: 'john@example.com',
            },
          }),
        })
      );
    });
  });

  it('loads data from database successfully', async () => {
    const mockResponse = { 
      success: true, 
      resumeData: { 
        name: 'Jane Doe', 
        email: 'jane@example.com',
        phone: '123-456-7890',
        summary: 'Experienced developer',
        experiences: [{ company: 'Tech Corp', role: 'Developer' }],
        education: 'Bachelor Degree',
        skills: ['JavaScript', 'React']
      } 
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProvider(<TestComponent />);
    
    const loadButton = screen.getByTestId('load-btn');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/load?userEmail=test@example.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    // Check that data was loaded
    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Jane Doe');
      expect(screen.getByTestId('email')).toHaveTextContent('jane@example.com');
    });
  });

  it('handles save error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    });

    renderWithProvider(<TestComponent />);
    
    const saveButton = screen.getByTestId('save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Save failed');
    });
  });

  it('handles load error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Load failed' }),
    });

    renderWithProvider(<TestComponent />);
    
    const loadButton = screen.getByTestId('load-btn');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Load failed');
    });
  });

  it('handles network error during save', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProvider(<TestComponent />);
    
    const saveButton = screen.getByTestId('save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error. Please try again.');
    });
  });

  it('handles network error during load', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProvider(<TestComponent />);
    
    const loadButton = screen.getByTestId('load-btn');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error. Please try again.');
    });
  });

  it('handles missing auth token', async () => {
    // Mock localStorage to return null
    localStorage.getItem.mockReturnValue(null);
    
    const mockResponse = { success: true, message: 'Data saved successfully' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProvider(<TestComponent />);
    
    const saveButton = screen.getByTestId('save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/save',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  it('clears error when new data is updated', async () => {
    // First trigger an error
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    });

    renderWithProvider(<TestComponent />);
    
    const saveButton = screen.getByTestId('save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Save failed');
    });

    // Update data to clear error
    const updateButton = screen.getByTestId('update-btn');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });
});
