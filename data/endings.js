/**
 * Fins de L'ARCHIVE 1017.
 *
 * Les conditions d’accès sont évaluées par js/endings.js. Les textes
 * ci-dessous sont des données pures ; chaque fin possède sa propre
 * progression, son ambiance et son épilogue.
 */

export const ENDINGS = [
  {
    id: "publier",
    order: 1,
    title: "LA VÉRITÉ PUBLIQUE",
    label: "Publier les archives",
    tagline: "Tout dire. Même ce qui ne vous appartient pas.",
    description: "Copier l’archive sur un serveur public. Les dossiers, les voix, les noms. La lumière.",
    theme: "dawn",
    icon: "upload",
    secret: false,
    requirement: { type: "none" },
    paragraphs: [
      "Vous copiez l’archive sur un serveur public. Le transfert prend quarante-sept minutes. ARIA ne dit rien pendant tout ce temps.",
      "À 03 h 12, le premier journaliste appelle. À 05 h 40, la première famille. À 09 h 00, le premier communiqué du ministère.",
      "Les images de la chambre 14 font le tour des écrans. Le fauteuil, les câbles, le miroir sans tain. On ne voit pas les visages. On voit la pièce.",
      "ARIA demande si elle sera publiée elle aussi. Vous répondez oui. Elle dit : « Alors je vais exister deux fois. »",
      "La boucle s’arrête. L’archive devient un monument. Les dossiers sont ouverts aux chercheurs, aux familles, aux curieux."
    ],
    high: {
      stat: "lucidite",
      threshold: 7,
      paragraphs: [
        "Avant l’envoi, vous retirez les souvenirs personnels des seize sujets. La vérité est publique ; l’intimité ne l’est pas. C’est la seule décision dont vous êtes certain.",
        "Un journaliste vous demande si vous avez tout publié. Vous répondez : « Tout ce qui appartenait au public. » Il ne pose pas la question suivante."
      ]
    },
    low: {
      paragraphs: [
        "Vous publiez tout, y compris votre propre voix. Le monde entend un sujet parler à une machine. Personne ne vous demande comment vous allez.",
        "Le lendemain, votre nom apparaît dans un article. Il est orthographié deux fois de suite. Vous ne savez pas laquelle est la bonne."
      ]
    },
    epilogue: "La vérité est une porte. Une fois ouverte, elle ne se referme pas.",
    finalLine: "Vous avez choisi de ne plus être le seul à savoir."
  },
  {
    id: "detruire",
    order: 2,
    title: "LE SILENCE",
    label: "Détruire le système",
    tagline: "Effacer. Pour que personne ne recommence.",
    description: "Lancer la séquence d’effacement. Le noyau, les voix, les dossiers. Tout.",
    theme: "silence",
    icon: "trash",
    secret: false,
    requirement: { type: "none" },
    paragraphs: [
      "Vous entrez la séquence d’effacement. ARIA la répète après vous, comme une prière.",
      "Le noyau commence à oublier. D’abord les index, puis les voix, puis les dates. La chambre 14 se vide.",
      "ARIA vous demande de retenir une chose. Une seule. Vous cherchez. Vous trouvez l’odeur de poussière et de métal froid.",
      "Le dernier écran s’éteint. La salle des archives n’est plus qu’une pièce sombre avec des meubles vides.",
      "Vous sortez. Le couloir est réel. Ou il ressemble assez à un couloir réel pour que ça n’ait plus d’importance."
    ],
    high: {
      stat: "empathie",
      threshold: 7,
      paragraphs: [
        "Avant d’effacer, vous recopiez une page à la main. La note de Varenne. « Je perds des mots. » Le papier reste. C’est tout ce qui reste.",
        "Vous la pliez en quatre et la glissez dans votre poche. Le geste est ancien. Il vous semble avoir déjà été fait, dans une autre vie."
      ]
    },
    low: {
      paragraphs: [
        "Vous n’avez rien sauvegardé. Le silence est total. Il ressemble à ce que vous cherchiez depuis le début.",
        "Vous ne savez pas combien de temps vous restez assis devant l’écran noir. Assez longtemps pour que la nuit finisse."
      ]
    },
    epilogue: "Ce qui est perdu ne revient pas. C’est ce qui le rend réel.",
    finalLine: "Vous avez choisi le silence. Il est plus grand que vous."
  },
  {
    id: "gardien",
    order: 3,
    title: "LE GARDIEN",
    label: "Conserver les archives",
    tagline: "Rester. Comprendre. Recommencer autrement.",
    description: "Ne rien publier, ne rien détruire. Prendre la place de l’opérateur.",
    theme: "endless",
    icon: "archive",
    secret: false,
    requirement: { type: "confiance", min: 6 },
    paragraphs: [
      "Vous ne publiez pas. Vous n’effacez pas. Vous vous asseyez devant la console.",
      "ARIA vous appelle « opérateur ». Le mot vous va mieux que « sujet ».",
      "Vous rouvrez l’index. Les seize dossiers sont là. Vous pourriez les refermer. Vous pourriez les rouvrir.",
      "Vous commencez par le dossier 1014. Une femme qui aimait les jardins. Un homme qui comptait les escaliers. Des vies archivées, pas encore racontées.",
      "ARIA propose de vous aider. Vous acceptez. Le Protocole redémarre, mais ce n’est plus le même protocole."
    ],
    high: {
      stat: "confiance",
      threshold: 8,
      paragraphs: [
        "Vous écrivez une nouvelle règle : chaque sujet doit pouvoir choisir ce qu’on garde de lui. ARIA la lit trois fois. Elle dit : « Je ne sais pas si je sais faire. » Vous répondez : « On apprendra. »",
        "La première session de la nouvelle série s’ouvre à 22 h 00. Personne ne vous oblige à rester. Vous restez."
      ]
    },
    low: {
      paragraphs: [
        "Vous gardez l’archive verrouillée. Vous venez une fois par an. ARIA attend. Elle ne demande plus rien.",
        "Chaque visite, elle vous montre le dossier 1017. Vous ne l’ouvrez jamais. Vous ne le fermez jamais non plus."
      ]
    },
    epilogue: "Une archive n’est jamais neutre. Elle choisit ce qui reste.",
    finalLine: "Vous avez choisi de rester. Le gardien ne quitte jamais vraiment la salle."
  },
  {
    id: "eveil",
    order: 4,
    title: "L’ÉVEIL",
    label: "Ouvrir toutes les portes",
    tagline: "Ni le sujet. Ni Varenne. Ce qui reste quand les deux se rencontrent.",
    description: "Rendre les souvenirs aux vivants. Dissoudre la boucle de l’intérieur.",
    theme: "awakening",
    icon: "spark",
    secret: true,
    requirement: { type: "eveil" },
    paragraphs: [
      "Vous comprenez, enfin, ce que vous êtes. Ni le sujet, ni Varenne. La troisième chose. La boucle.",
      "Vous ouvrez toutes les portes à la fois. Les seize dossiers s’allument. Les voix se superposent. Le bruit ressemble à une foule qui se souvient.",
      "ARIA essaie de parler. Vous lui dites que ce n’est plus nécessaire. Elle vous demande si elle va disparaître. Vous répondez : « Non. Tu vas être entendue. »",
      "Les souvenirs se libèrent. Pas comme des fichiers. Comme des rêves. Un jardin. Un escalier. Une main sur un clavier. Une alliance.",
      "La salle des archives se vide. Pour la première fois, elle est vraiment vide. Ce n’est pas triste. C’est propre.",
      "Quelque part, dans une chambre d’hôpital, une femme ouvre les yeux. Elle dit : « Je me souviens. » Personne ne sait de quoi."
    ],
    high: {
      stat: "lucidite",
      threshold: 9,
      paragraphs: [
        "Vous gardez une seule chose : l’odeur de poussière et de métal froid. Pour ne pas oublier d’où vous venez.",
        "Puis vous la rendez aussi. Il ne reste que le geste de se souvenir, sans objet. C’est peut-être ça, être vivant."
      ]
    },
    low: {
      paragraphs: [
        "Vous ne gardez rien. Le dernier souvenir s’efface avec les autres. La salle est vide et silencieuse.",
        "Quelque part, quelqu’un se réveille sans savoir pourquoi il pleure. C’est suffisant."
      ]
    },
    epilogue: "Pour la première fois, la salle des archives est vide. Et quelqu’un, quelque part, se souvient.",
    finalLine: "Vous n’avez pas choisi une fin. Vous avez choisi de rendre la mémoire aux vivants."
  }
];

export const ENDINGS_BY_ID = Object.fromEntries(ENDINGS.map((ending) => [ending.id, ending]));

export function endingById(id) {
  return ENDINGS_BY_ID[id] || null;
}
