import { ref, update, get } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase.js';
import { getMockItem, setMockItem, USERS_KEY } from './mockStorage.js';

export const PROFILE_DISCLAIMER =
  'Readiness and eligibility calculations depend solely on the self-reported academic, category, income, and banking details entered by the student. ScholarAid does not verify third-party physical documents.';

/**
 * Updates an authenticated student's profile in Firebase Realtime Database or fallback store.
 * Strictly prevents the student from updating their role to administrator.
 */
export async function updateStudentProfile(uid, profileUpdates) {
  if (!uid) throw new Error('User UID is required to update profile.');

  // Sanitize and ensure role cannot be modified by user
  const sanitizedUpdates = { ...profileUpdates };
  delete sanitizedUpdates.role; // Prevent client role escalation
  delete sanitizedUpdates.uid;
  sanitizedUpdates.updatedAt = new Date().toISOString();

  // Normalize numeric fields
  if (sanitizedUpdates.gpa !== undefined) {
    sanitizedUpdates.gpa = String(sanitizedUpdates.gpa).trim();
  }
  if (sanitizedUpdates.familyIncome !== undefined) {
    sanitizedUpdates.familyIncome = String(sanitizedUpdates.familyIncome).trim();
  }

  if (isFirebaseConfigured && database) {
    await update(ref(database, `users/${uid}`), sanitizedUpdates);
    const snap = await get(ref(database, `users/${uid}`));
    return snap.val();
  } else {
    const users = getMockItem(USERS_KEY, {});
    const existing = users[uid] || { uid, role: 'student', email: '' };

    const updated = {
      ...existing,
      ...sanitizedUpdates,
      role: existing.role || 'student' // Preserve existing role
    };

    users[uid] = updated;
    setMockItem(USERS_KEY, users);
    window.dispatchEvent(new Event('scholaraid_auth_change'));
    return updated;
  }
}

/**
 * Fetches all student profiles (for Administrator eligibility impact count and monitoring).
 * Protected in Firebase Database rules by admin role check.
 */
export async function getAllStudentsForAdmin() {
  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, 'users'));
    if (!snap.exists()) return [];
    const val = snap.val();
    return Object.values(val).filter(u => u.role === 'student');
  } else {
    const users = getMockItem(USERS_KEY, {});
    return Object.values(users).filter(u => u.role === 'student');
  }
}
