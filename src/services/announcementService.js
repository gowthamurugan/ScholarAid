import { ref, get, set } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase.js';
import {
  getMockItem,
  setMockItem,
  ANNOUNCEMENTS_KEY,
  NOTIFICATIONS_KEY
} from './mockStorage.js';
import { getScholarshipById, approveScholarship } from './scholarshipService.js';
import { getAllStudentsForAdmin } from './profileService.js';
import { evaluateEligibility, matchesTargetType } from '../utils/eligibilityEngine.js';

export { matchesTargetType };

/**
 * Fetches all published announcements.
 */
export async function getAnnouncements() {
  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, 'announcements'));
    if (!snap.exists()) return [];
    return Object.values(snap.val()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else {
    const anns = getMockItem(ANNOUNCEMENTS_KEY, {});
    return Object.values(anns).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}



/**
 * Calculates matching announcement recipients for a scholarship given target criteria.
 */
export async function getMatchingAnnouncementRecipients(scholarship, targetTypes = []) {
  if (!scholarship) return [];
  const allStudents = await getAllStudentsForAdmin();

  return allStudents.filter(student => {
    // If targetTypes includes 'All' or 'All Students', deliver to all registered students
    if (!targetTypes || targetTypes.length === 0 || targetTypes.includes('All') || targetTypes.includes('All Students')) {
      return true;
    }
    return matchesTargetType(student, targetTypes);
  });
}

/**
 * Creates and publishes an announcement targeted ONLY to students who match the selected administrative target type
 * (e.g. All Students, OBC, BC, MBC, SC, ST, Women, Men).
 * Automatically ensures the scholarship is approved and visible in Approved Scholarships.
 */
export async function createTargetedAnnouncement(announcementData, adminName = 'Administrator') {
  const { title, message, scholarshipId, targetTypes = [] } = announcementData;
  if (!title || !message || !scholarshipId) {
    throw new Error('Title, message, and scholarship selection are required.');
  }

  const scholarship = await getScholarshipById(scholarshipId);
  if (!scholarship) {
    throw new Error('Scholarship not found.');
  }

  // Find students that match the specific target types
  const eligibleRecipients = await getMatchingAnnouncementRecipients(scholarship, targetTypes);

  // Automatically approve scholarship with the selected target types so it appears in Approved Scholarships
  await approveScholarship(scholarshipId, adminName, targetTypes);

  const announcementId = 'ann-' + Date.now();
  const createdAt = new Date().toISOString();

  const formattedTargetStr = targetTypes && targetTypes.length > 0 && !targetTypes.includes('All') && !targetTypes.includes('All Students')
    ? targetTypes.join(', ')
    : 'All Students';

  const announcementRecord = {
    id: announcementId,
    scholarshipId,
    scholarshipName: scholarship.name,
    title: title.trim(),
    message: message.trim(),
    targetTypes: targetTypes.length > 0 ? targetTypes : ['All Students'],
    targetCriteria: `Target: ${formattedTargetStr} (${scholarship.name})`,
    createdAt,
    createdBy: adminName,
    eligibleRecipientCount: eligibleRecipients.length
  };

  // 1. Save announcement
  if (isFirebaseConfigured && database) {
    await set(ref(database, `announcements/${announcementId}`), announcementRecord);

    // 2. Dispatch notifications strictly to matching students
    for (const student of eligibleRecipients) {
      const notifId = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const notifRecord = {
        id: notifId,
        announcementId,
        scholarshipId,
        title: title.trim(),
        message: message.trim(),
        scholarshipName: scholarship.name,
        targetGroup: formattedTargetStr,
        createdAt,
        read: false
      };
      await set(ref(database, `notifications/${student.uid}/${notifId}`), notifRecord);
    }
  } else {
    // Mock Mode
    const anns = getMockItem(ANNOUNCEMENTS_KEY, {});
    anns[announcementId] = announcementRecord;
    setMockItem(ANNOUNCEMENTS_KEY, anns);

    const notifs = getMockItem(NOTIFICATIONS_KEY, {});
    for (const student of eligibleRecipients) {
      if (!notifs[student.uid]) notifs[student.uid] = {};
      const notifId = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      notifs[student.uid][notifId] = {
        id: notifId,
        announcementId,
        scholarshipId,
        title: title.trim(),
        message: message.trim(),
        scholarshipName: scholarship.name,
        targetGroup: formattedTargetStr,
        createdAt,
        read: false
      };
    }
    setMockItem(NOTIFICATIONS_KEY, notifs);
  }

  return {
    announcement: announcementRecord,
    recipientCount: eligibleRecipients.length,
    matchingStudents: eligibleRecipients
  };
}
