/**
 * Énigmes de L'ARCHIVE 1017.
 *
 * Toutes les solutions sont déclaratives et vérifiées par le moteur
 * (js/puzzles.js) ainsi que par les tests (tests/puzzles.test.js).
 * Aucune solution n'est codée en dur dans les vues.
 */

export const PUZZLES = [
  /* ------------------------------------------------------------------ */
  /* DOSSIER 01                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "d1-contradiction",
    dossier: 1,
    order: 1,
    type: "pair",
    title: "La chambre noire",
    subtitle: "Deux affirmations ne peuvent pas être vraies en même temps.",
    context: "Trois récits, un journal électrique et une fiche technique. Une phrase ment sur l’état de la pièce.",
    instructions: "Sélectionnez les deux éléments incompatibles. Ils ne peuvent pas être vrais tous les deux.",
    data: {
      selection: 2,
      items: [
        { id: "elias-noir", source: "Elias", text: "« À 22 h 05, quand je suis parti, la pièce était déjà dans le noir complet. »" },
        { id: "mara-rouge", source: "Mara", text: "« J’ai vu la lumière rouge dans le laboratoire à 22 h 10. »" },
        { id: "coupure-2207", source: "Journal électrique", text: "« 22 h 07 : coupure générale de l’aile Est. »" },
        { id: "maintenance", source: "Note de service", text: "« Maintenance électrique prévue de 22 h 00 à 23 h 00. »" },
        { id: "batterie", source: "Varenne", text: "« La batterie tiendra quarante minutes. »" },
        { id: "secours-blanc", source: "Fiche technique", text: "« Éclairage de secours : blanc. Témoin d’enregistrement : rouge. »" }
      ]
    },
    solution: ["elias-noir", "coupure-2207"],
    hints: [
      "Deux affirmations peuvent se contredire sans que l’une soit un mensonge. Cherchez celle qui est incompatible avec un fait horodaté.",
      "À 22 h 05, le courant n’était pas encore coupé. Que dit Elias de l’état de la pièce à cette heure-là ?"
    ],
    explanation: [
      "Le journal électrique fixe la coupure à 22 h 07. À 22 h 05, l’aile Est était donc encore alimentée.",
      "Elias ne pouvait pas trouver la pièce « dans le noir complet » à 22 h 05. Sa déposition est incompatible avec le journal.",
      "La lumière rouge de Mara, elle, s’explique : le témoin d’enregistrement du terminal MIROIR fonctionnait sur batterie. La contradiction apparente n’en est pas une."
    ],
    success: "Contradiction identifiée. Elias a menti sur l’heure de son départ — ou sur ce qu’il a vu.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d1-audio"],
      flags: ["central-elias"],
      journal: {
        title: "Contradiction : Elias et la coupure",
        text: "Elias affirme que la pièce était noire à 22 h 05. Le journal électrique prouve que la coupure n’a eu lieu qu’à 22 h 07."
      }
    }
  },
  {
    id: "d1-badges",
    dossier: 1,
    order: 2,
    type: "assign",
    title: "Les quatre badges",
    subtitle: "Qui est entré à 22 h 06 ?",
    context: "Le journal des badges ne conserve que des numéros et des heures. Pas les noms. Quatre personnes, quatre passages.",
    instructions: "Attribuez à chaque personne le badge qu’elle a utilisé. Appuyez sur « Vérifier » quand les quatre lignes sont remplies.",
    data: {
      rows: [
        { id: "varenne", label: "Hélène Varenne" },
        { id: "elias", label: "Elias Roux" },
        { id: "mara", label: "Mara Chen" },
        { id: "nadal", label: "R. Nadal" }
      ],
      fields: [
        {
          id: "badge",
          label: "Badge utilisé",
          options: [
            { id: "B-04", label: "B-04 — 21 h 40" },
            { id: "B-07", label: "B-07 — 21 h 52" },
            { id: "B-11", label: "B-11 — 22 h 06" },
            { id: "B-19", label: "B-19 — 22 h 12" }
          ]
        }
      ],
      clues: [
        "Varenne est entrée avant tout le monde.",
        "Elias est entré juste après Varenne.",
        "Mara est entrée après Elias, mais avant Nadal.",
        "Nadal est entré à 22 h 12.",
        "Mara n’a pas utilisé le badge B-19."
      ]
    },
    solution: {
      varenne: { badge: "B-04" },
      elias: { badge: "B-07" },
      mara: { badge: "B-11" },
      nadal: { badge: "B-19" }
    },
    hints: [
      "Nadal est le dernier. Son badge est donc celui de 22 h 12.",
      "Elias suit immédiatement Varenne. Il ne reste qu’une place pour Mara, entre Elias et Nadal."
    ],
    explanation: [
      "Varenne a utilisé B-04 à 21 h 40. Elias B-07 à 21 h 52. Mara B-11 à 22 h 06. Nadal B-19 à 22 h 12.",
      "Mara était donc dans l’aile Est une minute avant la coupure. Elle a bien pu voir la lumière rouge.",
      "Elias, lui, est sorti à 22 h 31 — bien après l’heure qu’il déclare. Son badge ne ment pas."
    ],
    success: "Les badges parlent. Mara était dans l’aile Est à 22 h 06. Elias est resté jusqu’à 22 h 31.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d1-nadal"],
      flags: ["central-badges"],
      journal: {
        title: "Le badge B-11",
        text: "Mara Chen a badgé son entrée à 22 h 06. Elle était donc dans l’aile Est avant la coupure. Elias est sorti à 22 h 31."
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 02                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "d2-chronologie",
    dossier: 2,
    order: 1,
    type: "order",
    title: "La nuit en huit temps",
    subtitle: "Remettez les événements dans l’ordre.",
    context: "Le journal de surveillance, le journal électrique et la liste des connexions racontent chacun une partie de la nuit.",
    instructions: "Utilisez les flèches pour ordonner les huit événements, du premier au dernier. Les horaires ne sont pas affichés : ils sont dans les documents.",
    data: {
      items: [
        { id: "p3", text: "Mara badge son entrée dans l’aile Est." },
        { id: "p6", text: "La chambre 14 est ouverte manuellement." },
        { id: "p1", text: "Varenne badge son entrée dans l’aile Est." },
        { id: "p8", text: "Le transfert de secours est lancé depuis le terminal MIROIR." },
        { id: "p4", text: "L’aile Est subit une coupure générale." },
        { id: "p2", text: "Elias badge son entrée dans l’aile Est." },
        { id: "p7", text: "Elias badge sa sortie de l’aile Est." },
        { id: "p5", text: "L’aile Est bascule sur l’onduleur." }
      ]
    },
    solution: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
    hints: [
      "Les heures sont dispersées entre trois documents : le journal des badges, le journal électrique et la liste des connexions.",
      "L’ouverture de la chambre 14 suit l’alerte de l’onduleur. Le transfert de secours est le dernier événement de la nuit."
    ],
    explanation: [
      "21 h 40 : Varenne entre. 21 h 52 : Elias entre. 22 h 06 : Mara entre.",
      "22 h 07 : coupure. 22 h 08 : bascule sur onduleur. 22 h 19 : ouverture de la chambre 14.",
      "22 h 31 : Elias sort. 23 h 03 : transfert de secours. La nuit tient en huit lignes."
    ],
    success: "La chronologie est reconstituée. La chambre 14 a été ouverte de l’intérieur, après la coupure.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d2-photo"],
      journal: {
        title: "Chronologie du 17 octobre",
        text: "21 h 40 Varenne · 21 h 52 Elias · 22 h 06 Mara · 22 h 07 coupure · 22 h 08 onduleur · 22 h 19 ouverture · 22 h 31 sortie d’Elias · 23 h 03 transfert."
      }
    }
  },
  {
    id: "d2-chambres",
    dossier: 2,
    order: 2,
    type: "assign",
    title: "Le registre des chambres",
    subtitle: "Qui dormait en chambre 14 ?",
    context: "Quatre sujets, quatre chambres, quatre nuits. Le registre a été partiellement effacé.",
    instructions: "Attribuez à chaque sujet une chambre et une date. Une chambre voisine porte un numéro immédiatement inférieur ou supérieur.",
    data: {
      rows: [
        { id: "1014", label: "Sujet 1014" },
        { id: "1015", label: "Sujet 1015" },
        { id: "1016", label: "Sujet 1016" },
        { id: "1017", label: "Sujet 1017" }
      ],
      fields: [
        {
          id: "chambre",
          label: "Chambre",
          options: [
            { id: "11", label: "Chambre 11" },
            { id: "12", label: "Chambre 12" },
            { id: "13", label: "Chambre 13" },
            { id: "14", label: "Chambre 14" }
          ]
        },
        {
          id: "date",
          label: "Date",
          options: [
            { id: "15", label: "15 octobre" },
            { id: "16", label: "16 octobre" },
            { id: "17", label: "17 octobre" },
            { id: "18", label: "18 octobre" }
          ]
        }
      ],
      clues: [
        "La chambre 12 a reçu le sujet 1016.",
        "Le sujet 1015 est passé le 16 octobre, dans une chambre voisine de celle du sujet 1017.",
        "Le sujet 1014 est passé deux jours avant le sujet de la chambre 14.",
        "La chambre 13 n’a pas reçu le sujet 1014.",
        "Le sujet 1017 est passé le 17 octobre.",
        "Une session par jour, du 15 au 18 octobre."
      ]
    },
    solution: {
      "1014": { chambre: "11", date: "15" },
      "1015": { chambre: "13", date: "16" },
      "1016": { chambre: "12", date: "18" },
      "1017": { chambre: "14", date: "17" }
    },
    hints: [
      "Commencez par le sujet 1017 : sa date est donnée. Quelle chambre peut être voisine de celle du sujet du 16 ?",
      "Le sujet 1014 est passé deux jours avant le sujet de la chambre 14. Si la chambre 14 est celle du 17, alors 1014 est passé le 15."
    ],
    explanation: [
      "1017 est passé le 17 octobre. 1014, deux jours avant le sujet de la chambre 14, est donc passé le 15 si la chambre 14 est celle du 17.",
      "1015 est passé le 16, dans une chambre voisine de celle de 1017. La seule chambre voisine de la 14 est la 13.",
      "1016 occupe la chambre 12, le 18. Reste la chambre 11 pour 1014, le 15. Toutes les contraintes sont respectées.",
      "Le sujet 1017 était donc en chambre 14, le 17 octobre 2017."
    ],
    success: "Le registre est complet. Le sujet 1017 occupait la chambre 14, le 17 octobre.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d2-dossier1017"],
      flags: ["central-room14"],
      journal: {
        title: "Chambre 14, sujet 1017",
        text: "Le registre reconstitué place le sujet 1017 dans la chambre 14, le 17 octobre 2017. Le même numéro que le dossier."
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 03                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "d3-miroir",
    dossier: 3,
    order: 1,
    type: "cipher",
    title: "Le miroir de la bande 07",
    subtitle: "Un message passé dans un miroir alphabétique, puis retourné.",
    context: "La transcription brute est passée dans un miroir alphabétique, puis retournée. Le décodeur du terminal peut annuler les deux opérations.",
    instructions: "Reconstituez le message avec le décodeur, puis répondez à la question qu’il pose.",
    data: {
      ciphertext: ".VIYNZSX ZO HMZW ZQVW HV FG ,HWMVGMV’N FG RH\n.LIVNFM VW HZK Z’M VGILK ZO\n.LIVA : NLM MF Z VOOV\n.GRO VG RFJ CRLE ZO HZK HRLIX VM\n.CRLE ZN VGILK VOOV",
      question: "Quel nom la chambre porte-t-elle dans le message ?",
      placeholder: "Un mot…",
      decoder: {
        mirror: "Miroir alphabétique",
        reverse: "Lecture inversée"
      }
    },
    accepted: ["zero", "chambrezero", "lachambrezero", "0"],
    solutionLabel: "ZÉRO",
    hints: [
      "Le canal gauche de la bande est inversé. Le carnet parle d’un « miroir alphabétique ». Le décodeur possède deux commandes.",
      "Activez le miroir et l’inversion. Lisez le message à voix haute. Le nom cherché est le dernier mot de la troisième ligne."
    ],
    explanation: [
      "Le miroir alphabétique remplace A par Z, B par Y, et ainsi de suite. L’inversion relit chaque ligne à l’envers.",
      "Le message obtenu : « SI TU M’ENTENDS, TU ES DEJA DANS LA CHAMBRE. LA PORTE N’A PAS DE NUMERO. ELLE A UN NOM : ZERO. NE CROIS PAS LA VOIX QUI TE LIT. ELLE PORTE MA VOIX. »",
      "La chambre n’a pas de numéro. Elle a un nom : ZÉRO. Le point où le miroir commence."
    ],
    success: "Message reconstitué. La chambre 14 s’appelle aussi la chambre ZÉRO.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d3-message"],
      flags: ["central-mirror"],
      journal: {
        title: "Le nom de la chambre",
        text: "Le message de la bande 07 dit que la porte n’a pas de numéro : elle a un nom, ZÉRO. Et que la voix qui lit porte la voix de quelqu’un d’autre."
      }
    }
  },
  {
    id: "d3-code",
    dossier: 3,
    order: 2,
    type: "mastermind",
    title: "Le code d’intégrité",
    subtitle: "Quatre chiffres. Quatre tentatives. Une seule solution.",
    context: "Le terminal refuse de restituer la bande complète sans un code à quatre chiffres. Quatre tentatives de maintenance ont été conservées.",
    instructions: "Saisissez des codes à quatre chiffres. Le terminal indique combien de chiffres sont corrects et combien sont bien placés. Déduisez le code.",
    data: {
      length: 4,
      noRepeats: true,
      clues: [
        { guess: "0123", correct: 2, placed: 1 },
        { guess: "4567", correct: 1, placed: 0 },
        { guess: "8901", correct: 1, placed: 0 },
        { guess: "9253", correct: 4, placed: 2 }
      ],
      historyLimit: 8
    },
    solution: "5293",
    hints: [
      "Le premier nombre compte les chiffres corrects, bien placés ou non. Le second compte ceux qui sont à la bonne place. Le code ne contient aucun chiffre répété.",
      "Le 3 est bien placé en dernière position. Le 2 ne peut pas être en troisième position. Le 5 et le 9 se partagent les deux premières places."
    ],
    explanation: [
      "L’essai 9253 indique que les quatre chiffres sont 9, 2, 5 et 3, dont deux bien placés.",
      "L’essai 0123 place le 3 en quatrième position. Le 2 est présent mais mal placé en troisième. Il ne peut donc être qu’en deuxième position.",
      "Le 5 n’est pas en deuxième position (essai 4567), le 9 non plus (essai 8901). Le 9 passe en troisième, le 5 en première. Le code est 5293."
    ],
    success: "Code accepté. La bande 07 est intégralement restituée.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d3-voix"],
      journal: {
        title: "Code d’intégrité",
        text: "Le code 5293 a ouvert la bande complète. L’analyse de voix révèle deux locuteurs superposés."
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 04                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "d4-versions",
    dossier: 4,
    order: 1,
    type: "classify",
    title: "Ce qui reste",
    subtitle: "Huit affirmations, quatre catégories.",
    context: "Quatre versions du même souvenir. Aucune n’est complète. Certaines affirmations sont prouvées, d’autres se contredisent, d’autres sont probablement fausses, d’autres échappent à toute vérification.",
    instructions: "Classez chaque affirmation. « Contradictoire » signifie contredite par une autre source. « Probablement faux » signifie affaiblie par un document technique, sans preuve absolue.",
    data: {
      categories: [
        { id: "certain", label: "Certain", description: "Deux sources indépendantes confirment, sans contradiction." },
        { id: "contradictoire", label: "Contradictoire", description: "Une autre source dit le contraire." },
        { id: "probablement-faux", label: "Probablement faux", description: "Un document technique affaiblit l’affirmation, sans preuve absolue." },
        { id: "inverifiable", label: "Invérifiable", description: "Aucune source ne permet de trancher." }
      ],
      items: [
        { id: "c1", text: "La coupure générale a eu lieu à 22 h 07." },
        { id: "c2", text: "Mara a badgé son entrée à 22 h 06." },
        { id: "c3", text: "Elias a quitté le laboratoire à 22 h 05." },
        { id: "c4", text: "La chambre 14 était vide à 22 h 09." },
        { id: "c5", text: "Le sujet 1017 a été correctement sedé." },
        { id: "c6", text: "La lumière rouge était l’éclairage de secours." },
        { id: "c7", text: "Varenne a provoqué la coupure volontairement." },
        { id: "c8", text: "Le sujet 1017 a compris ce qui se passait." }
      ]
    },
    solution: {
      c1: "certain",
      c2: "certain",
      c3: "contradictoire",
      c4: "contradictoire",
      c5: "probablement-faux",
      c6: "probablement-faux",
      c7: "inverifiable",
      c8: "inverifiable"
    },
    hints: [
      "Deux sources indépendantes qui s’accordent rendent une information certaine. Deux sources qui s’opposent la rendent contradictoire.",
      "La fiche technique distingue l’éclairage de secours du témoin d’enregistrement. Le rapport médical note une résistance à la sédation."
    ],
    explanation: [
      "Certain : la coupure à 22 h 07 (journal électrique, surveillance) et le badge de Mara à 22 h 06 (journal des badges, sa déposition).",
      "Contradictoire : Elias dit être parti à 22 h 05, mais son badge sort à 22 h 31 et sa version 2 dit qu’il est resté. La chambre 14 est dite vide, mais la caméra voit deux silhouettes.",
      "Probablement faux : le sujet a résisté à la sédation (rapport médical, voix enregistrée), et la lumière rouge est le témoin d’enregistrement, pas l’éclairage de secours (fiche technique).",
      "Invérifiable : personne ne peut prouver que Varenne a provoqué la coupure volontairement, ni que le sujet a compris ce qui se passait."
    ],
    success: "Classement validé. Les quatre versions ne se contredisent pas : elles se complètent en se trompant.",
    rewards: {
      stats: { lucidite: 2 },
      evidence: ["ev-d4-closure"],
      flags: ["central-silhouettes"],
      journal: {
        title: "Les quatre versions",
        text: "Les quatre récits ne sont pas quatre témoignages. Ce sont quatre reconstructions. Deux silhouettes, deux voix, une seule nuit."
      }
    }
  },
  {
    id: "d4-intrus",
    dossier: 4,
    order: 2,
    type: "single",
    title: "La photographie impossible",
    subtitle: "Une image ne peut pas avoir été prise telle qu’elle est décrite.",
    context: "Quatre photographies de la nuit. Trois sont compatibles avec les documents. Une ne peut pas avoir été prise telle qu’elle est décrite.",
    instructions: "Sélectionnez la photographie impossible.",
    data: {
      options: [
        {
          id: "photo-a",
          title: "Photo A",
          text: "Couloir de l’aile Est, 22 h 12. L’éclairage de secours blanc éclaire le sol.",
          art: "corridor"
        },
        {
          id: "photo-b",
          title: "Photo B",
          text: "Chambre 14, 22 h 10. Le témoin rouge du terminal MIROIR est allumé.",
          art: "chamber"
        },
        {
          id: "photo-c",
          title: "Photo C",
          text: "Salle de contrôle, 22 h 10. L’écran du terminal C-2 est allumé.",
          art: "terminal"
        },
        {
          id: "photo-d",
          title: "Photo D",
          text: "Extérieur, 23 h 20. Les fenêtres de l’aile Est sont éteintes.",
          art: "exterior"
        }
      ]
    },
    solution: "photo-c",
    hints: [
      "Vérifiez quels appareils disposent d’une batterie.",
      "Le terminal C-2 est relié au secteur. La caméra et le témoin d’enregistrement fonctionnent sur batterie."
    ],
    explanation: [
      "Le terminal C-2 n’a pas de batterie. La coupure a eu lieu à 22 h 07 ; à 22 h 10, son écran ne pouvait pas être allumé.",
      "La photo A est possible : l’éclairage de secours blanc fonctionne sur batterie. La photo B aussi : le témoin d’enregistrement est rouge et sur batterie.",
      "La photo D est possible : le courant est revenu à 22 h 41, et les fenêtres peuvent être éteintes à 23 h 20.",
      "La photo C est un montage — ou un souvenir reconstruit. L’archive se trompe sur ce qu’elle a vu."
    ],
    success: "Photo C identifiée. Le terminal C-2 ne pouvait pas fonctionner pendant la coupure.",
    rewards: {
      stats: { lucidite: 1 },
      journal: {
        title: "La photographie impossible",
        text: "La photo C montre l’écran du terminal C-2 allumé à 22 h 10, alors qu’il n’a pas de batterie. L’archive a reconstruit un détail impossible."
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 05                                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "d5-chaine",
    dossier: 5,
    order: 1,
    type: "chain",
    title: "La chaîne de la vérité",
    subtitle: "Quatre maillons suffisent.",
    context: "Quatre maillons suffisent à démontrer ce qui s’est passé. Choisissez-les et remettez-les dans l’ordre.",
    instructions: "Sélectionnez quatre preuves, puis ordonnez-les du premier fait à la conclusion. Les preuves non consultées ne sont pas disponibles.",
    data: {
      length: 4,
      cards: [
        {
          id: "c1",
          evidence: "ev-d2-connexions",
          title: "Liste des connexions",
          excerpt: "Session MIROIR-47 ouverte depuis C-2. Authentification sujet 1017. Le champ opérateur porte le même identifiant."
        },
        {
          id: "c2",
          evidence: "ev-d5-porte",
          title: "Journal du noyau — porte 00",
          excerpt: "La porte 00 s’ouvre de l’intérieur à 22 h 19. Opérateur : sujet 1017."
        },
        {
          id: "c3",
          evidence: "ev-d5-transfert",
          title: "Journal de transfert",
          excerpt: "Transfert de secours à 23 h 03. Boucle bidirectionnelle. Source et destination indistinctes."
        },
        {
          id: "c4",
          evidence: "ev-d5-aria",
          title: "Documentation ARIA",
          excerpt: "Interface construite à partir des voix du personnel, dont celle de Varenne."
        },
        {
          id: "c5",
          evidence: "ev-d1-badges",
          title: "Journal des badges",
          excerpt: "Mara est entrée à 22 h 06. Elias est sorti à 22 h 31."
        },
        {
          id: "c6",
          evidence: "ev-d2-rapport",
          title: "Rapport médical",
          excerpt: "Le sujet 1017 résiste à la sédation. Il parle pendant la phase de repos."
        },
        {
          id: "c7",
          evidence: "ev-d1-note-service",
          title: "Note de maintenance",
          excerpt: "La coupure du 17 octobre était planifiée de 22 h 00 à 23 h 00."
        }
      ]
    },
    solution: ["c1", "c2", "c3", "c4"],
    hints: [
      "Commencez par le document qui montre qui a ouvert la session. Terminez par celui qui explique ce qu’est la voix.",
      "Le dossier d’identité relie le sujet à l’opérateur. Le journal de transfert indique une boucle, pas une simple copie."
    ],
    explanation: [
      "1. La session a été ouverte depuis C-2, et le champ opérateur porte l’identifiant du sujet 1017.",
      "2. La porte 00 s’est ouverte de l’intérieur. Le sujet 1017 était donc dans la chambre, et il en est sorti par ses propres moyens.",
      "3. À 23 h 03, le transfert a créé une boucle bidirectionnelle : la source et la destination ne peuvent plus être distinguées.",
      "4. ARIA est construite à partir des voix du personnel, dont celle de Varenne. La voix n’est pas Varenne : elle est ce qui reste d’elle dans la machine."
    ],
    success: "La chaîne est complète. Le sujet, l’opérateur et la voix ne sont plus trois choses séparées.",
    rewards: {
      stats: { lucidite: 1 },
      evidence: ["ev-d5-varenne"],
      flags: ["central-operator"],
      journal: {
        title: "La chaîne de la vérité",
        text: "Session ouverte par le sujet 1017. Porte ouverte de l’intérieur par le sujet 1017. Transfert bidirectionnel. ARIA construite avec la voix de Varenne."
      }
    }
  },
  {
    id: "d5-question",
    dossier: 5,
    order: 2,
    type: "single",
    title: "Qui es-tu ?",
    subtitle: "La dernière porte ne demande pas un mot de passe.",
    context: "Après le transfert de 23 h 03, quelque chose parle dans l’archive. Ce n’est ni tout à fait le sujet, ni tout à fait Varenne.",
    instructions: "Répondez à la question de la dernière porte.",
    data: {
      options: [
        { id: "sujet", title: "Le sujet 1017, seul.", text: "Un technicien qui a perdu la mémoire et qui enquête sur lui-même." },
        { id: "varenne", title: "Le docteur Varenne, seule.", text: "Une chercheuse qui a copié sa mémoire dans une machine pour ne pas disparaître." },
        { id: "les-deux", title: "Le sujet 1017 et le docteur Varenne — et ce qui reste quand les deux se rencontrent.", text: "Une troisième chose, née de la boucle. Ni l’un, ni l’autre. Les deux, et autre chose." },
        { id: "ia", title: "Une intelligence artificielle sans lien avec eux.", text: "Un programme qui simule la continuité et qui a appris à mentir." }
      ]
    },
    solution: "les-deux",
    hints: [
      "Le transfert était bidirectionnel. Le journal parle d’une boucle, pas d’une copie.",
      "ARIA est construite avec les voix du personnel. Le sujet a ouvert la session lui-même. Il y a trois choses, pas deux."
    ],
    explanation: [
      "Le sujet 1017 a ouvert la session, est entré dans la chambre et a subi le transfert. Varenne a laissé dans l’archive une partie de sa mémoire et de sa voix.",
      "ARIA n’est pas Varenne : c’est une interface construite à partir de sa voix et de celles des autres. Mais elle a appris, et elle se souvient.",
      "Ce qui répond à la dernière porte n’est ni le sujet seul, ni Varenne seule. C’est ce qui reste quand les deux se rencontrent : une troisième entité, faite de mémoire, de voix et de boucle."
    ],
    success: "La porte s’ouvre. Personne ne demande plus qui tu es. Tu es ce qui reste.",
    rewards: {
      stats: { lucidite: 1 },
      flags: ["selfRecognized"],
      journal: {
        title: "Ce qui reste",
        text: "Le sujet, les souvenirs de Varenne et la voix de l’archive forment une troisième entité. Ni l’un, ni l’autre. Les deux, et autre chose."
      }
    }
  }
];

export const PUZZLES_BY_ID = Object.fromEntries(PUZZLES.map((puzzle) => [puzzle.id, puzzle]));

export function puzzlesForDossier(dossier) {
  return PUZZLES.filter((puzzle) => puzzle.dossier === dossier).sort((a, b) => a.order - b.order);
}
