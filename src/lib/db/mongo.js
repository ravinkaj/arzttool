import { MongoClient, ObjectId } from 'mongodb';

// Small Mongo helper with fallback to in-memory collections when no URI set.
const MONGODB_URI = process.env.MONGODB_URI;
let client;
let db;

const inMemory = {
  praxen: [
    { _id: '1', name: 'Praxis Dr. Meyer', fach: 'Allgemeinmedizin', city: 'Zürich', waitMinutes: 10, rating: 4.5, address: 'Bahnhofstrasse 1', coords: { lat: 47.3769, lng: 8.5417 }, ownerId: 'praxis1' },
    { _id: '2', name: 'Zahnarztpraxis Lenz', fach: 'Zahnmedizin', city: 'Winterthur', waitMinutes: 45, rating: 4.1, address: 'Marktgasse 3', coords: { lat: 47.499, lng: 8.724 }, ownerId: 'praxis2' },
    { _id: '3', name: 'Kardiologie Zentrum', fach: 'Kardiologie', city: 'Zürich', waitMinutes: 125, rating: 4.8, address: 'Herzweg 4', coords: { lat: 47.37, lng: 8.54 }, ownerId: 'praxis3' },
    { _id: '4', name: 'Dermatologie Dr. Weiss', fach: 'Dermatologie', city: 'Basel', waitMinutes: 5, rating: 3.9, address: 'Marktplatz 2', coords: { lat: 47.558, lng: 7.573 }, ownerId: 'praxis4' },
    { _id: '5', name: 'Kinderarzt Huber', fach: 'Pädiatrie', city: 'Zürich', waitMinutes: 30, rating: 4.3, address: 'Kindergasse 7', coords: { lat: 47.379, lng: 8.540 }, ownerId: 'praxis5' },
    { _id: '6', name: 'Augenklinik Sommer', fach: 'Augenheilkunde', city: 'Bern', waitMinutes: 20, rating: 4.0, address: 'Seestrasse 12', coords: { lat: 46.948, lng: 7.447 }, ownerId: 'praxis6' },
    { _id: '7', name: 'HNO Praxis Fischer', fach: 'HNO', city: 'Luzern', waitMinutes: 55, rating: 3.8, address: 'Seebrücke 4', coords: { lat: 47.048, lng: 8.309 }, ownerId: 'praxis7' },
    { _id: '8', name: 'Physio Zentrum Nord', fach: 'Physiotherapie', city: 'Winterthur', waitMinutes: 15, rating: 4.2, address: 'Therapieweg 1', coords: { lat: 47.498, lng: 8.724 }, ownerId: 'praxis8' },
    { _id: '9', name: 'Praxis Genève Sud', fach: 'Allgemeinmedizin', city: 'Genf', waitMinutes: 25, rating: 4.2, address: 'Rue de Genève 10', coords: { lat: 46.2044, lng: 6.1432 }, ownerId: 'praxis9' },
    { _id: '10', name: 'Centre Médical Lausanne', fach: 'Allgemeinmedizin', city: 'Lausanne', waitMinutes: 12, rating: 4.4, address: 'Avenue de la Gare 5', coords: { lat: 46.5197, lng: 6.6323 }, ownerId: 'praxis10' },
    { _id: '11', name: 'Zahnarzt Nord Vaud', fach: 'Zahnmedizin', city: 'Nyon', waitMinutes: 35, rating: 3.9, address: 'Place du Marché 2', coords: { lat: 46.3833, lng: 6.2390 }, ownerId: 'praxis11' },
    { _id: '12', name: 'Kantonsspital Bern Praxis', fach: 'Allgemeinmedizin', city: 'Bern', waitMinutes: 18, rating: 4.6, address: 'Spitalgasse 1', coords: { lat: 46.94797, lng: 7.44745 }, ownerId: 'praxis12' },
    { _id: '13', name: 'Dermatologie Basel-City', fach: 'Dermatologie', city: 'Basel', waitMinutes: 8, rating: 4.1, address: 'Steinenring 7', coords: { lat: 47.558, lng: 7.587 }, ownerId: 'praxis13' },
    { _id: '14', name: 'Praxis Ticino Centro', fach: 'Allgemeinmedizin', city: 'Lugano', waitMinutes: 22, rating: 4.0, address: 'Via Nassa 14', coords: { lat: 46.0037, lng: 8.9511 }, ownerId: 'praxis14' },
    { _id: '15', name: 'Kinderarzt St. Gallen', fach: 'Pädiatrie', city: 'St. Gallen', waitMinutes: 28, rating: 4.3, address: 'Hauptplatz 3', coords: { lat: 47.4245, lng: 9.3767 }, ownerId: 'praxis15' },
    { _id: '16', name: 'HNO Praxis Aarau', fach: 'HNO', city: 'Aarau', waitMinutes: 40, rating: 3.7, address: 'Bahnhofplatz 6', coords: { lat: 47.3926, lng: 8.0444 }, ownerId: 'praxis16' },
    { _id: '17', name: 'Augenklinik Chur', fach: 'Augenheilkunde', city: 'Chur', waitMinutes: 33, rating: 4.0, address: 'Altstadt 4', coords: { lat: 46.849, lng: 9.529 }, ownerId: 'praxis17' },
    { _id: '18', name: 'Physio Zentrum Thurgau', fach: 'Physiotherapie', city: 'Weinfelden', waitMinutes: 14, rating: 4.2, address: 'Seestrasse 8', coords: { lat: 47.569, lng: 9.128 }, ownerId: 'praxis18' },
    { _id: '19', name: 'Praxis Solothurn Mitte', fach: 'Allgemeinmedizin', city: 'Solothurn', waitMinutes: 16, rating: 4.1, address: 'Gürbetal 9', coords: { lat: 47.2086, lng: 7.532 }, ownerId: 'praxis19' },
    { _id: '20', name: 'Dental Care Schaffhausen', fach: 'Zahnmedizin', city: 'Schaffhausen', waitMinutes: 27, rating: 4.0, address: 'Rheinweg 1', coords: { lat: 47.696, lng: 8.634 }, ownerId: 'praxis20' }
  ],
  // additional demo entries across cantons
  // ids 21-35
  praxen_extra: [
    { _id: '21', name: 'Praxis Valais Sion', fach: 'Allgemeinmedizin', city: 'Sion', waitMinutes: 19, rating: 4.1, address: 'Rue du Bourg 8', coords: { lat: 46.233, lng: 7.358 }, ownerId: 'praxis21' },
    { _id: '22', name: 'Clinique Fribourg', fach: 'Allgemeinmedizin', city: 'Fribourg', waitMinutes: 22, rating: 4.0, address: 'Avenue du Midi 4', coords: { lat: 46.8065, lng: 7.1619 }, ownerId: 'praxis22' },
    { _id: '23', name: 'Zuger Praxiszentrum', fach: 'Allgemeinmedizin', city: 'Zug', waitMinutes: 11, rating: 4.3, address: 'Poststrasse 2', coords: { lat: 47.166, lng: 8.517 }, ownerId: 'praxis23' },
    { _id: '24', name: 'Dental Biel/Bienne', fach: 'Zahnmedizin', city: 'Biel', waitMinutes: 29, rating: 3.9, address: 'Seefeldstrasse 10', coords: { lat: 47.136, lng: 7.246 }, ownerId: 'praxis24' },
    { _id: '25', name: 'Med Neuchâtel', fach: 'Allgemeinmedizin', city: 'Neuchâtel', waitMinutes: 17, rating: 4.2, address: 'Rue du Collège 6', coords: { lat: 46.991, lng: 6.931 }, ownerId: 'praxis25' },
    { _id: '26', name: 'La Chaux Dermatologie', fach: 'Dermatologie', city: 'La Chaux-de-Fonds', waitMinutes: 21, rating: 4.0, address: 'Place du Marché 1', coords: { lat: 47.098, lng: 6.827 }, ownerId: 'praxis26' },
    { _id: '27', name: 'Praxis Sierre', fach: 'Allgemeinmedizin', city: 'Sierre', waitMinutes: 24, rating: 4.1, address: 'Avenue de la Gare 12', coords: { lat: 46.291, lng: 7.533 }, ownerId: 'praxis27' },
    { _id: '28', name: 'Hausarzt Baar', fach: 'Allgemeinmedizin', city: 'Baar', waitMinutes: 13, rating: 4.4, address: 'Bahnhofstrasse 5', coords: { lat: 47.175, lng: 8.520 }, ownerId: 'praxis28' },
    { _id: '29', name: 'Praxis Olten', fach: 'Allgemeinmedizin', city: 'Olten', waitMinutes: 26, rating: 3.8, address: 'Baselstrasse 9', coords: { lat: 47.349, lng: 7.903 }, ownerId: 'praxis29' },
    { _id: '30', name: 'Kinderpraxis Wil', fach: 'Pädiatrie', city: 'Wil', waitMinutes: 16, rating: 4.2, address: 'Marktgasse 11', coords: { lat: 47.456, lng: 9.044 }, ownerId: 'praxis30' },
    { _id: '31', name: 'Praxis Dornach', fach: 'Allgemeinmedizin', city: 'Dornach', waitMinutes: 32, rating: 3.9, address: 'Hauptstrasse 3', coords: { lat: 47.523, lng: 7.588 }, ownerId: 'praxis31' },
    { _id: '32', name: 'Praxis Uster', fach: 'Allgemeinmedizin', city: 'Uster', waitMinutes: 18, rating: 4.0, address: 'Kirchgasse 7', coords: { lat: 47.349, lng: 8.717 }, ownerId: 'praxis32' },
    { _id: '33', name: 'Med Zentrum Emmen', fach: 'Allgemeinmedizin', city: 'Emmen', waitMinutes: 23, rating: 4.1, address: 'Seetalstrasse 4', coords: { lat: 47.056, lng: 8.292 }, ownerId: 'praxis33' },
    { _id: '34', name: 'Locarno Klinik', fach: 'Allgemeinmedizin', city: 'Locarno', waitMinutes: 20, rating: 4.0, address: 'Piazza Grande 2', coords: { lat: 46.169, lng: 8.795 }, ownerId: 'praxis34' },
    { _id: '35', name: 'Interlaken Praxis', fach: 'Allgemeinmedizin', city: 'Interlaken', waitMinutes: 15, rating: 4.3, address: 'Höheweg 20', coords: { lat: 46.686, lng: 7.863 }, ownerId: 'praxis35' }
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
  ,
  users: [
    // initial demo users (passwords stored as sha256 hashes for prototype)
    { _id: 'u1', email: 'patient1@example.com', name: 'Max Muster', role: 'patient', hash: 'b109f3bbbc244eb82441917ed06d618b9008dd09' },
    { _id: 'praxis1', email: 'arzt1@example.com', name: 'Dr. med. Hans Weber', role: 'praxis', hash: 'b109f3bbbc244eb82441917ed06d618b9008dd09' }
  ]
};

// Helpers to enrich demo data with realistic mock fields
function pad(n){return n.toString().padStart(2,'0');}
function hashString(s){return String(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);} 
function generateAvailableSlots(fach, city){
  const pools = {
    allgemein: ['08:30','09:15','10:30','13:30','15:00','16:30'],
    zahn: ['08:00','09:30','11:00','14:00','16:00'],
    kardiologie: ['09:00','11:00','13:00','15:30'],
    dermatologie: ['08:30','10:00','12:30','14:30'],
    hno: ['09:15','10:45','13:15','16:00'],
    paediatrie: ['08:30','09:45','11:15','14:30']
  };
  const key = String(fach||'').toLowerCase();
  const pool = key.includes('zahn') ? pools.zahn : key.includes('kard') ? pools.kardiologie : key.includes('derm') ? pools.dermatologie : key.includes('hno') ? pools.hno : key.includes('päd') || key.includes('pädi') ? pools.paediatrie : pools.allgemein;
  const base = Math.abs(hashString(city || fach || Math.random())) % pool.length;
  const today = new Date();
  const days = 3 + (base % 4); // 3-6 days
  const out = [];
  for(let d=0; d<days; d++){
    const slotsPerDay = 2 + (d % 3); // 2-4
    for(let s=0; s<slotsPerDay; s++){
      const hhmm = pool[(base + d + s) % pool.length];
      const [hh,mm] = hhmm.split(':').map(Number);
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate()+d, hh, mm, 0, 0);
      out.push(dt.toISOString());
    }
  }
  return out;
}

