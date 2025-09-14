import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/about', label: 'Acerca', icon: '👤' },
    { path: '/services', label: 'Servicios', icon: '⚙️' },
    { path: '/contact', label: 'Contacto', icon: '📞' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header optimizado para móviles apaisados */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="px-4 py-2">
          <h1 className="text-lg font-bold text-white text-center">
            Mi App Móvil
          </h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-gray-900">
        {children}
      </main>

      {/* Navegación horizontal en la parte inferior para móviles apaisados */}
      <nav className="bg-gray-800 border-t border-gray-700 px-2 py-1 mobile-landscape-nav">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg mb-1 mobile-landscape-icon">{item.icon}</span>
              <span className="text-xs font-medium mobile-landscape-text">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
