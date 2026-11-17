#!/usr/bin/env node
/**
 * Vérification manuelle du site public après déploiement.
 * Ouvre l’URL GitHub Pages dans Chromium, vérifie le menu, collecte les
 * erreurs console et les requêtes hors du site.
 *
 * Usage : npm run check:public
 * URL personnalisée : SITE_URL=https://... npm run check:public
 */

import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.SITE_URL || "https://casifox.github.io/l-archive-1017/";
const expectedOrigin = new URL(base).origin;
const expectedPath = new URL(base).pathname;
fs.mkdirSync("qa/artifacts", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
const external = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  const url = request.url();
  try {
    const parsed = new URL(url);
    if (parsed.origin !== expectedOrigin || !parsed.pathname.startsWith(expectedPath)) external.push(url);
  } catch {
    // Ignoré.
  }
});

let status = null;
try {
  const response = await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  status = response?.status() ?? null;
  await page.locator('[data-testid="boot-enter"]').click();
  await page.waitForTimeout(600);
  const menu = await page.locator(".menu-screen").isVisible();
  const title = await page.title();
  const text = (await page.locator("#app").innerText()).slice(0, 300);
  await page.screenshot({ path: "qa/artifacts/public-menu.png", fullPage: true });
  console.log(JSON.stringify({ url: base, status, menu, title, errors, external, text }, null, 2));
  if (!menu || errors.length || external.length || status !== 200) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ url: base, status, error: error.message, errors, external }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
