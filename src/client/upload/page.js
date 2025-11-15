'use client';

import { useState } from 'react';
import Link from 'next/link';
import { appConfig } from '../config.js';

export default function Upload() {
  const initials = appConfig.companyName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "ET";
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult({ success: true, data });
      setFile(null);
      e.target.reset();
    } catch (error) {
      setResult({ success: false, error: error.message });
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
          <Link href="/upload" className="active">Document Upload</Link>
        </nav>
      </div>
      <div className="card">
        <h2>Document Upload</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Upload architecture diagrams, technical specifications, deployment configurations, and project documentation.
          Maximum file size: 2 MB per file.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="file-upload">
            <input
              type="file"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p style={{ marginTop: '12px', color: 'var(--text)' }}>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <button type="submit" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
        {result && (
          <div className={result.success ? 'success' : 'error'}>
            {result.success ? (
              <div>
                <p>Document uploaded successfully!</p>
                <pre style={{ marginTop: '12px' }}>{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
