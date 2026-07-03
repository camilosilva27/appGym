import fetch from 'node-fetch';

const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const WAHA_SESSION = process.env.WAHA_SESSION || 'gymbot';

export async function sendTextMessage(phone, text) {
  const chatId = `${phone}@c.us`;

  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_API_KEY,
    },
    body: JSON.stringify({
      session: WAHA_SESSION,
      chatId,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WAHA error ${res.status}: ${body}`);
  }

  return res.json();
}
