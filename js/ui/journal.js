/** Journal : événements, décisions, objectifs. */

import { h, clear } from "../dom.js";
import { DOSSIERS } from "../../data/dossiers.js";
import { formatClock } from "../utils.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";

const TYPE_ICONS = {
  system: "terminal",
  event: "info",
  evidence: "file",
  secret: "lock",
  puzzle: "key",
  deduction: "spark",
  connection: "link",
  decision: "user",
  dossier: "archive",
  ending: "keyhole",
  hint: "help"
};

const TYPE_LABELS = {
  system: "Système",
  event: "Événement",
  evidence: "Preuve",
  secret: "Secret",
  puzzle: "Énigme",
  deduction: "Déduction",
  connection: "Connexion",
  decision: "Décision",
  dossier: "Dossier",
  ending: "Fin",
  hint: "Indice"
};

export function mountJournal(root, context) {
  const { gameState } = context;
  gameState.setPlaying(true);
  let tab = "events";
  let dossierFilter = 0;
  const contentHost = h("div", { class: "journal-content" });
  const tabButtons = [];
  const tabs = [
    { id: "events", label: "Événements", icon: "list" },
    { id: "choices", label: "Décisions", icon: "user" },
    { id: "objectives", label: "Objectifs", icon: "check" }
  ];

  const render = () => {
    clear(contentHost);
    if (tab === "events") renderEvents();
    else if (tab === "choices") renderChoices();
    else renderObjectives();
  };

  const renderEvents = () => {
    const entries = gameState.getJournal({ dossier: dossierFilter });
    if (!entries.length) {
      contentHost.append(emptyState("Aucun événement enregistré.", "Les actions importantes apparaîtront ici au fil de la session."));
      return;
    }
    const timeline = h("ol", { class: "journal-timeline" });
    for (const entry of entries) {
      timeline.append(
        h("li", { class: `journal-entry journal-entry--${entry.type}` },
          h("span", { class: "journal-icon" }, icon(TYPE_ICONS[entry.type] || "info", { size: 15 })),
          h("div", { class: "journal-body" },
            h("div", { class: "journal-entry-head" },
              h("span", { class: "journal-type", text: TYPE_LABELS[entry.type] || entry.type }),
              entry.dossier ? h("span", { class: "journal-dossier", text: `Dossier ${String(entry.dossier).padStart(2, "0")}` }) : null,
              h("span", { class: "journal-time", text: `T+ ${formatClock(entry.playTime)}` })
            ),
            h("h3", { class: "journal-title", text: entry.title }),
            entry.text ? h("p", { class: "journal-text", text: entry.text }) : null
          )
        )
      );
    }
    contentHost.append(h("div", { class: "journal-list panel" }, timeline));
  };

  const renderChoices = () => {
    const choices = gameState.getChoices({ dossier: dossierFilter });
    if (!choices.length) {
      contentHost.append(emptyState("Aucune décision enregistrée.", "Vos choix narratifs seront conservés ici, avec le dossier concerné."));
      return;
    }
    const list = h("div", { class: "choices-list" });
    for (const choice of choices) {
      const dossier = choice.dossier ? gameState.getDossier(choice.dossier) : null;
      list.append(
        h("article", { class: "choice-log panel" },
          h("div", { class: "choice-log-head" },
            h("span", { class: "kicker", text: dossier ? dossier.code : "INTRODUCTION" }),
            h("span", { class: "journal-time", text: "Enregistrée" })
          ),
          h("p", { class: "choice-log-prompt", text: choice.prompt || "Décision" }),
          h("p", { class: "choice-log-answer" },
            icon("check", { size: 14 }),
            h("span", { text: choice.label })
          )
        )
      );
    }
    contentHost.append(
      h("p", { class: "muted small journal-note", text: "Les effets de ces décisions sont intégrés aux statistiques de la session. Ils ne mesurent pas votre personnalité réelle : ce sont des mécaniques narratives." }),
      list
    );
  };

  const renderObjectives = () => {
    const wrap = h("div", { class: "objectives-by-dossier" });
    for (const dossier of DOSSIERS) {
      const unlocked = gameState.isDossierUnlocked(dossier.id);
      const objectives = gameState.getObjectives(dossier.id);
      const done = objectives.filter((objective) => objective.done).length;
      const card = h("section", { class: `objective-dossier${unlocked ? "" : " is-locked"}` });
      card.append(
        h("div", { class: "objective-dossier-head" },
          h("span", { class: "dossier-code", text: dossier.code }),
          h("h3", { text: dossier.title }),
          h("span", { class: `status-chip status-chip--${!unlocked ? "locked" : done === objectives.length ? "done" : "open"}` },
            icon(!unlocked ? "lock" : done === objectives.length ? "check" : "minus", { size: 12 }),
            h("span", { text: !unlocked ? "Verrouillé" : `${done} / ${objectives.length}` })
          )
        )
      );
      if (unlocked) {
        const list = h("ul", { class: "objective-list" });
        for (const objective of objectives) {
          list.append(
            h("li", { class: `objective${objective.done ? " is-done" : ""}` },
              h("span", { class: "objective-check" }, icon(objective.done ? "check" : "minus", { size: 13 })),
              h("span", { class: "objective-label", text: objective.label })
            )
          );
        }
        card.append(list);
      } else {
        card.append(h("p", { class: "muted small", text: "Terminez le dossier précédent pour révéler ses objectifs." }));
      }
      wrap.append(card);
    }
    contentHost.append(wrap);
  };

  const emptyState = (title, text) => {
    return h("div", { class: "empty-state panel" }, icon("book", { size: 28 }), h("h2", { text: title }), h("p", { class: "muted", text }));
  };

  const tabRow = h("div", { class: "tabs", attrs: { role: "tablist", "aria-label": "Sections du journal" } });
  for (const entry of tabs) {
    const button = h("button", {
      class: `tab${tab === entry.id ? " is-active" : ""}`,
      type: "button",
      attrs: { role: "tab", "aria-selected": String(tab === entry.id) },
      dataset: { testid: `journal-tab-${entry.id}` },
      on: {
        click: () => {
          tab = entry.id;
          for (const other of tabButtons) {
            other.classList.remove("is-active");
            other.setAttribute("aria-selected", "false");
          }
          button.classList.add("is-active");
          button.setAttribute("aria-selected", "true");
          render();
        }
      }
    }, icon(entry.icon, { size: 15 }), h("span", { text: entry.label }));
    tabButtons.push(button);
    tabRow.append(button);
  }

  const dossierSelect = h("select", {
    class: "select",
    attrs: { "aria-label": "Filtrer le journal par dossier" },
    on: {
      change: () => {
        dossierFilter = Number(dossierSelect.value);
        render();
      }
    }
  });
  dossierSelect.append(h("option", { value: "0", text: "Tous les dossiers" }));
  for (const dossier of DOSSIERS) dossierSelect.append(h("option", { value: String(dossier.id), text: dossier.code }));

  const header = h("div", { class: "journal-toolbar" }, tabRow, h("div", { class: "journal-filters" }, dossierSelect));
  const content = h("div", { class: "journal-layout" }, header, contentHost);
  const shell = renderShell(root, {
    context,
    active: "journal",
    eyebrow: "JOURNAL",
    title: "Fil de la session",
    subtitle: "Les événements, les décisions et les objectifs de votre enquête. Tout est conservé automatiquement.",
    content
  });
  render();
  return () => shell.cleanup();
}
