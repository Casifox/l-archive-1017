/** Inventaire des preuves : recherche, filtres, lecture. */

import { h, clear } from "../dom.js";
import { debounce } from "../utils.js";
import { EVIDENCE_CATEGORIES } from "../../data/evidence.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { openEvidenceModal, renderEvidenceCard } from "./evidence.js";

export function mountInventory(root, context) {
  const { gameState } = context;
  gameState.setPlaying(true);
  const state = { search: "", dossier: 0, category: "", secretsOnly: false };
  const listHost = h("div", { class: "evidence-grid-host" });
  const countLabel = h("p", { class: "muted small" });

  const renderList = () => {
    const all = gameState.getFoundEvidence({
      dossier: state.dossier,
      category: state.category || null,
      secretsOnly: state.secretsOnly
    });
    const filtered = all.filter((item) => {
      if (!state.search) return true;
      const haystack = `${item.title} ${item.summary} ${item.category} ${item.date}`.toLowerCase();
      return haystack.includes(state.search.toLowerCase());
    });
    clear(listHost);
    countLabel.textContent = `${filtered.length} document${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""} · ${gameState.getEvidenceCount().found} / ${gameState.getEvidenceCount().total} consultés`;
    if (!filtered.length) {
      listHost.append(
        h("div", { class: "empty-state panel" },
          icon("search", { size: 28 }),
          h("h2", { text: "Aucun document ne correspond." }),
          h("p", { class: "muted", text: "Modifiez les filtres ou retournez enquêter dans les dossiers." })
        )
      );
      return;
    }
    const grid = h("div", { class: "evidence-grid" });
    for (const item of filtered) {
      grid.append(renderEvidenceCard(item, { onOpen: (entry) => openEvidenceModal(context, entry) }));
    }
    listHost.append(grid);
  };

  const searchInput = h("input", {
    class: "input",
    type: "search",
    placeholder: "Rechercher un titre, une date, un mot…",
    attrs: { "aria-label": "Rechercher dans les preuves" },
    dataset: { testid: "evidence-search" },
    on: {
      input: debounce((event) => {
        state.search = event.target.value.trim();
        renderList();
      }, 120)
    }
  });

  const dossierFilter = h("div", { class: "filter-row", attrs: { role: "group", "aria-label": "Filtrer par dossier" } });
  const dossierButtons = [];
  for (const [value, label] of [[0, "Tous"], [1, "01"], [2, "02"], [3, "03"], [4, "04"], [5, "05"]]) {
    const button = h("button", {
      class: `filter-btn${state.dossier === value ? " is-active" : ""}`,
      type: "button",
      text: label,
      attrs: { "aria-pressed": String(state.dossier === value) },
      on: {
        click: () => {
          state.dossier = value;
          for (const other of dossierButtons) {
            other.classList.remove("is-active");
            other.setAttribute("aria-pressed", "false");
          }
          button.classList.add("is-active");
          button.setAttribute("aria-pressed", "true");
          renderList();
        }
      }
    });
    dossierButtons.push(button);
    dossierFilter.append(button);
  }

  const categorySelect = h("select", {
    class: "select",
    attrs: { "aria-label": "Filtrer par catégorie" },
    on: {
      change: () => {
        state.category = categorySelect.value;
        renderList();
      }
    }
  });
  categorySelect.append(h("option", { value: "", text: "Toutes les catégories" }));
  for (const category of EVIDENCE_CATEGORIES) categorySelect.append(h("option", { value: category, text: category }));

  const secretsToggle = h("button", {
    class: "filter-btn filter-btn--secret",
    type: "button",
    attrs: { "aria-pressed": "false" },
    on: {
      click: () => {
        state.secretsOnly = !state.secretsOnly;
        secretsToggle.classList.toggle("is-active", state.secretsOnly);
        secretsToggle.setAttribute("aria-pressed", String(state.secretsOnly));
        renderList();
      }
    }
  }, icon("lock", { size: 13 }), h("span", { text: "Secrets" }));

  const filters = h("div", { class: "inventory-filters panel" },
    h("div", { class: "filter-search" }, icon("search", { size: 16 }), searchInput),
    h("div", { class: "filter-line" },
      dossierFilter,
      h("div", { class: "filter-selects" }, categorySelect, secretsToggle)
    ),
    countLabel
  );

  const content = h("div", { class: "inventory-layout" }, filters, listHost);
  const shell = renderShell(root, {
    context,
    active: "preuves",
    eyebrow: "INVENTAIRE",
    title: "Preuves et documents",
    subtitle: "Tout ce que l’archive vous a laissé lire. Les documents non consultés restent invisibles.",
    content
  });
  renderList();
  return () => shell.cleanup();
}
