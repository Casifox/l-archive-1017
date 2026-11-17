import test from "node:test";
import assert from "node:assert/strict";

import {
  BACKUP_KEY,
  CORRUPT_KEY,
  SAVE_KEY,
  SaveManager,
  createSafeStorage
} from "../js/save-manager.js";
import {
  GAME_ID,
  SAVE_VERSION,
  createInitialState,
  validateState
} from "../js/save-schema.js";
import { MockStorage, makeLegacyState } from "./helpers.js";

function freshManager(storage = new MockStorage()) {
  return { storage, manager: new SaveManager(storage) };
}

test("une sauvegarde neuve est valide et se relit à l’identique", () => {
  const { manager } = freshManager();
  const state = createInitialState();
  state.introDone = true;
  state.stats.lucidite = 5;
  state.evidence["ev-d1-elias"] = { found: true, foundAt: new Date().toISOString(), isNew: true };

  const saved = manager.save(state);
  assert.equal(saved.ok, true);
  const loaded = manager.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.source, "primary");
  assert.equal(loaded.state.introDone, true);
  assert.equal(loaded.state.stats.lucidite, 5);
  assert.equal(loaded.state.evidence["ev-d1-elias"].found, true);
});

test("une copie de secours est créée avant chaque écriture", () => {
  const { storage, manager } = freshManager();
  const first = createInitialState();
  first.stats.lucidite = 4;
  manager.save(first);

  const second = createInitialState();
  second.stats.lucidite = 7;
  manager.save(second);

  assert.ok(storage.getItem(BACKUP_KEY));
  const backup = JSON.parse(storage.getItem(BACKUP_KEY));
  assert.equal(backup.stats.lucidite, 4);
  assert.equal(manager.load().state.stats.lucidite, 7);
});

test("une sauvegarde principale corrompue restaure la copie de secours", () => {
  const { storage, manager } = freshManager();
  const first = createInitialState();
  first.introDone = true;
  manager.save(first);
  const second = createInitialState();
  second.introDone = true;
  second.stats.lucidite = 9;
  manager.save(second);

  storage.setItem(SAVE_KEY, "{ pas du json");
  const loaded = manager.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.source, "backup");
  assert.equal(loaded.recovered, true);
  assert.ok(storage.getItem(CORRUPT_KEY));
  assert.equal(storage.getItem(CORRUPT_KEY), "{ pas du json");
  assert.ok(storage.getItem(SAVE_KEY).includes(`"lucidite":${first.stats.lucidite}`));
});

test("deux sauvegardes corrompues échouent proprement en conservant les données", () => {
  const { storage, manager } = freshManager();
  storage.setItem(SAVE_KEY, "###");
  storage.setItem(BACKUP_KEY, "###");
  const loaded = manager.load();
  assert.equal(loaded.ok, false);
  assert.equal(loaded.reason, "invalid-json");
  assert.equal(storage.getItem(CORRUPT_KEY), "###");
});

test("une sauvegarde plus récente est refusée sans être écrasée", () => {
  const { storage, manager } = freshManager();
  const future = { ...createInitialState(), version: SAVE_VERSION + 1 };
  storage.setItem(SAVE_KEY, JSON.stringify(future));
  const loaded = manager.load();
  assert.equal(loaded.ok, false);
  assert.equal(loaded.reason, "newer-version");
  assert.equal(storage.getItem(SAVE_KEY), JSON.stringify(future));
});

test("une sauvegarde de version 0 est migrée", () => {
  const { storage, manager } = freshManager();
  storage.setItem(SAVE_KEY, JSON.stringify(makeLegacyState()));
  const loaded = manager.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.version, SAVE_VERSION);
  assert.equal(loaded.state.meta.game, GAME_ID);
  assert.equal(loaded.state.introDone, true);
  assert.deepEqual(loaded.state.unlockedDossiers, [1, 2]);
  assert.equal(loaded.state.stats.lucidite, 5);
});

test("les valeurs sont bornées et les dossiers incohérents réparés", () => {
  const raw = createInitialState();
  raw.introDone = true;
  raw.stats = { confiance: 99, lucidite: -5, empathie: 4.9 };
  raw.unlockedDossiers = [9, 1, 2, 2];
  raw.completedDossiers = [9, 2];
  raw.currentDossier = 9;
  raw.playTime = -10;
  raw.choices = [{ id: "x", label: "Choix", dossier: 1 }];
  const result = validateState(raw);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.stats, { confiance: 10, lucidite: 0, empathie: 4 });
  assert.deepEqual(result.state.unlockedDossiers, [1, 2]);
  assert.deepEqual(result.state.completedDossiers, [2]);
  assert.equal(result.state.currentDossier, 2);
  assert.equal(result.state.playTime, 0);
});

