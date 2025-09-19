import React, { useRef, useCallback } from 'react';
import { isValidImageFile } from '../utils/imageUtils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // en MB
  buttonText?: string;
  icon?: string;
  className?: string;
  disabled?: boolean;
  showInfo?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = 'image/*',
  multiple = false,
  maxSize = 5, // 5MB por defecto
  buttonText = 'Seleccionar Archivo',
  icon = '📁',
  className = '',
  disabled = false,
  showInfo = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar archivos
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!isValidImageFile(file)) {
        errors.push(`${file.name}: No es un archivo de imagen válido`);
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name}: El archivo es demasiado grande (máximo ${maxSize}MB)`);
        return;
      }

      validFiles.push(file);
    });

    // Mostrar errores si los hay
    if (errors.length > 0) {
      console.warn('Errores de validación:', errors);
      // Aquí podrías mostrar una notificación o toast
    }

    // Llamar callback con archivos válidos
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }

    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect, maxSize]);

  const handleButtonClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
          disabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <span className="text-lg">{icon}</span>
        {buttonText}
      </button>

      {showInfo && (
        <div className="text-xs text-gray-400">
          <p>💡 <strong>Formatos:</strong> JPG, PNG, GIF, WebP</p>
          <p>📏 <strong>Tamaño máximo:</strong> {maxSize}MB por archivo</p>
          {multiple && <p>📁 <strong>Múltiples archivos:</strong> Selecciona varios a la vez</p>}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
