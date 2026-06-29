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
DATABASE_URL=postgresql://user:password@localhost:5432/appgym
WHATSAPP_SESSION_NAME=appgym-session
```

**Para desarrollo local:**
1. Instala PostgreSQL localmente
2. Crea base de datos: `createdb appgym`
3. Ejecuta `docs/schema.sql` en tu PostgreSQL
4. Actualiza DATABASE_URL en `.env`

**Para producción (Render):**
1. En Render, crea PostgreSQL
2. Copia la "Internal Database URL"
3. Pega en `DATABASE_URL` en variables de entorno

### 4. Inicializar WhatsApp

Cuando inicies el backend por primera vez, Baileys genera un QR en la terminal. Escanealo con WhatsApp (Linked Devices).

### 5. Iniciar backend

```bash
npm run dev
```

### 6. Abrir frontend

Abre `frontend/index.html` en el navegador (o usa live server).

## Deployment

### Backend - Render (Gratis)

1. Ve a https://render.com
2. Crea **PostgreSQL** (Plan: Free)
   - Copia "Internal Database URL"
3. Crea **Web Service** desde tu repo GitHub
   - Build: `npm install`
   - Start: `node index.js`
   - Agrega variable: `DATABASE_URL` = URL de PostgreSQL
4. Deploy automático

**La tabla se crea automáticamente en el primer inicio** (o ejecuta `docs/schema.sql` en Render DB).

### Frontend - Vercel (Gratis)

1. Despliega `frontend/index.html` en Vercel
2. Actualiza `API_URL` en `index.html` con la URL del backend en Render

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
