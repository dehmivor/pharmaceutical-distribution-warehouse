'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import useNotifications from '@/hooks/useNotification';
import { useGlobalNotification } from '@/hooks/useNotification';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, recipientId }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hook cho notifications của current user
  const notificationHook = useNotifications(recipientId);

  // Hook cho global notifications (gửi notifications)
  const globalNotificationHook = useGlobalNotification();

  // Lấy thông tin current user từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Auto-refresh notifications khi user thay đổi
  useEffect(() => {
    if (isInitialized && currentUser && recipientId) {
      notificationHook.refreshNotifications();
    }
  }, [isInitialized, currentUser, recipientId]);

  // Context value
  const contextValue = {
    // Current user info
    currentUser,
    isInitialized,

    // Notification state
    ...notificationHook,

    // Global notification actions
    ...globalNotificationHook,

    // Helper functions
    sendNotificationToUser: async (recipientId, notificationData) => {
      return await globalNotificationHook.sendNotification({
        ...notificationData,
        recipient_id: recipientId
      });
    },

    sendNotificationToRole: async (role, notificationData) => {
      // Lấy danh sách users theo role từ API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/by-role/${role}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`
          }
        });

        if (response.ok) {
          const { users } = await response.json();
          const recipientIds = users.map((user) => user.id);

          return await globalNotificationHook.sendBulkNotifications(recipientIds, notificationData);
        }
      } catch (error) {
        console.error('Error sending notification to role:', error);
        throw error;
      }
    },

    // Real-time status
    isRealTimeConnected: notificationHook.isConnected,

    // Quick actions
    markNotificationAsRead: async (notificationId) => {
      try {
        await notificationHook.markAsRead(notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },

    markAllNotificationsAsRead: async () => {
      try {
        await notificationHook.markAllAsRead();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },

    clearAllNotifications: async () => {
      try {
        await notificationHook.clearAllNotifications();
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    }
  };

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
