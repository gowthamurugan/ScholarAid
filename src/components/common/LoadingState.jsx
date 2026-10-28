import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading scholarship data...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1rem',
      gap: '1rem',
      color: '#64748b'
    }}>
      <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
}
