/**
 * Écran d’accueil : titre, initialisation déjà jouée, reprise de session,
 * chargement, paramètres, crédits et aide.
 */

import { h, clear } from "../dom.js";
import { VERSION_LABEL } from "../version.js";
import { formatShortPlayTime, summarizeState } from "../save-schema.js";
import { endingById } from "../endings.js";
import { icon } from "./icons.js";
import { mountHero } from "./art.js";
import { renderBrand, renderSoundButton } from "./shell.js";
import { confirmDialog, openModal } from "./modal.js";
import { showToast } from "./toast.js";

function button({ label, hint = "", iconName = null, variant = "ghost", onClick, disabled = false, testid = "" }) {
  const btn = h("button", {
    class: `menu-btn menu-btn--${variant}`,
    type: "button",
    disabled,
    dataset: testid ? { testid } : {},
    on: { click: onClick }
  });
  btn.append(
    h("span", { class: "menu-btn-icon" }, icon(iconName || "chevronRight", { size: 18 })),
    h("span", { class: "menu-btn-text" },
      h("span", { class: "menu-btn-label", text: label }),
      hint ? h("span", { class: "menu-btn-hint", text: hint }) : null
    ),
    h("span", { class: "menu-btn-arrow" }, icon("arrowRight", { size: 16 }))
  );
  return btn;
}

function openLoadError(context, result) {
  const { navigate } = context;
  const message =
    result.reason === "newer-version"
      ? "Cette sauvegarde a été créée par une version plus récente du jeu. Elle n’a pas été modifiée. Utilisez la même version ou importez une sauvegarde compatible."
      : "La sauvegarde locale n’a pas pu être lue. Les données illisibles ont été conservées. Vous pouvez tenter de restaurer la copie de secours depuis l’écran de chargement.";
  openModal({
    title: "Sauvegarde indisponible",
    subtitle: "La session n’a pas été perdue.",
    content: h("p", { class: "modal-text", text: message }),
    size: "sm",
    actions: [
      { label: "Fermer", variant: "ghost" },
      {
        label: "Charger une sauvegarde",
        variant: "primary",
        closeOnClick: false,
        onClick: () => {
          navigate("/charger");
          return true;
        }
      }
    ]
  });
}

