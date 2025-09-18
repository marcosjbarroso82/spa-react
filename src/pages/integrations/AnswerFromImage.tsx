import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useCredentials } from '../../hooks/useCredentials';

type FlowiseResponse = any;

const ANALIZA_ENUNCIADO_URL = 'http://localhost:3008/api/v1/prediction/5aadeb2b-e801-42c7-a7bd-deb17380d677';
const RAG_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/b80a89cb-e134-4150-9a8d-22f6ffc827bf';
const HERRAMIENTAS_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/ab6d285b-4d38-467b-9a70-a6af8ebb17f8';

const AnswerFromImage: React.FC = () => {
  const { getCredentialByKey, isLoading: credentialsLoading } = useCredentials();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    const saved = localStorage.getItem('answerFromImage_autoRead');
    return saved === 'true';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
      return;
    }
    
    // Agregar a la lista existente
    setSelectedFiles(prev => [...prev, file]);
    setError(null);
    setOcrText(null);
    setLecturas([]);
    
    // Crear preview y agregar a la lista
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => [...prev, url]);
    
    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revocar URL de la imagen removida
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remover de ambas listas
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setOcrText(null);
    setLecturas([]);
    setError(null);
  };

  const handleClear = () => {
    // Limpiar URLs de preview para liberar memoria
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const process = async () => {
    if (selectedFiles.length === 0 || !appId || !apiKey) return;
    setIsProcessing(true);
    setError(null);
    setLecturas([]);

    try {
      console.log(`[AnswerFromImage] Procesando ${selectedFiles.length} imágenes`);
      
      // Procesar cada imagen secuencialmente con Mathpix
      const ocrResults: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`[AnswerFromImage] Procesando imagen ${i + 1}/${selectedFiles.length}`);
        
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
        console.log(`[AnswerFromImage] OCR ${i + 1} texto:`, text);
        
        if (text.trim()) {
          ocrResults.push(`OCR ${i + 1}: ${text}`);
        } else {
          console.warn(`[AnswerFromImage] Imagen ${i + 1} no devolvió texto`);
          ocrResults.push(`OCR ${i + 1}: [Sin texto reconocido]`);
        }
      }
      
      // Compaginar todos los resultados
      const compiledText = ocrResults.join('\n\n');
      setOcrText(compiledText);
      console.log('[AnswerFromImage] Texto compaginado:', compiledText);
      
      if (!compiledText.trim()) {
        throw new Error('Ninguna imagen devolvió texto');
      }

      console.log('[AnswerFromImage] Llamando Flowise: Analiza Enunciado');
      const analizaRes = await fetch(ANALIZA_ENUNCIADO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: compiledText }),
      });
      const analizaContentType = analizaRes.headers.get('content-type') || '';
      const analizaData: FlowiseResponse = analizaContentType.includes('application/json') ? await analizaRes.json() : await analizaRes.text();
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

      console.log('[AnswerFromImage] Fan-out a RAG y Herramientas con output:', outputToSend);
      const payload = JSON.stringify({ question: outputToSend });

      const [ragRes, toolsRes] = await Promise.all([
        fetch(RAG_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
        fetch(HERRAMIENTAS_CON_RESPUESTAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }),
      ]);

      const [ragCt, toolsCt] = [ragRes.headers.get('content-type') || '', toolsRes.headers.get('content-type') || ''];
      const ragData: FlowiseResponse = ragCt.includes('application/json') ? await ragRes.json() : await ragRes.text();
      const toolsData: FlowiseResponse = toolsCt.includes('application/json') ? await toolsRes.json() : await toolsRes.text();

      console.log('[AnswerFromImage] RAG status', ragRes.status, 'body', ragData);
      console.log('[AnswerFromImage] Herramientas status', toolsRes.status, 'body', toolsData);

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
        <p className="text-gray-300">Sube una o más imágenes, las procesamos con Mathpix OCR y consultamos Flowise.</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Agregar imagen</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <p className="text-xs text-gray-400 mt-1">Máximo 5MB por archivo. Agrega una imagen a la vez.</p>
        </div>

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
            <div className="flex gap-2">
              <button
                onClick={process}
                disabled={!canProcess || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isProcessing ? '🔄 Procesando…' : `🚀 Procesar ${selectedFiles.length} imagen${selectedFiles.length > 1 ? 'es' : ''}`}
              </button>
              <button onClick={handleClear} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">🗑️ Limpiar todo</button>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default AnswerFromImage;


