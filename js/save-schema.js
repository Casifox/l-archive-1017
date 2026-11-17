/**
 * Schéma de sauvegarde de L'ARCHIVE 1017.
 *
 * Toute sauvegarde est validée et réparée champ par champ avant d’être
 * acceptée. Une sauvegarde d’une version future est refusée (jamais
 * écrasée silencieusement). Une sauvegarde d’une version antérieure est
 * migrée.
 */

export const GAME_ID = "L-ARCHIVE-1017";
export const SAVE_VERSION = 1;
export const MAX_STAT = 10;
export const START_STAT = 3;

const DOSSIER_IDS = [1, 2, 3, 4, 5];
const COUNTER_KEYS = ["puzzlesNoHint", "blindTrustChoices", "empathyChoices", "centralContradictions"];
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function safeKey(value, max = 80) {
  const key = asString(value, "", max);
  return key && !UNSAFE_KEYS.has(key) ? key : null;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function makeId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createInitialState() {
  const at = nowIso();
  return {
    version: SAVE_VERSION,
    meta: {
      game: GAME_ID,
      createdAt: at,
      updatedAt: at,
      runId: makeId("run")
    },
    introDone: false,
    currentDossier: 1,
    unlockedDossiers: [1],
    completedDossiers: [],
    puzzles: {},
    evidence: {},
    connections: {},
    stats: { confiance: START_STAT, lucidite: START_STAT, empathie: START_STAT },
    choices: [],
    journal: [],
    achievements: {},
    counters: {
      puzzlesNoHint: 0,
      blindTrustChoices: 0,
      empathyChoices: 0,
      centralContradictions: 0
    },
    flags: {},
    seenScenes: [],
    ending: null,
    playTime: 0
  };
}

function asString(value, fallback = "", max = 4000) {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function asBool(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp(Math.trunc(number), min, max);
}

function asDateString(value, fallback) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return value;
}

function sanitizeDossierList(value, fallback = []) {
  if (!Array.isArray(value)) return [...fallback];
  const unique = [...new Set(value.map((item) => Number(item)).filter((item) => DOSSIER_IDS.includes(item)))];
  unique.sort((a, b) => a - b);
  return unique;
}

function sanitizePuzzles(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, raw] of Object.entries(value).slice(0, 100)) {
    if (!isObject(raw)) continue;
    const key = safeKey(id);
    if (!key) continue;
    const guesses = Array.isArray(raw.meta?.guesses)
      ? raw.meta.guesses
          .slice(-30)
          .filter((guess) => isObject(guess) && typeof guess.guess === "string")
          .map((guess) => ({
            guess: asString(guess.guess, "", 12),
            correct: asInt(guess.correct, 0, 0, 4),
            placed: asInt(guess.placed, 0, 0, 4)
          }))
      : [];
    result[key] = {
      solved: asBool(raw.solved),
      attempts: asInt(raw.attempts, 0, 0, 9999),
      hintsUsed: asInt(raw.hintsUsed, 0, 0, 2),
      solvedAt: raw.solvedAt ? asDateString(raw.solvedAt, null) : null,
      meta: guesses.length ? { guesses } : {}
    };
  }
  return result;
}

function sanitizeEvidence(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, raw] of Object.entries(value).slice(0, 200)) {
    if (!isObject(raw)) continue;
    const key = safeKey(id);
    if (!key) continue;
    result[key] = {
      found: asBool(raw.found),
      foundAt: raw.foundAt ? asDateString(raw.foundAt, null) : null,
      isNew: asBool(raw.isNew, false)
    };
  }
  return result;
}

function sanitizeConnections(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, raw] of Object.entries(value).slice(0, 100)) {
    if (!isObject(raw)) continue;
    const key = safeKey(id);
    if (!key) continue;
    result[key] = {
      foundAt: raw.foundAt ? asDateString(raw.foundAt, nowIso()) : nowIso()
    };
  }
  return result;
}

