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
    // Modo de enfoque principal: 'continuous', 'single-shot', 'manual'
    focusMode: 'continuous' | 'single-shot' | 'manual';
    // Si usar enfoque continuo durante el preview
    useContinuousFocus: boolean;
    // Si aplicar enfoque automático antes de capturar
    autoFocusBeforeCapture: boolean;
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

// Configuración por defecto optimizada para OCR de pantallas de notebook
export const defaultCameraConfig: CameraConfig = {
  resolution: {
    width: 1920,        // Resolución Full HD para mejor detalle de texto
    height: 1080,       // Mantiene proporción 16:9
    frameRate: 30,      // Frame rate estándar para estabilidad
    aspectRatio: 16/9   // Proporción estándar para pantallas
  },
  
  quality: {
    screenshotQuality: 0.85, // Calidad alta para preservar detalles de texto
    optimizationQuality: 0.9, // Calidad muy alta para OCR
    maxWidth: 2560,           // Resolución máxima para optimización
    maxHeight: 1440           // Resolución máxima para optimización
  },
  
  focus: {
    // Configuración de enfoque principal
    focusMode: 'single-shot',     // Modo por defecto: single-shot para OCR
    useContinuousFocus: false,    // No usar enfoque continuo por defecto
    autoFocusBeforeCapture: true, // Aplicar enfoque antes de capturar
    distance: 0.35,               // 35cm - distancia óptima para pantallas de notebook
    stabilizationTime: 2000,      // Tiempo de estabilización aumentado para mejor enfoque
    
    // Configuraciones continuas (durante la visualización)
    continuousMode: {
      focusMode: 'continuous',
      whiteBalanceMode: 'continuous',
      exposureMode: 'continuous',
      brightness: 0.3,        // Brillo muy reducido para evitar reflejos de pantalla
      contrast: 0.9,          // Contraste muy alto para texto pequeño
      saturation: 0.1,        // Muy baja saturación para pantallas RGB
      sharpness: 0.95         // Máxima nitidez para caracteres pequeños
    },
    
    // Configuraciones single-shot (al capturar)
    singleShotMode: {
      focusMode: 'single-shot',
      exposureMode: 'single-shot',
      whiteBalanceMode: 'single-shot',
      brightness: 0.25,       // Brillo muy reducido para evitar reflejos de pantalla
      contrast: 0.95,         // Contraste máximo para mejorar legibilidad de texto pequeño
      saturation: 0.05,       // Saturación mínima (pantallas son RGB, no necesitan color)
      sharpness: 1.0          // Nitidez máxima para caracteres pequeños
    }
  },
  
  processing: {
    filters: {
      contrast: 1.8,          // Contraste muy alto para mejorar legibilidad de caracteres pequeños
      brightness: 1.1,        // Brillo ajustado para compensar reflejos de pantalla
      saturation: 0.05        // Saturación mínima (pantallas son RGB, no necesitan color)
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
      focusMode: 'single-shot',     // Single-shot para documentos (distancia fija)
      useContinuousFocus: false,    // No usar enfoque continuo
      autoFocusBeforeCapture: true, // Enfocar antes de capturar
      distance: 0.2,                // 20cm para documentos
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
  
  // Para pantallas de notebook (texto pequeño) - Optimizado para OCR
  screen: {
    resolution: {
      width: 2560,        // Resolución 2K para máximo detalle de texto
      height: 1440,       // Mantiene proporción 16:9
      frameRate: 30,      // Frame rate estándar
      aspectRatio: 16/9
    },
    quality: {
      screenshotQuality: 0.9,  // Calidad máxima para OCR
      optimizationQuality: 0.95, // Calidad muy alta para procesamiento
      maxWidth: 2560,           // Resolución máxima
      maxHeight: 1440           // Resolución máxima
    },
    focus: {
      focusMode: 'single-shot',     // Single-shot para OCR
      useContinuousFocus: false,    // No usar enfoque continuo
      autoFocusBeforeCapture: true, // Enfocar antes de capturar
      distance: 0.35,               // 35cm para pantallas de notebook
      stabilizationTime: 2500,      // Tiempo de estabilización alto
      continuousMode: {
        focusMode: 'continuous',
        whiteBalanceMode: 'continuous',
        exposureMode: 'continuous',
        brightness: 0.25,       // Brillo muy reducido
        contrast: 0.95,         // Contraste máximo
        saturation: 0.05,       // Saturación mínima
        sharpness: 1.0          // Nitidez máxima
      },
      singleShotMode: {
        focusMode: 'single-shot',
        exposureMode: 'single-shot',
        whiteBalanceMode: 'single-shot',
        brightness: 0.2,        // Brillo mínimo para evitar reflejos
        contrast: 1.0,          // Contraste máximo
        saturation: 0.0,        // Sin saturación
        sharpness: 1.0          // Nitidez máxima
      }
    },
    processing: {
      filters: {
        contrast: 2.0,          // Contraste máximo para OCR
        brightness: 1.0,        // Brillo neutro
        saturation: 0.0         // Sin saturación
      },
      grayscale: {
        redWeight: 0.299,
        greenWeight: 0.587,
        blueWeight: 0.114
      }
    }
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
      focusMode: 'continuous',      // Continuous para móviles (más dinámico)
      useContinuousFocus: true,     // Usar enfoque continuo en móviles
      autoFocusBeforeCapture: true, // Enfocar antes de capturar
      distance: 0.4,
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
