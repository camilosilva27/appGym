import fetch from 'node-fetch';

const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const WAHA_SESSION = process.env.WAHA_SESSION || 'gymbot';

async function doSend(phone, text) {
  const chatId = `${phone}@c.us`;

  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_API_KEY,
    },
    body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WAHA error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function checkSession() {
  const res = await fetch(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, {
    headers: { 'X-Api-Key': WAHA_API_KEY },
  });
  if (!res.ok) throw new Error(`WAHA session check failed: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'WORKING') throw new Error(`WAHA session not ready: ${data.status}`);
}

export async function sendTextMessage(phone, text) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await doSend(phone, text);
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await delay(3000);
    }
  }
  throw lastErr;
}
