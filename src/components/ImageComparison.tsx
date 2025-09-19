import React from 'react';
import ImageDisplay from './ImageDisplay';
import { ImageInfo, calculateSizeReduction } from '../utils/imageUtils';

interface ImageComparisonProps {
  originalImage: string | null;
  processedImage: string | null;
  originalInfo?: ImageInfo | null;
  processedInfo?: ImageInfo | null;
  onImageClick?: (src: string, title: string) => void;
  processing?: boolean;
  className?: string;
  showSizeReduction?: boolean;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImage,
  processedImage,
  originalInfo,
  processedInfo,
  onImageClick,
  processing = false,
  className = '',
  showSizeReduction = true
}) => {
  const sizeReduction = originalInfo && processedInfo 
    ? calculateSizeReduction(originalInfo.fileSize, processedInfo.fileSize)
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">🖼️ Comparación de Imágenes</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imagen original */}
        <ImageDisplay
          imageSrc={originalImage}
          imageInfo={originalInfo}
          title="Imagen Original"
          onImageClick={onImageClick}
          className="h-full"
        />

        {/* Imagen procesada */}
        <ImageDisplay
          imageSrc={processedImage}
          imageInfo={processedInfo}
          title="Imagen Procesada"
          onImageClick={onImageClick}
          loading={processing}
          placeholderText="No procesada"
          className="h-full"
        />
      </div>

      {/* Información adicional de comparación */}
      {originalInfo && processedInfo && showSizeReduction && (
        <div className="bg-gray-600 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">📊 Estadísticas de Optimización</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-300">Tamaño Original</div>
              <div className="text-white font-semibold">{originalInfo.size}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300">Tamaño Procesado</div>
              <div className="text-white font-semibold">{processedInfo.size}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300">Reducción</div>
              <div className={`font-semibold ${sizeReduction > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {sizeReduction > 0 ? `-${sizeReduction.toFixed(1)}%` : `+${Math.abs(sizeReduction).toFixed(1)}%`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageComparison;
