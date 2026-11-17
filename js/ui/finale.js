/** Dernière porte : choix final, conditions de la fin secrète. */

import { h } from "../dom.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { confirmDialog } from "./modal.js";
import { showToast } from "./toast.js";

export function mountFinale(root, context) {
  const { gameState, audio, navigate } = context;
  gameState.setPlaying(true);
  const state = gameState.getState();
  const availability = gameState.getEndingAvailability();
  const visible = availability.filter((entry) => !entry.secret);
  const secret = availability.find((entry) => entry.secret);

  const choose = async (entry) => {
    if (!entry.unlocked) return;
    const ok = await confirmDialog({
      title: `Choisir : ${entry.ending.title}`,
      message: "Cette décision est définitive. Elle mettra fin à cette session et écrira l’une des fins de L’ARCHIVE 1017. Vous pourrez rejouer ensuite.",
      confirmLabel: "Écrire cette fin",
      cancelLabel: "Pas encore",
      danger: entry.id === "detruire"
    });
    if (!ok) return;
    const result = gameState.chooseEnding(entry.id);
    if (!result.ok) {
      showToast(result.error || "Cette fin n’est pas accessible.", "error", { title: "Décision" });
      return;
    }
    audio.play(entry.id === "detruire" ? "glitch" : entry.id === "eveil" ? "achievement" : "reveal");
    navigate(`/fin/${entry.id}`);
  };

  const endingCard = (entry, { featured = false } = {}) => {
    const { ending, unlocked, reasons } = entry;
    const card = h("article", {
      class: `finale-card${featured ? " finale-card--featured" : ""}${unlocked ? " is-unlocked" : " is-locked"}${ending.secret ? " is-secret" : ""}`,
      dataset: { testid: `ending-choice-${ending.id}` }
    });
    card.append(
      h("div", { class: "finale-card-head" },
        h("span", { class: "finale-icon" }, icon(unlocked ? ending.icon : "lock", { size: 26 })),
        h("div", {},
          h("p", { class: "kicker", text: ending.secret ? "FIN SECRÈTE" : `FIN ${String(ending.order).padStart(2, "0")} / 04` }),
          h("h2", { class: "finale-card-title", text: ending.secret && !unlocked ? "???" : ending.title })
        ),
        h("span", { class: `status-chip status-chip--${unlocked ? "open" : "locked"}` },
          icon(unlocked ? "check" : "lock", { size: 12 }),
          h("span", { text: unlocked ? "Accessible" : "Verrouillée" })
        )
      ),
      h("p", { class: "finale-card-tagline", text: ending.tagline }),
      h("p", { class: "finale-card-desc", text: ending.secret && !unlocked ? "Une quatrième issue existe. Elle ne s’ouvre qu’à celles et ceux qui ont réuni toutes les preuves et compris ce qui se trouve dans la boucle." : ending.description })
    );
    if (!unlocked && reasons.length) {
      const reasonList = h("ul", { class: "finale-reasons" });
      for (const reason of reasons) reasonList.append(h("li", {}, icon("lock", { size: 12 }), h("span", { text: reason })));
      card.append(reasonList);
    }
    if (ending.secret && entry.checklist) {
      const checklist = h("ul", { class: "finale-checklist" });
      for (const item of entry.checklist) {
        checklist.append(
          h("li", { class: item.done ? "is-done" : "" },
            h("span", { class: "checklist-icon" }, icon(item.done ? "check" : "minus", { size: 12 })),
            h("span", { class: "checklist-label", text: item.label }),
            h("span", { class: "checklist-detail", text: item.detail })
          )
        );
      }
      card.append(checklist);
    }
    const action = h("button", {
      class: `btn ${unlocked ? "btn-primary" : "btn-ghost"} finale-choose`,
      type: "button",
      disabled: !unlocked,
      dataset: { testid: `ending-choose-${ending.id}` },
      on: { click: () => choose(entry) }
    }, icon(unlocked ? "keyhole" : "lock", { size: 16 }), h("span", { text: unlocked ? "Choisir cette fin" : "Conditions non réunies" }));
    card.append(action);
    return card;
  };

  const hero = h("section", { class: "panel panel--glow finale-hero" },
    h("div", { class: "finale-hero-mark" }, icon("keyhole", { size: 46 })),
    h("div", { class: "finale-hero-copy" },
      h("p", { class: "kicker", text: "DOSSIER 05 · DERNIÈRE PORTE" }),
      h("h2", { class: "finale-hero-title", text: "Il n’y a pas de bonne réponse." }),
      h("p", { class: "finale-hero-text", text: "ARIA ne vous demande plus de comprendre. Elle vous demande de décider. Ce que vous avez lu, relié et accepté détermine ce que vous pouvez encore ouvrir." }),
      h("div", { class: "finale-hero-stats" },
        h("span", { class: "chip" }, icon("file", { size: 13 }), h("span", { text: `${gameState.getEvidenceCount().found} preuves` })),
        h("span", { class: "chip" }, icon("key", { size: 13 }), h("span", { text: `${gameState.getSolvedPuzzleCount().solved} énigmes` })),
        h("span", { class: "chip" }, icon("lock", { size: 13 }), h("span", { text: `${gameState.getSecretCount().found} secrets` })),
        h("span", { class: "chip" }, icon("eye", { size: 13 }), h("span", { text: `Lucidité ${state.stats.lucidite} / 10` }))
      )
    )
  );

  const visibleGrid = h("div", { class: "finale-grid" }, visible.map((entry) => endingCard(entry)));
  const secretWrap = secret ? h("div", { class: "finale-secret" },
    h("div", { class: "finale-secret-head" },
      h("p", { class: "kicker", text: "ISSUE CACHÉE" }),
      h("p", { class: "muted small", text: "La fin secrète n’apparaît qu’une fois ses conditions remplies. Elle n’est jamais accordée par hasard." })
    ),
    endingCard(secret, { featured: true })
  ) : null;

  const content = h("div", { class: "finale-layout" },
    hero,
    h("div", { class: "finale-section-head" },
      h("h2", { class: "section-title", text: "Trois portes visibles. Une quatrième." }),
      h("p", { class: "section-sub", text: "Chaque fin possède son propre texte, son ambiance et son épilogue. Vous ne pourrez en écrire qu’une par session." })
    ),
    visibleGrid,
    secretWrap,
    h("p", { class: "finale-back" },
      icon("arrowLeft", { size: 14 }),
      h("a", { href: "#/hub", text: "Retourner dans la salle des archives" }),
      h("span", { class: "muted small", text: " — vous pouvez encore consulter vos preuves avant de décider." })
    )
  );

  const shell = renderShell(root, {
    context,
    active: "hub",
    eyebrow: "LA DERNIÈRE PORTE",
    title: "Décider",
    subtitle: "Ce que vous faites de ce que vous savez.",
    back: { path: "/hub", label: "Salle des archives" },
    compactNav: true,
    content
  });
  return () => shell.cleanup();
}