function generateOpeningHours(){
  return 'Mo–Fr 08:00–18:00';
}

function generateShortProfile(fach){
  if(!fach) return 'Allgemeinmedizinischer Versorgungsfokus: Vorsorge, akute Beschwerden und Langzeitbetreuung.';
  const key = fach.toLowerCase();
  if(key.includes('zahn')) return 'Schwerpunkt: Zahnprophylaxe, Füllungen, Wurzelbehandlung und ästhetische Zahnmedizin.';
  if(key.includes('kard')) return 'Schwerpunkt: Herz-Kreislauf-Diagnostik, EKG, Blutdruck-Management.';
  if(key.includes('derm')) return 'Schwerpunkt: Hautkrebsvorsorge, Allergien, chronische Hauterkrankungen.';
  if(key.includes('hno')) return 'Schwerpunkt: Hals-Nasen-Ohren-Behandlungen, Audiologie und Allergien.';
  if(key.includes('pädi')||key.includes('päd')) return 'Schwerpunkt: Kindergesundheit, Impfungen und Vorsorgeuntersuchungen.';
  return 'Vielseitiger Leistungskatalog mit Fokus auf Prävention und akute Behandlungen.';
}

function generateServices(fach){
  const base = ['Allgemeinuntersuchung','Blutabnahme','Impfungen','Telemedizinische Beratung'];
  const key = String(fach||'').toLowerCase();
  if(key.includes('zahn')) return ['Kontrolle & Reinigung','Füllungen','Wurzelbehandlung','Zahnextraktion'];
  if(key.includes('kard')) return ['EKG','Belastungs-EKG','Herzultraschall','Blutdruck-Monitoring'];
  if(key.includes('derm')) return ['Hautkrebsscreening','Allergietests','Aknebehandlung','Hautbiopsie'];
  if(key.includes('hno')) return ['Hörtest','Stimm-/Schluckdiagnostik','Allergiebehandlung'];
  if(key.includes('pädi')||key.includes('päd')) return ['Kindercheck','Impfungen','Wachstumsdiagnostik'];
  return base.concat(['Spezialsprechstunde']);
}

