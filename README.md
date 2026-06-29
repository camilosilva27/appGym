# AppGym - Gestor de Clientes de Gimnasio

App simple para gestionar clientes de un gimnasio, registrar pagos y enviar recordatorios por WhatsApp automáticamente.

## Características

- ✅ ABM (Alta, Baja, Modificación) de clientes
- ✅ Registro de estado de pago (pagado/no pagado)
- ✅ Mensajes automáticos WhatsApp:
  - Día 8: Recordatorio de pago
  - Día 10: Aviso de atraso
- ✅ Sin depender de servicios de IA

## Stack Tecnológico

- **Frontend**: HTML + CSS + Vanilla JS (sin dependencias)
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL gratuito)
- **WhatsApp**: Baileys (automatización, gratis)
- **Scheduler**: node-cron (ejecuta tareas automáticamente)

## Setup Local

### 1. Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (gratis)
- Cuenta de WhatsApp

### 2. Clonar y configurar backend

```bash
cd appGym/backend
npm install
cp .env.example .env
```

### 3. Configurar variables de entorno (`.env`)

```
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
WHATSAPP_PHONE_NUMBER=+54xxxxxxx
WHATSAPP_SESSION_NAME=appgym-session
```

**Cómo obtener credenciales de Supabase:**
1. Ir a https://supabase.com
2. Crear proyecto nuevo
3. En Settings > API, copiar URL y anon key
4. Crear tabla `clients` con estas columnas:
   - `id` (bigint, PK)
   - `nombre` (text)
   - `telefono` (text)
   - `pagado` (boolean, default false)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

SQL para crear tabla:
```sql
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Inicializar WhatsApp

Cuando inicies el backend por primera vez, Baileys genera un QR en la terminal. Escanealo con WhatsApp (Linked Devices).

### 5. Iniciar backend

```bash
npm run dev
```

### 6. Abrir frontend

Abre `frontend/index.html` en el navegador (o usa live server).

## Deployment

### Frontend - Vercel (Gratis)

```bash
cd frontend
# Copia el contenido de index.html
# Ve a https://vercel.com > New Project > HTML
# Pega el código
```

O arrastra el archivo `index.html` a Vercel.

### Backend - Railway (Gratis + $5/mes)

1. Ir a https://railway.app
2. Conectar repo GitHub
3. Crear PostgreSQL en Railway
4. Crear Node.js app
5. Agregar variables de entorno
6. Deploy automático

**Alternativa**: Render.com (también gratis)

## Uso

1. **Agregar clientes**: Nombre + Teléfono + Marcar "Pagado" si corresponde
2. **Marcar pagos**: Click el checkbox "Pagado" en la tabla
3. **Eliminar**: Click botón rojo
4. **Mensajes automáticos**: El backend envía automáticamente días 8 y 10

## Estructura

```
appGym/
├── frontend/
│   └── index.html          # UI completa (HTML + CSS + JS)
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── index.js            # Servidor + schedulers
│   ├── routes.js           # Endpoints CRUD
│   └── whatsapp.js         # Conexión Baileys
├── docs/
│   └── schema.sql          # SQL tabla
└── README.md
```

## Troubleshooting

**"Error de CORS"**
- El backend corre en `:3001`, el frontend en `:3000` (o archivo local)
- CORS ya está habilitado en `index.js`

**"No conecta WhatsApp"**
- Asegúrate de scanear el QR en terminal al iniciar
- Usa la misma cuenta de WhatsApp donde vas a enviar mensajes

**"Mensajes no se envían automáticamente"**
- Verifica que backend esté corriendo
- Checkea logs en terminal
- Asegúrate que Supabase está actualizado

## Notas

- Los mensajes se envían automáticamente **si el backend está corriendo**
- Para producción, despliega el backend en un servidor (Railway, Render, etc.)
- No necesitas Claude después del deployment; todo funciona independientemente
- Los números de teléfono deben estar en formato: `+54XXXXXXXXXX`

## Licencia

Libre de usar. Made with ❤️
