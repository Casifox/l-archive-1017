/**
 * Paramètres d’affichage et d’audio.
 * Les réglages sont appliqués sur <html> avant le premier rendu et sont
 * conservés indépendamment de la partie en cours.
 */

import { nowIso } from "./save-schema.js";
import { createSafeStorage } from "./save-manager.js";

export const SETTINGS_KEY = "archive1017.settings.v1";
export const SETTINGS_VERSION = 1;

export const TEXT_SPEEDS = {
  slow: 55,
  normal: 26,
  fast: 12,
  instant: 0
};

export const DEFAULT_SETTINGS = {
  version: SETTINGS_VERSION,
  volume: 0.45,
  sound: true,
  reduceMotion: false,
  textSize: "md",
  textSpeed: "normal",
  comfort: false,
  highContrast: false
};

const TEXT_SIZES = ["sm", "md", "lg", "xl"];
const TEXT_SPEED_KEYS = Object.keys(TEXT_SPEEDS);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeSettings(raw) {
  const source = isObject(raw) ? raw : {};
  return {
    version: SETTINGS_VERSION,
    volume: Number.isFinite(Number(source.volume))
      ? Math.min(1, Math.max(0, Number(source.volume)))
      : DEFAULT_SETTINGS.volume,
    sound: typeof source.sound === "boolean" ? source.sound : DEFAULT_SETTINGS.sound,
    reduceMotion: typeof source.reduceMotion === "boolean" ? source.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    textSize: TEXT_SIZES.includes(source.textSize) ? source.textSize : DEFAULT_SETTINGS.textSize,
    textSpeed: TEXT_SPEED_KEYS.includes(source.textSpeed) ? source.textSpeed : DEFAULT_SETTINGS.textSpeed,
    comfort: typeof source.comfort === "boolean" ? source.comfort : DEFAULT_SETTINGS.comfort,
    highContrast: typeof source.highContrast === "boolean" ? source.highContrast : DEFAULT_SETTINGS.highContrast
  };
}

export class SettingsStore {
  constructor(storage = globalThis.localStorage, root = globalThis.document?.documentElement) {
    const safe = createSafeStorage(storage);
    this.storage = safe.storage;
    this.available = safe.available;
    this.root = root;
    this.listeners = new Set();
    this.settings = this._load();
    this.apply();
  }

  _load() {
    try {
      const raw = this.storage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return sanitizeSettings(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  save() {
    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      return true;
    } catch {
      return false;
    }
  }

  apply() {
    if (!this.root) return;
    this.root.dataset.textSize = this.settings.textSize;
    this.root.dataset.motion = this.settings.reduceMotion ? "reduced" : "full";
    this.root.dataset.comfort = this.settings.comfort ? "on" : "off";
    this.root.dataset.contrast = this.settings.highContrast ? "high" : "normal";
    this.root.style.colorScheme = "dark";
  }

  get() {
    return { ...this.settings };
  }

  getTextDelay() {
    return TEXT_SPEEDS[this.settings.textSpeed] ?? TEXT_SPEEDS.normal;
  }

  update(patch) {
    this.settings = sanitizeSettings({ ...this.settings, ...patch, version: SETTINGS_VERSION });
    this.apply();
    this.save();
    for (const listener of this.listeners) {
      try {
        listener(this.get());
      } catch (error) {
        console.error("Erreur d’un abonné aux paramètres", error);
      }
    }
    return this.get();
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.apply();
    this.save();
    for (const listener of this.listeners) listener(this.get());
    return this.get();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  meta() {
    return { updatedAt: nowIso(), storage: this.available ? "localStorage" : "mémoire" };
  }
}
