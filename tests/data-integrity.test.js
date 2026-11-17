import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DOSSIERS, DOSSIERS_BY_ID, ALL_HOTSPOTS } from "../data/dossiers.js";
import { EVIDENCE, EVIDENCE_BY_ID, SECRET_EVIDENCE, evidenceForDossier } from "../data/evidence.js";
import { PUZZLES, PUZZLES_BY_ID } from "../data/puzzles.js";
import { CONNECTIONS } from "../data/connections.js";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { ENDINGS } from "../data/endings.js";
import { INTRO_SCENE, SCENES } from "../data/story.js";
import { ACHIEVEMENT_CONDITIONS } from "../js/achievements.js";
import { decodeCipher, mastermindSolutions, validatePuzzleStructure, normalizeAnswer } from "../js/puzzles.js";
import { GAME_ID, SAVE_VERSION } from "../js/save-schema.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

test("les identifiants de dossiers sont uniques et complets", () => {
  assert.deepEqual(DOSSIERS.map((dossier) => dossier.id), [1, 2, 3, 4, 5]);
  assert.equal(new Set(DOSSIERS.map((dossier) => dossier.id)).size, 5);
  for (const dossier of DOSSIERS) {
    assert.ok(dossier.code && dossier.title && dossier.tagline && dossier.summary);
    assert.ok(Array.isArray(dossier.zones) && dossier.zones.length >= 3);
    assert.ok(Array.isArray(dossier.objectives) && dossier.objectives.length >= 3);
    assert.ok(Array.isArray(dossier.puzzles) && dossier.puzzles.length >= 2);
  }
});

test("les preuves sont uniques et structurées", () => {
  const ids = EVIDENCE.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of EVIDENCE) {
    assert.ok(item.title && item.summary && item.category);
    assert.ok(Number.isInteger(item.dossier) && item.dossier >= 1 && item.dossier <= 5);
    assert.ok(Array.isArray(item.blocks) && item.blocks.length > 0);
    for (const block of item.blocks) {
      assert.ok(["p", "quote", "code", "meta", "list", "warning"].includes(block.type), `bloc ${block.type} dans ${item.id}`);
      if (block.type === "p" || block.type === "quote" || block.type === "code" || block.type === "warning") {
        assert.ok(typeof block.text === "string" && block.text.trim().length > 0, `bloc vide dans ${item.id}`);
      }
      if (block.type === "list") assert.ok(Array.isArray(block.items) && block.items.length > 0, `liste vide dans ${item.id}`);
      if (block.type === "meta") assert.ok(block.label && block.value, `meta incomplète dans ${item.id}`);
    }
  }
  assert.equal(SECRET_EVIDENCE.length, 3);
  for (const id of SECRET_EVIDENCE) assert.equal(EVIDENCE_BY_ID[id].secret, true);
});

test("tous les hotspots et objectifs référencent des preuves et énigmes existantes", () => {
  for (const hotspot of ALL_HOTSPOTS) {
    assert.ok(DOSSIERS_BY_ID[hotspot.dossier], `dossier du hotspot ${hotspot.id}`);
    for (const id of hotspot.evidence || []) {
      assert.ok(EVIDENCE_BY_ID[id], `preuve inconnue ${id} dans ${hotspot.id}`);
    }
    if (hotspot.requires?.puzzle) assert.ok(PUZZLES_BY_ID[hotspot.requires.puzzle], `énigme inconnue dans ${hotspot.id}`);
  }
  for (const dossier of DOSSIERS) {
    for (const objective of dossier.objectives) {
      const condition = objective.condition;
      assert.ok(condition && condition.type, `condition manquante ${objective.id}`);
      if (condition.type === "evidence") assert.ok(EVIDENCE_BY_ID[condition.id], `preuve inconnue ${condition.id}`);
      if (condition.type === "allEvidence") {
        for (const id of condition.ids) assert.ok(EVIDENCE_BY_ID[id], `preuve inconnue ${id}`);
      }
      if (condition.type === "puzzle") assert.ok(PUZZLES_BY_ID[condition.id], `énigme inconnue ${condition.id}`);
      if (condition.type === "flag") assert.equal(typeof condition.id, "string");
    }
  }
});

