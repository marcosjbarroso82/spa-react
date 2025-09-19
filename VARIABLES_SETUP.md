# Configuración de Variables

## Variables Requeridas para AnswerFromImageUX

Para que la integración "Contestar por Imagen UX" funcione correctamente, necesitas configurar las siguientes variables en la sección de Configuración:

### Variables de Flowise

1. **ANALIZA_ENUNCIADO_URL**
   - Descripción: URL del endpoint de Flowise para analizar enunciados
   - Ejemplo: `https://flowise.ia-ai.com/api/v1/prediction/4a4a4a4a-4a4a-4a4a-4a4a-4a4a4a4a4a4a`

2. **RAG_CON_RESPUESTAS_URL**
   - Descripción: URL del endpoint de Flowise para RAG con respuestas
   - Ejemplo: `https://flowise.ia-ai.com/api/v1/prediction/5b5b5b5b-5b5b-5b5b-5b5b-5b5b5b5b5b5b`

3. **HERRAMIENTAS_CON_RESPUESTAS_URL**
   - Descripción: URL del endpoint de Flowise para herramientas con respuestas
   - Ejemplo: `https://flowise.ia-ai.com/api/v1/prediction/6c6c6c6c-6c6c-6c6c-6c6c-6c6c6c6c6c6c`

## Cómo Configurar

1. Ve a la página de **Configuración** en la aplicación
2. En la sección **Variables de Configuración**:
   - Haz clic en "Agregar Variable"
   - Ingresa la clave (ej: `ANALIZA_ENUNCIADO_URL`)
   - Ingresa el valor (la URL correspondiente)
   - Repite para las otras dos variables
3. Haz clic en "Guardar Variables"

## Credenciales Requeridas

También necesitas configurar las credenciales de Mathpix:

1. **mathpix_app_id**: Tu App ID de Mathpix
2. **mathpix_api_key**: Tu API Key de Mathpix

## Validación

- Si alguna variable o credencial falta, la aplicación mostrará un mensaje indicando qué configurar
- Las variables se validan antes de permitir el procesamiento de imágenes
- Todas las configuraciones se guardan en localStorage del navegador
