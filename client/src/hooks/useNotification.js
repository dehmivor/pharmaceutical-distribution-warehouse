import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function useNotification(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Khởi tạo socket client
  const [socket, setSocket] = useState(null);

  // Load danh sách notification từ API backend
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
        params: { recipient_id: userId },
        withCredentials: true
      });
      setNotifications(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Tạo notification mới
  const createNotification = async (data) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/notifications`, data, {
        withCredentials: true
      });
      // Thông báo realtime sẽ tự động được socket đẩy về, nhưng nếu muốn có thể cập nhật thủ công
      // setNotifications(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Xóa notification theo id
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`, {
        withCredentials: true
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Đánh dấu notification là đã đọc
  const markAsRead = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, null, {
        withCredentials: true
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: res.data.status } : n)));
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        { recipient_id: userId },
        {
          withCredentials: true
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Xóa tất cả notification trên client
  const clearAll = () => {
    setNotifications([]);
  };

  // Thiết lập websocket kết nối, lắng nghe realtime event
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true
    });

    setSocket(newSocket);

    // Xử lý lỗi kết nối
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError(error);
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setError(null);
      // Join rooms sau khi kết nối thành công
      newSocket.emit('joinRooms', [userId, 'system']);
    });

    // Nhận notification realtime
    newSocket.on('newNotification', (noti) => {
      setNotifications((prev) => {
        if (prev.findIndex((n) => n.id === noti.id) !== -1) return prev;
        return [noti, ...prev];
      });
    });

    // Xử lý realtime xóa notification
    newSocket.on('deletedNotificationId', (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      if (newSocket) {
        newSocket.off('newNotification');
        newSocket.off('deletedNotificationId');
        newSocket.off('connect_error');
        newSocket.off('connect');
        newSocket.disconnect();
      }
      setSocket(null);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    createNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}
