import { json } from '@sveltejs/kit';
import { getCollection, toObjectId } from '$lib/db/mongo.js';

export async function GET() {
  const col = await getCollection('termine');
  const docs = await col.find ? await col.find({}) : await col.find({});
  return json(docs);
}

export async function POST({ request }) {
  const payload = await request.json();
  // basic validation
  if (!payload.praxisId || !payload.patient || !payload.time) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }
  const col = await getCollection('termine');
  const toInsert = {
    praxisId: payload.praxisId,
    patient: payload.patient,
    time: payload.time,
    note: payload.note || ''
  };
  const res = await col.insertOne ? await col.insertOne(toInsert) : await col.insertOne(toInsert);

  // Optionally update praxis waitMinutes heuristic (simple)
  try {
    const prCol = await getCollection('praxen');
    const praxis = await (prCol.findOne ? prCol.findOne({ _id: toObjectId(payload.praxisId) }) : prCol.findOne({ _id: payload.praxisId }));
    if (praxis) {
      const newWait = Math.max(5, (praxis.waitMinutes || 0) + 5);
      await prCol.updateOne ? await prCol.updateOne({ _id: toObjectId(payload.praxisId) }, { $set: { waitMinutes: newWait } }) : await prCol.updateOne({ _id: payload.praxisId }, { $set: { waitMinutes: newWait } });
    }
  } catch (e) {
    // ignore
  }

  return json({ insertedId: res.insertedId || res.insertedId });
}

export async function PUT({ request }) {
  const payload = await request.json();
  if (!payload._id) return json({ error: 'Missing id' }, { status: 400 });
  const col = await getCollection('termine');
  const res = await col.updateOne ? await col.updateOne({ _id: toObjectId(payload._id) }, { $set: payload }) : await col.updateOne({ _id: payload._id }, { $set: payload });
  return json({ matched: res.matchedCount || 0 });
}

export async function DELETE({ request }) {
  const payload = await request.json();
  if (!payload._id) return json({ error: 'Missing id' }, { status: 400 });
  const col = await getCollection('termine');
  const res = await col.deleteOne ? await col.deleteOne({ _id: toObjectId(payload._id) }) : await col.deleteOne({ _id: payload._id });
  return json({ deleted: res.deletedCount || 0 });
}