test("les énigmes sont uniques, complètes et structurellement valides", () => {
  const ids = PUZZLES.map((puzzle) => puzzle.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(PUZZLES.length, 10);
  for (const puzzle of PUZZLES) {
    assert.deepEqual(validatePuzzleStructure(puzzle), [], `structure de ${puzzle.id}`);
    assert.ok(DOSSIERS_BY_ID[puzzle.dossier], `dossier de ${puzzle.id}`);
    assert.ok(DOSSIERS_BY_ID[puzzle.dossier].puzzles.includes(puzzle.id), `${puzzle.id} absent du dossier`);
    assert.equal(puzzle.hints.length, 2);
    assert.ok(puzzle.explanation.length >= 2);
    for (const id of puzzle.rewards?.evidence || []) assert.ok(EVIDENCE_BY_ID[id], `preuve récompense inconnue ${id}`);
  }
  for (const dossier of DOSSIERS) {
    for (const puzzleId of dossier.puzzles) {
      assert.ok(PUZZLES_BY_ID[puzzleId], `énigme inconnue ${puzzleId}`);
      assert.equal(PUZZLES_BY_ID[puzzleId].dossier, dossier.id);
    }
  }
});

test("les solutions de type paire, ordre et chaîne sont cohérentes", () => {
  for (const puzzle of PUZZLES) {
    if (puzzle.type === "pair") {
      assert.equal(puzzle.solution.length, puzzle.data.selection);
      for (const id of puzzle.solution) assert.ok(puzzle.data.items.some((item) => item.id === id), `item ${id}`);
    }
    if (puzzle.type === "order") {
      assert.deepEqual([...puzzle.solution].sort(), puzzle.data.items.map((item) => item.id).sort());
    }
    if (puzzle.type === "chain") {
      assert.equal(puzzle.solution.length, puzzle.data.length);
      for (const id of puzzle.solution) assert.ok(puzzle.data.cards.some((card) => card.id === id), `carte ${id}`);
      for (const card of puzzle.data.cards) assert.ok(EVIDENCE_BY_ID[card.evidence], `preuve de carte ${card.evidence}`);
    }
  }
});

test("les solutions d’attribution et de classement utilisent des options valides", () => {
  for (const puzzle of PUZZLES) {
    if (puzzle.type === "assign") {
      for (const row of puzzle.data.rows) {
        for (const field of puzzle.data.fields) {
          const value = puzzle.solution[row.id]?.[field.id];
          assert.ok(value, `solution manquante ${row.id}/${field.id}`);
          assert.ok(field.options.some((option) => option.id === value), `option ${value} inconnue`);
        }
      }
    }
    if (puzzle.type === "classify") {
      assert.equal(Object.keys(puzzle.solution).length, puzzle.data.items.length);
      for (const item of puzzle.data.items) {
        assert.ok(puzzle.solution[item.id], `classement manquant ${item.id}`);
        assert.ok(puzzle.data.categories.some((category) => category.id === puzzle.solution[item.id]), `catégorie inconnue ${puzzle.solution[item.id]}`);
      }
    }
    if (puzzle.type === "single") {
      assert.ok(puzzle.data.options.some((option) => option.id === puzzle.solution));
    }
  }
});

test("l’énigme du miroir se décode réellement vers ZÉRO", () => {
  const puzzle = PUZZLES_BY_ID["d3-miroir"];
  const decoded = decodeCipher(puzzle.data.ciphertext, { mirror: true, reverse: true });
  assert.match(decoded, /CHAMBRE/);
  assert.match(decoded, /ZERO/);
  assert.equal(normalizeAnswer("ZÉRO"), "zero");
  assert.ok(puzzle.accepted.map(normalizeAnswer).includes("zero"));
});

test("le code d’intégrité possède une solution unique", () => {
  const puzzle = PUZZLES_BY_ID["d3-code"];
  const solutions = mastermindSolutions(puzzle.data.clues, puzzle.data.length);
  assert.deepEqual(solutions, [puzzle.solution]);
  assert.equal(new Set(puzzle.solution).size, 4);
});

test("toutes les preuves essentielles et secrètes sont accessibles", () => {
  const reachable = new Set();
  for (const hotspot of ALL_HOTSPOTS) for (const id of hotspot.evidence || []) reachable.add(id);
  for (const puzzle of PUZZLES) for (const id of puzzle.rewards?.evidence || []) reachable.add(id);
  for (const dossier of DOSSIERS) {
    for (const item of evidenceForDossier(dossier.id).filter((entry) => entry.important)) {
      assert.ok(reachable.has(item.id), `preuve essentielle inaccessible : ${item.id}`);
    }
  }
  for (const id of SECRET_EVIDENCE) {
    assert.ok(reachable.has(id), `preuve secrète inaccessible : ${id}`);
  }
});

test("les connexions du tableau sont uniques et valides", () => {
  assert.equal(CONNECTIONS.length, 7);
  const pairs = new Set();
  for (const connection of CONNECTIONS) {
    assert.ok(EVIDENCE_BY_ID[connection.a], `preuve A inconnue ${connection.a}`);
    assert.ok(EVIDENCE_BY_ID[connection.b], `preuve B inconnue ${connection.b}`);
    assert.notEqual(connection.a, connection.b);
    const key = [connection.a, connection.b].sort().join("|");
    assert.ok(!pairs.has(key), `paire dupliquée ${key}`);
    pairs.add(key);
    assert.ok(connection.title && connection.text);
  }
});

test("les succès ont tous une condition et des métadonnées", () => {
  assert.ok(ACHIEVEMENTS.length >= 8);
  assert.equal(new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size, ACHIEVEMENTS.length);
  for (const achievement of ACHIEVEMENTS) {
    assert.ok(achievement.title && achievement.description && achievement.hint);
    assert.equal(typeof ACHIEVEMENT_CONDITIONS[achievement.id], "function", `condition manquante ${achievement.id}`);
  }
  assert.deepEqual(
    Object.keys(ACHIEVEMENT_CONDITIONS).sort(),
    ACHIEVEMENTS.map((achievement) => achievement.id).sort()
  );
});

test("les quatre fins sont distinctes et complètes", () => {
  assert.equal(ENDINGS.length, 4);
  assert.equal(ENDINGS.filter((ending) => ending.secret).length, 1);
  assert.equal(new Set(ENDINGS.map((ending) => ending.id)).size, 4);
  assert.equal(new Set(ENDINGS.map((ending) => ending.theme)).size, 4);
  for (const ending of ENDINGS) {
    assert.ok(ending.title && ending.tagline && ending.description);
    assert.ok(ending.paragraphs.length >= 5, `fins trop courtes : ${ending.id}`);
    assert.ok(ending.epilogue && ending.finalLine);
    assert.ok(ending.requirement && ["none", "confiance", "eveil"].includes(ending.requirement.type));
  }
  assert.equal(ENDINGS.find((ending) => ending.id === "eveil").secret, true);
  assert.equal(ENDINGS.find((ending) => ending.id === "gardien").requirement.type, "confiance");
});

test("les scènes narratives sont cohérentes", () => {
  const scenes = [INTRO_SCENE, ...Object.values(SCENES)];
  const choiceIds = new Set();
  const nodeTypes = new Set(["system", "voice", "glitch", "character", "narration", "choice", "effect", "evidence", "unlock", "end"]);
  const characters = new Set(["elias", "mara", "varenne", "nadal"]);
  for (const scene of scenes) {
    assert.ok(scene.id && scene.title);
    for (const node of scene.nodes) {
      assert.ok(nodeTypes.has(node.type), `type de nœud inconnu ${node.type}`);
      if (node.type === "choice") {
        assert.ok(node.id && !choiceIds.has(node.id), `choix dupliqué ${node.id}`);
        choiceIds.add(node.id);
        assert.ok(node.prompt);
        assert.ok(Array.isArray(node.options) && node.options.length >= 2);
        for (const option of node.options) {
          assert.ok(option.id && option.label, `option incomplète dans ${node.id}`);
          assert.equal(typeof option.effects, "object");
          if (option.requires?.evidence) assert.ok(EVIDENCE_BY_ID[option.requires.evidence]);
          if (option.requires?.puzzle) assert.ok(PUZZLES_BY_ID[option.requires.puzzle]);
          for (const responseNode of option.response || []) {
            assert.ok(nodeTypes.has(responseNode.type), `réponse de type inconnu ${responseNode.type}`);
          }
        }
      } else if (node.type === "character") {
        assert.ok(characters.has(node.who), `personnage inconnu ${node.who}`);
      } else if (node.type === "end") {
        assert.ok(node.text);
      } else if (node.type !== "effect") {
        assert.ok(typeof node.text === "string" && node.text.trim().length > 0);
      }
      if (node.requires?.evidence) assert.ok(EVIDENCE_BY_ID[node.requires.evidence]);
      if (node.requires?.puzzle) assert.ok(PUZZLES_BY_ID[node.requires.puzzle]);
    }
  }
  for (const dossier of DOSSIERS) {
    assert.ok(SCENES[`dossier-${dossier.id}-intro`], `intro manquante ${dossier.id}`);
    assert.ok(SCENES[`dossier-${dossier.id}-outro`], `outro manquante ${dossier.id}`);
  }
});

test("aucun texte de remplissage ni lien mort dans les données", () => {
  const sources = [
    path.join(root, "data", "evidence.js"),
    path.join(root, "data", "puzzles.js"),
    path.join(root, "data", "story.js"),
    path.join(root, "data", "dossiers.js")
  ].map((file) => fs.readFileSync(file, "utf8"));
  for (const source of sources) {
    assert.ok(!/TODO|FIXME|Lorem ipsum/i.test(source));
  }
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /js\/main\.js/);
  assert.match(html, /css\/variables\.css/);
  assert.ok(!/href=["']https?:/i.test(html));
  assert.ok(!/src=["']https?:/i.test(html));
});

test("la version du schéma et l’identité du jeu sont stables", () => {
  assert.equal(GAME_ID, "L-ARCHIVE-1017");
  assert.equal(SAVE_VERSION, 1);
});
