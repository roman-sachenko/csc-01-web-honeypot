'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { appConfig } from '../../config.js';

export default function UserProfile() {
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load user profile');
          }
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data);
        setError('');
      } catch (err) {
        setError('Connection error. Please try again.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUser();
    }
  }, [userId]);

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
          <div className="header-badge">User Profile</div>
        </div>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/users/1392">Profile</Link>
          <Link href="/search">Team Directory</Link>
        </nav>
      </div>

      <div className="card">
        {loading && <p>Loading user profile...</p>}
        
        {error && (
          <div style={{ padding: '16px', background: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {user && !loading && (
          <>
            <h2>User Profile</h2>
            <div style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>User ID:</strong> {user.id}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Username:</strong> {user.username}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Email:</strong> {user.email}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Role:</strong> <span style={{ 
                  padding: '4px 8px', 
                  background: user.role === 'admin' ? '#d4edda' : '#e2e3e5', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>{user.role}</span>
              </div>
              {user.created_at && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

