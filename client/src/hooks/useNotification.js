import useSWR, { mutate } from 'swr';
import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fetcher function sử dụng fetch API
const fetcher = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to fetch');
    }
    return res.json();
  });

// Fetcher cho POST/PUT/DELETE requests
const mutationFetcher = async (url, options) => {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

const useNotifications = (recipientId) => {
  const [error, setError] = useState(null);

  // SWR keys
  const notificationsKey = recipientId ? `${API_BASE_URL}/notifications/recipient/${recipientId}` : null;
  const unreadCountKey = recipientId ? `${API_BASE_URL}/notifications/recipient/${recipientId}/unread-count` : null;
  const allNotificationsKey = `${API_BASE_URL}/notifications`;

  // SWR hooks
  const {
    data: notificationsData,
    error: notificationsError,
    isLoading: notificationsLoading,
    mutate: mutateNotifications
  } = useSWR(notificationsKey, fetcher, {
    refreshInterval: 300000, // Auto refresh mỗi 30 giây
    revalidateOnFocus: true,
    dedupingInterval: 5000
  });

  const {
    data: unreadCountData,
    error: unreadCountError,
    mutate: mutateUnreadCount
  } = useSWR(unreadCountKey, fetcher, {
    refreshInterval: 1000000 // Refresh unread count mỗi 10 giây
  });

  const {
    data: allNotificationsData,
    error: allNotificationsError,
    isLoading: allNotificationsLoading,
    mutate: mutateAllNotifications
  } = useSWR(allNotificationsKey, fetcher);

  // Extract data from SWR responses
  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.unreadCount || 0;
  const allNotifications = allNotificationsData?.data || [];
  const loading = notificationsLoading || allNotificationsLoading;
  const swrError = notificationsError || unreadCountError || allNotificationsError;

  // Lấy notifications với filter
  const getNotificationsByRecipient = useCallback(
    async (filters = {}) => {
      if (!recipientId) return;

      setError(null);
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_BASE_URL}/notifications/recipient/${recipientId}${queryParams ? `?${queryParams}` : ''}`;

        // Mutate SWR cache với URL mới
        await mutate(url, fetcher(url), false);
        await mutateNotifications();
      } catch (err) {
        setError(err.message || 'Error fetching notifications');
      }
    },
    [recipientId, mutateNotifications]
  );

  // Tạo notification mới
  const createNotification = useCallback(
    async (notificationData) => {
      setError(null);
      try {
        const response = await mutationFetcher(`${API_BASE_URL}/notifications`, {
          method: 'POST',
          body: notificationData
        });

        if (response.success) {
          // Optimistic update
          await mutateNotifications(
            (currentData) => ({
              ...currentData,
              data: [response.data, ...(currentData?.data || [])]
            }),
            false
          );

          // Update unread count nếu notification cho current user
          if (response.data.recipient_id === recipientId && response.data.status === 'unread') {
            await mutateUnreadCount(
              (currentData) => ({
                ...currentData,
                unreadCount: (currentData?.unreadCount || 0) + 1
              }),
              false
            );
          }

          // Revalidate để đảm bảo data consistency
          await mutateNotifications();
          await mutateUnreadCount();

          return response.data;
        }
      } catch (err) {
        setError(err.message || 'Error creating notification');
        throw err;
      }
    },
    [recipientId, mutateNotifications, mutateUnreadCount]
  );

  // Đánh dấu notification đã đọc
  const markAsRead = useCallback(
    async (notificationId) => {
      setError(null);
      try {
        const response = await mutationFetcher(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: 'PUT'
        });

        if (response.success) {
          // Optimistic update
          await mutateNotifications(
            (currentData) => ({
              ...currentData,
              data: currentData?.data?.map((notif) => (notif.id === notificationId ? { ...notif, status: 'read' } : notif)) || []
            }),
            false
          );

          await mutateUnreadCount(
            (currentData) => ({
              ...currentData,
              unreadCount: Math.max(0, (currentData?.unreadCount || 0) - 1)
            }),
            false
          );

          // Revalidate
          await mutateNotifications();
          await mutateUnreadCount();

          return response.data;
        }
      } catch (err) {
        setError(err.message || 'Error marking notification as read');
        throw err;
      }
    },
    [mutateNotifications, mutateUnreadCount]
  );

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = useCallback(async () => {
    if (!recipientId) return;

    setError(null);
    try {
      const response = await mutationFetcher(`${API_BASE_URL}/notifications/recipient/${recipientId}/mark-all-read`, {
        method: 'PUT'
      });

      if (response.success) {
        // Optimistic update
        await mutateNotifications(
          (currentData) => ({
            ...currentData,
            data: currentData?.data?.map((notif) => ({ ...notif, status: 'read' })) || []
          }),
          false
        );

        await mutateUnreadCount(
          (currentData) => ({
            ...currentData,
            unreadCount: 0
          }),
          false
        );

        // Revalidate
        await mutateNotifications();
        await mutateUnreadCount();

        return response;
      }
    } catch (err) {
      setError(err.message || 'Error marking all notifications as read');
      throw err;
    }
  }, [recipientId, mutateNotifications, mutateUnreadCount]);

  // Xóa notification cụ thể
  const deleteNotification = useCallback(
    async (notificationId) => {
      setError(null);
      try {
        const response = await mutationFetcher(`${API_BASE_URL}/notifications/${notificationId}`, {
          method: 'DELETE'
        });

        if (response.success) {
          const deletedNotif = notifications.find((notif) => notif.id === notificationId);

          // Optimistic update
          await mutateNotifications(
            (currentData) => ({
              ...currentData,
              data: currentData?.data?.filter((notif) => notif.id !== notificationId) || []
            }),
            false
          );

          if (deletedNotif && deletedNotif.status === 'unread') {
            await mutateUnreadCount(
              (currentData) => ({
                ...currentData,
                unreadCount: Math.max(0, (currentData?.unreadCount || 0) - 1)
              }),
              false
            );
          }

          // Revalidate
          await mutateNotifications();
          await mutateUnreadCount();

          return response.data;
        }
      } catch (err) {
        setError(err.message || 'Error deleting notification');
        throw err;
      }
    },
    [notifications, mutateNotifications, mutateUnreadCount]
  );

  // Xóa tất cả notifications
  const clearAllNotifications = useCallback(async () => {
    if (!recipientId) return;

    setError(null);
    try {
      const response = await mutationFetcher(`${API_BASE_URL}/notifications/recipient/${recipientId}/clear-all`, {
        method: 'DELETE'
      });

      if (response.success) {
        // Optimistic update
        await mutateNotifications(
          (currentData) => ({
            ...currentData,
            data: []
          }),
          false
        );

        await mutateUnreadCount(
          (currentData) => ({
            ...currentData,
            unreadCount: 0
          }),
          false
        );

        // Revalidate
        await mutateNotifications();
        await mutateUnreadCount();

        return response;
      }
    } catch (err) {
      setError(err.message || 'Error clearing notifications');
      throw err;
    }
  }, [recipientId, mutateNotifications, mutateUnreadCount]);

  // Lấy tất cả notifications
  const getAllNotifications = useCallback(async () => {
    await mutateAllNotifications();
  }, [mutateAllNotifications]);

  // Filter notifications
  const filterNotifications = useCallback(
    (filters) => {
      return notifications.filter((notification) => {
        if (filters.type && notification.type !== filters.type) return false;
        if (filters.status && notification.status !== filters.status) return false;
        if (filters.priority && notification.priority !== filters.priority) return false;
        return true;
      });
    },
    [notifications]
  );

  // Force refresh
  const refreshNotifications = useCallback(() => {
    mutateNotifications();
    mutateUnreadCount();
  }, [mutateNotifications, mutateUnreadCount]);

  return {
    // State
    notifications,
    allNotifications,
    unreadCount,
    loading,
    error: error || swrError?.message,

    // Actions
    getAllNotifications,
    getNotificationsByRecipient,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    filterNotifications,

    // Computed values
    unreadNotifications: notifications.filter((n) => n.status === 'unread'),
    readNotifications: notifications.filter((n) => n.status === 'read'),
    notificationsByType: (type) => notifications.filter((n) => n.type === type),
    notificationsByPriority: (priority) => notifications.filter((n) => n.priority === priority),

    // SWR specific
    isValidating: notificationsLoading,
    mutateNotifications,
    mutateUnreadCount
  };
};

export default useNotifications;
