import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { sendWhatsAppMessage } from './twilio.js';
import { setupRoutes } from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup routes
setupRoutes(app);

// Twilio initialized (no setup needed, uses env vars)

// Format phone number: 1123456789 -> +541123456789
function formatPhoneNumber(phone) {
  // Remove non-digits
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 9, remove it (porque +549...)
  if (cleaned.startsWith('9')) {
    cleaned = cleaned.substring(1);
  }

  // Add +54 if not present
  if (!cleaned.startsWith('54')) {
    cleaned = '54' + cleaned;
  }

  return '+' + cleaned;
}

// Manual message sending
export async function sendMessagesManual(messageType) {
  try {
    console.log(`\n🚀 INICIANDO ENVÍO - Tipo: ${messageType}\n`);

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pagado', false);

    if (error) throw error;

    console.log(`📋 Clientes encontrados: ${clients.length}`);
    console.log(`📊 No pagados: ${clients.map(c => c.nombre).join(', ')}\n`);

    let msg = '';
    if (messageType === 'day8') {
      msg = 'Buenos días, recordá que el día 10 es el límite para el pago. Muchas gracias!';
    } else if (messageType === 'day10') {
      msg = 'Buenos días, pasaste la fecha límite para el pago. Intenta efectuar el pago lo antes posible. Muchas gracias';
    }

    let sent = 0;
    for (const client of clients) {
      const phone = formatPhoneNumber(client.telefono);
      console.log(`\n👤 Cliente: ${client.nombre}`);
      console.log(`   Teléfono original: ${client.telefono}`);
      console.log(`   Teléfono formateado: ${phone}`);

      const success = await sendWhatsAppMessage(phone, msg);
      if (success) sent++;
    }

    console.log(`\n✅ RESUMEN: ${sent}/${clients.length} mensajes enviados\n`);
    return { success: true, sent, total: clients.length, message: msg };
  } catch (error) {
    console.error('\n❌ Error enviando mensajes:', error);
    throw error;
  }
}

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
