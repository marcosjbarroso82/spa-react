import React from 'react';

const About: React.FC = () => {
  return (
    <div className="p-4 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header de la página */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acerca de Nosotros</h2>
          <p className="text-gray-600">Conoce más sobre nuestra empresa y misión</p>
        </div>

        {/* Información principal */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nuestra Empresa</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Somos una empresa innovadora especializada en desarrollo de aplicaciones móviles 
                optimizadas para diferentes formatos de pantalla. Nuestro enfoque está en crear 
                experiencias de usuario excepcionales.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold mb-1">500+</div>
            <div className="text-sm opacity-90">Proyectos Completados</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold mb-1">50+</div>
            <div className="text-sm opacity-90">Clientes Satisfechos</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold mb-1">5+</div>
            <div className="text-sm opacity-90">Años de Experiencia</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold mb-1">24/7</div>
            <div className="text-sm opacity-90">Soporte Técnico</div>
          </div>
        </div>

        {/* Equipo */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nuestro Equipo</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm">👨‍💻</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">Desarrolladores Frontend</div>
                <div className="text-sm text-gray-600">Especialistas en React y móviles</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm">🎨</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">Diseñadores UX/UI</div>
                <div className="text-sm text-gray-600">Expertos en experiencia móvil</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">Especialistas en Performance</div>
                <div className="text-sm text-gray-600">Optimización y velocidad</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
