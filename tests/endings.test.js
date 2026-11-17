import test from "node:test";
import assert from "node:assert/strict";

import { ENDINGS } from "../data/endings.js";
import {
  availableEndingIds,
  canChooseEnding,
  eveilChecklist,
  getEndingAvailability,
  isEveilAvailable,
  resolveEnding
} from "../js/endings.js";
import { buildCompletedState, newGame } from "./helpers.js";

test("la fin secrète exige toutes les conditions", () => {
  const { gameState } = newGame();
  const checklist = eveilChecklist(gameState.state);
  assert.equal(checklist.length, 6);
  assert.equal(checklist.every((item) => item.done), false);
  assert.equal(isEveilAvailable(gameState.state), false);

  const completed = buildCompletedState({ stats: 8 });
  assert.equal(eveilChecklist(completed.state).every((item) => item.done), true);
  assert.equal(isEveilAvailable(completed.state), true);
});

test("les fins visibles sont disponibles, la secrète ne l’est pas au début", () => {
  const { gameState } = newGame();
  const availability = getEndingAvailability(gameState.state);
  assert.equal(availability.length, 4);
  assert.equal(availability.find((entry) => entry.id === "publier").unlocked, true);
  assert.equal(availability.find((entry) => entry.id === "detruire").unlocked, true);
  assert.equal(availability.find((entry) => entry.id === "gardien").unlocked, false);
  assert.equal(availability.find((entry) => entry.id === "eveil").unlocked, false);
  assert.ok(availability.find((entry) => entry.id === "eveil").checklist.length === 6);
});

test("la fin du Gardien dépend de la Confiance", () => {
  const low = buildCompletedState({ stats: 5 });
  assert.equal(canChooseEnding(low.state, "gardien"), false);
  const high = buildCompletedState({ stats: 6 });
  assert.equal(canChooseEnding(high.state, "gardien"), true);
});

test("les quatre fins sont disponibles dans un état complet", () => {
  const { state } = buildCompletedState({ stats: 9 });
  const availability = getEndingAvailability(state);
  assert.equal(availability.every((entry) => entry.unlocked), true);
  assert.deepEqual(availableEndingIds(state).sort(), ENDINGS.map((ending) => ending.id).sort());
});

test("la résolution choisit la variante haute ou basse", () => {
  const high = buildCompletedState({ stats: 9 });
  const highEnding = resolveEnding(high.state, "publier");
  assert.equal(highEnding.variantTone, "high");
  assert.ok(highEnding.variantParagraphs.length > 0);

  const low = buildCompletedState({ stats: 6 });
  low.state.stats.lucidite = 4;
  const lowEnding = resolveEnding(low.state, "publier");
  assert.equal(lowEnding.variantTone, "low");
  assert.ok(lowEnding.variantParagraphs.length > 0);

  const gardien = resolveEnding(high.state, "gardien");
  assert.equal(gardien.variantTone, "high");
  const gardienLow = resolveEnding(low.state, "gardien");
  assert.equal(gardienLow.variantTone, "low");
});

test("une fin verrouillée ou inconnue ne peut pas être résolue", () => {
  const { state } = buildCompletedState({ stats: 5 });
  assert.equal(resolveEnding(state, "gardien"), null);
  assert.equal(resolveEnding(state, "inexistante"), null);
});

test("choisir une fin enregistre l’état, le profil et les succès", () => {
  const { gameState, profileManager } = buildCompletedState({ stats: 9 });
  const result = gameState.chooseEnding("publier");
  assert.equal(result.ok, true);
  assert.equal(result.ending.id, "publier");
  assert.equal(gameState.getState().ending, "publier");
  assert.equal(profileManager.hasEnding("publier"), true);
  assert.equal(profileManager.hasAchievement("derniere-porte"), true);
  assert.equal(profileManager.hasAchievement("voix-de-la-verite"), true);
  assert.equal(gameState.getResolvedEnding().title, "LA VÉRITÉ PUBLIQUE");
  assert.ok(gameState.getJournal().some((entry) => entry.type === "ending"));
});

test("chaque fin débloque son succès spécifique", () => {
  const cases = [
    ["publier", "voix-de-la-verite"],
    ["detruire", "silence"],
    ["gardien", "heritier"],
    ["eveil", "lucide"]
  ];
  for (const [endingId, achievementId] of cases) {
    const { gameState, profileManager } = buildCompletedState({ stats: 9 });
    const result = gameState.chooseEnding(endingId);
    assert.equal(result.ok, true, endingId);
    assert.equal(profileManager.hasAchievement(achievementId), true, achievementId);
    assert.equal(profileManager.hasAchievement("derniere-porte"), true);
    assert.equal(gameState.getState().ending, endingId);
  }
});

test("une session ne peut recevoir qu’une seule fin", () => {
  const { gameState } = buildCompletedState({ stats: 9 });
  assert.equal(gameState.chooseEnding("publier").ok, true);
  const second = gameState.chooseEnding("detruire");
  assert.equal(second.ok, false);
  assert.match(second.error, /déjà une fin/);
  assert.equal(gameState.getState().ending, "publier");
});

test("les textes des fins sont tous distincts", () => {
  const firstParagraphs = new Set();
  const finalLines = new Set();
  for (const ending of ENDINGS) {
    firstParagraphs.add(ending.paragraphs[0]);
    finalLines.add(ending.finalLine);
    assert.notEqual(ending.paragraphs[0], ending.paragraphs[1]);
  }
  assert.equal(firstParagraphs.size, ENDINGS.length);
  assert.equal(finalLines.size, ENDINGS.length);
});
