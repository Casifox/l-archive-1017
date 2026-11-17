/**
 * Coquille des écrans de jeu : en-tête, navigation, indicateur de
 * sauvegarde, statistiques, menu pause et raccourci Échap.
 */

import { h, append, clear } from "../dom.js";
import { icon } from "./icons.js";
import { showToast } from "./toast.js";
import { confirmDialog, openModal, hasOpenModal } from "./modal.js";

export const NAV_ITEMS = [
  { id: "hub", label: "Dossiers", path: "/hub", icon: "archive" },
  { id: "preuves", label: "Preuves", path: "/preuves", icon: "file" },
  { id: "journal", label: "Journal", path: "/journal", icon: "book" },
  { id: "tableau", label: "Tableau", path: "/tableau", icon: "grid" },
  { id: "succes", label: "Succès", path: "/succes", icon: "trophy" },
  { id: "statistiques", label: "Stats", path: "/statistiques", icon: "stats" }
];

export function renderBrand({ compact = false, href = "#/hub" } = {}) {
  return h("a", { class: `brand${compact ? " brand--compact" : ""}`, href, attrs: { "aria-label": "L’ARCHIVE 1017 — Accueil" } },
    h("span", { class: "brand-mark" }, icon("keyhole", { size: compact ? 20 : 24 })),
    h("span", { class: "brand-text" },
      h("span", { class: "brand-title", text: "L’ARCHIVE 1017" }),
      compact ? null : h("span", { class: "brand-sub", text: "SYSTÈME DE CONSERVATION MNÉSIQUE" })
    )
  );
}

function statChip(key, label, value, iconName) {
  return h("span", {
    class: `stat-chip stat-chip--${key}`,
    attrs: { title: `${label} : ${value} / 10`, "aria-label": `${label} : ${value} sur 10` }
  },
    icon(iconName, { size: 14 }),
    h("span", { class: "stat-chip-value", text: String(value) })
  );
}

export function renderStatChips(gameState) {
  const stats = gameState.getStats();
  return h("div", { class: "stat-chips" },
    statChip("confiance", "Confiance", stats.confiance, "heartHand"),
    statChip("lucidite", "Lucidité", stats.lucidite, "eye"),
    statChip("empathie", "Empathie", stats.empathie, "heart")
  );
}

export function renderSoundButton(context) {
  const { settings, audio } = context;
  const enabled = settings.get().sound;
  const button = h("button", {
    class: "icon-btn",
    type: "button",
    attrs: {
      "aria-label": enabled ? "Couper le son" : "Activer le son",
      "aria-pressed": String(enabled),
      title: enabled ? "Couper le son" : "Activer le son"
    },
    dataset: { testid: "sound-toggle" },
    on: {
      click: () => {
        const next = !settings.get().sound;
        settings.update({ sound: next });
        audio.setEnabled(next);
        if (next) audio.play("click");
        const replacement = renderSoundButton(context);
        button.replaceWith(replacement);
      }
    }
  }, icon(enabled ? "soundOn" : "soundOff", { size: 18 }));
  return button;
}

export function openPauseModal(context) {
  if (hasOpenModal()) return;
  const { gameState, navigate } = context;
  const state = gameState.getState();
  const stats = gameState.getStats();
  const progress = gameState.getGlobalProgress();
  const content = h("div", { class: "pause-content" });
  content.append(
    h("div", { class: "pause-grid" },
      h("div", { class: "pause-cell" }, h("span", { class: "kicker", text: "SESSION" }), h("strong", { text: `Dossier ${String(state.currentDossier).padStart(2, "0")}` })),
      h("div", { class: "pause-cell" }, h("span", { class: "kicker", text: "TEMPS" }), h("strong", { text: gameState.getPlayTimeLabel() })),
      h("div", { class: "pause-cell" }, h("span", { class: "kicker", text: "DOSSIERS" }), h("strong", { text: `${progress.dossiers} / 5` })),
      h("div", { class: "pause-cell" }, h("span", { class: "kicker", text: "SUCCÈS" }), h("strong", { text: `${progress.achievements} / ${gameState.getAchievementCount().total}` }))
    ),
    h("div", { class: "pause-stats" },
      ["confiance", "lucidite", "empathie"].map((key) =>
        h("div", { class: "pause-stat" },
          h("span", { class: `precision-dot precision-dot--${key}` }),
          h("span", { class: "pause-stat-label", text: { confiance: "Confiance", lucidite: "Lucidité", empathie: "Empathie" }[key] }),
          h("span", { class: "pause-stat-value", text: `${stats[key]} / 10` })
        )
      )
    ),
    h("p", { class: "muted small", text: "La progression est sauvegardée automatiquement après chaque action importante." })
  );

  const modal = openModal({
    title: "Pause",
    subtitle: "L’archive continue de tourner, même quand vous ne la regardez pas.",
    content,
    size: "md",
    testid: "pause-modal",
    actions: [
      { label: "Reprendre", variant: "primary", testid: "pause-resume" },
      {
        label: "Paramètres",
        variant: "ghost",
        closeOnClick: false,
        onClick: () => {
          modal.close();
          navigate("/parametres");
          return false;
        }
      },
      {
        label: "Aide",
        variant: "ghost",
        closeOnClick: false,
        onClick: () => {
          modal.close();
          navigate("/aide");
          return false;
        }
      },
      {
        label: "Menu principal",
        variant: "danger",
        closeOnClick: false,
        onClick: async () => {
          const ok = await confirmDialog({
            title: "Retour au menu",
            message: "La progression est sauvegardée. Vous pourrez reprendre avec « Continuer ».",
            confirmLabel: "Retourner au menu",
            cancelLabel: "Rester"
          });
          if (ok) {
            gameState.saveNow();
            gameState.setPlaying(false);
            modal.close();
            navigate("/menu");
          }
          return false;
        }
      }
    ]
  });
  return modal;
}

