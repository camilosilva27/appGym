# Guía del proyecto AppGym

## Qué hace la app

Panel web para que el empleado del gimnasio marque quién pagó y quién no. Los días 8 y 10 de cada mes, el sistema manda automáticamente un mensaje de WhatsApp a todos los clientes que no pagaron. También se puede mandar manualmente desde el panel.

## Arquitectura

```
[Frontend — Vercel]  →  [Backend — Vercel]  →  [Supabase — DB]
                                ↓
                        [WAHA — Fly.io]
                                ↓
                        [WhatsApp del gym]
```

- El frontend es una página HTML estática en Vercel.
- El backend es Node.js/Express corriendo como serverless en Vercel.
- La base de datos es PostgreSQL en Supabase.
- WAHA es un servidor que mantiene una sesión de WhatsApp Web abierta en Fly.io.

---

## Archivos del backend (`backend/`)

### `index.js`
El núcleo del backend. Hace tres cosas:
1. Configura el servidor Express (CORS, JSON, rutas).
2. Define `sendMessagesManual(messageType)` — la función que busca clientes sin pagar en Supabase y manda el mensaje a cada uno por WAHA.
3. Expone los endpoints de cron: `/api/cron/day8`, `/api/cron/day10`, `/api/cron/keepalive`.

**Cuándo editarlo:** para cambiar el texto de los mensajes, ajustar el delay entre mensajes, o tocar la lógica de envío.

Los mensajes están definidos así:
```javascript
const messages = {
  day8: (nombre) => `Hola ${nombre}! 👋 Te recordamos que el pago...`,
  day10: (nombre) => `Hola ${nombre}! 👋 Ya son los 10 del mes...`,
};
```

También tiene `formatPhoneNumber()` que convierte cualquier formato de teléfono argentino al formato que necesita WhatsApp (`549XXXXXXXXXX`).

---

