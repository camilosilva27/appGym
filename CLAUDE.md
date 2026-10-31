# AppGym — Contexto para agentes

## Qué es

App de gestión de clientes para gimnasios. Permite registrar clientes, marcar pagos, y enviar recordatorios automáticos por WhatsApp los días 8 y 10 de cada mes a quienes no pagaron.

## Stack

- **Frontend**: `docs/index.html` — HTML/CSS/JS puro, sin framework, sin build
- **Backend**: `backend/` — Node.js + Express, deployado en Vercel como serverless
- **DB**: Supabase (PostgreSQL). Cliente inicializado en `backend/index.js`
- **WhatsApp**: Meta WhatsApp Cloud API — `backend/whatsapp-cloud.js`
- **Auth**: JWT (jsonwebtoken) + bcrypt (bcryptjs). Middleware en `backend/auth.js`
- **Cron**: Vercel Cron Jobs definidos en `backend/vercel.json`

## Archivos clave

| Archivo | Rol |
|---|---|
| `backend/index.js` | Entry point. Exporta `app` (para Vercel) y `sendMessagesManual`. Define cron endpoints `/api/cron/day8` y `/api/cron/day10` |
| `backend/routes.js` | Todas las rutas API. Login sin auth, resto protegido con `verifyToken` |
| `backend/auth.js` | Middleware `verifyToken` — valida JWT en header `Authorization: Bearer <token>` |
| `backend/whatsapp-cloud.js` | `sendTemplateMessage(phone, templateName, clientName?)` — llama a Meta Graph API v20.0 |
| `backend/vercel.json` | Rutas Express + cron schedule (día 8 y 10 a las 12:00 UTC = 9:00 AM Argentina) |
| `docs/index.html` | Frontend completo. `API_URL` apunta al backend en Vercel |

## Rutas API

```
POST /api/login              — sin auth, devuelve JWT + gym_nombre
GET  /api/clients            — lista todos ordenados por nombre
POST /api/clients            — crea cliente { nombre, telefono, pagado }
PUT  /api/clients/:id        — actualiza { nombre, telefono, pagado }
DELETE /api/clients/:id      — elimina cliente
POST /api/send-messages      — envío manual { messageType: 'day8' | 'day10' }
GET  /api/payment-history    — histórico mensual de pagos (para el reporte de morosidad)
POST /api/cron/day8          — llamado por Vercel Cron día 8
POST /api/cron/day10         — llamado por Vercel Cron día 10
POST /api/cron/monthly-reset — llamado por Vercel Cron día 1: archiva el mes anterior en payment_history y resetea pagado=false
```

Los `/api/cron/*` NO usan JWT (Vercel Cron no puede mandar uno) — se protegen con `CRON_SECRET` vía middleware `verifyCronSecret` en `backend/index.js`, registrados antes de `setupRoutes()` para no heredar el `verifyToken` global.

## Supabase — tablas

**clients**: `id`, `nombre`, `telefono`, `pagado` (bool), `updated_at`

**users**: `id` (uuid), `username`, `password_hash`, `gym_nombre`

**payment_history**: `id`, `client_id` (FK a clients, `ON DELETE SET NULL`), `nombre` (snapshot), `mes`, `anio`, `pagado`, `created_at` — snapshot mensual generado por `runMonthlyReset()`

## Variables de entorno

Definidas en `backend/.env` localmente y en Vercel como Environment Variables:

```
JWT_SECRET
CRON_SECRET                # requerido por los endpoints /api/cron/* — Vercel lo manda como Authorization: Bearer <CRON_SECRET>
SUPABASE_URL
SUPABASE_KEY
WHATSAPP_ACCESS_TOKEN      # expira cada 24hs en modo dev, usar System User en producción
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TEMPLATE_DAY8     # nombre del template aprobado en Meta
WHATSAPP_TEMPLATE_DAY10    # nombre del template aprobado en Meta
```

## Estado actual de WhatsApp

Los templates `pago_recordatorio_dia8` y `pago_recordatorio_dia10` están enviados a revisión en Meta Business Manager. Mientras tanto, el código usa `hello_world` (template de prueba en inglés, sin variables).

Para activar los templates reales cuando sean aprobados, editar `backend/index.js` y descomentar el bloque marcado con `TODO`.

## Deployment

- **Backend**: Vercel project con Root Directory = `backend`
- **Frontend**: Vercel project con Root Directory = `docs`
- Redeploy automático en cada push a `main`

## Formato de teléfonos

Argentina: el backend convierte cualquier formato a `54XXXXXXXXXX` (sin `+`) antes de llamar a la API de WhatsApp. Ver `formatPhoneNumber()` en `backend/index.js`.

## Diseño del frontend (rediseño UI, rama `rediseno-ui`)

- Todo el CSS vive en el `<style>` de `docs/index.html`; tokens en `:root` al principio (`--ground #fbf7f8`, `--accent #b8336a` frambuesa, `--accent-soft/--accent-track` tintes, pills `--pill-*`, radios 8/6px, controles 36px, 44px en teléfono). Tipografía DM Sans (Google Fonts).
- Estilo "accent-ladder" de taste-skill (app screens): el tono pleno sólo en marcas chicas (botón primario, barra de cuotas, interruptor, foco); tintes pálidos en áreas; sin sombras en reposo (sólo el toast `#message`), bordes 1px, sin emoji.
- Estructura: barra superior (marca + `#gymNombre` + Salir) → título "Cuotas de <mes>" con la frase de hallazgo (`#monthFinding`) → panel resumen (pagaron X de N + tira del mes con día 8 / día 10 / hoy + botones de envío y `#sendLog`) → alta de cliente (plegada en teléfono, `toggleAddForm`) → tabs Clientes / Histórico (`showView` delega en `toggleHistoryView`).
- `renderSummary()` y `renderMonthStrip()` sólo leen `allClients` / la fecha local; no hay endpoints nuevos. `loadClients()` ahora llama a `filterClients()` (respeta la búsqueda activa) en vez de `renderClients(allClients)`.
- Teléfono (≤640px): las tablas se vuelven filas de dos líneas por CSS grid (clases `c-name`, `c-phone`, `c-status`, `c-pay`, `actions-cell`; histórico `h-*`). Se conservan los ids que usa el JS (`row-<id>`, `nombre-<id>`, `telefono-<id>`, `.actions-cell`).

## Modo demo
`?demo` en la URL (https://camilosilva27.github.io/appGym/?demo) carga `docs/demo-mock.js` antes del script principal: reemplaza `fetch` por un backend simulado en memoria (12 clientes de ejemplo, histórico de 5 meses, envíos simulados), persistido en localStorage del navegador (`appgym-demo-v1`; `resetDemo()` en consola lo reinicia). Nunca toca el backend real. Si se agrega un endpoint nuevo, sumarlo también al mock.