function generateTeam(name, fach){
  const first = ['Anna','Thomas','Martin','Laura','Sabine','Daniel','Julia','Marco','Nina','Lukas'];
  const last = ['Müller','Meier','Keller','Weber','Schmid','Fischer','Huber','Baumann','Lenz','Sommer'];
  const roles = ['Ärztin','Arzt','Praxisassistentin','MFA'];
  const cnt = 2 + (Math.abs(hashString(name||fach)) % 3); // 2-4 members
  const team = [];
  for(let i=0;i<cnt;i++){
    const fn = first[(i+3) % first.length];
    const ln = last[(i+5) % last.length];
    const fullname = `${fn} ${ln}`;
    const role = roles[i%roles.length];
    const spec = fach || 'Allgemeinmedizin';
    team.push({ name: fullname, role, specialization: spec, initials: (fn[0]||'')+(ln[0]||'') });
  }
  return team;
}

function generateReviews(name){
  const texts = [
    'Sehr freundliches Personal, kurze Wartezeit.',
    'Lange Wartezeit, aber sehr gute Behandlung.',
    'Organisiert und kompetent. Empfehlenswert.',
    'Nettes Team, angenehme Atmosphäre.',
    'Terminvergabe etwas umständlich, Qualität top.'
  ];
  const initials = ['M.S.','A.K.','L.B.','T.M.','S.R.'];
  const cnt = 2 + (Math.abs(hashString(name)) % 4); // 2-5 reviews
  const reviews = [];
  for(let i=0;i<cnt;i++){
    const rating = 3 + (Math.abs(hashString(name + i)) % 3); // 3-5
    const text = texts[(i + 2) % texts.length];
    const author = initials[(i + 1) % initials.length];
    const daysAgo = (i * 3) + 1;
    const date = new Date(Date.now() - daysAgo*24*60*60*1000).toISOString();
    reviews.push({ rating, text, author, date });
  }
  return reviews;
}

