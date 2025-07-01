import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { FaBell, FaCheck, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, dismissNotification, markAllAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    await markAsRead(notification._id);
    
    // Navigate to the appropriate page based on notification type
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.relatedTask) {
      navigate(`/tasks/${notification.relatedTask._id}`);
    } else if (notification.relatedPatient) {
      navigate(`/patients/${notification.relatedPatient._id}`);
    }
    
    setIsOpen(false);
  };
  
  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismissNotification(id);
  };
  
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FaCheck className="text-blue-500" />;
      case 'appointment':
        return <FaExclamationCircle className="text-purple-500" />;
      case 'system':
        return <FaBell className="text-yellow-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };
  
  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 px-4 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-start ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 mr-2">
                      <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(e, notification._id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Dismiss"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="py-2 px-4 bg-gray-100 text-center">
            <Link
              to="/notifications"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;