#!/usr/bin/env node
/**
 * Construit le site statique dans _site et vérifie :
 * - la cohérence de version ;
 * - la syntaxe de tous les modules ;
 * - l’existence des références locales (HTML et imports JS) ;
 * - l’absence de requêtes réseau dans le code livré.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(root, "_site");

const RUNTIME = ["index.html", "404.html", ".nojekyll", "css", "js", "data", "assets"];

function fail(message) {
  console.error(`\n[build] ÉCHEC — ${message}`);
  process.exit(1);
}

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

// 1. Version
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const versionSource = fs.readFileSync(path.join(root, "js", "version.js"), "utf8");
const match = versionSource.match(/VERSION\s*=\s*["']([^"']+)["']/);
if (!match) fail("js/version.js ne contient pas de constante VERSION.");
if (match[1] !== pkg.version) fail(`Version incohérente : package.json ${pkg.version}, js/version.js ${match[1]}.`);

// 2. Syntaxe de tous les modules
const jsFiles = walk(path.join(root, "js")).filter((file) => file.endsWith(".js"));
jsFiles.push(...walk(path.join(root, "data")).filter((file) => file.endsWith(".js")));
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    fail(`Syntaxe invalide dans ${rel(file)} :\n${error.stderr?.toString() || error.message}`);
  }
}

// 3. Références HTML
const htmlFiles = [path.join(root, "index.html"), path.join(root, "404.html")];
const htmlRefs = [];
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(source)) {
    fail(`Référence réseau externe dans ${rel(file)}.`);
  }
  for (const matchRef of source.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const ref = matchRef[1];
    if (ref.startsWith("#") || ref.startsWith("data:") || ref.startsWith("mailto:") || /^https?:/i.test(ref)) continue;
    htmlRefs.push({ file, ref });
  }
}

// 4. Imports JS
const jsRefs = [];
for (const file of jsFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const matchRef of source.matchAll(/(?:from|import\s*\()\s*["']([^"']+)["']/g)) {
    const ref = matchRef[1];
    if (ref.startsWith("node:") || /^https?:/i.test(ref)) continue;
    jsRefs.push({ file, ref });
  }
}

for (const { file, ref } of htmlRefs) {
  const target = path.resolve(path.dirname(file), ref.split("#")[0].split("?")[0]);
  if (!fs.existsSync(target)) fail(`Référence HTML introuvable dans ${rel(file)} : ${ref}`);
}

for (const { file, ref } of jsRefs) {
  const target = path.resolve(path.dirname(file), ref);
  if (!fs.existsSync(target)) fail(`Import introuvable dans ${rel(file)} : ${ref}`);
}

// 5. Absence de réseau dans le code livré
const runtimeSourceFiles = [
  ...walk(path.join(root, "js")).filter((file) => file.endsWith(".js")),
  ...walk(path.join(root, "data")).filter((file) => file.endsWith(".js")),
  ...walk(path.join(root, "css")).filter((file) => file.endsWith(".css"))
];
for (const file of runtimeSourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/\bfetch\s*\(/.test(source) || /XMLHttpRequest/.test(source)) {
    fail(`Appel réseau détecté dans ${rel(file)}.`);
  }
  if (/url\(\s*["']?https?:/i.test(source)) {
    fail(`Ressource distante détectée dans ${rel(file)}.`);
  }
}

// 6. Copie du site
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const entry of RUNTIME) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) fail(`Élément d’exécution manquant : ${entry}`);
  const target = path.join(out, entry);
  fs.cpSync(source, target, { recursive: true });
}

// 7. Vérification du site copié
const copiedFiles = walk(out);
const copiedHtml = copiedFiles.filter((file) => file.endsWith(".html"));
for (const file of copiedHtml) {
  const source = fs.readFileSync(file, "utf8");
  for (const matchRef of source.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const ref = matchRef[1];
    if (ref.startsWith("#") || ref.startsWith("data:") || ref.startsWith("mailto:") || /^https?:/i.test(ref)) continue;
    const target = path.resolve(path.dirname(file), ref.split("#")[0].split("?")[0]);
    if (!fs.existsSync(target)) fail(`Référence cassée dans le site copié : ${rel(file)} → ${ref}`);
  }
}

const bytes = copiedFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log("[build] Succès.");
console.log(`[build] Version ${pkg.version}`);
console.log(`[build] ${copiedFiles.length} fichiers copiés dans _site (${(bytes / 1024).toFixed(1)} Ko).`);
console.log(`[build] ${htmlRefs.length} références HTML et ${jsRefs.length} imports vérifiés.`);
console.log("[build] Aucun appel réseau détecté dans le code livré.");
