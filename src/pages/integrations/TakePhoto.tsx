import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const TakePhoto: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const startCamera = () => {
    setError(null);
    setIsCameraOn(true);
  };

  const stopCamera = () => {
    setIsCameraOn(false);
  };

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) {
      console.error('Webcam no está disponible');
      setError('La cámara no está disponible');
      return;
    }

    setIsCapturing(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        setPhoto(imageSrc);
        setError(null);
        console.log('Foto capturada exitosamente');
      } else {
        console.error('Error al capturar la foto');
        setError('Error al capturar la foto. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error durante la captura:', err);
      setError('Error al capturar la foto. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const downloadPhoto = () => {
    if (!photo) return;

    const link = document.createElement('a');
    link.download = `foto-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
    link.href = photo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearPhoto = () => {
    setPhoto(null);
  };

  const onUserMedia = (stream: MediaStream) => {
    console.log('Cámara conectada exitosamente');
    setError(null);
  };

  const onUserMediaError = (error: string | DOMException) => {
    console.error('Error de cámara:', error);
    setError('No se pudo acceder a la cámara. Verifica los permisos.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">📷 Tomar Foto</h2>
        <p className="text-gray-300">
          Captura fotos usando la cámara de tu dispositivo
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Controles de cámara */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!isCameraOn ? (
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              📹 Activar Cámara
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                📹 Desactivar Cámara
              </button>
              
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isCapturing ? '📸 Capturando...' : '📸 Tomar Foto'}
              </button>
            </>
          )}
        </div>

        {/* Video de la cámara */}
        {isCameraOn && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment', // Usar cámara trasera en móviles
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              onUserMedia={onUserMedia}
              onUserMediaError={onUserMediaError}
              className="w-full h-auto max-h-96 object-cover"
            />
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Foto capturada */}
        {photo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-300">
              Foto Capturada
            </h3>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={photo}
                alt="Foto capturada"
                className="w-full h-auto max-h-96 object-contain mx-auto"
              />
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={downloadPhoto}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                💾 Descargar
              </button>
              <button
                onClick={clearPhoto}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-400 mb-2">Instrucciones:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Haz clic en "Activar Cámara" para comenzar</li>
            <li>• Permite el acceso a la cámara cuando se solicite</li>
            <li>• Posiciona la cámara y haz clic en "Tomar Foto"</li>
            <li>• Puedes descargar la foto o tomar otra</li>
            <li>• Haz clic en "Desactivar Cámara" cuando termines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TakePhoto;
