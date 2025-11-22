import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';

const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Google');
          return;
        }

        // Exchange the code for tokens
        const response = await axios.get(`http://localhost:5000/api/google-calendar/callback?code=${code}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setStatus('success');
        setMessage(response.data.message || 'Google Calendar connected successfully!');
        
        // Redirect to settings page after 3 seconds
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      } catch (error) {
        console.error('Error handling Google Calendar callback:', error);
        setStatus('error');
        setMessage('Failed to connect Google Calendar. Please try again.');
        
        // Redirect to settings page after 3 seconds
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      }
    };

    handleCallback();
  }, [location.search, token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting to Google Calendar</h2>
            <p className="text-gray-600">Please wait while we complete the connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Successful</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-gray-500 mt-4">Redirecting to settings page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-gray-500 mt-4">Redirecting to settings page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;