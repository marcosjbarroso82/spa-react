import React from 'react';

export interface ProcessingStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  description?: string;
  details?: any;
  error?: string;
}

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  className?: string;
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ steps, className = '' }) => {
  const getStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'in_progress':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="text-lg font-medium text-white mb-4">Progreso del Procesamiento</h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className={`text-lg ${getStatusColor(step.status)}`}>
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className={`font-medium ${getStatusColor(step.status)}`}>
                  {step.title}
                </h4>
                {step.status === 'in_progress' && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-gray-300 mt-1">{step.description}</p>
              )}
              {step.error && (
                <p className="text-sm text-red-400 mt-1">{step.error}</p>
              )}
              {step.details && (
                <div className="mt-2 text-xs text-gray-400">
                  <pre className="whitespace-pre-wrap bg-gray-900 p-2 rounded">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingSteps;
