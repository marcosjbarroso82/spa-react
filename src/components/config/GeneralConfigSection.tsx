import React from 'react';
import { usePreferences } from '../../hooks/usePreferences';

interface GeneralConfigSectionProps {
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

const GeneralConfigSection: React.FC<GeneralConfigSectionProps> = ({ message, setMessage }) => {
  const {
    preferences,
    updatePreference,
    resetPreferences
  } = usePreferences();

  const handlePreferenceChange = (key: 'imageInputMode' | 'autoRead' | 'debug' | 'allowImageUpload' | 'allowCameraCapture', value: any) => {
    updatePreference(key, value);
    setMessage({ type: 'success', text: 'Configuración actualizada' });
  };

  const handleResetPreferences = () => {
    resetPreferences();
    setMessage({ type: 'success', text: 'Configuración restablecida a valores por defecto' });
  };

  return (
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

        {/* Sección de Permisos de Funcionalidades */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">🔒 Permisos de Funcionalidades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Permitir Subir Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Permitir Subir Imagen
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.allowImageUpload}
                    onChange={(e) => handlePreferenceChange('allowImageUpload', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">📁 Habilitar carga de archivos</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">Permite a los usuarios cargar imágenes desde archivos</p>
            </div>

            {/* Permitir Toma Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Permitir Toma Foto
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.allowCameraCapture}
                    onChange={(e) => handlePreferenceChange('allowCameraCapture', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">📷 Habilitar captura con cámara</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">Permite a los usuarios tomar fotos con la cámara</p>
            </div>
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
  );
};

export default GeneralConfigSection;
