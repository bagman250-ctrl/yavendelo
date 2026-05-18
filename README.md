# YaVendelo

Marketplace local para comprar, vender, guardar favoritos, conversar con vendedores y destacar publicaciones premium.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Scripts

```bash
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

## Variables Necesarias

Duplica `.env.example` como `.env.local` y configura Firebase, Mercado Pago y URL publica:

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
MERCADOPAGO_ACCESS_TOKEN=
FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=
```

`NEXT_PUBLIC_ADMIN_EMAIL` controla el acceso al panel de administracion en la app. Actualiza tambien `firestore.rules` si cambias el correo admin.

## Rutas Principales

- `/` catálogo, búsqueda y filtros.
- `/publicar` publicación guiada.
- `/producto/[id]` ficha pública de producto.
- `/perfil` administración de publicaciones.
- `/mensajes` y `/chat/[id]` conversaciones.
- `/boost/[id]` planes premium.
- `/terms`, `/privacy`, `/contacto` confianza y soporte.

## Verificación

Antes de publicar:

```bash
npm.cmd run lint
npm.cmd run build
```

## Firebase

El proyecto incluye reglas base de seguridad:

```bash
firebase deploy --only firestore:rules,storage
```

Archivos:

- `firestore.rules`
- `storage.rules`
- `firebase.json`

## Lanzamiento

- Configura variables de entorno en Vercel o en `.env.local`.
- Publica reglas de Firebase.
- Verifica Mercado Pago en sandbox con `/boost/[id]`.
- Prueba login, publicar, favoritos, mensajes y reportes.
- Usa `/api/health` como health check publico.
