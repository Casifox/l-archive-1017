/**
 * Gestionnaire de sauvegarde local.
 *
 * - sauvegarde versionnée (js/save-schema.js) ;
 * - copie de secours automatique avant chaque écriture ;
 * - refus d’une sauvegarde future, sans écrasement ;
 * - récupération depuis la copie de secours ;
 * - export / import vérifiés ;
 * - stockage mémoire de secours si localStorage est indisponible.
 */

import {
  GAME_ID,
  SAVE_VERSION,
  createInitialState,
  formatRealDate,
  formatShortPlayTime,
  nowIso,
  summarizeState,
  validateState
} from "./save-schema.js";

export const SAVE_KEY = "archive1017.save.v1";
export const BACKUP_KEY = "archive1017.save.backup.v1";
export const CORRUPT_KEY = "archive1017.save.corrupt.v1";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

/** Vérifie que localStorage est réellement utilisable (mode privé, quotas). */
export function createSafeStorage(candidate = globalThis.localStorage) {
  if (!candidate) return { storage: new MemoryStorage(), available: false };
  try {
    const probe = "__archive1017_probe__";
    candidate.setItem(probe, "1");
    candidate.removeItem(probe);
    return { storage: candidate, available: true };
  } catch {
    return { storage: new MemoryStorage(), available: false };
  }
}

