import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="p-4 h-full mobile-landscape-padding">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section optimizado para móviles apaisados */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white mobile-landscape-card">
          <h2 className="text-2xl font-bold mb-2 mobile-landscape-text">¡Bienvenido!</h2>
          <p className="text-blue-100 mobile-landscape-text">
            Esta es una aplicación optimizada para móviles en formato apaisado.
          </p>
        </div>

        {/* Grid de tarjetas optimizado para landscape */}
        <div className="grid grid-cols-2 gap-4 mb-6 mobile-landscape-grid">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mobile-landscape-card">
            <div className="text-2xl mb-2 mobile-landscape-icon">📱</div>
            <h3 className="font-semibold text-gray-800 mb-1 mobile-landscape-text">Móvil First</h3>
            <p className="text-sm text-gray-600 mobile-landscape-text">Diseño optimizado para móviles</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mobile-landscape-card">
            <div className="text-2xl mb-2 mobile-landscape-icon">🔄</div>
            <h3 className="font-semibold text-gray-800 mb-1 mobile-landscape-text">Responsive</h3>
            <p className="text-sm text-gray-600 mobile-landscape-text">Se adapta a cualquier pantalla</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mobile-landscape-card">
            <div className="text-2xl mb-2 mobile-landscape-icon">⚡</div>
            <h3 className="font-semibold text-gray-800 mb-1 mobile-landscape-text">Rápido</h3>
            <p className="text-sm text-gray-600 mobile-landscape-text">Carga rápida y fluida</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mobile-landscape-card">
            <div className="text-2xl mb-2 mobile-landscape-icon">🎨</div>
            <h3 className="font-semibold text-gray-800 mb-1 mobile-landscape-text">Moderno</h3>
            <p className="text-sm text-gray-600 mobile-landscape-text">Diseño actual y atractivo</p>
          </div>
        </div>

        {/* Sección de características */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Características principales</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Navegación horizontal optimizada para landscape
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Interfaz táctil intuitiva
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Diseño responsive con Tailwind CSS
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Navegación con React Router
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
