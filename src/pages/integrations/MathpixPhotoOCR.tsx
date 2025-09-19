import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useCredentials } from '../../hooks/useCredentials';

interface MathpixResponse {
  text: string;
  latex_styled?: string;
  confidence: number;
  confidence_rate: number;
  is_handwritten: boolean;
  is_printed: boolean;
  auto_rotate_degrees: number;
  auto_rotate_confidence: number;
  image_width: number;
  image_height: number;
  version: string;
  request_id: string;
  data?: Array<{
    type: string;
    value: string;
  }>;
}

const MathpixPhotoOCR: React.FC = () => {
  const { getCredentialByKey, isLoading } = useCredentials();
  
  // Estados para la cámara
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null);

  // Estados para Mathpix OCR
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MathpixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para debugging y información
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [imageInfo, setImageInfo] = useState<{
    size: string;
    dimensions: string;
    format: string;
  } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Obtener credenciales de Mathpix
  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');

  // Función para agregar logs de debug
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    console.log(`[MathpixPhotoOCR] ${message}`);
  };

  // Función para redimensionar imagen
  const resizeImage = (dataUrl: string, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
  };

  // Función para obtener información de la imagen
  const getImageInfo = (dataUrl: string) => {
    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const imageType = mimeType.split('/')[1];
    
    // Calcular tamaño aproximado
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    // Obtener dimensiones
    return new Promise<{size: string, dimensions: string, format: string}>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          size: `${sizeInMB.toFixed(2)} MB`,
          dimensions: `${img.width} × ${img.height}`,
          format: imageType.toUpperCase()
        });
      };
      img.src = dataUrl;
    });
  };

  // Función para enfocar la cámara
  const focusCamera = useCallback(async (): Promise<boolean> => {
    if (!streamRef.current) return false;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return false;

      // Aplicar constraints de enfoque
      await track.applyConstraints({
        advanced: [
          { focusMode: 'single-shot' },
          { focusDistance: 0.1 }
        ]
      } as any);

      addDebugLog('Enfoque aplicado');
      return true;
    } catch (error) {
      addDebugLog(`Error al enfocar: ${error}`);
      return false;
    }
  }, []);

  // Funciones de la cámara
  const startCamera = () => {
    setError(null);
    setIsCameraOn(true);
    addDebugLog('Iniciando cámara...');
  };

  const stopCamera = () => {
    setIsCameraOn(false);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    streamRef.current = null;
    imageCaptureRef.current = null;
    addDebugLog('Cámara detenida');
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
      addDebugLog('Error: Webcam no disponible');
      setError('La cámara no está disponible');
      return;
    }

    setIsCapturing(true);
    setIsFocusing(true);
    addDebugLog('Iniciando captura de foto...');
    
    try {
      // Intentar enfocar antes de capturar
      const focused = await focusCamera();
      if (focused) {
        // Esperar un momento para que el enfoque se estabilice
        await new Promise(resolve => setTimeout(resolve, 1000));
        addDebugLog('Enfoque completado');
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
          
          // Obtener información de la imagen
          const info = await getImageInfo(dataUrl);
          setImageInfo(info);
          addDebugLog(`Imagen capturada: ${info.dimensions}, ${info.size}`);
          
          setPhoto(dataUrl);
          setError(null);
          return;
        } catch (icErr) {
          addDebugLog(`ImageCapture falló: ${icErr}`);
        }
      }

      // Alternativa: captura desde el canvas de react-webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        // Obtener información de la imagen
        const info = await getImageInfo(imageSrc);
        setImageInfo(info);
        addDebugLog(`Imagen capturada (fallback): ${info.dimensions}, ${info.size}`);
        
        setPhoto(imageSrc);
        setError(null);
      } else {
        throw new Error('No se pudo capturar la imagen');
      }
    } catch (err) {
      addDebugLog(`Error durante captura: ${err}`);
      setError(err instanceof Error ? err.message : 'Error al capturar la foto. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
      setIsFocusing(false);
    }
  }, [focusCamera]);

  const clearPhoto = () => {
    setPhoto(null);
    setResult(null);
    setError(null);
    setImageInfo(null);
    addDebugLog('Foto eliminada');
  };

  const onUserMedia = async (stream: MediaStream) => {
    addDebugLog('Cámara conectada exitosamente');
    setError(null);
    streamRef.current = stream;

    try {
      const track = stream.getVideoTracks()[0];
      // Solicitar autoenfoque y ajustes continuos cuando sea posible
      await track.applyConstraints({
        advanced: [
          { focusMode: 'continuous' },
          { whiteBalanceMode: 'continuous' },
          { exposureMode: 'continuous' }
        ]
      } as any).catch(() => {});

      if ('ImageCapture' in window) {
        try {
          // @ts-ignore
          imageCaptureRef.current = new (window as any).ImageCapture(track);
          addDebugLog('ImageCapture inicializado');
        } catch {}
      }
    } catch (e) {
      addDebugLog(`No se pudieron aplicar constraints avanzados: ${e}`);
    }
  };

  const onUserMediaError = (error: string | DOMException) => {
    addDebugLog(`Error de cámara: ${error}`);
    setError('No se pudo acceder a la cámara. Verifica los permisos.');
  };

  // Función para procesar la foto con Mathpix
  const processPhoto = async () => {
    if (!photo) {
      setError('No hay foto para procesar');
      return;
    }

    // Verificar que las credenciales estén disponibles
    if (!appId || !apiKey) {
      setError('Las credenciales de Mathpix no están configuradas');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    addDebugLog('Iniciando procesamiento con Mathpix...');

    try {
      // Validar formato de data URL
      if (!photo.startsWith('data:image/')) {
        throw new Error('Formato de imagen inválido');
      }

      // Convertir data URL a base64
      const base64Data = photo.split(',')[1];
      if (!base64Data) {
        throw new Error('No se pudo extraer los datos de la imagen');
      }

      // Validar tamaño de la imagen (Mathpix tiene límite de 5MB)
      const imageSizeInBytes = (base64Data.length * 3) / 4;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      addDebugLog(`Tamaño de imagen: ${imageSizeInMB.toFixed(2)}MB`);

      let processedPhoto = photo;

      // Si la imagen es muy grande, redimensionarla
      if (imageSizeInMB > 5) {
        addDebugLog('Imagen muy grande, redimensionando...');
        processedPhoto = await resizeImage(photo, 1920, 1080, 0.8);
        
        // Recalcular tamaño después de redimensionar
        const newBase64Data = processedPhoto.split(',')[1];
        const newSizeInBytes = (newBase64Data.length * 3) / 4;
        const newSizeInMB = newSizeInBytes / (1024 * 1024);
        addDebugLog(`Nuevo tamaño: ${newSizeInMB.toFixed(2)}MB`);
      }

      // Usar la imagen procesada
      const finalBase64Data = processedPhoto.split(',')[1];
      const finalMimeType = processedPhoto.split(',')[0].split(':')[1].split(';')[0];
      const finalImageType = finalMimeType.split('/')[1];

      addDebugLog(`Enviando a Mathpix: ${finalImageType}, ${(finalBase64Data.length * 3 / 4 / (1024 * 1024)).toFixed(2)}MB`);

      // Hacer request a Mathpix API
      const response = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': appId,
          'app_key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: `data:image/${finalImageType};base64,${finalBase64Data}`,
          formats: ['text', 'latex_styled', 'data'],
          data_options: {
            include_asciimath: true,
            include_latex: true,
          },
        }),
      });

      addDebugLog(`Respuesta de Mathpix: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          addDebugLog(`Error detallado: ${JSON.stringify(errorData)}`);
        } catch (parseError) {
          addDebugLog(`No se pudo parsear el error: ${parseError}`);
        }
        throw new Error(errorMessage);
      }

      const data: MathpixResponse = await response.json();
      addDebugLog(`Procesamiento exitoso. Confianza: ${Math.round(data.confidence_rate * 100)}%`);
      setResult(data);
    } catch (err) {
      addDebugLog(`Error: ${err}`);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar la foto';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verificar si las credenciales están configuradas
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!appId || !apiKey) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔑</div>
        <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
          Credenciales de Mathpix Requeridas
        </h2>
        <p className="text-gray-300 mb-4">
          Para usar Mathpix Photo OCR, necesitas configurar las siguientes credenciales:
        </p>
        <div className="bg-gray-700 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>mathpix_app_id</strong>: Tu App ID de Mathpix</li>
            <li>• <strong>mathpix_api_key</strong>: Tu API Key de Mathpix</li>
          </ul>
        </div>
        <p className="text-gray-400 text-sm">
          Ve a la página de <strong>Configuración</strong> para agregar estas credenciales.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📷📐</div>
        <h2 className="text-2xl font-bold text-blue-400 mb-2">Mathpix Photo OCR</h2>
        <p className="text-gray-300">
          Captura fotos con contenido matemático y conviértelas a texto y LaTeX
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-xl mr-2">❌</span>
            <span className="font-medium">Error:</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Controles de cámara */}
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">📹 Cámara</h3>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
            >
              {showDebugInfo ? 'Ocultar Debug' : 'Mostrar Debug'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center mb-4">
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
                  {isCapturing ? (
                    isFocusing ? '🎯 Enfocando...' : '📸 Capturando...'
                  ) : (
                    '📸 Tomar Foto'
                  )}
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
                screenshotQuality={1}
                videoConstraints={{
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 3840 },
                  height: { ideal: 2160 },
                  frameRate: { ideal: 30 }
                }}
                onUserMedia={onUserMedia}
                onUserMediaError={onUserMediaError}
                className="w-full h-auto max-h-96 object-cover"
              />
              <div className="absolute top-4 right-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  isFocusing ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
              </div>
              {isFocusing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-lg font-semibold">🎯 Enfocando...</div>
                </div>
              )}
            </div>
          )}

          {/* Información de debug */}
          {showDebugInfo && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Debug Info:</h4>
              <div className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Foto capturada */}
        {photo && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">📸 Foto Capturada</h3>
            
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt="Foto capturada"
                  className="w-full h-auto max-h-96 object-contain mx-auto"
                />
              </div>

              {/* Información de la imagen */}
              {imageInfo && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Información de la imagen:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Tamaño:</span>
                      <div className="text-white font-medium">{imageInfo.size}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Dimensiones:</span>
                      <div className="text-white font-medium">{imageInfo.dimensions}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Formato:</span>
                      <div className="text-white font-medium">{imageInfo.format}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={processPhoto}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  {isProcessing ? '🔄 Procesando...' : '🚀 Procesar con Mathpix'}
                </button>
                <button
                  onClick={clearPhoto}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar resultados */}
        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">📋 Resultados</h3>
            
            {/* Información de la imagen */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Información de la imagen</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Confianza:</span>
                  <div className="text-white font-medium">
                    {Math.round(result.confidence_rate * 100)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Tipo:</span>
                  <div className="text-white font-medium">
                    {result.is_handwritten ? 'Manuscrito' : 'Impreso'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Dimensiones:</span>
                  <div className="text-white font-medium">
                    {result.image_width} × {result.image_height}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Versión:</span>
                  <div className="text-white font-medium text-xs">
                    {result.version}
                  </div>
                </div>
              </div>
            </div>

            {/* Texto reconocido */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Texto reconocido (Mathpix Markdown)</h4>
              <div className="bg-gray-800 rounded p-3 font-mono text-sm text-white whitespace-pre-wrap">
                {result.text}
              </div>
            </div>

            {/* LaTeX formateado */}
            {result.latex_styled && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">LaTeX formateado</h4>
                <div className="bg-gray-800 rounded p-3 font-mono text-sm text-white whitespace-pre-wrap">
                  {result.latex_styled}
                </div>
              </div>
            )}

            {/* Datos adicionales */}
            {result.data && result.data.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Datos adicionales</h4>
                <div className="space-y-2">
                  {result.data.map((item, index) => (
                    <div key={index} className="bg-gray-800 rounded p-2">
                      <div className="text-xs text-gray-400 mb-1">Tipo: {item.type}</div>
                      <div className="font-mono text-sm text-white whitespace-pre-wrap">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-400 mb-2">Instrucciones:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Haz clic en "Activar Cámara" para comenzar</li>
            <li>• Permite el acceso a la cámara cuando se solicite</li>
            <li>• Posiciona la cámara sobre contenido matemático</li>
            <li>• Haz clic en "Tomar Foto" - la cámara enfocará automáticamente</li>
            <li>• Haz clic en "Procesar con Mathpix" para analizar</li>
            <li>• Los resultados incluyen texto y LaTeX formateado</li>
            <li>• Usa "Mostrar Debug" para ver información técnica</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MathpixPhotoOCR;