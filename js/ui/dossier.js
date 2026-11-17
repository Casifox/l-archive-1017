/**
 * Écran de dossier : briefing, objectifs, énigmes, lieux d’enquête,
 * documents et clôture. Le même module sert l’aperçu et l’enquête.
 */

import { h, clear } from "../dom.js";
import { evidenceForDossier } from "../../data/evidence.js";
import { sceneById } from "../../data/story.js";
import { DOSSIERS_BY_ID } from "../../data/dossiers.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { showToast } from "./toast.js";
import { confirmDialog, openModal } from "./modal.js";
import { openEvidenceModal, renderEvidenceCard } from "./evidence.js";
import { DialoguePlayer } from "../dialogue.js";

function requirementLabel(gameState, requirement) {
  if (!requirement) return "";
  if (requirement.puzzle) {
    const puzzle = gameState.getPuzzle(requirement.puzzle);
    return `Résolvez d’abord « ${puzzle?.title || "l’énigme précédente"} ».`;
  }
  if (requirement.evidence) {
    return "Une preuve supplémentaire est nécessaire.";
  }
  if (requirement.flag) return "Cette zone n’est pas encore accessible.";
  return "Cette zone est verrouillée.";
}

function meetsRequirement(gameState, requirement) {
  if (!requirement) return true;
  if (requirement.puzzle) return gameState.isPuzzleSolved(requirement.puzzle);
  if (requirement.evidence) return gameState.isEvidenceFound(requirement.evidence);
  if (requirement.flag) return Boolean(gameState.getState()?.flags?.[requirement.flag]);
  return true;
}

function progressBar(value, total, label) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return h("div", { class: "progress-block" },
    h("div", { class: "progress-label" },
      h("span", { text: label }),
      h("span", { class: "progress-values", text: `${value} / ${total}` })
    ),
    h("div", { class: "progress-track", attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(value) } },
      h("span", { class: "progress-fill", style: { width: `${percent}%` } })
    )
  );
}

function openBundle(context, hotspot, items) {
  const { gameState, audio } = context;
  if (!items.length) {
    openModal({
      title: hotspot.label,
      subtitle: "Zone d’enquête",
      content: h("div", {},
        h("p", { class: "modal-text", text: hotspot.flavor || "Rien à consulter pour l’instant." }),
        h("p", { class: "muted small", text: "Cette zone réagit aux énigmes du dossier." })
      ),
      size: "sm",
      actions: [{ label: "Fermer", variant: "primary" }]
    });
    return;
  }
  if (items.length === 1) {
    const item = items[0];
    if (!gameState.isEvidenceFound(item.id)) gameState.findEvidence(item.id);
    openEvidenceModal(context, item);
    return;
  }
  audio.play("reveal");
  const list = h("div", { class: "evidence-bundle" });
  for (const item of items) {
    const foundBefore = gameState.isEvidenceFound(item.id);
    if (!foundBefore) gameState.findEvidence(item.id);
    list.append(
      renderEvidenceCard(item, {
        onOpen: (entry) => openEvidenceModal(context, entry),
        footer: h("span", { class: `evidence-card-open${foundBefore ? "" : " is-new"}` },
          h("span", { text: foundBefore ? "Relire" : "Nouveau" }),
          icon(foundBefore ? "arrowRight" : "spark", { size: 12 })
        )
      })
    );
  }
  openModal({
    title: hotspot.label,
    subtitle: hotspot.flavor || "Documents retrouvés dans cette zone.",
    content: list,
    size: "lg",
    testid: "bundle-modal",
    actions: [{ label: "Fermer", variant: "primary" }]
  });
}

