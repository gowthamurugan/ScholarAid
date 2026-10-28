import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getApprovedScholarships } from '../services/scholarshipService.js';
import { matchesTargetType } from '../utils/eligibilityEngine.js';
import ScholarshipCard from '../components/student/ScholarshipCard.jsx';
import StatusTrackerModal from '../components/student/StatusTrackerModal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { Search, Filter, ShieldCheck } from 'lucide-react';

export default function ApprovedScholarships() {
  const { user, profile } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [selectedForApplyModal, setSelectedForApplyModal] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const approved = await getApprovedScholarships(profile);
        if (isMounted) setScholarships(approved);
      } catch (err) {
        console.error('Failed to load approved scholarships:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [profile]);

  if (loading) {
    return <LoadingState message="Loading approved scholarships directory..." />;
  }

  // Filter scholarships
  const filtered = scholarships.filter(s => {
    // If targeted to specific student groups by administrator, check match
    if (profile && profile.role === 'student') {
      const targets = s.targetedStudentTypes;
      if (targets && targets.length > 0 && !targets.includes('All') && !targets.includes('All Students')) {
        if (!matchesTargetType(profile, targets)) return false;
      }
    }

    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'All' ||
      !s.eligibleCategory ||
      s.eligibleCategory.toLowerCase().includes('any') ||
      s.eligibleCategory.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesCourse =
      courseFilter === 'All' ||
      !s.eligibleCourse ||
      s.eligibleCourse.toLowerCase().includes('any') ||
      s.eligibleCourse.toLowerCase().includes(courseFilter.toLowerCase());

    const matchesState =
      stateFilter === 'All' ||
      !s.eligibleState ||
      s.eligibleState.toLowerCase().includes('any') ||
      s.eligibleState.toLowerCase().includes(stateFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesCourse && matchesState;
  });

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <ShieldCheck size={18} /> ADMINISTRATIVELY VERIFIED DIRECTORY
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Approved Scholarships</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Every scholarship listed below has been verified and approved by the administrative team.
          Your personal eligibility calculation is displayed transparently on each card.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div>
            <label className="form-label">Search Keyword</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, provider, keyword..."
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter Course</label>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All Courses</option>
              <option value="B.Tech">B.Tech</option>
              <option value="B.Sc">B.Sc</option>
              <option value="MBBS">MBBS</option>
              <option value="BCA">BCA</option>
              <option value="M.Tech">M.Tech</option>
              <option value="MCA">MCA</option>
            </select>
          </div>
          <div>
            <label className="form-label">Filter State Name</label>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All Indian States</option>
              <option value="Kerala">Kerala</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing <strong>{filtered.length}</strong> approved scholarship(s)
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No scholarships match your filters"
          description="Try clearing your search query or adjusting the category and course filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setCategoryFilter('All');
            setCourseFilter('All');
          }}
        />
      ) : (
        <div className="grid-cards">
          {filtered.map(scholarship => (
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
