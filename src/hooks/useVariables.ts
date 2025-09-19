import { useState, useEffect } from 'react';

export interface Variable {
  id: string;
  key: string;
  value: string;
}

export interface VariablesState {
  items: Variable[];
}

const STORAGE_KEY = 'app_variables';

export const useVariables = () => {
  const [variables, setVariables] = useState<VariablesState>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar variables del localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setVariables(parsed);
      }
    } catch (error) {
      console.error('Error loading variables from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar variables en localStorage
  const saveVariables = (newVariables: VariablesState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVariables));
      setVariables(newVariables);
    } catch (error) {
      console.error('Error saving variables to localStorage:', error);
      throw error;
    }
  };

  // Obtener una variable por su clave
  const getVariableByKey = (key: string): string | null => {
    const variable = variables.items.find(item => item.key === key);
    return variable ? variable.value : null;
  };

  // Agregar nueva variable
  const addVariable = () => {
    const newVariable: Variable = {
      id: Date.now().toString(),
      key: '',
      value: ''
    };
    setVariables(prev => ({
      items: [...prev.items, newVariable]
    }));
  };

  // Actualizar variable existente
  const updateVariable = (id: string, field: 'key' | 'value', value: string) => {
    setVariables(prev => ({
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Eliminar variable
  const removeVariable = (id: string) => {
    setVariables(prev => ({
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Limpiar todas las variables
  const clearVariables = () => {
    setVariables({ items: [] });
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    variables,
    isLoading,
    saveVariables,
    getVariableByKey,
    addVariable,
    updateVariable,
    removeVariable,
    clearVariables
  };
};
