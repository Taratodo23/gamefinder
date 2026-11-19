# GameFinder

Aplicación web para descubrir videojuegos (con datos de [RAWG](https://rawg.io)) y armar una biblioteca personal guardada en Cloud Firestore.

Trabajo Práctico 2 — Desarrollo Frontend II (UADE).

- **App publicada:** _(completar con la URL de Vercel)_
- **Stack:** React + Vite, Firebase Authentication (anónima), Cloud Firestore y una función serverless de Vercel como intermediaria con RAWG.

## Funcionalidades

- **Descubrir:** juegos populares y búsqueda por nombre, con portada, géneros, plataformas y puntajes cuando RAWG los tiene.
- **Detalle:** descripción, fecha de lanzamiento, plataformas, desarrolladores y enlaces, más el botón para agregar el juego a la biblioteca.
- **Mi biblioteca:** juegos guardados en Firestore con filtros por estado (pendiente, jugando, completado, abandonado).
- **Edición:** cambiar estado, puntuación personal (0 a 5) y nota (hasta 500 caracteres).
- **Estados de interfaz:** carga, error con reintento, sin resultados, biblioteca vacía y mensajes de éxito o error.
- **Responsive:** barra lateral en escritorio y barra inferior en el celular.

## Estructura

```
api/rawg.js              Función serverless (Vercel): agrega la API Key y llama a RAWG
src/
  firebase.js            Inicialización de Firebase con variables VITE_FIREBASE_*
  services/library.js    Consultar, crear, editar y eliminar en Firestore
  services/rawg.js       Consumo de /api/rawg y normalización de datos
  mocks/games.js         Datos de prueba (solo con VITE_USE_MOCK_DATA=true)
  hooks/useAuth.js       Acceso anónimo
  hooks/useLibrary.js    Estado de la biblioteca y operaciones
  views/                 Discover, GameDetail y Library
  components/            Sidebar, GameCard, LibraryCard, EditModal, Toast, ui
  styles.css             Estilos y diseño responsive
firestore.rules          Reglas de seguridad de Firestore
docs/bitacora.md         Bitácora del proceso
```

## Datos en Firestore

Ruta: `users/{uid}/library/{gameId}`

| Campo | Tipo | Detalle |
|---|---|---|
| gameId | number | id del juego en RAWG (también es el id del documento) |
| title | string | nombre del juego |
| cover | string o null | URL de la portada |
| status | string | `pendiente`, `jugando`, `completado` o `abandonado` |
| rating | number | 0 a 5 (0 = sin puntuar) |
| note | string | hasta 500 caracteres |
| createdAt / updatedAt | timestamp | fecha del servidor |

## Requisitos

- Node.js 20 o superior
- Un proyecto de Firebase
- Una API Key de RAWG (gratuita en https://rawg.io/apidocs). Es opcional para empezar: sin ella se pueden usar los datos de prueba.

## Ejecutar en local

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
# completar .env
npm run dev
```

Abrir http://localhost:5173. Después de cambiar `.env` hay que reiniciar `npm run dev`.

### Variables de entorno

| Variable | Dónde se usa | ¿Llega al navegador? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase | Sí (es configuración web pública) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase | Sí |
| `VITE_FIREBASE_PROJECT_ID` | Firebase | Sí |
| `VITE_FIREBASE_APP_ID` | Firebase | Sí |
| `RAWG_API_KEY` | `api/rawg.js` y el proxy de desarrollo | **No** |
| `VITE_USE_MOCK_DATA` | `true` para usar los datos de prueba | Sí |

En desarrollo, `npm run dev` atiende `/api/rawg` con un plugin definido en `vite.config.js` que reutiliza el mismo código de `api/rawg.js`.

## Configurar Firebase

1. En [Firebase Console](https://console.firebase.google.com/), crear un proyecto. Google Analytics no hace falta.
2. Registrar una app web (botón `</>`) y copiar `apiKey`, `authDomain`, `projectId` y `appId` al `.env`.
3. En **Authentication → Sign-in method**, habilitar **Anónimo**.
4. En **Firestore Database**, crear la base (edición Standard, id `(default)`, región `southamerica-east1`) en **modo producción**.
5. En **Firestore → Reglas**, pegar el contenido de `firestore.rules` y **Publicar**.

## Publicar en Vercel

1. Importar el repositorio de GitHub en [Vercel](https://vercel.com/).
2. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
3. En **Settings → Environment Variables** (entorno Production), cargar las 4 variables `VITE_FIREBASE_*`, `RAWG_API_KEY` y `VITE_USE_MOCK_DATA=false`. `RAWG_API_KEY` va como variable sensible.
4. Hacer el deploy. Si después cambia alguna variable, usar **Redeploy**.

Las reglas de Firestore se publican en Firebase: el deploy de Vercel no las actualiza.

## Probar la integración

1. Agregar un juego desde Descubrir o desde el detalle → aparece en **Firestore → Datos**, en `users/{uid}/library/{gameId}`.
2. Recargar la página → el juego sigue en Mi biblioteca.
3. Editar estado, puntuación y nota → el documento cambia en Firestore y se actualiza `updatedAt`.
4. Eliminar → el documento desaparece de Firestore.

Cada navegador tiene su propio usuario anónimo, así que en otro dispositivo la biblioteca empieza vacía.

## Créditos

Datos e imágenes de videojuegos provistos por [RAWG](https://rawg.io). La app muestra ese crédito con un enlace activo en todas las pantallas.
