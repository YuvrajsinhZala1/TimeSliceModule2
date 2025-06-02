import React, { useState, useEffect } from 'react';
import { testConnection } from '../../services/api';
import { logInfo } from '../../utils/logger';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      setConnectionStatus('testing');
      const result = await testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        setDetails(result.data);
        logInfo('Backend connection successful');
      } else {
        setConnectionStatus('failed');
        setDetails(result);
        console.error('Backend connection failed:', result);
      }
    } catch (error) {
      setConnectionStatus('failed');
      setDetails({ error: error.message });
      console.error('Connection test error:', error);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'failed': return '❌';
      case 'testing': return '⏳';
      default: return '❓';
    }
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className={`font-semibold ${getStatusColor()}`}>
          Backend: {connectionStatus.toUpperCase()}
        </span>
      </div>
      
      {details && (
        <div className="text-xs text-gray-600">
          {connectionStatus === 'connected' ? (
            <div>
              <div>✅ Server: {details.message}</div>
              <div>⏱️ Uptime: {Math.floor(details.uptime)}s</div>
              <div>🔗 Environment: {details.env}</div>
            </div>
          ) : (
            <div>
              <div>❌ Error: {details.error}</div>
              <div>🌐 URL: {details.details?.baseURL}</div>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={testBackendConnection}
        className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Test Again
      </button>
    </div>
  );
};

export default ConnectionTest;