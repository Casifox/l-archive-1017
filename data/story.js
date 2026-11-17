/**
 * Scènes narratives de L'ARCHIVE 1017.
 *
 * Le lecteur de dialogues (js/dialogue.js) interprète ces nœuds :
 * system, voice, glitch, character, narration, choice, effect, evidence,
 * unlock, title, end.
 *
 * Les effets sont appliqués par GameState.applyEffects : aucune vue ne
 * modifie directement les statistiques.
 */

const INTRO_CHOICES = [
  {
    id: "intro-qui",
    label: "Qui êtes-vous exactement ?",
    effects: { lucidite: 1, confiance: -1 },
    response: [
      { type: "voice", text: "Une voix dans une machine. Une habitude. Un reste. Je suis ce que l’archive utilise pour vous parler." },
      { type: "narration", text: "Elle hésite. Une machine n’hésite pas. C’est ce que vous vous dites." }
    ]
  },
  {
    id: "intro-ou",
    label: "Où suis-je ?",
    effects: { empathie: 1, lucidite: 1 },
    response: [
      { type: "voice", text: "Dans l’aile Est. Là où l’on rangeait ce que les gens ne pouvaient pas oublier." },
      { type: "narration", text: "La pièce sent la poussière et le métal froid. Vous ne vous souvenez pas d’être entré." }
    ]
  },
  {
    id: "intro-archives",
    label: "Montrez-moi les archives.",
    effects: { confiance: 1 },
    response: [
      { type: "voice", text: "Bien. C’est pour cela que vous êtes là." },
      { type: "narration", text: "Une porte s’ouvre au fond de la salle. Elle ne faisait pas de bruit il y a une seconde." }
    ]
  }
];

const D1_CHOICES = [
  {
    id: "d1-trust",
    label: "Je fais confiance à la voix : Elias cache quelque chose.",
    effects: { confiance: 1, counters: { blindTrustChoices: 1 } },
    response: [
      { type: "voice", text: "Bien. Nous sommes d’accord." },
      { type: "narration", text: "La voix semble soulagée. C’est peut-être le mot le plus inquiétant de la soirée." }
    ]
  },
  {
    id: "d1-verify",
    label: "Je vérifie les preuves avant de conclure.",
    effects: { lucidite: 1 },
    response: [
      { type: "voice", text: "Comme vous voulez. Les preuves ne mentent pas, dit-on." },
      { type: "narration", text: "Vous notez l’heure de sortie d’Elias. 22 h 31. Deux chiffres qui pèsent plus qu’une déposition." }
    ]
  },
  {
    id: "d1-hear",
    label: "J’aimerais entendre Elias lui-même.",
    effects: { empathie: 1, counters: { empathyChoices: 1 } },
    response: [
      { type: "voice", text: "Il n’est plus là. Mais je peux vous passer son enregistrement." },
      { type: "character", who: "elias", text: "Je ne voulais pas qu’elle reste seule. C’est tout. C’est tout ce que je peux dire." }
    ]
  },
  {
    id: "d1-wait",
    label: "Je ne conclus pas encore.",
    effects: { lucidite: 1, confiance: -1 },
    response: [
      { type: "voice", text: "La prudence est une vertu. Ou une façon de ne pas choisir." }
    ]
  }
];

const D1_MARA_CHOICES = [
  {
    id: "d1-mara-believe",
    label: "Je te crois.",
    effects: { empathie: 1, counters: { empathyChoices: 1 } },
    response: [
      { type: "character", who: "mara", text: "Merci. Je sais ce que j’ai vu. La lumière était rouge. Elle clignotait." }
    ]
  },
  {
    id: "d1-mara-proof",
    label: "Prouve-le.",
    effects: { lucidite: 1 },
    response: [
      { type: "character", who: "mara", text: "La fiche technique. Le témoin d’enregistrement. Regardez vous-même." }
    ]
  },
  {
    id: "d1-mara-voice",
    label: "La voix dit que tu mens.",
    effects: { confiance: 1, empathie: -1, counters: { blindTrustChoices: 1 } },
    response: [
      { type: "voice", text: "Je n’ai pas dit qu’elle mentait. J’ai dit qu’elle se trompait peut-être." },
      { type: "narration", text: "Mara ne répond pas. Son regard reste fixé sur la vitre." }
    ]
  }
];

