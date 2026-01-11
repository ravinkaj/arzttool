/**
 * Zentrale Termine-Verwaltung mit LocalStorage-Persistierung
 */

const STORAGE_KEY = 'arzttool_termine';

/**
 * Generiert eine eindeutige ID
 */
function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Liest alle Termine aus LocalStorage
 */
export function getTermine() {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Fehler beim Lesen von Terminen:', e);
    return [];
  }
}

/**
 * Liest Termine für eine spezifische Praxis
 */
export function getTermineByPraxis(praxisId) {
  return getTermine().filter(t => t.praxisId === praxisId);
}

/**
 * Fügt einen neuen Termin hinzu
 * @param {Object} termin - Termin-Objekt
 * @returns {Object} Der hinzugefügte Termin mit generierter ID
 */
export function addTermin(termin) {
  if (typeof window === 'undefined') return termin;
  
  const termine = getTermine();
  const newTermin = {
    id: generateId(),
    ...termin,
    createdAt: new Date().toISOString(),
    status: termin.status || 'Bestätigt'
  };
  
  termine.push(newTermin);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(termine));
  } catch (e) {
    console.error('Fehler beim Speichern von Terminen:', e);
  }
  
  return newTermin;
}

/**
 * Storniert einen Termin (setzt status auf 'Storniert')
 */
export function cancelTermin(id) {
  if (typeof window === 'undefined') return false;
  
  const termine = getTermine();
  const termin = termine.find(t => t.id === id);
  
  if (!termin) return false;
  
  termin.status = 'Storniert';
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(termine));
  } catch (e) {
    console.error('Fehler beim Aktualisieren des Termins:', e);
    return false;
  }
  
  return true;
}

/**
 * Aktualisiert einen Termin
 */
export function updateTermin(id, updates) {
  if (typeof window === 'undefined') return false;
  
  const termine = getTermine();
  const termin = termine.find(t => t.id === id);
  
  if (!termin) return false;
  
  Object.assign(termin, updates);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(termine));
  } catch (e) {
    console.error('Fehler beim Aktualisieren des Termins:', e);
    return false;
  }
  
  return true;
}

/**
 * Löscht einen Termin
 */
export function deleteTermin(id) {
  if (typeof window === 'undefined') return false;
  
  let termine = getTermine();
  const originalLength = termine.length;
  termine = termine.filter(t => t.id !== id);
  
  if (termine.length === originalLength) return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(termine));
  } catch (e) {
    console.error('Fehler beim Löschen des Termins:', e);
    return false;
  }
  
  return true;
}

/**
 * Löscht alle Termine (für Tests)
 */
export function clearAllTermine() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Fehler beim Löschen aller Termine:', e);
  }
}
