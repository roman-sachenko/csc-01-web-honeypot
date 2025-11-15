'use client';

import Link from 'next/link';

export default function Download() {
  const handleDownload = () => {
    window.open('/api/download/architecture-guide', '_blank');
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
          <Link href="/download" className="active">Resources</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Technical Resources & Documentation</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
          Download architecture guides, best practices documentation, and technical resources for your projects.
        </p>
        
        <div style={{ marginTop: '24px' }}>
          <div className="feature-card">
            <div className="feature-icon">📘</div>
            <h4>Enterprise Architecture Guide</h4>
            <p style={{ marginBottom: '16px', color: 'var(--text-light)' }}>
              Comprehensive guide covering enterprise software architecture patterns, infrastructure design principles, 
              and best practices for scalable system deployments.
            </p>
            <button onClick={handleDownload}>
              Download PDF Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
