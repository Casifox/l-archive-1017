/** Aide contextuelle : commandes, mécaniques, sauvegarde, accessibilité. */

import { h } from "../dom.js";
import { icon } from "./icons.js";
import { renderStaticPage } from "./page.js";

function helpSection(title, iconName, paragraphs, items = []) {
  const details = h("details", { class: "help-section panel", open: title === "Comment jouer" });
  const summary = h("summary", { class: "help-summary" },
    h("span", { class: "help-icon" }, icon(iconName, { size: 18 })),
    h("span", { class: "help-title", text: title }),
    h("span", { class: "help-chevron" }, icon("chevronDown", { size: 16 }))
  );
  const body = h("div", { class: "help-body" });
  for (const paragraph of paragraphs) body.append(h("p", { class: "help-text", text: paragraph }));
  if (items.length) {
    const list = h("ul", { class: "help-list" });
    for (const item of items) list.append(h("li", {}, icon("chevronRight", { size: 13 }), h("span", { text: item })));
    body.append(list);
  }
  details.append(summary, body);
  return details;
}

export function mountHelp(root, context) {
  const content = h("div", { class: "help-layout" },
    helpSection("Comment jouer", "play", [
      "L’ARCHIVE 1017 est une enquête narrative. Vous lisez des documents, comparez des témoignages, résolvez des énigmes et prenez des décisions. Le jeu se termine par un choix final.",
      "Chaque dossier contient des lieux à explorer, des preuves à consulter et des énigmes à résoudre. Un dossier ne peut être clos que lorsque ses énigmes sont résolues et ses preuves essentielles consultées."
    ], [
      "Cliquez sur un lieu pour ouvrir les documents qui s’y trouvent.",
      "Cliquez sur une énigme pour ouvrir son interface. Deux indices sont disponibles par énigme.",
      "Utilisez le tableau d’enquête pour associer deux preuves et vérifier une hypothèse.",
      "Le journal conserve automatiquement les événements, les décisions et les objectifs."
    ]),
    helpSection("Navigation", "map", [
      "La barre supérieure donne accès aux dossiers, aux preuves, au journal, au tableau, aux succès et aux statistiques. L’icône d’engrenage ouvre les paramètres ; l’icône de pause ou la touche Échap ouvre le menu pause."
    ], [
      "Entrée : continuer un dialogue ou valider un formulaire.",
      "Tab / Maj+Tab : naviguer entre les éléments interactifs.",
      "Échap : ouvrir la pause, ou fermer une fenêtre ouverte.",
      "Les boutons « Retour » ne suppriment jamais la progression.",
      "La sauvegarde est automatique après chaque action importante."
    ]),
    helpSection("Énigmes et indices", "key", [
      "Les réponses sont vérifiées par le jeu, jamais simulées. Une mauvaise réponse ne bloque pas définitivement : vous pouvez réessayer autant de fois que nécessaire.",
      "Les indices sont progressifs. Les utiliser n’empêche pas de terminer l’énigme ; ils empêchent seulement de débloquer le succès « Détective » pour cette énigme."
    ]),
    helpSection("Confiance, Lucidité, Empathie", "heart", [
      "Ces trois valeurs évoluent avec vos choix. Elles influencent certaines fins et certains dialogues.",
      "Ce sont des mécaniques narratives. Elles ne mesurent pas votre personnalité réelle, ne constituent pas un test psychologique et ne sont envoyées nulle part."
    ]),
    helpSection("Sauvegarde et reprise", "save", [
      "La partie est sauvegardée dans le stockage local de votre navigateur. Une copie de secours est conservée avant chaque écriture.",
      "« Continuer » reprend la session en cours. « Charger une sauvegarde » permet d’importer un fichier exporté ou de restaurer la copie de secours.",
      "L’export produit un fichier JSON lisible. L’import vérifie le format avant de remplacer quoi que ce soit. Une sauvegarde invalide est refusée."
    ]),
    helpSection("Accessibilité et confort", "eye", [
      "Les paramètres permettent d’agrandir le texte, de ralentir ou d’instantanéiser les dialogues, de réduire les animations, d’activer un mode confort et un contraste élevé.",
      "Toutes les commandes sont utilisables au clavier. Les informations ne reposent jamais uniquement sur la couleur : chaque statut possède un texte et une icône.",
      "Le jeu respecte la préférence système « réduire les animations » lorsqu’elle est active."
    ]),
    helpSection("Confidentialité", "shield", [
      "Aucune donnée ne quitte votre navigateur. Aucun compte, aucune publicité, aucun traceur, aucun appel réseau, aucune intelligence artificielle externe.",
      "Le jeu fonctionne entièrement avec des fichiers locaux. Après chargement, il ne nécessite aucune connexion Internet."
    ])
  );

  return renderStaticPage(root, context, {
    eyebrow: "AIDE",
    title: "Mode d’emploi",
    subtitle: "Tout ce qu’il faut savoir pour enquêter sans se perdre dans l’archive.",
    content,
    backPath: context.gameState.isLoaded() ? "/hub" : "/menu",
    backLabel: context.gameState.isLoaded() ? "Salle des archives" : "Menu principal"
  });
}
