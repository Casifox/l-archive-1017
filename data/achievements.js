/**
 * Succès — métadonnées. Les conditions sont dans js/achievements.js.
 * Un succès débloqué est conservé dans le profil local, même après une
 * nouvelle partie (sauf effacement explicite du profil).
 */

export const ACHIEVEMENTS = [
  {
    id: "premiere-connexion",
    title: "Première connexion",
    description: "Terminer l’introduction et ouvrir la salle des archives.",
    hint: "Laissez la voix finir sa phrase.",
    icon: "terminal",
    secret: false
  },
  {
    id: "observateur",
    title: "Observateur",
    description: "Découvrir toutes les preuves du dossier 01, y compris les documents secondaires.",
    hint: "La photothèque n’est pas un décor.",
    icon: "eye",
    secret: false
  },
  {
    id: "detective",
    title: "Détective",
    description: "Résoudre cinq énigmes sans utiliser aucun indice.",
    hint: "Les indices sont utiles. Ne pas les utiliser l’est aussi.",
    icon: "search",
    secret: false
  },
  {
    id: "memoire-parfaite",
    title: "Mémoire parfaite",
    description: "Terminer les cinq dossiers.",
    hint: "Chaque dossier s’ouvre après le précédent.",
    icon: "archive",
    secret: false
  },
  {
    id: "sceptique",
    title: "Sceptique",
    description: "Faire au moins quatre choix sans jamais accorder une confiance aveugle à la voix.",
    hint: "Une voix qui demande qu’on la croit n’est pas une preuve.",
    icon: "shield",
    secret: false
  },
  {
    id: "archiviste",
    title: "Archiviste",
    description: "Retrouver les trois documents secrets de l’archive.",
    hint: "Les documents secrets ne figurent pas dans l’index.",
    icon: "lock",
    secret: false
  },
  {
    id: "lucide",
    title: "Lucide",
    description: "Obtenir la fin secrète.",
    hint: "???",
    icon: "spark",
    secret: true
  },
  {
    id: "derniere-porte",
    title: "La dernière porte",
    description: "Découvrir une première fin.",
    hint: "Il faut choisir. C’est tout.",
    icon: "keyhole",
    secret: false
  },
  {
    id: "empathie",
    title: "Empathie",
    description: "Choisir trois fois de comprendre un personnage plutôt que de le juger.",
    hint: "Écouter n’est pas croire.",
    icon: "heart",
    secret: false
  },
  {
    id: "contradiction",
    title: "Trois fois non",
    description: "Identifier les trois contradictions centrales de l’affaire.",
    hint: "Elias, les silhouettes, l’opérateur.",
    icon: "alert",
    secret: false
  },
  {
    id: "voix-de-la-verite",
    title: "Voix de la vérité",
    description: "Choisir de publier les archives.",
    hint: "Une fin parmi quatre.",
    icon: "upload",
    secret: false
  },
  {
    id: "heritier",
    title: "Héritier",
    description: "Choisir de conserver les archives.",
    hint: "Une fin parmi quatre.",
    icon: "archive",
    secret: false
  },
  {
    id: "silence",
    title: "Le silence",
    description: "Choisir de détruire le système.",
    hint: "Une fin parmi quatre.",
    icon: "trash",
    secret: false
  },
  {
    id: "cartographe",
    title: "Cartographe",
    description: "Tisser les sept connexions du tableau d’enquête.",
    hint: "Deux preuves, un lien. Parfois d’un dossier à l’autre.",
    icon: "grid",
    secret: false
  }
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));
