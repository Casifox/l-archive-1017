/** Introduction immersive : première connexion à l’archive. */

import { h, clear } from "../dom.js";
import { INTRO_SCENE } from "../../data/story.js";
import { icon } from "./icons.js";
import { renderBrand, renderSoundButton } from "./shell.js";
import { DialoguePlayer } from "../dialogue.js";

export function mountIntro(root, context) {
  const { gameState, settings, audio, navigate } = context;
  gameState.setPlaying(true);
  audio.unlock();
  if (settings.get().sound) audio.startAmbient();

  clear(root);
  const screen = h("div", { class: "intro-screen" });
  const bg = h("div", { class: "intro-bg", attrs: { "aria-hidden": "true" } });
  const top = h("header", { class: "intro-top" });
  top.append(
    renderBrand({ href: "#/menu" }),
    h("div", { class: "intro-top-actions" },
      h("span", { class: "intro-status" }, icon("terminal", { size: 14 }), h("span", { text: "CONNEXION SÉCURISÉE" })),
      renderSoundButton(context)
    )
  );

  const main = h("main", { class: "intro-main", id: "main" });
  const narrative = h("section", { class: "intro-narrative panel panel--glow" });
  const heading = h("div", { class: "intro-heading" },
    h("p", { class: "eyebrow", text: "SESSION 47 · SUJET 1017" }),
    h("h1", { class: "intro-title", text: "Connexion" }),
    h("p", { class: "intro-subtitle", text: "« Bienvenue dans votre propre mémoire. »" })
  );
  const dialogueHost = h("div", { class: "intro-dialogue", dataset: { testid: "intro-dialogue" } });
  narrative.append(heading, dialogueHost);

  const aside = h("aside", { class: "intro-aside" });
  aside.append(
    h("div", { class: "panel intro-card" },
      h("p", { class: "kicker", text: "PROTOCOLE" }),
      h("h2", { class: "intro-card-title", text: "ARCHIVE 1017" }),
      h("p", { class: "muted small", text: "Institut de recherche sur la mémoire et la perception. Aile Est. Valmont." }),
      h("ul", { class: "intro-facts" },
        h("li", {}, icon("clock", { size: 14 }), h("span", { text: "Dernière session : 17/10/2017 — 23:03" })),
        h("li", {}, icon("archive", { size: 14 }), h("span", { text: "Cinq dossiers disponibles" })),
        h("li", {}, icon("lock", { size: 14 }), h("span", { text: "Accès : sujet identifié" }))
      )
    ),
    h("div", { class: "panel intro-card" },
      h("p", { class: "kicker", text: "COMMANDES" }),
      h("ul", { class: "intro-facts" },
        h("li", {}, icon("chevronRight", { size: 14 }), h("span", { text: "Cliquez sur « Continuer » ou appuyez sur Entrée." })),
        h("li", {}, icon("pause", { size: 14 }), h("span", { text: "Échap ouvre la pause à tout moment." })),
        h("li", {}, icon("save", { size: 14 }), h("span", { text: "La progression est sauvegardée automatiquement." }))
      )
    ),
    h("p", { class: "intro-quote", text: "« Ne me croyez pas sur parole. C’est ce que dirait une voix honnête, non ? »" })
  );

  main.append(narrative, aside);
  screen.append(bg, top, main);
  root.append(screen);

  let player = null;
  const finish = () => {
    if (!gameState.getState()?.introDone) {
      gameState.completeIntro();
      audio.play("success");
    }
    navigate("/hub");
  };

  player = new DialoguePlayer({
    container: dialogueHost,
    scene: INTRO_SCENE,
    gameState,
    audio,
    settings,
    dossier: 0,
    onComplete: finish
  });

  return () => {
    player?.destroy();
    player = null;
    clear(root);
  };
}
