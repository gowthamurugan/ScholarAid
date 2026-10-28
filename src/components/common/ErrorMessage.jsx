import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  title = 'An error occurred',
  message,
  onRetry = null
}) {
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '1.25rem 1.5rem',
      margin: '1.5rem 0',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem'
    }}>
      <AlertCircle size={22} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ color: '#991b1b', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
          {title}
        </h4>
        <p style={{ color: '#7f1d1d', fontSize: '0.875rem' }}>
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-outline-danger btn-sm"
            style={{ marginTop: '0.75rem' }}
          >
            <RefreshCw size={14} /> Retry Request
          </button>
        )}
      </div>
    </div>
  );
}
