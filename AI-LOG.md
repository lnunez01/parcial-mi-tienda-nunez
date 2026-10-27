# Registro de Auditoría de IA (AI-LOG)

**Estudiante:** Luis Fernando Nuñez Cuello (0182220049)
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
  se usaron las versiones de `expo/bundledNativeModules.json`, compatibles con el SDK del proyecto.
- Expo Go en iOS se actualizó al SDK 58 durante el parcial y ya no abría el proyecto (SDK 57). Se actualizó
  el proyecto a SDK 58 con las versiones de `expo/bundledNativeModules.json` (React 19.3, React Native 0.88).

## 4. Verificación

- `npx tsc --noEmit` y `npx expo lint`: sin errores.
- `npx drizzle-kit generate`: migración `drizzle/0000_*.sql` generada.
- `npx expo export --platform ios`: el bundle compila e incluye la migración.
- Pruebas en iPhone con Expo Go (capturas en `capturas/`):
  - Registro con validación ("Las contraseñas no coinciden") y luego cuenta creada con sesión iniciada.
  - CRUD de productos; al sincronizar: "3 subidos, 0 bajados".
  - En modo avión se creó "panela" (⏳ Pendiente) y Sincronizar mostró "Sin conexión a internet".
  - Al quitar el modo avión se sincronizó solo: "Conexión recuperada: 2 subidos, 0 bajados"
    (panela y la edición de arroz diana).
  - En Supabase hay 4 filas para 4 productos: el upsert por `client_id` no duplicó la edición.
- Corrección durante las pruebas: en iOS el encabezado nativo es transparente y tapaba el campo
  Correo del Registro; se agregó `contentInsetAdjustmentBehavior="automatic"` a las listas y formularios.
