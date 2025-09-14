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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header optimizado para móviles apaisados */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-2">
          <h1 className="text-lg font-bold text-gray-800 text-center">
            Mi App Móvil
          </h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Navegación horizontal en la parte inferior para móviles apaisados */}
      <nav className="bg-white border-t border-gray-200 px-2 py-1 mobile-landscape-nav">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
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
