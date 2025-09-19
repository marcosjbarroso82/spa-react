import React, { useState, useCallback, useRef } from 'react';
import { useCameraConfig } from '../../hooks/useCameraConfig';
import ImageModal from '../../components/ImageModal';

interface ImageInfo {
  size: string;
  dimensions: string;
  format: string;
  fileSize: number;
  width: number;
  height: number;
}

const ImageProcessor: React.FC = () => {
  const {
    config: cameraConfig,
    updateResolution,
    updateQuality,
    updateProcessing,
    applyPreset,
    resetToDefault,
    presets
  } = useCameraConfig();

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null);
  const [processedInfo, setProcessedInfo] = useState<ImageInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; title: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para obtener información de una imagen
  const getImageInfo = useCallback(async (dataUrl: string): Promise<ImageInfo> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Calcular tamaño del archivo en bytes
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const fileSize = Math.round((base64Length * 3) / 4);
        
        resolve({
          size: formatFileSize(fileSize),
          dimensions: `${img.width} x ${img.height}`,
          format: dataUrl.split(';')[0].split(':')[1] || 'unknown',
          fileSize,
          width: img.width,
          height: img.height
        });
      };
      img.src = dataUrl;
    });
  }, []);

  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para optimizar imagen usando la configuración actual
  const optimizeImage = useCallback((dataUrl: string): Promise<string> => {
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

        // Redimensionar si es necesario según la configuración
        const maxWidth = cameraConfig.quality.maxWidth;
        const maxHeight = cameraConfig.quality.maxHeight;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Configuraciones de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Aplicar filtros de procesamiento
        ctx.filter = `contrast(${cameraConfig.processing.filters.contrast}) brightness(${cameraConfig.processing.filters.brightness}) saturate(${cameraConfig.processing.filters.saturation})`;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a escala de grises si está configurado
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Aplicar conversión a escala de grises
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(
            data[i] * cameraConfig.processing.grayscale.redWeight +
            data[i + 1] * cameraConfig.processing.grayscale.greenWeight +
            data[i + 2] * cameraConfig.processing.grayscale.blueWeight
          );
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha se mantiene igual
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Exportar con la calidad configurada
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', cameraConfig.quality.optimizationQuality);
        resolve(optimizedDataUrl);
      };
      img.src = dataUrl;
    });
  }, [cameraConfig]);

  // Función para manejar la subida de archivos
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen válido' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      
      // Obtener información de la imagen original
      const info = await getImageInfo(dataUrl);
      setOriginalInfo(info);
      
      // Procesar imagen
      setIsProcessing(true);
      try {
        const processed = await optimizeImage(dataUrl);
        setProcessedImage(processed);
        
        const processedInfo = await getImageInfo(processed);
        setProcessedInfo(processedInfo);
        
        setMessage({ type: 'success', text: 'Imagen procesada correctamente' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al procesar la imagen' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [optimizeImage, getImageInfo]);

  // Función para reprocesar con nuevos parámetros
  const reprocessImage = useCallback(async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    try {
      const processed = await optimizeImage(originalImage);
      setProcessedImage(processed);
      
      const processedInfo = await getImageInfo(processed);
      setProcessedInfo(processedInfo);
      
      setMessage({ type: 'success', text: 'Imagen reprocesada con nuevos parámetros' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al reprocesar la imagen' });
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, optimizeImage, getImageInfo]);

  // Función para abrir modal de imagen
  const openImageModal = (src: string, alt: string, title: string) => {
    setModalImage({ src, alt, title });
  };

  // Función para cerrar modal
  const closeImageModal = () => {
    setModalImage(null);
  };

  // Función para limpiar todo
  const clearAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setOriginalInfo(null);
    setProcessedInfo(null);
    setMessage(null);
    setModalImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🖼️ Procesador de Imágenes para OCR
          </h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {message.text}
            </div>
          )}

          {/* Controles de subida */}
          <div className="mb-8">
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">📁 Subir Imagen</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  📷 Seleccionar Imagen
                </button>
                {originalImage && (
                  <button
                    onClick={reprocessImage}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {isProcessing ? '⏳ Procesando...' : '🔄 Reprocesar'}
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  🗑️ Limpiar Todo
                </button>
              </div>
            </div>
          </div>

          {/* Comparación de imágenes */}
          {originalImage && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">🖼️ Comparación de Imágenes</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen original */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Imagen Original</h3>
                  <div className="relative">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => openImageModal(originalImage, 'Imagen Original', 'Imagen Original')}
                      title="Haz clic para ampliar"
                    />
                  </div>
                  {originalInfo && (
                    <div className="mt-3 text-sm text-gray-300">
                      <p><strong>Dimensiones:</strong> {originalInfo.dimensions}</p>
                      <p><strong>Tamaño:</strong> {originalInfo.size}</p>
                      <p><strong>Formato:</strong> {originalInfo.format}</p>
                    </div>
                  )}
                </div>

                {/* Imagen procesada */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Imagen Procesada</h3>
                  <div className="relative">
                    {isProcessing ? (
                      <div className="w-full h-64 bg-gray-600 rounded-lg flex items-center justify-center">
                        <div className="text-white text-lg">⏳ Procesando...</div>
                      </div>
                    ) : processedImage ? (
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                        onClick={() => openImageModal(processedImage, 'Imagen Procesada', 'Imagen Procesada')}
                        title="Haz clic para ampliar"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-600 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-lg">No procesada</div>
                      </div>
                    )}
                  </div>
                  {processedInfo && (
                    <div className="mt-3 text-sm text-gray-300">
                      <p><strong>Dimensiones:</strong> {processedInfo.dimensions}</p>
                      <p><strong>Tamaño:</strong> {processedInfo.size}</p>
                      <p><strong>Formato:</strong> {processedInfo.format}</p>
                      {originalInfo && (
                        <p><strong>Reducción:</strong> {((1 - processedInfo.fileSize / originalInfo.fileSize) * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controles de parámetros */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">⚙️ Parámetros de Procesamiento</h2>
            <div className="bg-gray-700 rounded-lg p-6 space-y-6">
              
              {/* Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preset de Configuración
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        applyPreset(preset);
                        setMessage({ type: 'success', text: `Preset '${preset}' aplicado` });
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      {preset === 'screen' ? '📱 Pantalla' : 
                       preset === 'document' ? '📄 Documento' : 
                       preset === 'mobile' ? '📱 Móvil' : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolución */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Resolución</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Ancho (px)
                    </label>
                    <input
                      type="number"
                      value={cameraConfig.resolution.width}
                      onChange={(e) => updateResolution({ width: parseInt(e.target.value) || 1920 })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                      min="640"
                      max="4096"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Alto (px)
                    </label>
                    <input
                      type="number"
                      value={cameraConfig.resolution.height}
                      onChange={(e) => updateResolution({ height: parseInt(e.target.value) || 1080 })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                      min="480"
                      max="2160"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Frame Rate (fps)
                    </label>
                    <input
                      type="number"
                      value={cameraConfig.resolution.frameRate}
                      onChange={(e) => updateResolution({ frameRate: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Aspect Ratio
                    </label>
                    <select
                      value={cameraConfig.resolution.aspectRatio}
                      onChange={(e) => updateResolution({ aspectRatio: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={16/9}>16:9 (Widescreen)</option>
                      <option value={4/3}>4:3 (Estándar)</option>
                      <option value={1}>1:1 (Cuadrado)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Calidad */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Calidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Captura (0.1 - 1.0)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={cameraConfig.quality.screenshotQuality}
                      onChange={(e) => updateQuality({ screenshotQuality: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.quality.screenshotQuality.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Optimización (0.1 - 1.0)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={cameraConfig.quality.optimizationQuality}
                      onChange={(e) => updateQuality({ optimizationQuality: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.quality.optimizationQuality.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros de procesamiento */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Filtros de Procesamiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Contraste
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={cameraConfig.processing.filters.contrast}
                      onChange={(e) => updateProcessing({ 
                        filters: { ...cameraConfig.processing.filters, contrast: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.filters.contrast.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Brillo
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={cameraConfig.processing.filters.brightness}
                      onChange={(e) => updateProcessing({ 
                        filters: { ...cameraConfig.processing.filters, brightness: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.filters.brightness.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Saturación
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.1"
                      value={cameraConfig.processing.filters.saturation}
                      onChange={(e) => updateProcessing({ 
                        filters: { ...cameraConfig.processing.filters, saturation: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.filters.saturation.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coeficientes de escala de grises */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Escala de Grises</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Rojo
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.001"
                      value={cameraConfig.processing.grayscale.redWeight}
                      onChange={(e) => updateProcessing({ 
                        grayscale: { ...cameraConfig.processing.grayscale, redWeight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.grayscale.redWeight.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Verde
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.001"
                      value={cameraConfig.processing.grayscale.greenWeight}
                      onChange={(e) => updateProcessing({ 
                        grayscale: { ...cameraConfig.processing.grayscale, greenWeight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.grayscale.greenWeight.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Azul
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.001"
                      value={cameraConfig.processing.grayscale.blueWeight}
                      onChange={(e) => updateProcessing({ 
                        grayscale: { ...cameraConfig.processing.grayscale, blueWeight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.processing.grayscale.blueWeight.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    resetToDefault();
                    setMessage({ type: 'success', text: 'Configuración restablecida a valores por defecto' });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  🔄 Restablecer Configuración
                </button>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">ℹ️ Información</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Esta herramienta te permite probar diferentes parámetros de procesamiento de imágenes para optimizar el OCR</p>
              <p>• Los parámetros se guardan automáticamente en localStorage y se sincronizan con la página de configuración</p>
              <p>• Puedes comparar la imagen original con la procesada para evaluar la efectividad de los ajustes</p>
              <p>• Los metadatos muestran el tamaño de archivo y las dimensiones de ambas imágenes</p>
            </div>
          </div>
        </div>
      </div>

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

export default ImageProcessor;
