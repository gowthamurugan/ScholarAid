import { ref, get, set, update } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase.js';
import { getMockItem, setMockItem, SCHOLARSHIPS_KEY } from './mockStorage.js';
import { evaluateEligibility, matchesTargetType } from '../utils/eligibilityEngine.js';
import { getAllStudentsForAdmin } from './profileService.js';

/**
 * Fetches all Approved scholarships.
 * If a student profile is provided, filters according to administrator-specified targetedStudentTypes
 * (e.g. BC, MBC, Women, etc.).
 */
export async function getApprovedScholarships(studentProfile = null) {
  let list = [];
  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, 'scholarships'));
    if (!snap.exists()) return [];
    const val = snap.val();
    list = Object.values(val).filter(s => s && s.status === 'Approved');
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    list = Object.values(scholarships).filter(s => s && s.status === 'Approved');
  }

  if (studentProfile && studentProfile.role === 'student') {
    list = list.filter(s => {
      const targets = s.targetedStudentTypes;
      if (!targets || targets.length === 0 || targets.includes('All') || targets.includes('All Students')) {
        return true;
      }
      return matchesTargetType(studentProfile, targets);
    });
  }

  return list;
}

/**
 * Fetches all scholarships (Pending, Approved, Rejected) for Administrator dashboards.
 */
export async function getAllScholarshipsForAdmin() {
  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, 'scholarships'));
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    return Object.values(scholarships);
  }
}

/**
 * Fetches pending scholarships awaiting administrator review.
 */
export async function getPendingScholarships() {
  const all = await getAllScholarshipsForAdmin();
  return all.filter(s => s.status === 'Pending');
}

/**
 * Retrieves a single scholarship by its ID.
 */
export async function getScholarshipById(scholarshipId) {
  if (!scholarshipId) return null;

  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, `scholarships/${scholarshipId}`));
    return snap.exists() ? snap.val() : null;
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    return scholarships[scholarshipId] || null;
  }
}

/**
 * Approves a candidate scholarship record with optional targeted student types.
 */
export async function approveScholarship(scholarshipId, reviewerName = 'Administrator', targetedStudentTypes = ['All']) {
  if (!scholarshipId) throw new Error('Scholarship ID is required for approval.');

  const targets = Array.isArray(targetedStudentTypes) && targetedStudentTypes.length > 0
    ? targetedStudentTypes
    : ['All'];

  const updates = {
    status: 'Approved',
    targetedStudentTypes: targets,
    reviewedBy: reviewerName,
    reviewedAt: new Date().toISOString(),
    lastUpdatedTimestamp: new Date().toISOString()
  };

  if (isFirebaseConfigured && database) {
    await update(ref(database, `scholarships/${scholarshipId}`), updates);
    const snap = await get(ref(database, `scholarships/${scholarshipId}`));
    return snap.val();
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    if (!scholarships[scholarshipId]) throw new Error('Scholarship not found.');

    scholarships[scholarshipId] = {
      ...scholarships[scholarshipId],
      ...updates
    };
    setMockItem(SCHOLARSHIPS_KEY, scholarships);
    return scholarships[scholarshipId];
  }
}

/**
 * Rejects a candidate scholarship record with an optional reason.
 */
export async function rejectScholarship(scholarshipId, reason = '', reviewerName = 'Administrator') {
  if (!scholarshipId) throw new Error('Scholarship ID is required for rejection.');

  const updates = {
    status: 'Rejected',
    rejectionReason: reason || 'Does not meet institutional eligibility standards or verification criteria.',
    reviewedBy: reviewerName,
    reviewedAt: new Date().toISOString(),
    lastUpdatedTimestamp: new Date().toISOString()
  };

  if (isFirebaseConfigured && database) {
    await update(ref(database, `scholarships/${scholarshipId}`), updates);
    const snap = await get(ref(database, `scholarships/${scholarshipId}`));
    return snap.val();
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    if (!scholarships[scholarshipId]) throw new Error('Scholarship not found.');

    scholarships[scholarshipId] = {
      ...scholarships[scholarshipId],
      ...updates
    };
    setMockItem(SCHOLARSHIPS_KEY, scholarships);
    return scholarships[scholarshipId];
  }
}

