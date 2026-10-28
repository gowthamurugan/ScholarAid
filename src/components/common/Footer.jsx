import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong>ScholarAid</strong> — A Smart System for Scholarship Discovery & Application Support
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Transparent, Deterministic Scholarship Matching & Support Platform
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Official Portals Only
          </span>
          <span>•</span>
          <span>Role-Based Access Control</span>
          <span>•</span>
          <span>Pure Rules Engine</span>
        </div>
      </div>
    </footer>
  );
}
