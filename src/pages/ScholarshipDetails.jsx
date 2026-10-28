import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getScholarshipById } from '../services/scholarshipService.js';
import { updateApplicationStatus, APPLICATION_STATUS_DISCLAIMER } from '../services/applicationService.js';
import { evaluateEligibility } from '../utils/eligibilityEngine.js';
import { formatCurrencyINR, formatDate, isValidHttpUrl, safelyOpenExternalUrl } from '../utils/validators.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import EligibilityBadge from '../components/student/EligibilityBadge.jsx';
import StatusTrackerModal from '../components/student/StatusTrackerModal.jsx';
import {
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck2,
  ArrowLeft,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function ScholarshipDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [portalNotice, setPortalNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const item = await getScholarshipById(id);
        if (!item) {
          setError('The requested scholarship could not be located in the database.');
        } else {
          setScholarship(item);
        }
      } catch (err) {
        setError(err.message || 'Error fetching scholarship details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <LoadingState message="Fetching official scholarship details..." />;
  if (error || !scholarship) return <div className="container main-content"><ErrorMessage message={error || 'Scholarship not found'} /></div>;

  const eligibility = evaluateEligibility(profile, scholarship);

  const handleApplyClick = async () => {
    if (!scholarship.officialUrl || !isValidHttpUrl(scholarship.officialUrl)) {
      setPortalNotice('Official application URL is not valid or unavailable for direct navigation.');
      return;
    }

    const opened = safelyOpenExternalUrl(scholarship.officialUrl);
    if (opened) {
      // Record student-reported status as "Opened link" only because action was actually initiated
      if (user?.uid) {
        try {
          await updateApplicationStatus(user.uid, scholarship.id, {
            scholarshipName: scholarship.name,
            provider: scholarship.provider,
            status: 'Opened link'
          });
        } catch (e) {
          console.error('Failed to log Opened link status:', e);
        }
      }
      setPortalNotice('Official portal opened in a new tab. Your application status was updated to "Opened link".');
    } else {
      setPortalNotice('Popup blocked. Please permit external redirects in your browser.');
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '900px' }}>
      <Link to="/scholarships" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        <ArrowLeft size={16} /> Back to Scholarships List
      </Link>

      <div className="card">
        {/* Header */}
        <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <EligibilityBadge status={eligibility.status} />
              <span className="badge badge-success">
                <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                Verified Official Portal
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.35rem' }}>{scholarship.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.95rem' }}>
              <Building size={16} /> Sponsored by: <strong>{scholarship.provider}</strong>
            </div>
          </div>
        </div>

        {/* Portal Notice Alert */}
        {portalNotice && (
          <div style={{ margin: '1rem 0', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {portalNotice}
          </div>
        )}

        {/* Action Button Strip */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '8px',
          margin: '1.25rem 0'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Application Deadline: </span>
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{formatDate(scholarship.deadline)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/readiness?scholarshipId=${scholarship.id}`} className="btn btn-secondary btn-sm">
              <FileCheck2 size={15} /> Check 5-Point Readiness
            </Link>

            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              Update My Status
            </button>

            {scholarship.officialUrl && (
              <button
                onClick={handleApplyClick}
                className="btn btn-primary btn-sm"
              >
                Apply on Official Website <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Official Portal Safe Disclaimer */}
        <div className="disclaimer-alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Official Application Disclaimer:</strong> ScholarAid does not accept direct scholarship applications or process student funds. Clicking 'Apply on Official Website' safely directs you to the sponsoring agency's official website. Opening an external portal does not prove application submission.
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ margin: '1.5rem 0' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem' }}>Overview & Objective</h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {scholarship.description || 'No detailed overview supplied for this scholarship.'}
          </p>
        </div>

        {/* Detailed Criteria Matrix */}
        <div style={{ margin: '1.5rem 0' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.75rem' }}>Official Eligibility Criteria</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <div>
              <span className="stat-label">Minimum GPA</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.minGpa !== null && scholarship.minGpa !== undefined ? scholarship.minGpa : 'Unrestricted'}
              </div>
            </div>

            <div>
              <span className="stat-label">Eligible Category</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.eligibleCategory || 'Open to All'}
              </div>
            </div>

            <div>
              <span className="stat-label">Eligible Degree / Course</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.eligibleCourse || 'Open to All'}
              </div>
            </div>

            <div>
              <span className="stat-label">Max Family Annual Income</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.maxFamilyIncome ? formatCurrencyINR(scholarship.maxFamilyIncome) : 'No Income Ceiling'}
              </div>
            </div>

            <div>
              <span className="stat-label">Eligible State Name</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.eligibleState || 'All Indian States'}
              </div>
            </div>

            <div>
              <span className="stat-label">Certificate Validity Limit</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {scholarship.incomeCertValidityDays || 180} Days
              </div>
            </div>
          </div>
        </div>

        {/* Personal Eligibility Breakdown */}
        <div style={{
          margin: '1.5rem 0',
          padding: '1.25rem',
          borderRadius: '10px',
          background: eligibility.status === 'Eligible' ? '#f0fdf4' : eligibility.status === 'Not eligible' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${eligibility.status === 'Eligible' ? '#bbf7d0' : eligibility.status === 'Not eligible' ? '#fecaca' : '#fde68a'}`
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            marginBottom: '0.5rem',
            color: eligibility.status === 'Eligible' ? '#166534' : eligibility.status === 'Not eligible' ? '#991b1b' : '#92400e'
          }}>
            Your Eligibility Result: {eligibility.status}
          </h3>

          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155' }}>
            {eligibility.reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Required Documents */}
        <div style={{ margin: '1.5rem 0' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.75rem' }}>Required Supporting Documents</h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
            {Array.isArray(scholarship.requiredDocuments) ? (
              scholarship.requiredDocuments.map((doc, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{doc}</li>
              ))
            ) : (
              <li>Standard marksheet, income certificate, and Aadhaar-linked bank passbook</li>
            )}
          </ul>
        </div>

        {/* Source References */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <div><strong>Source URL:</strong> {scholarship.sourceUrl || 'Official Government Gazette / Department Notice'}</div>
          <div><strong>Official Portal:</strong> {scholarship.officialUrl || 'Not provided'}</div>
          <div><strong>Last Verified:</strong> {formatDate(scholarship.lastUpdatedTimestamp)} by {scholarship.reviewedBy || 'Administration'}</div>
        </div>
      </div>

      {modalOpen && (
        <StatusTrackerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          scholarship={scholarship}
          studentUid={user?.uid}
        />
      )}
    </div>
  );
}
