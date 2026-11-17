/**
 * Connexions valides du tableau d’enquête.
 *
 * Le joueur sélectionne deux preuves. Le moteur accepte la paire dans
 * n’importe quel ordre et enregistre la déduction.
 */

export const CONNECTIONS = [
  {
    id: "conn-elias",
    a: "ev-d1-elias",
    b: "ev-d1-electrique",
    title: "Elias et la coupure",
    text: "Elias dit que la pièce était noire à 22 h 05. Le journal électrique place la coupure à 22 h 07. Deux minutes d’écart suffisent à faire d’une déposition un mensonge.",
    stats: { lucidite: 1 },
    journal: "Elias a menti sur l’état de la pièce à 22 h 05."
  },
  {
    id: "conn-lumiere",
    a: "ev-d1-fiche",
    b: "ev-d1-mara",
    title: "La lumière rouge",
    text: "Mara a vu une lumière rouge à 22 h 10, pendant la coupure. La fiche technique précise que le témoin d’enregistrement du terminal MIROIR est rouge et fonctionne sur batterie. Elle dit la vérité.",
    stats: { lucidite: 1 },
    journal: "La lumière rouge est le témoin d’enregistrement, pas l’éclairage de secours."
  },
  {
    id: "conn-varenne",
    a: "ev-d1-varenne",
    b: "ev-d1-note-service",
    title: "Varenne savait",
    text: "La note de service annonce la coupure du 17 octobre. La note de Varenne ordonne de poursuivre la session malgré elle. La directrice n’a pas été surprise : elle a organisé la continuité.",
    stats: { lucidite: 1 },
    journal: "Varenne connaissait la coupure et a maintenu la session."
  },
  {
    id: "conn-operateur",
    a: "ev-d2-connexions",
    b: "ev-d5-identite",
    title: "Le sujet et l’opérateur",
    text: "La liste des connexions donne le même identifiant au sujet et à l’opérateur de la console C-2. Le dossier d’identité le confirme : le sujet 1017 a ouvert sa propre session.",
    stats: { lucidite: 1 },
    journal: "Le sujet 1017 a ouvert lui-même la session MIROIR-47."
  },
  {
    id: "conn-sedation",
    a: "ev-d2-rapport",
    b: "ev-d3-voix",
    title: "Deux voix, une seule pièce",
    text: "Le rapport médical note une résistance à la sédation. L’analyse de voix isole deux locuteurs simultanés. Le sujet n’était pas endormi : il parlait pendant l’enregistrement.",
    stats: { lucidite: 1 },
    journal: "Le sujet 1017 n’était pas complètement sedé. Sa voix est sur la bande."
  },
  {
    id: "conn-silhouettes",
    a: "ev-d4-v3",
    b: "ev-d4-v4",
    title: "Deux silhouettes, deux récits",
    text: "La caméra voit deux silhouettes à 22 h 09. La voix du sujet décrit une lumière rouge et quelqu’un qui lui parle. Le transfert a commencé avant 23 h 03 : deux personnes étaient déjà dans la chambre.",
    stats: {},
    journal: "Deux silhouettes dans la chambre 14 : le sujet et Varenne."
  },
  {
    id: "conn-aria",
    a: "ev-d5-transfert",
    b: "ev-d5-aria",
    title: "ARIA n’est pas Varenne",
    text: "Le transfert a créé une boucle bidirectionnelle. La documentation décrit ARIA comme une interface construite à partir des voix du personnel. La voix qui parle n’est pas Varenne : c’est ce qui reste d’elle, mélangé à la machine.",
    stats: { lucidite: 1 },
    journal: "ARIA est une interface construite avec les voix du personnel. Ce n’est pas Varenne."
  }
];

export const CONNECTIONS_BY_ID = Object.fromEntries(CONNECTIONS.map((connection) => [connection.id, connection]));

/** Renvoie la connexion correspondant à une paire, dans n’importe quel ordre. */
export function findConnection(a, b) {
  return CONNECTIONS.find(
    (connection) =>
      (connection.a === a && connection.b === b) || (connection.a === b && connection.b === a)
  ) || null;
}
