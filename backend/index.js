import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendTemplateMessage } from './whatsapp-cloud.js';
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

// Formats Argentine phone numbers to WhatsApp Cloud API format (no '+')
// Example: 1123456789 -> 541123456789
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('9')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('54')) cleaned = '54' + cleaned;
  return cleaned;
}

export async function sendMessagesManual(messageType) {
  console.log(`\n🚀 INICIANDO ENVÍO - Tipo: ${messageType}\n`);

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('pagado', false);

  if (error) throw error;

  console.log(`📋 Clientes no pagados: ${clients.length}`);

  // TODO: switch to real templates once approved in Meta Business Manager
  // const templateName = messageType === 'day8'
  //   ? process.env.WHATSAPP_TEMPLATE_DAY8
  //   : process.env.WHATSAPP_TEMPLATE_DAY10;
  const templateName = 'hello_world';

  let sent = 0;
  for (const client of clients) {
    const phone = formatPhoneNumber(client.telefono);
    console.log(`\n👤 ${client.nombre} → ${phone}`);
    try {
      const clientParam = templateName === 'hello_world' ? null : client.nombre;
      await sendTemplateMessage(phone, templateName, clientParam);
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
