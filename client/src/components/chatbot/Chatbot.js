import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Fade,
  Grow,
  Badge,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import chatbotData from './chatbotData';
import './Chatbot.css';

/* ──────────────────────────────────────────────
   Helper: render **bold** segments in answer text
   ────────────────────────────────────────────── */
const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

/* ──────────────────────────────────────────────
   Main Chatbot Component
   ────────────────────────────────────────────── */
const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const initialised = useRef(false);

  /* Auto-scroll to bottom on new messages */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* Push initial greeting once */
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      setMessages([{ from: 'bot', text: chatbotData.greeting }]);
    }
  }, []);

  /* ── handlers ── */

  const toggleChat = () => {
    setOpen((prev) => !prev);
    setHasNewMessage(false);
  };

  const addBotMessage = (text) => {
    setMessages((prev) => [...prev, { from: 'bot', text }]);
    if (!open) setHasNewMessage(true);
  };

  const handleCategoryClick = (category) => {
    setMessages((prev) => [...prev, { from: 'user', text: category.label }]);
    setActiveCategory(category);
    addBotMessage(`Great choice! Here are some common questions about **${category.label}**:`);
  };

  const handleQuestionClick = (question) => {
    setMessages((prev) => [...prev, { from: 'user', text: question.label }]);
    addBotMessage(question.answer);
  };

  const handleBack = () => {
    setActiveCategory(null);
    addBotMessage('No problem! What else can I help you with? Pick a topic below.');
  };

  /* ── Determine which quick-reply chips to show ── */
  const quickReplies = activeCategory
    ? activeCategory.questions
    : chatbotData.categories;

  /* ──────────────────────────────────────────────
     Render
     ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Chat window ── */}
      <Grow in={open} mountOnEnter unmountOnExit>
        <Box className="chatbot-window">
          {/* Header */}
          <Box className="chatbot-header">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Beauty Assistant
              </Typography>
            </Box>
            <IconButton size="small" onClick={toggleChat} sx={{ color: '#fff' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages area */}
          <Box className="chatbot-messages">
            {messages.map((msg, idx) => (
              <Fade in key={idx} timeout={400}>
                <Box
                  className={`chatbot-bubble ${
                    msg.from === 'bot' ? 'chatbot-bubble--bot' : 'chatbot-bubble--user'
                  }`}
                >
                  {msg.from === 'bot' && (
                    <SmartToyIcon
                      className="chatbot-avatar"
                      sx={{ fontSize: 20, color: '#8C5E6B', mr: 1, mt: '2px' }}
                    />
                  )}
                  <Typography variant="body2" className="chatbot-bubble-text">
                    {renderFormattedText(msg.text)}
                  </Typography>
                </Box>
              </Fade>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick-reply chips */}
          <Box className="chatbot-quick-replies">
            {activeCategory && (
              <button
                className="chatbot-chip chatbot-chip--back"
                onClick={handleBack}
              >
                <ArrowBackIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Back
              </button>
            )}
            {quickReplies.map((item) => (
              <button
                key={item.id}
                className="chatbot-chip"
                onClick={() =>
                  activeCategory
                    ? handleQuestionClick(item)
                    : handleCategoryClick(item)
                }
              >
                {item.label}
              </button>
            ))}
          </Box>
        </Box>
      </Grow>

      {/* ── Floating Action Button ── */}
      <Box className="chatbot-fab-wrapper">
        <Badge
          color="error"
          variant="dot"
          invisible={!hasNewMessage}
          overlap="circular"
        >
          <IconButton className="chatbot-fab" onClick={toggleChat}>
            {open ? (
              <CloseIcon sx={{ fontSize: 28, color: '#fff' }} />
            ) : (
              <ChatIcon sx={{ fontSize: 28, color: '#fff' }} />
            )}
          </IconButton>
        </Badge>
      </Box>
    </>
  );
};

export default Chatbot;
