/** Fixtures et aides de test (aucune dépendance au navigateur). */

import { SaveManager } from "../js/save-manager.js";
import { ProfileManager } from "../js/profile-manager.js";
import { GameState } from "../js/state.js";
import { createInitialState, GAME_ID, SAVE_VERSION } from "../js/save-schema.js";
import { DOSSIERS } from "../data/dossiers.js";
import { PUZZLES_BY_ID } from "../data/puzzles.js";
import { EVIDENCE, SECRET_EVIDENCE, evidenceForDossier } from "../data/evidence.js";
import { CONNECTIONS } from "../data/connections.js";

export class MockStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial));
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
  clear() {
    this.map.clear();
  }
  key(index) {
    return [...this.map.keys()][index] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

export function createGame({ storage = new MockStorage() } = {}) {
  const saveManager = new SaveManager(storage);
  const profileManager = new ProfileManager(storage);
  const gameState = new GameState({ saveManager, profileManager });
  return { storage, saveManager, profileManager, gameState };
}

export function newGame(options) {
  const game = createGame(options);
  game.gameState.createNewGame();
  game.gameState.setPlaying(false);
  return game;
}

export function correctAnswer(puzzle) {
  switch (puzzle.type) {
    case "pair":
    case "order":
    case "chain":
      return [...puzzle.solution];
    case "assign":
    case "classify":
      return JSON.parse(JSON.stringify(puzzle.solution));
    case "single":
      return puzzle.solution;
    case "cipher":
      return puzzle.accepted[0];
    case "mastermind":
      return puzzle.solution;
    default:
      throw new Error(`Type inconnu : ${puzzle.type}`);
  }
}

export function solvePuzzle(gameState, puzzleId) {
  const puzzle = PUZZLES_BY_ID[puzzleId];
  if (!puzzle) throw new Error(`Énigme inconnue : ${puzzleId}`);
  return gameState.submitPuzzleAnswer(puzzleId, correctAnswer(puzzle));
}

export function findEvidence(gameState, id) {
  return gameState.findEvidence(id);
}

export function findDossierEvidence(gameState, dossier, { includeOptional = true } = {}) {
  const items = evidenceForDossier(dossier).filter((item) => includeOptional || item.important);
  for (const item of items) gameState.findEvidence(item.id);
  return items;
}

export function completeIntro(gameState) {
  gameState.completeIntro();
}

export function completeDossier(gameState, dossierId) {
  const dossier = DOSSIERS.find((entry) => entry.id === Number(dossierId));
  if (!dossier) throw new Error(`Dossier inconnu : ${dossierId}`);
  for (const item of evidenceForDossier(dossier.id)) gameState.findEvidence(item.id);
  for (const puzzleId of dossier.puzzles) solvePuzzle(gameState, puzzleId);
  return gameState.completeDossier(dossier.id);
}

export function completeAllDossiers(gameState) {
  gameState.completeIntro();
  for (const dossier of DOSSIERS) {
    const result = completeDossier(gameState, dossier.id);
    if (!result.ok) throw new Error(`Dossier ${dossier.id} non clos : ${result.error}`);
  }
  gameState.setPlaying(false);
  return gameState;
}

export function findSecrets(gameState) {
  for (const id of SECRET_EVIDENCE) gameState.findEvidence(id);
}

export function buildCompletedState({ stats = 8, ending = null, allConnections = false } = {}) {
  const { storage, gameState, profileManager, saveManager } = createGame();
  gameState.createNewGame();
  gameState.setPlaying(false);
  completeAllDossiers(gameState);
  findSecrets(gameState);
  if (allConnections) {
    for (const connection of CONNECTIONS) {
      gameState.recordConnection(connection.a, connection.b);
    }
  }
  gameState.state.stats.confiance = stats;
  gameState.state.stats.lucidite = stats;
  gameState.state.stats.empathie = stats;
  gameState.state.flags.selfRecognized = true;
  gameState.state.flags["central-elias"] = true;
  gameState.state.flags["central-silhouettes"] = true;
  gameState.state.flags["central-operator"] = true;
  gameState.recomputeCounters();
  if (ending) gameState.state.ending = ending;
  gameState.saveNow();
  return { storage, saveManager, profileManager, gameState, state: gameState.state };
}

export function serializeSave(state) {
  return JSON.stringify(state);
}

export function allEvidenceIds() {
  return EVIDENCE.map((item) => item.id);
}

export function makeLegacyState() {
  return {
    version: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    introDone: true,
    unlockedDossiers: [1, 2],
    completedDossiers: [1],
    stats: { confiance: 4, lucidite: 5, empathie: 6 },
    puzzles: {},
    evidence: {},
    choices: [],
    journal: []
  };
}

export const TEST_GAME_ID = GAME_ID;
export const TEST_SAVE_VERSION = SAVE_VERSION;
export { createInitialState };
