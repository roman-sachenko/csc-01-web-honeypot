'use client';

import { useState } from 'react';
import Link from 'next/link';
import { appConfig } from '../config.js';

export default function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // In a real app, you'd redirect or set session
        setError('Login successful! (This is a honeypot - no actual access granted)');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = appConfig.companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'ET';

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
          <div className="header-badge">Admin Portal</div>
        </div>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/login">Client Login</Link>
          <Link href="/admin">Admin Dashboard</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Administrator Dashboard</h2>
        <p style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '24px' }}>
          Access the administrative control panel for infrastructure management and system configuration.
        </p>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '16px',
                }}
                placeholder="Enter admin username"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '16px',
                }}
                placeholder="Enter admin password"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  backgroundColor: error.includes('successful') ? '#d4edda' : '#f8d7da',
                  color: error.includes('successful') ? '#155724' : '#721c24',
                  border: `1px solid ${error.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Authenticating...' : 'Login to Admin Panel'}
            </button>
          </form>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
            <strong>Note:</strong> Default admin credentials have been changed. Contact your system administrator for access.
          </div>
        </div>
      </div>
    </div>
  );
}

