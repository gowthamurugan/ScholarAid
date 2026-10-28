import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, CheckSquare, Activity } from 'lucide-react';

export default function AdminNav() {
  const tabs = [
    { to: '/admin/all-scholarships', label: 'All Scholarships', icon: Layers },
    { to: '/admin/approved', label: 'Approved Scholarships', icon: CheckSquare },
    { to: '/admin/monitoring', label: 'Status Monitoring', icon: Activity }
  ];

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--neutral-200)',
      borderRadius: '10px',
      padding: '0.5rem',
      marginBottom: '2rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              color: isActive ? '#ffffff' : 'var(--neutral-700)',
              background: isActive ? 'var(--primary)' : 'transparent'
            })}
          >
            <Icon size={16} />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}
