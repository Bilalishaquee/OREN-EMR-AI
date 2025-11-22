import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings as SettingsIcon, Calendar, User, Lock, Bell } from 'lucide-react';
import CalendarIntegration from '../../components/calendar/CalendarIntegration';
import AccountSettingsForm from '../../components/settings/AccountSettingsForm';
import SecuritySettingsForm from '../../components/settings/SecuritySettingsForm';
import NotificationSettingsForm from '../../components/settings/NotificationSettingsForm';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('calendar');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Calendar Settings</h2>
            <CalendarIntegration />
          </div>
        );
      case 'account':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <p className="text-gray-600 mb-4">Manage your account details and preferences.</p>
            <AccountSettingsForm />
          </div>
        );
      case 'security':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
            <p className="text-gray-600 mb-4">Manage your password and security preferences.</p>
            <SecuritySettingsForm />
          </div>
        );
      case 'notifications':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <p className="text-gray-600 mb-4">Manage your notification preferences.</p>
            <NotificationSettingsForm />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
          <nav>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center p-2 rounded-md ${activeTab === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Calendar
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center p-2 rounded-md ${activeTab === 'account' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center p-2 rounded-md ${activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Security
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center p-2 rounded-md ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;