function parseJson(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export class SaveManager {
  constructor(storage = globalThis.localStorage) {
    const safe = createSafeStorage(storage);
    this.storage = safe.storage;
    this.available = safe.available;
    this.lastError = null;
  }

  read(key) {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      this.lastError = error;
      return null;
    }
  }

  write(key, value) {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch (error) {
      this.lastError = error;
      return false;
    }
  }

  remove(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      this.lastError = error;
      return false;
    }
  }

  /**
   * Charge la sauvegarde principale, puis la copie de secours.
   * @returns {{ok:boolean, state:object|null, source:string|null, recovered:boolean, reason:string|null, error:string|null}}
   */
  load() {
    const primaryRaw = this.read(SAVE_KEY);
    const primary = this._readState(primaryRaw, "primary");

    if (primary.ok) {
      return {
        ok: true,
        state: primary.state,
        source: "primary",
        recovered: false,
        reason: null,
        error: null
      };
    }

    if (primary.reason === "newer-version") {
      return {
        ok: false,
        state: null,
        source: "primary",
        recovered: false,
        reason: "newer-version",
        error: primary.errors[0] || "Sauvegarde trop récente."
      };
    }

    if (primaryRaw && !primary.ok) {
      // On préserve la donnée illisible avant toute tentative de récupération.
      if (!this.read(CORRUPT_KEY)) this.write(CORRUPT_KEY, primaryRaw);
    }

    const backupRaw = this.read(BACKUP_KEY);
    const backup = this._readState(backupRaw, "backup");
    if (backup.ok) {
      // La copie de secours devient la sauvegarde principale.
      if (this.write(SAVE_KEY, JSON.stringify(backup.state))) {
        return {
          ok: true,
          state: backup.state,
          source: "backup",
          recovered: true,
          reason: "backup-recovered",
          error: null
        };
      }
      return {
        ok: true,
        state: backup.state,
        source: "backup",
        recovered: true,
        reason: "backup-not-promoted",
        error: "La copie de secours est lisible mais n’a pas pu être promue."
      };
    }

    if (!primaryRaw && !backupRaw) {
      return {
        ok: false,
        state: null,
        source: null,
        recovered: false,
        reason: "empty",
        error: null
      };
    }

    return {
      ok: false,
      state: null,
      source: null,
      recovered: false,
      reason: primary.reason || backup.reason || "corrupt",
      error: "Aucune sauvegarde lisible n’a été trouvée. Les données illisibles ont été conservées."
    };
  }

  _readState(raw, source) {
    if (!raw) return { ok: false, reason: "empty", errors: [], source };
    const parsed = parseJson(raw);
    if (!parsed) return { ok: false, reason: "invalid-json", errors: ["Le fichier n’est pas du JSON valide."], source };
    const result = validateState(parsed, { requireMeta: true });
    return { ...result, source };
  }

  /**
   * Écrit la sauvegarde. L’ancienne version valide est copiée en secours
   * avant l’écriture. Une sauvegarde invalide n’est jamais écrite.
   */
  save(state) {
    if (!isObject(state)) {
      return { ok: false, error: "État invalide." };
    }
    const candidate = {
      ...state,
      version: SAVE_VERSION,
      meta: { ...(state.meta || {}), game: GAME_ID, updatedAt: nowIso() }
    };
    const validation = validateState(candidate, { requireMeta: true });
    if (!validation.ok) {
      return { ok: false, error: validation.errors.join(" ") || "Sauvegarde refusée." };
    }

    const previousRaw = this.read(SAVE_KEY);
    if (previousRaw) {
      const previous = this._readState(previousRaw, "primary");
      if (previous.ok) this.write(BACKUP_KEY, previousRaw);
    }

    const serialized = JSON.stringify(validation.state);
    if (!this.write(SAVE_KEY, serialized)) {
      return { ok: false, error: "Écriture impossible. Le stockage local est peut-être plein ou désactivé." };
    }
    return { ok: true, state: validation.state, error: null };
  }

  /** Sauvegarde explicite de secours (avant import ou réinitialisation). */
  backup(state) {
    if (!isObject(state)) return false;
    const validation = validateState(state, { requireMeta: true });
    if (!validation.ok) return false;
    return this.write(BACKUP_KEY, JSON.stringify(validation.state));
  }

  hasSave() {
    if (!this.read(SAVE_KEY) && !this.read(BACKUP_KEY)) return false;
    return this.load().ok;
  }

  hasBackup() {
    const raw = this.read(BACKUP_KEY);
    if (!raw) return false;
    return validateState(parseJson(raw), { requireMeta: true }).ok;
  }

  /** Résumé de la sauvegarde principale ou de la copie de secours. */
  getSummary(key = SAVE_KEY) {
    const raw = this.read(key);
    if (!raw) return { exists: false, summary: null, reason: "empty", dateLabel: null };
    const parsed = parseJson(raw);
    if (!parsed) return { exists: true, summary: null, reason: "invalid-json", dateLabel: null };
    const validation = validateState(parsed, { requireMeta: true });
    if (!validation.ok) {
      return {
        exists: true,
        summary: null,
        reason: validation.reason,
        dateLabel: null,
        error: validation.errors.join(" ")
      };
    }
    const summary = summarizeState(validation.state);
    return {
      exists: true,
      summary,
      reason: null,
      dateLabel: formatRealDate(summary.updatedAt),
      playTimeLabel: formatShortPlayTime(summary.playTime)
    };
  }

  exportSave(state) {
    const validation = validateState(state, { requireMeta: true });
    if (!validation.ok) throw new Error("La sauvegarde ne peut pas être exportée : elle est invalide.");
    return JSON.stringify(
      {
        game: GAME_ID,
        version: SAVE_VERSION,
        exportedAt: nowIso(),
        state: validation.state
      },
      null,
      2
    );
  }

  /**
   * Importe un JSON exporté. Accepte aussi un état brut.
   * Ne modifie jamais le stockage : l’appelant décide d’adopter l’état.
   */
  importSave(text) {
    const parsed = parseJson(text);
    if (!parsed) {
      return { ok: false, error: "Le fichier n’est pas du JSON valide.", state: null };
    }
    const wrapperVersion = Number(parsed.version);
    if (Number.isFinite(wrapperVersion) && wrapperVersion > SAVE_VERSION) {
      return {
        ok: false,
        error: `Cette sauvegarde utilise la version ${wrapperVersion}, plus récente que la version ${SAVE_VERSION}.`,
        reason: "newer-version",
        state: null
      };
    }
    const candidate = isObject(parsed.state) ? parsed.state : parsed;
    if (isObject(parsed) && parsed.game && parsed.game !== GAME_ID) {
      return { ok: false, error: "Ce fichier appartient à un autre jeu.", state: null };
    }
    const validation = validateState(candidate, { requireMeta: true });
    if (!validation.ok) {
      return {
        ok: false,
        error: validation.errors.join(" ") || "Sauvegarde invalide.",
        reason: validation.reason,
        state: null
      };
    }
    return { ok: true, state: validation.state, error: null };
  }

  /** Adopte un état importé : l’ancienne sauvegarde valide part en secours. */
  adopt(state) {
    const previousRaw = this.read(SAVE_KEY);
    if (previousRaw) {
      const previous = this._readState(previousRaw, "primary");
      if (previous.ok) this.write(BACKUP_KEY, previousRaw);
    }
    return this.save(state);
  }

  restoreBackup() {
    const raw = this.read(BACKUP_KEY);
    if (!raw) return { ok: false, error: "Aucune copie de secours." };
    const validation = validateState(parseJson(raw), { requireMeta: true });
    if (!validation.ok) return { ok: false, error: "La copie de secours est illisible." };
    if (!this.write(SAVE_KEY, JSON.stringify(validation.state))) {
      return { ok: false, error: "Impossible d’écrire la sauvegarde restaurée." };
    }
    return { ok: true, state: validation.state };
  }

  reset({ keepBackup = false } = {}) {
    this.remove(SAVE_KEY);
    if (!keepBackup) this.remove(BACKUP_KEY);
    return { ok: true };
  }

  resetAll() {
    this.remove(SAVE_KEY);
    this.remove(BACKUP_KEY);
    this.remove(CORRUPT_KEY);
    return { ok: true };
  }

  clearCorrupt() {
    this.remove(CORRUPT_KEY);
  }

  createNewState() {
    return createInitialState();
  }
}
