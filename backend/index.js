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

// WhatsApp disabled for now (manual sending via API)
// initializeWhatsApp().catch(console.error);

// Manual message sending
export async function sendMessagesManual(messageType) {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pagado', false);

    if (error) throw error;

    let msg = '';
    if (messageType === 'day8') {
      msg = 'Buenos días, recordá que el día 10 es el límite para el pago. Muchas gracias!';
    } else if (messageType === 'day10') {
      msg = 'Buenos días, pasaste la fecha límite para el pago. Intenta efectuar el pago lo antes posible. Muchas gracias';
    }

    for (const client of clients) {
      console.log(`Mensaje enviado a ${client.nombre} (${client.telefono}): ${msg}`);
      // Aquí van los mensajes reales cuando implementes WhatsApp
    }

    return { success: true, sent: clients.length, message: msg };
  } catch (error) {
    console.error('Error enviando mensajes:', error);
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
