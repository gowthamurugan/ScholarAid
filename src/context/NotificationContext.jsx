import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getStudentNotifications, markNotificationAsRead } from '../services/notificationService.js';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const notifs = await getStudentNotifications(user.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (notificationId) => {
    if (!user?.uid) return;
    await markNotificationAsRead(user.uid, notificationId);
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return ctx || { notifications: [], unreadCount: 0, refreshNotifications: () => {}, markAsRead: () => {} };
}
