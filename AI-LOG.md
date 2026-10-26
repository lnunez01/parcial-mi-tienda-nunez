# Registro de Auditoría de IA (AI-LOG)

**Estudiante:** _NOMBRE COMPLETO_
**Evaluación:** Parcial — Mi Tienda
**Herramienta:** Claude Code (asistente de programación con IA)

## 1. Prompts Utilizados

- "Este es el parcial, guíame paso a paso" (adjuntando el PDF del enunciado).

## 2. Código Generado vs. Código Modificado

- **¿Qué generó la IA?:** La estructura del proyecto (Expo Router, Drizzle, Supabase), las pantallas,
  el repositorio de productos, el adaptador de SecureStore y `services/sync.ts`.
- **¿Qué se corrigió / ajustó durante el desarrollo?:**
  - **Totales con búsqueda:** la primera versión filtraba la búsqueda en la consulta SQL, así que el
    "valor total del inventario" cambiaba al buscar. Se movió el filtro al hook para que los totales
    siempre sean de todo el inventario y la búsqueda solo afecte la lista.
  - **`babel-preset-expo` no resolvía:** npm no lo dejó en la raíz de `node_modules`, y
    `babel.config.js` (necesario para importar los `.sql` de las migraciones) fallaba. Se instaló
    como dependencia de desarrollo con la versión que trae el SDK.
  - **Sincronización concurrente:** se agregó una `ref` en `useSync` para que el botón y la
    sincronización automática no corran a la vez y dupliquen trabajo.
  - **`syncedAt` = `updatedAt` subido** (no `new Date()`): si el producto se edita mientras se sube,
    sigue quedando pendiente.

## 3. Alucinaciones o Errores Detectados

- Es común que la IA proponga `AsyncStorage` para la sesión de Supabase; el parcial lo prohíbe. Se usó
  SecureStore con un adaptador por fragmentos (límite de ~2 KB por valor).
- Importar `expo-crypto` en `db/schema.ts` rompe `drizzle-kit generate` (Node no entiende el código de
  Expo). El UUID se genera en el repositorio con `Crypto.randomUUID()`.
- `npx expo install` no pudo consultar la API de Expo en el entorno; en vez de instalar `@latest`
  se usaron las versiones de `expo/bundledNativeModules.json`, compatibles con el SDK 57.

## 4. Verificación

- `npx tsc --noEmit` y `npx expo lint`: sin errores.
- `npx drizzle-kit generate`: migración `drizzle/0000_*.sql` generada.
- `npx expo export --platform ios`: el bundle compila e incluye la migración.
- Pruebas en el teléfono: _completar_.
