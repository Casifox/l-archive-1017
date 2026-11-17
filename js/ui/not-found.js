/** Page 404 interne (route inconnue). */

import { h } from "../dom.js";
import { icon } from "./icons.js";
import { renderStaticPage } from "./page.js";

export function mountNotFound(root, context) {
  const content = h("div", { class: "notfound panel" },
    h("p", { class: "notfound-code", text: "404" }),
    icon("keyhole", { size: 46 }),
    h("h2", { text: "Cette porte n’existe pas dans l’archive." }),
    h("p", { class: "muted", text: "Le chemin demandé ne correspond à aucun dossier, aucune preuve et aucune salle. La progression n’a pas été modifiée." }),
    h("div", { class: "button-row" },
      h("a", { class: "btn btn-primary", href: "#/menu" }, icon("arrowLeft", { size: 16 }), h("span", { text: "Menu principal" })),
      context.gameState.isLoaded() ? h("a", { class: "btn btn-ghost", href: "#/hub" }, h("span", { text: "Salle des archives" })) : null
    )
  );
  return renderStaticPage(root, context, {
    eyebrow: "ERREUR 404",
    title: "Chemin introuvable",
    subtitle: "L’archive ne contient pas cette adresse.",
    content,
    backPath: context.gameState.isLoaded() ? "/hub" : "/menu",
    backLabel: context.gameState.isLoaded() ? "Salle des archives" : "Menu principal"
  });
}
