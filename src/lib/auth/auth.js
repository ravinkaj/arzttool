// Simple client-side mock authentication/session helper
// Stores session in localStorage under 'arzttool_session'
import { writable } from 'svelte/store';

const STORAGE_KEY = 'arzttool_session';

function readSession() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

const initial = typeof window !== 'undefined' ? readSession() : null;
export const session = writable(initial);

// Persist store to localStorage
if (typeof window !== 'undefined') {
  session.subscribe((v) => {
    try {
      if (v) localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  });
}

export function login(role = 'patient', userId = null) {
  const s = { role, userId: userId || (role === 'arzt' ? 'arzt1' : 'user_' + Date.now()) };
  session.set(s);
  return s;
}

export function logout() {
  session.set(null);
}

export function getSession() {
  return readSession();
}

export function getRole() {
  const s = readSession();
  return s ? s.role : null;
}

export function isLoggedIn() {
  return !!readSession();
}

export default { session, login, logout, getSession, getRole, isLoggedIn };
