import { json } from '@sveltejs/kit';
import { getCollection, toObjectId } from '$lib/db/mongo.js';

export async function GET({ url }) {
  const specialty = url.searchParams.get('fach');
  const city = url.searchParams.get('city');
  const sort = url.searchParams.get('sort'); // e.g. wait
  const ownerId = url.searchParams.get('ownerId');

  const col = await getCollection('praxen');
  let docs;
  // our fallback collection returns arrays directly for find
  if (typeof col.find === 'function') {
    // try to use mongodb cursor if available
    try {
      const filter = {};
      if (specialty) filter.fach = specialty;
      if (city) filter.city = city;
      if (ownerId) filter.ownerId = ownerId;
      const cursor = await col.find(filter).toArray ? await col.find(filter).toArray() : await col.find(filter);
      docs = cursor;
    } catch (e) {
      docs = await col.find({});
    }
  } else {
    docs = await col.find({});
  }

  // simple sorting
  if (sort === 'wait') {
    docs.sort((a, b) => (a.waitMinutes || 0) - (b.waitMinutes || 0));
  }
  if (sort === 'wait_desc') {
    docs.sort((a, b) => (b.waitMinutes || 0) - (a.waitMinutes || 0));
  }
  if (sort === 'rating_asc') {
    docs.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }
  if (sort === 'rating_desc') {
    docs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return json(docs);
}

export async function POST({ request }) {
  const payload = await request.json();
  const col = await getCollection('praxen');
  const toInsert = {
    name: payload.name || 'Neue Praxis',
    fach: payload.fach || 'Allgemeinmedizin',
    city: payload.city || 'Unbekannt',
    waitMinutes: Number(payload.waitMinutes) || 0,
    address: payload.address || '',
    coords: payload.coords || null,
    rating: Number(payload.rating) || 0,
    ownerId: payload.ownerId || null
  };
  const res = await col.insertOne ? await col.insertOne(toInsert) : await col.insertOne(toInsert);
  return json({ insertedId: res.insertedId || res.insertedId });
}
