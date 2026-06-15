import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReadableStream } from 'stream/web';
import { TextDecoder, TextEncoder } from 'util';
import ChatWidget from './ChatWidget';
import { AuthProvider } from '../context/AuthContext';
import { ResumeProvider, useResume } from '../context/ResumeContext';

jest.mock('../api', () => ({
  getAPIBaseURL: () => 'http://api.test',
  ensureExperimentUserId: () => 'test-experiment-user',
  generateResumeAdviceAI: jest.fn(),
  fetchResumeHistoryList: jest.fn(() => Promise.resolve([])),
  fetchJobCount: jest.fn(() => Promise.resolve({ count: 0 })),
  computeJobMatches: jest.fn(() => Promise.resolve({ matches: [] })),
  parsePersonalDetailsAI: jest.fn(),
  inferTemplatePreference: jest.fn(),
  inferJobIntent: jest.fn(),
  parseExperienceAI: jest.fn(),
  parseProjectsAI: jest.fn(),
  parseEducationAI: jest.fn(),
  parseJobDescriptionAI: jest.fn(),
  parseSkillsAI: jest.fn(),
  generateSkillsAI: jest.fn(),
  transcribeVoiceAI: jest.fn(),
  getFollowupReminders: jest.fn(() => Promise.resolve({ followup_reminders_enabled: false })),
  getUserJobApplications: jest.fn(() => Promise.resolve({ applications: [] })),
}));

const encoder = new TextEncoder();

const makeSSEFetchResponse = (events) => ({
  ok: true,
  headers: {
    get: (name) => (name.toLowerCase() === 'content-type' ? 'text/event-stream' : ''),
  },
  body: new ReadableStream({
    async start(controller) {
      for (const event of events) {
        if (event.delay) {
          await new Promise((resolve) => setTimeout(resolve, event.delay));
        }
        controller.enqueue(encoder.encode(event.data));
      }
      controller.close();
    },
  }),
});

const ResumeStateProbe = () => {
  const { data } = useResume();
  return (
    <div>
      <output aria-label="resume-name">{data.name || ''}</output>
      <output aria-label="resume-summary">{data.summary || ''}</output>
      <output aria-label="resume-experiences">{JSON.stringify(data.experiences || [])}</output>
    </div>
  );
};

const renderChatWidget = ({ showResumeProbe = false } = {}) => render(
  <MemoryRouter>
    <AuthProvider>
      <ResumeProvider>
        {showResumeProbe && <ResumeStateProbe />}
        <ChatWidget />
      </ResumeProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe('ChatWidget streaming', () => {
  let setItemSpy;

  beforeEach(() => {
    global.ReadableStream = global.ReadableStream || ReadableStream;
    global.TextEncoder = global.TextEncoder || TextEncoder;
    global.TextDecoder = global.TextDecoder || TextDecoder;
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => {
      if (key === 'resumeUser') {
        return JSON.stringify({ email: 'harvey@example.com', name: 'Harvey' });
      }
      if (key === 'resumeToken') {
        return 'test-token';
      }
      return null;
    });
    setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
    jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
    Element.prototype.scrollIntoView = jest.fn();
    global.fetch.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders SSE tokens before final done and skips partial-message persistence', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/api/assistant/chat')) {
        return Promise.resolve(makeSSEFetchResponse([
          { data: 'data: {"ready":true}\n\n' },
          { data: 'data: {"token":"Hel"}\n\n' },
          { delay: 120, data: 'data: {"done":true,"reply":"Hello","proactiveSuggestions":[]}\n\n' },
        ]));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
    });

    renderChatWidget();

    fireEvent.click(screen.getByLabelText('Chat with HiHired bot'));
    const input = await screen.findByLabelText('Type your message');
    await waitFor(() => {
      expect(screen.queryByText(/Please/i)).not.toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Hel')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    const persistedValues = setItemSpy.mock.calls.map(([, value]) => String(value));
    expect(persistedValues.some((value) => value.includes('"streaming":true'))).toBe(false);
  });

  it('renders markdown structure in assistant messages', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/api/assistant/chat')) {
        return Promise.resolve(makeSSEFetchResponse([
          { data: 'data: {"ready":true}\n\n' },
          {
            data:
              'data: {"done":true,"reply":"### Priority fixes\\n1. **High:** Missing dates\\n- **Evidence:** experience 1 has no date range","proactiveSuggestions":[]}\n\n',
          },
        ]));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
    });

    renderChatWidget();

    fireEvent.click(screen.getByLabelText('Chat with HiHired bot'));
    expect(await screen.findByText('Analyze my resume')).toBeInTheDocument();
    const input = await screen.findByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'review details' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('heading', { name: 'Priority fixes' })).toBeInTheDocument();
    expect(screen.getByText('High:')).toBeInTheDocument();
    expect(screen.getByText(/experience 1 has no date range/i)).toBeInTheDocument();
  });

  it('applies assistant resume updates as patches and preserves existing fields', async () => {
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'resumeUser') {
        return JSON.stringify({ email: 'harvey@example.com', name: 'Harvey' });
      }
      if (key === 'resumeToken') {
        return 'test-token';
      }
      if (key === 'resumeData_harvey@example.com') {
        return JSON.stringify({
          name: 'Xuan Wu',
          email: 'harwtalk@gmail.com',
          summary: '',
          skills: 'Go, React',
        });
      }
      return null;
    });

    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/api/assistant/chat')) {
        return Promise.resolve(makeSSEFetchResponse([
          { data: 'data: {"ready":true}\n\n' },
          {
            data:
              'data: {"done":true,"reply":"I added the generated summary.","updatedResumeData":{"summary":"Generated professional summary"},"proactiveSuggestions":[]}\n\n',
          },
        ]));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
    });

    renderChatWidget({ showResumeProbe: true });

    fireEvent.click(screen.getByLabelText('Chat with HiHired bot'));
    const input = await screen.findByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'generate one for me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByLabelText('resume-summary')).toHaveTextContent('Generated professional summary');
    });
    expect(screen.getByLabelText('resume-name')).toHaveTextContent('Xuan Wu');
  });

  it('normalizes assistant-updated experience date ranges for month inputs', async () => {
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'resumeUser') {
        return JSON.stringify({ email: 'harvey@example.com', name: 'Harvey' });
      }
      if (key === 'resumeToken') {
        return 'test-token';
      }
      if (key === 'resumeData_harvey@example.com') {
        return JSON.stringify({
          experiences: [
            {
              jobTitle: 'Project Leader',
              company: 'Nanjing Inforich Technology',
              startDate: '',
              endDate: '',
              currentlyWorking: false,
            },
          ],
        });
      }
      return null;
    });

    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/api/assistant/chat')) {
        return Promise.resolve(makeSSEFetchResponse([
          { data: 'data: {"ready":true}\n\n' },
          {
            data:
              'data: {"done":true,"reply":"I updated the dates.","updatedResumeData":{"experiences":[{"jobTitle":"Project Leader","company":"Nanjing Inforich Technology","startDate":"Aug 2013 - June 2015","endDate":"","currentlyWorking":false}]},"proactiveSuggestions":[]}\n\n',
          },
        ]));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
    });

    renderChatWidget({ showResumeProbe: true });

    fireEvent.click(screen.getByLabelText('Chat with HiHired bot'));
    const input = await screen.findByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'update dates' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    let experiences = [];
    await waitFor(() => {
      experiences = JSON.parse(screen.getByLabelText('resume-experiences').textContent);
      expect(experiences[0].startDate).toBe('2013-08');
    });
    expect(experiences[0].endDate).toBe('2015-06');
  });
});
