import { useState, useCallback } from 'react';
import { useCameraConfig } from './useCameraConfig';
import { getImageInfo, ImageInfo, resizeImage } from '../utils/imageUtils';

/**
 * Hook para procesamiento de imágenes con configuración de cámara
 * Extrae la lógica de procesamiento de ImageProcessor.tsx
 */
export const useImageProcessing = () => {
  const { config: cameraConfig } = useCameraConfig();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Optimiza una imagen usando la configuración actual de la cámara
   */
  const optimizeImage = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        let { width, height } = img;

        // Redimensionar si es necesario según la configuración
        const maxWidth = cameraConfig.quality.maxWidth;
        const maxHeight = cameraConfig.quality.maxHeight;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Configuraciones de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Aplicar filtros de procesamiento
        ctx.filter = `contrast(${cameraConfig.processing.filters.contrast}) brightness(${cameraConfig.processing.filters.brightness}) saturate(${cameraConfig.processing.filters.saturation})`;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a escala de grises si está configurado
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Aplicar conversión a escala de grises
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(
            data[i] * cameraConfig.processing.grayscale.redWeight +
            data[i + 1] * cameraConfig.processing.grayscale.greenWeight +
            data[i + 2] * cameraConfig.processing.grayscale.blueWeight
          );
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha se mantiene igual
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Exportar con la calidad configurada
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', cameraConfig.quality.optimizationQuality);
        resolve(optimizedDataUrl);
      };
      img.src = dataUrl;
    });
  }, [cameraConfig]);

  /**
   * Procesa una imagen y obtiene información de ambas versiones
   */
  const processImage = useCallback(async (originalImage: string): Promise<{
    processedImage: string;
    originalInfo: ImageInfo;
    processedInfo: ImageInfo;
  }> => {
    setIsProcessing(true);
    try {
      // Obtener información de la imagen original
      const originalInfo = await getImageInfo(originalImage);
      
      // Optimizar la imagen
      const processedImage = await optimizeImage(originalImage);
      
      // Obtener información de la imagen procesada
      const processedInfo = await getImageInfo(processedImage);
      
      return {
        processedImage,
        originalInfo,
        processedInfo
      };
    } finally {
      setIsProcessing(false);
    }
  }, [optimizeImage]);

  /**
   * Redimensiona una imagen usando la configuración actual
   */
  const resizeImageWithConfig = useCallback((dataUrl: string): Promise<string> => {
    return resizeImage(
      dataUrl,
      cameraConfig.quality.maxWidth,
      cameraConfig.quality.maxHeight,
      cameraConfig.quality.optimizationQuality
    );
  }, [cameraConfig.quality]);

  return {
    isProcessing,
    optimizeImage,
    processImage,
    resizeImageWithConfig,
    cameraConfig
  };
};