export function mountMenu(root, context) {
  const { gameState, settings, audio, navigate } = context;
  gameState.setPlaying(false);
  audio.stopAmbient();

  const loaded = gameState.saveManager.load();
  const saveExists = loaded.ok;
  const summary = loaded.ok ? summarizeState(loaded.state) : null;
  const storageOk = gameState.saveManager.available;
  const newer = loaded.reason === "newer-version";
  const recovered = Boolean(loaded.recovered);

  clear(root);
  const screen = h("div", { class: "menu-screen" });
  const bg = h("div", { class: "menu-bg", attrs: { "aria-hidden": "true" } });
  const top = h("header", { class: "menu-top" });
  top.append(
    renderBrand({ href: "#/menu" }),
    h("div", { class: "menu-top-actions" },
      h("span", { class: "menu-version", text: VERSION_LABEL }),
      renderSoundButton(context),
      h("a", { class: "icon-btn", href: "#/parametres", attrs: { "aria-label": "Paramètres", title: "Paramètres" } }, icon("gear", { size: 18 })),
      h("a", { class: "icon-btn", href: "#/aide", attrs: { "aria-label": "Aide", title: "Aide" } }, icon("help", { size: 18 }))
    )
  );

  const copy = h("section", { class: "menu-copy" });
  copy.append(
    h("p", { class: "menu-kicker" }, h("span", { class: "kicker-line" }), "UNE FICTION INTERACTIVE · DOSSIER 1017"),
    h("h1", { class: "menu-title" },
      h("span", { class: "menu-title-main", text: "L’ARCHIVE" }),
      h("span", { class: "menu-title-number", text: "1017" })
    ),
    h("p", { class: "menu-tagline", text: "« Certaines vérités préfèrent rester enfermées. »" }),
    h("p", { class: "menu-description", text: "Un centre de recherche fermé. Un système informatique oublié. Cinq dossiers qui parlent de vous avant de parler des autres. Une voix vous guide — mais elle ne dit pas tout." })
  );

  if (!storageOk) {
    copy.append(
      h("div", { class: "banner banner--warning", attrs: { role: "status" } },
        icon("warning", { size: 18 }),
        h("p", { text: "Le stockage local est indisponible. Vous pouvez jouer, mais la progression ne sera pas conservée après la fermeture de l’onglet." })
      )
    );
  } else if (newer) {
    copy.append(
      h("div", { class: "banner banner--danger", attrs: { role: "alert" } },
        icon("alert", { size: 18 }),
        h("p", { text: "Une sauvegarde plus récente existe. Elle n’a pas été modifiée. Mettez à jour le jeu ou importez une sauvegarde compatible." })
      )
    );
  } else if (recovered) {
    copy.append(
      h("div", { class: "banner banner--info", attrs: { role: "status" } },
        icon("info", { size: 18 }),
        h("p", { text: "La sauvegarde principale était illisible. La copie de secours a été restaurée." })
      )
    );
  }

  if (saveExists && summary) {
    const card = h("button", {
      class: "resume-card",
      type: "button",
      dataset: { testid: "resume-card" },
      on: {
        click: () => continueGame()
      }
    });
    card.append(
      h("span", { class: "resume-card-icon" }, icon("play", { size: 20 })),
      h("span", { class: "resume-card-body" },
        h("span", { class: "resume-card-kicker", text: summary.ending ? "SESSION TERMINÉE" : "SESSION EN COURS" }),
        h("strong", { class: "resume-card-title", text: summary.ending ? `Fin : ${endingById(summary.ending)?.title || summary.ending}` : `Dossier ${String(summary.dossier).padStart(2, "0")} — ${summary.completed} dossier${summary.completed > 1 ? "s" : ""} clos` }),
        h("span", { class: "resume-card-meta", text: `${summary.evidence} preuve${summary.evidence > 1 ? "s" : ""} · ${summary.puzzles} énigme${summary.puzzles > 1 ? "s" : ""} · ${formatShortPlayTime(summary.playTime)}` })
      ),
      h("span", { class: "resume-card-arrow" }, icon("arrowRight", { size: 18 }))
    );
    copy.append(card);
  }

  const actions = h("nav", { class: "menu-actions", attrs: { "aria-label": "Menu principal" } });
  actions.append(
    button({
      label: "NOUVELLE PARTIE",
      hint: saveExists ? "Une copie de secours de la session actuelle sera conservée." : "Commencer une nouvelle session.",
      iconName: "play",
      variant: saveExists ? "ghost" : "primary",
      onClick: () => startNewGame(saveExists),
      testid: "new-game"
    }),
    button({
      label: "CONTINUER",
      hint: saveExists ? "Reprendre la session sauvegardée." : "Aucune sauvegarde locale.",
      iconName: "arrowRight",
      variant: saveExists ? "primary" : "ghost",
      disabled: !saveExists,
      onClick: () => continueGame(),
      testid: "continue-game"
    }),
    button({
      label: "CHARGER UNE SAUVEGARDE",
      hint: "Importer un fichier, restaurer la copie de secours.",
      iconName: "upload",
      onClick: () => navigate("/charger"),
      testid: "load-game"
    })
  );
  const secondary = h("div", { class: "menu-secondary" },
    h("a", { class: "menu-link", href: "#/parametres" }, icon("gear", { size: 15 }), h("span", { text: "Paramètres" })),
    h("a", { class: "menu-link", href: "#/credits" }, icon("user", { size: 15 }), h("span", { text: "Crédits" })),
    h("a", { class: "menu-link", href: "#/aide" }, icon("help", { size: 15 }), h("span", { text: "Aide" }))
  );
  copy.append(actions, secondary);
  copy.append(
    h("p", { class: "menu-legal", text: "Aucune donnée ne quitte votre navigateur. Aucun compte. Aucune publicité." })
  );

  const visual = h("section", { class: "menu-visual" });
  const art = h("div", { class: "menu-art" });
  mountHero(art);
  const readout = h("div", { class: "menu-readout" });
  readout.append(
    h("p", { class: "readout-title" }, icon("terminal", { size: 14 }), h("span", { text: "ÉTAT DU SYSTÈME" })),
    ...[
      ["CANAL", "local"],
      ["RÉSEAU", "coupé"],
      ["SAUVEGARDE", saveExists ? "détectée" : "aucune"],
      ["SESSION", saveExists && summary ? `dossier ${String(summary.dossier).padStart(2, "0")}` : "en attente"]
    ].map(([label, value]) =>
      h("p", { class: "readout-line" },
        h("span", { text: label }),
        h("span", { class: "readout-dots", text: "·".repeat(14) }),
        h("strong", { text: value })
      )
    )
  );
  visual.append(art, readout);

  const main = h("main", { class: "menu-main", id: "main" }, copy, visual);
  const footer = h("footer", { class: "menu-footer" },
    h("span", { text: "L’ARCHIVE 1017" }),
    h("span", { class: "menu-footer-sep", text: "·" }),
    h("span", { text: "Une fiction interactive originale" }),
    h("span", { class: "menu-footer-sep", text: "·" }),
    h("span", { text: VERSION_LABEL })
  );
  screen.append(bg, top, main, footer);
  root.append(screen);
  main.setAttribute("tabindex", "-1");

  function continueGame() {
    const result = gameState.loadFromStorage();
    if (!result.ok) {
      openLoadError(context, result);
      return;
    }
    audio.unlock();
    if (settings.get().sound) audio.startAmbient();
    gameState.setPlaying(true);
    const state = gameState.getState();
    if (state.ending) navigate(`/fin/${state.ending}`);
    else if (!state.introDone) navigate("/intro");
    else navigate("/hub");
  }

  async function startNewGame(existing) {
    if (existing) {
      const ok = await confirmDialog({
        title: "Nouvelle partie",
        message: "Une sauvegarde existe. Commencer une nouvelle partie la remplacera. Une copie de secours de la session actuelle sera conservée.",
        confirmLabel: "Commencer",
        cancelLabel: "Annuler",
        danger: true
      });
      if (!ok) return;
    }
    const state = gameState.createNewGame();
    audio.unlock();
    if (settings.get().sound) audio.startAmbient();
    gameState.setPlaying(true);
    if (!gameState.saveManager.available) {
      showToast("Stockage local indisponible : la progression ne sera pas conservée.", "warning", { title: "Attention" });
    }
    navigate(state ? "/intro" : "/menu");
  }

  return () => {
    clear(root);
  };
}
