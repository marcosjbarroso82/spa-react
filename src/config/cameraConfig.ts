/**
 * Configuración centralizada para la cámara y procesamiento de imágenes
 * 
 * Este archivo contiene todos los valores de configuración para:
 * - Resolución de captura
 * - Calidad de imagen
 * - Configuraciones de enfoque
 * - Filtros de procesamiento
 * - Optimizaciones para OCR
 */

export interface CameraConfig {
  // Configuraciones de resolución
  resolution: {
    width: number;
    height: number;
    frameRate: number;
    aspectRatio: number;
  };
  
  // Configuraciones de calidad
  quality: {
    screenshotQuality: number;
    optimizationQuality: number;
    maxWidth: number;
    maxHeight: number;
  };
  
  // Configuraciones de enfoque
  focus: {
    distance: number;
    stabilizationTime: number;
    continuousMode: {
      focusMode: string;
      whiteBalanceMode: string;
      exposureMode: string;
      brightness: number;
      contrast: number;
      saturation: number;
      sharpness: number;
    };
    singleShotMode: {
      focusMode: string;
      exposureMode: string;
      whiteBalanceMode: string;
      brightness: number;
      contrast: number;
      saturation: number;
      sharpness: number;
    };
  };
  
  // Configuraciones de procesamiento de imagen
  processing: {
    filters: {
      contrast: number;
      brightness: number;
      saturation: number;
    };
    grayscale: {
      redWeight: number;
      greenWeight: number;
      blueWeight: number;
    };
  };
}

// Configuración por defecto optimizada para máxima resolución disponible
export const defaultCameraConfig: CameraConfig = {
  resolution: {
    width: 3840,        // Resolución 4K para máxima calidad disponible
    height: 2160,       // Mantiene proporción 16:9 con máxima resolución
    frameRate: 30,      // Frame rate estándar para mejor calidad
    aspectRatio: 16/9   // Proporción estándar para pantallas
  },
  
  quality: {
    screenshotQuality: 0.85,  // Calidad alta para preservar detalles de texto pequeño
    optimizationQuality: 0.8, // Calidad de optimización para OCR
    maxWidth: 2560,           // Resolución máxima para optimización
    maxHeight: 1440           // Resolución máxima para optimización
  },
  
  focus: {
    distance: 0.3,            // 30cm - distancia típica celular-pantalla de notebook
    stabilizationTime: 2000,  // Tiempo de estabilización para pantallas (ms)
    
    // Configuraciones continuas (durante la visualización)
    continuousMode: {
      focusMode: 'continuous',
      whiteBalanceMode: 'continuous',
      exposureMode: 'continuous',
      brightness: 0.4,        // Brillo reducido para evitar reflejos
      contrast: 0.8,          // Alto contraste para texto pequeño
      saturation: 0.2,        // Baja saturación para pantallas RGB
      sharpness: 0.9          // Alta nitidez para caracteres pequeños
    },
    
    // Configuraciones single-shot (al capturar)
    singleShotMode: {
      focusMode: 'single-shot',
      exposureMode: 'single-shot',
      whiteBalanceMode: 'single-shot',
      brightness: 0.35,       // Brillo reducido para evitar reflejos de pantalla
      contrast: 0.85,         // Alto contraste para mejorar legibilidad de texto pequeño
      saturation: 0.15,       // Muy baja saturación (pantallas son RGB, no necesitan color)
      sharpness: 0.95         // Máxima nitidez para caracteres pequeños
    }
  },
  
  processing: {
    filters: {
      contrast: 1.5,          // Alto contraste para mejorar legibilidad de caracteres pequeños
      brightness: 1.2,        // Brillo ajustado para compensar reflejos de pantalla
      saturation: 0.1         // Baja saturación (pantallas son RGB, no necesitan color)
    },
    grayscale: {
      redWeight: 0.299,       // Coeficientes optimizados para pantallas RGB
      greenWeight: 0.587,     // Más peso al verde (mejora legibilidad en pantallas LCD/LED)
      blueWeight: 0.114       // Menor peso al azul
    }
  }
};

