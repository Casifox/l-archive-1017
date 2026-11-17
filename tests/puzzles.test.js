import test from "node:test";
import assert from "node:assert/strict";

import { PUZZLES, PUZZLES_BY_ID } from "../data/puzzles.js";
import {
  atbash,
  checkAnswer,
  decodeCipher,
  encodeCipher,
  getMastermindFeedback,
  isValidMastermindGuess,
  mastermindSolutions,
  normalizeAnswer,
  reverseLines,
  validatePuzzleStructure
} from "../js/puzzles.js";

function wrongSingle(puzzle) {
  return puzzle.data.options.find((option) => option.id !== puzzle.solution).id;
}

function wrongPair(puzzle) {
  const ids = puzzle.data.items.map((item) => item.id);
  const candidate = [ids[0], ids[1]];
  if (candidate[0] === puzzle.solution[0] && candidate[1] === puzzle.solution[1]) return [ids[0], ids[2]];
  return candidate;
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

for (const puzzle of PUZZLES) {
  test(`structure — ${puzzle.id}`, () => {
    assert.deepEqual(validatePuzzleStructure(puzzle), []);
  });
}

test("paire — bonne réponse dans les deux ordres", () => {
  const puzzle = PUZZLES_BY_ID["d1-contradiction"];
  assert.equal(checkAnswer(puzzle, [...puzzle.solution]).correct, true);
  assert.equal(checkAnswer(puzzle, [...puzzle.solution].reverse()).correct, true);
  assert.equal(checkAnswer(puzzle, wrongPair(puzzle)).correct, false);
  assert.equal(checkAnswer(puzzle, [puzzle.solution[0]]).complete, false);
});

test("attribution — bonne réponse, erreur et incomplétude", () => {
  const puzzle = PUZZLES_BY_ID["d1-badges"];
  assert.equal(checkAnswer(puzzle, copy(puzzle.solution)).correct, true);
  const wrong = copy(puzzle.solution);
  wrong.varenne.badge = "B-19";
  assert.equal(checkAnswer(puzzle, wrong).correct, false);
  assert.equal(checkAnswer(puzzle, {}).complete, false);
});

test("chronologie — ordre exact et ordre inversé", () => {
  const puzzle = PUZZLES_BY_ID["d2-chronologie"];
  assert.equal(checkAnswer(puzzle, [...puzzle.solution]).correct, true);
  assert.equal(checkAnswer(puzzle, [...puzzle.solution].reverse()).correct, false);
  assert.equal(checkAnswer(puzzle, []).complete, false);
});

test("registre des chambres — solution exacte", () => {
  const puzzle = PUZZLES_BY_ID["d2-chambres"];
  assert.equal(checkAnswer(puzzle, copy(puzzle.solution)).correct, true);
  const wrong = copy(puzzle.solution);
  wrong["1017"].chambre = "13";
  assert.equal(checkAnswer(puzzle, wrong).correct, false);
});

test("classement — solution exacte et erreur localisée", () => {
  const puzzle = PUZZLES_BY_ID["d4-versions"];
  assert.equal(checkAnswer(puzzle, copy(puzzle.solution)).correct, true);
  const wrong = copy(puzzle.solution);
  wrong.c1 = "inverifiable";
  assert.equal(checkAnswer(puzzle, wrong).correct, false);
  assert.equal(checkAnswer(puzzle, {}).complete, false);
});

test("photo impossible — sélection unique", () => {
  const puzzle = PUZZLES_BY_ID["d4-intrus"];
  assert.equal(checkAnswer(puzzle, "photo-c").correct, true);
  assert.equal(checkAnswer(puzzle, "photo-a").correct, false);
  assert.equal(checkAnswer(puzzle, "").complete, false);
});

test("message miroir — accents et variantes acceptés", () => {
  const puzzle = PUZZLES_BY_ID["d3-miroir"];
  for (const answer of ["zéro", "ZERO", "zero", "chambre zéro", "Chambre Zéro"]) {
    assert.equal(checkAnswer(puzzle, answer).correct, true, answer);
  }
  assert.equal(checkAnswer(puzzle, "miroir").correct, false);
  assert.equal(checkAnswer(puzzle, "   ").complete, false);
});

test("code d’intégrité — validation et feedback", () => {
  const puzzle = PUZZLES_BY_ID["d3-code"];
  assert.equal(checkAnswer(puzzle, "5293").correct, true);
  const wrong = checkAnswer(puzzle, "0123");
  assert.equal(wrong.correct, false);
  assert.deepEqual(wrong.feedback, { correct: 2, placed: 1, valid: true });
  assert.equal(checkAnswer(puzzle, "12").complete, false);
  assert.equal(isValidMastermindGuess("5293"), true);
  assert.equal(isValidMastermindGuess("52a3"), false);
});

test("feedback Mastermind — multiplicités", () => {
  assert.deepEqual(getMastermindFeedback("1212", "1122"), { correct: 4, placed: 2, valid: true });
  assert.deepEqual(getMastermindFeedback("0000", "1111"), { correct: 0, placed: 0, valid: true });
  assert.equal(getMastermindFeedback("12", "1234").valid, false);
});

test("code d’intégrité — indices cohérents et uniques", () => {
  const puzzle = PUZZLES_BY_ID["d3-code"];
  assert.deepEqual(mastermindSolutions(puzzle.data.clues, 4), [puzzle.solution]);
  const badClues = [{ guess: "0000", correct: 5, placed: 5 }];
  assert.equal(mastermindSolutions(badClues, 4).length, 0);
});

test("chaîne de preuves — ordre exact", () => {
  const puzzle = PUZZLES_BY_ID["d5-chaine"];
  assert.equal(checkAnswer(puzzle, [...puzzle.solution]).correct, true);
  assert.equal(checkAnswer(puzzle, [...puzzle.solution].reverse()).correct, false);
  assert.equal(checkAnswer(puzzle, puzzle.solution.slice(0, 2)).complete, false);
});

test("question finale — une seule réponse correcte", () => {
  const puzzle = PUZZLES_BY_ID["d5-question"];
  assert.equal(checkAnswer(puzzle, "les-deux").correct, true);
  assert.equal(checkAnswer(puzzle, "sujet").correct, false);
});

test("normalisation des réponses", () => {
  assert.equal(normalizeAnswer("ZÉRO !"), "zero");
  assert.equal(normalizeAnswer("  Chambre  14 "), "chambre14");
  assert.equal(normalizeAnswer("cœur"), "coeur");
  assert.equal(normalizeAnswer("Œuvre"), "oeuvre");
});

test("miroir alphabétique et inversion", () => {
  const plain = "SI TU M’ENTENDS, TU ES DEJA DANS LA CHAMBRE.\nELLE A UN NOM : ZERO.";
  const encoded = encodeCipher(plain);
  assert.notEqual(encoded, plain);
  assert.equal(decodeCipher(encoded, { mirror: true, reverse: true }), plain);
  assert.equal(atbash("ABC XYZ"), "ZYX CBA");
  assert.equal(reverseLines("abc\ndef"), "cba\nfed");
});

test("une énigme mal formée est signalée", () => {
  const errors = validatePuzzleStructure({
    id: "broken",
    type: "pair",
    dossier: 9,
    data: { items: [] },
    hints: [],
    explanation: [],
    solution: []
  });
  assert.ok(errors.length >= 3);
});
