import { MongoClient, ObjectId } from 'mongodb';

// Small Mongo helper with fallback to in-memory collections when no URI set.
const MONGODB_URI = process.env.MONGODB_URI;
let client;
let db;

const inMemory = {
  praxen: [
    { _id: '1', name: 'Praxis Dr. Meyer', fach: 'Allgemeinmedizin', city: 'Zürich', waitMinutes: 10, rating: 4.5, address: 'Bahnhofstrasse 1', coords: { lat: 47.3769, lng: 8.5417 }, ownerId: 'arzt1' },
    { _id: '2', name: 'Zahnarztpraxis Lenz', fach: 'Zahnmedizin', city: 'Winterthur', waitMinutes: 45, rating: 4.1, address: 'Marktgasse 3', coords: { lat: 47.499, lng: 8.724 }, ownerId: 'arzt2' },
    { _id: '3', name: 'Kardiologie Zentrum', fach: 'Kardiologie', city: 'Zürich', waitMinutes: 125, rating: 4.8, address: 'Herzweg 4', coords: { lat: 47.37, lng: 8.54 }, ownerId: 'arzt3' },
    { _id: '4', name: 'Dermatologie Dr. Weiss', fach: 'Dermatologie', city: 'Basel', waitMinutes: 5, rating: 3.9, address: 'Marktplatz 2', coords: { lat: 47.558, lng: 7.573 }, ownerId: 'arzt4' },
    { _id: '5', name: 'Kinderarzt Huber', fach: 'Pädiatrie', city: 'Zürich', waitMinutes: 30, rating: 4.3, address: 'Kindergasse 7', coords: { lat: 47.379, lng: 8.540 }, ownerId: 'arzt5' },
    { _id: '6', name: 'Augenklinik Sommer', fach: 'Augenheilkunde', city: 'Bern', waitMinutes: 20, rating: 4.0, address: 'Seestrasse 12', coords: { lat: 46.948, lng: 7.447 }, ownerId: 'arzt6' },
    { _id: '7', name: 'HNO Praxis Fischer', fach: 'HNO', city: 'Luzern', waitMinutes: 55, rating: 3.8, address: 'Seebrücke 4', coords: { lat: 47.048, lng: 8.309 }, ownerId: 'arzt7' },
    { _id: '8', name: 'Physio Zentrum Nord', fach: 'Physiotherapie', city: 'Winterthur', waitMinutes: 15, rating: 4.2, address: 'Therapieweg 1', coords: { lat: 47.498, lng: 8.724 }, ownerId: 'arzt8' }
  ],
  termine: [
    {
      _id: 't1',
      praxisId: '1',
      patient: 'Anna Keller',
      time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      note: 'Routine-Kontrolle'
    }
  ]
};

async function connect() {
  if (client && db) return { client, db };
  if (!MONGODB_URI) {
    return null; // signal fallback
  }
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  return { client, db };
}

function makeFallbackCollection(name) {
  return {
    find: async (filter = {}) => {
      const arr = inMemory[name] || [];
      // basic filter support for equality on top-level keys
      return arr.filter((doc) => {
        for (const k of Object.keys(filter)) {
          if (doc[k] != filter[k]) return false;
        }
        return true;
      });
    },
    findOne: async (filter = {}) => {
      const arr = inMemory[name] || [];
      return arr.find((doc) => {
        for (const k of Object.keys(filter)) {
          if (k === '_id') {
            return doc._id == filter._id || doc._id == String(filter._id);
          }
          if (doc[k] != filter[k]) return false;
        }
        return true;
      }) || null;
    },
    insertOne: async (doc) => {
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      const created = { ...doc, _id: id };
      inMemory[name] = inMemory[name] || [];
      inMemory[name].push(created);
      return { insertedId: id };
    },
    updateOne: async (filter, update) => {
      const arr = inMemory[name] || [];
      const item = arr.find((d) => d._id == filter._id || d._id == String(filter._id));
      if (!item) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(item, update.$set || {});
      return { matchedCount: 1, modifiedCount: 1 };
    },
    deleteOne: async (filter) => {
      let arr = inMemory[name] || [];
      const orig = arr.length;
      arr = arr.filter((d) => !(d._id == filter._id || d._id == String(filter._id)));
      inMemory[name] = arr;
      return { deletedCount: orig - arr.length };
    }
  };
}

export async function getCollection(name) {
  const con = await connect();
  if (!con) {
    return makeFallbackCollection(name);
  }
  const collection = con.db.collection(name);
  return collection;
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (e) {
    return id;
  }
}
