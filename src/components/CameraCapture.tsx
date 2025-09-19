import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCameraConfig } from '../hooks/useCameraConfig';

interface CameraCaptureProps {
  onImageCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCapture, onClose }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  
  const { 
    config: cameraConfig, 
    getVideoConstraints
  } = useCameraConfig();

  // Iniciar la cámara
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    
    try {
      isStartingRef.current = true;
      setError(null);
      setIsLoading(true);
      
      // Obtener configuraciones de video (solo las compatibles con getUserMedia)
      const videoConstraints = getVideoConstraints();
      
      // Crear constraints básicos para getUserMedia
      // Usar 'ideal' para permitir la máxima resolución disponible de la cámara
      const constraints: MediaStreamConstraints = {
        video: {
          ...videoConstraints,
          width: { ...videoConstraints.width, max: 4096 },
          height: { ...videoConstraints.height, max: 4096 },
          frameRate: { ...videoConstraints.frameRate, max: 60 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo antes de reproducir
        const playVideo = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsStreaming(true);
                setIsLoading(false);
              })
              .catch((err) => {
                console.error('Error al reproducir video:', err);
                setError('Error al iniciar la cámara');
                setIsLoading(false);
              });
          }
        };

        // Usar onloadedmetadata o timeout como fallback
        videoRef.current.onloadedmetadata = playVideo;
        
        // Timeout de seguridad en caso de que onloadedmetadata no se dispare
        const timeoutId = setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            playVideo();
          }
        }, 1000);

        // Limpiar timeout si el componente se desmonta
        return () => clearTimeout(timeoutId);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsLoading(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [getVideoConstraints]);

  // Detener la cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
    setIsStabilizing(false);
  }, []);

  // Capturar imagen
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setIsStabilizing(true);
    
    try {
      // Intentar enfocar antes de capturar
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          try {
            // Aplicar constraints de enfoque single-shot
            const focusConstraints = {
              advanced: [
                { focusMode: 'single-shot' },
                { exposureMode: 'single-shot' },
                { whiteBalanceMode: 'single-shot' }
              ]
            };
            await (track as any).applyConstraints(focusConstraints as any);
            
            // Esperar un momento para que el enfoque se estabilice
            const stabilizationTime = cameraConfig.focus.stabilizationTime;
            await new Promise(resolve => setTimeout(resolve, stabilizationTime));
            console.log('Enfoque completado');
          } catch (focusErr) {
            console.warn('No se pudo aplicar enfoque:', focusErr);
          }
        }
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      // Configurar canvas con la resolución de la cámara
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Configurar el canvas con las configuraciones de calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Dibujar el frame actual del video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir a data URL con la calidad configurada
      const dataUrl = canvas.toDataURL('image/jpeg', cameraConfig.quality.screenshotQuality);
      
      // Llamar al callback con la imagen capturada
      onImageCapture(dataUrl);
      
      // Detener la cámara después de capturar
      stopCamera();
      
    } catch (err) {
      console.error('Error al capturar imagen:', err);
      setError('Error al capturar la imagen');
    } finally {
      setIsCapturing(false);
      setIsStabilizing(false);
    }
  }, [isCapturing, cameraConfig.quality.screenshotQuality, cameraConfig.focus.stabilizationTime, onImageCapture, stopCamera]);

  // Inicializar componente
  useEffect(() => {
    setIsMounted(true);
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []); // Intentionally empty - only run on mount/unmount

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">📷 Capturar Imagen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Video preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
            {isMounted && (
              <video
                ref={videoRef}
                className="w-full h-auto max-h-96 object-contain"
                playsInline
                muted
                style={{ minHeight: '300px' }}
              />
            )}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Overlay de carga */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Iniciando cámara...</p>
                        </div>
                      </div>
                    )}
                    
                    {isStabilizing && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-pulse rounded-full h-8 w-8 border-2 border-yellow-400 mx-auto mb-2"></div>
                          <p>Estabilizando... {cameraConfig.focus.stabilizationTime}ms</p>
                        </div>
                      </div>
                    )}
            
            {/* Overlay de información */}
            {isStreaming && videoRef.current && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
                <p>Resolución Real: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</p>
                <p>Configurada: {cameraConfig.resolution.width}x{cameraConfig.resolution.height}</p>
                <p>Calidad: {(cameraConfig.quality.screenshotQuality * 100).toFixed(0)}%</p>
                <p>Enfoque: {cameraConfig.focus.distance}m</p>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex justify-center space-x-4">
            {!isStreaming && !isLoading ? (
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                🎥 Iniciar Cámara
              </button>
            ) : isLoading ? (
              <button
                disabled
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ⏳ Iniciando...
              </button>
            ) : (
              <>
                        <button
                          onClick={captureImage}
                          disabled={isCapturing || isStabilizing}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                          {isStabilizing ? '⏳ Estabilizando...' : isCapturing ? '⏳ Capturando...' : '📸 Capturar'}
                        </button>
                <button
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  🛑 Detener
                </button>
              </>
            )}
          </div>

          {/* Instrucciones */}
          <div className="text-center text-sm text-gray-400">
            <p>💡 <strong>Consejos:</strong></p>
            <p>• Mantén la cámara estable a {cameraConfig.focus.distance}m del objeto</p>
            <p>• Espera {cameraConfig.focus.stabilizationTime}ms para que se estabilice</p>
            <p>• Asegúrate de que el texto esté bien iluminado y enfocado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
