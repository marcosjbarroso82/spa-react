import React, { useState, useRef } from 'react';

const TTSBrowser: React.FC = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  React.useEffect(() => {
    // Cargar voces disponibles
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speakText = () => {
    if (!text.trim()) {
      alert('Por favor, ingresa algún texto para leer');
      return;
    }

    // Detener cualquier síntesis en curso
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configurar voz si está disponible
    if (voices.length > 0 && selectedVoice < voices.length) {
      utterance.voice = voices[selectedVoice];
    }

    // Configurar parámetros
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Eventos
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const pauseSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">🔊 TTS Browser</h2>
        <p className="text-gray-300">
          Convierte texto a voz utilizando la funcionalidad del navegador
        </p>
      </div>

      <div className="space-y-6">
        {/* Campo de texto */}
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-2">
            Texto a leer:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe aquí el texto que quieres que se lea..."
            className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Controles de voz */}
        {voices.length > 0 && (
          <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-2">
              Voz:
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Controles de velocidad, tono y volumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rate-slider" className="block text-sm font-medium text-gray-300 mb-2">
              Velocidad: {rate}
            </label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="pitch-slider" className="block text-sm font-medium text-gray-300 mb-2">
              Tono: {pitch}
            </label>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="volume-slider" className="block text-sm font-medium text-gray-300 mb-2">
              Volumen: {Math.round(volume * 100)}%
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Botones de control */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={speakText}
            disabled={isSpeaking || !text.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isSpeaking ? '🔊 Leyendo...' : '▶️ Leer Texto'}
          </button>

          <button
            onClick={pauseSpeaking}
            disabled={!isSpeaking && !speechSynthesis.paused}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {speechSynthesis.paused ? '▶️ Reanudar' : '⏸️ Pausar'}
          </button>

          <button
            onClick={stopSpeaking}
            disabled={!isSpeaking && !speechSynthesis.paused}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            ⏹️ Detener
          </button>
        </div>

        {/* Estado actual */}
        <div className="text-center">
          {isSpeaking && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500 rounded-lg text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Reproduciendo...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TTSBrowser;
