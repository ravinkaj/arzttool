// Central market data and example practices for the app
// Exports:
// - marketPraxen: 30–40 plausible practices for patient-facing market overview
// - demoOwnerPraxen: exactly 2 practices shown to any practice user under "Meine Praxen"
// - demoTermine: example appointments (for demoOwnerPraxen)

// Koordinaten für Schweizer Städte (Fallback)
const cityCoords = {
  'Bern': { latitude: 46.9479, longitude: 7.4474 },
  'Zürich': { latitude: 47.3769, longitude: 8.5417 },
  'Luzern': { latitude: 47.0505, longitude: 8.3093 },
  'Basel': { latitude: 47.5596, longitude: 7.5886 },
  'St. Gallen': { latitude: 47.4235, longitude: 9.3768 },
  'Biel/Bienne': { latitude: 47.1358, longitude: 7.2474 },
  'Lugano': { latitude: 46.0051, longitude: 8.9603 },
  'Winterthur': { latitude: 47.5001, longitude: 8.7299 }
};

const cities = [
  { name: 'Bern', address: 'Bundesplatz 1', zip: '3000' },
  { name: 'Zürich', address: 'Bahnhofstrasse 10', zip: '8001' },
  { name: 'Luzern', address: 'Pilatusstrasse 8', zip: '6002' },
  { name: 'Basel', address: 'Rheinweg 12', zip: '4051' },
  { name: 'St. Gallen', address: 'Marktgasse 3', zip: '9000' },
  { name: 'Biel/Bienne', address: 'Seestrasse 20', zip: '2502' },
  { name: 'Lugano', address: 'Via Roma 5', zip: '6900' },
  { name: 'Winterthur', address: 'Bahnhofstrasse 11', zip: '8400' }
];

const specialties = [
  { fach: 'Allgemeinmedizin', label: 'Hausarztzentrum', services: ['Hausarzt','Vorsorge','Impfungen'] },
  { fach: 'Innere Medizin', label: 'City Medizin', services: ['Innere Medizin','Labor','EKG'] },
  { fach: 'Dermatologie', label: 'Hautzentrum', services: ['Dermatologie','Hautkrebsscreening'] },
  { fach: 'Orthopädie', label: 'Ortho Zentrum', services: ['Orthopädie','Physiotherapie'] },
  { fach: 'Gynäkologie', label: 'Frauenmedizin', services: ['Gynäkologie','Schwangerschaftsbetreuung'] },
  { fach: 'Pädiatrie', label: 'Kinderarztpraxis', services: ['Pädiatrie','Impfungen','Entwicklungsberatung'] },
  { fach: 'Kardiologie', label: 'Herzzentrum', services: ['Kardiologie','Belastungstest','Echokardiografie'] },
  { fach: 'Neurologie', label: 'Neuro Praxis', services: ['Neurologie','EEG','Schmerzsprechstunde'] }
];

const reviewerNames = ['Anna M.', 'Luca S.', 'Mara K.', 'Jonas F.', 'Elena W.', 'Samir T.', 'Lina B.', 'Noah R.', 'Sofia P.', 'David H.'];

