import { useState, useEffect } from 'react';

export interface UserPreferences {
  imageInputMode: 'file' | 'camera';
  autoRead: boolean;
  debug: boolean;
  allowImageUpload: boolean;
  allowCameraCapture: boolean;
}

const PREFERENCES_STORAGE_KEY = 'app_preferences';

const defaultPreferences: UserPreferences = {
  imageInputMode: 'file',
  autoRead: false,
  debug: false,
  allowImageUpload: true,
  allowCameraCapture: true
};

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias del localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar preferencias en localStorage
  const savePreferences = (newPreferences: UserPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
      throw error;
    }
  };

  // Actualizar una preferencia específica
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  // Resetear a valores por defecto
  const resetPreferences = () => {
    savePreferences(defaultPreferences);
  };

  return {
    preferences,
    isLoading,
    savePreferences,
    updatePreference,
    resetPreferences
  };
};
