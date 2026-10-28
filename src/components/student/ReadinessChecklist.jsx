import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { READINESS_DISCLAIMER } from '../../utils/readinessCalculator.js';

export default function ReadinessChecklist({ readinessResult, scholarshipName = 'Selected Scholarship' }) {
  if (!readinessResult) return null;

  const { score, maxScore, label, isReady, checks, pendingActions } = readinessResult;
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Hero Score Box */}
      <div className="readiness-score-hero">
        <div className="readiness-score-number">{label}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '4px' }}>
            {isReady ? 'All 5 Preparation Checks Passed!' : `${pendingActions.length} Pending Preparation Check(s)`}
          </h3>
          <p style={{ color: '#bfdbfe', fontSize: '0.85rem', marginBottom: '8px' }}>
            Application readiness evaluated for: <strong>{scholarshipName}</strong>
          </p>
          {/* Progress track */}
          <div style={{ background: 'rgba(255,255,255,0.2)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              background: isReady ? '#22c55e' : '#f59e0b',
              width: `${percentage}%`,
              height: '100%',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Mandatory Advisory Disclaimer */}
      <div className="disclaimer-alert">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{READINESS_DISCLAIMER}</span>
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#1e293b' }}>
          Detailed Checklist Evaluation (5 Criteria)
        </h4>

        {checks.map((c, index) => {
          const isPassed = c.passed;
          return (
            <div
              key={c.id || index}
              className={`checklist-item ${isPassed ? 'passed' : 'failed'}`}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isPassed ? (
                  <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
                ) : c.status === 'Missing Information' ? (
                  <AlertCircle size={22} style={{ color: '#d97706' }} />
                ) : (
                  <XCircle size={22} style={{ color: '#dc2626' }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '0.95rem', color: isPassed ? '#166534' : '#991b1b' }}>
                    {index + 1}. {c.title}
                  </strong>
                  <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}>
                    {c.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  {c.reason}
                </p>

                {!isPassed && c.action && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#92400e',
                    background: '#fffbeb',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    <strong>Recommended Action:</strong> {c.action}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Actions Summary */}
      {pendingActions.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.5rem' }}>
            Summary of Required Actions Before Submitting
          </h4>
          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
            {pendingActions.map((act, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
