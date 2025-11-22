import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'task' | 'appointment' | 'system' | 'other';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  isDismissed: boolean;
  relatedTask?: {
    _id: string;
    title: string;
    status: string;
  };
  relatedPatient?: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  link?: string;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filters?: any) => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  dismissNotification: (id: string) => Promise<boolean>;
  markAllAsRead: (type?: string) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchNotifications = async (filters = {}) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value as string);
      });
      
      // Default to non-dismissed notifications
      if (!queryParams.has('isDismissed')) {
        queryParams.append('isDismissed', 'false');
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/notifications?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      return true;
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
      return false;
    }
  };

  const dismissNotification = async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/dismiss`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
      
      // If the notification was unread, update the unread count
      const notification = notifications.find(n => n._id === id);
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return true;
    } catch (err: any) {
      console.error('Error dismissing notification:', err);
      toast.error('Failed to dismiss notification');
      return false;
    }
  };

  const markAllAsRead = async (type?: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const queryParams = type ? `?type=${type}` : '';
      const response = await axios.put(
        `http://localhost:5000/api/notifications/mark-all-read${queryParams}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => {
          if (!type || notification.type === type) {
            return { ...notification, isRead: true };
          }
          return notification;
        })
      );
      
      // Reset unread count if no type filter, otherwise recalculate
      if (!type) {
        setUnreadCount(0);
      } else {
        // Count remaining unread notifications
        const remainingUnread = notifications.filter(
          n => !n.isRead && n.type !== type
        ).length;
        setUnreadCount(remainingUnread);
      }
      
      toast.success(`${response.data.count} notifications marked as read`);
      return true;
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark notifications as read');
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      await axios.delete(
        `http://localhost:5000/api/notifications/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
      
      // If the notification was unread, update the unread count
      const notification = notifications.find(n => n._id === id);
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
      return false;
    }
  };

  // Load notifications when the component mounts and token is available
  useEffect(() => {
    if (token) {
      fetchNotifications();
      
      // Set up polling for new notifications every minute
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 60000); // 60 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [token]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    deleteNotification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};