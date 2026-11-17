import test from "node:test";
import assert from "node:assert/strict";

import { DOSSIERS } from "../data/dossiers.js";
import { EVIDENCE_BY_ID, SECRET_EVIDENCE, evidenceForDossier } from "../data/evidence.js";
import { PUZZLES } from "../data/puzzles.js";
import { CONNECTIONS } from "../data/connections.js";
import {
  completeAllDossiers,
  completeDossier,
  createGame,
  findEvidence,
  newGame,
  solvePuzzle
} from "./helpers.js";

test("une nouvelle partie démarre dans un état propre", () => {
  const { gameState } = newGame();
  const state = gameState.getState();
  assert.equal(state.introDone, false);
  assert.deepEqual(state.unlockedDossiers, [1]);
  assert.deepEqual(state.completedDossiers, []);
  assert.deepEqual(state.stats, { confiance: 3, lucidite: 3, empathie: 3 });
  assert.equal(gameState.getEvidenceCount().found, 0);
  assert.equal(gameState.getSolvedPuzzleCount().solved, 0);
  assert.equal(gameState.saveManager.load().ok, true);
  assert.equal(gameState.profileManager.getProfile().runs, 1);
});

test("l’introduction débloque le dossier 01 et le premier succès", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  assert.equal(gameState.getState().introDone, true);
  assert.equal(gameState.isDossierUnlocked(1), true);
  assert.equal(gameState.profileManager.hasAchievement("premiere-connexion"), true);
  assert.ok(gameState.getJournal().some((entry) => entry.title === "Connexion établie"));
});

test("la collecte de preuves est idempotente et journalise les secrets", () => {
  const { gameState } = newGame();
  const first = gameState.findEvidence("ev-d1-elias");
  const second = gameState.findEvidence("ev-d1-elias");
  assert.equal(first.id, second.id);
  assert.equal(gameState.getEvidenceCount().found, 1);
  gameState.markEvidenceRead("ev-d1-elias");
  assert.equal(gameState.getState().evidence["ev-d1-elias"].isNew, false);
  gameState.findEvidence("ev-d2-note");
  assert.ok(gameState.getJournal().some((entry) => entry.type === "secret"));
  assert.equal(gameState.getSecretCount().found, 1);
});

test("un indice marque l’énigme et empêche le compteur sans indice", () => {
  const { gameState } = newGame();
  gameState.useHint("d1-contradiction", 1);
  const hint = gameState.useHint("d1-contradiction", 2);
  assert.ok(hint.includes("22 h 05"));
  assert.equal(gameState.getPuzzleProgress("d1-contradiction").hintsUsed, 2);
  const result = solvePuzzle(gameState, "d1-contradiction");
  assert.equal(result.correct, true);
  assert.equal(gameState.getState().counters.puzzlesNoHint, 0);
  assert.equal(gameState.getState().stats.lucidite, 4);
  assert.equal(gameState.isEvidenceFound("ev-d1-audio"), true);
});

test("cinq énigmes sans indice débloquent Détective", () => {
  const { gameState } = newGame();
  for (const puzzle of PUZZLES.slice(0, 5)) {
    assert.equal(solvePuzzle(gameState, puzzle.id).correct, true);
  }
  assert.equal(gameState.getState().counters.puzzlesNoHint, 5);
  assert.equal(gameState.profileManager.hasAchievement("detective"), true);
});

test("les choix sont idempotents et modifient les compteurs", () => {
  const { gameState } = newGame();
  const choice = {
    id: "test-choice",
    dossier: 1,
    prompt: "Question ?",
    optionId: "a",
    label: "Réponse A",
    effects: { confiance: 1, counters: { empathyChoices: 1 }, flags: ["test-flag"] }
  };
  assert.equal(gameState.recordChoice(choice), true);
  assert.equal(gameState.recordChoice(choice), false);
  assert.equal(gameState.getState().choices.length, 1);
  assert.equal(gameState.getState().stats.confiance, 4);
  assert.equal(gameState.getState().counters.empathyChoices, 1);
  assert.equal(gameState.getState().flags["test-flag"], true);
  assert.ok(gameState.getJournal().some((entry) => entry.type === "decision" && entry.title === "Réponse A"));
});

test("Sceptique se débloque après quatre choix sans confiance aveugle", () => {
  const { gameState } = newGame();
  for (let index = 0; index < 4; index += 1) {
    gameState.recordChoice({
      id: `sceptique-${index}`,
      dossier: 1,
      prompt: "Question",
      optionId: "verify",
      label: "Je vérifie",
      effects: { lucidite: 1 }
    });
  }
  assert.equal(gameState.profileManager.hasAchievement("sceptique"), true);
});

test("Empathie se débloque après trois choix d’écoute", () => {
  const { gameState } = newGame();
  for (let index = 0; index < 3; index += 1) {
    gameState.recordChoice({
      id: `empathie-${index}`,
      dossier: 2,
      prompt: "Question",
      optionId: "listen",
      label: "J’écoute",
      effects: { counters: { empathyChoices: 1 } }
    });
  }
  assert.equal(gameState.profileManager.hasAchievement("empathie"), true);
});

test("un dossier ne se clôt pas avant ses conditions", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  const result = gameState.completeDossier(1);
  assert.equal(result.ok, false);
  assert.ok(result.missing.puzzles.length === 2);
  assert.ok(result.missing.evidence.length > 0);
});

