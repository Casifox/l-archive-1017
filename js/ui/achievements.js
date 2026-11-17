/** Succès et fins découvertes, conservés dans le profil local. */

import { h, clear } from "../dom.js";
import { ENDINGS } from "../../data/endings.js";
import { formatRealDate } from "../save-schema.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";

export function mountAchievements(root, context) {
  const { gameState } = context;
  gameState.setPlaying(true);
  let filter = "all";
  const gridHost = h("div", { class: "achievements-host" });
  const filterButtons = [];

  const render = () => {
    const all = gameState.getAchievementView();
    const filtered = all.filter((achievement) => {
      if (filter === "unlocked") return achievement.unlocked;
      if (filter === "locked") return !achievement.unlocked;
      return true;
    });
    clear(gridHost);
    if (!filtered.length) {
      gridHost.append(h("div", { class: "empty-state panel" }, icon("trophy", { size: 28 }), h("h2", { text: "Aucun succès dans cette catégorie." }), h("p", { class: "muted", text: "Continuez l’enquête." })));
      return;
    }
    const grid = h("div", { class: "achievement-grid" });
    for (const achievement of all.filter((entry) => filtered.includes(entry))) {
      const hidden = achievement.secret && !achievement.unlocked;
      const card = h("article", { class: `achievement-card${achievement.unlocked ? " is-unlocked" : ""}${hidden ? " is-secret" : ""}`, dataset: { testid: `achievement-${achievement.id}` } });
      card.append(
        h("div", { class: "achievement-icon" }, icon(hidden ? "lock" : achievement.icon, { size: 24 })),
        h("div", { class: "achievement-body" },
          h("div", { class: "achievement-head" },
            h("h2", { class: "achievement-title", text: hidden ? "???" : achievement.title }),
            h("span", { class: `status-chip status-chip--${achievement.unlocked ? "done" : "locked"}` },
              icon(achievement.unlocked ? "check" : "lock", { size: 12 }),
              h("span", { text: achievement.unlocked ? "Débloqué" : "Verrouillé" })
            )
          ),
          h("p", { class: "achievement-desc", text: hidden ? "Succès secret. Il ne se révèle qu’une fois obtenu." : achievement.description }),
          !achievement.unlocked && !hidden ? h("p", { class: "achievement-hint" }, icon("info", { size: 13 }), h("span", { text: achievement.hint })) : null,
          achievement.unlocked ? h("p", { class: "achievement-date", text: `Débloqué le ${formatRealDate(achievement.unlockedAt)}` }) : null
        )
      );
      grid.append(card);
    }
    gridHost.append(grid);
  };

  const filterRow = h("div", { class: "filter-row", attrs: { role: "group", "aria-label": "Filtrer les succès" } });
  for (const [value, label] of [["all", "Tous"], ["unlocked", "Débloqués"], ["locked", "Verrouillés"]]) {
    const button = h("button", {
      class: `filter-btn${filter === value ? " is-active" : ""}`,
      type: "button",
      text: label,
      attrs: { "aria-pressed": String(filter === value) },
      on: {
        click: () => {
          filter = value;
          for (const other of filterButtons) {
            other.classList.remove("is-active");
            other.setAttribute("aria-pressed", "false");
          }
          button.classList.add("is-active");
          button.setAttribute("aria-pressed", "true");
          render();
        }
      }
    });
    filterButtons.push(button);
    filterRow.append(button);
  }

  const profile = gameState.profileManager.getProfile();
  const endingsPanel = h("section", { class: "panel endings-panel" });
  endingsPanel.append(
    h("div", { class: "panel-head" },
      h("p", { class: "kicker", text: "FINS DÉCOUVERTES" }),
      h("span", { class: "hint-count", text: `${gameState.getEndingCount().unlocked} / ${ENDINGS.length}` })
    )
  );
  const endingGrid = h("div", { class: "ending-slot-grid" });
  for (const ending of ENDINGS) {
    const unlocked = Boolean(profile.endings[ending.id]);
    const hidden = ending.secret && !unlocked;
    endingGrid.append(
      h("div", { class: `ending-slot${unlocked ? " is-unlocked" : ""}${hidden ? " is-secret" : ""}` },
        icon(unlocked ? "check" : hidden ? "lock" : "keyhole", { size: 18 }),
        h("span", { class: "ending-slot-title", text: hidden ? "???" : ending.title }),
        h("span", { class: "ending-slot-state", text: unlocked ? "Découverte" : hidden ? "Secrète" : "Non découverte" })
      )
    );
  }
  endingsPanel.append(endingGrid, h("p", { class: "muted small", text: "Les succès et les fins découvertes sont conservés dans ce navigateur, même après une nouvelle partie." }));

  const count = gameState.getAchievementCount();
  const content = h("div", { class: "achievements-layout" },
    h("div", { class: "achievements-toolbar" },
      h("p", { class: "muted small", text: `${count.unlocked} succès sur ${count.total}. Les succès verrouillés affichent un indice.` }),
      filterRow
    ),
    gridHost,
    endingsPanel
  );
  const shell = renderShell(root, {
    context,
    active: "succes",
    eyebrow: "SUCCÈS",
    title: "Ce que l’archive a retenu",
    subtitle: "Des objectifs facultatifs, débloqués par vos actions réelles. Aucun succès n’est simulé.",
    content
  });
  render();
  return () => shell.cleanup();
}
