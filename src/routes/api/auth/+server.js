import { json } from '@sveltejs/kit';

// Very small mock auth endpoint. Client manages the session locally.
export async function POST({ request }) {
  const { action, role, userId } = await request.json();
  if (action === 'login') {
    // echo back what the client should store
    return json({ ok: true, role: role || 'patient', userId: userId || null });
  }
  if (action === 'logout') {
    return json({ ok: true });
  }
  return json({ ok: false, error: 'unknown action' }, { status: 400 });
}