function sanitizeChoices(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-200)
    .filter((choice) => isObject(choice))
    .map((choice) => ({
      id: asString(choice.id, "", 80),
      dossier: asInt(choice.dossier, 0, 0, 5),
      prompt: asString(choice.prompt, "", 500),
      optionId: asString(choice.optionId, "", 80),
      label: asString(choice.label, "", 500),
      at: choice.at ? asDateString(choice.at, null) : null
    }))
    .filter((choice) => choice.id && choice.label);
}

function sanitizeJournal(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-500)
    .filter((entry) => isObject(entry))
    .map((entry) => ({
      id: asString(entry.id, makeId("log"), 80),
      type: asString(entry.type, "event", 30),
      title: asString(entry.title, "", 200),
      text: asString(entry.text, "", 4000),
      dossier: asInt(entry.dossier, 0, 0, 5),
      at: entry.at ? asDateString(entry.at, nowIso()) : nowIso(),
      playTime: asInt(entry.playTime, 0, 0, 10000000)
    }))
    .filter((entry) => entry.title);
}

function sanitizeAchievements(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, at] of Object.entries(value).slice(0, 100)) {
    const key = safeKey(id);
    if (!key) continue;
    result[key] = asDateString(at, nowIso());
  }
  return result;
}

function sanitizeCounters(value) {
  const result = {};
  for (const key of COUNTER_KEYS) {
    result[key] = asInt(value?.[key], 0, 0, 10000);
  }
  return result;
}

function sanitizeFlags(value) {
  if (!isObject(value)) return {};
  const result = {};
  for (const [id, flag] of Object.entries(value).slice(0, 200)) {
    if (flag !== true) continue;
    const key = safeKey(id);
    if (key) result[key] = true;
  }
  return result;
}

function sanitizeSeenScenes(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string").map((item) => item.slice(0, 80)))].slice(-100);
}

/**
 * Valide, répare et normalise une sauvegarde.
 * @returns {{ok:boolean, state?:object, reason?:string, errors:string[]}}
 */
