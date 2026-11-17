/**
 * État central de la partie.
 *
 * Toutes les mutations passent par cette classe : statistiques, preuves,
 * énigmes, choix, journal, succès, fins. Les vues ne modifient jamais
 * l’état directement. Chaque mutation importante programme une sauvegarde.
 */

import { DOSSIERS, DOSSIERS_BY_ID } from "../data/dossiers.js";
import { EVIDENCE_BY_ID, SECRET_EVIDENCE, evidenceForDossier } from "../data/evidence.js";
import { PUZZLES, PUZZLES_BY_ID } from "../data/puzzles.js";
import { CONNECTIONS, findConnection } from "../data/connections.js";
import { ENDINGS } from "../data/endings.js";
import { ACHIEVEMENTS } from "../data/achievements.js";
import {
  MAX_STAT,
  SAVE_VERSION,
  clamp,
  createInitialState,
  formatPlayTime,
  makeId,
  nowIso
} from "./save-schema.js";
import { checkAnswer } from "./puzzles.js";
import { unlockPendingAchievements } from "./achievements.js";
import {
  canChooseEnding,
  getEndingAvailability as computeEndingAvailability,
  resolveEnding
} from "./endings.js";

const IMPORTANT_EVIDENCE = Object.fromEntries(
  DOSSIERS.map((dossier) => [
    dossier.id,
    evidenceForDossier(dossier.id)
      .filter((item) => item.important)
      .map((item) => item.id)
  ])
);

const STAT_KEYS = ["confiance", "lucidite", "empathie"];
const CENTRAL_FLAGS = ["central-elias", "central-silhouettes", "central-operator"];

export class GameState {
  constructor({ saveManager, profileManager }) {
    this.saveManager = saveManager;
    this.profileManager = profileManager;
    this.state = null;
    this.listeners = new Map();
    this.saveTimer = null;
    this.clockTimer = null;
    this.playing = false;
    this.lastSaveError = null;
  }

