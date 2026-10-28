import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ maxWidth: '540px', padding: '5rem 1rem', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3rem 2rem' }}>
        <div style={{
          display: 'inline-flex',
          background: '#eff6ff',
          color: '#2563eb',
          padding: '16px',
          borderRadius: '50%',
          marginBottom: '1.25rem'
        }}>
          <HelpCircle size={42} />
        </div>

        <h1 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.5rem' }}>
          404 — Page Not Found
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The page or scholarship record you are looking for does not exist or may have been removed.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary btn-sm">
            <Home size={14} /> Back to Homepage
          </Link>
          <Link to="/scholarships" className="btn btn-secondary btn-sm">
            Browse Approved Scholarships
          </Link>
        </div>
      </div>
    </div>
  );
}