/**
 * Updates a scholarship record (edit review form before or after approval).
 */
export async function updateScholarship(scholarshipId, updatedFields, reviewerName = 'Administrator') {
  if (!scholarshipId) throw new Error('Scholarship ID is required.');

  const updates = {
    ...updatedFields,
    lastUpdatedTimestamp: new Date().toISOString(),
    reviewedBy: reviewerName
  };

  if (isFirebaseConfigured && database) {
    await update(ref(database, `scholarships/${scholarshipId}`), updates);
    const snap = await get(ref(database, `scholarships/${scholarshipId}`));
    return snap.val();
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    if (!scholarships[scholarshipId]) throw new Error('Scholarship not found.');

    scholarships[scholarshipId] = {
      ...scholarships[scholarshipId],
      ...updates
    };
    setMockItem(SCHOLARSHIPS_KEY, scholarships);
    return scholarships[scholarshipId];
  }
}

/**
 * Creates a new scholarship (either via AI discovery workflow with status "Pending",
 * or manual administrator entry).
 */
export async function createScholarship(scholarshipData) {
  const id = scholarshipData.id || 'sch-' + Date.now();
  const record = {
    id,
    name: scholarshipData.name || 'Untitled Scholarship',
    provider: scholarshipData.provider || 'Unspecified Provider',
    description: scholarshipData.description || '',
    officialUrl: scholarshipData.officialUrl || '',
    sourceUrl: scholarshipData.sourceUrl || '',
    minGpa: scholarshipData.minGpa !== undefined && scholarshipData.minGpa !== '' ? Number(scholarshipData.minGpa) : null,
    eligibleCategory: scholarshipData.eligibleCategory || 'Any',
    eligibleCourse: scholarshipData.eligibleCourse || 'Any',
    maxFamilyIncome: scholarshipData.maxFamilyIncome !== undefined && scholarshipData.maxFamilyIncome !== '' ? Number(scholarshipData.maxFamilyIncome) : null,
    eligibleState: scholarshipData.eligibleState || 'Any',
    requiredDocuments: Array.isArray(scholarshipData.requiredDocuments)
      ? scholarshipData.requiredDocuments
      : String(scholarshipData.requiredDocuments || '')
          .split(',')
          .map(d => d.trim())
          .filter(Boolean),
    deadline: scholarshipData.deadline || '',
    incomeCertValidityDays: Number(scholarshipData.incomeCertValidityDays || 180),
    status: scholarshipData.status || 'Pending',
    discoveryTimestamp: scholarshipData.discoveryTimestamp || new Date().toISOString(),
    lastUpdatedTimestamp: new Date().toISOString(),
    reviewedBy: scholarshipData.reviewedBy || null,
    reviewedAt: scholarshipData.reviewedAt || null,
    isSample: Boolean(scholarshipData.isSample)
  };

  if (isFirebaseConfigured && database) {
    await set(ref(database, `scholarships/${id}`), record);
    return record;
  } else {
    const scholarships = getMockItem(SCHOLARSHIPS_KEY, {});
    scholarships[id] = record;
    setMockItem(SCHOLARSHIPS_KEY, scholarships);
    return record;
  }
}

/**
 * Calculates how many existing student profiles currently satisfy this scholarship's
 * eligibility rules using the centralized eligibility engine.
 */
export async function calculateStudentEligibilityImpact(scholarship) {
  if (!scholarship) return { count: 0, totalStudents: 0, eligibleStudents: [] };

  const students = await getAllStudentsForAdmin();
  const eligibleStudents = [];

  for (const student of students) {
    const result = evaluateEligibility(student, scholarship);
    if (result.eligible) {
      eligibleStudents.push({
        uid: student.uid,
        email: student.email,
        fullName: student.fullName,
        category: student.category,
        course: student.course,
        gpa: student.gpa
      });
    }
  }

  return {
    count: eligibleStudents.length,
    totalStudents: students.length,
    eligibleStudents
  };
}
