import React, { useMemo, useState } from 'react';

type OptionKey = 'ocr' | 'contesta' | 'otra';

const PRESETS: Record<Exclude<OptionKey, 'otra'>, string> = {
  ocr: 'http://localhost:3008/api/v1/prediction/5aadeb2b-e801-42c7-a7bd-deb17380d677',
  contesta: 'http://localhost:3008/api/v1/prediction/5aadeb2b-e801-4999-a7bd-deb17380d677'
};

const DEFAULT_QUESTION = '4 es mayor que 3? A- Verdadero B- Falso';

const FlowiseTester: React.FC = () => {
  const [selected, setSelected] = useState<OptionKey>('ocr');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [question, setQuestion] = useState<string>(DEFAULT_QUESTION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveUrl = useMemo(() => {
    if (selected === 'otra') return customUrl.trim();
    return PRESETS[selected];
  }, [selected, customUrl]);

  const canSubmit = useMemo(() => {
    if (!question.trim()) return false;
    if (!effectiveUrl) return false;
    try {
      new URL(effectiveUrl);
      return true;
    } catch {
      return false;
    }
  }, [effectiveUrl, question]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    setStatus(null);
    setResponseBody(null);

    try {
      const res = await fetch(effectiveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      setStatus(res.status);
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      setResponseBody(data);
    } catch (err: any) {
      setError(err?.message || 'Error realizando la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">🤖 Probar endpoints de Flowise</h2>
        <p className="text-gray-300">Selecciona un endpoint o ingresa uno personalizado y envía una pregunta.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint</label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value as OptionKey)}
              className="col-span-1 md:col-span-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
            >
              <option value="ocr">compagina OCR</option>
              <option value="contesta">Contesta</option>
              <option value="otra">Otra...</option>
            </select>

            <input
              type="text"
              placeholder="http://localhost:3008/api/v1/prediction/..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              disabled={selected !== 'otra'}
              className={`md:col-span-2 bg-gray-900 border rounded-lg px-3 py-2 text-gray-100 ${
                selected === 'otra' ? 'border-gray-600' : 'border-gray-800 opacity-60 cursor-not-allowed'
              }`}
            />
          </div>
          {selected !== 'otra' && (
            <p className="mt-2 text-xs text-gray-400 break-all">URL: {effectiveUrl}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pregunta</label>
          <textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
            placeholder={DEFAULT_QUESTION}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Enviando...' : 'Enviar' }
          </button>
          {!canSubmit && (
            <span className="text-sm text-gray-400">Completa la URL y la pregunta</span>
          )}
        </div>
      </form>

      {(status !== null || error || responseBody) && (
        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-200">Respuesta</h3>
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-300">{error}</div>
          )}
          {status !== null && (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded text-gray-300">Status: {status}</div>
          )}
          {responseBody !== null && (
            <pre className="p-4 bg-gray-900 border border-gray-700 rounded text-gray-100 overflow-auto text-sm">
{typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default FlowiseTester;



