#!/usr/bin/env node
/**
 * Test de bout en bout réel dans Chromium.
 * Prérequis : `npm run build` (sert _site) et Playwright Chromium installé.
 *
 * Couvre : accueil, introduction, dossier 01 complet, sauvegarde/rechargement,
 * inventaire, journal, tableau, statistiques, succès, paramètres, export/import,
 * pause, 404, quatre fins, mobile, absence d’erreur console et de requête externe.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../scripts/serve.mjs";
import { buildCompletedState } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const site = path.join(root, "_site");
const screenshots = path.join(root, "docs", "screenshots");
const artifacts = path.join(root, "qa", "artifacts");
fs.mkdirSync(screenshots, { recursive: true });
fs.mkdirSync(artifacts, { recursive: true });

if (!fs.existsSync(path.join(site, "index.html"))) {
  console.error("ÉCHEC : _site/index.html est absent. Lancez `npm run build` avant le test E2E.");
  process.exit(1);
}

const SETTINGS = {
  version: 1,
  volume: 0,
  sound: false,
  reduceMotion: true,
  textSize: "md",
  textSpeed: "instant",
  comfort: false,
  highContrast: false
};

const results = [];
const consoleErrors = [];
const externalRequests = [];
const screenshotsTaken = [];
const startedAt = Date.now();
let liveBrowser = null;
let liveServer = null;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  results.push({ name, ok, detail });
  if (!ok) throw new Error(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function shot(page, name) {
  const file = path.join(screenshots, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  screenshotsTaken.push(`docs/screenshots/${name}.png`);
}

function watch(page, label, origin) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${label}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`${label}: ${error.message}`);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!/^https?:/i.test(url)) return;
    try {
      const parsed = new URL(url);
      if (parsed.origin !== origin) externalRequests.push(`${label}: ${url}`);
    } catch {
      // URL non analysable : ignorée.
    }
  });
}

async function enterApp(page) {
  const enter = page.locator('[data-testid="boot-enter"]');
  await enter.waitFor({ state: "visible", timeout: 15000 });
  await enter.click();
  await page.waitForTimeout(450);
}

async function waitHash(page, hash, timeout = 8000) {
  await page.waitForFunction((expected) => window.location.hash === expected, hash, { timeout });
}

async function playDialogue(page, stop, max = 160) {
  for (let index = 0; index < max; index += 1) {
    if (await stop()) return;
    const choice = page.locator(".choice-btn:not([disabled])").first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
      await page.waitForTimeout(40);
      continue;
    }
    const next = page.locator('[data-testid="dialogue-next"]:not([disabled])').first();
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(60);
  }
  throw new Error("Dialogue non terminé dans le délai imparti.");
}

async function closeModal(page) {
  const evidenceClose = page.locator('[data-testid="evidence-close"]');
  if (await evidenceClose.isVisible().catch(() => false)) {
    await evidenceClose.click();
  } else {
    const buttons = page.locator(".modal-overlay:last-of-type .modal-footer button");
    if (await buttons.count()) await buttons.last().click();
  }
  await page.waitForTimeout(160);
}

async function openHash(page, hash) {
  await page.evaluate((target) => {
    window.location.hash = target;
  }, hash);
  await page.waitForTimeout(380);
}

async function main() {
  const server = await startServer({ port: 0, root: site });
  const origin = new URL(server.url).origin;
  const browser = await chromium.launch({ headless: true });
  liveBrowser = browser;
  liveServer = server;
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await context.addInitScript((settings) => {
    if (!localStorage.getItem("archive1017.settings.v1")) {
      localStorage.setItem("archive1017.settings.v1", JSON.stringify(settings));
    }
  }, SETTINGS);
  const page = await context.newPage();
  watch(page, "desktop", origin);

  // ------------------------------------------------------------------
  // Accueil et introduction
  // ------------------------------------------------------------------
  await page.goto(server.url, { waitUntil: "networkidle" });
  await enterApp(page);
  check("menu visible", await page.locator(".menu-screen").isVisible());
  check("titre du document", (await page.title()).includes("Accueil"));
  check("nouvelle partie disponible", await page.locator('[data-testid="new-game"]').isEnabled());
  check("continuer désactivé sans sauvegarde", await page.locator('[data-testid="continue-game"]').isDisabled());
  await shot(page, "01-menu");

  await page.locator('[data-testid="new-game"]').click();
  await waitHash(page, "#/intro");
  await playDialogue(page, async () => page.url().includes("#/hub"));
  await page.waitForTimeout(450);
  check("arrivée dans le hub", page.url().includes("#/hub"));
  check("dossier 01 disponible", await page.locator('[data-testid="dossier-card-1"]').isEnabled());
  check("dossier 02 verrouillé", await page.locator('[data-testid="dossier-card-2"]').isDisabled());
  await shot(page, "02-hub");

  // ------------------------------------------------------------------
  // Dossier 01 complet
  // ------------------------------------------------------------------
  await page.locator('[data-testid="dossier-card-1"]').click();
  await waitHash(page, "#/dossier/1");
  await playDialogue(page, async () =>
    page.locator(".briefing").evaluate((element) => element.hidden).catch(() => false)
  );
  await page.waitForTimeout(400);
  check("contenu du dossier affiché après briefing", await page.locator(".dossier-content").isVisible());
  await shot(page, "03-dossier");

  for (const hotspot of ["hs-d1-depositions", "hs-d1-bureau", "hs-d1-terminal", "hs-d1-elec", "hs-d1-photo"]) {
    await page.locator(`[data-testid="hotspot-${hotspot}"]`).click();
    await page.waitForTimeout(180);
    await closeModal(page);
  }

  await openHash(page, "#/enigme/d1-contradiction");
  await page.locator('[data-testid="pair-elias-noir"]').click();
  await page.locator('[data-testid="pair-coupure-2207"]').click();
  await page.locator('[data-testid="puzzle-submit"]').click();
  await page.waitForTimeout(450);
  check("énigme de contradiction résolue", await page.locator(".puzzle-solved").isVisible());
  await shot(page, "04-puzzle");

  await openHash(page, "#/enigme/d1-badges");
  await page.locator('[data-testid="assign-varenne-badge"]').selectOption("B-04");
  await page.locator('[data-testid="assign-elias-badge"]').selectOption("B-07");
  await page.locator('[data-testid="assign-mara-badge"]').selectOption("B-11");
  await page.locator('[data-testid="assign-nadal-badge"]').selectOption("B-19");
  await page.locator('[data-testid="puzzle-submit"]').click();
  await page.waitForTimeout(450);
  check("énigme des badges résolue", await page.locator(".puzzle-solved").isVisible());

  await openHash(page, "#/dossier/1");
  await page.waitForTimeout(350);
  check("bouton de clôture disponible", await page.locator('[data-testid="close-dossier"]').isVisible());
  await page.locator('[data-testid="close-dossier"]').click();
  await page.waitForTimeout(220);
  await page.locator('[data-testid="confirm-accept"]').click();
  await waitHash(page, "#/dossier/1/cloture");
  await playDialogue(page, async () => page.url().includes("#/dossier/2"));
  await page.waitForTimeout(400);
  check("dossier 02 débloqué", page.url().includes("#/dossier/2"));
  const savedAfterD1 = await page.evaluate(() => JSON.parse(localStorage.getItem("archive1017.save.v1")));
  check("dossier 01 marqué clos", savedAfterD1.completedDossiers.includes(1));
  check("dossier 02 déverrouillé dans la sauvegarde", savedAfterD1.unlockedDossiers.includes(2));

  // ------------------------------------------------------------------
  // Sauvegarde, rechargement, continuation
  // ------------------------------------------------------------------
  await page.reload({ waitUntil: "networkidle" });
  await enterApp(page);
  await openHash(page, "#/menu");
  await page.waitForTimeout(300);
  check("continuer actif après sauvegarde", await page.locator('[data-testid="continue-game"]').isEnabled());
  check("carte de reprise visible", await page.locator('[data-testid="resume-card"]').isVisible());
  await page.locator('[data-testid="continue-game"]').click();
  await waitHash(page, "#/hub");
  await page.waitForTimeout(450);
  check("reprise dans le hub", page.url().includes("#/hub"));
  const statusClass = await page.locator('[data-testid="dossier-card-1"] .status-chip').getAttribute("class");
  check("dossier 01 clos après rechargement", statusClass.includes("status-chip--done"));

  // ------------------------------------------------------------------
  // Inventaire, journal, tableau, statistiques, succès
  // ------------------------------------------------------------------
  await openHash(page, "#/preuves");
  check("inventaire alimenté", (await page.locator(".evidence-card").count()) >= 9);
  await page.locator('[data-testid="evidence-search"]').fill("Elias");
  await page.waitForTimeout(250);
  check("recherche d’une preuve", (await page.locator(".evidence-card").count()) === 1);
  await page.locator('[data-testid="evidence-search"]').fill("");
  await page.waitForTimeout(200);
  await shot(page, "05-inventory");

  await openHash(page, "#/journal");
  check("journal des événements", (await page.locator(".journal-entry").count()) > 0);
  await page.locator('[data-testid="journal-tab-choices"]').click();
  await page.waitForTimeout(200);
  check("journal des décisions", (await page.locator(".choice-log").count()) >= 2);
  await shot(page, "06-journal");
  await page.locator('[data-testid="journal-tab-objectives"]').click();
  await page.waitForTimeout(200);
  check("journal des objectifs", (await page.locator(".objective-dossier").count()) === 5);

  await openHash(page, "#/tableau");
  await page.locator('[data-testid="board-evidence-ev-d1-elias"]').click();
  await page.locator('[data-testid="board-evidence-ev-d1-electrique"]').click();
  await page.locator('[data-testid="board-associate"]').click();
  await page.waitForTimeout(400);
  check("connexion du tableau découverte", (await page.locator(".connection-card").count()) === 1);
  check("aucun texte null dans les emplacements", !(await page.locator(".board-slot").allInnerTexts()).join(" ").includes("null"));
  await shot(page, "07-board");

  await openHash(page, "#/statistiques");
  check("trois cartes de statistiques", (await page.locator(".stat-card").count()) === 3);
  await shot(page, "08-stats");

  await openHash(page, "#/succes");
  check("succès Observateur débloqué", (await page.locator('[data-testid="achievement-observateur"]').getAttribute("class")).includes("is-unlocked"));
  check("panneau des fins présent", await page.locator(".endings-panel").isVisible());
  await shot(page, "09-achievements");

  // ------------------------------------------------------------------
  // Paramètres et persistance
  // ------------------------------------------------------------------
  await openHash(page, "#/parametres");
  await page.locator('[data-testid="text-size-lg"]').click();
  await page.locator('[data-testid="comfort-mode"]').click();
  await page.locator('[data-testid="high-contrast"]').click();
  await page.waitForTimeout(200);
  const settingsState = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  check("taille de texte appliquée", settingsState.textSize === "lg");
  check("mode confort appliqué", settingsState.comfort === "on");
  check("contraste élevé appliqué", settingsState.contrast === "high");
  await page.reload({ waitUntil: "networkidle" });
  await enterApp(page);
  const persisted = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  check("paramètres persistés après rechargement", persisted.textSize === "lg" && persisted.comfort === "on" && persisted.contrast === "high");
  await openHash(page, "#/parametres");
  await page.locator('[data-testid="text-size-md"]').click();
  await page.locator('[data-testid="comfort-mode"]').click();
  await page.locator('[data-testid="high-contrast"]').click();
  await page.waitForTimeout(200);

  // ------------------------------------------------------------------
  // Export / import
  // ------------------------------------------------------------------
  await openHash(page, "#/charger");
  await page.waitForTimeout(300);
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-testid="load-export"]').click();
  const download = await downloadPromise;
  const exportPath = path.join(artifacts, "export-e2e.json");
  await download.saveAs(exportPath);
  const exported = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  check("export au bon format", exported.game === "L-ARCHIVE-1017" && exported.version === 1 && Boolean(exported.state));
  await page.locator('[data-testid="load-import-file"]').setInputFiles({
    name: "import-e2e.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported))
  });
  await page.waitForTimeout(350);
  await page.locator('[data-testid="confirm-accept"]').click();
  await waitHash(page, "#/hub");
  await page.waitForTimeout(350);
  check("import adopté et hub restauré", page.url().includes("#/hub"));

  // ------------------------------------------------------------------
  // Pause clavier et 404
  // ------------------------------------------------------------------
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  check("pause ouverte par Échap", await page.locator('[data-testid="pause-modal"]').isVisible());
  await page.locator('[data-testid="pause-resume"]').click();
  await page.waitForTimeout(300);
  check("pause refermée", !(await page.locator('[data-testid="pause-modal"]').isVisible().catch(() => false)));

  await page.keyboard.press("Tab");
  await page.waitForTimeout(120);
  const focusTag = await page.evaluate(() => document.activeElement?.tagName || "");
  check("navigation clavier — focus sur un élément interactif", ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(focusTag), focusTag);

  await openHash(page, "#/route-inconnue");
  check("écran 404 interne", await page.locator(".notfound").isVisible());
  await shot(page, "10-404");

  // ------------------------------------------------------------------
  // Les quatre fins
  // ------------------------------------------------------------------
  const completed = buildCompletedState({ stats: 9 }).state;
  const endingThemes = { publier: "dawn", detruire: "silence", gardien: "endless", eveil: "awakening" };
  const endingTitles = {
    publier: "LA VÉRITÉ PUBLIQUE",
    detruire: "LE SILENCE",
    gardien: "LE GARDIEN",
    eveil: "L’ÉVEIL"
  };

  for (const [endingId, theme] of Object.entries(endingThemes)) {
    const endingContext = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    await endingContext.addInitScript(
      ({ settings, save }) => {
        localStorage.setItem("archive1017.settings.v1", JSON.stringify(settings));
        localStorage.setItem("archive1017.save.v1", save);
      },
      { settings: SETTINGS, save: JSON.stringify(completed) }
    );
    const endingPage = await endingContext.newPage();
    watch(endingPage, `fin-${endingId}`, origin);
    await endingPage.goto(`${server.url}#/finale`, { waitUntil: "networkidle" });
    await enterApp(endingPage);
    await endingPage.waitForTimeout(350);
    check(`finale — carte ${endingId}`, await endingPage.locator(`[data-testid="ending-choice-${endingId}"]`).isVisible());
    if (endingId === "publier") await shot(endingPage, "11-finale");
    await endingPage.locator(`[data-testid="ending-choose-${endingId}"]`).click();
    await endingPage.waitForTimeout(220);
    await endingPage.locator('[data-testid="confirm-accept"]').click();
    await endingPage.waitForURL(`**/#/fin/${endingId}`, { timeout: 8000 });
    await endingPage.waitForTimeout(550);
    const endingClass = await endingPage.locator(".ending-screen").getAttribute("class");
    check(`fin ${endingId} — thème`, endingClass.includes(`ending-screen--${theme}`));
    check(`fin ${endingId} — titre`, (await endingPage.locator(".ending-title").innerText()) === endingTitles[endingId]);
    const profile = await endingPage.evaluate(() => JSON.parse(localStorage.getItem("archive1017.profile.v1")));
    check(`fin ${endingId} — profil`, Boolean(profile.endings[endingId]));
    await shot(endingPage, `ending-${endingId}`);
    await endingContext.close();
  }

  // ------------------------------------------------------------------
  // Mobile
  // ------------------------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  await openHash(page, "#/hub");
  await page.waitForTimeout(350);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile — pas de débordement horizontal (hub)", overflow <= 1, `débordement ${overflow}px`);
  await page.locator(".nav-toggle").click();
  await page.waitForTimeout(180);
  check("mobile — menu de navigation", await page.locator(".topbar-nav").isVisible());
  await shot(page, "12-mobile-hub");
  await page.locator(".nav-toggle").click();
  await page.waitForTimeout(150);

  await openHash(page, "#/dossier/1");
  await page.waitForTimeout(350);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile — pas de débordement horizontal (dossier)", overflow <= 1, `débordement ${overflow}px`);
  await shot(page, "13-mobile-dossier");

  await openHash(page, "#/enigme/d1-badges");
  await page.waitForTimeout(350);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile — pas de débordement horizontal (énigme)", overflow <= 1, `débordement ${overflow}px`);
  await shot(page, "14-mobile-puzzle");

  await page.setViewportSize({ width: 768, height: 1024 });
  await openHash(page, "#/hub");
  await page.waitForTimeout(300);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("tablette 768×1024 — pas de débordement", overflow <= 1, `débordement ${overflow}px`);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await openHash(page, "#/hub");
  await page.waitForTimeout(300);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("desktop 1920×1080 — pas de débordement", overflow <= 1, `débordement ${overflow}px`);

  // Réinitialisation réelle de la progression (dernière opération destructive)
  await page.setViewportSize({ width: 1440, height: 960 });
  await openHash(page, "#/parametres");
  await page.waitForTimeout(300);
  await page.locator('[data-testid="reset-progress"]').click();
  await page.waitForTimeout(250);
  await page.locator('[data-testid="confirm-word-input"]').fill("EFFACER");
  await page.locator('[data-testid="confirm-word-accept"]').click();
  await waitHash(page, "#/menu");
  await page.waitForTimeout(350);
  const saveAfterReset = await page.evaluate(() => localStorage.getItem("archive1017.save.v1"));
  check("réinitialisation — sauvegarde supprimée", saveAfterReset === null);
  check("réinitialisation — continuer désactivé", await page.locator('[data-testid="continue-game"]').isDisabled());

  if (consoleErrors.length) throw new Error(`Erreurs console : ${consoleErrors.join(" | ")}`);
  if (externalRequests.length) throw new Error(`Requêtes externes : ${externalRequests.join(" | ")}`);

  const report = {
    ok: true,
    checks: results.length,
    passed: results.filter((entry) => entry.ok).length,
    consoleErrors,
    externalRequests,
    screenshots: screenshotsTaken,
    durationMs: Date.now() - startedAt,
    results
  };
  fs.writeFileSync(path.join(root, "qa", "e2e-report.json"), JSON.stringify(report, null, 2));
  console.log(`E2E : ${report.passed}/${report.checks} vérifications réussies.`);
  console.log(`Captures : ${screenshotsTaken.length}. Erreurs console : 0. Requêtes externes : 0.`);
  console.log(`Durée : ${(report.durationMs / 1000).toFixed(1)} s.`);
}

main()
  .then(async () => {
    if (liveBrowser) await liveBrowser.close().catch(() => {});
    if (liveServer) await liveServer.close().catch(() => {});
  })
  .catch(async (error) => {
    if (liveBrowser) await liveBrowser.close().catch(() => {});
    if (liveServer) await liveServer.close().catch(() => {});
    const report = {
      ok: false,
      checks: results.length,
      passed: results.filter((entry) => entry.ok).length,
      consoleErrors,
      externalRequests,
      screenshots: screenshotsTaken,
      durationMs: Date.now() - startedAt,
      error: error.message,
      results
    };
    fs.mkdirSync(path.join(root, "qa"), { recursive: true });
    fs.writeFileSync(path.join(root, "qa", "e2e-report.json"), JSON.stringify(report, null, 2));
    console.error(`\nE2E ÉCHEC : ${error.message}`);
    console.error(`Vérifications réussies avant l’échec : ${report.passed}/${report.checks}.`);
    if (consoleErrors.length) console.error("Erreurs console :", consoleErrors);
    if (externalRequests.length) console.error("Requêtes externes :", externalRequests);
    process.exitCode = 1;
  });
