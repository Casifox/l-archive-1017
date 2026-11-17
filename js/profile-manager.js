/**
 * Profil local : succès et fins découverts, conservés entre les parties.
 * Fichier séparé de la sauvegarde pour qu’une nouvelle partie ne les efface
 * pas. Un effacement explicite reste possible depuis les paramètres.
 */

import { nowIso } from "./save-schema.js";
import { createSafeStorage } from "./save-manager.js";

export const PROFILE_KEY = "archive1017.profile.v1";
export const PROFILE_CORRUPT_KEY = "archive1017.profile.corrupt.v1";
export const PROFILE_VERSION = 1;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeMap(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, at] of Object.entries(value).slice(0, 100)) {
    if (typeof id !== "string" || !id) continue;
    if (id === "__proto__" || id === "constructor" || id === "prototype") continue;
    result[id.slice(0, 80)] = typeof at === "string" && !Number.isNaN(Date.parse(at)) ? at : nowIso();
  }
  return result;
}

export function createDefaultProfile() {
  const at = nowIso();
  return {
    version: PROFILE_VERSION,
    achievements: {},
    endings: {},
    runs: 0,
    createdAt: at,
    updatedAt: at
  };
}

export function validateProfile(raw) {
  if (!isObject(raw)) return { ok: false, profile: createDefaultProfile(), error: "Profil invalide." };
  if (Number(raw.version) > PROFILE_VERSION) {
    return { ok: false, profile: createDefaultProfile(), error: "Profil trop récent." };
  }
  const profile = {
    version: PROFILE_VERSION,
    achievements: sanitizeMap(raw.achievements),
    endings: sanitizeMap(raw.endings),
    runs: Number.isFinite(Number(raw.runs)) ? Math.max(0, Math.trunc(Number(raw.runs))) : 0,
    createdAt: typeof raw.createdAt === "string" && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : nowIso(),
    updatedAt: typeof raw.updatedAt === "string" && !Number.isNaN(Date.parse(raw.updatedAt)) ? raw.updatedAt : nowIso()
  };
  return { ok: true, profile, error: null };
}

export class ProfileManager {
  constructor(storage = globalThis.localStorage) {
    const safe = createSafeStorage(storage);
    this.storage = safe.storage;
    this.available = safe.available;
    this.profile = createDefaultProfile();
    this.recovered = false;
    this._load();
  }

  _read(key) {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  _write(key, value) {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  _load() {
    const raw = this._read(PROFILE_KEY);
    if (!raw) return;
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    const result = validateProfile(parsed);
    if (result.ok) {
      this.profile = result.profile;
      return;
    }
    if (!this._read(PROFILE_CORRUPT_KEY)) this._write(PROFILE_CORRUPT_KEY, raw);
    this.profile = createDefaultProfile();
    this.recovered = true;
  }

  save() {
    this.profile.updatedAt = nowIso();
    return this._write(PROFILE_KEY, JSON.stringify(this.profile));
  }

  unlockAchievement(id) {
    if (!id || this.profile.achievements[id]) return false;
    this.profile.achievements[id] = nowIso();
    this.save();
    return true;
  }

  recordEnding(id) {
    if (!id) return false;
    const isNew = !this.profile.endings[id];
    if (isNew) this.profile.endings[id] = nowIso();
    this.save();
    return isNew;
  }

  recordRunStart() {
    this.profile.runs += 1;
    this.save();
    return this.profile.runs;
  }

  hasAchievement(id) {
    return Boolean(this.profile.achievements[id]);
  }

  hasEnding(id) {
    return Boolean(this.profile.endings[id]);
  }

  getProfile() {
    return this.profile;
  }

  clear() {
    this.profile = createDefaultProfile();
    this._write(PROFILE_KEY, JSON.stringify(this.profile));
    this._read(PROFILE_CORRUPT_KEY) && this.storage.removeItem(PROFILE_CORRUPT_KEY);
    return true;
  }
}
