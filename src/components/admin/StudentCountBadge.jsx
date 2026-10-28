import React, { useState, useEffect } from 'react';
import { Users, Info } from 'lucide-react';
import { calculateStudentEligibilityImpact } from '../../services/scholarshipService.js';

export default function StudentCountBadge({ scholarship }) {
  const [data, setData] = useState({ count: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadImpact() {
      setLoading(true);
      try {
        const res = await calculateStudentEligibilityImpact(scholarship);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to calculate student impact:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadImpact();
    return () => { isMounted = false; };
  }, [scholarship]);

  if (loading) {
    return (
      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
        <Users size={12} /> Calculating eligible student count...
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className="badge badge-eligible" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
        <Users size={13} /> {data.count} of {data.totalStudents} student(s) currently eligible
      </span>
      <span
        title="Calculated using the centralized eligibility engine. Does not imply student application or provider acceptance."
        style={{ color: '#94a3b8', cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </div>
  );
}
