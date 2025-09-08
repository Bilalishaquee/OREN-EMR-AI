import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const NotificationSettingsForm: React.FC = () => {
  const { user, token } = useAuth();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    systemUpdates: false,
    marketingEmails: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real application, you would fetch the user's notification preferences
  // from the server when the component mounts
  useEffect(() => {
    // Simulating loading saved preferences
    // In a real app, you would fetch this data from your API
    const loadPreferences = async () => {
      try {
        // This would be replaced with an actual API call
        // const response = await axios.get('http://localhost:5000/api/auth/notification-preferences', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // setSettings(response.data.preferences);
        
        // For now, we'll just use default values
        setSettings({
          emailNotifications: true,
          appointmentReminders: true,
          systemUpdates: false,
          marketingEmails: false
        });
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        toast.error('Failed to load notification preferences');
      }
    };
    
    if (user) {
      loadPreferences();
    }
  }, [user, token]);

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real application, you would save the settings to the server
      // await axios.put(
      //   'http://localhost:5000/api/auth/notification-preferences',
      //   settings,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );
      
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive email notifications about your account</p>
            </div>
            <button
              type="button"
              className={`${settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              onClick={() => handleToggle('emailNotifications')}
            >
              <span className="sr-only">Toggle email notifications</span>
              <span
                className={`${settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Appointment Reminders</h3>
              <p className="text-sm text-gray-500">Receive reminders about upcoming appointments</p>
            </div>
            <button
              type="button"
              className={`${settings.appointmentReminders ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              onClick={() => handleToggle('appointmentReminders')}
            >
              <span className="sr-only">Toggle appointment reminders</span>
              <span
                className={`${settings.appointmentReminders ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">System Updates</h3>
              <p className="text-sm text-gray-500">Receive notifications about system updates and maintenance</p>
            </div>
            <button
              type="button"
              className={`${settings.systemUpdates ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              onClick={() => handleToggle('systemUpdates')}
            >
              <span className="sr-only">Toggle system updates</span>
              <span
                className={`${settings.systemUpdates ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
              <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
            </div>
            <button
              type="button"
              className={`${settings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              onClick={() => handleToggle('marketingEmails')}
            >
              <span className="sr-only">Toggle marketing emails</span>
              <span
                className={`${settings.marketingEmails ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettingsForm;