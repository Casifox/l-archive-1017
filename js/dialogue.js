/**
 * Lecteur de dialogues.
 *
 * Affiche une scène nœud par nœud, avec effet machine à écrire, choix
 * enregistrés dans GameState, collecte de preuves et fin de scène.
 * Le mode lecture seule permet de revoir un briefing sans rejouer ses effets.
 */

import { h, append, clear } from "./dom.js";
import { icon } from "./ui/icons.js";

const SPEAKERS = {
  elias: "Elias Roux",
  mara: "Mara Chen",
  varenne: "Hélène Varenne",
  nadal: "R. Nadal"
};

function voiceName(state, glitch = false) {
  const revealed = Boolean(state?.getState()?.flags?.ariaRevealed);
  if (glitch) return "SIGNAL ALTÉRÉ";
  return revealed ? "ARIA" : "LA VEILLEUSE";
}

function checkRequires(state, requirement) {
  if (!requirement) return true;
  if (requirement.evidence) return state.isEvidenceFound(requirement.evidence);
  if (requirement.flag) return Boolean(state.getState()?.flags?.[requirement.flag]);
  if (requirement.puzzle) return state.isPuzzleSolved(requirement.puzzle);
  if (requirement.stat) {
    const value = state.getStats()?.[requirement.stat.key] || 0;
    return value >= (requirement.stat.min || 0);
  }
  if (requirement.choice) return state.hasChoice(requirement.choice);
  return true;
}

export class DialoguePlayer {
  constructor({
    container,
    scene,
    gameState,
    audio = null,
    settings = null,
    dossier = 0,
    readOnly = false,
    onComplete = () => {},
    onEvidence = null
  }) {
    this.container = container;
    this.scene = scene;
    this.gameState = gameState;
    this.audio = audio;
    this.settings = settings;
    this.dossier = Number(dossier) || 0;
    this.readOnly = readOnly;
    this.onComplete = onComplete;
    this.onEvidence = onEvidence;
    this.nodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
    this.index = 0;
    this.pending = [];
    this.typing = false;
    this.typeTimer = null;
    this.currentTextEl = null;
    this.currentFullText = "";
    this.atEnd = false;
    this.destroyed = false;
    this.activeChoice = null;
    this._cleanups = [];
    this._render();
    this.advance();
  }

  _render() {
    clear(this.container);
    this.transcript = h("div", {
      class: "dialogue-transcript",
      attrs: { role: "log", "aria-label": "Transcription de la scène" }
    });
    this.live = h("p", {
      class: "sr-only",
      attrs: { "aria-live": "polite", "aria-atomic": "true" }
    });
    this.footer = h("div", { class: "dialogue-footer" });
    this.nextButton = h("button", {
      class: "btn btn-primary",
      type: "button",
      dataset: { testid: "dialogue-next" },
      on: { click: () => this.advance() }
    });
    this.footer.append(
      h("p", { class: "dialogue-hint", text: "Entrée pour continuer" }),
      this.nextButton
    );
    this.container.append(this.transcript, this.live, this.footer);
    this._cleanups.push(
      (() => {
        const handler = (event) => {
          if (event.key !== "Enter") return;
          const target = event.target;
          if (target instanceof HTMLButtonElement || target instanceof HTMLInputElement) return;
          if (this.activeChoice) return;
          if (!this.nextButton.disabled) {
            event.preventDefault();
            this.advance();
          }
        };
        this.container.addEventListener("keydown", handler);
        return () => this.container.removeEventListener("keydown", handler);
      })()
    );
    if (this.audio) this.audio.play("open");
  }

  getDelay() {
    const reduced = document.documentElement.dataset.motion === "reduced";
    if (reduced) return 0;
    return this.settings?.getTextDelay?.() ?? 26;
  }

  _nextNode() {
    if (this.pending.length) return this.pending.shift();
    while (this.index < this.nodes.length) {
      const node = this.nodes[this.index];
      this.index += 1;
      if (!checkRequires(this.gameState, node.requires)) continue;
      return node;
    }
    return null;
  }

