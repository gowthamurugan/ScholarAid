import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToAuth,
  loginStudent as serviceLoginStudent,
  loginAdmin as serviceLoginAdmin,
  loginWithGoogle as serviceLoginWithGoogle,
  registerStudent as serviceRegisterStudent,
  registerAdmin as serviceRegisterAdmin,
  logoutUser as serviceLogoutUser,
  getUserProfile
} from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(({ user: authUser, profile: userProfile }) => {
      setUser(authUser);
      setProfile(userProfile);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loginStudent = async (email, password) => {
    setLoading(true);
    try {
      const result = await serviceLoginStudent(email, password);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password, adminKey) => {
    setLoading(true);
    try {
      const result = await serviceLoginAdmin(email, password, adminKey);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role = 'student', customAccount = null) => {
    setLoading(true);
    try {
      const result = await serviceLoginWithGoogle(role, customAccount);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, profileData) => {
    setLoading(true);
    try {
      const result = await serviceRegisterStudent(email, password, profileData);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (email, password, adminProfile) => {
    setLoading(true);
    try {
      const result = await serviceRegisterAdmin(email, password, adminProfile);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await serviceLogoutUser();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      const updated = await getUserProfile(user.uid);
      setProfile(updated);
      return updated;
    }
  };

  const role = profile?.role || (user ? 'student' : null);
  const isAdmin = role === 'admin';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isAuthenticated,
        loading,
        loginStudent,
        loginAdmin,
        loginWithGoogle,
        register,
        registerAdmin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
