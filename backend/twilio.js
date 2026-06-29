import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    console.log(`\n📤 TWILIO: Intentando enviar a ${phoneNumber}`);
    console.log(`   Desde: whatsapp:${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`   Mensaje: "${message}"`);

    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✓ TWILIO: Mensaje enviado exitosamente (SID: ${msg.sid})\n`);
    return true;
  } catch (error) {
    console.error(`✗ TWILIO ERROR a ${phoneNumber}:`, error.message);
    console.error(`   Code: ${error.code}`);
    console.error(`   Details:`, error);
    return false;
  }
}
