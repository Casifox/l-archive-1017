# Changelog

Toutes les évolutions notables de **L’ARCHIVE 1017** sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet utilise le versionnage sémantique.

## [1.0.0] — 2026-11-17

### Ajouté

- Jeu complet **L’ARCHIVE 1017** : introduction, cinq dossiers, conclusion et quatre fins.
- Cinq dossiers narratifs : Le Témoin, La Chambre 14, Le Message inversé, Les Quatre Versions, La Vérité.
- Dix énigmes jouables avec solution déterministe, deux indices progressifs et explication :
  - contradiction,
  - logique des badges,
  - chronologie,
  - registre des chambres,
  - miroir alphabétique,
  - code d’intégrité,
  - classement de preuves,
  - photographie impossible,
  - chaîne de preuves finale,
  - question d’identité.
- 40 documents (témoignages, journaux, rapports, photographies, notes, enregistrements), dont 3 documents secrets.
- Inventaire filtrable, journal automatique, tableau d’enquête avec 7 connexions valides.
- Statistiques narratives Confiance, Lucidité, Empathie, avec effets de choix et variantes de fins.
- 14 succès persistants dans un profil local.
- Quatre fins distinctes, dont une fin secrète conditionnée par les preuves, les secrets, les contradictions et la Lucidité.
- Sauvegarde versionnée avec copie de secours, récupération après corruption, export/import JSON vérifié et réinitialisation confirmée.
- Paramètres : volume, son, réduction des animations, taille de texte, vitesse du texte, mode confort, contraste élevé.
- Ambiance sonore et retours audio générés par Web Audio API, sans fichier externe.
- Interface responsive, navigation clavier, modales accessibles, lien d’évitement et focus visible.
- Page d’accueil immersive avec initialisation, art vectoriel et lecture de l’état du système.
- Page 404 autonome.
- Workflow GitHub Actions pour GitHub Pages.
- Documentation : README, QA, CONTRIBUTING, CHANGELOG, LICENSE.
- Tests : 101 tests unitaires et d’intégrité, 62 vérifications E2E dans Chromium, 18 captures réelles.

### Corrigé pendant le développement

- Contenu de dossier visible sous le briefing à cause de `display:flex` sur un élément `hidden`.
- Serveur de développement servant un artefact `_site` obsolète.
- Preuves d’un groupe toujours marquées « Relire ».
- Texte `null` dans les emplacements vides du tableau et de la chaîne de preuves.
- Collision de nom `associate` dans le tableau d’enquête.
- Débordement horizontal de 24 px sur mobile.
- Statistiques d’en-tête non actualisées après une récompense.
- Wrapper d’import de version future accepté.
- Clés de sauvegarde dangereuses (`__proto__`, `constructor`, `prototype`).
- Deuxième fin possible dans une même session.
- Notifications masquant les actions de l’écran de fin.

### Sécurité

- Aucune requête réseau dans le code livré.
- Aucun compte, cookie, traceur, publicité ou télémétrie.
- Validation et réparation des sauvegardes importées.
- Aucune injection de contenu utilisateur via `innerHTML`.
- Aucun secret ou clé API dans le dépôt.

### Limites connues

- Tests E2E uniquement sous Chromium.
- Pas de test sur appareil iOS/Android réel ni avec lecteur d’écran.
- Pas de mesure FPS/mémoire sur appareil physique.
- Pas de service worker.
- Les captures des fins utilisent une sauvegarde de test complète.
