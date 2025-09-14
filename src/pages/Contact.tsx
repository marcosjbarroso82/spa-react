import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    alert('¡Mensaje enviado! Te contactaremos pronto.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="p-4 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Contacto</h2>
          <p className="text-gray-600">Estamos aquí para ayudarte con tu proyecto</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de contacto */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Información de Contacto</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📧</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Email</div>
                    <div className="text-sm text-gray-600">contacto@miapp.com</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📱</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Teléfono</div>
                    <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📍</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Dirección</div>
                    <div className="text-sm text-gray-600">123 Calle Principal, Ciudad</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Horarios de Atención</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lunes - Viernes</span>
                  <span className="text-gray-800">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sábados</span>
                  <span className="text-gray-800">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domingos</span>
                  <span className="text-gray-800">Cerrado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Envíanos un Mensaje</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 mobile-landscape-form">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
