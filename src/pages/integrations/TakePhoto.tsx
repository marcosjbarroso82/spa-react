import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useCameraConfig } from '../../hooks/useCameraConfig';
import CameraConfigSection from '../../components/config/CameraConfigSection';

const TakePhoto: React.FC = () => {
  const { 
    getVideoConstraints, 
    getContinuousFocusConstraints, 
    getSingleShotFocusConstraints,
    config 
  } = useCameraConfig();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actualVideoConstraints, setActualVideoConstraints] = useState<any>(null);
  const [actualFocusConstraints, setActualFocusConstraints] = useState<any>(null);
  const [captureValues, setCaptureValues] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);

  // Referencias al MediaStream y a ImageCapture para fotos a resolución nativa
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null);

  const startCamera = () => {
    setError(null);
    setIsCameraOn(true);
  };

  const stopCamera = () => {
    setIsCameraOn(false);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    streamRef.current = null;
    imageCaptureRef.current = null;
  };

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) {
      console.error('Webcam no está disponible');
      setError('La cámara no está disponible');
      return;
    }

    setIsCapturing(true);
    
    // Capturar valores de configuración actuales
    const currentConfig = {
      resolution: config.resolution,
      quality: config.quality,
      focus: config.focus,
      processing: config.processing,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Aplicar enfoque antes de capturar si está configurado
      if (streamRef.current && config.focus.autoFocusBeforeCapture) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          try {
            console.log(`Aplicando enfoque ${config.focus.focusMode} antes de capturar...`);
            
            // Aplicar constraints de enfoque basados en la configuración
            const focusConstraints = getSingleShotFocusConstraints();
            await (track as any).applyConstraints(focusConstraints as any);
            
            // Esperar el tiempo de estabilización configurado
            await new Promise(resolve => setTimeout(resolve, config.focus.stabilizationTime));
            console.log('Enfoque completado');
          } catch (focusErr) {
            console.warn('No se pudo aplicar enfoque:', focusErr);
          }
        }
      } else if (!config.focus.autoFocusBeforeCapture) {
        console.log('Auto-enfoque desactivado - capturando sin reajustar enfoque');
      }

      // Intentar ImageCapture para obtener foto a resolución nativa
      const track = streamRef.current?.getVideoTracks?.()[0];
      if (track && 'ImageCapture' in window) {
        if (!imageCaptureRef.current) {
          // @ts-ignore ImageCapture no está tipado en TS DOM en algunos entornos
          imageCaptureRef.current = new (window as any).ImageCapture(track);
        }
        try {
          const blob: Blob = await imageCaptureRef.current.takePhoto();
          const dataUrl = await blobToDataUrl(blob);
          setPhoto(dataUrl);
          setCaptureValues(currentConfig);
          setError(null);
          console.log('Foto capturada a resolución nativa con ImageCapture');
          return;
        } catch (icErr) {
          console.warn('Fallo ImageCapture, usando getScreenshot', icErr);
        }
      }

      // Alternativa: captura desde el canvas de react-webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        setPhoto(imageSrc);
        setCaptureValues(currentConfig);
        setError(null);
        console.log('Foto capturada con getScreenshot');
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
  }, [getSingleShotFocusConstraints, config.focus, config.resolution, config.quality, config.processing]);

  // Función para captura automática: activa cámara, enfoca y captura
  const autoCapturePhoto = useCallback(async () => {
    setIsAutoCapturing(true);
    setError(null);
    
    try {
      // Si la cámara no está activa, activarla primero
      if (!isCameraOn) {
        console.log('Activando cámara para captura automática...');
        setIsCameraOn(true);
        
        // Esperar a que la cámara se inicialice
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Esperar un poco más para que el stream esté completamente listo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ahora capturar la foto
      await capturePhoto();
      
    } catch (err) {
      console.error('Error durante la captura automática:', err);
      setError('Error durante la captura automática. Intenta de nuevo.');
    } finally {
      setIsAutoCapturing(false);
    }
  }, [isCameraOn, capturePhoto]);

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

  const onUserMedia = async (stream: MediaStream) => {
    console.log('Cámara conectada exitosamente');
    setError(null);
    streamRef.current = stream;

    // Capturar los constraints de video que se están usando
    const videoConstraints = getVideoConstraints();
    setActualVideoConstraints(videoConstraints);

    try {
      const track = stream.getVideoTracks()[0];
      
      // Obtener los constraints actuales del track
      const currentSettings = track.getSettings();
      console.log('Configuración actual del track:', currentSettings);
      
      // Aplicar constraints de enfoque basados en la configuración
      let focusConstraints;
      if (config.focus.useContinuousFocus && config.focus.focusMode === 'continuous') {
        console.log('Aplicando enfoque continuo...');
        focusConstraints = getContinuousFocusConstraints();
        await (track as any).applyConstraints(focusConstraints as any).catch(() => {});
      } else {
        console.log('Enfoque continuo desactivado - usando configuración single-shot');
        // Aplicar configuración single-shot para el preview
        focusConstraints = getSingleShotFocusConstraints();
        await (track as any).applyConstraints(focusConstraints as any).catch(() => {});
      }

      // Capturar los constraints de enfoque aplicados
      setActualFocusConstraints(focusConstraints);

      if ('ImageCapture' in window) {
        try {
          // @ts-ignore
          imageCaptureRef.current = new (window as any).ImageCapture(track);
        } catch {}
      }
    } catch (e) {
      console.warn('No se pudieron aplicar constraints avanzados:', e);
    }
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

      {configMessage && (
        <div className={`mb-6 p-4 rounded-lg text-center ${
          configMessage.type === 'success' 
            ? 'bg-green-900/30 border border-green-500 text-green-400' 
            : 'bg-red-900/30 border border-red-500 text-red-400'
        }`}>
          {configMessage.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Controles de cámara */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!isCameraOn ? (
            <>
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                📹 Activar Cámara
              </button>
              
              <button
                onClick={autoCapturePhoto}
                disabled={isAutoCapturing}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isAutoCapturing ? '🤖 Capturando...' : '🤖 Foto Automática'}
              </button>
            </>
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
              screenshotQuality={0.85}  // Calidad alta para preservar detalles de texto pequeño
              videoConstraints={getVideoConstraints()}
              onUserMedia={onUserMedia}
              onUserMediaError={onUserMediaError}
              className="w-full h-auto max-h-96 object-cover"
            />
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* Display de valores en tiempo real */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-xs">
              <div className="font-bold text-green-400 mb-2">📹 Preview Activo</div>
              <div className="space-y-1">
                <div><span className="text-blue-300">Resolución:</span> {actualVideoConstraints?.width?.ideal || 'N/A'}×{actualVideoConstraints?.height?.ideal || 'N/A'}</div>
                <div><span className="text-blue-300">Frame Rate:</span> {actualVideoConstraints?.frameRate?.ideal || 'N/A'} fps</div>
                <div><span className="text-yellow-300">Modo Enfoque:</span> {config.focus.focusMode}</div>
                <div><span className="text-yellow-300">Distancia:</span> {config.focus.distance}m ({(config.focus.distance * 100).toFixed(0)}cm)</div>
                <div><span className="text-yellow-300">Auto-enfoque:</span> {config.focus.autoFocusBeforeCapture ? '✅' : '❌'}</div>
                <div><span className="text-yellow-300">Constraints:</span> {actualFocusConstraints ? '✅ Aplicados' : '❌ No aplicados'}</div>
                <div><span className="text-purple-300">Calidad:</span> {(config.quality.screenshotQuality * 100).toFixed(0)}%</div>
                <div><span className="text-purple-300">Contraste:</span> {config.processing.filters.contrast.toFixed(1)}x</div>
              </div>
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
            
            {/* Valores utilizados en la captura */}
            {captureValues && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-md font-semibold text-blue-400 mb-3">📊 Valores Utilizados en la Captura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  
                  {/* Resolución y Calidad */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-green-300">📐 Resolución & Calidad</h5>
                    <div className="bg-gray-700 rounded p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Resolución:</span>
                        <span className="text-white font-mono">{captureValues.resolution.width}×{captureValues.resolution.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Frame Rate:</span>
                        <span className="text-white font-mono">{captureValues.resolution.frameRate} fps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Calidad Screenshot:</span>
                        <span className="text-white font-mono">{(captureValues.quality.screenshotQuality * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Calidad Optimización:</span>
                        <span className="text-white font-mono">{(captureValues.quality.optimizationQuality * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Enfoque */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-yellow-300">🎯 Enfoque</h5>
                    <div className="bg-gray-700 rounded p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Modo:</span>
                        <span className="text-white font-mono">{captureValues.focus.focusMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Distancia:</span>
                        <span className="text-white font-mono">{captureValues.focus.distance}m ({(captureValues.focus.distance * 100).toFixed(0)}cm)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Auto-enfoque:</span>
                        <span className="text-white font-mono">{captureValues.focus.autoFocusBeforeCapture ? '✅ Activado' : '❌ Desactivado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Estabilización:</span>
                        <span className="text-white font-mono">{captureValues.focus.stabilizationTime}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Procesamiento */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-purple-300">🔧 Procesamiento</h5>
                    <div className="bg-gray-700 rounded p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Contraste:</span>
                        <span className="text-white font-mono">{captureValues.processing.filters.contrast.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Brillo:</span>
                        <span className="text-white font-mono">{captureValues.processing.filters.brightness.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Saturación:</span>
                        <span className="text-white font-mono">{captureValues.processing.filters.saturation.toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-cyan-300">⏰ Información</h5>
                    <div className="bg-gray-700 rounded p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Capturada:</span>
                        <span className="text-white font-mono text-xs">{new Date(captureValues.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Método:</span>
                        <span className="text-white font-mono text-xs">ImageCapture/Webcam</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
            
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
            <li>• <strong>Foto Automática:</strong> Activa la cámara, enfoca automáticamente y captura la foto</li>
            <li>• <strong>Activar Cámara:</strong> Solo activa la cámara para posicionar manualmente</li>
            <li>• <strong>Modo de Enfoque:</strong> Configurado en {config.focus.focusMode === 'single-shot' ? 'Single-shot' : config.focus.focusMode === 'continuous' ? 'Continuous' : 'Manual'}</li>
            <li>• <strong>Enfoque Continuo:</strong> {config.focus.useContinuousFocus ? 'Activado' : 'Desactivado'} durante el preview</li>
            <li>• <strong>Auto-enfoque:</strong> {config.focus.autoFocusBeforeCapture ? 'Se aplicará antes de capturar' : 'Desactivado - captura directa'}</li>
            <li>• Permite el acceso a la cámara cuando se solicite</li>
            <li>• Posiciona la cámara y haz clic en "Tomar Foto" (si la cámara ya está activa)</li>
            <li>• Puedes descargar la foto o tomar otra</li>
            <li>• Haz clic en "Desactivar Cámara" cuando termines</li>
          </ul>
        </div>

        {/* Configuración de Cámara */}
        <div className="mt-8">
          <CameraConfigSection 
            message={configMessage} 
            setMessage={setConfigMessage} 
          />
        </div>
      </div>
    </div>
  );
};

export default TakePhoto;
