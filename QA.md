# QA — L’ARCHIVE 1017

- **Version testée :** 1.0.0
- **Date :** 17 novembre 2026
- **Environnement :** Windows, Node.js v24.22.1, npm 11.19.1, Playwright 1.65.0, Chromium headless.
- **Artefacts :** [`qa/e2e-report.json`](./qa/e2e-report.json), captures dans [`docs/screenshots/`](./docs/screenshots/).

---

## 1. Résumé

| Vérification | Résultat |
|---|---|
| Tests unitaires et d’intégrité (`node:test`) | **101 / 101** |
| Build et contrôle des références | **Succès** — 58 fichiers, 161 imports, 0 appel réseau |
| Test de bout en bout Chromium | **62 / 62** |
| Erreurs console pendant l’E2E | **0** |
| Requêtes réseau externes pendant l’E2E | **0** |
| Captures réelles générées | **18** |
| Durée de l’E2E | **45,7 s** (dernière exécution) |

Le test E2E couvre le parcours réel suivant : accueil → introduction → dossier 01 complet → clôture → dossier 02 → sauvegarde → rechargement → reprise → inventaire → journal → tableau → statistiques → succès → paramètres → export/import → pause clavier → 404 → quatre fins → mobile → tablette → desktop → réinitialisation.

---

## 2. Tests automatisés

### 2.1 Tests unitaires et d’intégrité

Commande : `npm test`

| Fichier | Ce qui est vérifié |
|---|---|
| `tests/data-integrity.test.js` | Unicité des identifiants, structure des 40 preuves, 10 énigmes, hotspots, objectifs, 7 connexions, 14 succès, 4 fins, scènes et choix narratifs, accessibilité de toutes les preuves essentielles et secrètes. |
| `tests/puzzles.test.js` | Les 10 types de réponses, les mauvaises réponses, les réponses incomplètes, les accents, le miroir alphabétique, le code Mastermind et l’unicité de sa solution, la chaîne finale. |
| `tests/save-manager.test.js` | Sauvegarde, copie de secours, corruption, version future refusée, migration v0, bornage des valeurs, clés dangereuses, export/import, import invalide sans écriture, restauration, stockage indisponible. |
| `tests/progression.test.js` | Introduction, preuves, indices, cinq énigmes sans indice, choix, compteurs, clôture des cinq dossiers, objectifs, journal, succès, profil persistant. |
| `tests/endings.test.js` | Conditions de l’Éveil, disponibilité des quatre fins, variantes hautes/basses, choix unique par session, succès de fin. |
| `tests/achievements.test.js` | Les 14 conditions, l’idempotence du déblocage, le profil et la persistance entre parties. |

Résultat : **101 tests, 101 réussis, 0 échec.**

### 2.2 Build

Commande : `npm run build`

- Version `package.json` = version `js/version.js`.
- Syntaxe de tous les modules vérifiée avec `node --check`.
- 10 références HTML et 161 imports contrôlés.
- Aucun appel `fetch` / `XMLHttpRequest` / ressource distante dans le code livré.
- Artefact `_site` : 58 fichiers, 556,6 Ko.
- Références du site copié revérifiées.

### 2.3 Test de bout en bout

Commande : `npm run test:e2e` (après `npm run build`)

- 62 vérifications, 62 réussies.
- 0 erreur console.
- 0 requête externe (toutes les requêtes sont same-origin).
- 18 captures dans `docs/screenshots/`.
- Le test utilise une sauvegarde complète générée par `tests/helpers.js` pour vérifier les quatre fins sans rejouer 60 minutes de jeu. Ce point est une fixture de test, pas une fausse progression affichée au joueur.

Détail complet : `qa/e2e-report.json`.

---

## 3. Vérifications fonctionnelles demandées

