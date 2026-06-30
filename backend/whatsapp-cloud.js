import dotenv from 'dotenv';
dotenv.config();

const GRAPH_API_URL = 'https://graph.facebook.com/v20.0';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function sendTemplateMessage(phoneNumber, templateName, clientName = null) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const TEMPLATE_LANG = templateName === 'hello_world' ? 'en_US' : 'es';

  const template = {
    name: templateName,
    language: { code: TEMPLATE_LANG },
    ...(clientName && {
      components: [{ type: 'body', parameters: [{ type: 'text', text: clientName }] }],
    }),
  };

  const body = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template,
  };

  const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data.error)}`);
  }

  return data;
}

// Used for testing only — free-form text only works within a 24h customer-initiated window
export async function sendWhatsAppMessage(phoneNumber, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const body = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: { body: message },
  };

  const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data.error)}`);
  }

  return data;
}
