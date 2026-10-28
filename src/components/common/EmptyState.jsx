import React from 'react';
import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = SearchX,
  title = 'No records found',
  description = 'There are no scholarships or items matching your current filters.',
  actionLabel = null,
  actionTo = null,
  onAction = null
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 1.5rem',
      background: 'var(--surface)',
      border: '1px dashed var(--neutral-300)',
      borderRadius: '12px',
      margin: '2rem 0'
    }}>
      <div style={{
        display: 'inline-flex',
        padding: '1rem',
        borderRadius: '9999px',
        background: 'var(--neutral-100)',
        color: 'var(--neutral-600)',
        marginBottom: '1rem'
      }}>
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto', color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
