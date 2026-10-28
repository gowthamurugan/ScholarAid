import { ref, get, update } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase.js';
import { getMockItem, setMockItem, NOTIFICATIONS_KEY } from './mockStorage.js';

/**
 * Retrieves notifications for the current authenticated student.
 */
export async function getStudentNotifications(uid) {
  if (!uid) return [];

  if (isFirebaseConfigured && database) {
    const snap = await get(ref(database, `notifications/${uid}`));
    if (!snap.exists()) return [];
    return Object.values(snap.val()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else {
    const allNotifs = getMockItem(NOTIFICATIONS_KEY, {});
    const studentNotifs = allNotifs[uid] || {};
    return Object.values(studentNotifs).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(uid, notificationId) {
  if (!uid || !notificationId) return;

  if (isFirebaseConfigured && database) {
    await update(ref(database, `notifications/${uid}/${notificationId}`), {
      read: true
    });
  } else {
    const allNotifs = getMockItem(NOTIFICATIONS_KEY, {});
    if (allNotifs[uid] && allNotifs[uid][notificationId]) {
      allNotifs[uid][notificationId].read = true;
      setMockItem(NOTIFICATIONS_KEY, allNotifs);
    }
  }
}
