import test from "node:test";
import assert from "node:assert/strict";

import { ACHIEVEMENTS } from "../data/achievements.js";
import { CONNECTIONS } from "../data/connections.js";
import { SECRET_EVIDENCE, evidenceForDossier } from "../data/evidence.js";
import {
  ACHIEVEMENT_CONDITIONS,
  achievementStats,
  pendingAchievements,
  unlockPendingAchievements
} from "../js/achievements.js";
import { createInitialState } from "../js/save-schema.js";
import { newGame } from "./helpers.js";

function stateWith(overrides = {}) {
  return { ...createInitialState(), ...overrides };
}

test("toutes les conditions sont définies et ne lèvent pas d’erreur", () => {
  const state = createInitialState();
  for (const achievement of ACHIEVEMENTS) {
    assert.equal(typeof ACHIEVEMENT_CONDITIONS[achievement.id], "function");
    assert.doesNotThrow(() => ACHIEVEMENT_CONDITIONS[achievement.id](state));
  }
});

test("Première connexion dépend de l’introduction", () => {
  const state = createInitialState();
  assert.equal(ACHIEVEMENT_CONDITIONS["premiere-connexion"](state), false);
  state.introDone = true;
  assert.equal(ACHIEVEMENT_CONDITIONS["premiere-connexion"](state), true);
});

test("Observateur exige toutes les preuves du dossier 01", () => {
  const state = createInitialState();
  for (const item of evidenceForDossier(1)) {
    if (item.id !== "ev-d1-photo") state.evidence[item.id] = { found: true };
  }
  assert.equal(ACHIEVEMENT_CONDITIONS.observateur(state), false);
  state.evidence["ev-d1-photo"] = { found: true };
  assert.equal(ACHIEVEMENT_CONDITIONS.observateur(state), true);
});

test("Détective dépend du compteur sans indice", () => {
  const state = createInitialState();
  state.counters.puzzlesNoHint = 4;
  assert.equal(ACHIEVEMENT_CONDITIONS.detective(state), false);
  state.counters.puzzlesNoHint = 5;
  assert.equal(ACHIEVEMENT_CONDITIONS.detective(state), true);
});

test("Mémoire parfaite exige les cinq dossiers", () => {
  const state = createInitialState();
  state.completedDossiers = [1, 2, 3, 4];
  assert.equal(ACHIEVEMENT_CONDITIONS["memoire-parfaite"](state), false);
  state.completedDossiers = [1, 2, 3, 4, 5];
  assert.equal(ACHIEVEMENT_CONDITIONS["memoire-parfaite"](state), true);
});

test("Sceptique exige quatre choix et aucune confiance aveugle", () => {
  const state = createInitialState();
  state.choices = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
  assert.equal(ACHIEVEMENT_CONDITIONS.sceptique(state), true);
  state.counters.blindTrustChoices = 1;
  assert.equal(ACHIEVEMENT_CONDITIONS.sceptique(state), false);
});

test("Archiviste exige les trois secrets", () => {
  const state = createInitialState();
  for (const id of SECRET_EVIDENCE.slice(0, 2)) state.evidence[id] = { found: true };
  assert.equal(ACHIEVEMENT_CONDITIONS.archiviste(state), false);
  state.evidence[SECRET_EVIDENCE[2]] = { found: true };
  assert.equal(ACHIEVEMENT_CONDITIONS.archiviste(state), true);
});

test("Les succès de fin dépendent de la fin choisie", () => {
  const state = createInitialState();
  assert.equal(ACHIEVEMENT_CONDITIONS["derniere-porte"](state), false);
  state.ending = "publier";
  assert.equal(ACHIEVEMENT_CONDITIONS["derniere-porte"](state), true);
  assert.equal(ACHIEVEMENT_CONDITIONS["voix-de-la-verite"](state), true);
  assert.equal(ACHIEVEMENT_CONDITIONS.heritier(state), false);
  state.ending = "gardien";
  assert.equal(ACHIEVEMENT_CONDITIONS.heritier(state), true);
  state.ending = "detruire";
  assert.equal(ACHIEVEMENT_CONDITIONS.silence(state), true);
  state.ending = "eveil";
  assert.equal(ACHIEVEMENT_CONDITIONS.lucide(state), true);
});

test("Empathie et Contradiction dépendent de leurs compteurs", () => {
  const state = createInitialState();
  state.counters.empathyChoices = 2;
  state.counters.centralContradictions = 2;
  assert.equal(ACHIEVEMENT_CONDITIONS.empathie(state), false);
  assert.equal(ACHIEVEMENT_CONDITIONS.contradiction(state), false);
  state.counters.empathyChoices = 3;
  state.counters.centralContradictions = 3;
  assert.equal(ACHIEVEMENT_CONDITIONS.empathie(state), true);
  assert.equal(ACHIEVEMENT_CONDITIONS.contradiction(state), true);
});

test("Cartographe exige les sept connexions", () => {
  const state = createInitialState();
  for (const connection of CONNECTIONS.slice(0, 6)) state.connections[connection.id] = { foundAt: new Date().toISOString() };
  assert.equal(ACHIEVEMENT_CONDITIONS.cartographe(state), false);
  state.connections[CONNECTIONS[6].id] = { foundAt: new Date().toISOString() };
  assert.equal(ACHIEVEMENT_CONDITIONS.cartographe(state), true);
});

test("un déblocage met à jour l’état et le profil, une seule fois", () => {
  const { profileManager } = newGame();
  const state = createInitialState();
  state.introDone = true;
  const first = unlockPendingAchievements(state, profileManager);
  assert.ok(first.some((achievement) => achievement.id === "premiere-connexion"));
  const second = unlockPendingAchievements(state, profileManager);
  assert.equal(second.length, 0);
  assert.equal(profileManager.hasAchievement("premiere-connexion"), true);
  assert.ok(state.achievements["premiere-connexion"]);
  const third = unlockPendingAchievements({ ...state, achievements: {} }, profileManager);
  assert.ok(third.some((achievement) => achievement.id === "premiere-connexion"));
});

test("pendingAchievements ne renvoie que les succès non débloqués", () => {
  const state = createInitialState();
  state.introDone = true;
  const pending = pendingAchievements(state);
  assert.ok(pending.some((achievement) => achievement.id === "premiere-connexion"));
  state.achievements["premiere-connexion"] = new Date().toISOString();
  const after = pendingAchievements(state);
  assert.ok(!after.some((achievement) => achievement.id === "premiere-connexion"));
});

test("les statistiques de succès sont cohérentes", () => {
  const { gameState, profileManager } = newGame();
  gameState.completeIntro();
  const stats = achievementStats(gameState.state, profileManager);
  assert.equal(stats.total, ACHIEVEMENTS.length);
  assert.ok(stats.unlocked >= 1);
});

test("les succès restent acquis après une nouvelle partie", () => {
  const { gameState, profileManager } = newGame();
  gameState.completeIntro();
  assert.equal(profileManager.hasAchievement("premiere-connexion"), true);
  gameState.createNewGame();
  assert.equal(profileManager.hasAchievement("premiere-connexion"), true);
  assert.equal(gameState.getState().achievements["premiere-connexion"], undefined);
});