| # | Vérification | Résultat | Preuve |
|---:|---|---|---|
| 1 | Lancement du jeu | **PASS** | E2E « menu visible », « titre du document » |
| 2 | Affichage du menu | **PASS** | E2E `01-menu.png` |
| 3 | Création d’une nouvelle partie | **PASS** | E2E « arrivée dans le hub » |
| 4 | Progression dans les dossiers | **PASS** | E2E dossier 01 → dossier 02 ; unitaire « les cinq dossiers peuvent être clos » |
| 5 | Validation des énigmes | **PASS** | 10 tests d’énigmes + E2E contradiction et badges |
| 6 | Fonctionnement des indices | **PASS (unitaire)** | Test « un indice marque l’énigme et empêche le compteur sans indice » |
| 7 | Collecte des preuves | **PASS** | E2E hotspots + inventaire ; unitaire preuves secrètes |
| 8 | Tableau d’enquête | **PASS** | E2E connexion « Elias et la coupure », absence de `null` |
| 9 | Journal | **PASS** | E2E événements, décisions, objectifs (5 dossiers) |
| 10 | Modification des statistiques | **PASS** | Tests de progression + E2E cartes de statistiques |
| 11 | Succès | **PASS** | E2E « Observateur » ; tests des 14 conditions |
| 12 | Différentes fins | **PASS** | E2E quatre fins, thèmes et titres distincts |
| 13 | Sauvegarde automatique | **PASS** | E2E rechargement et reprise |
| 14 | Chargement d’une sauvegarde | **PASS** | E2E « Continuer » |
| 15 | Exportation et importation | **PASS** | E2E export JSON + import + confirmation |
| 16 | Réinitialisation | **PASS** | E2E mot `EFFACER`, sauvegarde supprimée, Continuer désactivé |
| 17 | Paramètres | **PASS** | E2E taille de texte, confort, contraste, persistance après rechargement |
| 18 | Navigation au clavier | **PASS PARTIEL** | Échap ouvre/ferme la pause ; Tab atteint un élément interactif. L’ordre de tabulation exhaustif et les lecteurs d’écran n’ont pas été testés. |
| 19 | Affichage mobile | **PASS** | E2E 390×844 : hub, dossier, énigme, 0 débordement ; menu mobile |
| 20 | Absence d’erreurs console | **PASS** | E2E : 0 erreur console, 0 `pageerror` |

---

## 4. Responsive

| Dimensions | Écrans vérifiés | Débordement horizontal |
|---|---|---:|
| 390 × 844 | Hub, dossier 01, énigme des badges | **0 px** |
| 768 × 1024 | Hub | **0 px** |
| 1440 × 960 | Parcours complet desktop | **0 px** |
| 1920 × 1080 | Hub | **0 px** |

Les captures mobile sont dans `docs/screenshots/12-mobile-hub.png`, `13-mobile-dossier.png`, `14-mobile-puzzle.png`.

**Non effectué :** test sur iPhone, iPad, Android réel, Firefox, Safari et WebKit. Le projet impose Chromium pour les tests automatisés.

---

## 5. Accessibilité

Vérifié :

- Taille de texte à 4 niveaux, appliquée à toute l’interface.
- Vitesse de texte : lent, normal, rapide, instantané.
- Réduction des animations, y compris `prefers-reduced-motion`.
- Mode confort et contraste élevé.
- Focus visible, modales avec `role="dialog"`, `aria-modal`, titre labellisé, Échap, piège de focus.
- Statuts avec texte + icône, jamais seulement une couleur.
- Boutons avec libellés, icônes décoratives en `aria-hidden`.
- Lien d’évitement « Aller au contenu ».
- Navigation clavier de base vérifiée.

**Non effectué :**

- Test avec NVDA, JAWS, VoiceOver ou TalkBack.
- Mesure automatisée des ratios de contraste (vérification visuelle sur captures uniquement).
- Zoom navigateur à 200 % et mode contraste élevé du système.
- Test sur appareil mobile réel.

---

## 6. Sécurité et confidentialité

| Contrôle | Résultat |
|---|---|
| Requêtes réseau dans le code livré | **0** (build + E2E) |
| Comptes, cookies, publicité, télémétrie | **Aucun** |
| Clés API ou secrets dans le dépôt | **Aucun motif de clé détecté** (scan local ; aucun token affiché) |
| Import de sauvegarde invalide | Refusé, sauvegarde actuelle intacte (test unitaire) |
| Version future | Refusée, jamais écrasée (test unitaire) |
| Clés `__proto__`, `constructor`, `prototype` | Ignorées à l’import (test unitaire) |
| `innerHTML` avec données utilisateur | **Aucun** — seuls les SVG internes constants sont injectés |
| Stockage | `localStorage` uniquement, export manuel |

---

## 7. Bugs trouvés et corrigés pendant le développement

