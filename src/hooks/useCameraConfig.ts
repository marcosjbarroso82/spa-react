import { useState, useEffect, useCallback } from 'react';
import { 
  CameraConfig, 
  defaultCameraConfig, 
  getCameraConfig, 
  saveCameraConfig, 
  applyCameraPreset, 
  resetCameraConfig,
  cameraPresets 
} from '../config/cameraConfig';

export const useCameraConfig = () => {
  const [config, setConfig] = useState<CameraConfig>(defaultCameraConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración al inicializar
  useEffect(() => {
    const loadConfig = () => {
      try {
        const loadedConfig = getCameraConfig();
        setConfig(loadedConfig);
      } catch (error) {
        console.error('Error al cargar configuración de cámara:', error);
        setConfig(defaultCameraConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Actualizar configuración
  const updateConfig = useCallback((newConfig: Partial<CameraConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    saveCameraConfig(updatedConfig);
  }, [config]);

  // Actualizar configuración específica
  const updateResolution = useCallback((resolution: Partial<CameraConfig['resolution']>) => {
    updateConfig({
      resolution: { ...config.resolution, ...resolution }
    });
  }, [config.resolution, updateConfig]);

  const updateQuality = useCallback((quality: Partial<CameraConfig['quality']>) => {
    updateConfig({
      quality: { ...config.quality, ...quality }
    });
  }, [config.quality, updateConfig]);

  const updateFocus = useCallback((focus: Partial<CameraConfig['focus']>) => {
    updateConfig({
      focus: { ...config.focus, ...focus }
    });
  }, [config.focus, updateConfig]);

  const updateProcessing = useCallback((processing: Partial<CameraConfig['processing']>) => {
    updateConfig({
      processing: { ...config.processing, ...processing }
    });
  }, [config.processing, updateConfig]);

  // Aplicar preset
  const applyPreset = useCallback((presetName: string) => {
    const newConfig = applyCameraPreset(presetName);
    setConfig(newConfig);
  }, []);

  // Restaurar configuración por defecto
  const resetToDefault = useCallback(() => {
    const defaultConfig = resetCameraConfig();
    setConfig(defaultConfig);
  }, []);

  // Obtener configuraciones de video constraints - optimizado para preview
  const getVideoConstraints = useCallback(() => {
    // Detectar si es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    
    if (isMobile) {
      // Configuración optimizada para preview en móviles
      return {
        facingMode: { ideal: 'environment' as const },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 24, max: 30 },
        aspectRatio: { ideal: 16/9 }
      };
    }
    
    // Configuración para desktop
    return {
      facingMode: { ideal: 'environment' as const },
      width: { ideal: 1920, max: 2560 },
      height: { ideal: 1080, max: 1440 },
      frameRate: { ideal: 30, max: 60 },
      aspectRatio: { ideal: 16/9 }
    };
  }, []);

  // Obtener configuraciones de enfoque continuo
  const getContinuousFocusConstraints = useCallback(() => {
    return {
      advanced: [
        { focusMode: config.focus.continuousMode.focusMode },
        { whiteBalanceMode: config.focus.continuousMode.whiteBalanceMode },
        { exposureMode: config.focus.continuousMode.exposureMode },
        { brightness: { ideal: config.focus.continuousMode.brightness } },
        { contrast: { ideal: config.focus.continuousMode.contrast } },
        { saturation: { ideal: config.focus.continuousMode.saturation } },
        { sharpness: { ideal: config.focus.continuousMode.sharpness } }
      ]
    };
  }, [config.focus.continuousMode]);

  // Obtener configuraciones de enfoque single-shot
  const getSingleShotFocusConstraints = useCallback(() => {
    return {
      advanced: [
        { focusMode: config.focus.singleShotMode.focusMode },
        { focusDistance: config.focus.distance },
        { exposureMode: config.focus.singleShotMode.exposureMode },
        { whiteBalanceMode: config.focus.singleShotMode.whiteBalanceMode },
        { brightness: { ideal: config.focus.singleShotMode.brightness } },
        { contrast: { ideal: config.focus.singleShotMode.contrast } },
        { saturation: { ideal: config.focus.singleShotMode.saturation } },
        { sharpness: { ideal: config.focus.singleShotMode.sharpness } }
      ]
    };
  }, [config.focus]);

  // Obtener filtros de procesamiento
  const getProcessingFilters = useCallback(() => {
    return `contrast(${config.processing.filters.contrast}) brightness(${config.processing.filters.brightness}) saturate(${config.processing.filters.saturation})`;
  }, [config.processing.filters]);

  // Obtener coeficientes de escala de grises
  const getGrayscaleWeights = useCallback(() => {
    return {
      red: config.processing.grayscale.redWeight,
      green: config.processing.grayscale.greenWeight,
      blue: config.processing.grayscale.blueWeight
    };
  }, [config.processing.grayscale]);

  return {
    config,
    isLoading,
    updateConfig,
    updateResolution,
    updateQuality,
    updateFocus,
    updateProcessing,
    applyPreset,
    resetToDefault,
    getVideoConstraints,
    getContinuousFocusConstraints,
    getSingleShotFocusConstraints,
    getProcessingFilters,
    getGrayscaleWeights,
    presets: Object.keys(cameraPresets)
  };
};
