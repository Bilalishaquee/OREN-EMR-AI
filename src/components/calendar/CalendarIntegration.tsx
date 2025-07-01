import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface CalendarIntegrationProps {
  onSync?: () => void;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onSync }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has connected Google Calendar
    if (user && user.googleCalendar && user.googleCalendar.accessToken) {
      setIsConnected(true);
    }
  }, [user]);

  const handleConnect = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/google-calendar/auth', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Redirect to Google OAuth consent screen
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const response = await axios.post(
        'http://localhost:5000/api/google-calendar/sync-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLastSynced(new Date().toLocaleString());
      toast.success(response.data.message);
      
      // Call the onSync callback if provided
      if (onSync) {
        onSync();
      }
    } catch (error) {
      console.error('Error syncing appointments:', error);
      toast.error('Failed to sync appointments');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-500" />
          Google Calendar Integration
        </h2>
        {isConnected && (
          <span className="flex items-center text-sm text-green-600">
            <CheckCircle className="mr-1 h-4 w-4" />
            Connected
          </span>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">
            Connect your Google Calendar to sync patient appointments.
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center mx-auto"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">
            Your Google Calendar is connected. You can sync your appointments to keep them in sync.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync All Appointments
                </>
              )}
            </button>
            {lastSynced && (
              <p className="text-sm text-gray-500 text-center">
                Last synced: {lastSynced}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;