function hotspotCard(context, hotspot) {
  const { gameState } = context;
  const locked = !meetsRequirement(gameState, hotspot.requires);
  const items = (hotspot.evidence || []).map((id) => gameState.getEvidence(id)).filter(Boolean);
  const foundCount = items.filter((item) => gameState.isEvidenceFound(item.id)).length;
  const status = locked ? "Verrouillé" : items.length === 0 ? "À examiner" : foundCount === items.length ? "Consulté" : foundCount > 0 ? "Partiel" : "À explorer";
  const button = h("button", {
    class: `hotspot${locked ? " is-locked" : ""}${foundCount === items.length && items.length ? " is-done" : ""}`,
    type: "button",
    dataset: { testid: `hotspot-${hotspot.id}` },
    attrs: { "aria-label": `${hotspot.label}. ${status}.` },
    on: {
      click: () => {
        if (locked) {
          showToast(requirementLabel(gameState, hotspot.requires), "warning", { title: "Zone verrouillée" });
          return;
        }
        if (!items.length) {
          openBundle(context, hotspot, []);
          return;
        }
        openBundle(context, hotspot, items);
      }
    }
  });
  button.append(
    h("span", { class: "hotspot-icon" }, icon(locked ? "lock" : hotspot.icon || "folder", { size: 20 })),
    h("span", { class: "hotspot-body" },
      h("span", { class: "hotspot-title", text: hotspot.label }),
      h("span", { class: "hotspot-flavor", text: locked ? requirementLabel(gameState, hotspot.requires) : hotspot.flavor || "Examiner cette zone." })
    ),
    h("span", { class: "hotspot-status" },
      h("span", { text: status }),
      icon(locked ? "lock" : foundCount === items.length && items.length ? "check" : "chevronRight", { size: 13 })
    )
  );
  return button;
}

function renderZones(context, dossier) {
  const wrap = h("section", { class: "dossier-section", id: "lieux" });
  wrap.append(
    h("div", { class: "section-head" },
      h("h2", { class: "section-title" }, icon("map", { size: 18 }), h("span", { text: "Lieux d’enquête" })),
      h("p", { class: "section-sub", text: "Chaque zone peut contenir un ou plusieurs documents. Les zones verrouillées s’ouvrent avec les énigmes." })
    )
  );
  const grid = h("div", { class: "zone-grid" });
  for (const zone of dossier.zones) {
    const zoneCard = h("article", { class: "zone-card" });
    zoneCard.append(
      h("div", { class: "zone-head" },
        h("h3", { class: "zone-title", text: zone.label }),
        h("p", { class: "zone-desc", text: zone.description })
      )
    );
    const list = h("div", { class: "hotspot-list" });
    for (const hotspot of zone.hotspots) list.append(hotspotCard(context, hotspot));
    zoneCard.append(list);
    grid.append(zoneCard);
  }
  wrap.append(grid);
  return wrap;
}

function renderPuzzles(context, dossier) {
  const { gameState, navigate } = context;
  const wrap = h("section", { class: "dossier-section", id: "enigmes" });
  wrap.append(
    h("div", { class: "section-head" },
      h("h2", { class: "section-title" }, icon("key", { size: 18 }), h("span", { text: "Énigmes" })),
      h("p", { class: "section-sub", text: "Les réponses sont vérifiées par le système. Deux indices sont disponibles pour chaque énigme." })
    )
  );
  const grid = h("div", { class: "puzzle-grid" });
  for (const puzzleId of dossier.puzzles) {
    const puzzle = gameState.getPuzzle(puzzleId);
    if (!puzzle) continue;
    const progress = gameState.getPuzzleProgress(puzzleId);
    const solved = progress.solved;
    const card = h("button", {
      class: `puzzle-card${solved ? " is-solved" : ""}`,
      type: "button",
      dataset: { testid: `puzzle-card-${puzzle.id}` },
      on: { click: () => navigate(`/enigme/${puzzle.id}`) }
    });
    card.append(
      h("div", { class: "puzzle-card-top" },
        h("span", { class: "puzzle-type", text: puzzle.type === "mastermind" ? "CODE" : puzzle.type === "cipher" ? "DÉCRYPTAGE" : puzzle.type === "order" ? "CHRONOLOGIE" : puzzle.type === "classify" ? "DÉDUCTION" : puzzle.type === "pair" ? "CONTRADICTION" : puzzle.type === "chain" ? "SYNTHÈSE" : puzzle.type === "assign" ? "LOGIQUE" : "DÉDUCTION" }),
        h("span", { class: `status-chip status-chip--${solved ? "done" : "open"}` },
          icon(solved ? "check" : "key", { size: 12 }),
          h("span", { text: solved ? "Résolue" : "À résoudre" })
        )
      ),
      h("h3", { class: "puzzle-card-title", text: puzzle.title }),
      h("p", { class: "puzzle-card-sub", text: puzzle.subtitle }),
      h("div", { class: "puzzle-card-meta" },
        h("span", { text: solved ? "Solution consultable" : progress.attempts > 0 ? `${progress.attempts} tentative${progress.attempts > 1 ? "s" : ""}` : "Non commencée" }),
        progress.hintsUsed > 0 ? h("span", { text: `${progress.hintsUsed} indice${progress.hintsUsed > 1 ? "s" : ""}` }) : null
      ),
      h("span", { class: "puzzle-card-arrow" }, icon("arrowRight", { size: 16 }))
    );
    grid.append(card);
  }
  wrap.append(grid);
  return wrap;
}

