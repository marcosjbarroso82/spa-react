import React from 'react';
import { useVariables } from '../../hooks/useVariables';

interface VariablesConfigSectionProps {
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

const VariablesConfigSection: React.FC<VariablesConfigSectionProps> = ({ message, setMessage }) => {
  const {
    variables,
    saveVariables,
    addVariable,
    updateVariable,
    removeVariable,
    clearVariables
  } = useVariables();

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

  const handleVariablesClear = () => {
    clearVariables();
    setMessage({ type: 'success', text: 'Variables eliminadas' });
  };

  return (
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
  );
};

export default VariablesConfigSection;
