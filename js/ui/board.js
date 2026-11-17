/** Tableau d’enquête : associer deux preuves pour vérifier une hypothèse. */

import { h, clear } from "../dom.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { showToast } from "./toast.js";

export function mountBoard(root, context) {
  const { gameState, audio } = context;
  gameState.setPlaying(true);
  let selected = [];
  let search = "";
  let dossierFilter = 0;

  const poolHost = h("div", { class: "board-pool" });
  const slotsHost = h("div", { class: "board-slots" });
  const feedback = h("p", { class: "board-feedback", attrs: { role: "status", "aria-live": "polite" } });
  const connectionsHost = h("div", { class: "board-connections" });
  const countLabel = h("p", { class: "muted small" });

  const selectedItems = () => selected.map((id) => gameState.getEvidence(id)).filter(Boolean);

  const renderSlots = () => {
    clear(slotsHost);
    const items = selectedItems();
    for (let index = 0; index < 2; index += 1) {
      const item = items[index];
      const slot = h("div", { class: `board-slot${item ? " is-filled" : ""}`, dataset: { testid: `board-slot-${index}` } });
      slot.append(
        h("span", { class: "board-slot-index", text: index === 0 ? "A" : "B" }),
        h("span", { class: "board-slot-title", text: item ? item.title : "Sélectionnez une preuve" })
      );
      if (item) {
        slot.append(
          h("button", {
            class: "icon-btn",
            type: "button",
            attrs: { "aria-label": `Retirer ${item.title}` },
            on: {
              click: () => {
                selected = selected.filter((id) => id !== item.id);
                renderAll();
              }
            }
          }, icon("x", { size: 14 }))
        );
      }
      slotsHost.append(slot);
    }
    const link = h("span", { class: "board-link-icon" }, icon("link", { size: 18 }));
    slotsHost.append(link);
    const associateButton = h("button", {
      class: "btn btn-primary board-associate",
      type: "button",
      disabled: selected.length !== 2,
      dataset: { testid: "board-associate" },
      on: { click: () => associate() }
    }, icon("link", { size: 16 }), h("span", { text: "Associer" }));
    const clearButton = h("button", {
      class: "link-btn",
      type: "button",
      text: "Vider la sélection",
      disabled: !selected.length,
      on: {
        click: () => {
          selected = [];
          renderAll();
        }
      }
    });
    slotsHost.append(associateButton, clearButton);
  };

  const associate = () => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const result = gameState.recordConnection(a, b);
    if (result.ok) {
      audio.play("reveal");
      feedback.className = "board-feedback is-success";
      feedback.textContent = `Lien établi : ${result.connection.title}.`;
      showToast(result.connection.title, "success", { title: "Connexion découverte", duration: 5000 });
      selected = [];
      renderAll();
      return;
    }
    if (result.reason === "already") {
      feedback.className = "board-feedback is-info";
      feedback.textContent = "Ce lien est déjà consigné dans le tableau.";
      audio.play("click");
      return;
    }
    if (result.reason === "no-link") {
      feedback.className = "board-feedback is-error";
      feedback.textContent = "Aucun lien documenté entre ces deux éléments. L’absence de lien est aussi une information.";
      audio.play("error");
      return;
    }
    feedback.className = "board-feedback is-error";
    feedback.textContent = "Sélectionnez deux preuves différentes.";
    audio.play("error");
  };

  const renderPool = () => {
    clear(poolHost);
    const all = gameState.getFoundEvidence({ dossier: dossierFilter });
    const filtered = all.filter((item) => {
      if (!search) return true;
      return `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(search.toLowerCase());
    });
    countLabel.textContent = `${filtered.length} preuve${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""} · ${gameState.getConnectionCount().found} / ${gameState.getConnectionCount().total} liens découverts`;
    if (!filtered.length) {
      poolHost.append(h("p", { class: "muted small", text: "Aucune preuve trouvée avec ce filtre." }));
      return;
    }
    const grid = h("div", { class: "board-evidence-grid" });
    for (const item of filtered) {
      const isSelected = selected.includes(item.id);
      const button = h("button", {
        class: `board-evidence${isSelected ? " is-selected" : ""}`,
        type: "button",
        attrs: { "aria-pressed": String(isSelected) },
        dataset: { testid: `board-evidence-${item.id}` },
        on: {
          click: () => {
            if (selected.includes(item.id)) selected = selected.filter((id) => id !== item.id);
            else {
              if (selected.length >= 2) selected.shift();
              selected.push(item.id);
            }
            renderAll();
          }
        }
      });
      button.append(
        h("span", { class: "board-evidence-category", text: item.category }),
        h("span", { class: "board-evidence-title", text: item.title }),
        h("span", { class: "board-evidence-meta", text: `Dossier ${String(item.dossier).padStart(2, "0")}` }),
        h("span", { class: "board-evidence-check" }, icon("check", { size: 13 }))
      );
      grid.append(button);
    }
    poolHost.append(grid);
  };

  const renderConnections = () => {
    clear(connectionsHost);
    const connections = gameState.getConnections();
    const progress = gameState.getConnectionCount();
    connectionsHost.append(
      h("div", { class: "panel-head" },
        h("p", { class: "kicker", text: "LIENS ÉTABLIS" }),
        h("span", { class: "hint-count", text: `${progress.found} / ${progress.total}` })
      )
    );
    if (!connections.length) {
      connectionsHost.append(
        h("div", { class: "empty-state empty-state--compact" },
          icon("link", { size: 24 }),
          h("p", { class: "muted small", text: "Aucun lien pour l’instant. Sélectionnez deux preuves qui se répondent." })
        )
      );
      return;
    }
    for (const connection of connections) {
      const a = gameState.getEvidence(connection.a);
      const b = gameState.getEvidence(connection.b);
      connectionsHost.append(
        h("article", { class: "connection-card", dataset: { testid: `board-connection-${connection.id}` } },
          h("div", { class: "connection-card-head" },
            h("span", { class: "connection-icon" }, icon("link", { size: 14 })),
            h("h3", { text: connection.title })
          ),
          h("p", { class: "connection-text", text: connection.text }),
          h("p", { class: "connection-sources", text: `${a?.title || connection.a}  ↔  ${b?.title || connection.b}` })
        )
      );
    }
  };

  const renderAll = () => {
    renderPool();
    renderSlots();
    renderConnections();
  };

  const searchInput = h("input", {
    class: "input",
    type: "search",
    placeholder: "Filtrer les preuves…",
    attrs: { "aria-label": "Filtrer les preuves du tableau" },
    on: {
      input: () => {
        search = searchInput.value.trim();
        renderPool();
      }
    }
  });
  const dossierSelect = h("select", {
    class: "select",
    attrs: { "aria-label": "Filtrer par dossier" },
    on: {
      change: () => {
        dossierFilter = Number(dossierSelect.value);
        renderPool();
      }
    }
  });
  dossierSelect.append(h("option", { value: "0", text: "Tous les dossiers" }));
  for (const id of [1, 2, 3, 4, 5]) dossierSelect.append(h("option", { value: String(id), text: `Dossier ${String(id).padStart(2, "0")}` }));

  const poolPanel = h("section", { class: "panel board-panel" },
    h("div", { class: "panel-head" },
      h("p", { class: "kicker" }, icon("grid", { size: 13 }), h("span", { text: "PREUVES DISPONIBLES" }))
    ),
    h("div", { class: "board-filters" }, searchInput, dossierSelect),
    countLabel,
    poolHost
  );
  const associationPanel = h("section", { class: "panel board-association" },
    h("div", { class: "panel-head" },
      h("p", { class: "kicker", text: "ASSOCIATION" }),
      h("span", { class: "muted small", text: "Deux preuves. Un lien." })
    ),
    slotsHost,
    feedback
  );
  const connectionsPanel = h("section", { class: "panel board-panel board-discovered" }, connectionsHost);
  const layout = h("div", { class: "board-layout" },
    h("div", { class: "board-left" }, poolPanel, associationPanel),
    connectionsPanel
  );
  const shell = renderShell(root, {
    context,
    active: "tableau",
    eyebrow: "TABLEAU D’ENQUÊTE",
    title: "Relier les preuves",
    subtitle: "Sélectionnez deux documents et vérifiez s’ils racontent la même chose. Les liens valides sont conservés dans le journal.",
    content: layout
  });
  renderAll();
  return () => shell.cleanup();
}
