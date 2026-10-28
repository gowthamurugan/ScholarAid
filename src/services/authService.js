import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database, isFirebaseConfigured } from './firebase.js';
import {
  initializeMockStorage,
  getMockItem,
  setMockItem,
  USERS_KEY,
  SESSION_KEY
} from './mockStorage.js';

function dispatchAuthEvent() {
  if (typeof window !== 'undefined' && typeof Event !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event('scholaraid_auth_change'));
  }
}

initializeMockStorage();

/**
 * Registers a new student using Firebase Auth (or fallback mock) and saves profile.
 */
export async function registerStudent(email, password, initialProfile = {}) {
  if (!email || !password) {
    throw new Error('Email and password are required for registration.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (isFirebaseConfigured && auth && database) {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = userCredential.user.uid;

    const studentRecord = {
      uid,
      email: email.trim(),
      role: 'student', // Strictly assigned as student upon self-registration
      fullName: initialProfile.fullName?.trim() || '',
      gender: initialProfile.gender || 'Female',
      gpa: initialProfile.gpa !== undefined ? String(initialProfile.gpa) : '',
      category: initialProfile.category || 'General',
      course: initialProfile.course || '',
      familyIncome: initialProfile.familyIncome !== undefined ? String(initialProfile.familyIncome) : '',
      state: initialProfile.state || '',
      department: initialProfile.department || '',
      currentYear: initialProfile.currentYear || '1st Year',
      incomeCertIssueDate: initialProfile.incomeCertIssueDate || '',
      bankLinkedToAadhaar: Boolean(initialProfile.bankLinkedToAadhaar),
      nameMatchesDocuments: Boolean(initialProfile.nameMatchesDocuments),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(database, `users/${uid}`), studentRecord);
    return { user: userCredential.user, profile: studentRecord };
  } else {
    // Fallback Mock Mode
    const users = getMockItem(USERS_KEY, {});
    const existing = Object.values(users).find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const uid = 'stud-' + Date.now();
    const studentRecord = {
      uid,
      email: email.trim(),
      role: 'student',
      fullName: initialProfile.fullName?.trim() || '',
      gender: initialProfile.gender || 'Female',
      gpa: initialProfile.gpa !== undefined ? String(initialProfile.gpa) : '',
      category: initialProfile.category || 'General',
      course: initialProfile.course || '',
      familyIncome: initialProfile.familyIncome !== undefined ? String(initialProfile.familyIncome) : '',
      state: initialProfile.state || '',
      department: initialProfile.department || '',
      currentYear: initialProfile.currentYear || '1st Year',
      incomeCertIssueDate: initialProfile.incomeCertIssueDate || '',
      bankLinkedToAadhaar: Boolean(initialProfile.bankLinkedToAadhaar),
      nameMatchesDocuments: Boolean(initialProfile.nameMatchesDocuments),
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users[uid] = studentRecord;
    setMockItem(USERS_KEY, users);
    setMockItem(SESSION_KEY, { uid, email: studentRecord.email, role: 'student' });

    dispatchAuthEvent();
    return { user: { uid, email: studentRecord.email }, profile: studentRecord };
  }
}

/**
 * Registers a new administrator ID.
 */
export async function registerAdmin(email, password, adminProfile = {}) {
  if (!email || !password) {
    throw new Error('Administrator email and password are required.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (isFirebaseConfigured && auth && database) {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = userCredential.user.uid;

    const adminRecord = {
      uid,
      email: email.trim(),
      role: 'admin',
      fullName: adminProfile.fullName?.trim() || 'Administrator',
      department: adminProfile.department?.trim() || 'Scholarship Administration',
      designation: adminProfile.designation?.trim() || 'Institutional Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(database, `users/${uid}`), adminRecord);
    return { user: userCredential.user, profile: adminRecord };
  } else {
    const users = getMockItem(USERS_KEY, {});
    const existing = Object.values(users).find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const uid = 'admin-' + Date.now();
    const adminRecord = {
      uid,
      email: email.trim(),
      role: 'admin',
      fullName: adminProfile.fullName?.trim() || 'Administrator',
      department: adminProfile.department?.trim() || 'Scholarship Administration',
      designation: adminProfile.designation?.trim() || 'Institutional Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users[uid] = adminRecord;
    setMockItem(USERS_KEY, users);
    setMockItem(SESSION_KEY, { uid, email: adminRecord.email, role: 'admin' });

    dispatchAuthEvent();
    return { user: { uid, email: adminRecord.email }, profile: adminRecord };
  }
}

/**
 * Signs in a student with email and password.
 */
export async function loginStudent(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  if (isFirebaseConfigured && auth && database) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snapshot = await get(ref(database, `users/${cred.user.uid}`));
    const profile = snapshot.val();
    return { user: cred.user, profile };
  } else {
    const users = getMockItem(USERS_KEY, {});
    const found = Object.values(users).find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) {
      throw new Error('Invalid email or password.');
    }
    setMockItem(SESSION_KEY, { uid: found.uid, email: found.email, role: found.role || 'student' });
    dispatchAuthEvent();
    return { user: { uid: found.uid, email: found.email }, profile: found };
  }
}

/**
 * Dedicated Administrator Login.
 * Verifies that the user holds an administrator role in the database.
 * Does not allow students to log in through the admin route.
 */
export async function loginAdmin(email, password, adminKey = '') {
  if (!email || !password) {
    throw new Error('Administrator email and password are required.');
  }

  if (isFirebaseConfigured && auth && database) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snapshot = await get(ref(database, `users/${cred.user.uid}`));
    const profile = snapshot.val();

    if (!profile || profile.role !== 'admin') {
      await signOut(auth);
      throw new Error('Access Denied: This account does not possess verified administrator privileges.');
    }

    return { user: cred.user, profile };
  } else {
    const users = getMockItem(USERS_KEY, {});
    // Check for admin account in mock store
    let adminUser = Object.values(users).find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === 'admin'
    );

    // If default demo admin
    if (!adminUser && email.toLowerCase() === 'admin@scholaraid.edu') {
      adminUser = {
        uid: 'admin-root',
        email: 'admin@scholaraid.edu',
        role: 'admin',
        fullName: 'Administrator'
      };
      users[adminUser.uid] = adminUser;
      setMockItem(USERS_KEY, users);
    }

    if (!adminUser) {
      throw new Error('Invalid credentials or account does not possess administrator authorization.');
    }

    setMockItem(SESSION_KEY, { uid: adminUser.uid, email: adminUser.email, role: 'admin' });
    dispatchAuthEvent();
    return { user: { uid: adminUser.uid, email: adminUser.email }, profile: adminUser };
  }
}

/**
 * Signs in using Google ID (OAuth) for either student or administrator.
 * Supports live Firebase popup or instant Google ID simulation for local development.
 */
export async function loginWithGoogle(role = 'student', customAccount = null) {
  if (isFirebaseConfigured && auth && database) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const fbUser = userCredential.user;
    const uid = fbUser.uid;

    const snapshot = await get(ref(database, `users/${uid}`));
    let profile = snapshot.val();

    if (role === 'admin') {
      if (!profile || profile.role !== 'admin') {
        if (fbUser.email === 'admin@scholaraid.edu' || fbUser.email.endsWith('@admin.scholaraid.edu')) {
          profile = {
            uid,
            email: fbUser.email,
            role: 'admin',
            fullName: fbUser.displayName || 'Administrator',
            authProvider: 'google',
            createdAt: new Date().toISOString()
          };
          await set(ref(database, `users/${uid}`), profile);
        } else {
          await signOut(auth);
          throw new Error('Access Denied: This Google account does not have administrator privileges.');
        }
      }
      return { user: fbUser, profile };
    } else {
      // Student
      if (!profile) {
        profile = {
          uid,
          email: fbUser.email,
          role: 'student',
          fullName: fbUser.displayName || fbUser.email.split('@')[0],
          gender: 'Female',
          gpa: '3.80',
          category: 'General',
          course: 'B.Tech Computer Science',
          familyIncome: '320000',
          state: 'Kerala',
          department: 'Computer Science & Engineering',
          currentYear: '1st Year',
          incomeCertIssueDate: '',
          bankLinkedToAadhaar: true,
          nameMatchesDocuments: true,
          authProvider: 'google',
          photoURL: fbUser.photoURL || '',
          isSample: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await set(ref(database, `users/${uid}`), profile);
      }
      return { user: fbUser, profile };
    }
  } else {
    // Local / Dev Google ID Provider
    const email = customAccount?.email || (role === 'admin' ? 'admin.google@scholaraid.edu' : 'ananya.sharma@gmail.com');
    const fullName = customAccount?.name || (role === 'admin' ? 'Google Verified Administrator' : 'Ananya Sharma');
    const uid = 'google-' + email.replace(/[^a-zA-Z0-9]/g, '-');

    const users = getMockItem(USERS_KEY, {});
    let profile = users[uid];

    if (role === 'admin') {
      if (!profile) {
        profile = {
          uid,
          email,
          role: 'admin',
          fullName,
          authProvider: 'google',
          isSample: false,
          createdAt: new Date().toISOString()
        };
        users[uid] = profile;
        setMockItem(USERS_KEY, users);
      }
    } else {
      if (!profile) {
        profile = {
          uid,
          email,
          role: 'student',
          fullName,
          gender: customAccount?.gender || 'Female',
          gpa: '3.85',
          category: customAccount?.category || 'General',
          course: 'B.Tech Computer Science',
          familyIncome: '320000',
          state: 'Kerala',
          department: 'Computer Science & Engineering',
          currentYear: '3rd Year',
          incomeCertIssueDate: '2026-08-15',
          bankLinkedToAadhaar: true,
          nameMatchesDocuments: true,
          authProvider: 'google',
          isSample: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users[uid] = profile;
        setMockItem(USERS_KEY, users);
      }
    }

    setMockItem(SESSION_KEY, { uid: profile.uid, email: profile.email, role: profile.role });
    dispatchAuthEvent();
    return { user: { uid: profile.uid, email: profile.email }, profile };
  }
}

/**
 * Signs out current user.
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
  dispatchAuthEvent();
}

/**
 * Retrieves the profile of a given UID from database or mock store.
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  if (isFirebaseConfigured && database) {
    const snapshot = await get(ref(database, `users/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  } else {
    const users = getMockItem(USERS_KEY, {});
    return users[uid] || null;
  }
}

/**
 * Subscribes to auth state changes.
 */
export function subscribeToAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        callback({ user: fbUser, profile, isAuthenticated: true });
      } else {
        callback({ user: null, profile: null, isAuthenticated: false });
      }
    });
  } else {
    const checkMockSession = async () => {
      const session = getMockItem(SESSION_KEY, null);
      if (session && session.uid) {
        const profile = await getUserProfile(session.uid);
        callback({ user: { uid: session.uid, email: session.email }, profile, isAuthenticated: true });
      } else {
        callback({ user: null, profile: null, isAuthenticated: false });
      }
    };

    checkMockSession();
    const handler = () => checkMockSession();
    window.addEventListener('scholaraid_auth_change', handler);
    return () => window.removeEventListener('scholaraid_auth_change', handler);
  }
}
