/**
 * Point d’entrée de L'ARCHIVE 1017.
 * Assemble les gestionnaires, les écrans et le routeur, puis lance
 * l’initialisation visuelle.
 */

import { SettingsStore } from "./settings.js";
import { SaveManager } from "./save-manager.js";
import { ProfileManager } from "./profile-manager.js";
import { GameState } from "./state.js";
import { AudioEngine } from "./audio.js";
import { Router } from "./router.js";
import { initToasts, showToast } from "./ui/toast.js";
import { runBoot } from "./ui/boot.js";
import { mountMenu } from "./ui/menu.js";
import { mountLoad } from "./ui/load.js";
import { mountIntro } from "./ui/intro.js";
import { mountHub } from "./ui/hub.js";
import { mountDossier, mountCloture } from "./ui/dossier.js";
import { mountPuzzle } from "./ui/puzzle.js";
import { mountInventory } from "./ui/inventory.js";
import { mountJournal } from "./ui/journal.js";
import { mountBoard } from "./ui/board.js";
import { mountAchievements } from "./ui/achievements.js";
import { mountStats } from "./ui/stats.js";
import { mountSettings } from "./ui/settings.js";
import { mountHelp } from "./ui/help.js";
import { mountCredits } from "./ui/credits.js";
import { mountFinale } from "./ui/finale.js";
import { mountEnding } from "./ui/ending.js";
import { mountNotFound } from "./ui/not-found.js";
import { VERSION } from "./version.js";

const appRoot = document.getElementById("app");
const bootRoot = document.getElementById("boot");
const toastRoot = document.getElementById("toast-root");

initToasts(toastRoot);

const settings = new SettingsStore();
const saveManager = new SaveManager();
const profileManager = new ProfileManager();
const gameState = new GameState({ saveManager, profileManager });
const audio = new AudioEngine({
  volume: settings.get().volume,
  enabled: settings.get().sound
});

let router = null;

const context = {
  gameState,
  settings,
  saveManager,
  profileManager,
  audio,
  version: VERSION,
  navigate: (path, options) => router?.navigate(path, options),
  refresh: () => router?.refresh()
};

const screens = {
  menu: { mount: mountMenu },
  charger: { mount: mountLoad },
  intro: { mount: mountIntro },
  hub: { mount: mountHub },
  dossier: { mount: (root, ctx) => mountDossier(root, ctx, "overview") },
  enquete: { mount: (root, ctx) => mountDossier(root, ctx, "investigation") },
  cloture: { mount: mountCloture },
  puzzle: { mount: mountPuzzle },
  preuves: { mount: mountInventory },
  journal: { mount: mountJournal },
  tableau: { mount: mountBoard },
  succes: { mount: mountAchievements },
  statistiques: { mount: mountStats },
  parametres: { mount: mountSettings },
  aide: { mount: mountHelp },
  credits: { mount: mountCredits },
  finale: { mount: mountFinale },
  fin: { mount: mountEnding },
  "not-found": { mount: mountNotFound }
};

router = new Router({
  root: appRoot,
  screens,
  context,
  fallbackScreen: screens["not-found"]
});

settings.subscribe((next) => {
  audio.setVolume(next.volume);
  audio.setEnabled(next.sound);
});

audio.attachUnlock(document);

gameState.on("achievement", (achievement) => {
  showToast(achievement.title, "achievement", {
    title: "Succès débloqué",
    duration: 6000
  });
  audio.play("achievement");
});

window.addEventListener("beforeunload", () => {
  if (gameState.isLoaded()) gameState.saveNow();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    if (gameState.isLoaded()) gameState.saveNow();
    audio.suspend();
  } else {
    audio.resume();
  }
});

router.start();
appRoot.hidden = false;

if (bootRoot) {
  runBoot({
    root: bootRoot,
    saveManager,
    settings,
    onDone: () => {
      document.body.classList.add("is-ready");
      bootRoot.remove();
      const main = appRoot.querySelector("main");
      main?.focus?.({ preventScroll: true });
    }
  });
} else {
  document.body.classList.add("is-ready");
}

// Exposé uniquement pour le confort de débogage local. Aucune donnée
// utilisateur, aucun secret, aucun appel réseau.
if (typeof window !== "undefined") {
  window.__ARCHIVE1017__ = {
    version: VERSION,
    get state() {
      return gameState.getState();
    },
    save: () => gameState.saveNow()
  };
}
