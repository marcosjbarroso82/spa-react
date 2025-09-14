import React from 'react';

const About: React.FC = () => {
  return (
    <div className="p-4 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header de la página */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Acerca de Nosotros</h2>
          <p className="text-gray-300">Conoce más sobre nuestra empresa y misión</p>
        </div>

        {/* Información principal */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Nuestra Empresa</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Somos una empresa innovadora especializada en desarrollo de aplicaciones móviles 
                optimizadas para diferentes formatos de pantalla. Nuestro enfoque está en crear 
                experiencias de usuario excepcionales con diseño moderno y tema oscuro.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white text-center shadow-lg">
            <div className="text-2xl font-bold mb-1">500+</div>
            <div className="text-sm opacity-90">Proyectos Completados</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center shadow-lg">
            <div className="text-2xl font-bold mb-1">50+</div>
            <div className="text-sm opacity-90">Clientes Satisfechos</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center shadow-lg">
            <div className="text-2xl font-bold mb-1">5+</div>
            <div className="text-sm opacity-90">Años de Experiencia</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white text-center shadow-lg">
            <div className="text-2xl font-bold mb-1">24/7</div>
            <div className="text-sm opacity-90">Soporte Técnico</div>
          </div>
        </div>

        {/* Equipo */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Nuestro Equipo</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm">👨‍💻</span>
              </div>
              <div>
                <div className="font-medium text-white">Desarrolladores Frontend</div>
                <div className="text-sm text-gray-300">Especialistas en React y móviles</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm">🎨</span>
              </div>
              <div>
                <div className="font-medium text-white">Diseñadores UX/UI</div>
                <div className="text-sm text-gray-300">Expertos en experiencia móvil</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
              <div>
                <div className="font-medium text-white">Especialistas en Performance</div>
                <div className="text-sm text-gray-300">Optimización y velocidad</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
