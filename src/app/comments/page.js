'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Comments() {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const response = await fetch('/api/comments');
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author }),
      });

      const data = await response.json();
      setMessage({ success: true, text: 'Note added successfully!' });
      setContent('');
      setAuthor('');
      loadComments();
    } catch (error) {
      setMessage({ success: false, text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-top">
          <div className="logo">
            <div className="logo-icon">TA</div>
            <div className="logo-text">
              <h1>TruArch Technologies</h1>
              <p>Enterprise Software Architecture & Infrastructure Solutions</p>
            </div>
          </div>
        </div>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/comments" className="active">Project Notes</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Project Notes & Documentation</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Share architecture notes, implementation details, and project documentation with your team.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Note Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="6"
              placeholder="Enter your project note or documentation..."
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Add Note'}
          </button>
        </form>

        {message && (
          <div className={message.success ? 'success' : 'error'}>
            {message.text}
          </div>
        )}

        <div className="comments-list">
          <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Recent Notes</h3>
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>No notes yet. Be the first to add one!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-author">
                  {comment.author || 'Anonymous'} • {new Date(comment.created_at).toLocaleString()}
                </div>
                <div 
                  className="comment-content"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