function renderObjectives(gameState, dossier) {
  const objectives = gameState.getObjectives(dossier.id);
  const list = h("ul", { class: "objective-list" });
  for (const objective of objectives) {
    list.append(
      h("li", { class: `objective${objective.done ? " is-done" : ""}` },
        h("span", { class: "objective-check" }, icon(objective.done ? "check" : "minus", { size: 14 })),
        h("span", { class: "objective-label", text: objective.label }),
        h("span", { class: "objective-state", text: objective.done ? "Accompli" : "En attente" })
      )
    );
  }
  return list;
}

function renderDossierSummary(context, dossier, progress) {
  const { gameState } = context;
  const completed = progress.completed;
  const panel = h("section", { class: "dossier-overview panel panel--glow" });
  const left = h("div", { class: "dossier-overview-main" });
  left.append(
    h("div", { class: "dossier-overview-tags" },
      h("span", { class: "chip" }, icon(dossier.icon, { size: 13 }), h("span", { text: dossier.code })),
      h("span", { class: `status-chip status-chip--${completed ? "done" : progress.canComplete ? "active" : "open"}` },
        icon(completed ? "check" : progress.canComplete ? "play" : "folder", { size: 12 }),
        h("span", { text: completed ? "Dossier clos" : progress.canComplete ? "Prêt à clore" : "Enquête en cours" })
      )
    ),
    h("p", { class: "dossier-overview-summary", text: dossier.summary }),
    h("div", { class: "dossier-overview-bars" },
      progressBar(progress.puzzleSolved, progress.puzzleTotal, "Énigmes"),
      progressBar(progress.evidenceFound, progress.evidenceTotal, "Preuves essentielles")
    )
  );
  const right = h("div", { class: "dossier-overview-actions" });
  if (completed) {
    right.append(
      h("p", { class: "kicker", text: "DOSSIER CLOS" }),
      h("p", { class: "muted small", text: "Vous pouvez relire les documents et revoir la conclusion." }),
      h("a", { class: "btn btn-ghost", href: `#/dossier/${dossier.id}/cloture` }, icon("book", { size: 16 }), h("span", { text: "Revoir la conclusion" }))
    );
  } else if (progress.canComplete) {
    right.append(
      h("p", { class: "kicker", text: "PRÊT" }),
      h("p", { class: "muted small", text: "Toutes les énigmes sont résolues et toutes les preuves essentielles sont consultées." }),
      h("button", {
        class: "btn btn-primary",
        type: "button",
        dataset: { testid: "close-dossier" },
        on: {
          click: async () => {
            const ok = await confirmDialog({
              title: "Clore le dossier",
              message: "La conclusion du dossier sera lue. Vous pourrez encore consulter les documents et revenir sur vos décisions depuis le journal.",
              confirmLabel: "Clore le dossier",
              cancelLabel: "Pas encore"
            });
            if (ok) context.navigate(`/dossier/${dossier.id}/cloture`);
          }
        }
      }, icon("check", { size: 16 }), h("span", { text: "Clore le dossier" }))
    );
  } else {
    const missing = gameState.getMissingForDossier(dossier.id);
    right.append(
      h("p", { class: "kicker", text: "POUR CLORE" }),
      h("p", { class: "muted small", text: "Il reste des éléments à examiner." }),
      h("ul", { class: "missing-list" },
        missing.puzzles.map((title) => h("li", {}, icon("key", { size: 12 }), h("span", { text: title }))),
        missing.evidence.map((title) => h("li", {}, icon("file", { size: 12 }), h("span", { text: title })))
      )
    );
  }
  panel.append(left, right);
  return panel;
}

