# Contribuer à L’ARCHIVE 1017

Merci de vouloir améliorer l’archive. Ce projet est volontairement simple : **HTML, CSS et JavaScript natif**, sans framework et sans dépendance d’exécution.

## Règles de base

1. **Ne pas inventer de contenu présenté comme réel.** Toute statistique, URL, citation ou fonctionnalité doit exister et être vérifiable.
2. **Ne pas modifier le gameplay sans raison documentée.** Une correction de bug ou une amélioration de conception doit être expliquée dans la pull request et, si elle est structurante, dans `CHANGELOG.md`.
3. **Ne pas casser les sauvegardes.** Toute modification du schéma doit être versionnée et migrée dans `js/save-schema.js`.
4. **Rester sans dépendance d’exécution.** Pas de React, Vue, bibliothèque d’animation lourde ou service externe.
5. **Préserver l’accessibilité.** Libellés, focus visible, contrastes, textes non porteurs d’information uniquement par la couleur.
6. **Tester réellement.** Ne pas déclarer un correctif terminé sans exécuter les tests concernés.

## Installation et commandes

```bash
npm install                 # Playwright, uniquement pour les tests
npm run serve               # http://127.0.0.1:4173/
npm test                    # tests unitaires et d’intégrité
npm run build               # construit _site et vérifie les références
npm run test:e2e            # nécessite _site et Chromium
npm run qa                  # tout
```

Le jeu doit être servi en HTTP (modules ES), pas ouvert en `file://`.

## Architecture

- `data/` contient le contenu : histoire, dossiers, preuves, énigmes, connexions, succès, fins.
- `js/` contient le moteur : état, sauvegarde, routeur, validation, audio.
- `js/ui/` contient les écrans. Aucun écran ne doit modifier directement `gameState.state`.
- `css/` contient les styles, séparés par rôle.
- `tests/` contient les tests unitaires et le test E2E.

### Ajouter une preuve

1. Ajouter un objet dans `data/evidence.js` avec un `id` unique, un `dossier`, un titre, une catégorie, un résumé et des blocs (`p`, `quote`, `code`, `meta`, `list`, `warning`).
2. La référencer dans un hotspot de `data/dossiers.js` ou dans les récompenses d’une énigme.
3. Vérifier qu’elle est accessible : `npm test` contrôle les preuves essentielles et secrètes.
4. Ne jamais mettre de HTML dans les blocs : le rendu est fait avec des nœuds texte.

### Ajouter une énigme

1. Ajouter un objet dans `data/puzzles.js` avec `id`, `dossier`, `type`, `title`, `context`, `instructions`, `data`, `solution`, `hints` (exactement 2), `explanation`, `rewards`.
2. Utiliser un type existant : `pair`, `assign`, `order`, `classify`, `single`, `cipher`, `mastermind`, `chain`.
3. Ajouter l’identifiant dans `puzzles` du dossier concerné.
4. Ajouter un test dans `tests/puzzles.test.js` avec la bonne réponse, une mauvaise réponse et une réponse incomplète.
5. Vérifier l’unicité de la solution si l’énigme est de type `assign` ou `mastermind`.

### Ajouter une connexion

1. Ajouter une paire dans `data/connections.js` avec deux preuves existantes.
2. Vérifier qu’elle n’est pas un doublon (le test d’intégrité le contrôle).
3. Le nombre total de connexions est utilisé par le succès `cartographe` ; mettre à jour les tests si le total change.

### Ajouter un succès

1. Ajouter les métadonnées dans `data/achievements.js`.
2. Ajouter la condition dans `ACHIEVEMENT_CONDITIONS` (`js/achievements.js`).
3. Ajouter un test dans `tests/achievements.test.js`.

### Ajouter une fin

1. Ajouter les données dans `data/endings.js`.
2. Mettre à jour `js/endings.js` si la condition est nouvelle.
3. Tester la disponibilité et la résolution dans `tests/endings.test.js`.
4. Vérifier que l’écran de fin reste lisible sur mobile.

## Style de code

- Modules ES, pas de variables globales.
- Indentation 2 espaces, points-virgules.
- Noms de fonctions et variables en anglais, textes du jeu en français.
- Utiliser `h()` et les nœuds texte ; ne jamais injecter de contenu utilisateur avec `innerHTML`.
- Nettoyer les écouteurs et les timers dans les fonctions de destruction d’écran.
- Éviter les animations coûteuses ; respecter `prefers-reduced-motion`.

## Sauvegarde

Toute évolution du schéma doit :

- incrémenter `SAVE_VERSION` dans `js/save-schema.js` ;
- ajouter une migration ;
- refuser une sauvegarde future sans l’écraser ;
- conserver une copie de secours ;
- ajouter un test de migration et de corruption.

## Tests avant une pull request

```bash
npm test
npm run build
npm run test:e2e
```

Vérifier aussi :

- aucune erreur console ;
- aucune requête externe ;
- pas de débordement horizontal à 390 px ;
- les quatre fins restent accessibles dans un état complet ;
- le texte français ne contient pas de placeholder.

## Commits

- Commits ciblés, message clair au présent.
- Ne pas committer `node_modules/`, `_site/`, `qa/artifacts/` ni de fichier de configuration personnel.
- Ne pas inclure de token, clé ou identifiant.
- Ne pas utiliser `git push --force`.

## Licence

En contribuant, vous acceptez que votre contribution soit publiée sous licence MIT.