function enrichDoc(doc){
  const d = { ...doc };
  try{
    if(!d.availableSlots) d.availableSlots = generateAvailableSlots(d.fach,d.city);
    if(!d.openingHours) d.openingHours = generateOpeningHours();
    if(!d.shortProfile) d.shortProfile = generateShortProfile(d.fach);
    if(!d.services) d.services = generateServices(d.fach);
    if(!d.team) d.team = generateTeam(d.name,d.fach);
    if(!d.reviews) d.reviews = generateReviews(d.name || d._id);
    if(d.reviews && Array.isArray(d.reviews)){
      const sum = d.reviews.reduce((s,r)=>s+(r.rating||0),0);
      d.reviewCount = d.reviews.length;
      d.avgRating = d.reviewCount ? Math.round((sum / d.reviewCount) * 10) / 10 : null;
    }
  }catch(e){
    // ignore enrichment errors
  }
  return d;
}

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
      const results = arr.filter((doc) => {
        for (const k of Object.keys(filter)) {
          if (doc[k] != filter[k]) return false;
        }
        return true;
      });
      return results.map(enrichDoc);
    },
    findOne: async (filter = {}) => {
      const arr = inMemory[name] || [];
      const found = arr.find((doc) => {
        for (const k of Object.keys(filter)) {
          if (k === '_id') {
            return doc._id == filter._id || doc._id == String(filter._id);
          }
          if (doc[k] != filter[k]) return false;
        }
        return true;
      }) || null;
      return found ? enrichDoc(found) : null;
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
