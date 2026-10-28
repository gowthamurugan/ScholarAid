import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApprovedScholarships } from '../services/scholarshipService.js';
import { evaluateEligibility, matchesTargetType } from '../utils/eligibilityEngine.js';
import ScholarshipCard from '../components/student/ScholarshipCard.jsx';
import StatusTrackerModal from '../components/student/StatusTrackerModal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { CheckCircle2, ArrowUpDown, ShieldAlert, Award } from 'lucide-react';

export default function EligibleScholarships() {
  const { user, profile } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedForApplyModal, setSelectedForApplyModal] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const approved = await getApprovedScholarships(profile);
        if (isMounted) setScholarships(approved);
      } catch (err) {
        console.error('Failed to load eligible scholarships:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [profile]);

  if (loading) {
    return <LoadingState message="Calculating eligible scholarships for your profile..." />;
  }

  // Filter strictly to Approved scholarships for which evaluateEligibility returns eligible === true
  // and matches targeted student groups if specified
  const eligibleScholarships = scholarships.filter(scholarship => {
    if (profile && profile.role === 'student') {
      const targets = scholarship.targetedStudentTypes;
      if (targets && targets.length > 0 && !targets.includes('All') && !targets.includes('All Students')) {
        if (!matchesTargetType(profile, targets)) return false;
      }
    }
    const res = evaluateEligibility(profile, scholarship);
    return res.eligible;
  });

  // Sorting
  const sorted = [...eligibleScholarships].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'provider') {
      return a.provider.localeCompare(b.provider);
    }
    return 0;
  });

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <CheckCircle2 size={18} /> STRICTLY QUALIFIED CRITERIA
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Eligible Scholarships</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          These scholarships strictly match your verified profile details (GPA, Social Category, Degree Course, State Name, and Annual Income Limit).
        </p>
      </div>

      {/* Advisory notice: does not guarantee award */}
      <div className="disclaimer-alert">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Eligibility Advisory Notice:</strong> Meeting these basic criteria means you qualify to submit an application on the official portal. It does not guarantee scholarship award or funding, which is subject to provider merit rankings and verification.
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        margin: '1.5rem 0'
      }}>
        <span style={{ fontSize: '0.9rem', color: '#475569' }}>
          Found <strong>{sorted.length}</strong> scholarship(s) you qualify for
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="deadline">Upcoming Deadline</option>
            <option value="name">Scholarship Name</option>
            <option value="provider">Provider Organization</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Matching Eligible Scholarships Found"
          description="Based on your current GPA, category, or income, no approved scholarships currently qualify. Complete any missing profile fields or check back when new scholarships are approved."
          actionLabel="Review Student Profile"
          actionTo="/profile"
        />
      ) : (
        <div className="grid-cards">
          {sorted.map(scholarship => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              studentProfile={profile}
              onOpenApply={(s) => setSelectedForApplyModal(s)}
            />
          ))}
        </div>
      )}

      {/* Application Status Modal */}
      {selectedForApplyModal && (
        <StatusTrackerModal
          isOpen={Boolean(selectedForApplyModal)}
          onClose={() => setSelectedForApplyModal(null)}
          scholarship={selectedForApplyModal}
          studentUid={user?.uid}
        />
      )}
    </div>
  );
}
