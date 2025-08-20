const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL ?? 'https://api.heygen.com';

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      console.error('HEYGEN_API_KEY missing');
      return new Response(JSON.stringify({ error: 'HEYGEN_API_KEY missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const resp = await fetch(`${BASE_API_URL}/v1/streaming.create_token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HEYGEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // adjust if HeyGen requires a specific body
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error('HeyGen create_token error status:', resp.status, 'body:', text);
      return new Response(JSON.stringify({ error: 'HeyGen create_token error', status: resp.status, details: text }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    const token = data?.data?.token ?? data?.token ?? null;

    if (!token) {
      console.error('Token not found in HeyGen response', data);
      return new Response(JSON.stringify({ error: 'Token not found', details: data }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error retrieving access token:', err);
    return new Response(JSON.stringify({ error: 'Failed to retrieve access token' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
