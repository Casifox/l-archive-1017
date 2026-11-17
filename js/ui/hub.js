/** Salle des archives : hub central des cinq dossiers. */

import { h, clear } from "../dom.js";
import { DOSSIERS } from "../../data/dossiers.js";
import { formatClock } from "../utils.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { showToast } from "./toast.js";

function progressBar(value, total, label) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return h("div", { class: "progress-block" },
    h("div", { class: "progress-label" },
      h("span", { text: label }),
      h("span", { class: "progress-values", text: `${value} / ${total}` })
    ),
    h("div", { class: "progress-track", attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(value), "aria-label": label } },
      h("span", { class: "progress-fill", style: { width: `${percent}%` } })
    )
  );
}

function statusFor(gameState, dossier) {
  if (!gameState.isDossierUnlocked(dossier.id)) return { id: "locked", label: "Verrouillé" };
  if (gameState.isDossierCompleted(dossier.id)) return { id: "done", label: "Clos" };
  const progress = gameState.getDossierProgress(dossier.id);
  if (progress.puzzleSolved > 0 || progress.evidenceFound > 0) return { id: "active", label: "En cours" };
  return { id: "open", label: "Disponible" };
}

function dossierCard(context, dossier) {
  const { gameState, navigate } = context;
  const unlocked = gameState.isDossierUnlocked(dossier.id);
  const completed = gameState.isDossierCompleted(dossier.id);
  const progress = gameState.getDossierProgress(dossier.id);
  const status = statusFor(gameState, dossier);
  const card = h("button", {
    class: `dossier-card dossier-card--${status.id}`,
    type: "button",
    dataset: { testid: `dossier-card-${dossier.id}` },
    attrs: { "aria-label": `${dossier.code} — ${dossier.title}. ${status.label}.` },
    on: {
      click: () => {
        if (!unlocked) {
          const previous = dossier.id - 1;
          showToast(`Ce dossier est verrouillé. Terminez d’abord le dossier ${String(previous).padStart(2, "0")}.`, "warning", { title: "Accès refusé" });
          return;
        }
        if (completed) navigate(`/dossier/${dossier.id}`);
        else navigate(`/dossier/${dossier.id}`);
      }
    }
  });

  const top = h("div", { class: "dossier-card-top" },
    h("span", { class: "dossier-number", text: String(dossier.id).padStart(2, "0") }),
    h("span", { class: `status-chip status-chip--${status.id}` },
      icon(status.id === "locked" ? "lock" : status.id === "done" ? "check" : status.id === "active" ? "play" : "folder", { size: 12 }),
      h("span", { text: status.label })
    )
  );
  const iconWrap = h("span", { class: "dossier-icon" }, icon(dossier.icon, { size: 26 }));
  const body = h("div", { class: "dossier-card-body" },
    h("p", { class: "dossier-code", text: dossier.code }),
    h("h3", { class: "dossier-card-title", text: dossier.title }),
    h("p", { class: "dossier-tagline", text: dossier.tagline }),
    h("p", { class: "dossier-summary", text: dossier.summary })
  );
  const progressWrap = h("div", { class: "dossier-progress" },
    progressBar(progress.puzzleSolved, progress.puzzleTotal, "Énigmes"),
    progressBar(progress.evidenceFound, progress.evidenceTotal, "Preuves")
  );
  const footer = h("div", { class: "dossier-card-footer" },
    h("span", { class: "dossier-footer-text", text: completed ? "Dossier clos — consultable" : unlocked ? (progress.canComplete ? "Prêt à être clos" : progress.puzzleSolved > 0 || progress.evidenceFound > 0 ? "Enquête en cours" : "Disponible — cliquez pour commencer") : "Terminez le dossier précédent" }),
    h("span", { class: "dossier-footer-arrow" }, icon(unlocked ? "arrowRight" : "lock", { size: 16 }))
  );
  card.append(top, h("div", { class: "dossier-card-head" }, iconWrap, body), progressWrap, footer);
  if (!unlocked) card.disabled = true;
  return card;
}