test("les clés dangereuses ne polluent pas les objets", () => {
  const raw = createInitialState();
  raw.flags = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"x":1},"safe":true}');
  raw.achievements = JSON.parse('{"__proto__":"2026-01-01T00:00:00.000Z","ok":"2026-01-01T00:00:00.000Z"}');
  raw.evidence = JSON.parse('{"__proto__":{"found":true},"ev-d1-elias":{"found":true}}');
  const result = validateState(raw);
  assert.equal(result.ok, true);
  assert.equal({}.polluted, undefined);
  assert.equal(result.state.flags.safe, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.state.flags, "__proto__"), false);
  assert.ok(result.state.achievements.ok);
  assert.equal(Object.prototype.hasOwnProperty.call(result.state.achievements, "__proto__"), false);
  assert.equal(result.state.evidence["ev-d1-elias"].found, true);
});

test("un état invalide n’est jamais écrit", () => {
  const { storage, manager } = freshManager();
  const good = createInitialState();
  manager.save(good);
  const before = storage.getItem(SAVE_KEY);
  const result = manager.save({ version: SAVE_VERSION, meta: { game: "AUTRE" }, foo: true });
  assert.equal(result.ok, false);
  assert.equal(storage.getItem(SAVE_KEY), before);
});

test("export et import font un aller-retour fidèle", () => {
  const { manager } = freshManager();
  const state = createInitialState();
  state.introDone = true;
  state.stats.empathie = 8;
  state.flags.selfRecognized = true;
  const text = manager.exportSave(state);
  const parsed = JSON.parse(text);
  assert.equal(parsed.game, GAME_ID);
  assert.equal(parsed.version, SAVE_VERSION);
  assert.ok(parsed.exportedAt);
  const imported = manager.importSave(text);
  assert.equal(imported.ok, true);
  assert.equal(imported.state.introDone, true);
  assert.equal(imported.state.stats.empathie, 8);
  assert.equal(imported.state.flags.selfRecognized, true);
});

test("un import invalide est refusé sans toucher au stockage", () => {
  const { storage, manager } = freshManager();
  const state = createInitialState();
  manager.save(state);
  const before = storage.getItem(SAVE_KEY);
  assert.equal(manager.importSave("pas du json").ok, false);
  assert.equal(manager.importSave(JSON.stringify({ game: "AUTRE", version: 1, state })).ok, false);
  assert.equal(manager.importSave(JSON.stringify({ game: GAME_ID, version: 99, state })).ok, false);
  assert.equal(manager.importSave(JSON.stringify({ game: GAME_ID, version: 1, state: { version: 1 } })).ok, false);
  assert.equal(storage.getItem(SAVE_KEY), before);
});

test("adopter une sauvegarde importée préserve l’ancienne en secours", () => {
  const { storage, manager } = freshManager();
  const oldState = createInitialState();
  oldState.introDone = true;
  oldState.stats.lucidite = 3;
  manager.save(oldState);
  const imported = createInitialState();
  imported.introDone = true;
  imported.stats.lucidite = 9;
  const adopted = manager.adopt(imported);
  assert.equal(adopted.ok, true);
  const backup = JSON.parse(storage.getItem(BACKUP_KEY));
  assert.equal(backup.stats.lucidite, 3);
  assert.equal(manager.load().state.stats.lucidite, 9);
});

test("la copie de secours peut être restaurée explicitement", () => {
  const { manager } = freshManager();
  const first = createInitialState();
  first.stats.lucidite = 2;
  manager.save(first);
  const second = createInitialState();
  second.stats.lucidite = 8;
  manager.save(second);
  const restored = manager.restoreBackup();
  assert.equal(restored.ok, true);
  assert.equal(manager.load().state.stats.lucidite, 2);
});

test("le stockage indisponible bascule en mémoire sans casser le jeu", () => {
  const broken = {
    getItem() {
      throw new Error("interdit");
    },
    setItem() {
      throw new Error("interdit");
    },
    removeItem() {
      throw new Error("interdit");
    }
  };
  const safe = createSafeStorage(broken);
  assert.equal(safe.available, false);
  const manager = new SaveManager(broken);
  assert.equal(manager.available, false);
  const state = createInitialState();
  state.introDone = true;
  assert.equal(manager.save(state).ok, true);
  assert.equal(manager.load().state.introDone, true);
});

test("le résumé de sauvegarde ne divulgue pas l’état complet", () => {
  const { manager } = freshManager();
  const state = createInitialState();
  state.introDone = true;
  state.completedDossiers = [1, 2];
  state.unlockedDossiers = [1, 2];
  state.stats.lucidite = 7;
  manager.save(state);
  const summary = manager.getSummary();
  assert.equal(summary.exists, true);
  assert.equal(summary.summary.completed, 2);
  assert.equal(summary.summary.lucidite, undefined);
  assert.ok(summary.dateLabel);
});