/**
 * Configuraciones predefinidas para diferentes escenarios
 */
export const cameraPresets: Record<string, Partial<CameraConfig>> = {
  // Para documentos físicos (texto grande)
  document: {
    resolution: {
      width: 2560,        // Resolución más alta para documentos
      height: 1440,       // Mantiene proporción 16:9
      frameRate: 30,      // Frame rate estándar
      aspectRatio: 16/9
    },
    quality: {
      screenshotQuality: 0.7,
      optimizationQuality: 0.6,
      maxWidth: 1920,
      maxHeight: 1080
    },
    focus: {
      distance: 0.2, // 20cm para documentos
      stabilizationTime: 1000,
      continuousMode: {
        focusMode: 'continuous',
        whiteBalanceMode: 'continuous',
        exposureMode: 'continuous',
        brightness: 0.5,
        contrast: 0.7,
        saturation: 0.3,
        sharpness: 0.8
      },
      singleShotMode: {
        focusMode: 'single-shot',
        exposureMode: 'single-shot',
        whiteBalanceMode: 'single-shot',
        brightness: 0.4,
        contrast: 0.8,
        saturation: 0.2,
        sharpness: 0.9
      }
    }
  },
  
  // Para pantallas de notebook (texto pequeño)
  screen: {
    ...defaultCameraConfig
  },
  
  // Para móviles con poca memoria
  mobile: {
    resolution: {
      width: 1920,        // Resolución HD para móviles
      height: 1080,       // Mantiene proporción 16:9
      frameRate: 30,      // Frame rate estándar
      aspectRatio: 16/9
    },
    quality: {
      screenshotQuality: 0.6,
      optimizationQuality: 0.5,
      maxWidth: 1280,
      maxHeight: 720
    },
    focus: {
      distance: 0.3,
      stabilizationTime: 1000,
      continuousMode: {
        focusMode: 'continuous',
        whiteBalanceMode: 'continuous',
        exposureMode: 'continuous',
        brightness: 0.4,
        contrast: 0.8,
        saturation: 0.2,
        sharpness: 0.9
      },
      singleShotMode: {
        focusMode: 'single-shot',
        exposureMode: 'single-shot',
        whiteBalanceMode: 'single-shot',
        brightness: 0.35,
        contrast: 0.85,
        saturation: 0.15,
        sharpness: 0.95
      }
    }
  }
};

/**
 * Obtiene la configuración de cámara desde localStorage o retorna la configuración por defecto
 */
export const getCameraConfig = (): CameraConfig => {
  try {
    const stored = localStorage.getItem('cameraConfig');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge con configuración por defecto para asegurar que todos los campos estén presentes
      return { ...defaultCameraConfig, ...parsed };
    }
  } catch (error) {
    console.warn('Error al cargar configuración de cámara:', error);
  }
  return defaultCameraConfig;
};

/**
 * Guarda la configuración de cámara en localStorage
 */
export const saveCameraConfig = (config: CameraConfig): void => {
  try {
    localStorage.setItem('cameraConfig', JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar configuración de cámara:', error);
  }
};

/**
 * Aplica un preset a la configuración actual
 */
export const applyCameraPreset = (presetName: string): CameraConfig => {
  const preset = cameraPresets[presetName];
  if (!preset) {
    console.warn(`Preset '${presetName}' no encontrado`);
    return defaultCameraConfig;
  }
  
  const newConfig = { ...defaultCameraConfig, ...preset };
  saveCameraConfig(newConfig);
  return newConfig;
};

/**
 * Restaura la configuración por defecto
 */
export const resetCameraConfig = (): CameraConfig => {
  saveCameraConfig(defaultCameraConfig);
  return defaultCameraConfig;
};
