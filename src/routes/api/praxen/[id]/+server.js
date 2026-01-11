import { json } from '@sveltejs/kit';
import { getCollection, toObjectId } from '$lib/db/mongo.js';
import { marketPraxen, demoOwnerPraxen } from '$lib/db/demoData.js';

export async function GET({ params }) {
  const id = params.id;
  // Check demo owner practices first
  let doc = demoOwnerPraxen.find(p => String(p._id) === String(id));
  if (doc) return json(doc);
  // Then check market practices
  doc = marketPraxen.find(p => String(p._id) === String(id));
  if (doc) return json(doc);
  const col = await getCollection('praxen');
  const docDb = await col.findOne ? await col.findOne({ _id: toObjectId(id) }) : await col.findOne({ _id: id });
  return json(docDb || {});
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