export function validateState(raw, options = {}) {
  const { requireMeta = true, allowRepair = true } = options;
  const errors = [];

  if (!isObject(raw)) {
    return { ok: false, reason: "not-an-object", errors: ["La sauvegarde n’est pas un objet JSON."] };
  }

  const rawVersion = asInt(raw.version, 0, 0, 99);
  if (rawVersion > SAVE_VERSION) {
    return {
      ok: false,
      reason: "newer-version",
      errors: [`La sauvegarde utilise la version ${rawVersion}, plus récente que la version ${SAVE_VERSION}.`]
    };
  }

  let migrated = raw;
  if (rawVersion < SAVE_VERSION) {
    const migration = migrateState(raw);
    if (!migration.ok) return { ok: false, reason: "migration-failed", errors: migration.errors };
    migrated = migration.state;
  }

  if (requireMeta && migrated.meta?.game !== GAME_ID) {
    return { ok: false, reason: "wrong-game", errors: ["Ce fichier n’est pas une sauvegarde de L’ARCHIVE 1017."] };
  }

  const hasCore =
    typeof migrated.introDone === "boolean" ||
    isObject(migrated.puzzles) ||
    isObject(migrated.evidence) ||
    isObject(migrated.stats);
  if (!hasCore) {
    return { ok: false, reason: "no-core", errors: ["La sauvegarde ne contient aucune donnée de jeu reconnaissable."] };
  }

  if (!allowRepair) {
    // Validation stricte réservée aux tests : on vérifie les champs critiques.
    if (!isObject(migrated.stats)) errors.push("stats manquant");
    if (!Array.isArray(migrated.unlockedDossiers)) errors.push("unlockedDossiers manquant");
    if (!isObject(migrated.puzzles)) errors.push("puzzles manquant");
    if (errors.length) return { ok: false, reason: "strict-validation", errors };
  }

  const at = nowIso();
  const createdAt = asDateString(migrated.meta?.createdAt, at);
  const updatedAt = asDateString(migrated.meta?.updatedAt, at);

  const state = {
    version: SAVE_VERSION,
    meta: {
      game: GAME_ID,
      createdAt,
      updatedAt,
      runId: asString(migrated.meta?.runId, makeId("run"), 80)
    },
    introDone: asBool(migrated.introDone),
    currentDossier: asInt(migrated.currentDossier, 1, 1, 5),
    unlockedDossiers: sanitizeDossierList(migrated.unlockedDossiers, [1]),
    completedDossiers: sanitizeDossierList(migrated.completedDossiers),
    puzzles: sanitizePuzzles(migrated.puzzles),
    evidence: sanitizeEvidence(migrated.evidence),
    connections: sanitizeConnections(migrated.connections),
    stats: {
      confiance: asInt(migrated.stats?.confiance, START_STAT, 0, MAX_STAT),
      lucidite: asInt(migrated.stats?.lucidite, START_STAT, 0, MAX_STAT),
      empathie: asInt(migrated.stats?.empathie, START_STAT, 0, MAX_STAT)
    },
    choices: sanitizeChoices(migrated.choices),
    journal: sanitizeJournal(migrated.journal),
    achievements: sanitizeAchievements(migrated.achievements),
    counters: sanitizeCounters(migrated.counters),
    flags: sanitizeFlags(migrated.flags),
    seenScenes: sanitizeSeenScenes(migrated.seenScenes),
    ending: typeof migrated.ending === "string" ? migrated.ending.slice(0, 40) : null,
    playTime: asInt(migrated.playTime, 0, 0, 100000000)
  };

  if (!state.unlockedDossiers.length) state.unlockedDossiers = [1];
  if (!state.unlockedDossiers.includes(1)) state.unlockedDossiers.unshift(1);
  state.completedDossiers = state.completedDossiers.filter((id) => state.unlockedDossiers.includes(id));
  if (!state.unlockedDossiers.includes(state.currentDossier)) {
    state.currentDossier = state.unlockedDossiers[state.unlockedDossiers.length - 1] || 1;
  }
  if (!state.introDone && state.currentDossier > 1) state.currentDossier = 1;

  return { ok: true, state, errors };
}

/**
 * Migration des anciennes sauvegardes.
 * La version 0 est un format hypothétique pré-versionnement : on récupère
 * les champs connus et on laisse le réparateur faire le reste.
 */
export function migrateState(raw) {
  const version = asInt(raw?.version, 0, 0, 99);
  if (version === 0) {
    const migrated = {
      ...raw,
      version: SAVE_VERSION,
      meta: {
        game: GAME_ID,
        createdAt: raw?.createdAt || nowIso(),
        updatedAt: raw?.updatedAt || nowIso(),
        runId: raw?.runId || makeId("run")
      }
    };
    return { ok: true, state: migrated };
  }
  return { ok: false, errors: [`Aucune migration connue depuis la version ${version}.`] };
}

/** Résumé affichable d’une sauvegarde, sans exposer tout l’état. */
export function summarizeState(state) {
  return {
    dossier: state.currentDossier,
    introDone: state.introDone,
    completed: state.completedDossiers.length,
    evidence: Object.values(state.evidence).filter((item) => item.found).length,
    puzzles: Object.values(state.puzzles).filter((item) => item.solved).length,
    playTime: state.playTime,
    updatedAt: state.meta.updatedAt,
    createdAt: state.meta.createdAt,
    ending: state.ending
  };
}

export function formatPlayTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatShortPlayTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")}`;
  if (m > 0) return `${m} min`;
  return `${seconds} s`;
}

export function formatRealDate(iso) {
  if (!iso || Number.isNaN(Date.parse(iso))) return "date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(iso));
}
