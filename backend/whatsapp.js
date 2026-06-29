import pino from 'pino';
import qrcode from 'qrcode-terminal';

let sock;
let isReconnecting = false;

export async function initializeWhatsApp() {
  if (isReconnecting) return;

  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('baileys');

    const logger = pino({ level: 'silent' });
    const sessionPath = './whatsapp_session';

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    sock = makeWASocket({
      auth: state,
      logger,
      browser: ['appGym', 'Chrome', '120.0.0.0'],
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('Escanea el código QR con WhatsApp (Linked Devices):');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`Conexión cerrada (código ${statusCode}). ${loggedOut ? 'Sesión cerrada, no se reconecta.' : 'Reconectando...'}`);

        if (!loggedOut) {
          isReconnecting = true;
          setTimeout(() => {
            isReconnecting = false;
            initializeWhatsApp();
          }, 3000);
        }
      } else if (connection === 'open') {
        isReconnecting = false;
        console.log('WhatsApp conectado exitosamente');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    console.log('WhatsApp inicializado');
  } catch (error) {
    console.error('Error inicializando WhatsApp:', error);
    isReconnecting = false;
  }
}

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!sock) {
      throw new Error('WhatsApp no está inicializado');
    }

    // Format: 5491234567890@s.whatsapp.net (Argentina format, adjust as needed)
    const jid = phoneNumber.replace(/\D/g, '') + '@s.whatsapp.net';

    await sock.sendMessage(jid, { text: message });
    return true;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return false;
  }
}
