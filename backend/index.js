import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { initializeWhatsApp, sendWhatsAppMessage } from './whatsapp.js';
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

// Initialize WhatsApp (run on startup)
initializeWhatsApp().catch(console.error);

// Scheduler: Día 8 a las 08:00
cron.schedule('0 8 8 * *', async () => {
  console.log('Ejecutando envío de mensajes - Día 8');
  await sendMessagesDay8();
});

// Scheduler: Día 10 a las 08:00
cron.schedule('0 8 10 * *', async () => {
  console.log('Ejecutando envío de mensajes - Día 10');
  await sendMessagesDay10();
});

async function sendMessagesDay8() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pagado', false);

    if (error) throw error;

    for (const client of clients) {
      const msg = 'Buenos días, recordá que el día 10 es el límite para el pago. Muchas gracias!';
      await sendWhatsAppMessage(client.telefono, msg);
      console.log(`Mensaje enviado a ${client.nombre}`);
    }
  } catch (error) {
    console.error('Error en envío día 8:', error);
  }
}

async function sendMessagesDay10() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pagado', false);

    if (error) throw error;

    for (const client of clients) {
      const msg = 'Buenos días, pasaste la fecha límite para el pago. Intenta efectuar el pago lo antes posible. Muchas gracias';
      await sendWhatsAppMessage(client.telefono, msg);
      console.log(`Mensaje enviado a ${client.nombre}`);
    }
  } catch (error) {
    console.error('Error en envío día 10:', error);
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
