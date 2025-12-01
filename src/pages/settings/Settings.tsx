import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  User, 
  Lock, 
  Bell,
  ChevronRight
} from 'lucide-react';
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar Settings</h2>
              <p className="text-sm text-gray-600">Manage your calendar integrations and sync preferences</p>
            </div>
            <CalendarIntegration />
          </div>
        );
      case 'account':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
              <p className="text-sm text-gray-600">Manage your account details and personal preferences</p>
            </div>
            <AccountSettingsForm />
          </div>
        );
      case 'security':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
              <p className="text-sm text-gray-600">Manage your password and security preferences</p>
            </div>
            <SecuritySettingsForm />
          </div>
        );
      case 'notifications':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
              <p className="text-sm text-gray-600">Configure how and when you receive notifications</p>
            </div>
            <NotificationSettingsForm />
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg mr-4">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your account preferences and system configurations</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <nav className="p-2">
                <ul className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                              {tab.label}
                            </span>
                          </div>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;