import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/db/mongo.js';

// Very small user endpoint for retrieving mock users by id
export async function GET({ url }) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, { status: 400 });
  // For prototype return a minimal user object
  const user = { id, name: id.startsWith('arzt') ? 'Dr. ' + id : 'Patient ' + id, role: id.startsWith('arzt') ? 'arzt' : 'patient' };
  return json(user);
}

export async function POST({ request }) {
  const payload = await request.json();
  // In a real app you'd create a user; here we echo
  return json({ ok: true, user: payload });
}
