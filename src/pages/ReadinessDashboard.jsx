import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApprovedScholarships } from '../services/scholarshipService.js';
import { calculateReadinessScore } from '../utils/readinessCalculator.js';
import ReadinessChecklist from '../components/student/ReadinessChecklist.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { FileCheck2, ArrowRight } from 'lucide-react';

export default function ReadinessDashboard() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedScholarshipId = searchParams.get('scholarshipId');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const approved = await getApprovedScholarships(profile);
        if (isMounted) {
          setScholarships(approved);
          // If no scholarship is selected in URL, default to first available
          if (!selectedScholarshipId && approved.length > 0) {
            setSearchParams({ scholarshipId: approved[0].id });
          }
        }
      } catch (err) {
        console.error('Failed to load scholarships for readiness:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [selectedScholarshipId, setSearchParams, profile]);

  if (loading) return <LoadingState message="Calculating application readiness checks..." />;

  const currentScholarship = scholarships.find(s => s.id === selectedScholarshipId) || scholarships[0];

  const readinessResult = currentScholarship
    ? calculateReadinessScore(profile, currentScholarship)
    : null;

  return (
    <div className="container main-content" style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <FileCheck2 size={18} /> ADVISORY PRE-APPLICATION AUDIT
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Scholarship Readiness Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Verify your document validity, biometric Aadhaar-bank seeding, and deadline readiness before visiting the official application portal.
        </p>
      </div>

      {scholarships.length === 0 ? (
        <EmptyState
          title="No Approved Scholarships Available"
          description="Readiness scoring is evaluated against approved scholarships. Please check back when scholarships are published."
        />
      ) : (
        <>
          {/* Scholarship Selector */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Select Scholarship to Evaluate Readiness Against:
            </label>
            <select
              value={currentScholarship?.id || ''}
              onChange={e => setSearchParams({ scholarshipId: e.target.value })}
              className="form-select"
            >
              {scholarships.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.provider}) — Deadline: {s.deadline || 'Unspecified'}
                </option>
              ))}
            </select>
            <div className="form-hint">
              Readiness calculations depend on specific scholarship certificate validity limits and application deadlines.
            </div>
          </div>

          {/* Interactive Checklist Component */}
          {readinessResult && (
            <ReadinessChecklist
              readinessResult={readinessResult}
              scholarshipName={currentScholarship?.name}
            />
          )}

          {/* Bottom Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <Link to="/profile" className="btn btn-secondary btn-sm">
              Update Student Profile
            </Link>

            {currentScholarship && (
              <Link to={`/scholarships/${currentScholarship.id}`} className="btn btn-primary btn-sm">
                View Full Scholarship Details <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
