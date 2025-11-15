'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Execute() {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
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
          <Link href="/execute" className="active">Infrastructure Tools</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Infrastructure Management Tools</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Execute system commands and manage server configurations for your infrastructure deployments.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>System Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., ls, pwd, whoami, docker ps"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Executing...' : 'Execute Command'}
          </button>
        </form>

        {result && (
          <div className="result">
            <h3>Command Output:</h3>
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
