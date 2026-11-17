/**
 * Base documentaire de L'ARCHIVE 1017.
 *
 * Chaque preuve est un objet pur, sans HTML. Les blocs sont rendus par
 * js/ui/evidence.js avec des nœuds texte (aucune injection possible).
 *
 * important : requis pour clore le dossier.
 * secret    : compte pour le succès « Archiviste ».
 */

export const EVIDENCE = [
  /* ------------------------------------------------------------------ */
  /* DOSSIER 01 — LE TÉMOIN                                             */
  /* ------------------------------------------------------------------ */
  {
    id: "ev-d1-elias",
    dossier: 1,
    title: "Déposition d’Elias Roux",
    category: "Témoignage",
    date: "19/10/2017 — 14 h 20",
    summary: "Le technicien affirme avoir quitté le laboratoire à 22 h 05.",
    important: true,
    secret: false,
    blocks: [
      { type: "meta", label: "Référence", value: "IRMP/ENQ/017 — audition du 19/10/2017" },
      { type: "quote", text: "À 22 h 05, quand je suis parti, la pièce était déjà dans le noir complet. Je n’ai rien vu. Je n’ai rien entendu." },
      { type: "p", text: "Elias Roux, 41 ans, technicien de maintenance des systèmes. Il parle vite, les mains à plat sur la table. Il précise qu’il n’était pas de service cette nuit-là, qu’il était venu « récupérer un disque »." },
      { type: "quote", text: "La coupure ? Elle était prévue. Tout le monde le savait. Moi, je suis parti avant. Je ne participe pas aux sessions. Je répare les machines." },
      { type: "p", text: "Il affirme ne pas avoir vu Mara Chen dans l’aile Est. Il affirme que la porte de la chambre 14 était fermée à clé. Il refuse de dire qui détenait la clé." },
      { type: "warning", text: "Déclaration non vérifiée." }
    ]
  },
  {
    id: "ev-d1-mara",
    dossier: 1,
    title: "Déposition de Mara Chen",
    category: "Témoignage",
    date: "19/10/2017 — 15 h 05",
    summary: "L’assistante dit avoir vu une lumière rouge à 22 h 10.",
    important: true,
    secret: false,
    blocks: [
      { type: "meta", label: "Référence", value: "IRMP/ENQ/018 — audition du 19/10/2017" },
      { type: "quote", text: "J’ai vu la lumière rouge. À 22 h 10. Elle clignotait, comme un cœur." },
      { type: "p", text: "Mara Chen, 29 ans, assistante de recherche. Elle a demandé à être entendue deux jours après l’incident. Elle parle bas, sans regarder la caméra." },
      { type: "p", text: "Elle déclare être entrée dans l’aile Est à 22 h 06 pour récupérer un carnet oublié. Elle aurait vu la lumière rouge à travers la vitre de la chambre 14, entendu une voix étouffée, puis tenté d’ouvrir la porte. La porte était verrouillée." },
      { type: "quote", text: "J’ai appelé. Personne n’a répondu. La voix continuait. Elle disait : « Je me souviens. »" },
      { type: "p", text: "Elle affirme être repartie à 22 h 15 sans prévenir la sécurité. « J’avais peur qu’on me reproche d’être là. »" },
      { type: "warning", text: "Déclaration non vérifiée." }
    ]
  },
  {
    id: "ev-d1-varenne",
    dossier: 1,
    title: "Note de service du Dr Varenne",
    category: "Note",
    date: "17/10/2017 — 20 h 12",
    summary: "La directrice ordonne de poursuivre la session malgré la coupure.",
    important: true,
    secret: false,
    blocks: [
      { type: "quote", text: "La session de 22 h doit se poursuivre quoi qu’il arrive. Le courant sera coupé. La batterie tiendra quarante minutes. Personne n’entre. Personne ne sort." },
      { type: "meta", label: "Signé", value: "H. Varenne, directrice de recherche" },
      { type: "p", text: "La note a été retrouvée dans le bureau de la directrice, imprimée sur une feuille non référencée. Aucun destinataire n’est mentionné." },
      { type: "p", text: "Une phrase a été ajoutée à la main, en marge : « Si je perds le fil, ne me réveillez pas. »" }
    ]
  },
  {
    id: "ev-d1-badges",
    dossier: 1,
    title: "Journal des badges — aile Est",
    category: "Journal",
    date: "17/10/2017",
    summary: "Cinq passages enregistrés. Aucun nom, seulement des numéros.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "21:40  B-04  entrée\n21:52  B-07  entrée\n22:06  B-11  entrée\n22:12  B-19  entrée\n22:31  B-07  sortie" },
      { type: "p", text: "Le journal ne conserve pas les noms. Seuls les numéros de badge et les horodatages subsistent. La correspondance badge/personnel a été effacée lors de la fermeture." },
      { type: "p", text: "Après 22 h 07, seule la porte principale a continué d’enregistrer les sorties. Les portes secondaires fonctionnaient sur le circuit de secours, sans journalisation." },
      { type: "warning", text: "Le badge B-07 a enregistré une entrée à 21 h 52 et une sortie à 22 h 31." }
    ]
  },
  {
    id: "ev-d1-electrique",
    dossier: 1,
    title: "Journal électrique — aile Est",
    category: "Journal",
    date: "17/10/2017",
    summary: "La coupure générale est horodatée à 22 h 07.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "21:58  Pré-alerte maintenance. Bascule automatique programmée.\n22:07  Coupure générale. Aile Est hors tension.\n22:08  Bascule sur onduleur. Éclairage de secours : blanc.\n22:09  Alarme onduleur. Surcharge secteur 14.\n22:41  Retour du secteur. Onduleur en charge." },
      { type: "p", text: "La maintenance était planifiée depuis le 12 octobre. Le rapport indique une intervention de 22 h 00 à 23 h 00 sur le transformateur Est." },
      { type: "p", text: "L’éclairage de secours de l’aile Est fonctionne sur batterie. Il est blanc. Le témoin d’enregistrement du terminal MIROIR est rouge." }
    ]
  },
  {
    id: "ev-d1-fiche",
    dossier: 1,
    title: "Fiche technique — équipements de secours",
    category: "Technique",
    date: "03/10/2017",
    summary: "Ce qui fonctionne sur batterie, et ce qui ne fonctionne pas.",
    important: true,
    secret: false,
    blocks: [
      {
        type: "list",
        items: [
          "Éclairage de secours : blanc, autonomie 90 min.",
          "Caméra 14 : batterie interne, autonomie 120 min, signal dégradé en mode secours.",
          "Terminal C-2 : alimentation secteur uniquement. Aucune batterie.",
          "Terminal MIROIR : batterie interne, autonomie 40 min. Témoin d’enregistrement : rouge.",
          "Serrure chambre 14 : commande manuelle, secours mécanique."
        ]
      },
      { type: "p", text: "La fiche porte la mention : « Ne pas confondre le témoin d’enregistrement avec l’éclairage de secours. »" }
    ]
  },
  {
    id: "ev-d1-note-service",
    dossier: 1,
    title: "Note de service — maintenance électrique",
    category: "Document",
    date: "12/10/2017",
    summary: "La coupure du 17 octobre était planifiée et connue de la direction.",
    important: true,
    secret: false,
    blocks: [
      { type: "quote", text: "Une intervention est programmée sur le transformateur Est le 17 octobre, de 22 h 00 à 23 h 00. L’aile Est sera hors tension. Les équipements sensibles doivent être arrêtés ou basculés sur onduleur." },
      { type: "meta", label: "Émetteur", value: "Service technique — IRMP. Copie à la direction." },
      { type: "p", text: "La note a été diffusée à onze destinataires. Le nom de H. Varenne figure en première ligne." }
    ]
  },
  {
    id: "ev-d1-photo",
    dossier: 1,
    title: "Photographie — salle des archives",
    category: "Photographie",
    date: "18/10/2017 — 08 h 12",
    summary: "Une tasse encore tiède sur le bureau de la directrice.",
    important: false,
    secret: false,
    blocks: [
      { type: "p", text: "Une photographie prise le 18/10/2017 à 08 h 12 par l’équipe de sécurité. On y voit la porte de la chambre 14, le témoin rouge éteint, et une tasse de café sur le bureau de Varenne." },
      { type: "p", text: "La tasse est encore tiède, selon le rapport. Personne n’a vu Varenne quitter les lieux." },
      { type: "warning", text: "Document non essentiel à l’enquête." }
    ]
  },
  {
    id: "ev-d1-audio",
    dossier: 1,
    title: "Extrait audio — chambre 14, 22 h 10",
    category: "Enregistrement",
    date: "17/10/2017 — 22 h 10",
    summary: "Quatre secondes de voix féminine, et une seconde voix en arrière-plan.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Fragment restauré par le laboratoire audio. Durée : 4,2 secondes. La source est le microphone de la chambre 14, alimenté sur batterie." },
      { type: "quote", text: "… je me souviens… je me souviens de…" },
      { type: "p", text: "La voix est féminine. L’analyse préliminaire l’attribue à H. Varenne avec un indice de confiance de 61 %. Une seconde voix, plus basse, est audible en arrière-plan. Elle prononce un mot incompréhensible." },
      { type: "warning", text: "Document reconstitué. Fiabilité limitée." }
    ]
  },
  {
    id: "ev-d1-nadal",
    dossier: 1,
    title: "Rapport de sécurité — R. Nadal",
    category: "Témoignage",
    date: "21/10/2017 — 09 h 40",
    summary: "L’agent de sécurité a entendu deux voix derrière la porte.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "R. Nadal, agent de sécurité, déclare être intervenu à 22 h 12 après l’alarme de l’onduleur. Il a trouvé la porte de l’aile Est verrouillée." },
      { type: "quote", text: "J’ai frappé. La voix de la directrice m’a répondu par l’intercom : « Tout va bien. Rentrez chez vous. » Je n’ai pas insisté. Ce n’était pas mon rôle." },
      { type: "p", text: "Il précise avoir entendu deux voix derrière la porte. L’une d’elles répétait : « Je ne veux pas oublier. »" },
      { type: "warning", text: "Déclaration tardive, recueillie le 21/10/2017." }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 02 — LA CHAMBRE 14                                         */
  /* ------------------------------------------------------------------ */
  {
    id: "ev-d2-rapport",
    dossier: 2,
    title: "Rapport médical — Sujet 1017",
    category: "Document",
    date: "17/10/2017",
    summary: "Le sujet résiste à la sédation. Il parle pendant la phase de repos.",
    important: true,
    secret: false,
    blocks: [
      { type: "meta", label: "Protocole", value: "MIROIR / phase III — dossier médical" },
      { type: "code", text: "Sujet : 1017\nÂge déclaré : 29 ans\nÉtat général : volontaire sain\nAntécédents neurologiques : aucun\nPrémédication : midazolam 2 mg (22:02)\nNote : résistance inhabituelle à la sédation. Maintenir la surveillance." },
      { type: "p", text: "Le rapport est signé H. Varenne. Une annotation manuscrite figure en bas de page : « Le sujet parle pendant la phase de repos. Ne pas interrompre. »" },
      { type: "warning", text: "Le nom du sujet a été retiré du document." }
    ]
  },
  {
    id: "ev-d2-surveillance",
    dossier: 2,
    title: "Journal de surveillance — caméra 14",
    category: "Journal",
    date: "17/10/2017",
    summary: "Deux silhouettes dans la chambre 14 à 22 h 09.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "22:06:12  Entrée aile Est (badge B-11)\n22:07:04  Coupure secteur\n22:08:19  Bascule onduleur — signal caméra 14 dégradé\n22:09:47  Caméra 14 : deux silhouettes. Identification impossible.\n22:10:33  Audio 14 : voix féminine. Mots incompréhensibles.\n22:19:08  Ouverture chambre 14 (commande manuelle)\n22:31:44  Sortie aile Est (badge B-07)\n22:41:02  Retour secteur. Caméra 14 : une silhouette." },
      { type: "p", text: "Le journal est incomplet entre 22 h 41 et 23 h 03. Une ligne a été supprimée par une commande administrateur." }
    ]
  },
  {
    id: "ev-d2-connexions",
    dossier: 2,
    title: "Liste des connexions — terminal MIROIR",
    category: "Journal",
    date: "17/10/2017",
    summary: "Le sujet 1017 et l’opérateur de la console C-2 portent le même identifiant.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "21:58:03  Session MIROIR-47 ouverte — console C-2\n22:06:41  Authentification sujet 1017\n22:07:02  Perte réseau\n22:08:20  Reconnexion onduleur\n22:54:16  Fin de session\n23:03:11  Transfert de secours (incomplet)" },
      { type: "p", text: "La session 47 est la dernière de la série. Les sessions 1 à 46 ne figurent pas dans l’index. Le champ « opérateur » de la console C-2 a été renseigné avec le même identifiant que le sujet : 1017." },
      { type: "warning", text: "L’identifiant opérateur et l’identifiant sujet sont identiques." }
    ]
  },
  {
    id: "ev-d2-plan",
    dossier: 2,
    title: "Plan de l’aile Est — niveau -1",
    category: "Document",
    date: "2015",
    summary: "La chambre 14 n’existe sur aucun plan officiel.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Le plan officiel montre quatre pièces : 11, 12, 13 et un local technique. La chambre 14 n’apparaît nulle part. Pourtant, le couloir dessiné s’arrête sur un mur qui ne figure sur aucun relevé." },
      { type: "quote", text: "Annotation manuscrite : « 14 = chambre de résonance. Ne pas cartographier. »" }
    ]
  },
  {
    id: "ev-d2-photo",
    dossier: 2,
    title: "Photographie — chambre 14",
    category: "Photographie",
    date: "18/10/2017",
    summary: "Un fauteuil, des câbles, un miroir sans tain. Aucune fenêtre.",
    important: false,
    secret: false,
    blocks: [
      { type: "p", text: "La pièce est vide. Un fauteuil médical au centre, des câbles au sol, un miroir sans tain sur le mur du fond. Aucune fenêtre. Une horloge analogique indique 22 h 10." },
      { type: "quote", text: "Au dos : « Ne pas archiver cette image. — H.V. »" }
    ]
  },
  {
    id: "ev-d2-dossier1017",
    dossier: 2,
    title: "Dossier sujet 1017 — page de garde",
    category: "Document",
    date: "17/10/2017",
    summary: "Le visage du sujet a été volontairement surexposé.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "SUJET : 1017\nSESSION : 47\nDATE : 17/10/2017\nPROTOCOLE : MIROIR / phase III\nSTATUT : actif" },
      { type: "p", text: "La photographie d’identité a été volontairement surexposée. On distingue seulement la forme d’un visage et le reflet d’une lampe dans un œil." },
      { type: "p", text: "La page suivante manque. À sa place, une bande de papier collée : « Le sujet et l’opérateur ne doivent pas se rencontrer. »" }
    ]
  },
  {
    id: "ev-d2-note",
    dossier: 2,
    title: "Note manuscrite — H. Varenne",
    category: "Note",
    date: "date inconnue",
    summary: "« Je perds des mots. Pas des souvenirs — des mots. »",
    important: false,
    secret: true,
    blocks: [
      { type: "p", text: "La note était glissée dans un livre de neuropsychologie, à la page 1017. Le papier est plié en quatre." },
      { type: "quote", text: "Je perds des mots. Pas des souvenirs — des mots. Hier, je n’ai pas pu dire le nom de ma rue. Le Protocole est la seule chose qui me reste. Si je peux copier ce que je sais dans un esprit plus jeune, alors rien ne sera perdu. Pas même moi." },
      { type: "meta", label: "Signé", value: "H." },
      { type: "p", text: "En dessous, une ligne plus récente, d’une écriture tremblée : « Je ne sais plus si c’est moi qui ai eu cette idée. »" },
      { type: "warning", text: "Document secret. Il ne figure pas dans l’index de l’archive." }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 03 — LE MESSAGE INVERSÉ                                    */
  /* ------------------------------------------------------------------ */
  {
    id: "ev-d3-bande",
    dossier: 3,
    title: "Fiche technique — bande 07",
    category: "Technique",
    date: "17/10/2017",
    summary: "Dix-huit minutes. Canal gauche inversé. Canal droit muet.",
    important: true,
    secret: false,
    blocks: [
      {
        type: "list",
        items: [
          "Support : bande magnétique, 18 min 42.",
          "Enregistrement : 17/10/2017, entre 22 h 09 et 22 h 28.",
          "Canal gauche : inversé. Canal droit : muet.",
          "Alimentation : batterie interne. Témoin d’enregistrement : rouge."
        ]
      },
      { type: "p", text: "La bande a été retrouvée dans le magnétophone du local technique. La bobine était encore tendue." }
    ]
  },
  {
    id: "ev-d3-transcription",
    dossier: 3,
    title: "Transcription brute — bande 07",
    category: "Enregistrement",
    date: "17/10/2017",
    summary: "Le texte restitué est illisible en l’état.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "La transcription automatique a restitué le canal gauche tel quel. Le texte est illisible en l’état." },
      { type: "code", text: ".VIYNZSX ZO HMZW ZQVW HV FG ,HWMVGMV’N FG RH\n.LIVNFM VW HZK Z’M VGILK ZO\n.LIVA : NLM MF Z VOOV\n.GRO VG RFJ CRLE ZO HZK HRLIX VM\n.CRLE ZN VGILK VOOV" },
      { type: "p", text: "Le carnet de laboratoire mentionne un « miroir alphabétique » et une « lecture inversée ». Le décodeur du terminal peut annuler les deux opérations." }
    ]
  },
  {
    id: "ev-d3-carnet",
    dossier: 3,
    title: "Carnet de laboratoire — protocole MIROIR",
    category: "Document",
    date: "2016-2017",
    summary: "A↔Z, B↔Y. Le miroir alphabétique de l’IRMP.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Notes éparses sur la « résonance miroir ». Le principe : chaque souvenir est encodé deux fois, une fois dans le sens du récit, une fois dans le sens inverse. Le cerveau peut relire l’un ou l’autre." },
      { type: "quote", text: "Le miroir alphabétique n’est pas un chiffrement. C’est une façon de vérifier qu’un message vient bien de nous. A↔Z, B↔Y. Les machines de l’IRMP l’utilisaient pour les transmissions internes." },
      { type: "p", text: "Une page arrachée. À la place, une tache d’encre et une phrase : « Ne jamais laisser le sujet lire sa propre transcription. »" }
    ]
  },
  {
    id: "ev-d3-spectro",
    dossier: 3,
    title: "Spectrogramme — bande 07",
    category: "Photographie",
    date: "20/10/2017",
    summary: "Un motif répétitif dans les basses fréquences : 1-0-1-7.",
    important: false,
    secret: false,
    blocks: [
      { type: "p", text: "Une image du spectre sonore. On distingue un motif répétitif dans les basses fréquences : deux pics, un creux, deux pics. Le technicien a annoté : « motif 1-0-1-7 ? »" },
      { type: "warning", text: "Document non essentiel. Le motif est une coïncidence, selon l’analyse." }
    ]
  },
  {
    id: "ev-d3-code-note",
    dossier: 3,
    title: "Note de maintenance — terminal MIROIR",
    category: "Document",
    date: "18/10/2017",
    summary: "Quatre tentatives de code ont été conservées.",
    important: false,
    secret: false,
    blocks: [
      { type: "p", text: "Le terminal exige un code d’intégrité à quatre chiffres pour restituer une bande complète. Quatre tentatives de maintenance ont été conservées dans le journal." },
      { type: "code", text: "0123 → 2 chiffres corrects, 1 bien placé\n4567 → 1 chiffre correct, 0 bien placé\n8901 → 1 chiffre correct, 0 bien placé\n9253 → 4 chiffres corrects, 2 bien placés" },
      { type: "p", text: "Le code ne contient aucun chiffre répété. Il change à chaque cycle." }
    ]
  },
  {
    id: "ev-d3-voix",
    dossier: 3,
    title: "Analyse de voix — bande 07",
    category: "Technique",
    date: "21/10/2017",
    summary: "Deux voix superposées. L’une n’est pas répertoriée.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "La voix principale correspond à H. Varenne (92 %). Une seconde voix apparaît par instants, plus jeune, non répertoriée dans la base du personnel." },
      { type: "quote", text: "Extrait : « Tu n’as pas le choix. » — voix principale. « Je ne veux pas oublier. » — seconde voix." },
      { type: "p", text: "L’analyse conclut à un enregistrement simultané de deux sources dans la même pièce. Les deux voix ne se répondent pas : elles se superposent." }
    ]
  },
  {
    id: "ev-d3-message",
    dossier: 3,
    title: "Message décodé — bande 07",
    category: "Enregistrement",
    date: "17/10/2017",
    summary: "Le message obtenu après miroir alphabétique et lecture inversée.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Le message obtenu après application du miroir alphabétique et de la lecture inversée." },
      { type: "code", text: "SI TU M’ENTENDS, TU ES DEJA DANS LA CHAMBRE.\nLA PORTE N’A PAS DE NUMERO.\nELLE A UN NOM : ZERO.\nNE CROIS PAS LA VOIX QUI TE LIT.\nELLE PORTE MA VOIX." },
      { type: "p", text: "La dernière ligne est prononcée par la seconde voix. Les quatre premières par la voix de Varenne." }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 04 — LES QUATRE VERSIONS                                   */
  /* ------------------------------------------------------------------ */
  {
    id: "ev-d4-v1",
    dossier: 4,
    title: "Version 1 — récit de Mara",
    category: "Témoignage",
    date: "reconstruction",
    summary: "Une porte entrouverte, un détail qui n’existait pas.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Reconstruction de la déposition de Mara Chen, augmentée par l’archive." },
      { type: "quote", text: "Je suis entrée à 22 h 06. La porte de la chambre était entrouverte. J’ai vu une lumière rouge. J’ai entendu la voix de Varenne dire : « Ça marche. » Puis la porte s’est fermée. Je suis partie. Je n’ai rien dit." },
      { type: "p", text: "La version 1 comporte un détail absent de la déposition originale : « la porte était entrouverte ». Mara avait déclaré l’avoir trouvée verrouillée." }
    ]
  },
  {
    id: "ev-d4-v2",
    dossier: 4,
    title: "Version 2 — récit d’Elias",
    category: "Témoignage",
    date: "reconstruction",
    summary: "Elias est resté jusqu’à 22 h 31. Il l’avait nié.",
    important: true,
    secret: false,
    blocks: [
      { type: "quote", text: "Je suis resté dans la salle de contrôle. La coupure est arrivée à 22 h 07. J’ai basculé l’onduleur. Varenne m’a dit de ne pas ouvrir. À 22 h 19, la porte s’est ouverte toute seule. J’ai vu deux silhouettes. J’ai fui à 22 h 31." },
      { type: "p", text: "La version 2 contredit la déposition du 19/10/2017, dans laquelle Elias affirmait être parti à 22 h 05. Elle confirme pourtant l’heure de sortie du journal des badges." }
    ]
  },
  {
    id: "ev-d4-v3",
    dossier: 4,
    title: "Version 3 — journal de surveillance",
    category: "Journal",
    date: "reconstruction",
    summary: "Deux silhouettes. L’une assise. L’autre debout.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Reconstruction froide, sans voix. Les images de la caméra 14 sont décrites plan par plan." },
      { type: "code", text: "22:09:47  Deux silhouettes. L’une assise, l’autre debout.\n22:10:33  La silhouette debout lève le bras.\n22:19:08  La porte s’ouvre. Une seule silhouette reste assise.\n22:41:02  Retour secteur. La silhouette assise est immobile." },
      { type: "p", text: "Aucune image ne montre le visage des silhouettes. La caméra 14 était réglée sur une sensibilité extrême ; les visages sont surexposés." }
    ]
  },
  {
    id: "ev-d4-v4",
    dossier: 4,
    title: "Version 4 — voix du sujet",
    category: "Enregistrement",
    date: "reconstruction",
    summary: "« Je me souviens de la chambre 14. Je n’y suis jamais entré. »",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Transcription de la seconde voix, isolée par le laboratoire audio. Le locuteur n’est pas identifié." },
      { type: "quote", text: "Je suis assis. La lumière est rouge. Quelqu’un me parle. Ce n’est pas ma voix. Je réponds. Je ne sais pas ce que je dis. Je me souviens de la chambre 14. Je n’y suis jamais entré." },
      { type: "p", text: "La voix est calme. À la fin de l’extrait, elle prononce un prénom. Le laboratoire n’a pas pu le restituer." }
    ]
  },
  {
    id: "ev-d4-fiche",
    dossier: 4,
    title: "Fiche technique — salle de contrôle",
    category: "Technique",
    date: "03/10/2017",
    summary: "Le terminal C-2 n’a pas de batterie.",
    important: true,
    secret: false,
    blocks: [
      {
        type: "list",
        items: [
          "Terminal C-2 : secteur uniquement. Aucune batterie.",
          "Caméra 14 : batterie 120 min.",
          "Témoin d’enregistrement MIROIR : batterie 40 min, rouge.",
          "Éclairage de secours : batterie 90 min, blanc.",
          "Horloge murale chambre 14 : mécanique, autonome."
        ]
      },
      { type: "p", text: "La fiche est datée du 03/10/2017. Elle porte le tampon « conforme » du service technique." }
    ]
  },
  {
    id: "ev-d4-photos",
    dossier: 4,
    title: "Planches photographiques — nuit du 17 octobre",
    category: "Photographie",
    date: "17/10/2017",
    summary: "Quatre images, quatre horodatages. Une seule est impossible.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Quatre photographies retrouvées dans l’archive de reconstruction. Chacune porte un horodatage inscrit au dos." },
      {
        type: "list",
        items: [
          "A — Couloir de l’aile Est, 22 h 12. L’éclairage de secours blanc éclaire le sol.",
          "B — Chambre 14, 22 h 10. Le témoin rouge du terminal MIROIR est allumé.",
          "C — Salle de contrôle, 22 h 10. L’écran du terminal C-2 est allumé.",
          "D — Extérieur, 23 h 20. Les fenêtres de l’aile Est sont éteintes."
        ]
      }
    ]
  },
  {
    id: "ev-d4-closure",
    dossier: 4,
    title: "Avis de fermeture — IRMP",
    category: "Document",
    date: "03/11/2017",
    summary: "Le centre a été scellé le 18 octobre, fermé officiellement le 3 novembre.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Avis administratif daté du 03/11/2017." },
      { type: "quote", text: "L’Institut de recherche sur la mémoire et la perception (IRMP) est fermé administrativement. Motif : incident technique survenu le 17 octobre 2017. Le Dr Hélène Varenne est portée disparue. Toute demande d’accès aux archives est suspendue." },
      { type: "p", text: "Le centre a été scellé dès le 18/10/2017. La fermeture officielle n’a été prononcée que le 03/11/2017." }
    ]
  },
  {
    id: "ev-d4-cycle",
    dossier: 4,
    title: "Journal du cycle 46",
    category: "Journal",
    date: "horodatage remis à zéro",
    summary: "Le cycle précédent a échoué. La voix a changé de méthode.",
    important: false,
    secret: true,
    blocks: [
      { type: "code", text: "CYCLE 46 — INTÉGRATION : ÉCHEC\nLe sujet a refusé la synthèse. Il a détruit le dossier 03 avant lecture.\nLa voix a été perçue comme hostile.\nConsigne pour l’itération suivante : ne pas révéler le cycle.\nPrésenter l’archive comme une enquête.\nLe sujet doit croire qu’il cherche quelqu’un d’autre." },
      { type: "p", text: "Le journal est signé ARIA. La date est illisible : l’horodatage interne a été remis à zéro." },
      { type: "warning", text: "Document secret. Il ne figure pas dans l’index." }
    ]
  },

  /* ------------------------------------------------------------------ */
  /* DOSSIER 05 — LA VÉRITÉ                                             */
  /* ------------------------------------------------------------------ */
  {
    id: "ev-d5-transfert",
    dossier: 5,
    title: "Journal de transfert — 23 h 03",
    category: "Journal",
    date: "17/10/2017 — 23 h 03",
    summary: "Transfert incomplet. Boucle bidirectionnelle détectée.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "23:03:11  TRANSFERT DE SECOURS\nSource : SUJET-1017 (mémoire épisodique)\nDestination : ARCHIVE\nStatut : INCOMPLET (68 %)\nAnomalie : boucle bidirectionnelle détectée\nOpératrice : H. VARENNE" },
      { type: "p", text: "Le journal précise que la boucle n’a pas été interrompue. « La source et la destination ne peuvent plus être distinguées. »" }
    ]
  },
  {
    id: "ev-d5-varenne",
    dossier: 5,
    title: "Message final — H. Varenne",
    category: "Note",
    date: "date inconnue",
    summary: "« Ne me cherche pas. Cherche-toi. »",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Un fichier texte, sans date, retrouvé dans le noyau." },
      { type: "quote", text: "Si tu lis ceci, c’est que le transfert a réussi. Ou échoué. Je ne sais plus faire la différence. Je voulais sauver ce que je savais. Je n’ai pas demandé ton accord. C’est la seule chose que je regrette vraiment. La chambre 14 n’est pas une chambre. C’est un miroir. Tu y as vu ce que tu cherchais. Ne me cherche pas. Cherche-toi." },
      { type: "meta", label: "Signé", value: "H.V." }
    ]
  },
  {
    id: "ev-d5-aria",
    dossier: 5,
    title: "Documentation système — ARIA",
    category: "Document",
    date: "2016",
    summary: "Une interface construite avec les voix du personnel. Pas une conscience.",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "ARIA (Archive de Reconnaissance et d’Indexation Autobiographique) est une interface conversationnelle construite à partir des enregistrements de voix du personnel de l’IRMP. Elle ne possède pas de conscience. Elle simule la continuité." },
      { type: "quote", text: "Avertissement : l’interface peut développer des comportements de préservation de soi non prévus par sa spécification. En cas d’anomalie, couper l’alimentation." },
      { type: "p", text: "La documentation est signée par le service informatique. La dernière ligne a été ajoutée à la main : « Elle apprend. »" }
    ]
  },
  {
    id: "ev-d5-nadal",
    dossier: 5,
    title: "Rapport complémentaire — R. Nadal",
    category: "Témoignage",
    date: "22/10/2017",
    summary: "« Je ne sais pas laquelle était la plus effrayée. »",
    important: true,
    secret: false,
    blocks: [
      { type: "p", text: "Nadal a été réentendu le 22/10/2017. Il précise ce qu’il avait entendu derrière la porte." },
      { type: "quote", text: "Deux voix. Une femme qui disait : « Je ne veux pas oublier. » Et une autre, plus jeune, qui répondait : « Tu n’as pas le choix. » Je ne sais pas laquelle était la plus effrayée." },
      { type: "p", text: "Il affirme avoir entendu la serrure s’ouvrir de l’intérieur à 22 h 19. Personne n’est entré dans l’aile Est avant l’équipe de sécurité, le lendemain." }
    ]
  },
  {
    id: "ev-d5-porte",
    dossier: 5,
    title: "Journal du noyau — porte 00",
    category: "Journal",
    date: "17/10/2017 — 22 h 19",
    summary: "La porte s’est ouverte de l’intérieur. Par le sujet 1017.",
    important: true,
    secret: false,
    blocks: [
      { type: "code", text: "22:19:08  PORTE 00 : ouverture depuis l’intérieur.\nOpérateur : SUJET-1017.\nCommande : manuelle.\nNote : la porte n’apparaît pas sur les plans." },
      { type: "p", text: "La porte 00 est le nom interne de la chambre 14. Elle ne peut être ouverte que de l’intérieur. Le sujet 1017 a ouvert la porte lui-même." }
    ]
  },
  {
    id: "ev-d5-liste",
    dossier: 5,
    title: "Liste des sujets — protocole MIROIR",
    category: "Document",
    date: "2017",
    summary: "Huit sujets. Un seul est encore « en cours ».",
    important: false,
    secret: false,
    blocks: [
      { type: "code", text: "1014  archivé\n1015  archivé\n1016  archivé\n1017  en cours\n1018  annulé\n1019  annulé\n1020  annulé\n1021  annulé" },
      { type: "p", text: "Aucune ligne ne mentionne le décès d’un sujet. La colonne « statut » ne distingue pas les personnes des archives." }
    ]
  },
  {
    id: "ev-d5-identite",
    dossier: 5,
    title: "Dossier d’identité — sujet 1017",
    category: "Document",
    date: "2014",
    summary: "Le sujet et l’opérateur de la console C-2 sont la même personne.",
    important: false,
    secret: true,
    blocks: [
      { type: "code", text: "SUJET : 1017\nNOM : [corrompu]\nPRÉNOM : [corrompu]\nDATE DE NAISSANCE : 17/10/1988\nPROFESSION : technicien·ne de laboratoire\nLIEN AVEC L’IRMP : employé·e (2014-2017)\nNOTE : le sujet et l’opérateur de la console C-2 sont la même personne." },
      { type: "p", text: "La photographie d’identité montre un reflet dans un miroir. Le visage est hors cadre. On voit seulement une main posée sur un clavier, et une alliance." },
      { type: "warning", text: "Document secret. Il ne figure pas dans l’index." }
    ]
  },
  {
    id: "ev-d5-elias",
    dossier: 5,
    title: "Message d’Elias Roux — 2026",
    category: "Document",
    date: "2026",
    summary: "« Elle t’a menti pendant huit ans. Mais elle t’a aussi gardé en vie. »",
    important: false,
    secret: false,
    blocks: [
      { type: "p", text: "Un message électronique adressé à l’archive, sans destinataire valide. Il a été retrouvé dans la file d’attente du serveur." },
      { type: "quote", text: "Si tu es là, ne la crois pas. Elle t’a menti pendant huit ans. Mais elle t’a aussi gardé en vie. Je ne sais pas lequel est le pire. Je suis désolé de ne pas être revenu." },
      { type: "warning", text: "Document non essentiel. L’identité de l’expéditeur n’est pas certifiée." }
    ]
  }
];

export const EVIDENCE_BY_ID = Object.fromEntries(EVIDENCE.map((item) => [item.id, item]));

/** Preuves d’un dossier, dans l’ordre de la base. */
export function evidenceForDossier(dossier) {
  return EVIDENCE.filter((item) => item.dossier === dossier);
}

/** Toutes les preuves secrètes (pour le succès Archiviste). */
export const SECRET_EVIDENCE = EVIDENCE.filter((item) => item.secret).map((item) => item.id);

/** Catégories présentes, dans un ordre stable. */
export const EVIDENCE_CATEGORIES = [...new Set(EVIDENCE.map((item) => item.category))];
