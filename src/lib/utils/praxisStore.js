/**
 * Zentrale Praxis-/Termin-Daten für Praxis-Logins (Mock, LocalStorage)
 * - Seeded mit 2–3 Beispiel-Praxen und mehreren Terminen (heute + nächste Tage)
 * - Nutzt termineStore für Termin-Persistenz
 */

import { demoOwnerPraxen } from '$lib/db/demoData.js';
import { addTermin, getTermine, updateTermin } from '$lib/utils/termineStore.js';

const PRAXEN_KEY = 'arzttool_praxen_owner';
const PATIENTS_KEY = 'arzttool_patients';
const SAMPLE_OWNER = 'sample_owner';

function slugifyName(name = '') {
  return `pt-${String(name)
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') || 'unbekannt'}`;
}

function readPraxen() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRAXEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePraxen(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRAXEN_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

function readPatients() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePatients(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

function buildSeedTermine(praxenList) {
  const findPraxis = (id) => praxenList.find((p) => String(p._id || p.id) === String(id)) || praxenList[0];
  const today = new Date();
  const mkTime = (dayOffset, hh, mm) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
  };

  const seeds = [
    { id: 'apt-001', patientId: 'pt-anna-meier', praxisId: 'owner-1', patient: 'Anna Meier', time: mkTime(0, 9, 30), status: 'Bestätigt', note: 'Routine-Check', patientAddress: 'Sihlfeldstrasse 22, 8004 Zürich', patientPhone: '+41 76 555 12 34', patientEmail: 'anna.meier@example.com', healthInsurance: 'Helsana', insuranceNumber: '807.1234.56', insuranceCardImage: 'helsana-karte.jpg', medicalNote: 'Allergie auf Penicillin, Blutdruckmedikation Ramipril 5 mg morgens.', treatments: [ { date: '2025-10-14', time: '09:15', title: 'Blutdruckkontrolle', note: 'Werte stabil, Medikation beibehalten. Arzt: Dr. Nora Keller.', praxis: 'Hausarztpraxis City' } ] },
    { id: 'apt-002', patientId: 'pt-peter-huber', praxisId: 'owner-1', patient: 'Peter Huber', time: mkTime(0, 11, 0), status: 'Angefragt', note: '', patientAddress: 'Badenerstrasse 190, 8004 Zürich', patientPhone: '+41 79 777 88 22', patientEmail: 'peter.huber@example.com', healthInsurance: 'CSS', insuranceNumber: '756.9988.44', insuranceCardImage: 'css-karte.jpg', medicalNote: 'Chronische Rhinitis, nutzt Meerwasser-Nasenspray bei Bedarf.', treatments: [ { date: '2025-09-02', time: '16:40', title: 'Allergieberatung', note: 'Nasenspray empfohlen, keine systemische Therapie nötig. Arzt: Dr. Nora Keller.', praxis: 'Hausarztpraxis City' } ] },
    { id: 'apt-003', patientId: 'pt-sophie-keller', praxisId: 'owner-2', patient: 'Sophie Keller', time: mkTime(1, 10, 0), status: 'Bestätigt', note: 'Laborwerte besprechen', patientAddress: 'Länggassstrasse 12, 3012 Bern', patientPhone: '+41 78 222 33 55', patientEmail: 'sophie.keller@example.com', healthInsurance: 'Swica', insuranceNumber: '756.2200.11', insuranceCardImage: 'swica-karte.jpg', medicalNote: 'Eisenmangel, nimmt Eisentabletten 2x/Woche; keine Allergien bekannt.', treatments: [ { date: '2025-11-18', time: '10:20', title: 'Eisenkontrolle', note: 'Ferritin verbessert, weiterführen für 3 Monate. Arzt: Dr. Lea Marti.', praxis: 'Praxis Länggasse' } ] },
    { id: 'apt-004', patientId: 'pt-marco-zimmermann', praxisId: 'owner-2', patient: 'Marco Zimmermann', time: mkTime(2, 14, 0), status: 'Abgesagt', note: 'Terminverschiebung', patientAddress: 'Effingerstrasse 5, 3008 Bern', patientPhone: '+41 76 880 44 90', patientEmail: 'marco.zimmermann@example.com', healthInsurance: 'KPT', insuranceNumber: '756.3311.22', insuranceCardImage: 'kpt-karte.jpg', medicalNote: 'Status nach Kreuzband-OP (2024), wöchentliche Physiotherapie.', treatments: [ { date: '2025-08-07', time: '13:10', title: 'Physio Verlaufskontrolle', note: 'Beweglichkeit gut, weitere Kräftigung empfohlen. Arzt: Dr. Lea Marti.', praxis: 'Praxis Länggasse' } ] },
    { id: 'apt-005', patientId: 'pt-lisa-bachmann', praxisId: 'owner-3', patient: 'Lisa Bachmann', time: mkTime(3, 9, 0), status: 'Angefragt', note: 'Erstberatung', patientAddress: 'Museggstrasse 9, 6004 Luzern', patientPhone: '+41 77 340 12 12', patientEmail: 'lisa.bachmann@example.com', healthInsurance: 'Helsana', insuranceNumber: '756.4412.77', insuranceCardImage: 'helsana-karte.jpg', medicalNote: 'Heuschnupfen (Birke/Gräser), verwendet Cetirizin im Frühjahr.', treatments: [ { date: '2025-04-22', time: '15:05', title: 'Antihistaminika-Aufklärung', note: 'Bedarfsgemässe Einnahme, Nasensalbe empfohlen. Arzt: Dr. Miriam Sidler.', praxis: 'Seegarten Praxis' } ] },
    { id: 'apt-006', patientId: 'pt-thomas-widmer', praxisId: 'owner-3', patient: 'Thomas Widmer', time: mkTime(6, 15, 30), status: 'Bestätigt', note: 'Kontrolluntersuchung', patientAddress: 'Haldenstrasse 33, 6006 Luzern', patientPhone: '+41 76 770 55 66', patientEmail: 'thomas.widmer@example.com', healthInsurance: 'Sanitas', insuranceNumber: '756.5522.88', insuranceCardImage: 'sanitas-karte.jpg', medicalNote: 'Hypercholesterinämie, nimmt Atorvastatin 20 mg abends.', treatments: [ { date: '2025-10-30', time: '11:45', title: 'Lipidscreening', note: 'LDL noch erhöht, Dosis beibehalten, Diät besprochen. Arzt: Dr. Miriam Sidler.', praxis: 'Seegarten Praxis' } ] },
    { id: 'apt-007', patientId: 'pt-stefan-bauer', praxisId: 'owner-4', patient: 'Stefan Bauer', time: mkTime(0, 8, 0), status: 'Bestätigt', note: 'Physiotherapie Knie', patientAddress: 'St. Alban-Vorstadt 21, 4052 Basel', patientPhone: '+41 79 222 44 66', patientEmail: 'stefan.bauer@example.com', healthInsurance: 'Concordia', insuranceNumber: '756.6600.12', insuranceCardImage: 'concordia-karte.jpg', medicalNote: 'Asthma bronchiale, Notfallspray Salbutamol vorhanden.', treatments: [ { date: '2025-09-15', time: '08:50', title: 'Asthma-Kontrolle', note: 'Peak-Flow stabil, Inhalationstechnik geübt. Arzt: Dr. Felix Graf.', praxis: 'Orthopädie Zentrum Basel' } ] },
    { id: 'apt-008', patientId: 'pt-monika-gerber', praxisId: 'owner-4', patient: 'Monika Gerber', time: mkTime(1, 9, 30), status: 'Bestätigt', note: 'Nachkontrolle Schulter', patientAddress: 'Spalenberg 88, 4051 Basel', patientPhone: '+41 76 888 11 44', patientEmail: 'monika.gerber@example.com', healthInsurance: 'CSS', insuranceNumber: '756.7700.45', insuranceCardImage: 'css-karte.jpg', medicalNote: 'Laktoseintoleranz, achtet auf laktosefreie Ernährung.', treatments: [ { date: '2025-07-12', time: '10:05', title: 'Schulter-Nachkontrolle', note: 'Beweglichkeit verbessert, Physiotherapie fortsetzen. Arzt: Dr. Felix Graf.', praxis: 'Orthopädie Zentrum Basel' } ] },
    { id: 'apt-009', patientId: 'pt-daniel-wyss', praxisId: 'owner-4', patient: 'Daniel Wyss', time: mkTime(4, 14, 0), status: 'Angefragt', note: 'Sportverletzung Sprunggelenk', patientAddress: 'Clarastrasse 5, 4058 Basel', patientPhone: '+41 78 900 33 22', patientEmail: 'daniel.wyss@example.com', healthInsurance: 'Helsana', insuranceNumber: '756.8822.09', insuranceCardImage: 'helsana-karte.jpg', medicalNote: 'Keine chronischen Erkrankungen; nimmt aktuell NSAIDs bei Bedarf.', treatments: [ { date: '2025-11-02', time: '14:30', title: 'Sprunggelenk Kontrolle', note: 'Schwellung rückläufig, Laufpensum langsam steigern. Arzt: Dr. Felix Graf.', praxis: 'Orthopädie Zentrum Basel' } ] },
    { id: 'apt-010', patientId: 'pt-emma-mueller', praxisId: 'owner-5', patient: 'Emma Müller', time: mkTime(0, 10, 30), status: 'Bestätigt', note: 'U7 Vorsorgeuntersuchung', patientAddress: 'Rosenbergstrasse 40, 9000 St. Gallen', patientPhone: '+41 71 555 66 11', patientEmail: 'emma.mueller.family@example.com', healthInsurance: 'Swica', insuranceNumber: '756.9900.10', insuranceCardImage: 'swica-karte.jpg', medicalNote: 'Kind, Impfungen gemäss Plan; Erdnussallergie bekannt (EpiPen vorhanden).', treatments: [ { date: '2025-05-10', time: '09:05', title: 'Impfung DTaP Booster', note: 'Gut vertragen, keine Reaktion. Arzt: Dr. Jana Frei.', praxis: 'Kinderpraxis Rosenberg' } ] },
    { id: 'apt-011', patientId: 'pt-luca-weber', praxisId: 'owner-5', patient: 'Luca Weber', time: mkTime(1, 14, 0), status: 'Bestätigt', note: 'Impfung MMR', patientAddress: 'Rosenbergstrasse 40, 9000 St. Gallen', patientPhone: '+41 71 555 66 11', patientEmail: 'luca.weber.family@example.com', healthInsurance: 'Sanitas', insuranceNumber: '756.1122.33', insuranceCardImage: 'sanitas-karte.jpg', medicalNote: 'Kind, keine Allergien bekannt; leichte Neurodermitis in Wintermonaten.', treatments: [ { date: '2025-06-01', time: '15:20', title: 'Neurodermitis Beratung', note: 'Basispflege mit rückfettender Creme, Kortisonsalbe bei Schub. Arzt: Dr. Jana Frei.', praxis: 'Kinderpraxis Rosenberg' } ] },
    { id: 'apt-012', patientId: 'pt-mia-schmidt', praxisId: 'owner-5', patient: 'Mia Schmidt', time: mkTime(2, 9, 0), status: 'Angefragt', note: 'Allergietest', patientAddress: 'Vadianstrasse 8, 9000 St. Gallen', patientPhone: '+41 78 211 33 44', patientEmail: 'mia.schmidt@example.com', healthInsurance: 'CSS', insuranceNumber: '756.3344.55', insuranceCardImage: 'css-karte.jpg', medicalNote: 'Vermutete Hausstauballergie; Test angefragt.', treatments: [ { date: '2025-10-05', time: '11:10', title: 'HNO-Kontrolle', note: 'Nasenatmung frei, Testung geplant. Arzt: Dr. Jana Frei.', praxis: 'Kinderpraxis Rosenberg' } ] },
    { id: 'apt-013', patientId: 'pt-noah-fischer', praxisId: 'owner-5', patient: 'Noah Fischer', time: mkTime(5, 15, 30), status: 'Bestätigt', note: 'Entwicklungsgespräch', patientAddress: 'Langgasse 14, 9008 St. Gallen', patientPhone: '+41 77 990 22 33', patientEmail: 'noah.fischer@example.com', healthInsurance: 'Helsana', insuranceNumber: '756.5566.77', insuranceCardImage: 'helsana-karte.jpg', medicalNote: 'ADHS-Diagnose, aktuell Verhaltenstherapie; keine Medikation.', treatments: [ { date: '2025-09-20', time: '13:00', title: 'Verhaltenstherapie Review', note: 'Elterntraining fortsetzen, nächster Check in 3 Monaten. Arzt: Dr. Jana Frei.', praxis: 'Kinderpraxis Rosenberg' } ] }
  ];

  return seeds.map((s) => {
    const p = findPraxis(s.praxisId);
    return {
      id: s.id,
      patientId: s.patientId || slugifyName(s.patient),
      praxisId: s.praxisId,
      praxisName: p?.name,
      fach: p?.fach,
      city: p?.city,
      address: p?.address,
      phone: p?.phone,
      email: p?.email,
      waitMinutes: p?.waitMinutes ?? 0,
      patient: s.patient,
      patientAddress: s.patientAddress,
      patientPhone: s.patientPhone,
      patientEmail: s.patientEmail,
      healthInsurance: s.healthInsurance,
      insuranceNumber: s.insuranceNumber,
      insuranceCardImage: s.insuranceCardImage,
      medicalNote: s.medicalNote,
      date: s.time.slice(0, 10),
      time: s.time,
      dateTime: s.time,
      note: s.note,
      status: s.status,
      createdAt: new Date().toISOString()
    };
  });
}

function ensureSampleTermine(praxenList) {
  if (typeof window === 'undefined') return;
  const existingIds = new Set(getTermine().map((t) => t.id));
  const seeds = buildSeedTermine(praxenList);
  seeds.forEach((t) => {
    if (!existingIds.has(t.id)) {
      addTermin(t);
    }
  });
  // backfill patientId for existing termine without id
  const termine = getTermine();
  termine.forEach((t) => {
    if (!t.patientId && t.patient) {
      updateTermin(t.id, { patientId: slugifyName(t.patient) });
    }
  });

  // Zusätzlich: reichlich Termine für Januar 2026 erzeugen (4–8 pro Tag je Praxis)
  seedJanuaryTermine(praxenList);
}

function ensureSamplePatients(praxenList) {
  if (typeof window === 'undefined') return;
  let patients = readPatients();
  const termine = getTermine();
  const existing = new Map(patients.map((p) => [String(p.id), p]));

  termine.forEach((t) => {
    const pid = t.patientId || slugifyName(t.patient);
    const [firstName, ...rest] = String(t.patient || '').split(' ');
    const lastName = rest.join(' ');
    if (!existing.has(pid)) {
      existing.set(pid, {
        id: pid,
        praxisId: t.praxisId,
        praxisName: t.praxisName,
        firstName,
        lastName,
        fullName: t.patient,
        email: t.patientEmail,
        phone: t.patientPhone,
        address: t.patientAddress,
        healthInsurance: t.healthInsurance,
        insuranceNumber: t.insuranceNumber,
        insuranceCardImage: t.insuranceCardImage,
        medicalNote: t.medicalNote || 'Keine medizinischen Hinweise hinterlegt.',
        treatments: t.treatments || [],
        registeredAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  patients = Array.from(existing.values()).filter(Boolean);
  // limit to patients belonging to known praxen for the owner
  const ids = new Set(praxenList.map((p) => String(p._id || p.id)));
  patients = patients.filter((p) => ids.has(String(p.praxisId)));
  writePatients(patients);
}

export function ensureSampleData() {
  if (typeof window === 'undefined') return;
  let praxen = readPraxen();
  if (!praxen.length) {
    // clone seed and make sure ownerId is set
    praxen = demoOwnerPraxen.map((p) => ({ ...p, ownerId: p.ownerId || SAMPLE_OWNER }));
    writePraxen(praxen);
  }
  ensureSampleTermine(praxen);
  ensureSamplePatients(praxen);
}

export function getPraxenForOwner(ownerId) {
  ensureSampleData();
  const all = readPraxen();
  return all.filter((p) => !ownerId || p.ownerId === ownerId || p.ownerId === SAMPLE_OWNER);
}

export function getPraxisById(id) {
  ensureSampleData();
  return readPraxen().find((p) => String(p._id || p.id) === String(id)) || null;
}

export function addPraxis(praxis) {
  ensureSampleData();
  const list = readPraxen();
  const id = praxis._id || praxis.id || `praxis-${Date.now()}`;
  const ownerId = praxis.ownerId || SAMPLE_OWNER;
  const entry = { ...praxis, _id: id, id, ownerId, updatedAt: new Date().toISOString() };
  list.push(entry);
  writePraxen(list);
  return entry;
}

export function updatePraxis(id, updates) {
  ensureSampleData();
  const list = readPraxen();
  const idx = list.findIndex((p) => String(p._id || p.id) === String(id));
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  writePraxen(list);
  return true;
}

export function deletePraxis(id) {
  ensureSampleData();
  const list = readPraxen();
  const filtered = list.filter((p) => String(p._id || p.id) !== String(id));
  if (filtered.length === list.length) return false;
  writePraxen(filtered);
  return true;
}

export function getTermineForOwner(ownerId) {
  ensureSampleData();
  const praxen = getPraxenForOwner(ownerId);
  const ids = new Set(praxen.map((p) => String(p._id || p.id)));
  return getTermine()
    .filter((t) => ids.has(String(t.praxisId)))
    .sort((a, b) => new Date(a.dateTime || a.time) - new Date(b.dateTime || b.time));
}

export function setTerminStatus(id, status) {
  return updateTermin(id, { status });
}

export function getPatientsForOwner(ownerId) {
  ensureSampleData();
  const praxen = getPraxenForOwner(ownerId);
  const ids = new Set(praxen.map((p) => String(p._id || p.id)));
  return readPatients().filter((p) => ids.has(String(p.praxisId)));
}

export function getPatientById(id) {
  ensureSampleData();
  return readPatients().find((p) => String(p.id) === String(id)) || null;
}

export function updatePatientNote(id, medicalNote) {
  ensureSampleData();
  const patients = readPatients();
  const idx = patients.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return false;
  patients[idx] = { ...patients[idx], medicalNote, updatedAt: new Date().toISOString() };
  writePatients(patients);
  // sync note onto termine for consistency
  const termine = getTermine().filter((t) => String(t.patientId || slugifyName(t.patient)) === String(id));
  termine.forEach((t) => updateTermin(t.id, { medicalNote }));
  return true;
}

export default {
  ensureSampleData,
  getPraxenForOwner,
  getPraxisById,
  addPraxis,
  updatePraxis,
  deletePraxis,
  getTermineForOwner,
  setTerminStatus,
  getPatientsForOwner,
  getPatientById,
  updatePatientNote
};

/**
 * Interner Helfer: Erzeugt viele plausible Termine für Januar 2026.
 * - Einmalig pro Browser (Flag in LocalStorage)
 * - Für jeden Tag 4–8 Slots zwischen 08:00 und 17:30
 */
function seedJanuaryTermine(praxenList) {
  if (typeof window === 'undefined') return;
  const FLAG = 'arzttool_seed_jan2026_done';
  try {
    if (localStorage.getItem(FLAG)) return; // bereits erzeugt
  } catch (_) { /* ignore */ }

  const year = 2026; // Vorgabe aus Nutzerwunsch/Datumskontext
  const month = 0; // Januar
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstNames = ['Anna','Peter','Sophie','Marco','Lisa','Thomas','Stefan','Monika','Daniel','Emma','Luca','Mia','Noah','Lea','Nora','Felix','Jana','Andreas','Julia','Michael','Claudia'];
  const lastNames = ['Meier','Huber','Keller','Zimmermann','Bachmann','Widmer','Bauer','Gerber','Wyss','Müller','Weber','Schmidt','Fischer','Marti','Graf','Frei','Lehmann','Kramer','Steiner','Vogel'];
  const notes = ['Routine-Check','Impfung','Nachkontrolle','Erstberatung','Laborbesprechung','Physiotherapie','Allergietest','Entwicklungsgespräch'];
  const insurances = ['Helsana','CSS','Swica','Sanitas','KPT','Concordia'];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Zeitfenster im Halbstundenraster
  const timePool = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];

  praxenList.forEach((praxis) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const count = randInt(4, 8);
      const chosen = new Set();
      for (let i = 0; i < count; i++) {
        // Einzigartige Uhrzeit wählen
        let hhmm = rand(timePool);
        let guard = 0;
        while (chosen.has(hhmm) && guard++ < 10) hhmm = rand(timePool);
        chosen.add(hhmm);
        const [hh, mm] = hhmm.split(':').map(Number);
        const dt = new Date(year, month, day, hh, mm, 0, 0);

        // Patientendaten generieren
        const patient = `${rand(firstNames)} ${rand(lastNames)}`;
        const emailName = patient.toLowerCase().replace(/\s+/g, '.').replace(/[äöü]/g, (m) => ({'ä':'ae','ö':'oe','ü':'ue'}[m]));
        const phone = `+41 ${randInt(70,79)} ${randInt(100,999)} ${randInt(10,99)} ${randInt(10,99)}`;
        const address = `${randInt(1,99)} ${['Seestrasse','Bahnhofstrasse','Marktgasse','Länggassstrasse','Aeschenvorstadt'][randInt(0,4)]}, ${praxis.city}`;
        const statusPool = ['Bestätigt','Angefragt'];
        const status = rand(statusPool);

        const termin = {
          praxisId: String(praxis._id || praxis.id),
          praxisName: praxis.name,
          fach: praxis.fach,
          city: praxis.city,
          address: praxis.address,
          phone: praxis.phone,
          email: praxis.email,
          waitMinutes: praxis.waitMinutes ?? 0,
          patient,
          patientAddress: address,
          patientPhone: phone,
          patientEmail: `${emailName}@example.com`,
          healthInsurance: rand(insurances),
          insuranceNumber: `756.${randInt(1000,9999)}.${randInt(10,99)}`,
          date: dt.toISOString().slice(0,10),
          time: dt.toISOString(),
          dateTime: dt.toISOString(),
          note: rand(notes),
          status,
          createdAt: new Date().toISOString()
        };

        addTermin(termin);
      }
    }
  });

  try { localStorage.setItem(FLAG, 'true'); } catch (_) { /* ignore */ }
}
