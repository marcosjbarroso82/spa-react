# Instrucciones de Deploy a GitHub Pages


## Configuración Completada ✅

Tu aplicación ya está configurada para hacer deploy a GitHub Pages. Aquí están los pasos para completar el proceso:

### 1. Configuración del Repositorio

**IMPORTANTE**: Antes de hacer el deploy, necesitas actualizar la URL en `package.json`:

```json
{
  "homepage": "https://TU-USUARIO-GITHUB.github.io/spa-react"
}
```

Reemplaza `TU-USUARIO-GITHUB` con tu nombre de usuario real de GitHub.

### 2. Pasos para el Deploy

#### Opción A: Deploy Automático (Recomendado)
```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd spa-react

# 2. Haz el deploy (esto construye y sube automáticamente)
npm run deploy
```

#### Opción B: Deploy Manual
```bash
# 1. Construir la aplicación
npm run build

# 2. Hacer deploy solo de la carpeta build
npx gh-pages -d build
```

### 3. Configuración en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Pages**
3. En **Source**, selecciona **Deploy from a branch**
4. Selecciona **gh-pages** como branch
5. Guarda los cambios

### 4. Verificar el Deploy

Tu aplicación estará disponible en:
- `https://TU-USUARIO-GITHUB.github.io/spa-react`

### 5. Actualizaciones Futuras

Para actualizar tu aplicación:
```bash
# 1. Haz tus cambios
# 2. Commit los cambios
git add .
git commit -m "Update app"

# 3. Deploy
npm run deploy
```

## Características de tu Aplicación

- ✅ **Tema Oscuro** moderno y elegante
- ✅ **Optimizada para móviles** en formato apaisado
- ✅ **4 páginas**: Home, About, Services, Contact
- ✅ **Navegación horizontal** para móviles
- ✅ **Formulario de contacto** funcional
- ✅ **Responsive design** con Tailwind CSS
- ✅ **React Router** con HashRouter para GitHub Pages

## Solución de Problemas

### Si el deploy falla:
1. Verifica que tengas permisos de escritura en el repositorio
2. Asegúrate de que la URL en `package.json` sea correcta
3. Verifica que el build se complete sin errores

### Si las rutas no funcionan:
- Ya está configurado `HashRouter` para GitHub Pages
- Las rutas funcionarán como: `#/about`, `#/services`, etc.

### Si los estilos no se ven:
- Verifica que Tailwind CSS esté compilando correctamente
- El build debe incluir todos los estilos en la carpeta `build`

## Comandos Útiles

```bash
# Ver el estado del repositorio
git status

# Ver los commits
git log --oneline

# Ver las ramas
git branch -a

# Ver la configuración remota
git remote -v
```

¡Tu aplicación está lista para ser desplegada! 🚀
