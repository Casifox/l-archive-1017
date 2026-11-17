/**
 * Séquence d’initialisation du premier lancement.
 * Les lignes affichées correspondent à des vérifications réelles :
 * stockage local, présence d’une sauvegarde, modules chargés.
 */

import { h, clear } from "../dom.js";
import { icon } from "./icons.js";

export function runBoot({ root, saveManager, settings, onDone }) {
  if (!root) {
    onDone?.();
    return;
  }
  const reduced =
    settings.get().reduceMotion ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const stepDelay = reduced ? 20 : 260;
  const storageOk = saveManager.available;
  const hasSave = saveManager.hasSave();
  const steps = [
    { label: "NOYAU", value: "initialisé", ok: true },
    { label: "MODULES ES", value: "chargés", ok: true },
    { label: "STOCKAGE LOCAL", value: storageOk ? "disponible" : "indisponible", ok: storageOk },
    { label: "SAUVEGARDE", value: hasSave ? "détectée" : "aucune", ok: true },
    { label: "INTERFACE", value: "prête", ok: true }
  ];

  clear(root);
  const screen = h("div", { class: "boot-screen" });
  const visual = h("div", { class: "boot-visual", attrs: { "aria-hidden": "true" } });
  visual.innerHTML = `
    <svg viewBox="0 0 220 220" class="boot-glyph">
      <circle cx="110" cy="110" r="92" fill="none" stroke="#55B8C9" stroke-opacity="0.12"/>
      <circle cx="110" cy="110" r="70" fill="none" stroke="#E5A13A" stroke-opacity="0.35" stroke-dasharray="2 8"/>
      <circle cx="110" cy="110" r="48" fill="none" stroke="#55B8C9" stroke-opacity="0.2"/>
      <path d="M84 146V96a26 26 0 0 1 52 0v50" fill="#090B10" stroke="#E5A13A" stroke-opacity="0.7"/>
      <circle cx="110" cy="108" r="6" fill="#E5A13A" fill-opacity="0.7"/>
      <path d="M110 114v16" stroke="#E5A13A" stroke-opacity="0.5"/>
      <path d="M110 18v12M110 190v12M18 110h12M190 110h12" stroke="#E5A13A" stroke-opacity="0.5"/>
    </svg>`;
  const title = h("p", { class: "boot-kicker", text: "IRMP · AILE EST · VALMONT" });
  const heading = h("h1", { class: "boot-title", text: "L’ARCHIVE 1017" });
  const subtitle = h("p", { class: "boot-subtitle", text: "Certaines vérités préfèrent rester enfermées." });
  const terminal = h("div", { class: "boot-terminal", attrs: { role: "status", "aria-live": "polite" } });
  const progress = h("div", { class: "boot-progress", attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" } },
    h("span", { class: "boot-progress-bar" })
  );
  const enter = h("button", {
    class: "btn btn-primary boot-enter",
    type: "button",
    disabled: true,
    text: "Initialisation…",
    dataset: { testid: "boot-enter" },
    on: { click: () => finish() }
  });
  const skip = h("button", {
    class: "link-btn boot-skip",
    type: "button",
    text: "Passer",
    hidden: true,
    on: { click: () => finish() }
  });
  screen.append(visual, title, heading, subtitle, terminal, progress, h("div", { class: "boot-actions" }, enter, skip));
  root.append(screen);
  root.hidden = false;
  root.classList.remove("is-hidden");

  let index = 0;
  let finished = false;
  let timer = null;

  const addLine = (step) => {
    const line = h("p", { class: `boot-line${step.ok ? "" : " is-warning"}` },
      h("span", { class: "boot-line-label", text: step.label }),
      h("span", { class: "boot-line-dots", text: "·".repeat(18) }),
      h("span", { class: "boot-line-value", text: step.value }),
      step.ok ? h("span", { class: "boot-line-icon" }, icon("check", { size: 13 })) : h("span", { class: "boot-line-icon" }, icon("warning", { size: 13 }))
    );
    terminal.append(line);
    const percent = Math.round(((index + 1) / steps.length) * 100);
    progress.setAttribute("aria-valuenow", String(percent));
    progress.querySelector(".boot-progress-bar").style.width = `${percent}%`;
    index += 1;
  };

  const tick = () => {
    if (finished) return;
    if (index < steps.length) {
      addLine(steps[index]);
      timer = setTimeout(tick, stepDelay);
    } else {
      enter.disabled = false;
      enter.textContent = "Entrer dans l’archive";
      skip.hidden = true;
      if (!reduced) enter.classList.add("is-ready");
    }
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    if (timer) clearTimeout(timer);
    root.classList.add("is-leaving");
    setTimeout(() => {
      root.hidden = true;
      root.classList.add("is-hidden");
      root.replaceChildren();
      onDone?.();
    }, reduced ? 40 : 420);
  };

  timer = setTimeout(tick, reduced ? 30 : 380);
  setTimeout(() => {
    if (!finished) skip.hidden = false;
  }, reduced ? 50 : 800);
  if (reduced) skip.hidden = true;

  return {
    finish,
    destroy: () => {
      finished = true;
      if (timer) clearTimeout(timer);
      clear(root);
      root.hidden = true;
    }
  };
}
