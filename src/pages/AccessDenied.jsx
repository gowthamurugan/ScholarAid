import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="container" style={{ maxWidth: '540px', padding: '5rem 1rem', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3rem 2rem' }}>
        <div style={{
          display: 'inline-flex',
          background: '#fef2f2',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '50%',
          marginBottom: '1.25rem'
        }}>
          <ShieldAlert size={42} />
        </div>

        <h1 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.5rem' }}>
          403 — Access Denied
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          You do not possess the required administrator privileges to view this page or perform this operation.
          Administrative actions are strictly protected by role-based authorization rules.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary btn-sm">
            <Home size={14} /> Return to Home
          </Link>
          <Link to="/admin/login" className="btn btn-primary btn-sm">
            Administrator Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