// Helper to generate more entries across cantons
const cantons = ['ZH','BE','LU','UR','SZ','OW','NW','GL','ZG','FR','SO','BS','BL','SH','AR','AI','SG','GR','AG','TG','TI','VD','VS','NE','GE','JU'];
function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function generateMarketPraxen(){
  const out = [];
  let idx = 1;
  for(const city of cities){
    for(const spec of specialties){
      const id = `market-${String(idx).padStart(3,'0')}`;
      const name = `${spec.label} ${city.name}`;
      const address = `${city.address}, ${city.zip} ${city.name}`;
      const openingHours = city.name === 'Basel' ? 'Mo–Sa 08:00–18:00' : 'Mo–Fr 08:00–17:00';
      const description = `${spec.label} in ${city.name} mit Fokus auf ${spec.fach.toLowerCase()}.`;
      const team = [{ name: `Dr. ${spec.fach === 'Pädiatrie' ? 'Julia' : 'Markus'} ${city.name.split(' ')[0]}`, role: 'Facharzt', specialization: spec.fach, initials: `${city.name[0]}${spec.fach[0]}` }];
      const reviews = [];
      const reviewCount = 6 + (idx % 10);
      let ratingSum = 0;
      for(let r=0;r<reviewCount;r++){
        const rr = 3 + ((idx + r) % 3); // 3-5
        ratingSum += rr;
        if(r<4){
          const author = reviewerNames[(idx + r) % reviewerNames.length];
          const text = ['Gute Betreuung.','Kompetentes Team.','Schnelle Termine.','Sehr freundlich.'][r%4];
          const day = String((r%9)+1).padStart(2,'0');
          reviews.push({ rating: rr, text, author, date: `2025-12-${day}` });
        }
      }
      const avgRating = Number((ratingSum/reviewCount).toFixed(1));

      const today = new Date();
      const pool = ['08:30','09:15','10:00','11:30','13:00','14:30','16:00','17:00'];
      const availableSlots = [];
      for(let d=0; d<4; d++){
        for(let s=0; s<3; s++){
          const hhmm = pool[(idx + d + s) % pool.length];
          const [hh,mm] = hhmm.split(':').map(Number);
          const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate()+d, hh, mm, 0, 0);
          availableSlots.push(dt.toISOString());
        }
      }

      out.push({
        _id: id,
        name,
        fach: spec.fach,
        city: city.name,
        canton: cantons[(idx-1) % cantons.length],
        address,
        openingHours,
        services: spec.services,
        description,
        team,
        reviews,
        reviewCount,
        avgRating,
        tags: [],
        waitMinutes: 5 + (idx % 20),
        waitingPatients: 3 + (idx % 8),
        availableSlots,
        updatedAt: '2025-12-01',
        latitude: (cityCoords[city.name]?.latitude || 46.8182) + (Math.random() - 0.5) * 0.05,
        longitude: (cityCoords[city.name]?.longitude || 8.2275) + (Math.random() - 0.5) * 0.05
      });
      idx++;
    }
  }
  return out;
}

export const marketPraxen = generateMarketPraxen();