function renderContent(context, dossier) {
  const { gameState } = context;
  const progress = gameState.getDossierProgress(dossier.id);
  const found = gameState.getFoundEvidence({ dossier: dossier.id });
  const secrets = evidenceForDossier(dossier.id).filter((item) => item.secret);
  const content = h("div", { class: "dossier-content" });
  content.append(renderDossierSummary(context, dossier, progress));

  const columns = h("div", { class: "dossier-columns" });
  const main = h("div", { class: "dossier-main-column" });
  main.append(renderPuzzles(context, dossier), renderZones(context, dossier));
  const aside = h("aside", { class: "dossier-aside-column" });

  const objectivesPanel = h("div", { class: "panel dossier-aside-panel" });
  objectivesPanel.append(
    h("p", { class: "kicker", text: "OBJECTIFS" }),
    renderObjectives(gameState, dossier)
  );
  aside.append(objectivesPanel);

  const evidencePanel = h("div", { class: "panel dossier-aside-panel" });
  evidencePanel.append(
    h("div", { class: "panel-head" },
      h("p", { class: "kicker", text: "DOCUMENTS" }),
      h("a", { class: "text-link", href: "#/preuves" }, h("span", { text: "Inventaire" }), icon("arrowRight", { size: 13 }))
    )
  );
  if (!found.length) {
    evidencePanel.append(h("p", { class: "muted small", text: "Aucun document consulté dans ce dossier." }));
  } else {
    const list = h("ul", { class: "doc-side-list" });
    for (const item of found) {
      list.append(
        h("li", {},
          h("button", {
            class: "doc-side-link",
            type: "button",
            on: { click: () => openEvidenceModal(context, item) }
          },
            icon(item.secret ? "lock" : "file", { size: 14 }),
            h("span", { text: item.title }),
            item.secret ? h("span", { class: "doc-side-secret", text: "secret" }) : null
          )
        )
      );
    }
    evidencePanel.append(list);
  }
  if (secrets.some((item) => !gameState.isEvidenceFound(item.id))) {
    evidencePanel.append(
      h("p", { class: "secret-hint" }, icon("lock", { size: 13 }), h("span", { text: "Un document secret se cache encore dans ce dossier." }))
    );
  }
  aside.append(evidencePanel);

  const tipPanel = h("div", { class: "panel dossier-aside-panel" },
    h("p", { class: "kicker", text: "MÉTHODE" }),
    h("p", { class: "muted small", text: "Lisez les documents avant de répondre. Le tableau d’enquête permet d’associer deux preuves pour vérifier une hypothèse." }),
    h("a", { class: "text-link", href: "#/tableau" }, h("span", { text: "Ouvrir le tableau" }), icon("arrowRight", { size: 13 }))
  );
  aside.append(tipPanel);

  columns.append(main, aside);
  content.append(columns);
  return content;
}

