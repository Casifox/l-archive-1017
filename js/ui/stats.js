/** Statistiques narratives et bilan de session. */

import { h } from "../dom.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";

const STAT_META = {
  confiance: {
    label: "Confiance",
    icon: "heartHand",
    text: "La confiance accordée à la voix, aux témoins, et à ce qu’ils disent de vous.",
    low: "Prudence",
    high: "Ouverture"
  },
  lucidite: {
    label: "Lucidité",
    icon: "eye",
    text: "La capacité à comparer les sources, repérer les contradictions et regarder la vérité en face.",
    low: "Brouillard",
    high: "Clarté"
  },
  empathie: {
    label: "Empathie",
    icon: "heart",
    text: "La manière dont vous écoutez les motivations des personnages, même quand ils mentent.",
    low: "Distance",
    high: "Écoute"
  }
};

export function mountStats(root, context) {
  const { gameState } = context;
  gameState.setPlaying(true);
  const stats = gameState.getStats();
  const progress = gameState.getGlobalProgress();
  const evidence = gameState.getEvidenceCount();
  const secrets = gameState.getSecretCount();
  const connections = gameState.getConnectionCount();
  const achievements = gameState.getAchievementCount();

  const statsGrid = h("div", { class: "stats-grid" });
  for (const [key, meta] of Object.entries(STAT_META)) {
    const value = stats[key] || 0;
    const card = h("article", { class: `stat-card panel stat-card--${key}`, dataset: { testid: `stat-${key}` } });
    card.append(
      h("div", { class: "stat-card-head" },
        h("span", { class: "stat-card-icon" }, icon(meta.icon, { size: 22 })),
        h("div", {},
          h("h2", { class: "stat-card-title", text: meta.label }),
          h("p", { class: "stat-card-tone", text: value >= 7 ? meta.high : value <= 2 ? meta.low : "Équilibre" })
        ),
        h("strong", { class: "stat-card-value", text: `${value}` }),
        h("span", { class: "stat-card-max", text: "/ 10" })
      ),
      h("div", { class: "stat-bar", attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "10", "aria-valuenow": String(value), "aria-label": meta.label } },
        h("span", { class: "stat-bar-fill", style: { width: `${value * 10}%` } })
      ),
      h("p", { class: "stat-card-text", text: meta.text })
    );
    statsGrid.append(card);
  }

  const summaryPanel = h("section", { class: "panel stats-summary" });
  summaryPanel.append(
    h("p", { class: "kicker", text: "BILAN DE SESSION" }),
    h("div", { class: "summary-grid" },
      ...[
        ["Dossiers clos", `${progress.dossiers} / 5`, "archive"],
        ["Énigmes résolues", `${progress.puzzles} / 10`, "key"],
        ["Preuves consultées", `${evidence.found} / ${evidence.total}`, "file"],
        ["Documents secrets", `${secrets.found} / ${secrets.total}`, "lock"],
        ["Liens établis", `${connections.found} / ${connections.total}`, "link"],
        ["Succès", `${achievements.unlocked} / ${achievements.total}`, "trophy"],
        ["Temps de session", gameState.getPlayTimeLabel(), "clock"]
      ].map(([label, value, iconName]) =>
        h("div", { class: "summary-cell" },
          h("span", { class: "summary-icon" }, icon(iconName, { size: 18 })),
          h("strong", { text: value }),
          h("span", { text: label })
        )
      )
    )
  );

  const choices = gameState.getChoices();
  const choicesPanel = h("section", { class: "panel stats-choices" });
  choicesPanel.append(
    h("div", { class: "panel-head" },
      h("p", { class: "kicker", text: "DÉCISIONS" }),
      h("a", { class: "text-link", href: "#/journal" }, h("span", { text: "Journal complet" }), icon("arrowRight", { size: 13 }))
    )
  );
  if (!choices.length) {
    choicesPanel.append(h("p", { class: "muted small", text: "Aucune décision enregistrée pour l’instant." }));
  } else {
    const list = h("ul", { class: "choice-summary-list" });
    for (const choice of choices) {
      const dossier = choice.dossier ? gameState.getDossier(choice.dossier) : null;
      list.append(
        h("li", { class: "choice-summary" },
          h("span", { class: "choice-summary-dossier", text: dossier ? dossier.code : "INTRO" }),
          h("span", { class: "choice-summary-label", text: choice.label })
        )
      );
    }
    choicesPanel.append(list);
  }

  const disclaimer = h("div", { class: "disclaimer panel" },
    icon("info", { size: 18 }),
    h("p", { text: "Confiance, Lucidité et Empathie sont des mécaniques narratives. Elles décrivent la façon dont cette fiction a été traversée, pas votre personnalité réelle. Aucune donnée n’est mesurée, comparée ou transmise." })
  );

  const content = h("div", { class: "stats-layout" }, statsGrid, disclaimer, summaryPanel, choicesPanel);
  const shell = renderShell(root, {
    context,
    active: "statistiques",
    eyebrow: "STATISTIQUES",
    title: "Le profil de la session",
    subtitle: "Trois valeurs qui évoluent avec vos choix. Elles ne mesurent que cette histoire.",
    content
  });
  return () => shell.cleanup();
}
