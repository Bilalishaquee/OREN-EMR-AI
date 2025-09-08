import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { FaBell, FaCheck, FaTimes, FaExclamationCircle, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationList: React.FC = () => {
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    dismissNotification, 
    markAllAsRead,
    deleteNotification,
    loading 
  } = useNotification();
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchNotifications(filter === 'all' ? undefined : filter === 'unread');
  }, [fetchNotifications, filter]);
  
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
  };
  
  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismissNotification(id);
  };
  
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification(id);
    }
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
  
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'appointment':
        return 'Appointment';
      case 'system':
        return 'System';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Mark All as Read
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              onClick={() => handleNotificationClick(notification)}
              className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-lg ${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.title}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      {notification.priority && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityClass(notification.priority)}`}>
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</p>
                    
                    <div className="flex space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Mark as read"
                        >
                          Mark as read
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleDismiss(e, notification._id)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Dismiss"
                      >
                        <FaTimes />
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(e, notification._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;