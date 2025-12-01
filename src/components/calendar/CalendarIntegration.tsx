import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, CheckCircle, RefreshCw } from 'lucide-react';

interface CalendarIntegrationProps {
  onSync?: () => void;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onSync }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // 1) Check server-side status (authoritative)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get('/api/google-calendar/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsConnected(!!res.data?.connected);
      } catch {
        // ignore
      }
    };
    run();
  }, [token]);

  // 2) If we just returned from Google callback: ?calendarConnected=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendarConnected') === 'true') {
      setIsConnected(true);
      toast.success('Google Calendar connected!');
      // Clean the query param so it doesn’t keep firing
      const url = new URL(window.location.href);
      url.searchParams.delete('calendarConnected');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleConnect = async () => {
    try {
      const response = await axios.get('/api/google-calendar/auth', {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.authUrl; // go to Google
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const response = await axios.post(
        '/api/google-calendar/sync-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLastSynced(new Date().toLocaleString());
      toast.success(response.data.message);
      onSync?.();
    } catch (error) {
      console.error('Error syncing appointments:', error);
      toast.error('Failed to sync appointments');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Calendar Integration</h3>
            <p className="text-sm text-gray-500">Sync your appointments with Google Calendar</p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Connected
          </span>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <p className="mb-6 text-gray-600 max-w-md mx-auto">
            Connect your Google Calendar to automatically sync patient appointments and keep your schedule up to date.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-blue-900">Your Google Calendar is connected.</span> You can sync your appointments to keep them in sync across both platforms.
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Syncing Appointments...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync All Appointments
                </>
              )}
            </button>
            {lastSynced && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Last synced: <span className="font-medium text-gray-700">{lastSynced}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
