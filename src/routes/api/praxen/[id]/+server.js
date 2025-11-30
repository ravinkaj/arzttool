import { json } from '@sveltejs/kit';
import { getCollection, toObjectId } from '$lib/db/mongo.js';

export async function GET({ params }) {
  const id = params.id;
  const col = await getCollection('praxen');
  const doc = await col.findOne ? await col.findOne({ _id: toObjectId(id) }) : await col.findOne({ _id: id });
  return json(doc || {});
}

export async function PUT({ params, request }) {
  const id = params.id;
  const payload = await request.json();
  const col = await getCollection('praxen');
  const res = await col.updateOne({ _id: toObjectId(id) }, { $set: payload });
  return json({ matched: res.matchedCount || 0 });
}

export async function DELETE({ params }) {
  const id = params.id;
  const col = await getCollection('praxen');
  const res = await col.deleteOne({ _id: toObjectId(id) });
  return json({ deleted: res.deletedCount || 0 });
}
