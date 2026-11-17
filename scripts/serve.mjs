#!/usr/bin/env node
/**
 * Serveur HTTP local minimal, sans dépendance, pour tester le jeu et le
 * site construit. Ne sert que des fichiers statiques et ne fait aucun
 * traitement de données.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const siteRoot = path.join(projectRoot, "_site");
// Par défaut, on sert les sources (développement). Pour tester l’artefact
// de publication, utiliser SERVE_SITE=1 (ou root: "_site" en import).
const defaultRoot = process.env.SERVE_SITE === "1" ? siteRoot : projectRoot;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function safePath(root, target) {
  const decoded = decodeURIComponent((target || "/").split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(root, `.${clean}`);
  if (!resolved.startsWith(path.resolve(root))) return null;
  return resolved;
}

export function startServer({ port = 4173, host = "127.0.0.1", root = defaultRoot } = {}) {
  const resolvedRoot = path.resolve(root);
  const server = http.createServer((request, response) => {
    const file = safePath(resolvedRoot, request.url);
    if (!file) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Requête invalide.");
      return;
    }
    let target = file;
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      const notFound = path.join(resolvedRoot, "404.html");
      if (fs.existsSync(notFound)) {
        response.writeHead(404, {
          "Content-Type": MIME[".html"],
          "Cache-Control": "no-store"
        });
        response.end(fs.readFileSync(notFound));
      } else {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("404 — Fichier introuvable.");
      }
      return;
    }
    const ext = path.extname(target).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(fs.readFileSync(target));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({
        server,
        port: actualPort,
        url: `http://${host}:${actualPort}/`,
        close: () => new Promise((done) => server.close(() => done()))
      });
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT) || 4173;
  startServer({ port })
    .then(({ url, port: actualPort }) => {
      console.log(`L’ARCHIVE 1017 — serveur local sur ${url}`);
      console.log(`Racine servie : ${defaultRoot}`);
      console.log(`Port : ${actualPort}. Ctrl+C pour arrêter.`);
    })
    .catch((error) => {
      console.error("Impossible de démarrer le serveur :", error);
      process.exit(1);
    });
}