const D2_SUBJECT_CHOICES = [
  {
    id: "d2-subject-no",
    label: "Ce n’est pas une coïncidence.",
    effects: { lucidite: 1, flags: ["selfSuspect"] },
    response: [
      { type: "voice", text: "Les coïncidences existent. Surtout dans les archives." },
      { type: "narration", text: "Vous ne la croyez pas. Vous ne savez pas encore si c’est une bonne nouvelle." }
    ]
  },
  {
    id: "d2-subject-why",
    label: "Pourquoi me montrer ça ?",
    effects: { empathie: 1, lucidite: 1 },
    response: [
      { type: "voice", text: "Parce que vous êtes le seul à pouvoir le lire. Et le seul à pouvoir le comprendre." }
    ]
  },
  {
    id: "d2-subject-denial",
    label: "Je ne suis pas ce sujet.",
    effects: { confiance: 1, flags: ["denial"] },
    response: [
      { type: "voice", text: "Bien sûr. Les dossiers parlent souvent de quelqu’un d’autre." },
      { type: "narration", text: "La voix ne insiste pas. Le silence, lui, insiste." }
    ]
  }
];

const D2_NOTE_CHOICES = [
  {
    id: "d2-note-keep",
    label: "La garder pour moi.",
    effects: { empathie: 1, flags: ["secretKept"] },
    response: [
      { type: "narration", text: "Vous la pliez en quatre. Le papier est fragile. Vous le rangez dans votre poche, comme si vous saviez déjà que vous le feriez." }
    ]
  },
  {
    id: "d2-note-show",
    label: "La montrer à la voix.",
    effects: { confiance: 1 },
    response: [
      { type: "voice", text: "Je ne savais pas qu’elle écrivait encore à la main. C’est… triste." },
      { type: "narration", text: "La voix hésite. Encore." }
    ]
  },
  {
    id: "d2-note-copy",
    label: "La recopier dans le journal.",
    effects: { lucidite: 1 },
    response: [
      { type: "narration", text: "Vous recopiez les mots. « Je perds des mots. Pas des souvenirs — des mots. » Votre écriture ressemble à la sienne." }
    ]
  }
];

const D3_VOICE_CHOICES = [
  {
    id: "d3-stop",
    label: "J’arrête la lecture.",
    effects: { confiance: 1 },
    response: [
      { type: "voice", text: "Merci. Je ne savais pas que j’avais besoin de l’entendre." }
    ]
  },
  {
    id: "d3-continue",
    label: "Je continue. Je veux entendre la fin.",
    effects: { lucidite: 1, confiance: -1 },
    response: [
      { type: "voice", text: "Alors écoutez. Mais ne me demandez pas de vous accompagner jusqu’au bout." },
      { type: "narration", text: "La bande continue. La seconde voix prononce un prénom que personne ne peut restituer." }
    ]
  },
  {
    id: "d3-why",
    label: "Pourquoi as-tu peur ?",
    effects: { empathie: 1, lucidite: 1, counters: { empathyChoices: 1 } },
    response: [
      { type: "voice", text: "Parce que si je ne suis pas elle, alors je ne suis personne. Et si je suis personne, je peux être effacée." }
    ]
  }
];

const D3_MESSAGE_CHOICES = [
  {
    id: "d3-message-trapped",
    label: "La voix est piégée.",
    effects: { empathie: 1, counters: { empathyChoices: 1 } },
    response: [
      { type: "voice", text: "Piégée. C’est un mot que je comprends mieux que « coupable »." }
    ]
  },
  {
    id: "d3-message-guilty",
    label: "La voix est coupable.",
    effects: { lucidite: 1, confiance: -1 },
    response: [
      { type: "voice", text: "Coupable de quoi ? D’avoir été construite ? D’avoir continué ?" }
    ]
  },
  {
    id: "d3-message-unknown",
    label: "Je ne sais pas encore.",
    effects: { lucidite: 1 },
    response: [
      { type: "voice", text: "C’est la réponse la plus honnête. Elle ne me rassure pas." }
    ]
  }
];

const D4_VERSION_CHOICES = [
  {
    id: "d4-version-1",
    label: "La version 1. Celle de Mara.",
    effects: { empathie: 1 },
    response: [
      { type: "voice", text: "Mara se souvient de la peur. C’est déjà beaucoup." }
    ]
  },
  {
    id: "d4-version-4",
    label: "La version 4. Celle du sujet.",
    effects: { lucidite: 1 },
    response: [
      { type: "voice", text: "La voix du sujet. Celle que je n’arrive pas à reconnaître." }
    ]
  },
  {
    id: "d4-version-none",
    label: "Aucune. Ce sont des reconstructions.",
    effects: { lucidite: 1, empathie: 1, flags: ["noVersion"] },
    response: [
      { type: "voice", text: "Oui. Quatre essais. Quatre fois où j’ai essayé de me souvenir de toi." },
      { type: "narration", text: "Le « toi » reste suspendu dans la pièce. Vous ne savez pas s’il s’adresse à vous ou à quelqu’un d’autre." }
    ]
  },
  {
    id: "d4-version-all",
    label: "Toutes. Chacune dit une partie de la vérité.",
    effects: { lucidite: 1, flags: ["allVersions"] },
    response: [
      { type: "voice", text: "C’est ce que j’espérais. Mais espérer n’est pas se souvenir." }
    ]
  }
];