/**
 * Monte la coquille et renvoie { main, header, cleanup }.
 */
export function renderShell(root, options) {
  const {
    context,
    active = "",
    eyebrow = "",
    title = "",
    subtitle = "",
    back = null,
    actions = [],
    content = null,
    wide = false
  } = options;
  const { gameState, settings, audio, navigate } = context;

  const shell = h("div", { class: "app-shell" });
  const header = h("header", { class: "topbar" });
  const brand = renderBrand({ href: "#/hub" });

  const nav = h("nav", { class: "topbar-nav", attrs: { "aria-label": "Navigation principale" } });
  for (const item of NAV_ITEMS) {
    nav.append(
      h("a", {
        class: `nav-link${active === item.id ? " is-active" : ""}`,
        href: `#${item.path}`,
        attrs: active === item.id ? { "aria-current": "page" } : {},
        on: { click: () => header.classList.remove("nav-open") }
      }, icon(item.icon, { size: 16 }), h("span", { text: item.label }))
    );
  }

  const saveStatus = h("span", { class: "save-status", dataset: { testid: "save-status" } },
    h("span", { class: "save-dot" }),
    h("span", { class: "save-text", text: gameState.saveManager.available ? "Sauvegarde auto" : "Session seulement" })
  );

  const statChipsHost = h("div", { class: "stat-chips-host" });
  statChipsHost.append(renderStatChips(gameState));

  const utilities = h("div", { class: "topbar-utilities" },
    statChipsHost,
    saveStatus,
    renderSoundButton(context),
    h("a", { class: "icon-btn", href: "#/aide", attrs: { "aria-label": "Aide", title: "Aide" } }, icon("help", { size: 18 })),
    h("a", { class: "icon-btn", href: "#/parametres", attrs: { "aria-label": "Paramètres", title: "Paramètres" } }, icon("gear", { size: 18 })),
    h("button", {
      class: "icon-btn",
      type: "button",
      attrs: { "aria-label": "Pause", title: "Pause (Échap)" },
      dataset: { testid: "pause-button" },
      on: { click: () => openPauseModal(context) }
    }, icon("pause", { size: 18 })),
    h("button", {
      class: "icon-btn nav-toggle",
      type: "button",
      attrs: { "aria-label": "Ouvrir le menu", "aria-expanded": "false" },
      on: {
        click: () => {
          const open = header.classList.toggle("nav-open");
          header.querySelector(".nav-toggle")?.setAttribute("aria-expanded", String(open));
        }
      }
    }, icon("menu", { size: 18 }))
  );

  header.append(brand, nav, utilities);
  shell.append(header);

  const main = h("main", { class: "main-content", id: "main" });
  const pageHead = h("div", { class: `page-head${wide ? " page-head--wide" : ""}` });
  if (back) {
    pageHead.append(
      h("a", { class: "back-link", href: `#${back.path}` }, icon("arrowLeft", { size: 15 }), h("span", { text: back.label }))
    );
  }
  if (eyebrow) pageHead.append(h("p", { class: "eyebrow", text: eyebrow }));
  if (title) pageHead.append(h("h1", { class: "page-title", text: title }));
  if (subtitle) pageHead.append(h("p", { class: "page-subtitle", text: subtitle }));
  if (actions.length) {
    const actionRow = h("div", { class: "page-actions" });
    for (const action of actions) {
      if (action instanceof Node) actionRow.append(action);
      else if (action?.node) actionRow.append(action.node);
      else if (action?.label) {
        actionRow.append(
          h("a", {
            class: `btn ${action.variant === "primary" ? "btn-primary" : "btn-ghost"}`,
            href: `#${action.path}`
          }, action.icon ? icon(action.icon, { size: 16 }) : null, h("span", { text: action.label }))
        );
      }
    }
    pageHead.append(actionRow);
  }
  main.append(pageHead);
  const body = h("div", { class: `page-body${wide ? " page-body--wide" : ""}` });
  append(body, content);
  main.append(body);
  shell.append(main);
  root.replaceChildren(shell);

  const cleanupFns = [];
  cleanupFns.push(
    gameState.on("saved", () => {
      saveStatus.classList.remove("is-error");
      saveStatus.querySelector(".save-text").textContent = "Sauvegardé";
    })
  );
  cleanupFns.push(
    gameState.on("save-error", (message) => {
      saveStatus.classList.add("is-error");
      saveStatus.querySelector(".save-text").textContent = "Sauvegarde impossible";
      showToast(message, "error", { title: "Sauvegarde" });
    })
  );
  cleanupFns.push(
    gameState.on("state-change", () => {
      clear(statChipsHost);
      statChipsHost.append(renderStatChips(gameState));
    })
  );

  const keyHandler = (event) => {
    if (event.key !== "Escape") return;
    if (hasOpenModal()) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    openPauseModal(context);
  };
  document.addEventListener("keydown", keyHandler);
  cleanupFns.push(() => document.removeEventListener("keydown", keyHandler));

  return {
    main,
    header,
    shell,
    body,
    cleanup: () => {
      for (const cleanup of cleanupFns) {
        try {
          cleanup();
        } catch {
          // Nettoyage best-effort.
        }
      }
      clear(root);
    }
  };
}
