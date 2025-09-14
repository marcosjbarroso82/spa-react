import React, { useState } from 'react';
import { useCredentials } from '../hooks/useCredentials';

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

  const handleClear = () => {
    clearCredentials();
    setMessage({ type: 'success', text: 'Credenciales eliminadas' });
  };

  const handleAddCredential = () => {
    addCredential();
    setMessage(null);
  };

  const handleRemoveCredential = (id: string) => {
    removeCredential(id);
    setMessage(null);
  };

  if (isLoading) {
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lista de credenciales */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white">Credenciales</h2>
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  ➕ Agregar
                </button>
              </div>

              {credentials.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay credenciales configuradas</p>
                  <p className="text-sm">Haz clic en "Agregar" para comenzar</p>
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
            </div>


            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                💾 Guardar Todo
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                🗑️ Limpiar Todo
              </button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">ℹ️ Información</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Agrega tantas credenciales como necesites</li>
              <li>• Las claves deben ser únicas (no duplicadas)</li>
              <li>• Los valores se ocultan por seguridad</li>
              <li>• Las credenciales se guardan automáticamente en el navegador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;
