import React from 'react';

interface ProcessingControlsProps {
  onProcess: () => void;
  onClear: () => void;
  onCamera?: () => void;
  isProcessing?: boolean;
  hasImage?: boolean;
  processText?: string;
  clearText?: string;
  cameraText?: string;
  showCamera?: boolean;
  className?: string;
  disabled?: boolean;
}

const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  onProcess,
  onClear,
  onCamera,
  isProcessing = false,
  hasImage = false,
  processText = 'Aplicar',
  clearText = 'Limpiar Todo',
  cameraText = 'Usar Cámara',
  showCamera = true,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center ${className}`}>
      {showCamera && onCamera && (
        <button
          onClick={onCamera}
          disabled={disabled}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          📷 {cameraText}
        </button>
      )}
      
      {hasImage && (
        <button
          onClick={onProcess}
          disabled={isProcessing || disabled}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          {isProcessing ? '⏳ Procesando...' : `✅ ${processText}`}
        </button>
      )}
      
      <button
        onClick={onClear}
        disabled={disabled}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
      >
        🗑️ {clearText}
      </button>
    </div>
  );
};

export default ProcessingControls;
