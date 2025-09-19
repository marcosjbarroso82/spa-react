import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';
import { useVariables } from '../hooks/useVariables';
import { usePreferences } from '../hooks/usePreferences';
import { useCameraConfig } from '../hooks/useCameraConfig';

const Config: React.FC = () => {
  const { 
    credentials, 
    isLoading, 
    saveCredentials, 
    clearCredentials, 
    addCredential, 
    removeCredential, 
    updateCredential
  } = useCredentials();
  
  const {
    variables,
    isLoading: variablesLoading,
    saveVariables,
    addVariable,
    updateVariable,
    removeVariable,
    clearVariables
  } = useVariables();
  
  const {
    preferences,
    isLoading: preferencesLoading,
    updatePreference,
    resetPreferences
  } = usePreferences();
  
  const {
    config: cameraConfig,
    isLoading: cameraConfigLoading,
    updateQuality,
    updateFocus,
    updateProcessing,
    applyPreset,
    resetToDefault: resetCameraConfig,
    presets
  } = useCameraConfig();
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica - al menos una credencial debe tener clave y valor
    const validItems = credentials.items.filter(item => item.key.trim() && item.value.trim());
    
    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Debe agregar al menos una credencial con clave y valor' });
      return;
    }

    // Verificar claves duplicadas
    const keys = validItems.map(item => item.key.toLowerCase());
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      setMessage({ type: 'error', text: 'No puede haber claves duplicadas' });
      return;
    }

    try {
      saveCredentials(credentials);
      setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar las credenciales' });
    }
  };

  const handleVariablesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica - al menos una variable debe tener clave y valor
    const validItems = variables.items.filter(item => item.key.trim() && item.value.trim());
    
    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Debe agregar al menos una variable con clave y valor' });
      return;
    }

    // Verificar claves duplicadas
    const keys = validItems.map(item => item.key.toLowerCase());
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      setMessage({ type: 'error', text: 'No puede haber claves duplicadas en las variables' });
      return;
    }

    try {
      saveVariables(variables);
      setMessage({ type: 'success', text: 'Variables guardadas correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar las variables' });
    }
  };

  const handleClear = () => {
    clearCredentials();
    setMessage({ type: 'success', text: 'Credenciales eliminadas' });
  };

  const handleVariablesClear = () => {
    clearVariables();
    setMessage({ type: 'success', text: 'Variables eliminadas' });
  };

  const handleAddCredential = () => {
    addCredential();
    setMessage(null);
  };

  const handleRemoveCredential = (id: string) => {
    removeCredential(id);
    setMessage(null);
  };

  const handlePreferenceChange = (key: 'imageInputMode' | 'autoRead' | 'debug', value: any) => {
    updatePreference(key, value);
    setMessage({ type: 'success', text: 'Configuración actualizada' });
  };

  const handleResetPreferences = () => {
    resetPreferences();
    setMessage({ type: 'success', text: 'Configuración restablecida a valores por defecto' });
  };

  if (isLoading || variablesLoading || preferencesLoading || cameraConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🔐 Configuración de Credenciales
          </h1>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {message.text}
            </div>
          )}

          {/* Sección de Configuración de Cámara */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">📷 Configuración de Cámara</h2>
            <div className="bg-gray-700 rounded-lg p-4 space-y-6">
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

              {/* Información de Cámara Automática */}
              <div>
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
                <h3 className="text-lg font-medium text-white mb-2">🎯 Calidad</h3>
                <p className="text-xs text-gray-400 mb-3">
                  💡 <strong>¿Qué hace?</strong> Controla la calidad de captura y optimización de imágenes. 
                  <strong>¿Cuándo usar?</strong> Calidad alta para texto pequeño, baja para ahorrar espacio.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Captura (0.1 - 1.0)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Calidad de la imagen al capturar con la cámara.<br/>
                      <strong>¿Cuándo usar?</strong> Valores altos (0.8-1.0) para texto pequeño, bajos (0.5-0.7) para ahorrar memoria.
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
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calidad de Optimización (0.1 - 1.0)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Calidad de compresión JPEG al exportar imágenes procesadas.<br/>
                      <strong>¿Cuándo usar?</strong> Valores altos (0.8-1.0) para mejor calidad, bajos (0.5-0.7) para archivos más pequeños.
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

              {/* Enfoque */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">🎯 Enfoque de Cámara</h3>
                <p className="text-xs text-gray-400 mb-3">
                  💡 <strong>¿Qué hace?</strong> Configura el enfoque automático de la cámara para diferentes distancias. 
                  <strong>¿Cuándo usar?</strong> Distancias cortas para documentos, largas para pantallas.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Distancia de Enfoque (metros)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Distancia ideal para el enfoque automático.<br/>
                      <strong>¿Cuándo usar?</strong> 0.2m para documentos, 0.4m para pantallas, 0.6m para objetos lejanos.
                    </p>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={cameraConfig.focus.distance}
                      onChange={(e) => updateFocus({ distance: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {cameraConfig.focus.distance}m ({(cameraConfig.focus.distance * 100).toFixed(0)}cm) - {cameraConfig.focus.distance < 0.3 ? 'Cerca' : cameraConfig.focus.distance < 0.6 ? 'Media' : 'Lejos'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tiempo de Estabilización (ms)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      <strong>¿Qué hace?</strong> Tiempo de espera para que la cámara se estabilice antes de capturar.<br/>
                      <strong>¿Cuándo usar?</strong> Valores altos (1500-2000ms) para mejor estabilidad, bajos (500-1000ms) para captura rápida.
                    </p>
                    <input
                      type="number"
                      value={cameraConfig.focus.stabilizationTime}
                      onChange={(e) => updateFocus({ stabilizationTime: parseInt(e.target.value) || 1000 })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500"
                      min="500"
                      max="3000"
                    />
                  </div>
                </div>
              </div>

              {/* Procesamiento */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">🎨 Procesamiento de Imagen</h3>
                <p className="text-xs text-gray-400 mb-3">
                  💡 <strong>¿Qué hace?</strong> Aplica filtros a las imágenes procesadas para mejorar la legibilidad del texto. 
                  <strong>¿Cuándo usar?</strong> Contraste alto y saturación baja para mejor OCR.
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

              <div className="pt-2">
                <button
                  onClick={() => {
                    resetCameraConfig();
                    setMessage({ type: 'success', text: 'Configuración de cámara restablecida' });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  🔄 Restablecer Configuración de Cámara
                </button>
              </div>
            </div>
          </div>

          {/* Sección de Configuración */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">⚙️ Configuración General</h2>
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Modo de entrada de imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modo de entrada de imagen
                  </label>
                  <select
                    value={preferences.imageInputMode}
                    onChange={(e) => handlePreferenceChange('imageInputMode', e.target.value as 'file' | 'camera')}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="file">📁 Cargar archivo de imagen</option>
                    <option value="camera">📷 Tomar foto con cámara</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Selecciona el modo predeterminado para ingresar imágenes</p>
                </div>

                {/* Lectura automática */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lectura automática
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferences.autoRead}
                        onChange={(e) => handlePreferenceChange('autoRead', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300">🔊 Activar lectura automática</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Lee automáticamente las respuestas con síntesis de voz</p>
                </div>

                {/* Modo Debug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modo Debug
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferences.debug}
                        onChange={(e) => handlePreferenceChange('debug', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300">🐛 Activar modo debug</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Muestra información técnica y de desarrollo</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetPreferences}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  🔄 Restablecer Configuración
                </button>
              </div>
            </div>
          </div>

          {/* Sección de Variables */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">🔧 Variables de Configuración</h2>
            <form onSubmit={handleVariablesSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Variables</h3>
                <button
                  type="button"
                  onClick={addVariable}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  ➕ Agregar Variable
                </button>
              </div>

              {variables.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay variables configuradas</p>
                  <p className="text-sm">Haz clic en "Agregar Variable" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variables.items.map((item, index) => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Clave
                            </label>
                            <input
                              type="text"
                              value={item.key}
                              onChange={(e) => updateVariable(item.id, 'key', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Ej: ANALIZA_ENUNCIADO_URL, RAG_CON_RESPUESTAS_URL, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Valor
                            </label>
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => updateVariable(item.id, 'value', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="URL o valor de la variable"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariable(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
                          title="Eliminar variable"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  💾 Guardar Variables
                </button>
                <button
                  type="button"
                  onClick={handleVariablesClear}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🗑️ Limpiar Variables
                </button>
              </div>
            </form>
          </div>

          {/* Sección de Credenciales */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">🔐 Credenciales</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Credenciales</h3>
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  ➕ Agregar Credencial
                </button>
              </div>

              {credentials.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay credenciales configuradas</p>
                  <p className="text-sm">Haz clic en "Agregar Credencial" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.items.map((item, index) => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Clave
                            </label>
                            <input
                              type="text"
                              value={item.key}
                              onChange={(e) => updateCredential(item.id, 'key', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Ej: API_KEY, USERNAME, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Valor
                            </label>
                            <input
                              type="password"
                              value={item.value}
                              onChange={(e) => updateCredential(item.id, 'value', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Valor de la credencial"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCredential(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
                          title="Eliminar credencial"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  💾 Guardar Credenciales
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🗑️ Limpiar Credenciales
                </button>
              </div>
            </form>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">ℹ️ Información</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-1">Cámara</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Resolución automática máxima</li>
                  <li>• Configuraciones de enfoque</li>
                  <li>• Filtros de procesamiento</li>
                  <li>• Presets para diferentes escenarios</li>
                  <li>• Se guarda en localStorage</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-1">Configuración</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Modo de entrada predeterminado</li>
                  <li>• Lectura automática de respuestas</li>
                  <li>• Modo debug para desarrolladores</li>
                  <li>• Se guarda en localStorage</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-1">Variables</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Configura URLs de Flowise</li>
                  <li>• Claves: ANALIZA_ENUNCIADO_URL, RAG_CON_RESPUESTAS_URL, HERRAMIENTAS_CON_RESPUESTAS_URL</li>
                  <li>• Se guardan en localStorage</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-1">Credenciales</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Agrega tantas credenciales como necesites</li>
                  <li>• Las claves deben ser únicas (no duplicadas)</li>
                  <li>• Los valores se ocultan por seguridad</li>
                  <li>• Se guardan en localStorage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;