export const demoOwnerPraxen = [
  {
    _id: 'owner-1',
    name: 'Praxis Gesundheit Zentral',
    fach: 'Allgemeinmedizin',
    city: 'Zürich',
    canton: 'ZH',
    address: 'Seestrasse 45, 8001 Zürich',
    phone: '+41 44 123 45 67',
    email: 'kontakt@gesundheit-zentral.ch',
    website: 'www.gesundheit-zentral.ch',
    openingHours: 'Mo–Fr 08:00–18:00',
    services: ['Hausarzt','Vorsorge','Impfungen','Gesundheitschecks'],
    description: 'Moderne Hausarztpraxis im Herzen von Zürich mit Fokus auf präventive Medizin und persönliche Betreuung.',
    team: [{ name: 'Dr. med. Sarah Weber', role: 'Leitende Ärztin', specialization: 'Allgemeinmedizin', initials: 'SW' }],
    tags: ['Hausarzt','Prävention'],
    reviews: [{ rating: 5, text: 'Sehr kompetent und freundlich. Immer Zeit für Gespräche.', author: 'M. Müller', date: '2025-12-10' }],
    reviewCount: 1,
    avgRating: 5,
    ownerId: 'sample_owner',
    waitMinutes: 10,
    waitingPatients: 2,
    latitude: 47.3769,
    longitude: 8.5417,
    availableSlots: (function(){ const today=new Date(); return ['09:00','10:30','14:00'].map(h=>{const [hh,mm]=h.split(':').map(Number); const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Math.floor(Math.random()*3),hh,mm,0); return d.toISOString();})})(),
    updatedAt: '2025-12-01'
  },
  {
    _id: 'owner-2',
    name: 'Medizinisches Zentrum Aaretal',
    fach: 'Innere Medizin',
    city: 'Bern',
    canton: 'BE',
    address: 'Bahnhofplatz 8, 3011 Bern',
    phone: '+41 31 987 65 43',
    email: 'info@mz-aaretal.ch',
    website: 'www.mz-aaretal.ch',
    openingHours: 'Mo–Sa 08:00–20:00',
    services: ['Innere Medizin','Labor','Ultraschall','EKG'],
    description: 'Spezialisiertes internistisches Zentrum mit moderner Diagnostik und umfassender Betreuung chronischer Erkrankungen.',
    team: [{ name: 'Dr. med. Thomas Burkhalter', role: 'Facharzt', specialization: 'Innere Medizin', initials: 'TB' }],
    tags: ['Innere Medizin','Diagnostik'],
    reviews: [{ rating: 4, text: 'Professionelle Abklärungen, sehr gründlich.', author: 'L. Schneider', date: '2025-12-05' }],
    reviewCount: 1,
    avgRating: 4,
    ownerId: 'sample_owner',
    waitMinutes: 15,
    waitingPatients: 5,
    latitude: 46.9479,
    longitude: 7.4474,
    availableSlots: (function(){ const today=new Date(); return ['08:30','11:00','15:00'].map(h=>{const [hh,mm]=h.split(':').map(Number); const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Math.floor(Math.random()*3),hh,mm,0); return d.toISOString();})})(),
    updatedAt: '2025-12-03'
  },
  {
    _id: 'owner-3',
    name: 'Hautpraxis Dermacare',
    fach: 'Dermatologie',
    city: 'Luzern',
    canton: 'LU',
    address: 'Löwenplatz 14, 6004 Luzern',
    phone: '+41 41 234 56 78',
    email: 'info@dermacare-luzern.ch',
    website: 'www.dermacare-luzern.ch',
    openingHours: 'Mo–Fr 08:00–18:00, Sa 09:00–13:00',
    services: ['Dermatologie', 'Hautkrebsscreening', 'Ästhetische Behandlungen'],
    description: 'Spezialisierte Hautarztpraxis mit Fokus auf Prävention und moderne Dermatologie.',
    team: [{ name: 'Dr. med. Claudia Fischer', role: 'Fachärztin', specialization: 'Dermatologie', initials: 'CF' }],
    tags: ['Dermatologie', 'Prävention'],
    reviews: [{ rating: 5, text: 'Sehr kompetente Beratung, moderne Ausstattung.', author: 'R. Vogel', date: '2025-12-08' }],
    reviewCount: 1,
    avgRating: 5,
    ownerId: 'sample_owner',
    waitMinutes: 12,
    waitingPatients: 1,
    latitude: 47.0505,
    longitude: 8.3093,
    availableSlots: (function(){ const today=new Date(); return ['09:00','10:30','14:00','16:00'].map(h=>{const [hh,mm]=h.split(':').map(Number); const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Math.floor(Math.random()*4),hh,mm,0); return d.toISOString();})})(),
    updatedAt: '2025-12-08'
  },
  {
    _id: 'owner-4',
    name: 'Orthopädie Zentrum Basel',
    fach: 'Orthopädie',
    city: 'Basel',
    canton: 'BS',
    address: 'Aeschenvorstadt 55, 4051 Basel',
    phone: '+41 61 555 77 88',
    email: 'praxis@ortho-basel.ch',
    website: 'www.ortho-basel.ch',
    openingHours: 'Mo–Fr 07:30–17:30',
    services: ['Orthopädie', 'Sportmedizin', 'Physiotherapie', 'Röntgen'],
    description: 'Fachpraxis für Orthopädie mit Schwerpunkt Sportverletzungen und Rehabilitation.',
    team: [
      { name: 'Dr. med. Michael Steiner', role: 'Leitender Arzt', specialization: 'Orthopädie', initials: 'MS' },
      { name: 'Petra Zimmermann', role: 'Physiotherapeutin', specialization: 'Rehabilitation', initials: 'PZ' }
    ],
    tags: ['Orthopädie', 'Sport'],
    reviews: [
      { rating: 5, text: 'Hervorragende Behandlung nach meiner Knieverletzung!', author: 'T. Graf', date: '2025-11-28' },
      { rating: 4, text: 'Kompetent und zuverlässig.', author: 'S. Baumgartner', date: '2025-12-12' }
    ],
    reviewCount: 2,
    avgRating: 4.5,
    ownerId: 'sample_owner',
    waitMinutes: 8,
    waitingPatients: 4,
    latitude: 47.5596,
    longitude: 7.5886,
    availableSlots: (function(){ const today=new Date(); return ['08:00','09:30','11:00','14:30','16:00'].map(h=>{const [hh,mm]=h.split(':').map(Number); const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Math.floor(Math.random()*5),hh,mm,0); return d.toISOString();})})(),
    updatedAt: '2025-12-12'
  },
  {
    _id: 'owner-5',
    name: 'Kinderarztpraxis St. Gallen',
    fach: 'Pädiatrie',
    city: 'St. Gallen',
    canton: 'SG',
    address: 'Rosenbergstrasse 23, 9000 St. Gallen',
    phone: '+41 71 222 33 44',
    email: 'kontakt@kinderarzt-sg.ch',
    website: 'www.kinderarzt-sg.ch',
    openingHours: 'Mo–Fr 08:00–12:00, 13:30–17:30',
    services: ['Pädiatrie', 'Impfungen', 'Entwicklungsberatung', 'Notfallbetreuung'],
    description: 'Kinderfreundliche Praxis mit erfahrenem Team für alle Altersstufen von Geburt bis Jugend.',
    team: [
      { name: 'Dr. med. Julia Kramer', role: 'Fachärztin', specialization: 'Pädiatrie', initials: 'JK' },
      { name: 'Dr. med. Andreas Lehmann', role: 'Facharzt', specialization: 'Pädiatrie', initials: 'AL' }
    ],
    tags: ['Pädiatrie', 'Familie'],
    reviews: [
      { rating: 5, text: 'Unsere Kinder fühlen sich dort sehr wohl. Top!', author: 'Familie Weber', date: '2025-12-01' },
      { rating: 5, text: 'Einfühlsam und geduldig mit den Kleinen.', author: 'M. Hofer', date: '2025-12-15' }
    ],
    reviewCount: 2,
    avgRating: 5,
    ownerId: 'sample_owner',
    waitMinutes: 18,
    waitingPatients: 3,
    latitude: 47.4235,
    longitude: 9.3768,
    availableSlots: (function(){ const today=new Date(); return ['08:30','09:30','10:30','14:00','15:00','16:00'].map(h=>{const [hh,mm]=h.split(':').map(Number); const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+Math.floor(Math.random()*3),hh,mm,0); return d.toISOString();})})(),
    updatedAt: '2025-12-15'
  }
];

// Appointments tied to demoOwnerPraxen
export const demoTermine = (() => {
  const today = new Date();
  function at(dayOffset, hh, mm){ const d = new Date(today); d.setDate(d.getDate()+dayOffset); d.setHours(hh,mm,0,0); return d.toISOString(); }
  return [
    { _id: 'term-001', praxisId: 'owner-1', patient: 'Anna Meier', time: at(0,9,30), note: 'Routine-Check', status: 'bestätigt', createdAt: at(-10,10,0) },
    { _id: 'term-002', praxisId: 'owner-2', patient: 'Peter Huber', time: at(0,11,0), note: 'Laborresultate besprechen', status: 'angefragt', createdAt: at(-5,11,0) },
    { _id: 'term-003', praxisId: 'owner-1', patient: 'Sophie Keller', time: at(2,14,15), note: 'Impfung', status: 'bestätigt', createdAt: at(-3,9,15) }
  ];
})();

export default { marketPraxen, demoOwnerPraxen, demoTermine };
