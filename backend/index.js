import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendTextMessage, checkSession } from './whatsapp-waha.js';
import { setupRoutes } from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Cron endpoints — triggered by Vercel Cron (see vercel.json). Registered
// before setupRoutes() so they're NOT covered by the JWT-based verifyToken
// middleware: Vercel Cron can't supply a user JWT, so these check CRON_SECRET
// instead (Vercel sends it as Authorization: Bearer <CRON_SECRET> when the
// env var is configured on the project).
function verifyCronSecret(req, res, next) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || req.headers.authorization !== expected) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

app.post('/api/cron/keepalive', verifyCronSecret, async (req, res) => {
  await supabase.from('clients').select('id').limit(1);
  res.json({ ok: true });
});

app.post('/api/cron/monthly-reset', verifyCronSecret, async (req, res) => {
  console.log('⏰ CRON: Archivado + reset mensual');
  try {
    const result = await runMonthlyReset();
    console.log('✅ Archivado:', result);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/cron/day8', verifyCronSecret, async (req, res) => {
  console.log('⏰ CRON: Envío automático día 8');
  try {
    const result = await sendMessagesManual('day8');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/cron/day10', verifyCronSecret, async (req, res) => {
  console.log('⏰ CRON: Envío automático día 10');
  try {
    const result = await sendMessagesManual('day10');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

setupRoutes(app);

// Formats Argentine phone numbers to WhatsApp format: 549XXXXXXXXXX (13 digits)
// Works regardless of how the number was stored (with/without country code or '9')
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('549')) return cleaned;
  if (cleaned.startsWith('54')) return '549' + cleaned.substring(2);
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('9')) return '54' + cleaned;
  return '549' + cleaned;
}

export async function sendMessagesManual(messageType) {
  console.log(`\n🚀 INICIANDO ENVÍO - Tipo: ${messageType}\n`);

  await checkSession();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('pagado', false);

  if (error) throw error;

  console.log(`📋 Clientes no pagados: ${clients.length}`);

  const messages = {
    day8: (nombre) => `Hola ${nombre}! 👋 Te recordamos que el pago de este mes aún no fue registrado. Podés acercarte al gimnasio cuando quieras. Gracias!`,
    day10: (nombre) => `Hola ${nombre}! 👋 Ya son los 10 del mes y todavía no registramos tu pago. Cualquier consulta, estamos a tu disposición. Gracias!`,
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let sent = 0;
  const results = [];
  for (const client of clients) {
    const phone = formatPhoneNumber(client.telefono);
    console.log(`\n👤 ${client.nombre} → ${phone}`);
    try {
      const text = messages[messageType](client.nombre);
      await sendTextMessage(phone, text);
      sent++;
      console.log(`   ✅ Enviado`);
      results.push({ nombre: client.nombre, phone, ok: true });
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      results.push({ nombre: client.nombre, phone, ok: false, error: err.message });
    }
    await delay(1500);
  }

  console.log(`\n✅ RESUMEN: ${sent}/${clients.length} mensajes enviados\n`);
  return { success: true, sent, total: clients.length, results };
}

// Archives the month that just ended into payment_history, then resets
// pagado=false for the new month. Run by the day-1 cron (see vercel.json).
export async function runMonthlyReset() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mes = prev.getMonth() + 1;
  const anio = prev.getFullYear();

  const { data: clients, error } = await supabase.from('clients').select('id, nombre, pagado');
  if (error) throw error;

  const history = clients.map(c => ({ client_id: c.id, nombre: c.nombre, mes, anio, pagado: c.pagado }));
  const { error: histError } = await supabase
    .from('payment_history')
    .upsert(history, { onConflict: 'client_id,mes,anio' });
  if (histError) throw histError;

  const { error: resetError } = await supabase
    .from('clients')
    .update({ pagado: false, updated_at: new Date() })
    .gt('id', 0);
  if (resetError) throw resetError;

  return { archived: history.length, mes, anio };
}

export default app;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
