# SPA React - Aplicación Móvil Optimizada

Una aplicación React con Tailwind CSS y React Router, optimizada específicamente para móviles en formato apaisado (landscape).

## 🚀 Características

- **Diseño Mobile-First**: Optimizado para dispositivos móviles en formato apaisado
- **Navegación Horizontal**: Barra de navegación en la parte inferior para fácil acceso con el pulgar
- **Responsive Design**: Se adapta a diferentes tamaños de pantalla
- **Tailwind CSS**: Estilos modernos y consistentes
- **React Router**: Navegación entre páginas sin recarga
- **TypeScript**: Tipado estático para mejor desarrollo

## 📱 Páginas Incluidas

- **Inicio**: Página principal con información general
- **Acerca**: Información sobre la empresa y equipo
- **Servicios**: Catálogo de servicios ofrecidos
- **Contacto**: Formulario de contacto y información

## 🛠️ Tecnologías Utilizadas

- React 19.1.1
- TypeScript 4.9.5
- React Router DOM 7.9.1
- Tailwind CSS 4.1.13
- Create React App

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Navegar al directorio
cd spa-react

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

### Desarrollo
```bash
# Iniciar en modo desarrollo
npm start

# Ejecutar tests
npm test

# Construir para producción
npm run build
```

## 📱 Optimizaciones para Móviles

### Formato Apaisado (Landscape)
- Navegación horizontal en la parte inferior
- Grids adaptativos que se ajustan al ancho disponible
- Texto y elementos optimizados para pantallas pequeñas
- Padding y márgenes reducidos en landscape

### Características Técnicas
- Viewport optimizado para móviles
- Prevención de zoom en inputs (iOS)
- Área de toque mínima de 44px para elementos interactivos
- Scroll suave y optimizado
- Soporte para dispositivos con notch

## 🎨 Estructura del Proyecto

```
src/
├── components/
│   └── Layout.tsx          # Layout principal con navegación
├── pages/
│   ├── Home.tsx           # Página de inicio
│   ├── About.tsx          # Página acerca de
│   ├── Services.tsx       # Página de servicios
│   └── Contact.tsx        # Página de contacto
├── mobile-landscape.css   # Estilos específicos para móviles
├── App.tsx               # Componente principal con rutas
└── index.css             # Estilos globales con Tailwind
```

## 🔧 Configuración

### Tailwind CSS
El proyecto incluye configuración personalizada de Tailwind con breakpoints específicos para móviles:

```javascript
// tailwind.config.js
screens: {
  'landscape': {'raw': '(orientation: landscape) and (max-height: 500px)'},
  'mobile-landscape': {'raw': '(orientation: landscape) and (max-height: 600px)'},
}
```

### Clases CSS Personalizadas
- `.mobile-landscape-padding`: Padding optimizado para landscape
- `.mobile-landscape-nav`: Navegación compacta
- `.mobile-landscape-grid`: Grid adaptativo
- `.mobile-landscape-text`: Texto optimizado
- `.mobile-landscape-card`: Tarjetas compactas

## 📱 Pruebas en Dispositivos Móviles

### Herramientas de Desarrollo
1. **Chrome DevTools**: Usar el modo dispositivo para simular móviles
2. **Firefox Responsive Design Mode**: Simular diferentes dispositivos
3. **Dispositivos Físicos**: Probar en dispositivos reales para mejor experiencia

### Configuración Recomendada
- Rotar el dispositivo a formato apaisado
- Probar en diferentes tamaños de pantalla
- Verificar la navegación táctil
- Comprobar el rendimiento en dispositivos de gama baja

## 🚀 Despliegue

```bash
# Construir para producción
npm run build

# Los archivos se generan en la carpeta 'build'
# Subir el contenido de 'build' a tu servidor web
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerir mejoras.