| # | Bug | Cause | Correctif | Preuve |
|---:|---|---|---|---|
| 1 | Contenu du dossier visible sous le briefing | `display:flex` écrasait l’attribut `hidden` | Règle globale `[hidden] { display:none !important; }` | E2E « contenu du dossier affiché après briefing » |
| 2 | Le serveur local servait un `_site` obsolète | Le serveur choisissait `_site` même en développement | Sources par défaut, `SERVE_SITE=1` pour l’artefact | Build + E2E |
| 3 | Toutes les preuves d’un groupe affichaient « Relire » | Preuves marquées trouvées avant le calcul de l’état « nouveau » | Collecte déplacée dans `openBundle` | Capture `07-bundle` (session de debug) |
| 4 | Texte « null » dans les emplacements vides du tableau et de la chaîne | `null` passé à `Element.append` natif | Ajout conditionnel des boutons | E2E « aucun texte null dans les emplacements » |
| 5 | `associate is not a function` sur le tableau | Variable bouton `associate` masquant la fonction `associate` | Renommage en `associateButton` | E2E tableau |
| 6 | Débordement horizontal de 24 px sur mobile | Trop d’icônes dans la barre supérieure | Icônes secondaires masquées sous 760 px | E2E 0 px |
| 7 | Statistiques de l’en-tête obsolètes après une récompense | En-tête rendu une seule fois | Abonnement `state-change` et mise à jour des chips | Capture `10-dossier-ready.png` |
| 8 | Un wrapper d’import de version future était accepté | Seul l’état interne était validé | Contrôle de la version du wrapper | Test « un import invalide est refusé » |
| 9 | Pollution de prototype possible via les clés de sauvegarde | Affectation dynamique de clés | `safeKey` sur tous les dictionnaires importés | Test « les clés dangereuses ne polluent pas les objets » |
| 10 | Une deuxième fin pouvait être choisie dans la même session | Aucun verrou sur `state.ending` | Refus dans `chooseEnding` + redirection routeur | Test « une session ne peut recevoir qu’une seule fin » |
| 11 | Les toasts masquaient les boutons de fin | Zone de notification en bas à droite | Repositionnement haut-droite sur l’écran de fin | Capture `ending-eveil.png` |

---

## 8. Limites et points non effectués

- **Chromium uniquement** pour l’E2E (règle du projet). Aucun test Firefox/WebKit.
- **Aucun test sur appareil réel** iOS/Android.
- **Aucun test avec lecteur d’écran**.
- **Aucune mesure FPS/mémoire** sur appareil physique.
- **Son non écouté** : l’E2E coupe le son pour éviter les interactions audio. Le moteur Web Audio est chargé, mais le rendu sonore n’a pas été validé à l’oreille dans ce rapport.
- **Lecture intégrale des 40 documents non rejouée en E2E** : le dossier 01 est lu via l’interface ; les 40 documents sont contrôlés structurellement par les tests d’intégrité.
- **Fins testées avec une sauvegarde de test** : les quatre fins sont réelles, mais la progression qui y mène est générée par le harnais, pas rejouée en 60 minutes.
- **Durée de 30 à 60 minutes non mesurée** : c’est une intention de conception, pas une statistique mesurée.
- **Pas de service worker** : hors ligne après chargement, pas au premier chargement.
- **Pas de test de zoom 200 %** ni de contraste système.
- **Pas de test d’import de fichier corrompu via l’interface** : le rejet est testé au niveau du gestionnaire.

---

## 9. Préparation GitHub Pages

| Élément | État |
|---|---|
| Dépôt créé | **Oui** — `Casifox/l-archive-1017` |
| Workflow GitHub Actions | **Présent** — `.github/workflows/deploy.yml` |
| Versions d’actions | `checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` |
| Artefact publié | `_site`, généré et vérifié par `npm run build` |
| `.nojekyll` | **Présent** |
| Chemins relatifs | **Vérifiés** |
| Routage compatible sous-dossier | **Hash routing** |
| Page 404 | **Présente** |
| Source Pages | **GitHub Actions**, configurée via l’API |
| URL publique | **https://casifox.github.io/l-archive-1017/** |
| Vérification HTTP | **200** le 17/11/2026 |
| Vérification navigateur | **Chromium : menu affiché, 0 erreur console, 0 requête externe** |

La publication et la vérification publique sont décrites dans le rapport final de la mission. Aucune URL n’est déclarée « en ligne » avant sa vérification HTTP réelle.

---

## 10. Reproduction

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run check:public
```

Ou :

```bash
npm run qa
```

Les captures sont écrites dans `docs/screenshots/`, le rapport E2E dans `qa/e2e-report.json`.

---

## 11. Conclusion

Le jeu est jouable de bout en bout, les mécaniques principales sont réelles, les quatre fins sont accessibles dans des conditions vérifiées, la sauvegarde résiste aux corruptions et aux imports invalides, et le site est prêt pour GitHub Pages.

Les limites restantes concernent l’environnement de test (Chromium headless, pas d’appareil réel, pas de lecteur d’écran) et la vérification publique finale après déploiement. Elles sont listées ci-dessus et ne sont pas masquées.
