import React from 'react';
import Webcam from 'react-webcam';
import { useCameraConfig } from '../hooks/useCameraConfig';

interface CameraPreviewProps {
  isActive: boolean;
  onCapture: () => void;
  onClose?: () => void;
  isCapturing?: boolean;
  isFocusing?: boolean;
  error?: string;
  showControls?: boolean;
  className?: string;
  webcamRef?: React.RefObject<Webcam>;
  onUserMedia?: (stream: MediaStream) => void;
  onUserMediaError?: (error: string | DOMException) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  isActive,
  onCapture,
  onClose,
  isCapturing = false,
  isFocusing = false,
  error,
  showControls = true,
  className = '',
  webcamRef,
  onUserMedia,
  onUserMediaError
}) => {
  const { getVideoConstraints } = useCameraConfig();

  if (!isActive) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-600 text-white rounded-lg">
          {error}
        </div>
      )}

      {/* Video preview */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.85}
          videoConstraints={getVideoConstraints()}
          onUserMedia={onUserMedia}
          onUserMediaError={onUserMediaError}
          className="w-full h-auto max-h-96 object-cover"
        />
        
        {/* Indicador de estado */}
        <div className="absolute top-4 right-4">
          <div className={`w-3 h-3 rounded-full ${
            isFocusing ? 'bg-yellow-500 animate-pulse' : 
            isCapturing ? 'bg-blue-500 animate-pulse' : 
            'bg-green-500'
          }`}></div>
        </div>
      </div>

      {/* Controles */}
      {showControls && (
        <div className="flex justify-center">
          <button
            onClick={onCapture}
            disabled={isCapturing}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 text-lg"
          >
            {isCapturing ? (
              isFocusing ? '🎯 Enfocando...' : '📸 Capturando...'
            ) : (
              '📸 Tomar Foto'
            )}
          </button>
        </div>
      )}

      {/* Botón de cerrar */}
      {onClose && (
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          >
            Cerrar Cámara
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
