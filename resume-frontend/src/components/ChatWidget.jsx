import { useState, useRef, useEffect } from 'react';
import { Button } from '@mantine/core';
import { IconMessageCircle, IconSend, IconX } from '@tabler/icons-react';
import classes from './ChatWidget.module.css';

const botResponses = [
  "That's a great question! I'd recommend starting with our resume builder — it takes about 5 minutes to create a polished, ATS-optimized resume.",
  "I can help with that! Our AI analyzes job descriptions and tailors your bullet points to match what recruiters are looking for.",
  "Great choice! Many of our users see a 3x increase in interview callbacks after optimizing their resume with HiHired.",
  "I'd suggest focusing on quantified achievements. Instead of 'managed a team', try 'Led a team of 8 engineers, delivering 3 projects 15% ahead of schedule'.",
  "Our job matching engine scans 35,000+ postings daily. Upload your resume and we'll surface the best-fit roles for you!",
];

const quickActions = ['Build Resume', 'Job Matches', 'Interview Tips', 'Resume Review'];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your AI job search companion. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-dismiss tooltip after 5 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = botResponses[responseIndex.current % botResponses.length];
      responseIndex.current += 1;
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (open) {
    return (
      <div className={classes.panel}>
        <div className={classes.header}>
          <span className={classes.headerTitle}>HiHired AI Assistant</span>
          <button className={classes.headerClose} onClick={() => setOpen(false)}>
            <IconX size={16} />
          </button>
        </div>

        <div className={classes.messages}>
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'bot' ? classes.msgBot : classes.msgUser}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={classes.quickActions}>
          {quickActions.map((label) => (
            <Button
              key={label}
              size="xs"
              variant="light"
              color="violet"
              radius="xl"
              onClick={() => sendMessage(label)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className={classes.inputArea}>
          <textarea
            className={classes.inputField}
            rows={1}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={classes.sendBtn} onClick={() => sendMessage(input)}>
            <IconSend size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      {showTooltip && (
        <div className={classes.tooltip}>
          I&apos;m your job search AI companion. Click to chat!
          <button className={classes.tooltipClose} onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}>
            ×
          </button>
        </div>
      )}
      <button className={classes.toggleBtn} onClick={() => { setOpen(true); setShowTooltip(false); }}>
        <IconMessageCircle size={28} />
      </button>
    </div>
  );
}
