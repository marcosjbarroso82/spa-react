import React from 'react';
import { useCameraConfig } from '../../hooks/useCameraConfig';

interface CameraConfigSectionProps {
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

const CameraConfigSection: React.FC<CameraConfigSectionProps> = ({ message, setMessage }) => {
  const {
    config: cameraConfig,
    updateField,
    resetToPreset
  } = useCameraConfig();

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">📷 Configuración de Cámara</h2>
      <div className="bg-gray-700 rounded-lg p-6 space-y-6">
        
        {/* Botones de Reset por Perfil Completo */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">🔄 Perfiles Predefinidos</h3>
          <p className="text-sm text-gray-300 mb-4">
            Selecciona un perfil completo para resetear toda la configuración a valores optimizados:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                resetToPreset('document');
                setMessage({ type: 'success', text: 'Perfil "Document" aplicado - Optimizado para documentos físicos' });
              }}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <span className="text-lg">📄</span>
              <span className="font-medium">Document</span>
              <span className="text-xs opacity-80">Documentos físicos</span>
            </button>
            
            <button
              onClick={() => {
                resetToPreset('screen');
                setMessage({ type: 'success', text: 'Perfil "Screen" aplicado - Optimizado para pantallas de notebook' });
              }}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <span className="text-lg">💻</span>
              <span className="font-medium">Screen</span>
              <span className="text-xs opacity-80">Pantallas notebook</span>
            </button>
            
            <button
              onClick={() => {
                resetToPreset('mobile');
                setMessage({ type: 'success', text: 'Perfil "Mobile" aplicado - Optimizado para dispositivos móviles' });
              }}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <span className="text-lg">📱</span>
              <span className="font-medium">Mobile</span>
              <span className="text-xs opacity-80">Dispositivos móviles</span>
            </button>
            
            <button
              onClick={() => {
                resetToPreset('default');
                setMessage({ type: 'success', text: 'Perfil "Default" aplicado - Configuración base por defecto' });
              }}
              className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors duration-200 flex flex-col items-center gap-1"
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Default</span>
              <span className="text-xs opacity-80">Configuración base</span>
            </button>
          </div>
        </div>

