import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/db/mongo.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function validateEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

export async function POST({ request }) {
  const payload = await request.json();
  const action = payload.action;
  const col = await getCollection('users');

  if (action === 'register') {
    const { email, password, role = 'patient', name } = payload;
    if (!validateEmail(email)) return json({ ok: false, error: 'Ungültige E-Mail' }, { status: 400 });
    if (!password || password.length < 8) return json({ ok: false, error: 'Passwort zu kurz (mindestens 8 Zeichen)' }, { status: 400 });

    // check existing
    const existing = await col.findOne ? await col.findOne({ email }) : (await col.find({})).find(u => u.email === email);
    if (existing) return json({ ok: false, error: 'E-Mail bereits registriert' }, { status: 409 });

    const hash = hashPassword(password);
    const toInsert = { email, role, hash, name: name || null };
    const res = await col.insertOne ? await col.insertOne(toInsert) : await col.insertOne(toInsert);
    return json({ ok: true, userId: res.insertedId || res.insertedId || toInsert.email, name: toInsert.name });
  }

  if (action === 'login') {
    const { email, password } = payload;
    if (!email || !password) return json({ ok: false, error: 'Email und Passwort erforderlich' }, { status: 400 });
    const user = await col.findOne ? await col.findOne({ email }) : (await col.find({})).find(u => u.email === email);
    if (!user) return json({ ok: false, error: 'Benutzer nicht gefunden' }, { status: 404 });
    const hash = hashPassword(password);
    if (user.hash !== hash) return json({ ok: false, error: 'Falsches Passwort' }, { status: 401 });
    return json({ ok: true, userId: user._id || user.email, role: user.role || 'patient', name: user.name || null });
  }

  if (action === 'update') {
    const { userId, name, email, address, password, birthdate, healthInsurance, insuranceNumber, insuranceCardImage, phone, website, specialization } = payload;
    if (!userId) return json({ ok: false, error: 'Missing userId' }, { status: 400 });
    const filter = { _id: userId };
    const toSet = {};
    if (typeof name !== 'undefined') toSet.name = name;
    if (typeof email !== 'undefined') toSet.email = email;
    if (typeof address !== 'undefined') toSet.address = address;
    if (typeof birthdate !== 'undefined') toSet.birthdate = birthdate;
    if (typeof healthInsurance !== 'undefined') toSet.healthInsurance = healthInsurance;
    if (typeof insuranceNumber !== 'undefined') toSet.insuranceNumber = insuranceNumber;
    if (typeof insuranceCardImage !== 'undefined') toSet.insuranceCardImage = insuranceCardImage;
    if (typeof phone !== 'undefined') toSet.phone = phone;
    if (typeof website !== 'undefined') toSet.website = website;
    if (typeof specialization !== 'undefined') toSet.specialization = specialization;
    if (typeof password !== 'undefined' && password) {
      if (password.length < 8) return json({ ok: false, error: 'Passwort zu kurz' }, { status: 400 });
      toSet.hash = hashPassword(password);
    }
    // try to update
    const res = await col.updateOne ? await col.updateOne(filter, { $set: toSet }) : await col.updateOne(filter, { $set: toSet });
    return json({ ok: true, matched: res.matchedCount || res.matched || 0 });
  }

  return json({ ok: false, error: 'Unknown action' }, { status: 400 });
}

// Very small user endpoint for retrieving mock users by id
export async function GET({ url }) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, { status: 400 });
  // try to look up in users collection
  const col = await getCollection('users');
  const user = await col.findOne ? await col.findOne({ _id: id }) : (await col.find({})).find(u => u._id === id || u.email === id);
  if (user) {
    const out = { 
      id: user._id || user.email, 
      name: user.name || null, 
      email: user.email || null, 
      role: user.role || 'patient',
      address: user.address || null,
      birthdate: user.birthdate || null,
      healthInsurance: user.healthInsurance || null,
      insuranceNumber: user.insuranceNumber || null,
      insuranceCardImage: user.insuranceCardImage || null,
      phone: user.phone || null,
      website: user.website || null,
      specialization: user.specialization || null
    };
    return json(out);
  }
  // fallback
  const isPraxis = id.startsWith('praxis') || id.startsWith('arzt');
  const fallback = { id, name: isPraxis ? 'Dr. ' + id : 'Patient ' + id, role: isPraxis ? 'praxis' : 'patient' };
  return json(fallback);
}