export function mountDossier(root, context, mode = "overview") {
  const { gameState, audio, settings, navigate, params } = context;
  const id = Number(params.id);
  const dossier = DOSSIERS_BY_ID[id];
  if (!dossier) {
    navigate("/hub");
    return () => {};
  }
  gameState.setPlaying(true);
  const sceneId = `dossier-${id}-intro`;
  const introScene = sceneById(sceneId);
  const seenIntro = gameState.hasSeenScene(sceneId);
  const content = renderContent(context, dossier);
  const briefing = h("section", { class: "briefing panel panel--glow" });
  const briefingHost = h("div", { class: "briefing-dialogue", dataset: { testid: "dossier-briefing" } });
  briefing.append(
    h("div", { class: "briefing-head" },
      h("p", { class: "kicker", text: "BRIEFING" }),
      h("h2", { class: "briefing-title", text: introScene?.title || dossier.title }),
      h("p", { class: "muted small", text: "La voix de l’archive ouvre le dossier. Vous pouvez la relire à tout moment." })
    ),
    briefingHost
  );
  if (seenIntro) briefing.hidden = true;
  else content.hidden = true;

  const contentWrap = h("div", { class: "dossier-page" }, briefing, content);
  const shell = renderShell(root, {
    context,
    active: "hub",
    eyebrow: dossier.code,
    title: dossier.title,
    subtitle: dossier.tagline,
    back: { path: "/hub", label: "Salle des archives" },
    actions: [
      { label: "Tableau d’enquête", path: "/tableau", icon: "grid" },
      { label: "Journal", path: "/journal", icon: "book" }
    ],
    content: contentWrap
  });

  let player = null;
  if (!seenIntro && introScene) {
    player = new DialoguePlayer({
      container: briefingHost,
      scene: introScene,
      gameState,
      audio,
      settings,
      dossier: id,
      onComplete: () => {
        gameState.markSceneSeen(sceneId);
        gameState.saveNow();
        briefing.hidden = true;
        content.hidden = false;
        if (player) {
          player.destroy();
          player = null;
        }
        audio.play("success");
        showToast("Briefing terminé. L’enquête peut commencer.", "info", { title: dossier.code });
      }
    });
  }

  return () => {
    player?.destroy();
    player = null;
    shell.cleanup();
  };
}

export function mountCloture(root, context) {
  const { gameState, audio, settings, navigate, params } = context;
  const id = Number(params.id);
  const dossier = DOSSIERS_BY_ID[id];
  if (!dossier) {
    navigate("/hub");
    return () => {};
  }
  const scene = sceneById(`dossier-${id}-outro`);
  const alreadyCompleted = gameState.isDossierCompleted(id);
  const host = h("div", { class: "cloture-dialogue", dataset: { testid: "cloture-dialogue" } });
  const shell = renderShell(root, {
    context,
    active: "hub",
    eyebrow: dossier.code,
    title: alreadyCompleted ? "Conclusion" : "Clôture du dossier",
    subtitle: alreadyCompleted ? "Relecture de la conclusion." : "La voix de l’archive referme le dossier. Vos choix seront enregistrés.",
    back: { path: `/dossier/${id}`, label: `Retour au dossier ${String(id).padStart(2, "0")}` },
    content: h("section", { class: "panel panel--glow cloture-panel" }, host)
  });

  const player = new DialoguePlayer({
    container: host,
    scene,
    gameState,
    audio,
    settings,
    dossier: id,
    readOnly: alreadyCompleted,
    onComplete: () => {
      if (!alreadyCompleted) {
        const result = gameState.completeDossier(id);
        if (!result.ok) {
          showToast(result.error || "Le dossier ne peut pas être clos.", "error", { title: "Clôture impossible" });
          navigate(`/dossier/${id}`);
          return;
        }
        audio.play("success");
        showToast("Dossier clos.", "success", { title: dossier.code });
      }
      if (dossier.next) navigate(`/dossier/${dossier.next}`);
      else navigate("/finale");
    }
  });

  return () => {
    player.destroy();
    shell.cleanup();
  };
}