        {/* Formulario de Edición del Perfil Activo */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">✏️ Editar Perfil Activo</h3>
          <p className="text-sm text-gray-300 mb-4">
            Modifica los valores del perfil actual. Los cambios se guardan automáticamente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Resolución */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-blue-300">📐 Resolución</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Ancho (px)
                  </label>
                  <input
                    type="number"
                    value={cameraConfig.resolution.width}
                    onChange={(e) => updateField('resolution.width', parseInt(e.target.value) || 1280)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    min="320"
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
                    onChange={(e) => updateField('resolution.height', parseInt(e.target.value) || 720)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    min="240"
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
                    onChange={(e) => updateField('resolution.frameRate', parseInt(e.target.value) || 24)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="60"
                  />
                </div>
              </div>
            </div>

            {/* Calidad */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-green-300">🎯 Calidad</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Calidad Screenshot (0.1 - 1.0)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={cameraConfig.quality.screenshotQuality}
                    onChange={(e) => updateField('quality.screenshotQuality', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.quality.screenshotQuality.toFixed(2)} - {cameraConfig.quality.screenshotQuality < 0.5 ? 'Baja' : cameraConfig.quality.screenshotQuality < 0.8 ? 'Media' : 'Alta'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Calidad Optimización (0.1 - 1.0)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={cameraConfig.quality.optimizationQuality}
                    onChange={(e) => updateField('quality.optimizationQuality', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.quality.optimizationQuality.toFixed(2)} - {cameraConfig.quality.optimizationQuality < 0.5 ? 'Baja' : cameraConfig.quality.optimizationQuality < 0.8 ? 'Media' : 'Alta'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Ancho Máximo (px)
                  </label>
                  <input
                    type="number"
                    value={cameraConfig.quality.maxWidth}
                    onChange={(e) => updateField('quality.maxWidth', parseInt(e.target.value) || 2560)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    min="320"
                    max="4096"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Alto Máximo (px)
                  </label>
                  <input
                    type="number"
                    value={cameraConfig.quality.maxHeight}
                    onChange={(e) => updateField('quality.maxHeight', parseInt(e.target.value) || 1440)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                    min="240"
                    max="2160"
                  />
                </div>
              </div>
            </div>

            {/* Enfoque */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-yellow-300">🎯 Enfoque</h4>
              <div className="space-y-4">
                
                {/* Modo de Enfoque */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modo de Enfoque
                  </label>
                  <select
                    value={cameraConfig.focus.focusMode}
                    onChange={(e) => updateField('focus.focusMode', e.target.value as 'continuous' | 'single-shot' | 'manual')}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single-shot">📸 Single-shot (Recomendado para OCR)</option>
                    <option value="continuous">🔄 Continuous (Para video dinámico)</option>
                    <option value="manual">✋ Manual (Control total)</option>
                  </select>
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.focus.focusMode === 'single-shot' && 'Enfoca una vez y mantiene fijo - Ideal para OCR de pantallas'}
                    {cameraConfig.focus.focusMode === 'continuous' && 'Enfoque automático continuo - Consume más batería'}
                    {cameraConfig.focus.focusMode === 'manual' && 'Control manual del enfoque - Requiere ajuste manual'}
                  </div>
                </div>

                {/* Opciones de Enfoque */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={cameraConfig.focus.useContinuousFocus}
                        onChange={(e) => updateField('focus.useContinuousFocus', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300">🔄 Usar enfoque continuo durante preview</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-400">
                    Solo aplica si el modo es 'continuous'. Mantiene el enfoque automático mientras ves la imagen.
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={cameraConfig.focus.autoFocusBeforeCapture}
                        onChange={(e) => updateField('focus.autoFocusBeforeCapture', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300">🎯 Enfocar automáticamente antes de capturar</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-400">
                    Aplica enfoque automático justo antes de tomar la foto para máxima nitidez.
                  </div>
                </div>

                {/* Distancia y Estabilización */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Distancia (metros)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={cameraConfig.focus.distance}
                      onChange={(e) => updateField('focus.distance', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.focus.distance}m ({(cameraConfig.focus.distance * 100).toFixed(0)}cm) - {cameraConfig.focus.distance < 0.3 ? 'Cerca' : cameraConfig.focus.distance < 0.6 ? 'Media' : 'Lejos'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tiempo Estabilización (ms)
                    </label>
                    <input
                      type="number"
                      value={cameraConfig.focus.stabilizationTime}
                      onChange={(e) => updateField('focus.stabilizationTime', parseInt(e.target.value) || 1000)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                      min="500"
                      max="3000"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Procesamiento */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">🔧 Procesamiento</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contraste (0.5 - 3.0)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={cameraConfig.processing.filters.contrast}
                    onChange={(e) => updateField('processing.filters.contrast', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.processing.filters.contrast.toFixed(1)} - {cameraConfig.processing.filters.contrast < 1.0 ? 'Bajo' : cameraConfig.processing.filters.contrast < 2.0 ? 'Medio' : 'Alto'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Brillo (0.5 - 2.0)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={cameraConfig.processing.filters.brightness}
                    onChange={(e) => updateField('processing.filters.brightness', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.processing.filters.brightness.toFixed(1)} - {cameraConfig.processing.filters.brightness < 0.8 ? 'Oscuro' : cameraConfig.processing.filters.brightness < 1.2 ? 'Normal' : 'Brillante'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Saturación (0.0 - 2.0)
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={cameraConfig.processing.filters.saturation}
                    onChange={(e) => updateField('processing.filters.saturation', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {cameraConfig.processing.filters.saturation.toFixed(1)} - {cameraConfig.processing.filters.saturation < 0.3 ? 'Baja' : cameraConfig.processing.filters.saturation < 0.8 ? 'Media' : 'Alta'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Información de la Cámara para OCR de Pantallas */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">📊 Información de la Cámara</h3>
          <p className="text-sm text-gray-300 mb-4">
            Información relevante para optimizar la captura de pantallas de notebook para OCR:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Capacidades Técnicas */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-cyan-300">🔧 Capacidades Técnicas</h4>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Resolución máxima:</span>
                  <span className="text-sm text-white font-mono">3840×2160</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Frame rates:</span>
                  <span className="text-sm text-white font-mono">15-60 fps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Enfoque mínimo:</span>
                  <span className="text-sm text-white font-mono">0.1m (10cm)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Estabilización:</span>
                  <span className="text-sm text-white font-mono">Digital</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Formato nativo:</span>
                  <span className="text-sm text-white font-mono">JPEG/PNG</span>
                </div>
              </div>
            </div>

            {/* Configuración Actual */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-amber-300">⚙️ Configuración Actual</h4>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Resolución configurada:</span>
                  <span className="text-sm text-white font-mono">{cameraConfig.resolution.width}×{cameraConfig.resolution.height}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Calidad screenshot:</span>
                  <span className="text-sm text-white font-mono">{(cameraConfig.quality.screenshotQuality * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Modo de enfoque:</span>
                  <span className="text-sm text-white font-mono">
                    {cameraConfig.focus.focusMode === 'single-shot' ? '📸 Single-shot' : 
                     cameraConfig.focus.focusMode === 'continuous' ? '🔄 Continuous' : '✋ Manual'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Enfoque continuo:</span>
                  <span className="text-sm text-white font-mono">
                    {cameraConfig.focus.useContinuousFocus ? '✅ Activado' : '❌ Desactivado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Auto-enfoque captura:</span>
                  <span className="text-sm text-white font-mono">
                    {cameraConfig.focus.autoFocusBeforeCapture ? '✅ Activado' : '❌ Desactivado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Distancia enfoque:</span>
                  <span className="text-sm text-white font-mono">{cameraConfig.focus.distance}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Tiempo estabilización:</span>
                  <span className="text-sm text-white font-mono">{cameraConfig.focus.stabilizationTime}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Contraste:</span>
                  <span className="text-sm text-white font-mono">{cameraConfig.processing.filters.contrast.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            {/* Recomendaciones para OCR */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-green-300">💡 Recomendaciones para OCR</h4>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Modo de enfoque:</strong> Usa 'Single-shot' para OCR - evita el "hunting" del enfoque continuo
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Para texto pequeño:</strong> Usa resolución alta (2560×1440+) y contraste alto (1.5x+)
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Para pantallas brillantes:</strong> Reduce brillo (0.8-1.0) y aumenta contraste
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Para estabilidad:</strong> Usa tiempo de estabilización alto (1500ms+) y distancia 0.3-0.4m
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Para mejor OCR:</strong> Saturación baja (0.1-0.3) y calidad alta (0.8+)
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-sm">✅</span>
                  <div className="text-sm text-gray-300">
                    <strong>Enfoque continuo:</strong> Desactívalo para OCR - ahorra batería y evita reajustes
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">📈 Rendimiento Estimado</h4>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Tamaño de archivo:</span>
                  <span className="text-sm text-white font-mono">
                    {Math.round((cameraConfig.resolution.width * cameraConfig.resolution.height * cameraConfig.quality.screenshotQuality * 0.1) / 1000)}KB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Tiempo de captura:</span>
                  <span className="text-sm text-white font-mono">
                    {cameraConfig.focus.stabilizationTime + 200}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Calidad OCR estimada:</span>
                  <span className="text-sm text-white font-mono">
                    {cameraConfig.resolution.width >= 2560 && cameraConfig.processing.filters.contrast >= 1.5 ? 'Alta' : 
                     cameraConfig.resolution.width >= 1920 && cameraConfig.processing.filters.contrast >= 1.2 ? 'Media' : 'Baja'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Uso de memoria:</span>
                  <span className="text-sm text-white font-mono">
                    {Math.round((cameraConfig.resolution.width * cameraConfig.resolution.height * 4) / 1024 / 1024)}MB
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Consejos Prácticos */}
          <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-300 mb-3">🎯 Consejos para Mejor OCR de Pantallas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <strong>📱 Posicionamiento:</strong>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Mantén la cámara a 30-40cm de la pantalla</li>
                  <li>• Evita ángulos muy pronunciados</li>
                  <li>• Asegúrate de que toda la pantalla esté en el encuadre</li>
                </ul>
              </div>
              <div>
                <strong>💡 Iluminación:</strong>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Evita reflejos directos en la pantalla</li>
                  <li>• Usa iluminación uniforme de fondo</li>
                  <li>• Ajusta el brillo de la pantalla si es necesario</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CameraConfigSection;
