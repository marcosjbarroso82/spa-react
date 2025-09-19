import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Webcam from 'react-webcam';
import { useCredentials } from '../../hooks/useCredentials';

// URLs de Flowise (mismas que en AnswerFromImage)
const ANALIZA_ENUNCIADO_URL = 'https://flowise.ia-ai.com/api/v1/prediction/4a4a4a4a-4a4a-4a4a-4a4a-4a4a4a4a4a4a';
const RAG_CON_RESPUESTAS_URL = 'https://flowise.ia-ai.com/api/v1/prediction/5b5b5b5b-5b5b-5b5b-5b5b-5b5b5b5b5b5b';
const HERRAMIENTAS_CON_RESPUESTAS_URL = 'https://flowise.ia-ai.com/api/v1/prediction/6c6c6c6c-6c6c-6c6c-6c6c-6c6c6c6c6c6c';

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
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    const saved = localStorage.getItem('answerFromImageUX_autoRead');
    return saved === 'true';
  });
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCaptureRef = useRef<any>(null);

  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');

  const canProcess = useMemo(() => selectedFiles.length > 0 && !!appId && !!apiKey && !credentialsLoading, [selectedFiles, appId, apiKey, credentialsLoading]);

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

  // Guardar preferencia de autoRead en localStorage
  useEffect(() => {
    localStorage.setItem('answerFromImageUX_autoRead', autoRead.toString());
  }, [autoRead]);

  // Funciones de cámara
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
    
    try {
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
    }
  }, []);

  const addPhotoFromDataUrl = (dataUrl: string) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFiles(prev => [...prev, file]);
        setPreviewUrls(prev => [...prev, dataUrl]);
        setOcrText(null);
        setLecturas([]);
        setError(null);
        setShowResults(false);
      })
      .catch(err => {
        console.error('Error al convertir foto a archivo:', err);
        setError('Error al procesar la foto capturada');
      });
  };

  const onUserMedia = async (stream: MediaStream) => {
    console.log('Cámara conectada exitosamente');
    setError(null);
    streamRef.current = stream;

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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
  };

  const handleClear = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    setShowResults(false);
  };

  const handleRestart = () => {
    handleClear();
    setInputMode('file');
    setIsCameraOn(false);
    stopCamera();
  };

  const process = async () => {
    if (selectedFiles.length === 0 || !appId || !apiKey) return;
    setIsProcessing(true);
    setError(null);
    setLecturas([]);
    setShowResults(false);

    try {
      console.log(`[AnswerFromImageUX] Procesando ${selectedFiles.length} imágenes`);
      
      const ocrResults: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`[AnswerFromImageUX] Procesando imagen ${i + 1}/${selectedFiles.length}`);
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

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
        
        if (!mathpixRes.ok) {
          const errData = await mathpixRes.json().catch(() => ({}));
          throw new Error(errData.error || `Mathpix error ${mathpixRes.status} en imagen ${i + 1}`);
        }
        
        const mathpixData = await mathpixRes.json();
        const text: string = mathpixData?.text || '';
        console.log(`[AnswerFromImageUX] OCR ${i + 1} texto:`, text);
        
        if (text.trim()) {
          ocrResults.push(`OCR ${i + 1}: ${text}`);
        } else {
          console.warn(`[AnswerFromImageUX] Imagen ${i + 1} no devolvió texto`);
          ocrResults.push(`OCR ${i + 1}: [Sin texto reconocido]`);
        }
      }
      
      const compiledText = ocrResults.join('\n\n');
      setOcrText(compiledText);
      console.log('[AnswerFromImageUX] Texto compaginado:', compiledText);
      
      if (!compiledText.trim()) {
        throw new Error('Ninguna imagen devolvió texto');
      }

      console.log('[AnswerFromImageUX] Llamando Flowise: Analiza Enunciado');
      const analizaRes = await fetch(ANALIZA_ENUNCIADO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: compiledText }),
      });
      const analizaContentType = analizaRes.headers.get('content-type') || '';
      const analizaData: FlowiseResponse = analizaContentType.includes('application/json') ? await analizaRes.json() : await analizaRes.text();
      console.log('[AnswerFromImageUX] Analiza Enunciado status', analizaRes.status, 'body', analizaData);

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

      console.log('[AnswerFromImageUX] Fan-out a RAG y Herramientas con output:', outputToSend);
      const payload = JSON.stringify({ question: outputToSend });

      const [ragRes, toolsRes] = await Promise.all([
        fetch(RAG_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
        fetch(HERRAMIENTAS_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
      ]);

      const [ragCt, toolsCt] = [ragRes.headers.get('content-type') || '', toolsRes.headers.get('content-type') || ''];
      const ragData: FlowiseResponse = ragCt.includes('application/json') ? await ragRes.json() : await ragRes.text();
      const toolsData: FlowiseResponse = toolsCt.includes('application/json') ? await toolsRes.json() : await toolsRes.text();

      console.log('[AnswerFromImageUX] RAG status', ragRes.status, 'body', ragData);
      console.log('[AnswerFromImageUX] Herramientas status', toolsRes.status, 'body', toolsData);

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
        queueSpeech(`RAG con Respuestas: ${l1}`);
      }
      if (l2) {
        queueSpeech(`Herramientas con Respuestas: ${l2}`);
      }

      setShowResults(true);
    } catch (err) {
      console.error('[AnswerFromImageUX] Error en el proceso', err);
      setError(err instanceof Error ? err.message : 'Error en el proceso');
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
        <h2 className="text-2xl font-semibold mb-2 text-blue-400">Contestar por Imagen UX</h2>
        <p className="text-gray-300">Sube imágenes o toma fotos, las procesamos con Mathpix OCR y consultamos Flowise.</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">
        {/* Selector de modo de entrada */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Modo de entrada:</label>
          <select
            value={inputMode}
            onChange={(e) => {
              setInputMode(e.target.value as InputMode);
              handleClear();
              if (isCameraOn) stopCamera();
            }}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="file">📁 Cargar archivo de imagen</option>
            <option value="camera">📷 Tomar foto con cámara</option>
          </select>
        </div>

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
            <div className="flex gap-2">
              {!isCameraOn ? (
                <button
                  onClick={startCamera}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-sm transition-colors duration-200"
                >
                  📹 Activar Cámara
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors duration-200"
                >
                  📹 Desactivar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">Usa la cámara de tu dispositivo</p>

            {/* Cámara */}
            {isCameraOn && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Cámara activa:</h4>
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
                    className="w-full h-auto max-h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    {isCapturing ? '📸 Capturando...' : '📸 Tomar Foto'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checkbox de lectura automática */}
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

        {/* Preview de imágenes */}
        {previewUrls.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Imágenes seleccionadas ({previewUrls.length}):</h4>
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
          {ocrText && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Texto OCR</h3>
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
