import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Building,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  FileCheck2
} from 'lucide-react';
import EligibilityBadge from './EligibilityBadge.jsx';
import { evaluateEligibility } from '../../utils/eligibilityEngine.js';
import { formatCurrencyINR, formatDate, safelyOpenExternalUrl } from '../../utils/validators.js';

export default function ScholarshipCard({
  scholarship,
  studentProfile,
  onOpenApply = null,
  showFullDetailsBtn = true
}) {
  const [showReasons, setShowReasons] = useState(false);

  const eligibility = evaluateEligibility(studentProfile, scholarship);

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (onOpenApply) {
      onOpenApply(scholarship);
    } else if (scholarship.officialUrl) {
      safelyOpenExternalUrl(scholarship.officialUrl);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <EligibilityBadge status={eligibility.status} />
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}>
              <ShieldCheck size={12} /> Official Portal Available
            </span>
            {scholarship.targetedStudentTypes && scholarship.targetedStudentTypes.length > 0 && !scholarship.targetedStudentTypes.includes('All') && !scholarship.targetedStudentTypes.includes('All Students') && (
              <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 600 }}>
                Target: {scholarship.targetedStudentTypes.join(', ')}
              </span>
            )}
          </div>
          <h3 className="card-title">{scholarship.name}</h3>
          <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building size={14} /> {scholarship.provider}
          </div>
        </div>
      </div>

      <div className="card-body" style={{ flex: 1 }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#475569' }}>
          {scholarship.description}
        </p>

        {/* Criteria Summary Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          background: '#f8fafc',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          marginBottom: '1rem'
        }}>
          <div><strong>Min GPA:</strong> {scholarship.minGpa || 'Any'}</div>
          <div><strong>Category:</strong> {scholarship.eligibleCategory || 'Any'}</div>
          <div><strong>Course:</strong> {scholarship.eligibleCourse || 'Any'}</div>
          <div><strong>Max Income:</strong> {scholarship.maxFamilyIncome ? formatCurrencyINR(scholarship.maxFamilyIncome) : 'No Limit'}</div>
          <div><strong>State Name:</strong> {scholarship.eligibleState || 'Any'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} style={{ color: '#2563eb' }} />
            <strong>Deadline:</strong> {formatDate(scholarship.deadline)}
          </div>
        </div>

        {/* Ineligibility or Missing Reasons Dropdown */}
        {eligibility.status !== 'Eligible' && eligibility.reasons.length > 0 && (
          <div style={{
            background: eligibility.status === 'Not eligible' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${eligibility.status === 'Not eligible' ? '#fecaca' : '#fde68a'}`,
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            marginBottom: '0.75rem',
            fontSize: '0.8rem'
          }}>
            <div
              onClick={() => setShowReasons(!showReasons)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontWeight: 600,
                color: eligibility.status === 'Not eligible' ? '#991b1b' : '#92400e'
              }}
            >
              <span>Why am I {eligibility.status.toLowerCase()}? ({eligibility.reasons.length})</span>
              {showReasons ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {showReasons && (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', color: '#7f1d1d' }}>
                {eligibility.reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          {showFullDetailsBtn && (
            <Link to={`/scholarships/${scholarship.id}`} className="btn btn-secondary btn-sm">
              View Details
            </Link>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/readiness?scholarshipId=${scholarship.id}`} className="btn btn-secondary btn-sm" title="Check your 5-point readiness score">
              <FileCheck2 size={14} /> Readiness
            </Link>

            {scholarship.officialUrl && (
              <button
                onClick={handleApplyClick}
                className="btn btn-primary btn-sm"
                title="Opens official scholarship registration portal in new tab and tracks status"
              >
                Register on Official Portal <ExternalLink size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
