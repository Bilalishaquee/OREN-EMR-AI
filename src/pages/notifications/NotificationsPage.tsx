import React from 'react';
import NotificationList from '../../components/notifications/NotificationList';

const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
      </div>
      
      <NotificationList />
    </div>
  );
};

export default NotificationsPage;