'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error.message });
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
          <Link href="/search" className="active">Team Directory</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Team Directory</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Search for team members, project leads, and technical specialists across all client engagements.
        </p>
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label>Search by Name or Email</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter name or email address"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Team'}
          </button>
        </form>

        {results && (
          <div className="result">
            <h3>Search Results:</h3>
            {results.error ? (
              <div className="error">{results.error}</div>
            ) : Array.isArray(results) && results.length > 0 ? (
              <div style={{ marginTop: '16px' }}>
                {results.map((user, idx) => (
                  <div key={idx} className="comment-item">
                    <div className="comment-author">{user.username} ({user.email})</div>
                    <div className="comment-content">Role: {user.role}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)', marginTop: '16px' }}>No results found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