  /* ------------------------------------------------------------------ */
  /* Événements                                                         */
  /* ------------------------------------------------------------------ */
  on(event, listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event, payload) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of [...listeners]) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Erreur d’un abonné à l’événement ${event}`, error);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Cycle de vie                                                       */
  /* ------------------------------------------------------------------ */
  createNewGame() {
    this.state = createInitialState();
    this.profileManager.recordRunStart();
    this.addJournal({
      type: "system",
      title: "Nouvelle session",
      text: "L’archive a été ouverte. Une nouvelle session a commencé."
    });
    this.saveNow();
    this.setPlaying(true);
    this.emit("new-game", this.state);
    return this.state;
  }

  loadFromStorage() {
    const result = this.saveManager.load();
    if (result.ok) {
      this.state = result.state;
      if (result.recovered) {
        this.addJournal({
          type: "system",
          title: "Sauvegarde restaurée",
          text: "La sauvegarde principale était illisible. La copie de secours a été restaurée."
        });
        this.saveNow();
      }
      this.emit("loaded", result);
      return result;
    }
    this.emit("load-failed", result);
    return result;
  }

  adoptState(state) {
    const result = this.saveManager.adopt(state);
    if (!result.ok) return { ok: false, error: result.error };
    this.state = result.state;
    this.addJournal({
      type: "system",
      title: "Sauvegarde importée",
      text: "Une sauvegarde externe a été chargée. La progression précédente a été conservée en copie de secours."
    });
    this.saveNow();
    this.emit("loaded", { ok: true, state: this.state, source: "import" });
    return { ok: true, state: this.state };
  }

  getState() {
    return this.state;
  }

  isLoaded() {
    return Boolean(this.state);
  }

  /* ------------------------------------------------------------------ */
  /* Horloge et sauvegarde                                              */
  /* ------------------------------------------------------------------ */
  setPlaying(playing) {
    this.playing = Boolean(playing);
    if (this.playing) this.startClock();
    else this.stopClock();
  }

  startClock() {
    if (this.clockTimer) return;
    this.clockTimer = setInterval(() => {
      if (!this.state || !this.playing) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      this.state.playTime = (this.state.playTime || 0) + 1;
      if (this.state.playTime % 15 === 0) this.touch();
    }, 1000);
    if (this.clockTimer.unref) this.clockTimer.unref();
  }

  stopClock() {
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.clockTimer = null;
  }

  touch() {
    if (!this.state) return;
    this.state.meta.updatedAt = nowIso();
    this.scheduleSave();
    this.emit("state-change", this.state);
  }

  scheduleSave(delay = 250) {
    if (!this.state) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), delay);
    if (this.saveTimer.unref) this.saveTimer.unref();
  }

  saveNow() {
    if (!this.state) return { ok: false, error: "Aucune partie chargée." };
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const result = this.saveManager.save(this.state);
    if (result.ok) {
      this.state.meta.updatedAt = nowIso();
      this.lastSaveError = null;
      this.emit("saved", { at: this.state.meta.updatedAt, available: this.saveManager.available });
    } else {
      this.lastSaveError = result.error;
      this.emit("save-error", result.error);
    }
    return result;
  }

  destroy() {
    this.stopClock();
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.listeners.clear();
    if (this.state) this.saveNow();
  }

  /* ------------------------------------------------------------------ */
  /* Journal                                                            */
  /* ------------------------------------------------------------------ */
  addJournal({ type = "event", title, text, dossier = 0 }) {
    if (!this.state || !title) return null;
    const entry = {
      id: makeId("log"),
      type,
      title: String(title).slice(0, 200),
      text: String(text || "").slice(0, 4000),
      dossier: Number(dossier) || 0,
      at: nowIso(),
      playTime: this.state.playTime || 0
    };
    this.state.journal.push(entry);
    if (this.state.journal.length > 500) this.state.journal.shift();
    this.emit("journal", entry);
    return entry;
  }

  getJournal({ dossier = 0, type = null } = {}) {
    if (!this.state) return [];
    return this.state.journal
      .filter((entry) => (dossier ? entry.dossier === Number(dossier) : true))
      .filter((entry) => (type ? entry.type === type : true))
      .slice()
      .reverse();
  }

  /* ------------------------------------------------------------------ */
  /* Progression générale                                               */
  /* ------------------------------------------------------------------ */
  completeIntro() {
    if (!this.state) return;
    this.state.introDone = true;
    if (!this.state.unlockedDossiers.includes(1)) this.state.unlockedDossiers.push(1);
    this.state.currentDossier = 1;
    this.markSceneSeen("intro");
    this.addJournal({
      type: "event",
      title: "Connexion établie",
      text: "L’archive est ouverte. Le dossier 01 est disponible."
    });
    this.touch();
    this.checkAchievements();
    this.emit("intro-complete", this.state);
  }

  unlockDossier(id) {
    if (!this.state) return false;
    const dossierId = Number(id);
    if (!DOSSIERS_BY_ID[dossierId]) return false;
    if (this.state.unlockedDossiers.includes(dossierId)) return false;
    this.state.unlockedDossiers.push(dossierId);
    this.state.unlockedDossiers.sort((a, b) => a - b);
    this.addJournal({
      type: "event",
      title: `${DOSSIERS_BY_ID[dossierId].code} ouvert`,
      text: DOSSIERS_BY_ID[dossierId].tagline,
      dossier: dossierId
    });
    this.touch();
    this.emit("dossier-unlocked", DOSSIERS_BY_ID[dossierId]);
    return true;
  }

  isDossierUnlocked(id) {
    return Boolean(this.state?.unlockedDossiers?.includes(Number(id)));
  }

  isDossierCompleted(id) {
    return Boolean(this.state?.completedDossiers?.includes(Number(id)));
  }

  markSceneSeen(id) {
    if (!this.state || !id) return;
    if (!this.state.seenScenes.includes(id)) this.state.seenScenes.push(id);
  }

  hasSeenScene(id) {
    return Boolean(this.state?.seenScenes?.includes(id));
  }

  /* ------------------------------------------------------------------ */
  /* Preuves                                                            */
  /* ------------------------------------------------------------------ */
  findEvidence(id, { silent = false } = {}) {
    if (!this.state) return null;
    const item = EVIDENCE_BY_ID[id];
    if (!item) return null;
    const existing = this.state.evidence[id];
    if (existing?.found) {
      if (existing.isNew && !silent) this.emit("evidence-already-found", item);
      return item;
    }
    this.state.evidence[id] = { found: true, foundAt: nowIso(), isNew: true };
    if (item.secret) {
      this.addJournal({
        type: "secret",
        title: `Document secret : ${item.title}`,
        text: item.summary,
        dossier: item.dossier
      });
    }
    this.touch();
    this.checkAchievements();
    if (!silent) this.emit("evidence-found", item);
    return item;
  }

  markEvidenceRead(id) {
    if (!this.state?.evidence?.[id]) return;
    if (!this.state.evidence[id].isNew) return;
    this.state.evidence[id].isNew = false;
    this.scheduleSave();
  }

  isEvidenceFound(id) {
    return Boolean(this.state?.evidence?.[id]?.found);
  }

  getEvidence(id) {
    return EVIDENCE_BY_ID[id] || null;
  }

  getFoundEvidence({ dossier = 0, category = null, secretsOnly = false } = {}) {
    if (!this.state) return [];
    return Object.keys(this.state.evidence)
      .filter((id) => this.state.evidence[id].found)
      .map((id) => EVIDENCE_BY_ID[id])
      .filter(Boolean)
      .filter((item) => (dossier ? item.dossier === Number(dossier) : true))
      .filter((item) => (category ? item.category === category : true))
      .filter((item) => (secretsOnly ? item.secret : true))
      .sort((a, b) => (a.dossier - b.dossier) || a.title.localeCompare(b.title, "fr"));
  }

  getEvidenceCount() {
    if (!this.state) return { found: 0, total: Object.keys(EVIDENCE_BY_ID).length };
    return {
      found: Object.values(this.state.evidence).filter((item) => item.found).length,
      total: Object.keys(EVIDENCE_BY_ID).length
    };
  }

  getSecretCount() {
    if (!this.state) return { found: 0, total: SECRET_EVIDENCE.length };
    return {
      found: SECRET_EVIDENCE.filter((id) => this.state.evidence[id]?.found).length,
      total: SECRET_EVIDENCE.length
    };
  }

  /* ------------------------------------------------------------------ */
  /* Énigmes                                                            */
  /* ------------------------------------------------------------------ */
  getPuzzle(id) {
    return PUZZLES_BY_ID[id] || null;
  }

  getPuzzleProgress(id) {
    return this.state?.puzzles?.[id] || { solved: false, attempts: 0, hintsUsed: 0, meta: {} };
  }

  isPuzzleSolved(id) {
    return Boolean(this.state?.puzzles?.[id]?.solved);
  }

  useHint(id, level) {
    if (!this.state) return null;
    const puzzle = PUZZLES_BY_ID[id];
    if (!puzzle) return null;
    if (this.isPuzzleSolved(id)) return null;
    const progress = this.state.puzzles[id] || { solved: false, attempts: 0, hintsUsed: 0, meta: {} };
    const nextLevel = clamp(Number(level), 1, 2);
    progress.hintsUsed = Math.max(progress.hintsUsed || 0, nextLevel);
    this.state.puzzles[id] = progress;
    this.addJournal({
      type: "hint",
      title: `Indice ${nextLevel} — ${puzzle.title}`,
      text: "Un indice a été consulté.",
      dossier: puzzle.dossier
    });
    this.touch();
    this.emit("hint-used", { puzzle, level: nextLevel });
    return puzzle.hints[nextLevel - 1] || null;
  }

  submitPuzzleAnswer(id, answer) {
    if (!this.state) return { correct: false, complete: false, message: "Aucune partie." };
    const puzzle = PUZZLES_BY_ID[id];
    if (!puzzle) return { correct: false, complete: false, message: "Énigme introuvable." };
    if (this.isPuzzleSolved(id)) {
      return { correct: true, complete: true, alreadySolved: true, message: puzzle.success || "Déjà résolue." };
    }

    const progress = this.state.puzzles[id] || {
      solved: false,
      attempts: 0,
      hintsUsed: 0,
      meta: {}
    };
    progress.attempts = (progress.attempts || 0) + 1;
    this.state.puzzles[id] = progress;

    const result = checkAnswer(puzzle, answer);
    if (result.correct) {
      progress.solved = true;
      progress.solvedAt = nowIso();
      if (!progress.hintsUsed) {
        this.state.counters.puzzlesNoHint = (this.state.counters.puzzlesNoHint || 0) + 1;
      }
      this.applyRewards(puzzle.rewards, { puzzle, dossier: puzzle.dossier });
      this.addJournal({
        type: "puzzle",
        title: `Énigme résolue : ${puzzle.title}`,
        text: puzzle.success || result.message,
        dossier: puzzle.dossier
      });
      this.touch();
      this.checkAchievements();
      this.emit("puzzle-solved", { puzzle, result });
    } else {
      this.touch();
      this.emit("puzzle-failed", { puzzle, result });
    }
    return result;
  }

  recordPuzzleGuess(id, guess, feedback) {
    if (!this.state || !PUZZLES_BY_ID[id]) return;
    const progress = this.state.puzzles[id] || {
      solved: false,
      attempts: 0,
      hintsUsed: 0,
      meta: {}
    };
    progress.meta = progress.meta || {};
    const guesses = Array.isArray(progress.meta.guesses) ? progress.meta.guesses : [];
    guesses.push({
      guess: String(guess).slice(0, 8),
      correct: Number(feedback?.correct) || 0,
      placed: Number(feedback?.placed) || 0
    });
    progress.meta.guesses = guesses.slice(-20);
    this.state.puzzles[id] = progress;
    this.touch();
  }

  getSolvedPuzzleCount() {
    if (!this.state) return { solved: 0, total: PUZZLES.length };
    return {
      solved: PUZZLES.filter((puzzle) => this.state.puzzles[puzzle.id]?.solved).length,
      total: PUZZLES.length
    };
  }

  /* ------------------------------------------------------------------ */
  /* Récompenses et effets                                              */
  /* ------------------------------------------------------------------ */
  applyRewards(rewards, { puzzle = null, dossier = 0 } = {}) {
    if (!rewards || !this.state) return;
    if (rewards.stats) this.applyStats(rewards.stats);
    if (Array.isArray(rewards.evidence)) {
      for (const id of rewards.evidence) this.findEvidence(id);
    }
    if (Array.isArray(rewards.flags)) {
      for (const flag of rewards.flags) this.state.flags[flag] = true;
    }
    if (rewards.counters) {
      for (const [key, value] of Object.entries(rewards.counters)) {
        this.state.counters[key] = (this.state.counters[key] || 0) + Number(value || 0);
      }
    }
    if (rewards.journal) {
      this.addJournal({
        type: "deduction",
        title: rewards.journal.title,
        text: rewards.journal.text,
        dossier: puzzle?.dossier || dossier
      });
    }
    this.recomputeCounters();
  }

  applyStats(delta = {}) {
    if (!this.state) return;
    for (const key of STAT_KEYS) {
      if (Number.isFinite(Number(delta[key]))) {
        this.state.stats[key] = clamp((this.state.stats[key] || 0) + Number(delta[key]), 0, MAX_STAT);
      }
    }
  }

  /**
   * Applique les effets d’un choix narratif.
   * @param {{stats?:object, counters?:object, flags?:string[], journal?:object}} effects
   */
  applyEffects(effects = {}) {
    if (!this.state) return;
    if (effects.stats) this.applyStats(effects.stats);
    if (effects.confiance || effects.lucidite || effects.empathie) {
      this.applyStats({
        confiance: effects.confiance || 0,
        lucidite: effects.lucidite || 0,
        empathie: effects.empathie || 0
      });
    }
    if (effects.counters) {
      for (const [key, value] of Object.entries(effects.counters)) {
        this.state.counters[key] = (this.state.counters[key] || 0) + Number(value || 0);
      }
    }
    if (Array.isArray(effects.flags)) {
      for (const flag of effects.flags) this.state.flags[flag] = true;
    }
    if (effects.journal) {
      this.addJournal({
        type: "event",
        title: effects.journal.title,
        text: effects.journal.text,
        dossier: effects.journal.dossier || 0
      });
    }
    this.recomputeCounters();
    this.touch();
  }

  recomputeCounters() {
    if (!this.state) return;
    const central = CENTRAL_FLAGS.filter((flag) => this.state.flags[flag]).length;
    this.state.counters.centralContradictions = central;
  }

  /* ------------------------------------------------------------------ */
  /* Choix                                                              */
  /* ------------------------------------------------------------------ */
  hasChoice(id) {
    return Boolean(this.state?.choices?.some((choice) => choice.id === id));
  }

  getChoice(id) {
    return this.state?.choices?.find((choice) => choice.id === id) || null;
  }

  recordChoice({ id, dossier = 0, prompt = "", optionId = "", label = "", effects = {} }) {
    if (!this.state || !id || !optionId) return false;
    if (this.hasChoice(id)) return false;
    this.state.choices.push({
      id,
      dossier: Number(dossier) || 0,
      prompt: String(prompt).slice(0, 500),
      optionId,
      label: String(label).slice(0, 500),
      at: nowIso()
    });
    this.applyEffects(effects);
    this.addJournal({
      type: "decision",
      title: label,
      text: prompt ? `Question : ${prompt}` : "",
      dossier: Number(dossier) || 0
    });
    this.touch();
    this.checkAchievements();
    this.emit("choice-recorded", { id, optionId, label });
    return true;
  }

  getChoices({ dossier = 0 } = {}) {
    if (!this.state) return [];
    return this.state.choices
      .filter((choice) => (dossier ? choice.dossier === Number(dossier) : true))
      .slice()
      .reverse();
  }

  /* ------------------------------------------------------------------ */
  /* Dossiers et objectifs                                              */
  /* ------------------------------------------------------------------ */
  getDossier(id) {
    return DOSSIERS_BY_ID[Number(id)] || null;
  }

  getDossierProgress(id) {
    const dossier = DOSSIERS_BY_ID[Number(id)];
    if (!dossier || !this.state) {
      return {
        puzzleTotal: 0,
        puzzleSolved: 0,
        evidenceTotal: 0,
        evidenceFound: 0,
        canComplete: false,
        completed: false,
        objectives: []
      };
    }
    const puzzleTotal = dossier.puzzles.length;
    const puzzleSolved = dossier.puzzles.filter((puzzleId) => this.isPuzzleSolved(puzzleId)).length;
    const important = IMPORTANT_EVIDENCE[dossier.id] || [];
    const evidenceFound = important.filter((evidenceId) => this.isEvidenceFound(evidenceId)).length;
    const canComplete =
      this.isDossierUnlocked(dossier.id) &&
      !this.isDossierCompleted(dossier.id) &&
      puzzleSolved === puzzleTotal &&
      evidenceFound === important.length;

    return {
      puzzleTotal,
      puzzleSolved,
      evidenceTotal: important.length,
      evidenceFound,
      canComplete,
      completed: this.isDossierCompleted(dossier.id),
      objectives: this.getObjectives(dossier.id)
    };
  }

  getMissingForDossier(id) {
    const dossier = DOSSIERS_BY_ID[Number(id)];
    if (!dossier) return { puzzles: [], evidence: [] };
    return {
      puzzles: dossier.puzzles.filter((puzzleId) => !this.isPuzzleSolved(puzzleId)).map((puzzleId) => PUZZLES_BY_ID[puzzleId].title),
      evidence: (IMPORTANT_EVIDENCE[dossier.id] || [])
        .filter((evidenceId) => !this.isEvidenceFound(evidenceId))
        .map((evidenceId) => EVIDENCE_BY_ID[evidenceId]?.title)
        .filter(Boolean)
    };
  }

  evaluateObjective(condition) {
    if (!condition) return false;
    switch (condition.type) {
      case "evidence":
        return this.isEvidenceFound(condition.id);
      case "allEvidence":
        return (condition.ids || []).every((id) => this.isEvidenceFound(id));
      case "puzzle":
        return this.isPuzzleSolved(condition.id);
      case "allPuzzles": {
        const dossier = DOSSIERS_BY_ID[condition.dossier];
        return Boolean(dossier) && dossier.puzzles.every((id) => this.isPuzzleSolved(id));
      }
      case "flag":
        return Boolean(this.state?.flags?.[condition.id]);
      case "allSecrets":
        return SECRET_EVIDENCE.every((id) => this.isEvidenceFound(id));
      default:
        return false;
    }
  }

  getObjectives(dossierId) {
    const dossier = DOSSIERS_BY_ID[Number(dossierId)];
    if (!dossier) return [];
    return dossier.objectives.map((objective) => ({
      ...objective,
      done: this.evaluateObjective(objective.condition)
    }));
  }

  completeDossier(id) {
    const dossier = DOSSIERS_BY_ID[Number(id)];
    if (!dossier || !this.state) return { ok: false, error: "Dossier introuvable." };
    if (this.isDossierCompleted(dossier.id)) return { ok: true, alreadyCompleted: true, dossier };
    const progress = this.getDossierProgress(dossier.id);
    if (!progress.canComplete) {
      const missing = this.getMissingForDossier(dossier.id);
      return { ok: false, error: "Le dossier n’est pas terminé.", missing };
    }
    this.state.completedDossiers.push(dossier.id);
    this.state.completedDossiers.sort((a, b) => a - b);
    this.addJournal({
      type: "dossier",
      title: `${dossier.code} clos`,
      text: dossier.tagline,
      dossier: dossier.id
    });
    if (dossier.next) this.unlockDossier(dossier.next);
    this.touch();
    this.checkAchievements();
    this.emit("dossier-completed", dossier);
    return { ok: true, dossier };
  }

  /* ------------------------------------------------------------------ */
  /* Tableau d’enquête                                                  */
  /* ------------------------------------------------------------------ */
  recordConnection(a, b) {
    if (!this.state) return { ok: false, reason: "no-game" };
    if (!a || !b || a === b) return { ok: false, reason: "invalid" };
    const connection = findConnection(a, b);
    if (!connection) return { ok: false, reason: "no-link" };
    if (this.state.connections[connection.id]) {
      return { ok: false, reason: "already", connection };
    }
    this.state.connections[connection.id] = { foundAt: nowIso() };
    this.applyStats(connection.stats || {});
    this.addJournal({
      type: "connection",
      title: `Connexion : ${connection.title}`,
      text: connection.text,
      dossier: EVIDENCE_BY_ID[a]?.dossier || 0
    });
    this.touch();
    this.checkAchievements();
    this.emit("connection-found", connection);
    return { ok: true, connection };
  }

  hasConnection(id) {
    return Boolean(this.state?.connections?.[id]);
  }

  getConnections() {
    if (!this.state) return [];
    return CONNECTIONS.filter((connection) => this.state.connections[connection.id]);
  }

  getConnectionCount() {
    return { found: this.getConnections().length, total: CONNECTIONS.length };
  }

  /* ------------------------------------------------------------------ */
  /* Succès                                                             */
  /* ------------------------------------------------------------------ */
  checkAchievements() {
    if (!this.state) return [];
    const unlocked = unlockPendingAchievements(this.state, this.profileManager);
    if (unlocked.length) {
      this.touch();
      for (const achievement of unlocked) {
        this.emit("achievement", achievement);
      }
    }
    return unlocked;
  }

  getAchievementView() {
    const profile = this.profileManager.getProfile();
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: Boolean(profile.achievements[achievement.id]),
      unlockedAt: profile.achievements[achievement.id] || null
    }));
  }

  getAchievementCount() {
    const profile = this.profileManager.getProfile();
    return { unlocked: Object.keys(profile.achievements).length, total: ACHIEVEMENTS.length };
  }

  getEndingCount() {
    const profile = this.profileManager.getProfile();
    return { unlocked: Object.keys(profile.endings).length, total: ENDINGS.length };
  }

  /* ------------------------------------------------------------------ */
  /* Fins                                                               */
  /* ------------------------------------------------------------------ */
  getEndingAvailability() {
    return this.state ? computeEndingAvailability(this.state) : [];
  }

  chooseEnding(id) {
    if (!this.state) return { ok: false, error: "Aucune partie." };
    if (this.state.ending) {
      return { ok: false, error: "Cette session a déjà une fin. Commencez une nouvelle partie pour explorer une autre issue." };
    }
    if (!canChooseEnding(this.state, id)) {
      return { ok: false, error: "Cette fin n’est pas accessible." };
    }
    const resolved = resolveEnding(this.state, id);
    if (!resolved) return { ok: false, error: "Fin introuvable." };
    this.state.ending = id;
    this.profileManager.recordEnding(id);
    this.addJournal({
      type: "ending",
      title: `Fin : ${resolved.title}`,
      text: resolved.finalLine
    });
    this.setPlaying(false);
    this.touch();
    this.checkAchievements();
    this.saveNow();
    this.emit("ending", resolved);
    return { ok: true, ending: resolved };
  }

  getResolvedEnding() {
    if (!this.state?.ending) return null;
    return resolveEnding(this.state, this.state.ending);
  }

  /* ------------------------------------------------------------------ */
  /* Statistiques et divers                                             */
  /* ------------------------------------------------------------------ */
  getStats() {
    return this.state?.stats || { confiance: 0, lucidite: 0, empathie: 0 };
  }

  getPlayTime() {
    return this.state?.playTime || 0;
  }

  getPlayTimeLabel() {
    return formatPlayTime(this.getPlayTime());
  }

  getGlobalProgress() {
    if (!this.state) {
      return { dossiers: 0, puzzles: 0, evidence: 0, achievements: 0 };
    }
    return {
      dossiers: this.state.completedDossiers.length,
      puzzles: this.getSolvedPuzzleCount().solved,
      evidence: this.getEvidenceCount().found,
      achievements: this.getAchievementCount().unlocked
    };
  }

  exportSave() {
    if (!this.state) throw new Error("Aucune partie à exporter.");
    return this.saveManager.exportSave(this.state);
  }

  importSave(text) {
    return this.saveManager.importSave(text);
  }

  resetProgress({ clearProfile = false } = {}) {
    this.saveManager.resetAll();
    if (clearProfile) this.profileManager.clear();
    this.state = null;
    this.setPlaying(false);
    this.emit("progress-reset", { clearProfile });
  }
}

/* Import différé pour éviter une dépendance circulaire au chargement. */

/** Compteur lisible pour les tests et l’écran des statistiques. */
export function statLabel(key) {
  return { confiance: "Confiance", lucidite: "Lucidité", empathie: "Empathie" }[key] || key;
}

export { DOSSIERS, PUZZLES, SAVE_VERSION };
