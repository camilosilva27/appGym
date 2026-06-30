# AppGym

Sistema de gestión de clientes para gimnasios con recordatorios automáticos por WhatsApp.

## Stack

- **Frontend**: HTML/CSS/JS estático — Vercel
- **Backend**: Node.js + Express — Vercel (serverless)
- **Base de datos**: Supabase (PostgreSQL)
- **WhatsApp**: Meta WhatsApp Cloud API
- **Autenticación**: JWT + bcrypt

## Estructura

```
appGym/
├── backend/
│   ├── index.js          # Entry point, lógica de envío, cron endpoints
│   ├── routes.js         # Rutas API (clientes, login, envío manual)
│   ├── auth.js           # Middleware JWT
│   ├── whatsapp-cloud.js # Integración Meta WhatsApp Cloud API
│   ├── vercel.json       # Config Vercel: rutas + cron jobs
│   └── .env.example      # Variables de entorno requeridas
└── docs/
    └── index.html        # Frontend completo
```

## Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y completar:

```
PORT=3001
JWT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_DAY8=
WHATSAPP_TEMPLATE_DAY10=
```

## Setup local

```bash
cd backend
npm install
cp .env.example .env
# completar .env
npm run dev
```

Abrir `docs/index.html` en el browser.

## Deployment

- **Backend**: Vercel — importar repo, Root Directory: `backend`
- **Frontend**: Vercel — importar repo, Root Directory: `docs`
- Cargar variables de entorno en cada proyecto de Vercel

## Cron jobs

Configurados en `backend/vercel.json`, se ejecutan automáticamente:
- **Día 8** a las 9:00 AM (Argentina) — recordatorio de vencimiento próximo
- **Día 10** a las 9:00 AM (Argentina) — aviso de pago vencido

Solo envían a clientes con `pagado = false`.

## Base de datos (Supabase)

Tablas requeridas:

```sql
create table clients (
  id bigint primary key generated always as identity,
  nombre text not null,
  telefono text not null,
  pagado boolean default false,
  updated_at timestamptz
);

create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  gym_nombre text not null
);
```

## Pendiente

- Activar templates reales en `backend/index.js` (ver comentario TODO) cuando sean aprobados en Meta Business Manager
