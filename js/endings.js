/**
 * Conditions et résolution des fins.
 * Une fin verrouillée reste visible avec ses conditions, sauf la fin
 * secrète qui n’apparaît qu’une fois ses prérequis réunis.
 */

import { ENDINGS, ENDINGS_BY_ID } from "../data/endings.js";
import { PUZZLES } from "../data/puzzles.js";
import { SECRET_EVIDENCE } from "../data/evidence.js";

export const TOTAL_PUZZLES = PUZZLES.length;

export function eveilChecklist(state) {
  const secretsFound = SECRET_EVIDENCE.filter((id) => state.evidence?.[id]?.found).length;
  const puzzlesSolved = PUZZLES.filter((puzzle) => state.puzzles?.[puzzle.id]?.solved).length;
  return [
    {
      id: "dossiers",
      label: "Terminer les cinq dossiers",
      done: (state.completedDossiers?.length || 0) === 5,
      detail: `${state.completedDossiers?.length || 0} / 5`
    },
    {
      id: "puzzles",
      label: `Résoudre les ${TOTAL_PUZZLES} énigmes`,
      done: puzzlesSolved === TOTAL_PUZZLES,
      detail: `${puzzlesSolved} / ${TOTAL_PUZZLES}`
    },
    {
      id: "lucidite",
      label: "Atteindre 8 en Lucidité",
      done: (state.stats?.lucidite || 0) >= 8,
      detail: `${state.stats?.lucidite || 0} / 8`
    },
    {
      id: "secrets",
      label: "Retrouver les trois documents secrets",
      done: secretsFound === SECRET_EVIDENCE.length,
      detail: `${secretsFound} / ${SECRET_EVIDENCE.length}`
    },
    {
      id: "contradictions",
      label: "Identifier les trois contradictions centrales",
      done: (state.counters?.centralContradictions || 0) >= 3,
      detail: `${state.counters?.centralContradictions || 0} / 3`
    },
    {
      id: "reconnu",
      label: "Reconnaître ce que tu es",
      done: Boolean(state.flags?.selfRecognized),
      detail: state.flags?.selfRecognized ? "accompli" : "à découvrir"
    }
  ];
}

export function isEveilAvailable(state) {
  return eveilChecklist(state).every((item) => item.done);
}

/**
 * Disponibilité de chaque fin.
 * @returns {Array<{id:string, ending:object, unlocked:boolean, reasons:string[], checklist?:Array}>}
 */
export function getEndingAvailability(state) {
  return ENDINGS.map((ending) => {
    if (ending.id === "eveil") {
      const checklist = eveilChecklist(state);
      const unlocked = checklist.every((item) => item.done);
      return {
        id: ending.id,
        ending,
        unlocked,
        reasons: unlocked ? [] : ["Toutes les conditions de l’Éveil ne sont pas réunies."],
        checklist,
        secret: true
      };
    }

    if (ending.requirement?.type === "confiance") {
      const min = ending.requirement.min ?? 0;
      const unlocked = (state.stats?.confiance || 0) >= min;
      return {
        id: ending.id,
        ending,
        unlocked,
        reasons: unlocked ? [] : [`La voix ne te fait pas encore assez confiance. Confiance : ${state.stats?.confiance || 0} / ${min}.`],
        checklist: null,
        secret: false
      };
    }

    return {
      id: ending.id,
      ending,
      unlocked: true,
      reasons: [],
      checklist: null,
      secret: false
    };
  });
}

export function canChooseEnding(state, endingId) {
  const availability = getEndingAvailability(state).find((entry) => entry.id === endingId);
  return Boolean(availability?.unlocked);
}

/**
 * Résout le texte d’une fin, avec sa variante haute ou basse.
 * @returns {object|null}
 */
export function resolveEnding(state, endingId) {
  const ending = ENDINGS_BY_ID[endingId];
  if (!ending) return null;
  if (!canChooseEnding(state, endingId)) return null;

  let variant = null;
  let variantTone = "neutral";
  if (ending.high) {
    const value = state.stats?.[ending.high.stat] || 0;
    if (value >= ending.high.threshold) {
      variant = ending.high;
      variantTone = "high";
    } else {
      variant = ending.low || null;
      variantTone = "low";
    }
  }

  return {
    id: ending.id,
    title: ending.title,
    label: ending.label,
    tagline: ending.tagline,
    theme: ending.theme,
    icon: ending.icon,
    secret: ending.secret,
    paragraphs: [...ending.paragraphs],
    variantParagraphs: variant?.paragraphs ? [...variant.paragraphs] : [],
    variantTone,
    epilogue: ending.epilogue,
    finalLine: ending.finalLine
  };
}

export function availableEndingIds(state) {
  return getEndingAvailability(state)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.id);
}

export function endingById(id) {
  return ENDINGS_BY_ID[id] || null;
}

export function allEndings() {
  return ENDINGS;
}
