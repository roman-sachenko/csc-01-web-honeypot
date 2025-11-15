'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Fetch() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
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
          <Link href="/fetch" className="active">API Gateway</Link>
        </nav>
      </div>

      <div className="card">
        <h2>API Gateway & Integration Testing</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Test API endpoints, fetch data from external services, and integrate with third-party infrastructure APIs.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>API Endpoint URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/data"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch Data'}
          </button>
        </form>

        {result && (
          <div className="result">
            <h3>API Response:</h3>
            {result.error ? (
              <div className="error">{result.error}</div>
            ) : (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