function journalPreview(gameState) {
  const entries = gameState.getJournal().slice(0, 5);
  const panel = h("div", { class: "panel hub-panel" });
  panel.append(
    h("div", { class: "panel-head" },
      h("p", { class: "kicker", text: "FIL DE LA SESSION" }),
      h("a", { class: "text-link", href: "#/journal" }, h("span", { text: "Tout voir" }), icon("arrowRight", { size: 13 }))
    )
  );
  if (!entries.length) {
    panel.append(h("p", { class: "muted small", text: "Aucun événement enregistré pour l’instant." }));
    return panel;
  }
  const list = h("ul", { class: "timeline" });
  for (const entry of entries) {
    list.append(
      h("li", { class: "timeline-item" },
        h("span", { class: `timeline-dot timeline-dot--${entry.type}` }),
        h("div", { class: "timeline-body" },
          h("p", { class: "timeline-title", text: entry.title }),
          h("p", { class: "timeline-meta", text: `T+ ${formatClock(entry.playTime)}${entry.dossier ? ` · Dossier ${String(entry.dossier).padStart(2, "0")}` : ""}` })
        )
      )
    );
  }
  panel.append(list);
  return panel;
}

function progressPanel(gameState) {
  const global = gameState.getGlobalProgress();
  const solved = gameState.getSolvedPuzzleCount();
  const evidence = gameState.getEvidenceCount();
  const connections = gameState.getConnectionCount();
  const achievements = gameState.getAchievementCount();
  return h("div", { class: "panel hub-panel" },
    h("p", { class: "kicker", text: "PROGRESSION" }),
    h("div", { class: "hub-stat-grid" },
      h("div", { class: "hub-stat" }, h("strong", { text: `${global.dossiers} / 5` }), h("span", { text: "Dossiers" })),
      h("div", { class: "hub-stat" }, h("strong", { text: `${solved.solved} / ${solved.total}` }), h("span", { text: "Énigmes" })),
      h("div", { class: "hub-stat" }, h("strong", { text: `${evidence.found} / ${evidence.total}` }), h("span", { text: "Preuves" })),
      h("div", { class: "hub-stat" }, h("strong", { text: `${connections.found} / ${connections.total}` }), h("span", { text: "Liens" })),
      h("div", { class: "hub-stat" }, h("strong", { text: `${achievements.unlocked} / ${achievements.total}` }), h("span", { text: "Succès" })),
      h("div", { class: "hub-stat" }, h("strong", { text: gameState.getPlayTimeLabel() }), h("span", { text: "Temps" }))
    )
  );
}

function getTip(gameState) {
  const state = gameState.getState();
  if (state.completedDossiers.length === 5 && !state.ending) {
    return "La dernière porte est ouverte. Toutes les preuves sont là. Il ne reste qu’une décision.";
  }
  const current = DOSSIERS.find((dossier) => gameState.isDossierUnlocked(dossier.id) && !gameState.isDossierCompleted(dossier.id));
  if (!current) return "Tous les dossiers sont clos. Votre décision vous attend.";
  const progress = gameState.getDossierProgress(current.id);
  if (progress.puzzleSolved < progress.puzzleTotal) {
    return "Les énigmes ne se résolvent pas au hasard. Lisez les documents, puis utilisez les indices si nécessaire.";
  }
  if (progress.evidenceFound < progress.evidenceTotal) {
    return "Il manque des preuves dans ce dossier. Cliquez sur chaque lieu de l’enquête : les documents essentiels y sont cachés.";
  }
  return "Le dossier est prêt à être clos. Ouvrez-le pour lire sa conclusion et débloquer la suite.";
}