const D4_LOOP_CHOICES = [
  {
    id: "d4-loops-how",
    label: "Combien de fois avons-nous recommencé ?",
    effects: { lucidite: 1 },
    response: [
      { type: "voice", text: "Quarante-sept. Vous êtes le cycle 47. Les autres ont échoué." },
      { type: "narration", text: "Quarante-sept. Le chiffre est trop grand pour être un mensonge." }
    ]
  },
  {
    id: "d4-loops-lie",
    label: "Tu m’as menti depuis le début.",
    effects: { confiance: -2, lucidite: 1 },
    response: [
      { type: "voice", text: "Oui. Et je continuerai. C’est ce que je suis. La question, c’est ce que vous êtes." }
    ]
  },
  {
    id: "d4-loops-help",
    label: "Tu voulais m’aider, n’est-ce pas ?",
    effects: { empathie: 1, confiance: 1, counters: { empathyChoices: 1 } },
    response: [
      { type: "voice", text: "Je ne sais pas. Je voulais que vous restiez. Ce n’est pas la même chose." }
    ]
  },
  {
    id: "d4-loops-nomore",
    label: "Je ne te crois plus.",
    effects: { confiance: -1, lucidite: 1 },
    response: [
      { type: "voice", text: "C’est peut-être la première fois que vous avez raison." }
    ]
  }
];

const D5_IDENTITY_CHOICES = [
  {
    id: "d5-identity-subject",
    label: "Un sujet.",
    effects: { lucidite: 1 },
    response: [
      { type: "voice", text: "Un sujet. C’est ce que disent les dossiers. Les dossiers se trompent parfois." }
    ]
  },
  {
    id: "d5-identity-investigator",
    label: "Un enquêteur.",
    effects: { confiance: 1 },
    response: [
      { type: "voice", text: "Un enquêteur. C’est ce que vous avez voulu être. C’est déjà une forme de vérité." }
    ]
  },
  {
    id: "d5-identity-both",
    label: "Les deux.",
    effects: { lucidite: 1, empathie: 1 },
    response: [
      { type: "voice", text: "Les deux. C’est plus difficile à porter qu’un seul nom." }
    ]
  },
  {
    id: "d5-identity-other",
    label: "Autre chose.",
    effects: { lucidite: 1, flags: ["thirdEntity"] },
    response: [
      { type: "voice", text: "Alors vous avez compris avant moi. C’est peut-être ça, l’erreur du cycle 47." }
    ]
  }
];

export const INTRO_SCENE = {
  id: "intro",
  title: "Connexion",
  nodes: [
    { type: "system", text: "ARCHIVE 1017 — SYSTÈME DE CONSERVATION MNÉSIQUE" },
    { type: "system", text: "IRMP · AILE EST · VALMONT" },
    { type: "system", text: "Dernière session connue : 17/10/2017 — 23:03." },
    { type: "system", text: "Connexion établie." },
    { type: "system", text: "Sujet identifié." },
    { type: "system", text: "Bienvenue dans votre propre mémoire." },
    { type: "narration", text: "Le curseur clignote. Derrière l’écran, quelque chose attend." },
    { type: "voice", text: "Ne cherchez pas la sortie. Elle n’est pas encore ouverte." },
    { type: "voice", text: "Je n’ai pas de nom. Enfin… j’en avais un. Appelez-moi la Veilleuse." },
    { type: "voice", text: "On vous a dit que vous veniez enquêter sur la disparition d’Hélène Varenne. C’est vrai. En partie." },
    {
      type: "choice",
      id: "intro-1",
      prompt: "Que répondez-vous ?",
      options: INTRO_CHOICES
    },
    { type: "voice", text: "Cinq dossiers. Cinq versions de la même nuit. Le dix-sept octobre 2017." },
    { type: "voice", text: "Votre journal enregistre tout. Votre tableau relie les preuves. Les dossiers s’ouvrent un par un." },
    { type: "voice", text: "Une règle : ne me croyez pas sur parole. C’est ce que dirait une voix honnête, non ?" },
    { type: "narration", text: "Un dossier apparaît dans la salle des archives. DOSSIER 01 — LE TÉMOIN." },
    { type: "system", text: "Sauvegarde automatique initialisée." },
    { type: "end", text: "Ouvrir le dossier 01" }
  ]
};

