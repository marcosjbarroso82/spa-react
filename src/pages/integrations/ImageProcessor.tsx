import React, { useState, useCallback } from 'react';
import { useCameraConfig } from '../../hooks/useCameraConfig';
import { useImageProcessing } from '../../hooks/useImageProcessing';
import { fileToDataUrl, ImageInfo } from '../../utils/imageUtils';
import ImageModal from '../../components/ImageModal';
import CameraCapture from '../../components/CameraCapture';
import ImageComparison from '../../components/ImageComparison';
import FileUpload from '../../components/FileUpload';
import ProcessingControls from '../../components/ProcessingControls';

const ImageProcessor: React.FC = () => {
  const {
    config: cameraConfig,
    updateQuality,
    updateProcessing,
    applyPreset,
    resetToDefault,
    presets
  } = useCameraConfig();

  const { processImage, isProcessing } = useImageProcessing();

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null);
  const [processedInfo, setProcessedInfo] = useState<ImageInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; title: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Función para obtener información de una imagen (usando utilidad)
  const getImageInfo = useCallback(async (dataUrl: string): Promise<ImageInfo> => {
    const { getImageInfo: getImageInfoUtil } = await import('../../utils/imageUtils');
    return getImageInfoUtil(dataUrl);
  }, []);

  // Función para manejar la subida de archivos
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0]; // Tomar solo el primer archivo
    const dataUrl = await fileToDataUrl(file);
    
    setOriginalImage(dataUrl);
    
    // Obtener información de la imagen original
    const info = await getImageInfo(dataUrl);
    setOriginalInfo(info);
    
    // Limpiar imagen procesada anterior
    setProcessedImage(null);
    setProcessedInfo(null);
    
    setMessage({ type: 'success', text: 'Imagen cargada correctamente. Haz clic en "Aplicar" para procesarla.' });
  }, [getImageInfo]);

  // Función para aplicar procesamiento con la configuración actual
  const applyProcessing = useCallback(async () => {
    if (!originalImage) return;
    
    try {
      const result = await processImage(originalImage);
      setProcessedImage(result.processedImage);
      setProcessedInfo(result.processedInfo);
      setMessage({ type: 'success', text: 'Imagen procesada con la configuración actual' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar la imagen' });
    }
  }, [originalImage, processImage]);

  // Función para abrir modal de imagen
  const openImageModal = (src: string, alt: string, title: string) => {
    setModalImage({ src, alt, title });
  };

  // Función para cerrar modal
  const closeImageModal = () => {
    setModalImage(null);
  };

  // Función para abrir cámara
  const openCamera = () => {
    setShowCamera(true);
  };

  // Función para cerrar cámara
  const closeCamera = () => {
    setShowCamera(false);
  };

  // Función para manejar imagen capturada
  const handleImageCaptured = useCallback(async (dataUrl: string) => {
    setOriginalImage(dataUrl);
    
    // Obtener información de la imagen capturada
    const info = await getImageInfo(dataUrl);
    setOriginalInfo(info);
    
    // Limpiar imagen procesada anterior
    setProcessedImage(null);
    setProcessedInfo(null);
    
    setMessage({ type: 'success', text: 'Imagen capturada correctamente. Haz clic en "Aplicar" para procesarla.' });
    setShowCamera(false);
  }, [getImageInfo]);

  // Función para limpiar todo
  const clearAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setOriginalInfo(null);
    setProcessedInfo(null);
    setMessage(null);
    setModalImage(null);
    setShowCamera(false);
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
              <div className="space-y-4">
                <FileUpload
                  onFileSelect={handleFileUpload}
                  accept="image/*"
                  multiple={false}
                  maxSize={10}
                  buttonText="Seleccionar Archivo"
                  icon="📁"
                />
                <ProcessingControls
                  onProcess={applyProcessing}
                  onClear={clearAll}
                  onCamera={openCamera}
                  isProcessing={isProcessing}
                  hasImage={!!originalImage}
                  processText="Aplicar"
                  clearText="Limpiar Todo"
                  cameraText="Usar Cámara"
                  showCamera={true}
                />
              </div>
              <div className="mt-3 text-sm text-gray-400">
                <p>💡 <strong>Opciones:</strong> Sube un archivo desde tu dispositivo o usa la cámara con las configuraciones actuales</p>
              </div>
            </div>
          </div>

          {/* Comparación de imágenes */}
          {originalImage && (
            <div className="mb-8">
              <ImageComparison
                originalImage={originalImage}
                processedImage={processedImage}
                originalInfo={originalInfo}
                processedInfo={processedInfo}
                onImageClick={(src, title) => openImageModal(src, title, title)}
                processing={isProcessing}
                showSizeReduction={true}
              />
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
                <p className="text-xs text-gray-400 mb-3">
                  💡 <strong>¿Qué hace?</strong> Aplica configuraciones predefinidas optimizadas para diferentes escenarios. 
                  <strong>¿Cuándo usar?</strong> Para obtener rápidamente configuraciones probadas para casos específicos.
                </p>
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
                <div className="text-xs text-gray-400 space-y-1">
                  <p><strong>📄 Documento:</strong> Para documentos físicos (papel, libros) - enfoque cercano, filtros optimizados</p>
                  <p><strong>📱 Pantalla:</strong> Para pantallas de computadora - filtros para texto pequeño, contraste alto</p>
                  <p><strong>📱 Móvil:</strong> Para dispositivos con poca memoria - calidad reducida, procesamiento ligero</p>
                </div>
              </div>

              {/* Información de Cámara */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-medium text-white mb-2">📷 Cámara Automática</h3>
                <p className="text-xs text-gray-400 mb-3">
                  ✅ <strong>Optimización automática:</strong> La cámara usa automáticamente la máxima resolución disponible de tu dispositivo. 
                  <strong>No necesitas configurar nada</strong> - la aplicación detecta y usa la mejor calidad posible.
                </p>
                <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-3">
                  <p className="text-sm text-green-300">
                    🚀 <strong>Beneficios:</strong> Máxima resolución, mejor calidad de imagen, mejor OCR, sin configuración manual.
                  </p>
                </div>
              </div>

              {/* Calidad */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Calidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Captura (0.1 - 1.0)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      ⚠️ <strong>Solo para cámara:</strong> Calidad de la imagen al capturar con la cámara. 
                      <strong>NO afecta</strong> imágenes subidas desde archivos.
                    </p>
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
                      {cameraConfig.quality.screenshotQuality.toFixed(2)} - {cameraConfig.quality.screenshotQuality < 0.5 ? 'Baja' : cameraConfig.quality.screenshotQuality < 0.8 ? 'Media' : 'Alta'}
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Optimización (0.1 - 1.0)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      ✅ <strong>Afecta procesamiento:</strong> Calidad de compresión JPEG al exportar la imagen procesada. 
                      <strong>Valores altos</strong> = mejor calidad, archivo más grande.
                    </p>
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
                      {cameraConfig.quality.optimizationQuality.toFixed(2)} - {cameraConfig.quality.optimizationQuality < 0.5 ? 'Baja' : cameraConfig.quality.optimizationQuality < 0.8 ? 'Media' : 'Alta'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros de procesamiento */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-medium text-white mb-2">🎨 Filtros de Procesamiento</h3>
                <p className="text-xs text-gray-400 mb-3">
                  ✅ <strong>Afecta procesamiento:</strong> Estos filtros se aplican a la imagen procesada para mejorar la legibilidad del texto. 
                  <strong>Valores recomendados:</strong> Contraste alto, brillo medio, saturación baja para OCR.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Contraste
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Aumenta la diferencia entre colores claros y oscuros.<br/>
                      <strong>¿Cuándo usar?</strong> Valores altos (1.5-2.0) mejoran la legibilidad del texto.
                    </p>
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
                      {cameraConfig.processing.filters.contrast.toFixed(1)} - {cameraConfig.processing.filters.contrast < 1.0 ? 'Bajo' : cameraConfig.processing.filters.contrast < 2.0 ? 'Medio' : 'Alto'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Brillo
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Ajusta la luminosidad general de la imagen.<br/>
                      <strong>¿Cuándo usar?</strong> Valores medios (1.0-1.3) compensan imágenes muy oscuras o claras.
                    </p>
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
                      {cameraConfig.processing.filters.brightness.toFixed(1)} - {cameraConfig.processing.filters.brightness < 0.8 ? 'Oscuro' : cameraConfig.processing.filters.brightness < 1.2 ? 'Normal' : 'Brillante'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Saturación
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Controla la intensidad de los colores.<br/>
                      <strong>¿Cuándo usar?</strong> Valores bajos (0.1-0.3) mejoran el OCR al reducir distracciones de color.
                    </p>
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
                      {cameraConfig.processing.filters.saturation.toFixed(1)} - {cameraConfig.processing.filters.saturation < 0.3 ? 'Baja' : cameraConfig.processing.filters.saturation < 0.8 ? 'Media' : 'Alta'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coeficientes de escala de grises */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-medium text-white mb-2">⚫ Escala de Grises</h3>
                <p className="text-xs text-gray-400 mb-3">
                  ✅ <strong>Afecta procesamiento:</strong> Convierte la imagen a escala de grises usando pesos personalizados para cada canal de color. 
                  <strong>¿Cuándo usar?</strong> Para mejorar el OCR, especialmente en pantallas donde el verde es más legible.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Rojo
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Controla cuánto contribuye el canal rojo al gris final.<br/>
                      <strong>Valor recomendado:</strong> 0.299 (estándar sRGB)
                    </p>
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
                      {cameraConfig.processing.grayscale.redWeight.toFixed(3)} - {cameraConfig.processing.grayscale.redWeight < 0.2 ? 'Bajo' : cameraConfig.processing.grayscale.redWeight < 0.4 ? 'Medio' : 'Alto'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Verde
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Controla cuánto contribuye el canal verde al gris final.<br/>
                      <strong>Valor recomendado:</strong> 0.587 (más peso para pantallas LCD/LED)
                    </p>
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
                      {cameraConfig.processing.grayscale.greenWeight.toFixed(3)} - {cameraConfig.processing.grayscale.greenWeight < 0.4 ? 'Bajo' : cameraConfig.processing.grayscale.greenWeight < 0.6 ? 'Medio' : 'Alto'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Peso Azul
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Controla cuánto contribuye el canal azul al gris final.<br/>
                      <strong>Valor recomendado:</strong> 0.114 (menor peso, menos legible en pantallas)
                    </p>
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
                      {cameraConfig.processing.grayscale.blueWeight.toFixed(3)} - {cameraConfig.processing.grayscale.blueWeight < 0.1 ? 'Bajo' : cameraConfig.processing.grayscale.blueWeight < 0.2 ? 'Medio' : 'Alto'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                  <p className="text-xs text-gray-300">
                    <strong>💡 Tip:</strong> Los pesos deben sumar aproximadamente 1.0. Para pantallas, aumenta el verde y reduce el azul. 
                    Para documentos impresos, usa los valores estándar (0.299, 0.587, 0.114).
                  </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2">🖼️ Procesamiento de Imagen</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• <strong>Verde:</strong> Parámetros que SÍ afectan el procesamiento</li>
                  <li>• <strong>Amarillo:</strong> Parámetros solo para cámara (NO afectan archivos subidos)</li>
                  <li>• <strong>Nuevo flujo:</strong> Sube → Ajusta → Aplica → Compara</li>
                  <li>• Puedes modificar y re-aplicar para ver cambios en tiempo real</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2">⚙️ Configuración</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Los parámetros se guardan automáticamente en localStorage</li>
                  <li>• Se sincronizan con la página de configuración</li>
                  <li>• Los metadatos muestran dimensiones y tamaño de archivo</li>
                  <li>• Usa presets para configuraciones probadas</li>
                </ul>
              </div>
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

      {/* Cámara */}
      {showCamera && (
        <CameraCapture
          onImageCapture={handleImageCaptured}
          onClose={closeCamera}
        />
      )}
    </div>
  );
};

export default ImageProcessor;
