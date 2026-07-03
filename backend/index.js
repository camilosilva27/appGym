import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendTextMessage } from './whatsapp-waha.js';
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

setupRoutes(app);

// Formats Argentine phone numbers to WhatsApp format: 549XXXXXXXXXX (13 digits)
// Works regardless of how the number was stored (with/without country code or '9')
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('549')) return cleaned;
  if (cleaned.startsWith('54')) return '549' + cleaned.substring(2);
  if (cleaned.startsWith('9')) return '54' + cleaned;
  return '549' + cleaned;
}

export async function sendMessagesManual(messageType) {
  console.log(`\n🚀 INICIANDO ENVÍO - Tipo: ${messageType}\n`);

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

  let sent = 0;
  for (const client of clients) {
    const phone = formatPhoneNumber(client.telefono);
    console.log(`\n👤 ${client.nombre} → ${phone}`);
    try {
      const text = messages[messageType](client.nombre);
      await sendTextMessage(phone, text);
      sent++;
      console.log(`   ✅ Enviado`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ RESUMEN: ${sent}/${clients.length} mensajes enviados\n`);
  return { success: true, sent, total: clients.length };
}

// Cron endpoints — triggered by Vercel Cron (see vercel.json)
app.post('/api/cron/day8', (req, res) => {
  console.log('⏰ CRON: Envío automático día 8');
  sendMessagesManual('day8').catch(console.error);
  res.json({ ok: true });
});

app.post('/api/cron/day10', (req, res) => {
  console.log('⏰ CRON: Envío automático día 10');
  sendMessagesManual('day10').catch(console.error);
  res.json({ ok: true });
});

export default app;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
