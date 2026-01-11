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

export async function login(role = 'patient', userId = null, password = null) {
  // If an email/password is provided, try server-side login
  if (userId && password) {
    try {
      const res = await fetch('/api/user', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'login', email: userId, password }) });
      const j = await res.json();
      if (j.ok) {
        const s = { role: j.role || role, userId: j.userId, name: j.name || null };
        session.set(s);
        return s;
      }
      throw new Error(j.error || 'Login failed');
    } catch (e) {
      throw e;
    }
  }
  const s = { role, userId: userId || (role === 'praxis' ? 'praxis1' : 'user_' + Date.now()), name: null };
  session.set(s);
  return s;
}

export async function register(email, password, role = 'patient', name = null) {
  const res = await fetch('/api/user', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'register', email, password, role, name }) });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'Registration failed');
  const s = { role, userId: j.userId || email, name: j.name || null };
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