test("la clôture du dossier 01 débloque le dossier 02 et Observateur", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  const result = completeDossier(gameState, 1);
  assert.equal(result.ok, true);
  assert.equal(gameState.isDossierCompleted(1), true);
  assert.equal(gameState.isDossierUnlocked(2), true);
  assert.equal(gameState.profileManager.hasAchievement("observateur"), true);
  assert.ok(gameState.getJournal().some((entry) => entry.title === "DOSSIER 01 clos"));
  assert.equal(gameState.getDossierProgress(1).canComplete, false);
});

test("la collecte complète des preuves du dossier 01 est nécessaire à Observateur", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  for (const item of evidenceForDossier(1)) {
    if (item.id !== "ev-d1-photo") gameState.findEvidence(item.id);
  }
  gameState.checkAchievements();
  assert.equal(gameState.profileManager.hasAchievement("observateur"), false);
  gameState.findEvidence("ev-d1-photo");
  assert.equal(gameState.profileManager.hasAchievement("observateur"), true);
});

test("le tableau d’enquête accepte les paires valides, dans les deux sens", () => {
  const { gameState } = newGame();
  gameState.findEvidence("ev-d1-elias");
  gameState.findEvidence("ev-d1-electrique");
  const result = gameState.recordConnection("ev-d1-electrique", "ev-d1-elias");
  assert.equal(result.ok, true);
  assert.equal(gameState.hasConnection("conn-elias"), true);
  assert.equal(gameState.getState().stats.lucidite, 4);
  const duplicate = gameState.recordConnection("ev-d1-elias", "ev-d1-electrique");
  assert.equal(duplicate.reason, "already");
  const wrong = gameState.recordConnection("ev-d1-elias", "ev-d1-mara");
  assert.equal(wrong.reason, "no-link");
});

test("Cartographe se débloque avec les sept connexions", () => {
  const { gameState } = newGame();
  for (const connection of CONNECTIONS) {
    assert.equal(gameState.recordConnection(connection.a, connection.b).ok, true);
  }
  assert.equal(gameState.profileManager.hasAchievement("cartographe"), true);
});

test("les trois contradictions centrales se cumulent", () => {
  const { gameState } = newGame();
  solvePuzzle(gameState, "d1-contradiction");
  solvePuzzle(gameState, "d4-versions");
  solvePuzzle(gameState, "d5-chaine");
  assert.equal(gameState.getState().counters.centralContradictions, 3);
  assert.equal(gameState.profileManager.hasAchievement("contradiction"), true);
});

test("Archiviste exige les trois documents secrets", () => {
  const { gameState } = newGame();
  for (const id of SECRET_EVIDENCE.slice(0, 2)) gameState.findEvidence(id);
  assert.equal(gameState.profileManager.hasAchievement("archiviste"), false);
  gameState.findEvidence(SECRET_EVIDENCE[2]);
  assert.equal(gameState.profileManager.hasAchievement("archiviste"), true);
});

test("les statistiques sont bornées entre 0 et 10", () => {
  const { gameState } = newGame();
  gameState.applyStats({ confiance: 50, lucidite: -50, empathie: 2 });
  assert.deepEqual(gameState.getStats(), { confiance: 10, lucidite: 0, empathie: 5 });
});

test("les cinq dossiers peuvent être clos et Mémoire parfaite est débloqué", () => {
  const { gameState } = newGame();
  completeAllDossiers(gameState);
  assert.equal(gameState.getState().completedDossiers.length, 5);
  assert.equal(gameState.profileManager.hasAchievement("memoire-parfaite"), true);
  assert.equal(gameState.getState().unlockedDossiers.length, 5);
  assert.equal(gameState.getSolvedPuzzleCount().solved, PUZZLES.length);
});

test("les objectifs et points manquants sont calculés", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  const progress = gameState.getDossierProgress(1);
  assert.equal(progress.puzzleTotal, 2);
  assert.equal(progress.puzzleSolved, 0);
  assert.equal(progress.evidenceTotal, 9);
  assert.equal(progress.canComplete, false);
  assert.equal(progress.objectives.length, 4);
  const missing = gameState.getMissingForDossier(1);
  assert.equal(missing.puzzles.length, 2);
  assert.ok(missing.evidence.length >= 1);
});

test("le journal se filtre par dossier et par type", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  gameState.findEvidence("ev-d1-elias");
  gameState.recordChoice({ id: "j1", dossier: 1, prompt: "P", optionId: "o", label: "L", effects: {} });
  assert.ok(gameState.getJournal({ dossier: 1 }).length >= 1);
  assert.ok(gameState.getJournal({ type: "decision" }).length === 1);
  assert.ok(gameState.getJournal().length >= 2);
});

test("le profil conserve les succès et les fins entre deux parties", () => {
  const { gameState } = newGame();
  gameState.completeIntro();
  const profile = gameState.profileManager.getProfile();
  assert.ok(profile.achievements["premiere-connexion"]);
  gameState.createNewGame();
  assert.equal(gameState.profileManager.hasAchievement("premiere-connexion"), true);
  assert.equal(gameState.profileManager.getProfile().runs, 2);
  assert.equal(gameState.getState().introDone, false);
});

test("une preuve inconnue est ignorée proprement", () => {
  const { gameState } = newGame();
  assert.equal(gameState.findEvidence("ev-inexistante"), null);
  assert.equal(gameState.getEvidence("ev-inexistante"), null);
  assert.equal(gameState.isEvidenceFound("ev-inexistante"), false);
});

test("les métadonnées de dossier sont accessibles", () => {
  const { gameState } = newGame();
  for (const dossier of DOSSIERS) {
    assert.equal(gameState.getDossier(dossier.id).title, dossier.title);
    assert.ok(EVIDENCE_BY_ID[evidenceForDossier(dossier.id)[0].id]);
  }
  assert.equal(gameState.getDossier(99), null);
});
