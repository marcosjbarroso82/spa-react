import React, { useState } from 'react';

export interface ApiRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  status?: number;
  response?: any;
  error?: string;
  timestamp: Date;
}

interface ApiRequestDisplayProps {
  requests: ApiRequest[];
  className?: string;
}

const ApiRequestDisplay: React.FC<ApiRequestDisplayProps> = ({ requests, className = '' }) => {
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status?: number) => {
    if (!status) return '⏳';
    if (status >= 200 && status < 300) return '✅';
    if (status >= 400 && status < 500) return '⚠️';
    if (status >= 500) return '❌';
    return '⏳';
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="text-lg font-medium text-white mb-4">Requests de API</h3>
      <div className="space-y-3">
        {requests.map((request) => {
          const isExpanded = expandedRequests.has(request.id);
          return (
            <div key={request.id} className="border border-gray-600 rounded-lg p-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpanded(request.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getStatusIcon(request.status)}
                  </span>
                  <div>
                    <h4 className="font-medium text-white">{request.name}</h4>
                    <p className="text-sm text-gray-400">
                      {request.method} {request.url}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {request.status && (
                    <span className={`font-mono text-sm ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-gray-600 pt-3">
                  {/* Headers */}
                  {request.headers && Object.keys(request.headers).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Headers:</h5>
                      <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(request.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Request Body */}
                  {request.body && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Request Body:</h5>
                      <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto">
                        {typeof request.body === 'string' 
                          ? request.body 
                          : JSON.stringify(request.body, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                  
                  {/* Response */}
                  {request.response && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Response:</h5>
                      <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto">
                        {typeof request.response === 'string' 
                          ? request.response 
                          : JSON.stringify(request.response, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                  
                  {/* Error */}
                  {request.error && (
                    <div>
                      <h5 className="text-sm font-medium text-red-400 mb-2">Error:</h5>
                      <pre className="text-xs text-red-400 bg-red-900 bg-opacity-20 p-2 rounded overflow-x-auto">
                        {request.error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiRequestDisplay;
