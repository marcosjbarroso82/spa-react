import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useCredentials } from '../../hooks/useCredentials';
import { useCameraConfig } from '../../hooks/useCameraConfig';
import { useImageProcessing } from '../../hooks/useImageProcessing';
import { ImageInfo } from '../../utils/imageUtils';
import ImageDisplay from '../../components/ImageDisplay';
import ImageComparison from '../../components/ImageComparison';
import ImageModal from '../../components/ImageModal';
import FileUpload from '../../components/FileUpload';
import CameraPreview from '../../components/CameraPreview';
import ProcessingControls from '../../components/ProcessingControls';
import ProcessingSteps, { ProcessingStep } from '../../components/ProcessingSteps';
import ApiRequestDisplay, { ApiRequest } from '../../components/ApiRequestDisplay';

type FlowiseResponse = any;

const ANALIZA_ENUNCIADO_URL = 'http://localhost:3008/api/v1/prediction/5aadeb2b-e801-42c7-a7bd-deb17380d677';
const RAG_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/b80a89cb-e134-4150-9a8d-22f6ffc827bf';
const HERRAMIENTAS_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/ab6d285b-4d38-467b-9a70-a6af8ebb17f8';

const AnswerFromImage: React.FC = () => {
  const { getCredentialByKey, isLoading: credentialsLoading } = useCredentials();
  const { getContinuousFocusConstraints } = useCameraConfig();
  const { processImage, isProcessing: isImageProcessing } = useImageProcessing();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageInfo, setImageInfo] = useState<ImageInfo[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [processedImageInfo, setProcessedImageInfo] = useState<ImageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    const saved = localStorage.getItem('answerFromImage_autoRead');
    return saved === 'true';
  });
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [apiRequests, setApiRequests] = useState<ApiRequest[]>([]);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; title: string } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null);

  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');

  // Función para abrir modal de imagen
  const openImageModal = (src: string, alt: string, title: string) => {
    setModalImage({ src, alt, title });
  };

  // Función para cerrar modal
  const closeImageModal = () => {
    setModalImage(null);
  };

  // Función para obtener información de la imagen (usando utilidad)
  const getImageInfo = useCallback(async (imageUrl: string): Promise<ImageInfo> => {
    const { getImageInfo: getImageInfoUtil } = await import('../../utils/imageUtils');
    return getImageInfoUtil(imageUrl);
  }, []);

  // Función para procesar la cola de speech
  const processSpeechQueue = () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
    
    const text = speechQueueRef.current.shift();
    if (!text) return;
    
    isSpeakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Configurar idioma español
    utterance.rate = 0.9; // Velocidad ligeramente más lenta para mejor comprensión
    utterance.pitch = 1.0; // Tono normal
    utterance.volume = 1.0; // Volumen máximo
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Procesar siguiente en la cola
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

  // Guardar preferencia de autoRead en localStorage
  useEffect(() => {
    localStorage.setItem('answerFromImage_autoRead', autoRead.toString());
  }, [autoRead]);

  // Funciones de cámara (basadas en TakePhoto.tsx)
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

  const addPhotoFromDataUrl = useCallback(async (dataUrl: string) => {
    try {
      // Obtener información de la imagen original
      const info = await getImageInfo(dataUrl);
      setImageInfo(prev => [...prev, info]);
      
      // Procesar la imagen para OCR
      const result = await processImage(dataUrl);
      setProcessedImages(prev => [...prev, result.processedImage]);
      setProcessedImageInfo(prev => [...prev, result.processedInfo]);
      
      // Convertir dataUrl a File
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFiles(prev => [...prev, file]);
          setPreviewUrls(prev => [...prev, dataUrl]);
          setOcrText(null);
          setLecturas([]);
          setError(null);
        })
        .catch(err => {
          console.error('Error al convertir foto a archivo:', err);
          setError('Error al procesar la foto capturada');
        });
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setError('Error al procesar la imagen capturada');
    }
  }, [getImageInfo, processImage]);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) {
      console.error('Webcam no está disponible');
      setError('La cámara no está disponible');
      return;
    }

    setIsCapturing(true);
    setIsFocusing(true);
    
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Enfoque completado');
          } catch (focusErr) {
            console.warn('No se pudo aplicar enfoque:', focusErr);
          }
        }
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
          addPhotoFromDataUrl(dataUrl);
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
        addPhotoFromDataUrl(imageSrc);
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
      setIsFocusing(false);
    }
  }, [addPhotoFromDataUrl]);

  const onUserMedia = async (stream: MediaStream) => {
    console.log('Cámara conectada exitosamente');
    setError(null);
    streamRef.current = stream;

    try {
      const track = stream.getVideoTracks()[0];
      // Solicitar autoenfoque y ajustes continuos cuando sea posible
      await (track as any).applyConstraints(getContinuousFocusConstraints() as any).catch(() => {});

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

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    // Procesar cada archivo
    for (const file of files) {
      // Validar archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
        continue;
      }
      
      // Agregar a la lista existente
      setSelectedFiles(prev => [...prev, file]);
      setError(null);
      setOcrText(null);
      setLecturas([]);
      
      // Crear preview y agregar a la lista
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
      
      // Obtener información de la imagen original
      try {
        const info = await getImageInfo(url);
        setImageInfo(prev => [...prev, info]);
        
        // Procesar la imagen para OCR
        const result = await processImage(url);
        setProcessedImages(prev => [...prev, result.processedImage]);
        setProcessedImageInfo(prev => [...prev, result.processedInfo]);
      } catch (err) {
        console.error('Error al procesar la imagen:', err);
        setError('Error al procesar la imagen');
      }
    }
  }, [getImageInfo, processImage]);

  const handleRemoveImage = (index: number) => {
    // Revocar URL de la imagen removida
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remover de todas las listas
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageInfo(prev => prev.filter((_, i) => i !== index));
    setProcessedImages(prev => prev.filter((_, i) => i !== index));
    setProcessedImageInfo(prev => prev.filter((_, i) => i !== index));
    setOcrText(null);
    setLecturas([]);
    setError(null);
  };

  const handleClear = () => {
    // Limpiar URLs de preview para liberar memoria
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setImageInfo([]);
    setProcessedImages([]);
    setProcessedImageInfo([]);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setProcessingSteps([]);
    setApiRequests([]);
  };

  const process = async () => {
    if (selectedFiles.length === 0 || !appId || !apiKey) return;
    setIsProcessing(true);
    setError(null);
    setLecturas([]);
    setApiRequests([]);

    // Inicializar pasos de procesamiento
    const initialSteps: ProcessingStep[] = [
      { id: 'ocr', title: 'Procesando OCR con Mathpix', status: 'pending', description: `Procesando ${selectedFiles.length} imagen(es)` },
      { id: 'analiza', title: 'Analizando enunciado', status: 'pending', description: 'Enviando texto a Flowise para análisis' },
      { id: 'rag', title: 'Consultando RAG con respuestas', status: 'pending', description: 'Obteniendo respuestas del sistema RAG' },
      { id: 'herramientas', title: 'Consultando herramientas', status: 'pending', description: 'Obteniendo respuestas de herramientas especializadas' }
    ];
    setProcessingSteps(initialSteps);

    try {
      console.log(`[AnswerFromImage] Procesando ${selectedFiles.length} imágenes`);
      
      // Paso 1: Procesar OCR con Mathpix
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'ocr' ? { ...step, status: 'in_progress' } : step
      ));
      
      const ocrResults: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const processedImage = processedImages[i];
        console.log(`[AnswerFromImage] Procesando imagen ${i + 1}/${selectedFiles.length}`);
        
        // Usar la imagen procesada si está disponible, sino la original
        const imageToProcess = processedImage || previewUrls[i];
        
        const base64 = await new Promise<string>((resolve, reject) => {
          // Si es una data URL, extraer el base64 directamente
          if (imageToProcess.startsWith('data:')) {
            resolve(imageToProcess.split(',')[1]);
            return;
          }
          
          // Si es un archivo, usar FileReader
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const mathpixRequest: ApiRequest = {
          id: `mathpix-${i + 1}`,
          name: `Mathpix OCR - Imagen ${i + 1}`,
          url: 'https://api.mathpix.com/v3/text',
          method: 'POST',
          headers: {
            'app_id': appId,
            'app_key': apiKey,
            'Content-Type': 'application/json',
          },
          body: {
            src: `data:image/${file.type.split('/')[1]};base64,${base64}`,
            formats: ['text'],
          },
          timestamp: new Date()
        };

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
        
        const mathpixData = await mathpixRes.json();
        mathpixRequest.status = mathpixRes.status;
        mathpixRequest.response = mathpixData;
        
        if (!mathpixRes.ok) {
          mathpixRequest.error = mathpixData.error || `Error ${mathpixRes.status}`;
          setApiRequests(prev => [...prev, mathpixRequest]);
          throw new Error(mathpixData.error || `Mathpix error ${mathpixRes.status} en imagen ${i + 1}`);
        }
        
        setApiRequests(prev => [...prev, mathpixRequest]);
        
        const text: string = mathpixData?.text || '';
        console.log(`[AnswerFromImage] OCR ${i + 1} texto:`, text);
        
        if (text.trim()) {
          ocrResults.push(`OCR ${i + 1}: ${text}`);
        } else {
          console.warn(`[AnswerFromImage] Imagen ${i + 1} no devolvió texto`);
          ocrResults.push(`OCR ${i + 1}: [Sin texto reconocido]`);
        }
      }
      
      // Marcar OCR como completado
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'ocr' ? { ...step, status: 'completed', description: `OCR completado: ${ocrResults.length} imagen(es) procesada(s)` } : step
      ));
      
      // Compaginar todos los resultados
      const compiledText = ocrResults.join('\n\n');
      setOcrText(compiledText);
      console.log('[AnswerFromImage] Texto compaginado:', compiledText);
      
      if (!compiledText.trim()) {
        throw new Error('Ninguna imagen devolvió texto');
      }

      // Paso 2: Analizar enunciado
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'analiza' ? { ...step, status: 'in_progress' } : step
      ));

      console.log('[AnswerFromImage] Llamando Flowise: Analiza Enunciado');
      const analizaRequest: ApiRequest = {
        id: 'analiza-enunciado',
        name: 'Analiza Enunciado',
        url: ANALIZA_ENUNCIADO_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { question: compiledText },
        timestamp: new Date()
      };

      const analizaRes = await fetch(ANALIZA_ENUNCIADO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: compiledText }),
      });
      const analizaContentType = analizaRes.headers.get('content-type') || '';
      const analizaData: FlowiseResponse = analizaContentType.includes('application/json') ? await analizaRes.json() : await analizaRes.text();
      
      analizaRequest.status = analizaRes.status;
      analizaRequest.response = analizaData;
      setApiRequests(prev => [...prev, analizaRequest]);
      
      console.log('[AnswerFromImage] Analiza Enunciado status', analizaRes.status, 'body', analizaData);

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
        // Fallback: algunos flujos devuelven en "text" un JSON stringificado
        outputToSend = (analizaData as any).text as string;
      }
      if (!outputToSend || !String(outputToSend).trim()) {
        throw new Error('No se encontró output en Analiza Enunciado');
      }

      // Marcar análisis como completado
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'analiza' ? { ...step, status: 'completed', description: 'Análisis completado' } : step
      ));

      // Paso 3 y 4: RAG y Herramientas en paralelo
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'rag' || step.id === 'herramientas' ? { ...step, status: 'in_progress' } : step
      ));

      console.log('[AnswerFromImage] Fan-out a RAG y Herramientas con output:', outputToSend);
      const payload = JSON.stringify({ question: outputToSend });

      const ragRequest: ApiRequest = {
        id: 'rag-respuestas',
        name: 'RAG con Respuestas',
        url: RAG_CON_RESPUESTAS_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { question: outputToSend },
        timestamp: new Date()
      };

      const toolsRequest: ApiRequest = {
        id: 'herramientas-respuestas',
        name: 'Herramientas con Respuestas',
        url: HERRAMIENTAS_CON_RESPUESTAS_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { question: outputToSend },
        timestamp: new Date()
      };

      const [ragRes, toolsRes] = await Promise.all([
        fetch(RAG_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
        fetch(HERRAMIENTAS_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
      ]);

      const [ragCt, toolsCt] = [ragRes.headers.get('content-type') || '', toolsRes.headers.get('content-type') || ''];
      const ragData: FlowiseResponse = ragCt.includes('application/json') ? await ragRes.json() : await ragRes.text();
      const toolsData: FlowiseResponse = toolsCt.includes('application/json') ? await toolsRes.json() : await toolsRes.text();

      ragRequest.status = ragRes.status;
      ragRequest.response = ragData;
      toolsRequest.status = toolsRes.status;
      toolsRequest.response = toolsData;
      
      setApiRequests(prev => [...prev, ragRequest, toolsRequest]);

      console.log('[AnswerFromImage] RAG status', ragRes.status, 'body', ragData);
      console.log('[AnswerFromImage] Herramientas status', toolsRes.status, 'body', toolsData);

      // Marcar RAG y herramientas como completados
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'rag' ? { ...step, status: 'completed', description: 'RAG completado' } :
        step.id === 'herramientas' ? { ...step, status: 'completed', description: 'Herramientas completadas' } :
        step
      ));

      const extractLectura = (data: any): string | null => {
        const list = data?.response?.agentFlowExecutedData ?? data?.agentFlowExecutedData;
        if (!Array.isArray(list) || list.length === 0) return null;
        const last = list[list.length - 1];
        const output = last?.data?.output;
        if (!output) return null;
        if (typeof output?.lectura === 'string') return output.lectura as string;
        // A veces output.content es un JSON string con el campo lectura
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

      // Agregar a la cola de speech si autoRead está activado
      if (l1) {
        queueSpeech(`RAG con Respuestas: ${l1}`);
      }
      if (l2) {
        queueSpeech(`Herramientas con Respuestas: ${l2}`);
      }
    } catch (err) {
      console.error('[AnswerFromImage] Error en el proceso', err);
      setError(err instanceof Error ? err.message : 'Error en el proceso');
      
      // Marcar el paso actual como error
      setProcessingSteps(prev => prev.map(step => 
        step.status === 'in_progress' ? { ...step, status: 'error', error: err instanceof Error ? err.message : 'Error desconocido' } : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  if (credentialsLoading) {
    return <div className="text-center py-8 text-white">Cargando credenciales…</div>;
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🖼️</div>
        <h2 className="text-2xl font-semibold mb-2 text-blue-400">Contestar por Imagen</h2>
        <p className="text-gray-300">Sube imágenes o toma fotos, las procesamos con Mathpix OCR y consultamos Flowise.</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">
        {/* Opciones para agregar imágenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subir archivo */}
          <div>
            <FileUpload
              onFileSelect={handleFileSelect}
              accept="image/*"
              multiple={true}
              maxSize={5}
              buttonText="Seleccionar Imágenes"
              icon="📁"
              showInfo={true}
            />
          </div>

          {/* Tomar foto */}
          <div>
            <div className="flex gap-2">
              {!isCameraOn ? (
                <button
                  onClick={startCamera}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-sm transition-colors duration-200"
                >
                  📹 Activar Cámara
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors duration-200"
                >
                  📹 Desactivar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Usa la cámara de tu dispositivo</p>
          </div>
        </div>

        {/* Cámara */}
        {isCameraOn && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Cámara activa:</h4>
            <CameraPreview
              isActive={isCameraOn}
              onCapture={capturePhoto}
              isCapturing={isCapturing}
              isFocusing={isFocusing}
              error={error || undefined}
              showControls={true}
              webcamRef={webcamRef as React.RefObject<Webcam>}
              onUserMedia={onUserMedia}
              onUserMediaError={onUserMediaError}
            />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRead}
              onChange={(e) => setAutoRead(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-300">🔊 Lectura automática de respuestas</span>
          </label>
        </div>

        {previewUrls.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Imágenes seleccionadas ({previewUrls.length}):</h4>
            
            {/* Mostrar comparación de imágenes si hay imágenes procesadas */}
            {processedImages.length > 0 ? (
              <div className="space-y-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-300">Imagen {index + 1}</h5>
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Remover imagen"
                      >
                        ✕ Remover
                      </button>
                    </div>
                    <ImageComparison
                      originalImage={url}
                      processedImage={processedImages[index]}
                      originalInfo={imageInfo[index]}
                      processedInfo={processedImageInfo[index]}
                      onImageClick={(src, title) => openImageModal(src, title, title)}
                      processing={isImageProcessing}
                      showSizeReduction={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Mostrar imágenes individuales si no hay procesadas */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <ImageDisplay
                    key={index}
                    imageSrc={url}
                    imageInfo={imageInfo[index]}
                    title={`Imagen ${index + 1}`}
                    showInfo={true}
                    maxHeight="max-h-48"
                    actions={
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Remover imagen"
                      >
                        ✕ Remover
                      </button>
                    }
                  />
                ))}
              </div>
            )}
            
            <ProcessingControls
              onProcess={process}
              onClear={handleClear}
              isProcessing={isProcessing}
              hasImage={previewUrls.length > 0}
              processText={`Procesar ${selectedFiles.length} imagen${selectedFiles.length > 1 ? 'es' : ''}`}
              clearText="Limpiar todo"
              showCamera={false}
              className="justify-start"
            />
          </div>
        )}
      </div>

      {/* Progreso del procesamiento */}
      {processingSteps.length > 0 && (
        <ProcessingSteps steps={processingSteps} />
      )}

      {/* Requests de API */}
      {apiRequests.length > 0 && (
        <ApiRequestDisplay requests={apiRequests} />
      )}

      {ocrText && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">Texto OCR</h3>
          <div className="bg-gray-800 rounded p-3 font-mono text-sm text-white whitespace-pre-wrap">{ocrText}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          <div className="font-medium">Error</div>
          <div>{error}</div>
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

      {/* Modal de imagen */}
      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={closeImageModal}
          imageSrc={modalImage.src}
          imageAlt={modalImage.alt}
          title={modalImage.title}
        />
      )}
    </div>
  );
};

export default AnswerFromImage;


