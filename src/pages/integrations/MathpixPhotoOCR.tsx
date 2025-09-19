import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useCredentials } from '../../hooks/useCredentials';
import { usePreferences } from '../../hooks/usePreferences';

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
  error?: string;
  error_info?: {
    id: string;
    message: string;
  };
  line_data?: any[];
}

const MathpixPhotoOCR: React.FC = () => {
  const { getCredentialByKey, isLoading } = useCredentials();
  const { preferences } = usePreferences();
  
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
  const [imageInfo, setImageInfo] = useState<{
    size: string;
    dimensions: string;
    format: string;
  } | null>(null);
  const [optimizedImageInfo, setOptimizedImageInfo] = useState<{
    size: string;
    dimensions: string;
    format: string;
  } | null>(null);
  const [optimizedPhoto, setOptimizedPhoto] = useState<string | null>(null);
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


  /**
   * Función para optimizar imagen específicamente para OCR
   * 
   * Aplica múltiples optimizaciones:
   * - Redimensionamiento inteligente
   * - Conversión a escala de grises (reduce tamaño)
   * - Mejora de contraste para texto
   * - Compresión optimizada para OCR
   */
  const optimizeImageForOCR = (dataUrl: string, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

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

        // Configuraciones para mejorar OCR
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Aplicar filtros para mejorar el contraste del texto
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a escala de grises para reducir tamaño
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
          // data[i + 3] mantiene el alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Exportar como JPEG con calidad optimizada
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  /**
   * Función para redimensionar imagen manteniendo calidad para OCR
   * 
   * Esta función se usa solo cuando la imagen es mayor a 5MB después de las mejoras.
   * La calidad 0.8 es un balance entre:
   * - Tamaño de archivo (debe ser < 5MB para Mathpix)
   * - Preservación de detalles para OCR matemático
   * 
   * 0.8 es suficiente para texto y símbolos matemáticos sin degradar significativamente
   * la capacidad de detección de Mathpix.
   */
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

  /**
   * Función para mejorar imagen de celular para OCR matemático
   * 
   * Las fotos de celular para OCR matemático suelen tener problemas comunes:
   * - Iluminación desigual (sombras, reflejos)
   * - Ruido digital (granulado)
   * - Enfoque ligeramente borroso
   * - Contraste insuficiente entre texto y fondo
   * 
   * Esta función aplica mejoras específicas para optimizar la detección de:
   * - Símbolos matemáticos (+, -, ×, ÷, √, etc.)
   * - Fórmulas complejas
   * - Texto manuscrito
   * - Números y variables
   */
  const enhanceImageForOCR = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Configurar canvas para máxima calidad de renderizado
        // Esto es crucial para preservar detalles finos de fórmulas matemáticas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen original
        ctx.drawImage(img, 0, 0);

        // Obtener datos de píxeles para procesamiento manual
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // MEJORA 1: Ajuste de contraste y brillo
        // Las fotos de celular suelen tener contraste insuficiente
        // Esto es crítico para distinguir texto negro sobre papel blanco
        const contrast = 1.2;  // Aumenta contraste sin saturar
        const brightness = 10; // Compensa iluminación desigual
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Aplicar contraste: centra en 0.5 y escala
          // Esto hace que los negros sean más negros y blancos más blancos
          let newR = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          let newG = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          let newB = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          // Aplicar brillo para compensar sombras
          // Importante para fotos con iluminación irregular
          newR = Math.min(255, Math.max(0, newR + brightness));
          newG = Math.min(255, Math.max(0, newG + brightness));
          newB = Math.min(255, Math.max(0, newB + brightness));

          // MEJORA 2: Reducción de ruido digital
          // Las cámaras de celular generan ruido que confunde al OCR
          // Aplicamos un filtro suave que preserva bordes (texto)
          const noiseReduction = 0.1; // Suave para no borrar detalles
          data[i] = r * (1 - noiseReduction) + newR * noiseReduction;
          data[i + 1] = g * (1 - noiseReduction) + newG * noiseReduction;
          data[i + 2] = b * (1 - noiseReduction) + newB * noiseReduction;
        }

        // Aplicar los cambios de contraste y ruido
        ctx.putImageData(imageData, 0, 0);

        // MEJORA 3: Filtro de nitidez (sharpen)
        // Mejora la definición de bordes de texto y símbolos matemáticos
        // Especialmente útil para fotos ligeramente borrosas
        const sharpenCanvas = document.createElement('canvas');
        const sharpenCtx = sharpenCanvas.getContext('2d');
        
        if (sharpenCtx) {
          sharpenCanvas.width = canvas.width;
          sharpenCanvas.height = canvas.height;
          
          // Kernel de nitidez optimizado para texto
          // Realza bordes sin crear artefactos
          const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
          ];
          
          const sharpenData = sharpenCtx.createImageData(canvas.width, canvas.height);
          const sharpenPixels = sharpenData.data;
          const originalPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          // Aplicar convolución del kernel de nitidez
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              for (let c = 0; c < 3; c++) { // Procesar canales RGB
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    const pixelIndex = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                    const kernelIndex = (ky + 1) * 3 + (kx + 1);
                    sum += originalPixels[pixelIndex] * kernel[kernelIndex];
                  }
                }
                const pixelIndex = (y * canvas.width + x) * 4 + c;
                // Limitar valores para evitar saturación
                sharpenPixels[pixelIndex] = Math.min(255, Math.max(0, sum));
              }
              // Preservar canal alpha
              const alphaIndex = (y * canvas.width + x) * 4 + 3;
              sharpenPixels[alphaIndex] = originalPixels[alphaIndex];
            }
          }
          
          sharpenCtx.putImageData(sharpenData, 0, 0);
          
          // Usar calidad 0.9 para balance entre tamaño y precisión OCR
          // 0.9 es óptimo para texto y símbolos matemáticos
          resolve(sharpenCanvas.toDataURL('image/jpeg', 0.9));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
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
          
          // Obtener información de la imagen original
          const originalInfo = await getImageInfo(dataUrl);
          setImageInfo(originalInfo);
          addDebugLog(`Imagen original: ${originalInfo.dimensions}, ${originalInfo.size}`);
          
          // Optimizar imagen para OCR
          addDebugLog('Optimizando imagen para OCR...');
          const optimizedImage = await optimizeImageForOCR(dataUrl);
          
          // Obtener información de la imagen optimizada
          const optimizedInfo = await getImageInfo(optimizedImage);
          setOptimizedImageInfo(optimizedInfo);
          addDebugLog(`Imagen optimizada: ${optimizedInfo.dimensions}, ${optimizedInfo.size}`);
          
          // Mostrar ambas imágenes
          setPhoto(dataUrl);
          setOptimizedPhoto(optimizedImage);
          setError(null);
          return;
        } catch (icErr) {
          addDebugLog(`ImageCapture falló: ${icErr}`);
        }
      }

      // Alternativa: captura desde el canvas de react-webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        // Obtener información de la imagen original
        const originalInfo = await getImageInfo(imageSrc);
        setImageInfo(originalInfo);
        addDebugLog(`Imagen original: ${originalInfo.dimensions}, ${originalInfo.size}`);
        
        // Optimizar imagen para OCR
        addDebugLog('Optimizando imagen para OCR...');
        const optimizedImage = await optimizeImageForOCR(imageSrc);
        
        // Obtener información de la imagen optimizada
        const optimizedInfo = await getImageInfo(optimizedImage);
        setOptimizedImageInfo(optimizedInfo);
        addDebugLog(`Imagen optimizada: ${optimizedInfo.dimensions}, ${optimizedInfo.size}`);
        
        // Mostrar ambas imágenes
        setPhoto(imageSrc);
        setOptimizedPhoto(optimizedImage);
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
    // Usar la imagen optimizada si está disponible, sino la original
    const imageToProcess = optimizedPhoto || photo;
    
    if (!imageToProcess) {
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
      if (!imageToProcess.startsWith('data:image/')) {
        throw new Error('Formato de imagen inválido');
      }

      // Convertir data URL a base64
      const base64Data = imageToProcess.split(',')[1];
      if (!base64Data) {
        throw new Error('No se pudo extraer los datos de la imagen');
      }

      // Validar tamaño de la imagen (Mathpix tiene límite de 5MB)
      const imageSizeInBytes = (base64Data.length * 3) / 4;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      addDebugLog(`Tamaño de imagen a procesar: ${imageSizeInMB.toFixed(2)}MB`);

      let processedPhoto = imageToProcess;

      // PASO 1: Mejorar imagen para OCR matemático (especialmente fotos de celular)
      // Esto es crucial para obtener mejores resultados de Mathpix
      addDebugLog('Aplicando mejoras de imagen para OCR matemático...');
      processedPhoto = await enhanceImageForOCR(imageToProcess);

      // Verificar tamaño después de las mejoras
      const enhancedBase64Data = processedPhoto.split(',')[1];
      const enhancedSizeInBytes = (enhancedBase64Data.length * 3) / 4;
      const enhancedSizeInMB = enhancedSizeInBytes / (1024 * 1024);
      
      addDebugLog(`Tamaño después de mejoras: ${enhancedSizeInMB.toFixed(2)}MB`);

      // PASO 2: Si la imagen es muy grande después de las mejoras, redimensionarla
      // Las mejoras pueden aumentar ligeramente el tamaño, pero es necesario para OCR
      if (enhancedSizeInMB > 5) {
        addDebugLog('Imagen muy grande después de mejoras, redimensionando...');
        processedPhoto = await resizeImage(processedPhoto, 1920, 1080, 0.8);
        
        // Recalcular tamaño después de redimensionar
        const newBase64Data = processedPhoto.split(',')[1];
        const newSizeInBytes = (newBase64Data.length * 3) / 4;
        const newSizeInMB = newSizeInBytes / (1024 * 1024);
        addDebugLog(`Tamaño final: ${newSizeInMB.toFixed(2)}MB`);
      }

      // PASO 3: Preparar imagen final para envío a Mathpix
      // La imagen ahora está optimizada para OCR matemático y cumple el límite de tamaño
      const finalBase64Data = processedPhoto.split(',')[1];
      const finalMimeType = processedPhoto.split(',')[0].split(':')[1].split(';')[0];
      const finalImageType = finalMimeType.split('/')[1];

      addDebugLog(`Enviando a Mathpix: ${finalImageType}, ${(finalBase64Data.length * 3 / 4 / (1024 * 1024)).toFixed(2)}MB`);
      addDebugLog('Imagen optimizada con mejoras para OCR matemático');

      // Preparar el request body
      const requestBody = {
        src: `data:image/${finalImageType};base64,${finalBase64Data}`,
        formats: ['text', 'latex_styled', 'data'],
        data_options: {
          include_asciimath: true,
          include_latex: true,
        },
      };

      // Preparar headers
      const requestHeaders = {
        'app_id': appId,
        'app_key': apiKey,
        'Content-Type': 'application/json',
      };

      // Mostrar información detallada del request si debug está activado
      if (preferences.debug) {
        addDebugLog('=== DEBUG REQUEST INFO ===');
        addDebugLog(`URL: https://api.mathpix.com/v3/text`);
        addDebugLog(`Method: POST`);
        addDebugLog(`Headers: ${JSON.stringify(requestHeaders, null, 2)}`);
        addDebugLog(`Body size: ${JSON.stringify(requestBody).length} characters`);
        addDebugLog(`Image data size: ${finalBase64Data.length} characters`);
        addDebugLog(`Image type: ${finalImageType}`);
        addDebugLog(`Image size: ${(finalBase64Data.length * 3 / 4 / (1024 * 1024)).toFixed(2)}MB`);
        addDebugLog(`Image data preview (first 100 chars): ${finalBase64Data.substring(0, 100)}...`);
        addDebugLog(`Request body src preview: ${requestBody.src.substring(0, 100)}...`);
        addDebugLog('========================');
      }

      // Hacer request a Mathpix API
      const startTime = Date.now();
      const response = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      addDebugLog(`Respuesta de Mathpix: ${response.status} ${response.statusText}`);
      
      // Mostrar información detallada de la respuesta si debug está activado
      if (preferences.debug) {
        addDebugLog('=== DEBUG RESPONSE INFO ===');
        addDebugLog(`Status: ${response.status}`);
        addDebugLog(`Status Text: ${response.statusText}`);
        addDebugLog(`Duration: ${requestDuration}ms`);
        addDebugLog(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
        addDebugLog(`OK: ${response.ok}`);
        addDebugLog(`Redirected: ${response.redirected}`);
        addDebugLog(`Type: ${response.type}`);
        addDebugLog(`URL: ${response.url}`);
        addDebugLog('==========================');
      }

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          if (preferences.debug) {
            addDebugLog('=== DEBUG ERROR RESPONSE ===');
            addDebugLog(`Error Body: ${JSON.stringify(errorData, null, 2)}`);
            addDebugLog('============================');
          } else {
            addDebugLog(`Error detallado: ${JSON.stringify(errorData)}`);
          }
        } catch (parseError) {
          addDebugLog(`No se pudo parsear el error: ${parseError}`);
          
          // Intentar leer como texto si JSON falla
          try {
            const errorText = await response.text();
            if (preferences.debug) {
              addDebugLog('=== DEBUG ERROR TEXT ===');
              addDebugLog(`Error Text: ${errorText}`);
              addDebugLog('========================');
            }
          } catch (textError) {
            addDebugLog(`No se pudo leer el error como texto: ${textError}`);
          }
        }
        throw new Error(errorMessage);
      }

      const data: MathpixResponse = await response.json();
      
      if (preferences.debug) {
        addDebugLog('=== DEBUG SUCCESS RESPONSE ===');
        addDebugLog(`Response Body: ${JSON.stringify(data, null, 2)}`);
        addDebugLog('==============================');
      }
      
      // Verificar si hay errores en la respuesta (Mathpix puede devolver 200 pero con error en el body)
      if (data.error) {
        const errorMessage = data.error_info?.message || data.error;
        addDebugLog(`Error en respuesta de Mathpix: ${errorMessage}`);
        throw new Error(`Mathpix: ${errorMessage}`);
      }
      
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
            {preferences.debug && (
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">DEBUG ON</span>
                <button
                  onClick={() => setDebugLogs([])}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Limpiar Logs
                </button>
              </div>
            )}
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
                screenshotQuality={0.7}
                videoConstraints={{
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                  frameRate: { ideal: 15 },
                  aspectRatio: { ideal: 16/9 }
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

          {/* Información de debug - solo se muestra si debug está activado */}
          {preferences.debug && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-300">Debug Info:</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">DEBUG ON</span>
                  <button
                    onClick={() => setDebugLogs([])}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1 max-h-48 overflow-y-auto font-mono">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-500 italic">No hay logs de debug disponibles</div>
                ) : (
                  debugLogs.map((log, index) => {
                    // Detectar diferentes tipos de logs para colorearlos
                    let logClass = 'text-gray-400';
                    if (log.includes('ERROR') || log.includes('Error')) {
                      logClass = 'text-red-400';
                    } else if (log.includes('=== DEBUG')) {
                      logClass = 'text-yellow-400 font-bold';
                    } else if (log.includes('SUCCESS') || log.includes('exitoso')) {
                      logClass = 'text-green-400';
                    } else if (log.includes('WARNING') || log.includes('Warning')) {
                      logClass = 'text-yellow-300';
                    }
                    
                    return (
                      <div key={index} className={logClass}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500 rounded text-xs text-blue-300">
                <strong>💡 Debug Mode:</strong> Se muestra información detallada de requests y respuestas. 
                Ve a Configuración para desactivar.
              </div>
            </div>
          )}
        </div>

        {/* Foto capturada */}
        {photo && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">📸 Imágenes Capturadas</h3>
            
            <div className="space-y-6">
              {/* Imagen original */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-md font-medium text-white mb-3">Imagen Original</h4>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <img
                    src={photo}
                    alt="Imagen original"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
                </div>
              </div>

              {/* Imagen optimizada */}
              {optimizedPhoto && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-md font-medium text-white mb-3">Imagen Optimizada para OCR</h4>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={optimizedPhoto}
                      alt="Imagen optimizada"
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Comparación de metadatos */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-300 mb-4">Comparación de Metadatos</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Metadatos originales */}
                  {imageInfo && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h5 className="text-md font-medium text-white mb-3">Imagen Original</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tamaño:</span>
                          <span className="text-white font-medium">{imageInfo.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Dimensiones:</span>
                          <span className="text-white font-medium">{imageInfo.dimensions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Formato:</span>
                          <span className="text-white font-medium">{imageInfo.format}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadatos optimizados */}
                  {optimizedImageInfo && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h5 className="text-md font-medium text-white mb-3">Imagen Optimizada</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tamaño:</span>
                          <span className="text-green-400 font-medium">{optimizedImageInfo.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Dimensiones:</span>
                          <span className="text-white font-medium">{optimizedImageInfo.dimensions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Formato:</span>
                          <span className="text-white font-medium">{optimizedImageInfo.format}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen de optimización */}
                {imageInfo && optimizedImageInfo && (
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
                    <div className="text-sm text-blue-300">
                      <strong>Optimización:</strong> La imagen optimizada está diseñada específicamente para OCR, 
                      con mejor contraste, escala de grises y compresión optimizada para reducir el tamaño 
                      manteniendo la calidad necesaria para el reconocimiento de texto.
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={processPhoto}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  {isProcessing ? '🔄 Procesando...' : '🚀 Procesar con Mathpix (Imagen Optimizada)'}
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