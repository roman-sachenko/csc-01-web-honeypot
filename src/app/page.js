import Link from 'next/link';

export default function Home() {
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
          <div className="header-badge">Client Portal</div>
        </div>
        <nav className="nav">
          <Link href="/login">Login</Link>
          <Link href="/search">Team Directory</Link>
          <Link href="/comments">Project Notes</Link>
          <Link href="/chat">AI Assistant</Link>
          <Link href="/upload">Document Upload</Link>
          <Link href="/download">Resources</Link>
          <Link href="/execute">Infrastructure Tools</Link>
          <Link href="/fetch">API Gateway</Link>
        </nav>
      </div>

      <div className="card">
        <h2>Welcome to TruArch Technologies</h2>
        <p style={{ fontSize: '16px', color: 'var(--text-light)', marginBottom: '24px' }}>
          We provide enterprise-grade software architecture solutions, ready-made server infrastructure, 
          and comprehensive consulting services to help companies build scalable, maintainable systems.
        </p>
        
        <div className="stats">
          <div className="stat-item">
            <div className="stat-value">150+</div>
            <div className="stat-label">Active Clients</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">500+</div>
            <div className="stat-label">Deployments</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏗️</div>
            <h4>Architecture Design</h4>
            <p>Custom software architecture solutions tailored to your business needs and scalability requirements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h4>Infrastructure Setup</h4>
            <p>Ready-made server configurations and cloud infrastructure deployments for rapid scaling.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h4>DevOps Solutions</h4>
            <p>Automated CI/CD pipelines, container orchestration, and infrastructure as code implementations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h4>System Integration</h4>
            <p>Seamless integration of third-party services and legacy systems with modern architectures.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Performance Optimization</h4>
            <p>Database tuning, caching strategies, and system performance analysis for optimal efficiency.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h4>Security Consulting</h4>
            <p>Security audits, compliance reviews, and implementation of best practices for data protection.</p>
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--secondary)' }}>Portal Services</h3>
          <ul style={{ lineHeight: '2', color: 'var(--text-light)' }}>
            <li><strong>Login:</strong> Access your client account and project dashboards</li>
            <li><strong>Team Directory:</strong> Search and connect with project team members</li>
            <li><strong>Project Notes:</strong> Collaborate and share project documentation</li>
            <li><strong>AI Assistant:</strong> Get instant answers about your infrastructure and deployments</li>
            <li><strong>Document Upload:</strong> Share architecture diagrams, specifications, and reports</li>
            <li><strong>Resources:</strong> Download technical documentation and best practices guides</li>
            <li><strong>Infrastructure Tools:</strong> Execute system commands and manage server configurations</li>
            <li><strong>API Gateway:</strong> Test and integrate with our infrastructure APIs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
