import React, { useState, useRef, useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt?: string;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageSrc, imageAlt, title }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset zoom and position when modal opens
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLastPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setLastPosition(position);
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setLastPosition({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    if (imageRef.current && containerRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      const scaleX = containerRect.width / imageRect.width;
      const scaleY = containerRect.height / imageRect.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
      setPosition({ x: 0, y: 0 });
      setLastPosition({ x: 0, y: 0 });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center p-4"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            🔍 Reset
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fitToScreen();
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            📐 Ajustar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setScale(scale * 1.2);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            ➕ Zoom In
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setScale(scale * 0.8);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            ➖ Zoom Out
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg"
        >
          ✕
        </button>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 left-4 z-10 bg-gray-700 text-white px-3 py-2 rounded text-sm">
          {Math.round(scale * 100)}%
        </div>

        {/* Image */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt={imageAlt || title || 'Imagen'}
          className="max-w-full max-h-full object-contain cursor-grab select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            e.stopPropagation();
            if (scale === 1) {
              setScale(1.5);
            }
          }}
          draggable={false}
        />

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 z-10 bg-gray-700 text-white px-3 py-2 rounded text-xs max-w-xs">
          <div>🖱️ Rueda del mouse: Zoom</div>
          <div>🖱️ Click: Zoom in</div>
          <div>🖱️ Arrastra: Pan (cuando está ampliado)</div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;