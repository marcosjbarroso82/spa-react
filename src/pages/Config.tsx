import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';
import { useVariables } from '../hooks/useVariables';
import { usePreferences } from '../hooks/usePreferences';
import { useCameraConfig } from '../hooks/useCameraConfig';
import CameraConfigSection from '../components/config/CameraConfigSection';
import GeneralConfigSection from '../components/config/GeneralConfigSection';
import VariablesConfigSection from '../components/config/VariablesConfigSection';
import CredentialsConfigSection from '../components/config/CredentialsConfigSection';

const Config: React.FC = () => {
  const { isLoading } = useCredentials();
  const { isLoading: variablesLoading } = useVariables();
  const { isLoading: preferencesLoading } = usePreferences();
  const { isLoading: cameraConfigLoading } = useCameraConfig();
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (isLoading || variablesLoading || preferencesLoading || cameraConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            ⚙️ Configuración del Sistema
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
          <CameraConfigSection message={message} setMessage={setMessage} />

          {/* Sección de Configuración General */}
          <GeneralConfigSection message={message} setMessage={setMessage} />

          {/* Sección de Variables */}
          <VariablesConfigSection message={message} setMessage={setMessage} />

          {/* Sección de Credenciales */}
          <CredentialsConfigSection message={message} setMessage={setMessage} />

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
                  <li>• Permisos de funcionalidades</li>
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