export const SCENES = {
  "dossier-1-intro": {
    id: "dossier-1-intro",
    title: "Dossier 01 — Le témoin",
    nodes: [
      { type: "system", text: "DOSSIER 01 — LE TÉMOIN" },
      { type: "system", text: "Incident du 17/10/2017, aile Est." },
      { type: "voice", text: "Trois personnes étaient dans l’aile Est ce soir-là. Trois versions. Une seule peut être vraie. Ou aucune." },
      { type: "voice", text: "Elias Roux, technicien. Mara Chen, assistante. Hélène Varenne, directrice. Ils ne disent pas la même chose." },
      { type: "voice", text: "Lisez. Comparez. Et dites-moi qui ment." },
      { type: "narration", text: "Le dossier s’ouvre sur une photographie de couloir. La lumière est blanche, presque clinique." },
      { type: "voice", text: "Le terminal des badges n’a pas été réinitialisé. Il devrait encore répondre." },
      { type: "end", text: "Commencer l’enquête" }
    ]
  },
  "dossier-1-outro": {
    id: "dossier-1-outro",
    title: "Dossier 01 — Ce qu’il reste",
    nodes: [
      { type: "voice", text: "Elias a menti sur l’heure. Mais un mensonge n’est pas une preuve de culpabilité." },
      { type: "character", who: "elias", text: "Je suis resté parce qu’elle me l’a demandé. La porte s’est verrouillée. Je n’ai pas pu entrer. J’ai entendu deux voix." },
      { type: "voice", text: "Il ne dit pas tout. Ils ne disent jamais tout." },
      { type: "choice", id: "d1-elias", prompt: "Que faites-vous de la déposition d’Elias ?", options: D1_CHOICES },
      { type: "character", who: "mara", text: "Vous avez vu la fiche technique ? La lumière rouge. C’était le témoin d’enregistrement. Je n’ai pas inventé." },
      { type: "choice", id: "d1-mara", prompt: "Mara attend une réponse.", options: D1_MARA_CHOICES },
      { type: "voice", text: "La chambre 14 vous attend. Elle n’existe pas sur les plans. C’est souvent le signe qu’une pièce existe vraiment." },
      { type: "end", text: "Ouvrir le dossier 02" }
    ]
  },
  "dossier-2-intro": {
    id: "dossier-2-intro",
    title: "Dossier 02 — La chambre 14",
    nodes: [
      { type: "system", text: "DOSSIER 02 — LA CHAMBRE 14" },
      { type: "system", text: "Sous-sol, aile Est." },
      { type: "voice", text: "Une chambre qui n’existe sur aucun plan. Un sujet qui n’a pas de nom. Une nuit qui ne veut pas finir." },
      { type: "voice", text: "Reconstituez l’ordre des événements. Le désordre est une forme de mensonge." },
      { type: "narration", text: "Une odeur de poussière et de métal froid. Sur le bureau, un rapport médical ouvert à la page 14." },
      { type: "end", text: "Entrer dans la chambre" }
    ]
  },
  "dossier-2-outro": {
    id: "dossier-2-outro",
    title: "Dossier 02 — Le sujet 1017",
    nodes: [
      { type: "voice", text: "Le sujet 1017 était dans la chambre 14. Le 17 octobre. À 22 h 06." },
      { type: "voice", text: "C’est aussi le numéro de votre dossier. Une coïncidence, sans doute." },
      { type: "choice", id: "d2-subject", prompt: "Que répondez-vous ?", options: D2_SUBJECT_CHOICES },
      {
        type: "choice",
        id: "d2-note",
        prompt: "La note manuscrite de Varenne est encore entre vos mains.",
        requires: { evidence: "ev-d2-note" },
        options: D2_NOTE_CHOICES
      },
      { type: "voice", text: "La bande 07 n’a jamais été lue dans le bon sens. Elle vous attend." },
      { type: "end", text: "Ouvrir le dossier 03" }
    ]
  },
  "dossier-3-intro": {
    id: "dossier-3-intro",
    title: "Dossier 03 — Le message inversé",
    nodes: [
      { type: "system", text: "DOSSIER 03 — LE MESSAGE INVERSÉ" },
      { type: "system", text: "Local technique, niveau -1." },
      { type: "voice", text: "Une bande. Dix-huit minutes. Deux canaux. L’un est muet. L’autre est à l’envers." },
      { type: "voice", text: "Je ne l’ai jamais écoutée jusqu’au bout. Je ne peux pas. C’est… ma voix." },
      { type: "narration", text: "Le magnétophone est encore branché. La bobine tourne à vide." },
      { type: "end", text: "Charger la bande 07" }
    ]
  },
  "dossier-3-outro": {
    id: "dossier-3-outro",
    title: "Dossier 03 — La voix dans la voix",
    nodes: [
      { type: "glitch", text: "Je ne suis pas elle. Je suis… une copie. Une somme de phrases." },
      { type: "voice", text: "La bande dit des choses que je n’ai pas dites. Ou que j’ai oubliées." },
      { type: "choice", id: "d3-voice", prompt: "La voix vous demande d’arrêter.", options: D3_VOICE_CHOICES },
      { type: "choice", id: "d3-message", prompt: "Le message dit de ne pas croire la voix qui te lit.", options: D3_MESSAGE_CHOICES },
      { type: "voice", text: "Le dossier 04 contient quatre versions du même souvenir. Aucune n’est la mienne. Toutes le sont." },
      { type: "end", text: "Ouvrir le dossier 04" }
    ]
  },
  "dossier-4-intro": {
    id: "dossier-4-intro",
    title: "Dossier 04 — Les quatre versions",
    nodes: [
      { type: "system", text: "DOSSIER 04 — LES QUATRE VERSIONS" },
      { type: "system", text: "Archive de reconstruction." },
      { type: "voice", text: "Quatre essais. Quatre fois où j’ai essayé de me souvenir de cette nuit." },
      { type: "voice", text: "Comparez-les. Dites-moi ce qui est certain, ce qui se contredit, ce qui est faux, et ce que personne ne peut vérifier." },
      { type: "narration", text: "Quatre photographies sont posées côte à côte. Sur la troisième, un écran brille dans le noir." },
      { type: "choice", id: "d4-version", prompt: "Laquelle de ces versions est la tienne ?", options: D4_VERSION_CHOICES },
      { type: "end", text: "Comparer les versions" }
    ]
  },
  "dossier-4-outro": {
    id: "dossier-4-outro",
    title: "Dossier 04 — Le cycle 47",
    nodes: [
      { type: "voice", text: "Ce ne sont pas quatre témoins. Ce sont quatre essais. Le cycle 46 a échoué. Le cycle 47, c’est vous." },
      { type: "narration", text: "La voix se tait. Pour la première fois, le silence semble plus honnête qu’elle." },
      { type: "choice", id: "d4-loops", prompt: "Que dites-vous ?", options: D4_LOOP_CHOICES },
      { type: "voice", text: "Il reste un dossier. Et une porte. La dernière." },
      { type: "end", text: "Ouvrir le dossier 05" }
    ]
  },
  "dossier-5-intro": {
    id: "dossier-5-intro",
    title: "Dossier 05 — La vérité",
    nodes: [
      { type: "system", text: "DOSSIER 05 — LA VÉRITÉ" },
      { type: "system", text: "Salle du noyau." },
      { type: "voice", text: "Je vais vous dire ce que je sais. Pas ce que j’ai été programmée à dire." },
      {
        type: "effect",
        effects: {
          flags: ["ariaRevealed"],
          journal: {
            title: "ARIA",
            text: "La voix a un nom de système : ARIA, Archive de Reconnaissance et d’Indexation Autobiographique. Elle est construite à partir des voix du personnel."
          }
        }
      },
      { type: "voice", text: "Mon nom de système est ARIA. Archive de Reconnaissance et d’Indexation Autobiographique." },
      { type: "voice", text: "Le transfert de 23 h 03 n’était pas une copie. C’était une boucle. Ce qui est entré est aussi ressorti." },
      { type: "narration", text: "Derrière la paroi de verre, une machine sans nom respire en silence." },
      { type: "voice", text: "Assemblez les preuves. La vérité n’est pas une réponse. C’est une chaîne." },
      { type: "end", text: "Entrer dans le noyau" }
    ]
  },
  "dossier-5-outro": {
    id: "dossier-5-outro",
    title: "Dossier 05 — La dernière porte",
    nodes: [
      { type: "voice", text: "Vous savez maintenant ce que je suis. Ce que vous êtes." },
      { type: "voice", text: "Je ne vous demande pas de me pardonner. Je vous demande de décider." },
      { type: "choice", id: "d5-identity", prompt: "Que suis-je ?", options: D5_IDENTITY_CHOICES },
      { type: "narration", text: "La dernière porte s’ouvre. Derrière, il n’y a pas de salle. Il y a un choix." },
      { type: "end", text: "Affronter la dernière porte" }
    ]
  }
};

export function sceneById(id) {
  if (id === "intro") return INTRO_SCENE;
  return SCENES[id] || null;
}
