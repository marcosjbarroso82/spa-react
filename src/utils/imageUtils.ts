/**
 * Utilidades reutilizables para procesamiento de imágenes
 * Extraídas de ImageProcessor.tsx para reutilización en toda la aplicación
 */

export interface ImageInfo {
  size: string;
  dimensions: string;
  format: string;
  fileSize: number;
  width: number;
  height: number;
}

/**
 * Formatea el tamaño de archivo en bytes a formato legible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Obtiene información detallada de una imagen desde data URL
 */
export const getImageInfo = async (dataUrl: string): Promise<ImageInfo> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calcular tamaño del archivo en bytes
      const base64Length = dataUrl.split(',')[1]?.length || 0;
      const fileSize = Math.round((base64Length * 3) / 4);
      
      resolve({
        size: formatFileSize(fileSize),
        dimensions: `${img.width} x ${img.height}`,
        format: dataUrl.split(';')[0].split(':')[1] || 'unknown',
        fileSize,
        width: img.width,
        height: img.height
      });
    };
    img.src = dataUrl;
  });
};

/**
 * Redimensiona una imagen manteniendo el aspect ratio
 */
export const resizeImage = (
  dataUrl: string, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
};

/**
 * Convierte un archivo a data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Valida si un archivo es una imagen válida
 */
export const isValidImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Calcula la reducción de tamaño entre dos imágenes
 */
export const calculateSizeReduction = (originalSize: number, processedSize: number): number => {
  return ((1 - processedSize / originalSize) * 100);
};
