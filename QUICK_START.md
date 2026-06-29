# ⚡ Quick Start - AppGym

## Pasos rápidos para empezar

### 1. Setup Supabase (5 min)

1. Ve a https://supabase.com/dashboard
2. "New Project" → elige proyecto
3. Copia **Project URL** y **anon key**
4. En SQL Editor, ejecuta el código de `docs/schema.sql`

### 2. Setup Backend

```bash
cd backend
npm install
```

Crea archivo `.env`:
```
PORT=3001
SUPABASE_URL=tu_url_aqui
SUPABASE_KEY=tu_key_aqui
```

```bash
npm run dev
```

**Escanea el QR de WhatsApp en terminal** (Linked Devices)

### 3. Abre Frontend

Abre `frontend/index.html` en tu navegador.

Listo. Ya funciona.

---

## Para producción

1. **Frontend**: Despliega `frontend/index.html` en Vercel o GitHub Pages
2. **Backend**: Despliega `backend/` en Railway o Render
3. Actualiza `API_URL` en `index.html` con la URL del backend deployado

---

## Mensajes automáticos

El backend envía mensajes automáticamente:
- **Día 8, 8:00 AM**: "Recordá que el día 10..."
- **Día 10, 8:00 AM**: "Pasaste la fecha límite..."

Solo a clientes con `pagado = false`.

Requiere que el backend esté activo 24/7 (por eso se recomienda Render/Railway).

---

## Preguntas frecuentes

**¿Funciona sin Claude?**  
Sí. Una vez deployado, funciona 100% independiente.

**¿Puedo cambiar los mensajes?**  
Sí, en `backend/index.js` funciones `sendMessagesDay8()` y `sendMessagesDay10()`.

**¿Cómo cambio la hora de envío?**  
En `backend/index.js`, modifica las líneas de `cron.schedule()`:
- `0 8 8 * *` = 8:00 AM día 8
- Cambia el `8` por la hora que quieras (formato 24hs)

**¿WhatsApp no conecta?**  
- Asegúrate de scanear el QR
- Usa la misma cuenta de WhatsApp
- Reinicia el backend si tarda mucho
