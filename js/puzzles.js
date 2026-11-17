/**
 * Moteur d’énigmes — fonctions pures, testables sans DOM.
 * Les solutions viennent exclusivement de data/puzzles.js.
 */

/** Normalise une réponse libre : minuscules, sans accents, sans ponctuation. */
export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Miroir alphabétique A↔Z. Les caractères non alphabétiques sont conservés. */
export function atbash(text) {
  return String(text ?? "")
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCharCode(90 - (letter.charCodeAt(0) - 65)));
}

/** Inverse chaque ligne, sans changer l’ordre des lignes. */
export function reverseLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => [...line].reverse().join(""))
    .join("\n");
}

/**
 * Applique les transformations du décodeur.
 * @param {string} text
 * @param {{mirror?:boolean, reverse?:boolean}} options
 */
export function decodeCipher(text, options = {}) {
  let result = String(text ?? "");
  if (options.mirror) result = atbash(result);
  if (options.reverse) result = reverseLines(result);
  return result;
}

/** Encodage utilisé pour produire la transcription brute (tests). */
export function encodeCipher(plainText) {
  return reverseLines(atbash(plainText));
}

/**
 * Feedback Mastermind.
 * correct : nombre de chiffres présents dans le code, multiplicités comprises.
 * placed  : nombre de chiffres à la bonne position.
 */
export function getMastermindFeedback(guess, code) {
  const guessDigits = [...String(guess)];
  const codeDigits = [...String(code)];
  if (guessDigits.length !== codeDigits.length) {
    return { correct: 0, placed: 0, valid: false };
  }
  let placed = 0;
  for (let index = 0; index < guessDigits.length; index += 1) {
    if (guessDigits[index] === codeDigits[index]) placed += 1;
  }
  const guessCount = new Map();
  const codeCount = new Map();
  for (const digit of guessDigits) guessCount.set(digit, (guessCount.get(digit) || 0) + 1);
  for (const digit of codeDigits) codeCount.set(digit, (codeCount.get(digit) || 0) + 1);
  let correct = 0;
  for (const [digit, count] of guessCount) {
    correct += Math.min(count, codeCount.get(digit) || 0);
  }
  return { correct, placed, valid: true };
}

export function isValidMastermindGuess(guess, length = 4) {
  return new RegExp(`^\\d{${length}}$`).test(String(guess));
}

/**
 * Énumère les codes compatibles avec les indices fournis.
 * Sert aux tests d’unicité et à un éventuel mode d’accessibilité.
 */
export function mastermindSolutions(clues, length = 4) {
  const solutions = [];
  const max = 10 ** length;
  for (let value = 0; value < max; value += 1) {
    const candidate = String(value).padStart(length, "0");
    const matches = clues.every((clue) => {
      const feedback = getMastermindFeedback(clue.guess, candidate);
      return feedback.correct === clue.correct && feedback.placed === clue.placed;
    });
    if (matches) solutions.push(candidate);
  }
  return solutions;
}

function compareArrays(answer, solution) {
  if (!Array.isArray(answer) || answer.length !== solution.length) return false;
  return solution.every((value, index) => answer[index] === value);
}

function sameSet(answer, solution) {
  if (!Array.isArray(answer) || answer.length !== solution.length) return false;
  const left = [...answer].sort();
  const right = [...solution].sort();
  return left.every((value, index) => value === right[index]);
}

function checkAssign(puzzle, answer) {
  if (!answer || typeof answer !== "object") return { complete: false, correct: false };
  const fields = puzzle.data.fields || [];
  for (const row of puzzle.data.rows) {
    for (const field of fields) {
      if (!answer[row.id]?.[field.id]) return { complete: false, correct: false };
    }
  }
  const correct = puzzle.data.rows.every((row) =>
    fields.every((field) => answer[row.id]?.[field.id] === puzzle.solution[row.id]?.[field.id])
  );
  return { complete: true, correct };
}

/**
 * Vérifie une réponse.
 * @returns {{correct:boolean, complete:boolean, message:string}}
 */