### `routes.js`
Define todas las rutas HTTP de la API:

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/api/login` | Verifica usuario/contraseña, devuelve JWT |
| GET | `/api/clients` | Lista todos los clientes ordenados por nombre |
| POST | `/api/clients` | Crea un cliente nuevo |
| PUT | `/api/clients/:id` | Actualiza nombre, teléfono o estado de pago |
| DELETE | `/api/clients/:id` | Elimina un cliente |
| POST | `/api/send-messages` | Dispara envío manual (day8 o day10) |

Todas las rutas excepto login requieren el token JWT en el header `Authorization: Bearer <token>`.

**Cuándo editarlo:** para agregar nuevas rutas o cambiar la lógica de alguna existente.

---

### `auth.js`
Middleware que valida el JWT en cada request protegido. Si el token no existe o es inválido, devuelve 401. No necesitás tocarlo nunca a menos que cambies el sistema de autenticación.

---

### `whatsapp-waha.js`
Contiene dos funciones:
- `checkSession()` — verifica que la sesión de WhatsApp esté activa antes de intentar enviar. Si la sesión está caída, falla rápido con un error claro.
- `sendTextMessage(phone, text)` — manda un mensaje de texto al número dado. Reintenta hasta 3 veces con 3 segundos de espera entre intentos si falla.

**Cuándo editarlo:** si cambiás el nombre de la sesión de WAHA, o si querés ajustar la cantidad de reintentos.

---

### `whatsapp-cloud.js`
La integración original con la API oficial de Meta/WhatsApp. **Ya no se usa** — fue reemplazada por WAHA. Se puede borrar pero no molesta.

---

### `vercel.json`
Configuración de Vercel: cómo buildear el proyecto y cuándo correr los cron jobs.

```json
"crons": [
  { "path": "/api/cron/day8",      "schedule": "0 12 8 * *"   },  // día 8, 12:00 UTC = 9:00 AM Argentina
  { "path": "/api/cron/day10",     "schedule": "0 12 10 * *"  },  // día 10, igual
  { "path": "/api/cron/keepalive", "schedule": "0 10 * * 1,4" }   // lunes y jueves para que Supabase no se pause
]
```

**Cuándo editarlo:** si querés cambiar el horario de envío o agregar más crons.

---

### `.env`
Variables de entorno para correr el backend localmente. **No se sube a git.**

```
JWT_SECRET                  # clave para firmar los tokens de sesión
SUPABASE_URL                # URL del proyecto en Supabase
SUPABASE_KEY                # clave anon de Supabase
WAHA_URL                    # URL de WAHA en Fly.io
WAHA_API_KEY                # clave de autenticación de WAHA
WAHA_SESSION                # nombre de la sesión de WhatsApp en WAHA
WHATSAPP_TEMPLATE_DAY8      # (ya no se usa, era para Meta)
WHATSAPP_TEMPLATE_DAY10     # (ya no se usa, era para Meta)
```

Las mismas variables tienen que estar cargadas en Vercel → Settings → Environment Variables para que funcionen en producción.

---

### `package.json`
Dependencias del proyecto. Las principales:
- `express` — framework web
- `@supabase/supabase-js` — cliente de Supabase
- `bcryptjs` — para hashear contraseñas
- `jsonwebtoken` — para crear y verificar JWTs
- `node-fetch` — para hacer requests HTTP a WAHA
- `dotenv` — para leer el archivo `.env`

---

## Frontend (`docs/`)

### `index.html`
Toda la interfaz en un solo archivo HTML/CSS/JS. Sin frameworks, sin build. Incluye:
- Pantalla de login
- Tabla de clientes con búsqueda por nombre
- Toggle de pagado/no pagado por cliente
- Botones de envío manual (día 8 y día 10)
- Log de resultados de envío (muestra qué número se usó para cada cliente y si llegó o no)

La variable `API_URL` al principio del script apunta al backend en Vercel. Si el backend cambia de URL, hay que actualizarla ahí.

**Cuándo editarlo:** para cambiar el diseño, agregar campos, o modificar el comportamiento de la interfaz.

---

## WAHA (`evolution-fly/`)

### `fly.toml`
Configuración del servidor WAHA en Fly.io:
- `WHATSAPP_DEFAULT_ENGINE = "NOWEB"` — usa Baileys en lugar de Chromium (más liviano)
- `WAHA_API_KEY` — clave para autenticar requests al servidor
- `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` — credenciales del panel web
- `min_machines_running = 1` y `auto_stop_machines = false` — la máquina corre 24/7
- El volumen `evolution_data` montado en `/app/.sessions` guarda la sesión de WhatsApp para que sobreviva reinicios

### `Dockerfile`
Una sola línea: `FROM devlikeapro/waha:latest`. Solo existe porque Fly.io no podía descargar la imagen directamente.

---

## Base de datos (Supabase)

Dos tablas:

**`clients`**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | clave primaria |
| nombre | text | nombre del cliente |
| telefono | text | teléfono (cualquier formato) |
| pagado | boolean | si pagó este mes |
| updated_at | timestamp | última modificación |

**`users`**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | clave primaria |
| username | text | usuario para el login |
| password_hash | text | contraseña hasheada con bcrypt |
| gym_nombre | text | nombre del gimnasio (se muestra en el panel) |

---

## Tareas de mantenimiento

**Si la sesión de WhatsApp se desconecta:**
1. Entrar a `https://appgym-whatsapp-service.fly.dev/dashboard`
2. Usuario: `admin` / Contraseña: `appgym2026`
3. Reconectar la sesión y escanear el QR con el teléfono del gimnasio

**Si hay que cambiar el mensaje que se envía:**
Editar `backend/index.js`, el objeto `messages` cerca de la línea 48.

**Si hay que agregar un usuario nuevo al panel:**
Insertar directamente en la tabla `users` de Supabase con la contraseña hasheada con bcrypt.

**Si Supabase pausa el proyecto:**
Entrar a `supabase.com`, ir al proyecto, y reactivarlo. El cron de keepalive (lunes y jueves) debería prevenir que esto pase.
