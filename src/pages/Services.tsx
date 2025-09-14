import React from 'react';

const Services: React.FC = () => {
  const services = [
    {
      icon: '📱',
      title: 'Apps Móviles',
      description: 'Desarrollo de aplicaciones nativas e híbridas',
      features: ['iOS', 'Android', 'React Native', 'Flutter']
    },
    {
      icon: '🌐',
      title: 'Web Apps',
      description: 'Aplicaciones web progresivas y responsivas',
      features: ['PWA', 'React', 'Vue.js', 'Angular']
    },
    {
      icon: '🎨',
      title: 'UI/UX Design',
      description: 'Diseño de interfaces centradas en el usuario',
      features: ['Prototipado', 'Wireframes', 'Testing', 'Iteración']
    },
    {
      icon: '⚡',
      title: 'Optimización',
      description: 'Mejora de rendimiento y velocidad',
      features: ['Core Web Vitals', 'SEO', 'Performance', 'Analytics']
    }
  ];

  return (
    <div className="p-4 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Nuestros Servicios</h2>
          <p className="text-gray-300">Soluciones completas para tu negocio digital</p>
        </div>

        {/* Grid de servicios optimizado para landscape */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {services.map((service, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 hover:shadow-xl hover:bg-gray-750 transition-all">
              <div className="text-3xl mb-3 text-center">{service.icon}</div>
              <h3 className="font-semibold text-white mb-2 text-center">{service.title}</h3>
              <p className="text-sm text-gray-300 mb-3 text-center">{service.description}</p>
              <div className="space-y-1">
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Proceso de trabajo */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Nuestro Proceso</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">1</div>
              <div className="text-xs text-gray-300">Análisis</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">2</div>
              <div className="text-xs text-gray-300">Diseño</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">3</div>
              <div className="text-xs text-gray-300">Desarrollo</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">4</div>
              <div className="text-xs text-gray-300">Lanzamiento</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white text-center shadow-xl">
          <h3 className="text-lg font-semibold mb-2">¿Listo para comenzar?</h3>
          <p className="text-sm opacity-90 mb-4">Contáctanos para una consulta gratuita</p>
          <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg">
            Solicitar Cotización
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
