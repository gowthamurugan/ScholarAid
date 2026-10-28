import { ref, get, set, update } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase.js';
import { getMockItem, setMockItem, APPLICATIONS_KEY } from './mockStorage.js';

export const APPLICATION_STATUS_DISCLAIMER =
  'Student-reported only. Not verified against portal records.';

export const VALID_APPLICATION_STATUSES = ['Eligible', 'Opened link', 'Submitted'];

/**
 * Retrieves all application status tracking records for a specific student.
 */
export async function getStudentApplications(uid) {
  if (!uid) return {};

  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, `applications/${uid}`));
    return snap.exists() ? snap.val() : {};
  } else {
    const allApps = getMockItem(APPLICATIONS_KEY, {});
    return allApps[uid] || {};
  }
}

/**
 * Updates or creates a student-reported application status record.
 */
export async function updateApplicationStatus(uid, scholarshipId, statusData) {
  if (!uid || !scholarshipId) throw new Error('Student UID and Scholarship ID are required.');

  const status = statusData.status || 'Eligible';
  if (!VALID_APPLICATION_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}`);
  }

  const record = {
    scholarshipId,
    scholarshipName: statusData.scholarshipName || 'Scholarship',
    provider: statusData.provider || '',
    status,
    applicationNumber: statusData.applicationNumber ? String(statusData.applicationNumber).trim() : '',
    updatedAt: new Date().toISOString(),
    notes: statusData.notes ? String(statusData.notes).trim() : '',
    disclaimer: APPLICATION_STATUS_DISCLAIMER
  };

  if (isFirebaseConfigured && database) {
    await set(ref(database, `applications/${uid}/${scholarshipId}`), record);
    return record;
  } else {
    const allApps = getMockItem(APPLICATIONS_KEY, {});
    if (!allApps[uid]) {
      allApps[uid] = {};
    }
    allApps[uid][scholarshipId] = record;
    setMockItem(APPLICATIONS_KEY, allApps);
    return record;
  }
}

/**
 * Fetches all student-reported applications across all students for the Administrator Monitoring Page.
 * Returns aggregate metrics and filtered listings.
 */
export async function getAllApplicationsForMonitoring() {
  let records = [];

  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, 'applications'));
    if (snap.exists()) {
      const data = snap.val();
      Object.entries(data).forEach(([studentUid, studentApps]) => {
        Object.entries(studentApps || {}).forEach(([scholarshipId, appRecord]) => {
          records.push({
            studentUid,
            scholarshipId,
            ...appRecord
          });
        });
      });
    }
  } else {
    const allApps = getMockItem(APPLICATIONS_KEY, {});
    Object.entries(allApps).forEach(([studentUid, studentApps]) => {
      Object.entries(studentApps || {}).forEach(([scholarshipId, appRecord]) => {
        records.push({
          studentUid,
          scholarshipId,
          ...appRecord
        });
      });
    });
  }

  // Calculate summary counts
  const summary = {
    total: records.length,
    eligibleCount: records.filter(r => r.status === 'Eligible').length,
    openedLinkCount: records.filter(r => r.status === 'Opened link').length,
    submittedCount: records.filter(r => r.status === 'Submitted').length
  };

  return { records, summary, disclaimer: APPLICATION_STATUS_DISCLAIMER };
}
