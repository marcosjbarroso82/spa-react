import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Webcam from 'react-webcam';
import { useCredentials } from '../../hooks/useCredentials';
import { useVariables } from '../../hooks/useVariables';
import { usePreferences } from '../../hooks/usePreferences';

interface FlowiseResponse {
  response?: {
    agentFlowExecutedData?: any[];
  };
  agentFlowExecutedData?: any[];
  text?: string;
}

type InputMode = 'file' | 'camera';

const AnswerFromImageUX: React.FC = () => {
  const { getCredentialByKey, isLoading: credentialsLoading } = useCredentials();
  const { getVariableByKey, isLoading: variablesLoading } = useVariables();
  const { preferences, isLoading: preferencesLoading } = usePreferences();
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Estados para debugging
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [imageInfo, setImageInfo] = useState<{
    size: string;
    dimensions: string;
    format: string;
  }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null);

  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');
  
  // Obtener URLs de las variables
  const analizaEnunciadoUrl = getVariableByKey('ANALIZA_ENUNCIADO_URL');
  const ragConRespuestasUrl = getVariableByKey('RAG_CON_RESPUESTAS_URL');
  const herramientasConRespuestasUrl = getVariableByKey('HERRAMIENTAS_CON_RESPUESTAS_URL');
  // Usar preferences.debug en lugar de variables
  const isDebugMode = preferences.debug;
  
  // Log para verificar el estado del debug
  useEffect(() => {
    console.log('preferences.debug:', preferences.debug);
    console.log('isDebugMode:', isDebugMode);
  }, [preferences.debug, isDebugMode]);

  // Función para agregar logs de debug
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
    console.log(`[AnswerFromImageUX] ${message}`);
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
  const getImageInfo = (imageUrl: string) => {
    // Verificar si es un data URL o una URL de objeto
    const isDataUrl = imageUrl.startsWith('data:image/');
    
    let sizeInMB = 0;
    let imageType = 'UNKNOWN';
    
    if (isDataUrl) {
      // Para data URLs, extraer información del base64
      const base64Data = imageUrl.split(',')[1];
      if (!base64Data) {
        return Promise.resolve({
          size: '0.00 MB',
          dimensions: '0 × 0',
          format: 'UNKNOWN'
        });
      }
      
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
      imageType = mimeType.split('/')[1];
      
      // Calcular tamaño aproximado
      const sizeInBytes = (base64Data.length * 3) / 4;
      sizeInMB = sizeInBytes / (1024 * 1024);
    } else {
      // Para URLs de objeto, no podemos calcular el tamaño fácilmente
      // Usaremos el tamaño del archivo si está disponible
      imageType = 'JPEG'; // Asumimos JPEG para fotos capturadas
    }
    
    // Obtener dimensiones
    return new Promise<{size: string, dimensions: string, format: string}>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          size: isDataUrl ? `${sizeInMB.toFixed(2)} MB` : 'Tamaño desconocido',
          dimensions: `${img.width} × ${img.height}`,
          format: imageType.toUpperCase()
        });
      };
      img.onerror = () => {
        resolve({
          size: isDataUrl ? `${sizeInMB.toFixed(2)} MB` : 'Tamaño desconocido',
          dimensions: '0 × 0',
          format: imageType.toUpperCase()
        });
      };
      img.src = imageUrl;
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

  const canProcess = useMemo(() => 
    selectedFiles.length > 0 && 
    !!appId && 
    !!apiKey && 
    !!analizaEnunciadoUrl && 
    !!ragConRespuestasUrl && 
    !!herramientasConRespuestasUrl && 
    !credentialsLoading && 
    !variablesLoading && 
    !preferencesLoading, 
    [selectedFiles, appId, apiKey, analizaEnunciadoUrl, ragConRespuestasUrl, herramientasConRespuestasUrl, credentialsLoading, variablesLoading, preferencesLoading]
  );

  // Función para procesar la cola de speech
  const processSpeechQueue = () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
    
    const text = speechQueueRef.current.shift();
    if (!text) return;
    
    isSpeakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(processSpeechQueue, 100);
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setTimeout(processSpeechQueue, 100);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Función para agregar texto a la cola de speech
  const queueSpeech = (text: string) => {
    if (!autoRead) return;
    speechQueueRef.current.push(text);
    processSpeechQueue();
  };

  // Funciones de cámara
  const startCamera = useCallback(() => {
    setError(null);
    setIsCameraOn(true);
    setCameraInitialized(false);
    addDebugLog('Iniciando cámara...');
  }, []);

  const stopCamera = useCallback(() => {
    setIsCameraOn(false);
    setCameraInitialized(false);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    streamRef.current = null;
    imageCaptureRef.current = null;
    addDebugLog('Cámara detenida');
  }, []);

  // Inicializar preferencias cuando se cargan
  useEffect(() => {
    if (!preferencesLoading) {
      setInputMode(preferences.imageInputMode);
      setAutoRead(preferences.autoRead);
    }
  }, [preferences, preferencesLoading]);

  // Activar cámara automáticamente cuando se selecciona modo cámara
  useEffect(() => {
    if (inputMode === 'camera' && !isCameraOn) {
      startCamera();
    } else if (inputMode === 'file' && isCameraOn) {
      stopCamera();
    }
  }, [inputMode, isCameraOn, startCamera, stopCamera]);

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const addPhotoFromDataUrl = useCallback(async (dataUrl: string) => {
    try {
      // Obtener información de la imagen
      const info = await getImageInfo(dataUrl);
      setImageInfo(prev => [...prev, info]);
      addDebugLog(`Imagen agregada: ${info.dimensions}, ${info.size}`);

      // Verificar si la imagen es muy grande y redimensionarla si es necesario
      const base64Data = dataUrl.split(',')[1];
      const imageSizeInBytes = (base64Data.length * 3) / 4;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      let processedDataUrl = dataUrl;
      if (imageSizeInMB > 5) {
        addDebugLog(`Imagen muy grande (${imageSizeInMB.toFixed(2)}MB), redimensionando...`);
        processedDataUrl = await resizeImage(dataUrl, 1920, 1080, 0.8);
        addDebugLog('Imagen redimensionada');
      }

      fetch(processedDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFiles(prev => [...prev, file]);
          setPreviewUrls(prev => [...prev, processedDataUrl]);
          setOcrText(null);
          setLecturas([]);
          setError(null);
          setShowResults(false);
        })
        .catch(err => {
          addDebugLog(`Error al convertir foto a archivo: ${err}`);
          setError('Error al procesar la foto capturada');
        });
    } catch (err) {
      addDebugLog(`Error al procesar imagen: ${err}`);
      setError('Error al procesar la imagen capturada');
    }
  }, []);

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
          imageCaptureRef.current = new (window as any).ImageCapture(track);
        }
        try {
          const blob: Blob = await imageCaptureRef.current.takePhoto();
          const dataUrl = await blobToDataUrl(blob);
          addPhotoFromDataUrl(dataUrl);
          setError(null);
          addDebugLog('Foto capturada a resolución nativa con ImageCapture');
          return;
        } catch (icErr) {
          addDebugLog(`ImageCapture falló: ${icErr}`);
        }
      }

      // Alternativa: captura desde el canvas de react-webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        addPhotoFromDataUrl(imageSrc);
        setError(null);
        addDebugLog('Foto capturada con getScreenshot');
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
  }, [focusCamera, addPhotoFromDataUrl]);

  const onUserMedia = async (stream: MediaStream) => {
    addDebugLog('Cámara conectada exitosamente');
    setError(null);
    streamRef.current = stream;
    setCameraInitialized(true);

    try {
      const track = stream.getVideoTracks()[0];
      await (track as any).applyConstraints({
        advanced: [
          { focusMode: 'continuous' },
          { whiteBalanceMode: 'continuous' },
          { exposureMode: 'continuous' }
        ]
      } as any).catch(() => {});

      if ('ImageCapture' in window) {
        try {
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
      return;
    }
    
    setSelectedFiles(prev => [...prev, file]);
    setError(null);
    setOcrText(null);
    setLecturas([]);
    setShowResults(false);
    
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => [...prev, url]);
    
    // Obtener información de la imagen usando el archivo directamente
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileType = file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN';
    
    // Crear información básica del archivo
    const fileInfo = {
      size: `${fileSizeInMB} MB`,
      dimensions: 'Cargando...',
      format: fileType
    };
    
    setImageInfo(prev => [...prev, fileInfo]);
    addDebugLog(`Archivo agregado: ${fileSizeInMB}MB, tipo: ${fileType}`);
    
    // Obtener dimensiones de la imagen
    getImageInfo(url).then(info => {
      setImageInfo(prev => prev.map((item, index) => 
        index === prev.length - 1 ? { ...item, dimensions: info.dimensions } : item
      ));
      addDebugLog(`Dimensiones obtenidas: ${info.dimensions}`);
    }).catch(err => {
      addDebugLog(`Error al obtener dimensiones: ${err}`);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageInfo(prev => prev.filter((_, i) => i !== index));
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
    addDebugLog(`Imagen ${index + 1} eliminada`);
  };

  const handleClear = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setImageInfo([]);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addDebugLog('Todas las imágenes eliminadas');
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
    addDebugLog('Procesamiento cancelado');
  };

  const handleRestart = () => {
    handleClear();
    setInputMode('file');
    setIsCameraOn(false);
    stopCamera();
    addDebugLog('Proceso reiniciado');
  };

  const process = async () => {
    if (selectedFiles.length === 0 || !appId || !apiKey || !analizaEnunciadoUrl || !ragConRespuestasUrl || !herramientasConRespuestasUrl) return;
    setIsProcessing(true);
    setError(null);
    setLecturas([]);
    setShowResults(false);

    try {
      addDebugLog(`Procesando ${selectedFiles.length} imágenes`);
      
      const ocrResults: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        addDebugLog(`Procesando imagen ${i + 1}/${selectedFiles.length}`);
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        addDebugLog(`Enviando imagen ${i + 1} a Mathpix`);

        const mathpixRes = await fetch('https://api.mathpix.com/v3/text', {
          method: 'POST',
          headers: {
            'app_id': appId,
            'app_key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            src: `data:image/${file.type.split('/')[1]};base64,${base64}`,
            formats: ['text'],
          }),
        });
        
        addDebugLog(`Mathpix respuesta imagen ${i + 1}: ${mathpixRes.status} ${mathpixRes.statusText}`);
        
        if (!mathpixRes.ok) {
          const errData = await mathpixRes.json().catch(() => ({}));
          throw new Error(errData.error || `Mathpix error ${mathpixRes.status} en imagen ${i + 1}`);
        }
        
        const mathpixData = await mathpixRes.json();
        const text: string = mathpixData?.text || '';
        addDebugLog(`OCR ${i + 1} texto: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        
        if (text.trim()) {
          ocrResults.push(`OCR ${i + 1}: ${text}`);
        } else {
          addDebugLog(`Imagen ${i + 1} no devolvió texto`);
          ocrResults.push(`OCR ${i + 1}: [Sin texto reconocido]`);
        }
      }
      
      const compiledText = ocrResults.join('\n\n');
      setOcrText(compiledText);
      addDebugLog(`Texto compilado: ${compiledText.substring(0, 200)}${compiledText.length > 200 ? '...' : ''}`);
      
      if (!compiledText.trim()) {
        throw new Error('Ninguna imagen devolvió texto');
      }

      addDebugLog('Llamando Flowise: Analiza Enunciado');
      const analizaRes = await fetch(analizaEnunciadoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: compiledText }),
      });
      const analizaContentType = analizaRes.headers.get('content-type') || '';
      const analizaData: FlowiseResponse = analizaContentType.includes('application/json') ? await analizaRes.json() : await analizaRes.text();
      addDebugLog(`Analiza Enunciado status: ${analizaRes.status}`);

      const agentDataList: any[] = (analizaData as any)?.response?.agentFlowExecutedData
        ?? (analizaData as any)?.agentFlowExecutedData
        ?? [];
      const lastAgentData = Array.isArray(agentDataList) && agentDataList.length > 0 ? agentDataList[agentDataList.length - 1] : null;

      let outputToSend: string | undefined;
      const outputCandidate: any = lastAgentData?.data?.output;
      if (typeof outputCandidate === 'string') {
        outputToSend = outputCandidate;
      } else if (outputCandidate && typeof outputCandidate === 'object' && 'content' in outputCandidate) {
        outputToSend = (outputCandidate as any).content as string;
      } else if (typeof (analizaData as any)?.text === 'string') {
        outputToSend = (analizaData as any).text as string;
      }
      if (!outputToSend || !String(outputToSend).trim()) {
        throw new Error('No se encontró output en Analiza Enunciado');
      }

      addDebugLog(`Fan-out a RAG y Herramientas con output: ${outputToSend.substring(0, 100)}${outputToSend.length > 100 ? '...' : ''}`);
      const payload = JSON.stringify({ question: outputToSend });

      const [ragRes, toolsRes] = await Promise.all([
        fetch(ragConRespuestasUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
        fetch(herramientasConRespuestasUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
      ]);

      const [ragCt, toolsCt] = [ragRes.headers.get('content-type') || '', toolsRes.headers.get('content-type') || ''];
      const ragData: FlowiseResponse = ragCt.includes('application/json') ? await ragRes.json() : await ragRes.text();
      const toolsData: FlowiseResponse = toolsCt.includes('application/json') ? await toolsRes.json() : await toolsRes.text();

      addDebugLog(`RAG status: ${ragRes.status}, Herramientas status: ${toolsRes.status}`);

      const extractLectura = (data: any): string | null => {
        const list = data?.response?.agentFlowExecutedData ?? data?.agentFlowExecutedData;
        if (!Array.isArray(list) || list.length === 0) return null;
        const last = list[list.length - 1];
        const output = last?.data?.output;
        if (!output) return null;
        if (typeof output?.lectura === 'string') return output.lectura as string;
        const content = (output as any)?.content;
        if (typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed?.lectura === 'string') return parsed.lectura as string;
          } catch {}
        }
        return null;
      };

      const l1 = extractLectura(ragData);
      const l2 = extractLectura(toolsData);
      const collected = [l1, l2].filter((x): x is string => typeof x === 'string');
      setLecturas(collected);

      if (l1) {
        addDebugLog(`RAG lectura: ${l1.substring(0, 100)}${l1.length > 100 ? '...' : ''}`);
        queueSpeech(`RAG con Respuestas: ${l1}`);
      }
      if (l2) {
        addDebugLog(`Herramientas lectura: ${l2.substring(0, 100)}${l2.length > 100 ? '...' : ''}`);
        queueSpeech(`Herramientas con Respuestas: ${l2}`);
      }

      addDebugLog('Procesamiento completado exitosamente');
      setShowResults(true);
    } catch (err) {
      addDebugLog(`Error en el proceso: ${err}`);
      setError(err instanceof Error ? err.message : 'Error en el proceso');
    } finally {
      setIsProcessing(false);
    }
  };

  if (credentialsLoading || variablesLoading || preferencesLoading) {
    return <div className="text-center py-8 text-white">Cargando configuración…</div>;
  }
  
  if (!appId || !apiKey) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🖼️</div>
        <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Credenciales de Mathpix Requeridas</h2>
        <p className="text-gray-300 mb-4">Configura <strong>mathpix_app_id</strong> y <strong>mathpix_api_key</strong> en Configuración.</p>
      </div>
    );
  }
  
  if (!analizaEnunciadoUrl || !ragConRespuestasUrl || !herramientasConRespuestasUrl) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔧</div>
        <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Variables de Configuración Requeridas</h2>
        <p className="text-gray-300 mb-4">Configura las siguientes variables en Configuración:</p>
        <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
          <ul className="text-left text-gray-300 space-y-2">
            <li>• <strong>ANALIZA_ENUNCIADO_URL</strong></li>
            <li>• <strong>RAG_CON_RESPUESTAS_URL</strong></li>
            <li>• <strong>HERRAMIENTAS_CON_RESPUESTAS_URL</strong></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🖼️</div>
        <h2 className="text-2xl font-semibold mb-2 text-blue-400">Contestar por Imagen UX</h2>
        <p className="text-gray-300">Sube imágenes o toma fotos, las procesamos con Mathpix OCR y consultamos Flowise.</p>
        {isDebugMode && (
          <div className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-full inline-block">
            🐛 Debug Mode Activado
          </div>
        )}
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">

        {/* Contenido según el modo seleccionado */}
        {inputMode === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">📁 Subir imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-gray-400 mt-1">Máximo 5MB por archivo</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">📷 Tomar foto</label>
            
            {/* Solo mostrar el botón de tomar foto */}
            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                disabled={isCapturing || !cameraInitialized}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 text-lg"
              >
                {isCapturing ? (
                  isFocusing ? '🎯 Enfocando...' : '📸 Capturando...'
                ) : (
                  '📸 Tomar Foto'
                )}
              </button>
            </div>
            
            {!cameraInitialized && isCameraOn && (
              <p className="text-center text-sm text-gray-400">Inicializando cámara...</p>
            )}
            
            <p className="text-xs text-gray-400 text-center">Usa la cámara de tu dispositivo</p>

            {/* Cámara oculta - solo para funcionalidad */}
            {isCameraOn && (
              <div className="hidden">
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
                />
              </div>
            )}
          </div>
        )}

        {/* Información de debug - Solo si DEBUG_MODE está configurado */}
        {isDebugMode && (
          <div className="space-y-4">
            {/* Debug Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">🐛 Debug Info:</h4>
              <div className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>

            {/* Información de imágenes */}
            {imageInfo.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">📊 Información de Imágenes:</h4>
                <div className="space-y-2">
                  {imageInfo.map((info, index) => (
                    <div key={index} className="bg-gray-700 rounded p-2">
                      <div className="text-xs text-gray-400 mb-1">Imagen {index + 1}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Tamaño:</span>
                          <div className="text-white font-medium">{info.size}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Dimensiones:</span>
                          <div className="text-white font-medium">{info.dimensions}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Formato:</span>
                          <div className="text-white font-medium">{info.format}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview de imágenes - Siempre visible */}
            {previewUrls.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">🖼️ Imágenes seleccionadas ({previewUrls.length}):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-400">Imagen {index + 1}</div>
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          title="Remover imagen"
                        >
                          ✕
                        </button>
                      </div>
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-500" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* Botones de acción */}
        {!showResults && (
          <div className="flex gap-2">
            {!isProcessing ? (
              <>
                <button
                  onClick={process}
                  disabled={!canProcess}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🚀 Procesar {selectedFiles.length} imagen{selectedFiles.length > 1 ? 'es' : ''}
                </button>
                <button 
                  onClick={handleClear} 
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🗑️ Limpiar
                </button>
              </>
            ) : (
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ❌ Cancelar Procesamiento
              </button>
            )}
          </div>
        )}

        {/* Indicador de procesamiento */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span>🔄 Procesando imagen{selectedFiles.length > 1 ? 'es' : ''}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {showResults && (
        <div className="space-y-4">
          {/* Texto OCR - Solo en modo debug */}
          {isDebugMode && ocrText && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">🐛 Texto OCR</h3>
              <div className="bg-gray-800 rounded p-3 font-mono text-sm text-white whitespace-pre-wrap">{ocrText}</div>
            </div>
          )}

          {lecturas.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-medium text-white">Lecturas</h3>
              <ul className="list-disc list-inside space-y-1">
                {lecturas.map((l, idx) => (
                  <li key={idx} className="text-gray-100">{l}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleRestart}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              🔄 Reiniciar Proceso
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          <div className="font-medium">Error</div>
          <div>{error}</div>
        </div>
      )}
    </div>
  );
};

export default AnswerFromImageUX;