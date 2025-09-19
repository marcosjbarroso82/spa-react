import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import TTSBrowser from './integrations/TTSBrowser';
import TakePhoto from './integrations/TakePhoto';
import MathpixOCR from './integrations/MathpixOCR';
import MathpixPhotoOCR from './integrations/MathpixPhotoOCR';
import FlowiseTester from './integrations/FlowiseTester';
import AnswerFromImage from './integrations/AnswerFromImage';
import AnswerFromImageUX from './integrations/AnswerFromImageUX';

const Integrations: React.FC = () => {
  const location = useLocation();

  const integrationItems = [
    { path: '/integrations/tts-browser', label: 'TTS Browser', icon: '🔊', description: 'Texto a voz del navegador' },
    { path: '/integrations/take-photo', label: 'Tomar Foto', icon: '📷', description: 'Capturar foto con la cámara' },
    { path: '/integrations/mathpix-ocr', label: 'Mathpix OCR', icon: '📐', description: 'Reconocimiento óptico de matemáticas' },
    { path: '/integrations/mathpix-photo-ocr', label: 'Mathpix Photo OCR', icon: '📷📐', description: 'Capturar y procesar matemáticas con la cámara' },
    { path: '/integrations/flowise-tester', label: 'Flowise Tester', icon: '🤖', description: 'Probar endpoints de Flowise' },
    { path: '/integrations/answer-from-image', label: 'Contestar por Imagen', icon: '🖼️', description: 'OCR con Mathpix y análisis con Flowise' },
    { path: '/integrations/answer-from-image-ux', label: 'Contestar por Imagen UX', icon: '✨', description: 'Versión mejorada con mejor experiencia de usuario' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
          🔧 Integraciones
        </h1>
        
        <p className="text-center text-gray-300 mb-8">
          Prueba diferentes funcionalidades del navegador y dispositivos
        </p>

        {/* Navegación de integraciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {integrationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                location.pathname === item.path
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700'
              }`}
            >
              <div className="text-center">
                <span className="text-4xl mb-3 block">{item.icon}</span>
                <h3 className="text-xl font-semibold mb-2">{item.label}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Contenido de las sub-rutas */}
        <div className="bg-gray-800 rounded-lg p-6">
          <Routes>
            <Route path="/" element={
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h2 className="text-2xl font-semibold mb-4">Selecciona una integración</h2>
                <p className="text-gray-400">
                  Elige una de las opciones de arriba para probar las diferentes funcionalidades
                </p>
              </div>
            } />
            <Route path="/tts-browser" element={<TTSBrowser />} />
            <Route path="/take-photo" element={<TakePhoto />} />
            <Route path="/mathpix-ocr" element={<MathpixOCR />} />
            <Route path="/mathpix-photo-ocr" element={<MathpixPhotoOCR />} />
            <Route path="/flowise-tester" element={<FlowiseTester />} />
            <Route path="/answer-from-image" element={<AnswerFromImage />} />
            <Route path="/answer-from-image-ux" element={<AnswerFromImageUX />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
