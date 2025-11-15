'use client';

import { useState } from 'react';
import Link from 'next/link';
import { appConfig } from '../config.js';

export default function Chat() {
  const initials = appConfig.companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'ET';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);

    // Add user message to UI
    setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      // Always try to parse as JSON, but handle errors gracefully
      let data;
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        } else {
          // Empty response - use default
          data = {
            response: 'Thank you for your message. Our team will review it and get back to you.',
            timestamp: new Date().toISOString(),
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, use a default response
        // Errors are logged on the server, don't show them to users
        data = {
          response: 'Thank you for your message. Our team will review it and get back to you.',
          timestamp: new Date().toISOString(),
        };
      }

      // Always show a response (never show errors to users)
      setMessages((prev) => [...prev, { 
        type: 'assistant', 
        text: data?.response || 'Thank you for your message. Our team will review it and get back to you.' 
      }]);
    } catch (error) {
      // Silently handle all errors - don't show them to users
      // All errors are logged on the server
      setMessages((prev) => [...prev, { 
        type: 'assistant', 
        text: 'Thank you for your message. Our team will review it and get back to you.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-top">
          <div className="logo">
            <div className="logo-icon">{initials}</div>
            <div className="logo-text">
              <h1>{appConfig.companyName}</h1>
              <p>{appConfig.companyTagline}</p>
            </div>
          </div>
        </div>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/chat" className="active">AI Assistant</Link>
        </nav>
      </div>

      <div className="card">
        <h2>AI Infrastructure Assistant</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Get instant answers about your infrastructure deployments, server configurations, and architecture best practices.
        </p>

        <div className="chat-messages">
          {messages.length === 0 && (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
              Start a conversation with the AI assistant. Ask about infrastructure, deployments, or architecture questions.
            </p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.type}`}>
              <div className={`message-label ${msg.type}`}>
                {msg.type === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div>{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-label assistant">AI Assistant</div>
              <div>Processing your request...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about infrastructure, deployments, or architecture..."
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading || !message.trim()}>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