  advance() {
    if (this.destroyed) return;
    if (this.atEnd) {
      this.nextButton.disabled = true;
      this.onComplete?.();
      return;
    }
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.activeChoice) return;

    const node = this._nextNode();
    if (!node) {
      this.showEnd();
      return;
    }

    if (node.type === "effect") {
      if (!this.readOnly) this.gameState.applyEffects(node.effects || {});
      this.advance();
      return;
    }

    if (node.type === "choice") {
      this.renderChoice(node);
      return;
    }

    if (node.type === "evidence") {
      this.collectEvidence(node);
      this.advance();
      return;
    }

    if (node.type === "unlock") {
      if (!this.readOnly) this.gameState.unlockDossier(node.dossier);
      this.appendNote(`Dossier ${String(node.dossier).padStart(2, "0")} ouvert.`);
      this.advance();
      return;
    }

    if (node.type === "end") {
      this.endLabel = node.text || "Continuer";
      this.showEnd();
      return;
    }

    this.appendNode(node);
  }

  appendNode(node) {
    this.nextButton.disabled = true;
    const speaker = this.speakerFor(node);
    const wrapper = h("article", {
      class: `dialogue-node dialogue-node--${node.type}`,
      dataset: { type: node.type }
    });
    if (speaker) {
      wrapper.append(
        h("p", { class: "dialogue-speaker" }, speaker.icon ? icon(speaker.icon, { size: 14 }) : null, h("span", { text: speaker.label }))
      );
    }
    const text = h("p", { class: "dialogue-text" });
    wrapper.append(text);
    this.transcript.append(wrapper);
    this.currentTextEl = text;
    this.currentFullText = node.text || "";
    this.live.textContent = `${speaker?.label || "Archive"} : ${this.currentFullText}`;
    this.scrollToBottom();

    const delay = this.getDelay();
    if (delay <= 0) {
      text.textContent = this.currentFullText;
      this.typing = false;
      this.nextButton.disabled = false;
      this.nextButton.textContent = "Continuer";
      this.nextButton.focus({ preventScroll: true });
    } else {
      this.typing = true;
      let i = 0;
      text.textContent = "";
      this.nextButton.textContent = "Afficher tout";
      this.typeTimer = setInterval(() => {
        if (this.destroyed) return;
        i += 1;
        text.textContent = this.currentFullText.slice(0, i);
        if (i >= this.currentFullText.length) {
          this.finishTyping();
        }
      }, delay);
    }
  }

  speakerFor(node) {
    if (node.type === "system") return { label: "SYSTÈME", icon: "terminal" };
    if (node.type === "voice") return { label: voiceName(this.gameState), icon: "wave" };
    if (node.type === "glitch") return { label: voiceName(this.gameState, true), icon: "alert" };
    if (node.type === "character") {
      return { label: SPEAKERS[node.who] || node.who || "INCONNU", icon: "user" };
    }
    if (node.type === "narration") return { label: "RÉCIT", icon: "book" };
    return null;
  }

  finishTyping() {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
    if (this.currentTextEl) this.currentTextEl.textContent = this.currentFullText;
    this.typing = false;
    this.nextButton.disabled = false;
    this.nextButton.textContent = "Continuer";
    this.nextButton.focus({ preventScroll: true });
  }

  appendNote(text) {
    this.transcript.append(
      h("p", { class: "dialogue-note" }, icon("check", { size: 14 }), h("span", { text }))
    );
    this.scrollToBottom();
  }

  collectEvidence(node) {
    const item = this.gameState.getEvidence(node.id);
    if (!item) return;
    if (!this.readOnly) {
      this.gameState.findEvidence(node.id);
      this.appendNote(`Preuve ajoutée : ${item.title}`);
    } else {
      this.appendNote(`Preuve consultée : ${item.title}`);
    }
    this.onEvidence?.(item);
  }

  renderChoice(node) {
    this.nextButton.disabled = true;
    this.nextButton.textContent = "Faites un choix";
    const wrapper = h("section", { class: "dialogue-choice", dataset: { choice: node.id } });
    wrapper.append(h("p", { class: "dialogue-prompt", text: node.prompt || "Que faites-vous ?" }));
    const options = node.options.filter((option) => checkRequires(this.gameState, option.requires));
    const recorded = this.gameState.getChoice(node.id);
    const optionList = h("div", { class: "choice-options" });

    for (const option of options) {
      const isRecorded = recorded?.optionId === option.id;
      const button = h("button", {
        class: `choice-btn${isRecorded ? " is-recorded" : ""}`,
        type: "button",
        dataset: { testid: `choice-${option.id}` },
        disabled: this.readOnly || Boolean(recorded),
        on: {
          click: () => this.selectChoice(node, option)
        }
      });
      button.append(
        h("span", { class: "choice-marker" }, icon(isRecorded ? "check" : "chevronRight", { size: 14 })),
        h("span", { text: option.label })
      );
      optionList.append(button);
    }
    wrapper.append(optionList);
    if (recorded) {
      wrapper.append(
        h("p", { class: "choice-recorded", text: `Décision enregistrée : ${recorded.label}` })
      );
    }
    if (this.readOnly) {
      wrapper.append(h("p", { class: "choice-note", text: "Relecture : les décisions ne peuvent plus être modifiées." }));
    }
    this.transcript.append(wrapper);
    this.live.textContent = node.prompt || "Faites un choix.";
    this.activeChoice = node;
    this.scrollToBottom();

    if (recorded) {
      const option = options.find((entry) => entry.id === recorded.optionId);
      if (option) {
        this.pending.unshift(...(option.response || []));
      }
      this.activeChoice = null;
      this.nextButton.disabled = false;
      this.nextButton.textContent = "Continuer";
      this.nextButton.focus({ preventScroll: true });
    } else if (this.readOnly) {
      this.activeChoice = null;
      this.nextButton.disabled = false;
      this.nextButton.textContent = "Continuer";
    } else {
      const first = optionList.querySelector("button:not([disabled])");
      first?.focus({ preventScroll: true });
    }
  }

  selectChoice(node, option) {
    if (this.readOnly || this.activeChoice !== node) return;
    if (this.gameState.hasChoice(node.id)) return;
    this.activeChoice = null;
    for (const button of this.transcript.querySelectorAll(".choice-btn")) button.disabled = true;
    const recorded = this.gameState.recordChoice({
      id: node.id,
      dossier: this.dossier,
      prompt: node.prompt || "",
      optionId: option.id,
      label: option.label,
      effects: option.effects || {}
    });
    if (recorded && this.audio) this.audio.play("click");
    this.transcript.append(
      h("article", { class: "dialogue-node dialogue-node--player" },
        h("p", { class: "dialogue-speaker" }, icon("user", { size: 14 }), h("span", { text: "VOUS" })),
        h("p", { class: "dialogue-text", text: option.label })
      )
    );
    this.live.textContent = `Vous : ${option.label}`;
    this.pending.unshift(...(option.response || []));
    this.scrollToBottom();
    this.advance();
  }

  showEnd() {
    this.atEnd = true;
    this.nextButton.disabled = false;
    this.nextButton.textContent = this.endLabel || "Terminer";
    this.nextButton.focus({ preventScroll: true });
  }

  scrollToBottom() {
    if (!this.transcript) return;
    this.transcript.scrollTop = this.transcript.scrollHeight;
  }

  destroy() {
    this.destroyed = true;
    if (this.typeTimer) clearInterval(this.typeTimer);
    this.typeTimer = null;
    for (const cleanup of this._cleanups) cleanup();
    this._cleanups = [];
    clear(this.container);
  }
}

export { checkRequires };
