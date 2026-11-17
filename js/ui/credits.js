/** Crédits et informations de licence. */

import { h } from "../dom.js";
import { VERSION } from "../version.js";
import { icon } from "./icons.js";
import { renderStaticPage } from "./page.js";

export function mountCredits(root, context) {
  const content = h("div", { class: "credits-layout" },
    h("section", { class: "panel credits-hero" },
      h("p", { class: "kicker", text: "UNE FICTION INTERACTIVE ORIGINALE" }),
      h("h2", { class: "credits-title", text: "L’ARCHIVE 1017" }),
      h("p", { class: "credits-tagline", text: "« Certaines vérités préfèrent rester enfermées. »" }),
      h("p", { class: "credits-text", text: "Un thriller psychologique sur la mémoire, la vérité et ce qui reste d’une personne quand on essaie de la conserver." })
    ),
    h("section", { class: "panel credits-section" },
      h("p", { class: "kicker", text: "CONCEPTION" }),
      h("p", { class: "credits-text", text: "Conception, écriture, développement, direction artistique et tests : projet original réalisé avec OpenCode." }),
      h("p", { class: "credits-text", text: "Le jeu, ses personnages, ses documents et son univers sont fictifs. Toute ressemblance avec des personnes ou des institutions réelles serait fortuite." })
    ),
    h("section", { class: "panel credits-section" },
      h("p", { class: "kicker", text: "TECHNOLOGIES" }),
      h("ul", { class: "credits-list" },
        h("li", {}, icon("check", { size: 14 }), h("span", { text: "HTML5, CSS3, JavaScript moderne (modules ES)." })),
        h("li", {}, icon("check", { size: 14 }), h("span", { text: "Web Audio API pour l’ambiance et les retours sonores générés localement." })),
        h("li", {}, icon("check", { size: 14 }), h("span", { text: "localStorage pour la sauvegarde versionnée et le profil." })),
        h("li", {}, icon("check", { size: 14 }), h("span", { text: "Aucune dépendance d’exécution. Aucun serveur. Aucune requête réseau." }))
      )
    ),
    h("section", { class: "panel credits-section" },
      h("p", { class: "kicker", text: "CONFIDENTIALITÉ" }),
      h("p", { class: "credits-text", text: "Aucune donnée personnelle n’est collectée, envoyée ou mesurée. La sauvegarde reste dans votre navigateur. Aucune publicité, aucun traceur, aucune télémétrie." })
    ),
    h("section", { class: "panel credits-section credits-meta" },
      h("p", { class: "kicker", text: "VERSION" }),
      h("p", { class: "credits-text", text: `${VERSION} — novembre 2026` }),
      h("p", { class: "muted small", text: "Licence MIT. Le code peut être consulté, modifié et redistribué dans le respect de la licence." })
    )
  );
  return renderStaticPage(root, context, {
    eyebrow: "CRÉDITS",
    title: "Derrière l’archive",
    subtitle: "Un projet original, sans équipe fictive et sans données inventées.",
    content,
    backPath: context.gameState.isLoaded() ? "/hub" : "/menu",
    backLabel: context.gameState.isLoaded() ? "Salle des archives" : "Menu principal"
  });
}
