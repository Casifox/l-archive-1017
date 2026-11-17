/** Écran de fin : récit cinématique, bilan et rejouabilité. */

import { h, clear } from "../dom.js";
import { resolveEnding } from "../endings.js";
import { formatRealDate } from "../save-schema.js";
import { VERSION_LABEL } from "../version.js";
import { icon } from "./icons.js";
import { renderBrand } from "./shell.js";
import { confirmDialog } from "./modal.js";

const THEME_SOUND = {
  publier: "reveal",
  detruire: "glitch",
  gardien: "open",
  eveil: "achievement"
};

export function mountEnding(root, context) {
  const { gameState, audio, navigate, params, refresh } = context;
  const state = gameState.getState();
  const endingId = params.endingId || state?.ending;
  if (!state || !endingId) {
    navigate("/hub");
    return () => {};
  }
  const resolved = resolveEnding(state, endingId);
  if (!resolved) {
    navigate("/finale");
    return () => {};
  }
  gameState.setPlaying(false);
  audio.stopAmbient();
  audio.play(THEME_SOUND[resolved.id] || "reveal");
  document.body.classList.add("is-ending");

  const profile = gameState.profileManager.getProfile();
  const endingCount = gameState.getEndingCount();
  const evidence = gameState.getEvidenceCount();
  const puzzles = gameState.getSolvedPuzzleCount();
  const secrets = gameState.getSecretCount();
  const connections = gameState.getConnectionCount();
  const achievements = gameState.getAchievementCount();
  const stats = gameState.getStats();

  clear(root);
  const screen = h("div", { class: `ending-screen ending-screen--${resolved.theme}` });
  const bg = h("div", { class: "ending-bg", attrs: { "aria-hidden": "true" } });
  const top = h("header", { class: "ending-top" },
    renderBrand({ href: "#/menu" }),
    h("div", { class: "ending-top-meta" },
      h("span", { class: "ending-fin-label", text: `FIN ${String(resolved.id === "eveil" ? 4 : ["publier", "detruire", "gardien", "eveil"].indexOf(resolved.id) + 1).padStart(2, "0")} / 04` }),
      h("span", { class: "menu-version", text: VERSION_LABEL })
    )
  );

  const main = h("main", { class: "ending-main", id: "main" });
  const hero = h("section", { class: "ending-hero" });
  hero.append(
    h("p", { class: "ending-kicker", text: resolved.secret ? "FIN SECRÈTE" : "ÉPILOGUE" }),
    h("h1", { class: "ending-title", text: resolved.title }),
    h("p", { class: "ending-tagline", text: resolved.tagline }),
    h("span", { class: "ending-rule" })
  );

  const story = h("article", { class: "ending-story" });
  resolved.paragraphs.forEach((paragraph, index) => {
    story.append(h("p", { class: "ending-paragraph", style: { animationDelay: `${Math.min(index * 90, 720)}ms` }, text: paragraph }));
  });
  if (resolved.variantParagraphs.length) {
    story.append(h("span", { class: "ending-divider", attrs: { "aria-hidden": "true" } }));
    resolved.variantParagraphs.forEach((paragraph, index) => {
      story.append(h("p", { class: "ending-paragraph ending-paragraph--variant", style: { animationDelay: `${Math.min((index + resolved.paragraphs.length) * 90, 900)}ms` }, text: paragraph }));
    });
  }
  story.append(
    h("blockquote", { class: "ending-epilogue" },
      h("p", { text: resolved.epilogue })
    ),
    h("p", { class: "ending-final-line", text: resolved.finalLine })
  );

  const aside = h("aside", { class: "ending-aside" });
  const bilan = h("section", { class: "panel ending-bilan" });
  bilan.append(
    h("p", { class: "kicker", text: "BILAN DE LA SESSION" }),
    h("dl", { class: "ending-stats" },
      h("div", {}, h("dt", { text: "Dossiers clos" }), h("dd", { text: `${state.completedDossiers.length} / 5` })),
      h("div", {}, h("dt", { text: "Énigmes" }), h("dd", { text: `${puzzles.solved} / ${puzzles.total}` })),
      h("div", {}, h("dt", { text: "Preuves" }), h("dd", { text: `${evidence.found} / ${evidence.total}` })),
      h("div", {}, h("dt", { text: "Secrets" }), h("dd", { text: `${secrets.found} / ${secrets.total}` })),
      h("div", {}, h("dt", { text: "Liens" }), h("dd", { text: `${connections.found} / ${connections.total}` })),
      h("div", {}, h("dt", { text: "Succès" }), h("dd", { text: `${achievements.unlocked} / ${achievements.total}` })),
      h("div", {}, h("dt", { text: "Temps" }), h("dd", { text: gameState.getPlayTimeLabel() })),
      h("div", {}, h("dt", { text: "Fins découvertes" }), h("dd", { text: `${endingCount.unlocked} / ${endingCount.total}` }))
    ),
    h("div", { class: "ending-profile" },
      h("span", { class: "precision-dot precision-dot--lucidite" }),
      h("span", { text: `Lucidité ${stats.lucidite} / 10` }),
      h("span", { class: "precision-dot precision-dot--empathie" }),
      h("span", { text: `Empathie ${stats.empathie} / 10` })
    )
  );
  if (profile.endings[resolved.id]) {
    bilan.append(h("p", { class: "muted small", text: `Fin découverte le ${formatRealDate(profile.endings[resolved.id])}.` }));
  }

  const actions = h("div", { class: "ending-actions" },
    h("button", {
      class: "btn btn-primary",
      type: "button",
      dataset: { testid: "ending-archive" },
      on: { click: () => navigate("/hub") }
    }, icon("archive", { size: 16 }), h("span", { text: "Retour à la salle des archives" })),
    h("button", {
      class: "btn btn-ghost",
      type: "button",
      dataset: { testid: "ending-replay" },
      on: { click: () => refresh() }
    }, icon("refresh", { size: 16 }), h("span", { text: "Revoir la fin" })),
    h("button", {
      class: "btn btn-ghost",
      type: "button",
      dataset: { testid: "ending-menu" },
      on: { click: () => navigate("/menu") }
    }, icon("arrowLeft", { size: 16 }), h("span", { text: "Menu principal" })),
    h("button", {
      class: "btn btn-danger",
      type: "button",
      dataset: { testid: "ending-new-game" },
      on: {
        click: async () => {
          const ok = await confirmDialog({
            title: "Nouvelle partie",
            message: "Cette fin est enregistrée dans votre profil. Commencer une nouvelle partie remplacera la sauvegarde actuelle, qui sera conservée en copie de secours.",
            confirmLabel: "Commencer",
            cancelLabel: "Rester",
            danger: true
          });
          if (!ok) return;
          gameState.createNewGame();
          navigate("/intro");
        }
      }
    }, icon("refresh", { size: 16 }), h("span", { text: "Nouvelle partie" }))
  );
  aside.append(bilan, actions);

  main.append(hero, h("div", { class: "ending-columns" }, story, aside));
  const footer = h("footer", { class: "ending-footer" },
    h("span", { text: "L’ARCHIVE 1017" }),
    h("span", { class: "menu-footer-sep", text: "·" }),
    h("span", { text: "Merci d’avoir traversé l’archive." })
  );
  screen.append(bg, top, main, footer);
  root.append(screen);
  main.setAttribute("tabindex", "-1");
  return () => {
    document.body.classList.remove("is-ending");
    clear(root);
  };
}
