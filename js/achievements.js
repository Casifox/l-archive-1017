/**
 * Conditions des succès. Les textes sont dans data/achievements.js.
 * Chaque condition est une fonction pure sur l’état de la partie.
 */

import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID } from "../data/achievements.js";
import { CONNECTIONS } from "../data/connections.js";
import { evidenceForDossier, SECRET_EVIDENCE } from "../data/evidence.js";
import { nowIso } from "./save-schema.js";

const found = (state, id) => Boolean(state.evidence?.[id]?.found);
const allFound = (state, ids) => ids.every((id) => found(state, id));
const solved = (state, id) => Boolean(state.puzzles?.[id]?.solved);

const D1_EVIDENCE = evidenceForDossier(1).map((item) => item.id);

export const ACHIEVEMENT_CONDITIONS = {
  "premiere-connexion": (state) => state.introDone === true,
  observateur: (state) => allFound(state, D1_EVIDENCE),
  detective: (state) => (state.counters?.puzzlesNoHint || 0) >= 5,
  "memoire-parfaite": (state) => state.completedDossiers?.length === 5,
  sceptique: (state) => (state.choices?.length || 0) >= 4 && (state.counters?.blindTrustChoices || 0) === 0,
  archiviste: (state) => allFound(state, SECRET_EVIDENCE),
  lucide: (state) => state.ending === "eveil",
  "derniere-porte": (state) => Boolean(state.ending),
  empathie: (state) => (state.counters?.empathyChoices || 0) >= 3,
  contradiction: (state) => (state.counters?.centralContradictions || 0) >= 3,
  "voix-de-la-verite": (state) => state.ending === "publier",
  heritier: (state) => state.ending === "gardien",
  silence: (state) => state.ending === "detruire",
  cartographe: (state) => CONNECTIONS.every((connection) => Boolean(state.connections?.[connection.id]?.foundAt))
};

/** Succès qui devraient être débloqués et ne le sont pas encore. */
export function pendingAchievements(state) {
  if (!state) return [];
  return ACHIEVEMENTS.filter((achievement) => {
    if (state.achievements?.[achievement.id]) return false;
    const condition = ACHIEVEMENT_CONDITIONS[achievement.id];
    if (!condition) return false;
    try {
      return Boolean(condition(state));
    } catch (error) {
      console.error(`Condition de succès en erreur : ${achievement.id}`, error);
      return false;
    }
  });
}

/**
 * Débloque les succès en attente sur l’état et le profil.
 * @returns {Array<object>} les succès nouvellement débloqués
 */
export function unlockPendingAchievements(state, profile = null) {
  const pending = pendingAchievements(state);
  const unlocked = [];
  for (const achievement of pending) {
    const at = nowIso();
    state.achievements = state.achievements || {};
    state.achievements[achievement.id] = at;
    if (profile) profile.unlockAchievement(achievement.id);
    unlocked.push(achievement);
  }
  return unlocked;
}

export function achievementById(id) {
  return ACHIEVEMENTS_BY_ID[id] || null;
}

export function achievementStats(state, profile = null) {
  const unlocked = profile ? profile.profile.achievements : state?.achievements || {};
  return {
    unlocked: Object.keys(unlocked).length,
    total: ACHIEVEMENTS.length
  };
}

export function isSolved(state, puzzleId) {
  return solved(state, puzzleId);
}
