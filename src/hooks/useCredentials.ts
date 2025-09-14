import { useState, useEffect } from 'react';

export interface CredentialItem {
  id: string;
  key: string;
  value: string;
}

export interface Credentials {
  items: CredentialItem[];
}

const STORAGE_KEY = 'app-credentials';

export const useCredentials = () => {
  const [credentials, setCredentials] = useState<Credentials>({
    items: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  // Cargar credenciales desde localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCredentials = JSON.parse(stored);
        setCredentials(parsedCredentials);
      }
    } catch (error) {
      console.error('Error loading credentials from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar credenciales en localStorage
  const saveCredentials = (newCredentials: Credentials) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCredentials));
      setCredentials(newCredentials);
    } catch (error) {
      console.error('Error saving credentials to localStorage:', error);
    }
  };

  // Limpiar credenciales
  const clearCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCredentials({
        items: [],
      });
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  // Agregar nueva credencial
  const addCredential = () => {
    const newItem: CredentialItem = {
      id: Date.now().toString(),
      key: '',
      value: '',
    };
    setCredentials(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Eliminar credencial
  const removeCredential = (id: string) => {
    setCredentials(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  // Actualizar una credencial específica
  const updateCredential = (id: string, field: 'key' | 'value', newValue: string) => {
    setCredentials(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: newValue } : item
      ),
    }));
  };


  // Obtener credencial por clave
  const getCredentialByKey = (key: string): string | undefined => {
    const item = credentials.items.find(item => item.key === key);
    return item?.value;
  };

  return {
    credentials,
    isLoading,
    saveCredentials,
    clearCredentials,
    addCredential,
    removeCredential,
    updateCredential,
    getCredentialByKey,
  };
};
