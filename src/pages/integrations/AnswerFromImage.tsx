import React, { useMemo, useRef, useState } from 'react';
import { useCredentials } from '../../hooks/useCredentials';

type FlowiseResponse = any;

const ANALIZA_ENUNCIADO_URL = 'http://localhost:3008/api/v1/prediction/5aadeb2b-e801-42c7-a7bd-deb17380d677';
const RAG_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/b80a89cb-e134-4150-9a8d-22f6ffc827bf';
const HERRAMIENTAS_CON_RESPUESTAS_URL = 'http://localhost:3008/api/v1/prediction/ab6d285b-4d38-467b-9a70-a6af8ebb17f8';

const AnswerFromImage: React.FC = () => {
  const { getCredentialByKey, isLoading: credentialsLoading } = useCredentials();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');

  const canProcess = useMemo(() => !!selectedFile && !!appId && !!apiKey && !credentialsLoading, [selectedFile, appId, apiKey, credentialsLoading]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setOcrText(null);
    setLecturas([]);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrText(null);
    setLecturas([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const process = async () => {
    if (!selectedFile || !appId || !apiKey) return;
    setIsProcessing(true);
    setError(null);
    setLecturas([]);

    try {
      console.log('[AnswerFromImage] Leyendo imagen y convirtiendo a base64');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log('[AnswerFromImage] Enviando a Mathpix');
      const mathpixRes = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': appId,
          'app_key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: `data:image/${selectedFile.type.split('/')[1]};base64,${base64}`,
          formats: ['text'],
        }),
      });
      if (!mathpixRes.ok) {
        const errData = await mathpixRes.json().catch(() => ({}));
        throw new Error(errData.error || `Mathpix error ${mathpixRes.status}`);
      }
      const mathpixData = await mathpixRes.json();
      const text: string = mathpixData?.text || '';
      setOcrText(text);
      console.log('[AnswerFromImage] OCR texto:', text);
      if (!text.trim()) {
        throw new Error('Mathpix no devolvió texto');
      }

      console.log('[AnswerFromImage] Llamando Flowise: Analiza Enunciado');
      const analizaRes = await fetch(ANALIZA_ENUNCIADO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
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
        <p className="text-gray-300">Sube una imagen, la procesamos con Mathpix OCR y consultamos Flowise.</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Seleccionar imagen</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <p className="text-xs text-gray-400 mt-1">Máximo 5MB</p>
        </div>

        {previewUrl && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Vista previa:</h4>
            <div className="flex justify-center">
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 rounded-lg border border-gray-500" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={process}
                disabled={!canProcess || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isProcessing ? '🔄 Procesando…' : '🚀 Procesar y Contestar'}
              </button>
              <button onClick={handleClear} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">🗑️ Limpiar</button>
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


