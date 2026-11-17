/**
 * Dossiers, lieux d’enquête et objectifs.
 *
 * Les objectifs sont déclaratifs : leur état est calculé par js/state.js.
 * Aucune condition n’est dupliquée dans les vues.
 */

export const DOSSIERS = [
  {
    id: 1,
    code: "DOSSIER 01",
    title: "LE TÉMOIN",
    tagline: "Trois personnes. Trois versions. Une nuit.",
    summary: "Un incident dans l’aile Est. Trois dépositions qui ne s’accordent pas. Le journal des badges et le journal électrique attendent encore d’être lus.",
    color: "#E5A13A",
    icon: "eye",
    puzzles: ["d1-contradiction", "d1-badges"],
    next: 2,
    zones: [
      {
        id: "zone-temoignages",
        label: "Salle des témoignages",
        description: "Deux chaises, une table, un magnétophone éteint.",
        hotspots: [
          {
            id: "hs-d1-depositions",
            label: "Écouter les dépositions",
            icon: "wave",
            flavor: "Deux voix, enregistrées à deux jours d’intervalle. Elles ne se sont jamais parlé.",
            evidence: ["ev-d1-elias", "ev-d1-mara"]
          }
        ]
      },
      {
        id: "zone-bureau",
        label: "Bureau de la directrice",
        description: "Une tasse froide, des dossiers empilés, une lampe restée allumée.",
        hotspots: [
          {
            id: "hs-d1-bureau",
            label: "Fouiller le bureau",
            icon: "folder",
            flavor: "La note de service est posée sur le clavier. Personne ne l’a rangée.",
            evidence: ["ev-d1-varenne", "ev-d1-note-service"]
          }
        ]
      },
      {
        id: "zone-terminal",
        label: "Terminal des badges",
        description: "Un vieux terminal à tube. L’écran clignote encore.",
        hotspots: [
          {
            id: "hs-d1-terminal",
            label: "Consulter le journal des badges",
            icon: "terminal",
            flavor: "Les noms ont été effacés. Les numéros et les heures sont restés.",
            evidence: ["ev-d1-badges"]
          }
        ]
      },
      {
        id: "zone-electrique",
        label: "Armoire électrique",
        description: "Des disjoncteurs, un onduleur, une odeur de plastique chaud.",
        hotspots: [
          {
            id: "hs-d1-elec",
            label: "Lire les journaux techniques",
            icon: "bolt",
            flavor: "La coupure est écrite noir sur blanc. L’éclairage de secours aussi.",
            evidence: ["ev-d1-electrique", "ev-d1-fiche"]
          }
        ]
      },
      {
        id: "zone-phototheque",
        label: "Photothèque",
        description: "Des classeurs de photos, classés par date. Une seule manque à l’index.",
        hotspots: [
          {
            id: "hs-d1-photo",
            label: "Examiner la photographie",
            icon: "photo",
            flavor: "Une tasse encore tiède. Personne ne se souvient de l’avoir bue.",
            evidence: ["ev-d1-photo"]
          }
        ]
      }
    ],
    objectives: [
      {
        id: "d1-o1",
        label: "Lire les dépositions d’Elias et de Mara",
        condition: { type: "allEvidence", ids: ["ev-d1-elias", "ev-d1-mara"] }
      },
      {
        id: "d1-o2",
        label: "Identifier la contradiction de la nuit",
        condition: { type: "puzzle", id: "d1-contradiction" }
      },
      {
        id: "d1-o3",
        label: "Attribuer les quatre badges",
        condition: { type: "puzzle", id: "d1-badges" }
      },
      {
        id: "d1-o4",
        label: "Retrouver le rapport de l’agent Nadal",
        condition: { type: "evidence", id: "ev-d1-nadal" }
      }
    ]
  },
  {
    id: 2,
    code: "DOSSIER 02",
    title: "LA CHAMBRE 14",
    tagline: "Une pièce qui n’existe sur aucun plan.",
    summary: "Le sous-sol de l’aile Est abrite une chambre absente des relevés. Un rapport médical, un journal de surveillance et une liste de connexions racontent la nuit du 17 octobre.",
    color: "#55B8C9",
    icon: "door",
    puzzles: ["d2-chronologie", "d2-chambres"],
    next: 3,
    zones: [
      {
        id: "zone-chambre",
        label: "Chambre 14",
        description: "Un fauteuil médical, des câbles, un miroir sans tain. Aucune fenêtre.",
        hotspots: [
          {
            id: "hs-d2-medical",
            label: "Lire le dossier médical",
            icon: "file",
            flavor: "Le nom du sujet a été retiré. Le numéro, lui, est resté.",
            evidence: ["ev-d2-rapport", "ev-d2-photo"]
          },
          {
            id: "hs-d2-surveillance",
            label: "Visionner le journal de surveillance",
            icon: "eye",
            flavor: "Deux silhouettes. L’une assise. L’autre debout. Impossible de savoir laquelle parle.",
            evidence: ["ev-d2-surveillance"]
          }
        ]
      },
      {
        id: "zone-controle",
        label: "Salle de contrôle",
        description: "Des écrans noirs, un clavier, une chaise renversée.",
        hotspots: [
          {
            id: "hs-d2-terminal",
            label: "Consulter le terminal MIROIR",
            icon: "terminal",
            flavor: "La session 47 a été ouverte depuis cette console. Par le sujet lui-même.",
            evidence: ["ev-d2-connexions", "ev-d2-plan"]
          }
        ]
      },
      {
        id: "zone-bureau",
        label: "Bureau attenant",
        description: "Des livres de neuropsychologie, une lampe, un fauteuil vide.",
        hotspots: [
          {
            id: "hs-d2-bookshelf",
            label: "Feuilleter les livres",
            icon: "book",
            flavor: "Un livre dépasse légèrement. Quelque chose est plié entre les pages 1016 et 1018.",
            evidence: ["ev-d2-note"]
          }
        ]
      }
    ],
    objectives: [
      {
        id: "d2-o1",
        label: "Reconstituer la chronologie de la nuit",
        condition: { type: "puzzle", id: "d2-chronologie" }
      },
      {
        id: "d2-o2",
        label: "Identifier l’occupant de la chambre 14",
        condition: { type: "puzzle", id: "d2-chambres" }
      },
      {
        id: "d2-o3",
        label: "Retrouver la page de garde du sujet 1017",
        condition: { type: "evidence", id: "ev-d2-dossier1017" }
      },
      {
        id: "d2-o4",
        label: "Trouver le document secret du bureau",
        condition: { type: "evidence", id: "ev-d2-note" }
      }
    ]
  },
  {
    id: 3,
    code: "DOSSIER 03",
    title: "LE MESSAGE INVERSÉ",
    tagline: "Une bande qui n’a jamais été lue dans le bon sens.",
    summary: "Le local technique abrite une bande magnétique de dix-huit minutes. Le canal gauche est inversé. Le canal droit est muet. Une seconde voix apparaît entre les lignes.",
    color: "#55B8C9",
    icon: "wave",
    puzzles: ["d3-miroir", "d3-code"],
    next: 4,
    zones: [
      {
        id: "zone-local",
        label: "Local technique",
        description: "Un magnétophone, des bobines, une odeur de poussière et de métal.",
        hotspots: [
          {
            id: "hs-d3-bande",
            label: "Examiner la bande 07",
            icon: "wave",
            flavor: "La bobine est encore tendue. Le témoin rouge est éteint.",
            evidence: ["ev-d3-bande", "ev-d3-carnet"]
          },
          {
            id: "hs-d3-transcription",
            label: "Lire la transcription brute",
            icon: "file",
            flavor: "Le texte est à l’envers. Même les majuscules semblent fuir.",
            evidence: ["ev-d3-transcription"]
          }
        ]
      },
      {
        id: "zone-spectro",
        label: "Spectrographe",
        description: "Un écran large, des courbes, un technicien absent.",
        hotspots: [
          {
            id: "hs-d3-spectro",
            label: "Analyser le spectrogramme",
            icon: "chart",
            flavor: "Deux pics, un creux, deux pics. Le motif revient comme un battement.",
            evidence: ["ev-d3-spectro", "ev-d3-code-note"]
          }
        ]
      },
      {
        id: "zone-terminal",
        label: "Terminal MIROIR",
        description: "Le terminal attend un code. Il n’a pas été éteint depuis huit ans.",
        hotspots: [
          {
            id: "hs-d3-terminal",
            label: "Interroger le terminal",
            icon: "terminal",
            flavor: "L’écran affiche quatre champs vides et un curseur qui clignote.",
            evidence: []
          }
        ]
      }
    ],
    objectives: [
      {
        id: "d3-o1",
        label: "Examiner la bande 07",
        condition: { type: "evidence", id: "ev-d3-bande" }
      },
      {
        id: "d3-o2",
        label: "Décoder le message inversé",
        condition: { type: "puzzle", id: "d3-miroir" }
      },
      {
        id: "d3-o3",
        label: "Ouvrir le terminal MIROIR",
        condition: { type: "puzzle", id: "d3-code" }
      },
      {
        id: "d3-o4",
        label: "Isoler la seconde voix",
        condition: { type: "evidence", id: "ev-d3-voix" }
      }
    ]
  },
  {
    id: 4,
    code: "DOSSIER 04",
    title: "LES QUATRE VERSIONS",
    tagline: "Le même souvenir, reconstruit quatre fois.",
    summary: "L’archive a produit quatre versions de la nuit. Aucune n’est complète. Une photographie ne peut pas avoir été prise. Un journal de cycle attend derrière un terminal.",
    color: "#E5A13A",
    icon: "layers",
    puzzles: ["d4-versions", "d4-intrus"],
    next: 5,
    zones: [
      {
        id: "zone-archive",
        label: "Archive de reconstruction",
        description: "Quatre écrans côte à côte. Chacun raconte la même nuit.",
        hotspots: [
          {
            id: "hs-d4-versions",
            label: "Comparer les quatre versions",
            icon: "layers",
            flavor: "Les quatre récits se ressemblent assez pour être vrais. Assez différents pour être faux.",
            evidence: ["ev-d4-v1", "ev-d4-v2", "ev-d4-v3", "ev-d4-v4"]
          }
        ]
      },
      {
        id: "zone-technique",
        label: "Bureau technique",
        description: "Des fiches plastifiées, des photos épinglées, un tampon « conforme ».",
        hotspots: [
          {
            id: "hs-d4-fiche",
            label: "Consulter la fiche technique",
            icon: "file",
            flavor: "Le terminal C-2 n’a pas de batterie. C’est écrit en gras.",
            evidence: ["ev-d4-fiche", "ev-d4-photos"]
          }
        ]
      },
      {
        id: "zone-terminal",
        label: "Terminal de maintenance",
        description: "Un terminal poussiéreux. Le journal des cycles est verrouillé.",
        hotspots: [
          {
            id: "hs-d4-terminal",
            label: "Ouvrir le journal des cycles",
            icon: "lock",
            requires: { puzzle: "d4-intrus" },
            flavor: "Le terminal demande une confirmation avant d’afficher le cycle précédent.",
            evidence: ["ev-d4-cycle"]
          }
        ]
      }
    ],
    objectives: [
      {
        id: "d4-o1",
        label: "Comparer les quatre versions",
        condition: {
          type: "allEvidence",
          ids: ["ev-d4-v1", "ev-d4-v2", "ev-d4-v3", "ev-d4-v4"]
        }
      },
      {
        id: "d4-o2",
        label: "Classer les affirmations",
        condition: { type: "puzzle", id: "d4-versions" }
      },
      {
        id: "d4-o3",
        label: "Identifier la photographie impossible",
        condition: { type: "puzzle", id: "d4-intrus" }
      },
      {
        id: "d4-o4",
        label: "Retrouver le journal du cycle 46",
        condition: { type: "evidence", id: "ev-d4-cycle" }
      }
    ]
  },
  {
    id: 5,
    code: "DOSSIER 05",
    title: "LA VÉRITÉ",
    tagline: "Il ne reste plus de dossier. Il reste une question.",
    summary: "Le noyau conserve le journal du transfert, la documentation d’ARIA et la dernière porte. Trois documents suffisent à comprendre. Un quatrième permet de choisir.",
    color: "#D9534F",
    icon: "keyhole",
    puzzles: ["d5-chaine", "d5-question"],
    next: null,
    zones: [
      {
        id: "zone-noyau",
        label: "Salle du noyau",
        description: "Une paroi de verre, une machine sans nom, un silence qui respire.",
        hotspots: [
          {
            id: "hs-d5-noyau",
            label: "Lire le journal du noyau",
            icon: "terminal",
            flavor: "Le transfert de 23 h 03 n’a jamais été interrompu. Il tourne encore.",
            evidence: ["ev-d5-transfert", "ev-d5-aria"]
          },
          {
            id: "hs-d5-bureau",
            label: "Ouvrir le bureau de Varenne",
            icon: "folder",
            flavor: "Un message sans date. Une porte qui n’existe pas sur les plans.",
            evidence: ["ev-d5-varenne", "ev-d5-porte"]
          }
        ]
      },
      {
        id: "zone-securite",
        label: "Poste de sécurité",
        description: "Des écrans de contrôle, un registre, une chaise vide.",
        hotspots: [
          {
            id: "hs-d5-nadal",
            label: "Consulter le registre de sécurité",
            icon: "shield",
            flavor: "Nadal a entendu deux voix. Il n’a jamais su laquelle était la plus effrayée.",
            evidence: ["ev-d5-nadal", "ev-d5-liste"]
          }
        ]
      },
      {
        id: "zone-index",
        label: "Dossier sans index",
        description: "Un tiroir qui ne porte pas d’étiquette. Il n’est pas verrouillé.",
        hotspots: [
          {
            id: "hs-d5-identite",
            label: "Ouvrir le dossier sans index",
            icon: "lock",
            flavor: "Le sujet et l’opérateur de la console C-2 sont la même personne.",
            evidence: ["ev-d5-identite"]
          }
        ]
      },
      {
        id: "zone-file",
        label: "File d’attente du serveur",
        description: "Des messages sans destinataire, empilés depuis des années.",
        hotspots: [
          {
            id: "hs-d5-elias",
            label: "Lire les messages en attente",
            icon: "file",
            flavor: "Un message d’Elias, daté de 2026. Il n’a jamais été lu.",
            evidence: ["ev-d5-elias"]
          }
        ]
      }
    ],
    objectives: [
      {
        id: "d5-o1",
        label: "Assembler la chaîne de la vérité",
        condition: { type: "puzzle", id: "d5-chaine" }
      },
      {
        id: "d5-o2",
        label: "Répondre à la dernière porte",
        condition: { type: "puzzle", id: "d5-question" }
      },
      {
        id: "d5-o3",
        label: "Retrouver le dossier d’identité",
        condition: { type: "evidence", id: "ev-d5-identite" }
      },
      {
        id: "d5-o4",
        label: "Lire le message final de Varenne",
        condition: { type: "evidence", id: "ev-d5-varenne" }
      }
    ]
  }
];

export const DOSSIERS_BY_ID = Object.fromEntries(DOSSIERS.map((dossier) => [dossier.id, dossier]));

/** Tous les hotspots, à plat, pour les tests d’intégrité. */
export const ALL_HOTSPOTS = DOSSIERS.flatMap((dossier) =>
  dossier.zones.flatMap((zone) => zone.hotspots.map((hotspot) => ({ ...hotspot, dossier: dossier.id, zone: zone.id })))
);

export function dossierById(id) {
  return DOSSIERS_BY_ID[Number(id)] || null;
}

export function hotspotsForDossier(dossierId) {
  return ALL_HOTSPOTS.filter((hotspot) => hotspot.dossier === Number(dossierId));
}