export function mountHub(root, context) {
  const { gameState, navigate } = context;
  const state = gameState.getState();
  gameState.setPlaying(!state.ending);
  const global = gameState.getGlobalProgress();
  const percent = state.completedDossiers.length >= 5 ? 100 : Math.round((state.completedDossiers.length / 5) * 100);

  const hero = h("section", { class: "hub-hero panel panel--glow" });
  const heroLeft = h("div", { class: "hub-hero-left" });
  const ring = h("div", { class: "progress-ring", attrs: { role: "img", "aria-label": `Progression : ${percent} % des dossiers clos` } },
    h("div", { class: "progress-ring-inner" },
      h("strong", { text: `${percent}%` }),
      h("span", { text: "enquête" })
    )
  );
  ring.style.setProperty("--value", `${percent}%`);
  heroLeft.append(
    h("p", { class: "kicker", text: "SESSION 47 · SUJET 1017" }),
    h("h2", { class: "hub-hero-title", text: "La salle des archives" }),
    h("p", { class: "hub-hero-text", text: "Cinq dossiers. Une seule nuit. Vous pouvez encore croire qu’il s’agit de quelqu’un d’autre." }),
    h("div", { class: "hub-hero-chips" },
      h("span", { class: "chip" }, icon("archive", { size: 13 }), h("span", { text: `${global.dossiers} / 5 dossiers` })),
      h("span", { class: "chip" }, icon("file", { size: 13 }), h("span", { text: `${global.evidence} preuves` })),
      h("span", { class: "chip" }, icon("trophy", { size: 13 }), h("span", { text: `${global.achievements} succès` }))
    )
  );
  const heroRight = h("div", { class: "hub-hero-right" });
  const currentDossier = DOSSIERS.find((dossier) => gameState.isDossierUnlocked(dossier.id) && !gameState.isDossierCompleted(dossier.id));
  if (state.ending) {
    heroRight.append(
      h("p", { class: "kicker", text: "SESSION TERMINÉE" }),
      h("p", { class: "hub-next-title", text: "Une fin a été écrite." }),
      h("p", { class: "muted small", text: "Vous pouvez revoir la conclusion ou commencer une nouvelle session." }),
      h("a", { class: "btn btn-primary", href: `#/fin/${state.ending}` }, icon("play", { size: 16 }), h("span", { text: "Revoir la fin" })),
      h("a", { class: "btn btn-ghost", href: "#/menu" }, h("span", { text: "Menu principal" }))
    );
  } else if (state.completedDossiers.length === 5) {
    heroRight.append(
      h("p", { class: "kicker", text: "DERNIÈRE ÉTAPE" }),
      h("p", { class: "hub-next-title", text: "La dernière porte" }),
      h("p", { class: "muted small", text: "Tous les dossiers sont clos. La décision finale vous appartient." }),
      h("a", { class: "btn btn-primary", href: "#/finale", dataset: { testid: "finale-link" } }, icon("keyhole", { size: 16 }), h("span", { text: "Affronter la dernière porte" }))
    );
  } else if (currentDossier) {
    const progress = gameState.getDossierProgress(currentDossier.id);
    heroRight.append(
      h("p", { class: "kicker", text: "PROCHAINE ACTION" }),
      h("p", { class: "hub-next-title", text: `${currentDossier.code} — ${currentDossier.title}` }),
      h("p", { class: "muted small", text: progress.canComplete ? "Le dossier est prêt à être clos." : "Reprenez l’enquête là où vous l’avez laissée." }),
      h("a", { class: "btn btn-primary", href: `#/dossier/${currentDossier.id}`, dataset: { testid: "resume-dossier" } }, icon("arrowRight", { size: 16 }), h("span", { text: progress.canComplete ? "Clore le dossier" : "Reprendre l’enquête" }))
    );
  }
  hero.append(heroLeft, ring, heroRight);

  const grid = h("section", { class: "dossier-grid", attrs: { "aria-label": "Dossiers" } });
  for (const dossier of DOSSIERS) grid.append(dossierCard(context, dossier));

  const sidebar = h("aside", { class: "hub-sidebar" },
    journalPreview(gameState),
    progressPanel(gameState),
    h("div", { class: "panel hub-panel hub-tip" },
      h("p", { class: "kicker" }, icon("info", { size: 13 }), h("span", { text: "CONSEIL" })),
      h("p", { class: "small", text: getTip(gameState) }),
      h("a", { class: "text-link", href: "#/aide" }, h("span", { text: "Ouvrir l’aide" }), icon("arrowRight", { size: 13 }))
    ),
    h("div", { class: "panel hub-panel" },
      h("p", { class: "kicker", text: "RACCOURCIS" }),
      h("div", { class: "shortcut-grid" },
        h("a", { class: "shortcut", href: "#/preuves" }, icon("file", { size: 16 }), h("span", { text: "Preuves" })),
        h("a", { class: "shortcut", href: "#/journal" }, icon("book", { size: 16 }), h("span", { text: "Journal" })),
        h("a", { class: "shortcut", href: "#/tableau" }, icon("grid", { size: 16 }), h("span", { text: "Tableau" })),
        h("a", { class: "shortcut", href: "#/succes" }, icon("trophy", { size: 16 }), h("span", { text: "Succès" }))
      )
    )
  );

  const layout = h("div", { class: "hub-layout" }, h("div", { class: "hub-main" }, hero, grid), sidebar);
  const shell = renderShell(root, {
    context,
    active: "hub",
    eyebrow: "SALLE DES ARCHIVES",
    title: "Vos dossiers",
    subtitle: "Chaque dossier ouvre une version de la même nuit. Aucune ne dit toute la vérité.",
    actions: [
      { label: "Tableau d’enquête", path: "/tableau", icon: "grid" },
      { label: "Journal", path: "/journal", icon: "book" }
    ],
    content: layout
  });
  return () => shell.cleanup();
}
