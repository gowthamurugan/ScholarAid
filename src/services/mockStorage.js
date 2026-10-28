import {
  SAMPLE_STUDENTS,
  SAMPLE_SCHOLARSHIPS,
  SAMPLE_ANNOUNCEMENTS,
  SAMPLE_APPLICATIONS
} from '../utils/sampleData.js';

const USERS_KEY = 'scholaraid_mock_users';
const SCHOLARSHIPS_KEY = 'scholaraid_mock_scholarships';
const APPLICATIONS_KEY = 'scholaraid_mock_applications';
const ANNOUNCEMENTS_KEY = 'scholaraid_mock_announcements';
const NOTIFICATIONS_KEY = 'scholaraid_mock_notifications';
const SESSION_KEY = 'scholaraid_mock_session';

let memoryStore = {};
function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  return {
    getItem: (k) => memoryStore[k] || null,
    setItem: (k, v) => { memoryStore[k] = String(v); },
    removeItem: (k) => { delete memoryStore[k]; },
    clear: () => { memoryStore = {}; }
  };
}

export function initializeMockStorage() {
  const store = getStorage();
  const existingSch = getMockItem(SCHOLARSHIPS_KEY, null);
  const versionKey = 'scholaraid_zero_approved_init_v3';
  const hasOldDemoData = existingSch && Object.keys(existingSch).some(k => k.startsWith('sample-sch-') || existingSch[k]?.name?.includes('(Demo)'));
  if (!existingSch || hasOldDemoData || !store.getItem(versionKey)) {
    const schMap = {};
    SAMPLE_SCHOLARSHIPS.forEach(s => { schMap[s.id] = s; });
    store.setItem(SCHOLARSHIPS_KEY, JSON.stringify(schMap));
    store.setItem(versionKey, 'true');
  }

  const existingUsers = getMockItem(USERS_KEY, null);
  if (!existingUsers) {
    const userMap = {};
    SAMPLE_STUDENTS.forEach(u => { userMap[u.uid] = u; });
    // Default admin account in mock mode
    userMap['admin-root'] = {
      uid: 'admin-root',
      email: 'admin@scholaraid.edu',
      role: 'admin',
      fullName: 'Chief Scholarship Administrator',
      createdAt: '2026-08-01T00:00:00Z'
    };
    store.setItem(USERS_KEY, JSON.stringify(userMap));
  } else {
    // Ensure all sample students are available with updated fields (e.g. gender, BC/MBC)
    let updated = false;
    SAMPLE_STUDENTS.forEach(u => {
      if (!existingUsers[u.uid]) {
        existingUsers[u.uid] = u;
        updated = true;
      } else if (!existingUsers[u.uid].gender || (u.category && existingUsers[u.uid].isSample)) {
        existingUsers[u.uid] = { ...existingUsers[u.uid], gender: existingUsers[u.uid].gender || u.gender, category: existingUsers[u.uid].category || u.category };
        updated = true;
      }
    });
    if (updated) {
      store.setItem(USERS_KEY, JSON.stringify(existingUsers));
    }
  }

  const existingApps = getMockItem(APPLICATIONS_KEY, null);
  const hasOldApps = existingApps && Object.values(existingApps).some(userApps => Object.keys(userApps).some(k => k.startsWith('sample-sch-')));
  if (!existingApps || hasOldApps) {
    store.setItem(APPLICATIONS_KEY, JSON.stringify(SAMPLE_APPLICATIONS));
  }

  const existingAnn = getMockItem(ANNOUNCEMENTS_KEY, null);
  const hasOldAnn = existingAnn && Object.keys(existingAnn).some(k => k.startsWith('sample-ann-'));
  if (!existingAnn || hasOldAnn) {
    const annMap = {};
    SAMPLE_ANNOUNCEMENTS.forEach(a => { annMap[a.id] = a; });
    store.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(annMap));
  }

  const existingNotifs = getMockItem(NOTIFICATIONS_KEY, null);
  const hasOldNotifs = existingNotifs && Object.values(existingNotifs).some(userNotifs => Object.values(userNotifs).some(n => n.scholarshipId?.startsWith('sample-sch-')));
  if (!existingNotifs || hasOldNotifs) {
    const notifs = {
      'demo-student-eligible': {
        'notif-1': {
          id: 'notif-1',
          announcementId: 'ann-01',
          scholarshipId: 'nsp-csss-01',
          title: 'NSP Portal Active: CSSS Applications Now Open',
          message: 'Ensure your income certificate is within 180-day validity window and bank account is seeded with Aadhaar.',
          createdAt: '2026-10-18T10:30:00Z',
          read: false
        }
      }
    };
    store.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
}

export function getMockItem(key, defaultVal = {}) {
  try {
    const val = getStorage().getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function setMockItem(key, value) {
  try {
    getStorage().setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Mock storage set error:', err);
  }
}

export {
  USERS_KEY,
  SCHOLARSHIPS_KEY,
  APPLICATIONS_KEY,
  ANNOUNCEMENTS_KEY,
  NOTIFICATIONS_KEY,
  SESSION_KEY
};