export function checkAnswer(puzzle, answer) {
  if (!puzzle) return { correct: false, complete: false, message: "Énigme introuvable." };

  switch (puzzle.type) {
    case "pair": {
      const complete = Array.isArray(answer) && answer.length === puzzle.data.selection;
      if (!complete) {
        return { correct: false, complete: false, message: `Sélectionnez exactement ${puzzle.data.selection} éléments.` };
      }
      if (sameSet(answer, puzzle.solution)) {
        return { correct: true, complete: true, message: puzzle.success || "Contradiction identifiée." };
      }
      return {
        correct: false,
        complete: true,
        message: "Ces deux éléments ne se contredisent pas. Cherchez un fait horodaté."
      };
    }

    case "assign": {
      const result = checkAssign(puzzle, answer);
      if (!result.complete) {
        return { correct: false, complete: false, message: "Remplissez toutes les lignes avant de vérifier." };
      }
      if (result.correct) {
        return { correct: true, complete: true, message: puzzle.success || "Attribution correcte." };
      }
      return {
        correct: false,
        complete: true,
        message: "Au moins une attribution est fausse. Relisez les indices et le journal d’accès."
      };
    }

    case "order": {
      if (!Array.isArray(answer) || answer.length !== puzzle.solution.length) {
        return { correct: false, complete: false, message: "Tous les événements doivent être présents." };
      }
      if (compareArrays(answer, puzzle.solution)) {
        return { correct: true, complete: true, message: puzzle.success || "Chronologie correcte." };
      }
      return {
        correct: false,
        complete: true,
        message: "L’ordre n’est pas encore bon. Les horaires sont dispersés dans trois documents."
      };
    }

    case "classify": {
      if (!answer || typeof answer !== "object") {
        return { correct: false, complete: false, message: "Classez chaque affirmation." };
      }
      const complete = puzzle.data.items.every((item) => Boolean(answer[item.id]));
      if (!complete) {
        return { correct: false, complete: false, message: "Toutes les affirmations doivent avoir une catégorie." };
      }
      const correct = puzzle.data.items.every((item) => answer[item.id] === puzzle.solution[item.id]);
      if (correct) {
        return { correct: true, complete: true, message: puzzle.success || "Classement validé." };
      }
      return {
        correct: false,
        complete: true,
        message: "Au moins une affirmation est mal classée. Une source qui en contredit une autre n’est pas « probablement fausse »."
      };
    }

    case "single": {
      if (!answer) return { correct: false, complete: false, message: "Sélectionnez une réponse." };
      if (answer === puzzle.solution) {
        return { correct: true, complete: true, message: puzzle.success || "Réponse correcte." };
      }
      return {
        correct: false,
        complete: true,
        message: "Ce n’est pas la bonne réponse. Vérifiez les documents techniques."
      };
    }

    case "cipher": {
      const normalized = normalizeAnswer(answer);
      if (!normalized) return { correct: false, complete: false, message: "Saisissez le nom trouvé dans le message." };
      const accepted = (puzzle.accepted || []).map(normalizeAnswer);
      if (accepted.includes(normalized)) {
        return { correct: true, complete: true, message: puzzle.success || "Message reconstitué." };
      }
      return {
        correct: false,
        complete: true,
        message: "Ce n’est pas le nom que le message indique. Relisez la troisième ligne."
      };
    }

    case "mastermind": {
      const guess = String(answer ?? "");
      if (!isValidMastermindGuess(guess, puzzle.data.length)) {
        return {
          correct: false,
          complete: false,
          message: `Entrez exactement ${puzzle.data.length} chiffres.`
        };
      }
      if (guess === puzzle.solution) {
        return { correct: true, complete: true, message: puzzle.success || "Code accepté." };
      }
      const feedback = getMastermindFeedback(guess, puzzle.solution);
      return {
        correct: false,
        complete: true,
        message: `${feedback.correct} chiffre${feedback.correct > 1 ? "s" : ""} correct${feedback.correct > 1 ? "s" : ""}, ${feedback.placed} bien placé${feedback.placed > 1 ? "s" : ""}.`,
        feedback
      };
    }

    case "chain": {
      if (!Array.isArray(answer) || answer.length !== puzzle.data.length) {
        return { correct: false, complete: false, message: `Sélectionnez et ordonnez ${puzzle.data.length} preuves.` };
      }
      if (compareArrays(answer, puzzle.solution)) {
        return { correct: true, complete: true, message: puzzle.success || "Chaîne complète." };
      }
      return {
        correct: false,
        complete: true,
        message: "La chaîne ne tient pas encore. Commencez par le document qui montre qui a ouvert la session."
      };
    }

    default:
      return { correct: false, complete: false, message: "Type d’énigme inconnu." };
  }
}

/** Vérifie qu’une énigme est bien formée (utilisé par les tests). */
export function validatePuzzleStructure(puzzle) {
  const errors = [];
  if (!puzzle.id || !puzzle.type) errors.push("id/type manquant");
  if (!Number.isInteger(puzzle.dossier) || puzzle.dossier < 1 || puzzle.dossier > 5) errors.push("dossier invalide");
  if (!Array.isArray(puzzle.hints) || puzzle.hints.length !== 2) errors.push("deux indices requis");
  if (!Array.isArray(puzzle.explanation) || !puzzle.explanation.length) errors.push("explication manquante");
  if (!puzzle.solution && puzzle.type !== "cipher") errors.push("solution manquante");

  switch (puzzle.type) {
    case "pair":
      if (!Array.isArray(puzzle.data?.items) || puzzle.data.items.length < 3) errors.push("items manquants");
      if (!Array.isArray(puzzle.solution) || puzzle.solution.length !== puzzle.data?.selection) errors.push("solution paire invalide");
      break;
    case "assign":
      if (!Array.isArray(puzzle.data?.rows) || !Array.isArray(puzzle.data?.fields)) errors.push("lignes/champs manquants");
      break;
    case "order":
      if (!Array.isArray(puzzle.data?.items) || !Array.isArray(puzzle.solution)) errors.push("ordre invalide");
      break;
    case "classify":
      if (!Array.isArray(puzzle.data?.categories) || !Array.isArray(puzzle.data?.items)) errors.push("catégories manquantes");
      break;
    case "single":
      if (!Array.isArray(puzzle.data?.options)) errors.push("options manquantes");
      break;
    case "cipher":
      if (!puzzle.data?.ciphertext || !Array.isArray(puzzle.accepted)) errors.push("chiffrement invalide");
      break;
    case "mastermind":
      if (!/^\d{4}$/.test(String(puzzle.solution))) errors.push("code mastermind invalide");
      if (!Array.isArray(puzzle.data?.clues) || puzzle.data.clues.length < 3) errors.push("indices mastermind manquants");
      break;
    case "chain":
      if (!Array.isArray(puzzle.data?.cards) || !Array.isArray(puzzle.solution)) errors.push("chaîne invalide");
      break;
    default:
      errors.push(`type inconnu : ${puzzle.type}`);
  }
  return errors;
}
