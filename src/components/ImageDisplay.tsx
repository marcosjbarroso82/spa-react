import React, { useState } from 'react';
import { ImageInfo } from '../utils/imageUtils';
import ImageModal from './ImageModal';

interface ImageDisplayProps {
  imageSrc: string | null;
  imageInfo?: ImageInfo | null;
  title?: string;
  showInfo?: boolean;
  onImageClick?: (src: string, title: string) => void;
  loading?: boolean;
  error?: string;
  actions?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showPlaceholder?: boolean;
  placeholderText?: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageSrc,
  imageInfo,
  title,
  showInfo = true,
  onImageClick,
  loading = false,
  error,
  actions,
  className = '',
  maxHeight = 'max-h-96',
  showPlaceholder = true,
  placeholderText = 'No hay imagen'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    if (imageSrc) {
      if (onImageClick) {
        onImageClick(imageSrc, title || 'Imagen');
      } else {
        setIsModalOpen(true);
      }
    }
  };

  return (
    <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
      )}
      
      <div className="relative">
        {loading ? (
          <div className={`w-full h-64 bg-gray-600 rounded-lg flex items-center justify-center ${maxHeight}`}>
            <div className="text-white text-lg">⏳ Procesando...</div>
          </div>
        ) : error ? (
          <div className={`w-full h-64 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg flex items-center justify-center ${maxHeight}`}>
            <div className="text-red-300 text-center">
              <div className="text-lg mb-2">❌ Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={title || 'Imagen'}
            className={`w-full h-auto ${maxHeight} object-contain rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity duration-200`}
            onClick={handleImageClick}
            title="Haz clic para ampliar y hacer pan/zoom"
          />
        ) : showPlaceholder ? (
          <div className={`w-full h-64 bg-gray-600 rounded-lg flex flex-col items-center justify-center ${maxHeight}`}>
            <div className="text-gray-400 text-lg mb-2">{placeholderText}</div>
            <div className="text-gray-500 text-sm text-center">
              {placeholderText === 'No hay imagen' && 'Selecciona o captura una imagen'}
            </div>
          </div>
        ) : null}
      </div>

      {showInfo && imageInfo && (
        <div className="mt-3 text-sm text-gray-300">
          <p><strong>Dimensiones:</strong> {imageInfo.dimensions}</p>
          <p><strong>Tamaño:</strong> {imageInfo.size}</p>
          <p><strong>Formato:</strong> {imageInfo.format}</p>
        </div>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions}
        </div>
      )}

      {/* Modal for image zoom/pan */}
      {imageSrc && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageSrc={imageSrc}
          title={title}
        />
      )}
    </div>
  );
};

export default ImageDisplay;
