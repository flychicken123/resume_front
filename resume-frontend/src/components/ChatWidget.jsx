import React, { useMemo, useState } from 'react';
import './ChatWidget.css';
import { getAPIBaseURL } from '../api';
import { setLastStep } from '../utils/exitTracking';

// Lightweight rule-based fallback is replaced by live Gemini responses from the backend.
const INITIAL_MESSAGES = [
  {
    sender: 'bot',
    text: "Hey! I'm the HiHired assistant. Ask me anything about building resumes or using our AI tools."
  }
];

const FALLBACK_REPLY = "I’m having trouble reaching our AI right now. Please use the Help bubble or contact us at hihired.org/contact and we’ll help right away.";

const generateSessionId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (err) {
    // Ignore and fall back to timestamp-based id.
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readStoredUserEmail = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return '';
  }
  try {
    const rawUser = window.localStorage.getItem('resumeUser');
    if (!rawUser) return '';
    const parsed = JSON.parse(rawUser);
    return typeof parsed?.email === 'string' ? parsed.email : '';
  } catch {
    return '';
  }
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const apiBaseUrl = useMemo(() => getAPIBaseURL(), []);
  const sessionId = useMemo(() => generateSessionId(), []);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    setLastStep(next ? "chat_opened" : "chat_closed");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = { sender: 'user', text: trimmed };
    setLastStep('chat_question_submitted');
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    const historyPayload = updatedHistory
      .slice(-8)
      .map((msg) => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        text: msg.text
      }));

    try {
      const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
      const userEmail = readStoredUserEmail();

      const response = await fetch(`${apiBaseUrl}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          session_id: sessionId,
          page_path: pagePath,
          user_email: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Assistant unavailable');
      }

      const data = await response.json();
      const reply = (data.reply || '').trim() || FALLBACK_REPLY;
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      setLastStep('chat_response_received');
    } catch (err) {
      console.error('Chat assistant error:', err);
      setMessages((prev) => [...prev, { sender: 'bot', text: FALLBACK_REPLY }]);
      setLastStep('chat_error_fallback');
    } finally {
      setIsLoading(false);
    }
  };

  const isSendDisabled = isLoading || input.trim() === '';

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="HiHired chat assistant">
          <div className="chat-header">
            <span className="chat-title">HiHired Assistant</span>
            <button type="button" className="chat-close" onClick={toggleOpen} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`chat-message ${message.sender}`}>
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot typing">HiHired assistant is typing…</div>
            )}
          </div>
          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the AI resume builder..."
              aria-label="Type your message"
              disabled={isLoading}
            />
            <button type="submit" disabled={isSendDisabled}>
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Hide chat assistant' : 'Show chat assistant'}
      >
        <span role="img" aria-hidden="true">💬</span>
        <span className="chat-toggle-label">Chat</span>
      </button>
    </div>
  );
};

export default ChatWidget;
