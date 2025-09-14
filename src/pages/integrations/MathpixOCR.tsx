import React, { useState, useRef } from 'react';
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

const MathpixOCR: React.FC = () => {
  const { getCredentialByKey, isLoading } = useCredentials();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MathpixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener credenciales de Mathpix
  const appId = getCredentialByKey('mathpix_app_id');
  const apiKey = getCredentialByKey('mathpix_api_key');

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
          Para usar Mathpix OCR, necesitas configurar las siguientes credenciales:
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB según la documentación)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setResult(null);

      // Crear preview de la imagen
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Convertir imagen a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remover el prefijo "data:image/...;base64,"
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Hacer request a Mathpix API
      const response = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': appId,
          'app_key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: `data:image/${selectedFile.type.split('/')[1]};base64,${base64}`,
          formats: ['text', 'latex_styled', 'data'],
          data_options: {
            include_asciimath: true,
            include_latex: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data: MathpixResponse = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">📐</div>
        <h2 className="text-2xl font-semibold mb-2 text-blue-400">
          Mathpix OCR
        </h2>
        <p className="text-gray-300">
          Sube una imagen con contenido matemático para convertirlo a texto y LaTeX
        </p>
      </div>

      {/* Formulario de carga de imagen */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">📤 Subir Imagen</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seleccionar archivo de imagen
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-gray-400 mt-1">
              Formatos soportados: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
            </p>
          </div>

          {previewUrl && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Vista previa:</h4>
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-64 rounded-lg border border-gray-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isProcessing ? '🔄 Procesando...' : '🚀 Procesar Imagen'}
                </button>
                <button
                  onClick={handleClearFile}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <span className="font-medium">Error:</span>
          </div>
          <p className="mt-1">{error}</p>
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
    </div>
  );
};

export default MathpixOCR;
