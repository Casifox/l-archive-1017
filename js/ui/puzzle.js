/**
 * Écran d’énigme : rendu par type, indices progressifs, validation réelle,
 * explication après résolution. Les solutions restent dans data/puzzles.js.
 */

import { h, clear } from "../dom.js";
import { decodeCipher } from "../puzzles.js";
import { icon } from "./icons.js";
import { renderShell } from "./shell.js";
import { showToast } from "./toast.js";
import { mountPhoto } from "./art.js";

const TYPE_LABELS = {
  pair: "Contradiction",
  assign: "Logique",
  order: "Chronologie",
  classify: "Déduction",
  single: "Déduction",
  cipher: "Cryptographie",
  mastermind: "Code",
  chain: "Synthèse"
};

function rewardLabel(key) {
  return { confiance: "Confiance", lucidite: "Lucidité", empathie: "Empathie" }[key] || key;
}

function optionLabel(puzzle, field, value) {
  return field.options.find((option) => option.id === value)?.label || value;
}

function solutionSummary(puzzle, gameState) {
  switch (puzzle.type) {
    case "pair":
      return puzzle.solution
        .map((id) => {
          const item = puzzle.data.items.find((entry) => entry.id === id);
          return item ? `${item.source} — ${item.text}` : id;
        })
        .join("  ·  ");
    case "assign":
      return puzzle.data.rows
        .map((row) => {
          const fields = puzzle.data.fields
            .map((field) => optionLabel(puzzle, field, puzzle.solution[row.id]?.[field.id]))
            .join(" · ");
          return `${row.label} : ${fields}`;
        })
        .join("  |  ");
    case "order":
      return puzzle.solution
        .map((id) => puzzle.data.items.find((item) => item.id === id)?.text)
        .filter(Boolean)
        .map((text, index) => `${index + 1}. ${text}`)
        .join("  ");
    case "classify":
      return puzzle.data.items
        .map((item) => {
          const category = puzzle.data.categories.find((entry) => entry.id === puzzle.solution[item.id]);
          return `${item.text} → ${category?.label || puzzle.solution[item.id]}`;
        })
        .join("  |  ");
    case "single": {
      const option = puzzle.data.options.find((entry) => entry.id === puzzle.solution);
      return option ? `${option.title} — ${option.text}` : puzzle.solution;
    }
    case "cipher":
      return puzzle.solutionLabel || "ZÉRO";
    case "mastermind":
      return puzzle.solution;
    case "chain":
      return puzzle.solution
        .map((id) => puzzle.data.cards.find((card) => card.id === id)?.title)
        .filter(Boolean)
        .join(" → ");
    default:
      return "";
  }
}

export function mountPuzzle(root, context) {
  const { gameState, audio, params, navigate } = context;
  const puzzle = gameState.getPuzzle(params.puzzleId);
  if (!puzzle) {
    navigate("/hub");
    return () => {};
  }
  const dossier = gameState.getDossier(puzzle.dossier);
  gameState.setPlaying(true);

  const layoutHost = h("div", { class: "puzzle-layout-host" });
  const shell = renderShell(root, {
    context,
    active: "hub",
    eyebrow: `${dossier.code} · ${TYPE_LABELS[puzzle.type] || "Énigme"}`,
    title: puzzle.title,
    subtitle: puzzle.subtitle,
    back: { path: `/dossier/${dossier.id}`, label: `Retour au dossier ${String(dossier.id).padStart(2, "0")}` },
    actions: [{ label: "Tableau d’enquête", path: "/tableau", icon: "grid" }],
    content: layoutHost
  });

  let selected = [];
  let answer = puzzle.type === "assign" || puzzle.type === "classify" ? {} : null;
  let order = puzzle.data.items ? puzzle.data.items.map((item) => item.id) : [];
  let decoder = { mirror: false, reverse: false };
  let lastFeedback = null;
  let feedbackEl = null;

  const resetLocal = () => {
    selected = [];
    answer = puzzle.type === "assign" || puzzle.type === "classify" ? {} : null;
    order = puzzle.data.items ? puzzle.data.items.map((item) => item.id) : [];
    decoder = { mirror: false, reverse: false };
    lastFeedback = null;
  };

  const submit = (value) => {
    const result = gameState.submitPuzzleAnswer(puzzle.id, value);
    if (result.correct) {
      audio.play("success");
      lastFeedback = null;
      resetLocal();
      renderBody();
      layoutHost.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(puzzle.success || "Énigme résolue.", "success", { title: puzzle.title, duration: 5200 });
      return;
    }
    audio.play("error");
    if (puzzle.type === "mastermind" && result.feedback) {
      gameState.recordPuzzleGuess(puzzle.id, String(value), result.feedback);
      lastFeedback = { message: result.message, type: "error", attempts: gameState.getPuzzleProgress(puzzle.id).attempts };
      renderBody();
      const input = layoutHost.querySelector('[data-testid="mastermind-input"]');
      input?.focus();
      return;
    }
    showFeedback(result.message, "error");
    nudgeIfNeeded();
  };

  const showFeedback = (message, type = "info") => {
    if (!feedbackEl) return;
    clear(feedbackEl);
    feedbackEl.className = `puzzle-feedback is-${type}`;
    feedbackEl.append(
      icon(type === "error" ? "alert" : type === "success" ? "check" : "info", { size: 16 }),
      h("span", { text: message })
    );
    if (type === "error") {
      const panel = layoutHost.querySelector(".puzzle-interactive");
      panel?.classList.add("is-shaking");
      setTimeout(() => panel?.classList.remove("is-shaking"), 500);
    }
  };

  const nudgeIfNeeded = () => {
    if (!feedbackEl) return;
    const progress = gameState.getPuzzleProgress(puzzle.id);
    if (progress.attempts < 2 || progress.hintsUsed > 0) return;
    const nudge = h("button", {
      class: "link-btn",
      type: "button",
      text: "Un indice pourrait aider.",
      on: {
        click: () => {
          const hints = layoutHost.querySelector(".puzzle-hints");
          hints?.scrollIntoView({ behavior: "smooth", block: "center" });
          hints?.querySelector("button")?.focus();
        }
      }
    });
    feedbackEl.append(nudge);
  };

  const renderBody = () => {
    const progress = gameState.getPuzzleProgress(puzzle.id);
    const solved = Boolean(progress.solved);
    clear(layoutHost);
    resetFeedback();
    const layout = h("div", { class: "puzzle-layout" });
    const main = h("div", { class: "puzzle-main-column" });
    const aside = h("div", { class: "puzzle-aside-column" });

    const contextPanel = h("section", { class: "panel puzzle-context" },
      h("p", { class: "kicker", text: "CONTEXTE" }),
      h("p", { class: "puzzle-context-text", text: puzzle.context }),
      h("div", { class: "puzzle-instructions" }, icon("info", { size: 15 }), h("p", { text: puzzle.instructions }))
    );
    main.append(contextPanel);

    if (solved) {
      main.append(renderSolved(progress));
    } else {
      const interactive = h("section", { class: "panel puzzle-interactive" });
      interactive.append(h("p", { class: "kicker", text: "RÉSOLUTION" }));
      interactive.append(renderInteractive());
      feedbackEl = h("div", { class: "puzzle-feedback", attrs: { role: "status", "aria-live": "polite" } });
      interactive.append(feedbackEl);
      if (lastFeedback) showFeedback(lastFeedback.message, lastFeedback.type);
      main.append(interactive);
      if (progress.attempts >= 2) nudgeIfNeeded();
    }

    const hintsHost = h("div", { class: "panel puzzle-hints" });
    renderHintsInto(hintsHost);
    aside.append(hintsHost, renderRewards(progress), renderMeta(progress));
    layout.append(main, aside);
    layoutHost.append(layout);
  };

  const resetFeedback = () => {
    feedbackEl = null;
  };

  const renderHintsInto = (host) => {
    const progress = gameState.getPuzzleProgress(puzzle.id);
    clear(host);
    host.append(
      h("div", { class: "panel-head" },
        h("p", { class: "kicker" }, icon("help", { size: 13 }), h("span", { text: "INDICES" })),
        progress.hintsUsed > 0 ? h("span", { class: "hint-count", text: `${progress.hintsUsed} / 2` }) : null
      )
    );
    if (progress.solved) {
      host.append(h("p", { class: "muted small", text: "Énigme résolue. Les indices ne sont plus nécessaires." }));
      return;
    }
    host.append(h("p", { class: "muted small", text: "Deux niveaux d’aide. Utiliser un indice n’empêche pas de terminer l’énigme." }));
    for (let level = 1; level <= 2; level += 1) {
      const used = progress.hintsUsed >= level;
      const available = level === 1 || progress.hintsUsed >= 1;
      const block = h("div", { class: `hint-block${used ? " is-used" : ""}` });
      if (used) {
        block.append(
          h("p", { class: "hint-label" }, icon("check", { size: 13 }), h("span", { text: `Indice ${level}` })),
          h("p", { class: "hint-text", text: puzzle.hints[level - 1] })
        );
      } else {
        block.append(
          h("button", {
            class: "btn btn-ghost btn-small",
            type: "button",
            disabled: !available,
            text: available ? `Révéler l’indice ${level}` : "Indice 2 — révélez d’abord l’indice 1",
            dataset: { testid: `hint-${level}` },
            on: {
              click: () => {
                gameState.useHint(puzzle.id, level);
                audio.play("click");
                renderHintsInto(host);
              }
            }
          })
        );
      }
      host.append(block);
    }
  };

  const renderRewards = (progress) => {
    const panel = h("div", { class: "panel puzzle-rewards" });
    panel.append(h("p", { class: "kicker", text: "RÉCOMPENSES" }));
    const rewards = puzzle.rewards || {};
    const stats = Object.entries(rewards.stats || {});
    if (stats.length) {
      const list = h("ul", { class: "reward-list" });
      for (const [key, value] of stats) {
        list.append(h("li", {}, icon(key === "lucidite" ? "eye" : key === "empathie" ? "heart" : "heartHand", { size: 14 }), h("span", { text: `${value > 0 ? "+" : ""}${value} ${rewardLabel(key)}` })));
      }
      panel.append(list);
    }
    if (rewards.evidence?.length) {
      const list = h("ul", { class: "reward-list" });
      for (const id of rewards.evidence) {
        const item = gameState.getEvidence(id);
        list.append(h("li", {}, icon("file", { size: 14 }), h("span", { text: item?.title || id })));
      }
      panel.append(h("p", { class: "kicker kicker--sub", text: "DOCUMENTS" }), list);
    }
    if (!stats.length && !rewards.evidence?.length) {
      panel.append(h("p", { class: "muted small", text: "Cette énigme débloque la suite du dossier." }));
    }
    if (progress.solved) panel.append(h("p", { class: "reward-done" }, icon("check", { size: 13 }), h("span", { text: "Récompense acquise" })));
    return panel;
  };

  const renderMeta = (progress) => {
    return h("div", { class: "panel puzzle-meta" },
      h("p", { class: "kicker", text: "DÉTAILS" }),
      h("dl", { class: "meta-list" },
        h("div", {}, h("dt", { text: "Dossier" }), h("dd", { text: dossier.code })),
        h("div", {}, h("dt", { text: "Type" }), h("dd", { text: TYPE_LABELS[puzzle.type] || puzzle.type })),
        h("div", {}, h("dt", { text: "Tentatives" }), h("dd", { text: String(progress.attempts || 0) })),
        h("div", {}, h("dt", { text: "Indices" }), h("dd", { text: `${progress.hintsUsed || 0} / 2` }))
      )
    );
  };

  const renderSolved = (progress) => {
    const panel = h("section", { class: "panel puzzle-solved" });
    panel.append(
      h("div", { class: "solved-banner" },
        h("span", { class: "solved-icon" }, icon("check", { size: 26 })),
        h("div", {},
          h("p", { class: "kicker", text: progress.solvedAt ? "ÉNIGME RÉSOLUE" : "SOLUTION" }),
          h("h2", { class: "solved-title", text: puzzle.success || "Énigme résolue." })
        )
      )
    );
    const explanation = h("div", { class: "solved-explanation" });
    explanation.append(h("p", { class: "kicker", text: "EXPLICATION" }));
    for (const paragraph of puzzle.explanation || []) {
      explanation.append(h("p", { class: "doc-paragraph", text: paragraph }));
    }
    panel.append(explanation);
    panel.append(
      h("div", { class: "solution-box" },
        h("p", { class: "kicker", text: "SOLUTION" }),
        h("p", { class: "solution-text", text: solutionSummary(puzzle, gameState) })
      )
    );
    const actions = h("div", { class: "button-row" });
    actions.append(
      h("a", { class: "btn btn-primary", href: `#/dossier/${dossier.id}` }, icon("arrowLeft", { size: 16 }), h("span", { text: "Retour au dossier" }))
    );
    const nextIndex = dossier.puzzles.indexOf(puzzle.id);
    const nextPuzzle = nextIndex >= 0 ? dossier.puzzles[nextIndex + 1] : null;
    if (nextPuzzle) {
      actions.append(
        h("a", { class: "btn btn-ghost", href: `#/enigme/${nextPuzzle}` }, h("span", { text: "Énigme suivante" }), icon("arrowRight", { size: 16 }))
      );
    }
    panel.append(actions);
    return panel;
  };

  const renderInteractive = () => {
    switch (puzzle.type) {
      case "pair":
        return renderPair();
      case "assign":
        return renderAssign();
      case "order":
        return renderOrder();
      case "classify":
        return renderClassify();
      case "single":
        return renderSingle();
      case "cipher":
        return renderCipher();
      case "mastermind":
        return renderMastermind();
      case "chain":
        return renderChain();
      default:
        return h("p", { class: "muted", text: "Type d’énigme non pris en charge." });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Types d’énigmes                                                    */
  /* ------------------------------------------------------------------ */
  const submitRow = (label = "Vérifier", onClick, disabled = false, testid = "puzzle-submit") => {
    return h("div", { class: "puzzle-submit-row" },
      h("button", {
        class: "btn btn-primary",
        type: "button",
        disabled,
        dataset: { testid },
        on: { click: onClick }
      }, icon("check", { size: 16 }), h("span", { text: label }))
    );
  };

  const renderPair = () => {
    const wrap = h("div", { class: "pair-wrap" });
    wrap.append(h("p", { class: "interactive-hint", text: `Sélectionnez ${puzzle.data.selection} éléments. ${selected.length} / ${puzzle.data.selection} sélectionné${selected.length > 1 ? "s" : ""}.` }));
    const grid = h("div", { class: "pair-grid" });
    const buttons = new Map();
    const update = () => {
      wrap.querySelector(".interactive-hint").textContent = `Sélectionnez ${puzzle.data.selection} éléments. ${selected.length} / ${puzzle.data.selection} sélectionné${selected.length > 1 ? "s" : ""}.`;
      for (const [id, button] of buttons) {
        const isSelected = selected.includes(id);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      }
    };
    for (const item of puzzle.data.items) {
      const button = h("button", {
        class: "select-card",
        type: "button",
        attrs: { "aria-pressed": "false" },
        dataset: { testid: `pair-${item.id}` },
        on: {
          click: () => {
            if (selected.includes(item.id)) selected = selected.filter((id) => id !== item.id);
            else {
              if (selected.length >= puzzle.data.selection) selected.shift();
              selected.push(item.id);
            }
            update();
          }
        }
      });
      button.append(
        h("span", { class: "select-card-source", text: item.source }),
        h("span", { class: "select-card-text", text: item.text }),
        h("span", { class: "select-card-check" }, icon("check", { size: 14 }))
      );
      buttons.set(item.id, button);
      grid.append(button);
    }
    wrap.append(grid, submitRow("Vérifier la contradiction", () => submit([...selected])));
    return wrap;
  };

  const renderAssign = () => {
    const wrap = h("div", { class: "assign-wrap" });
    const clueList = h("ul", { class: "clue-list" });
    for (const clue of puzzle.data.clues) clueList.append(h("li", {}, icon("chevronRight", { size: 13 }), h("span", { text: clue })));
    wrap.append(h("p", { class: "kicker", text: "INDICES" }), clueList);
    const table = h("div", { class: "assign-table", attrs: { role: "table", "aria-label": "Attribution" } });
    const header = h("div", { class: "assign-row assign-row--head", attrs: { role: "row" } },
      h("span", { attrs: { role: "columnheader" }, text: "Sujet" }),
      ...puzzle.data.fields.map((field) => h("span", { attrs: { role: "columnheader" }, text: field.label }))
    );
    table.append(header);
    for (const row of puzzle.data.rows) {
      const rowEl = h("div", { class: "assign-row", attrs: { role: "row" } },
        h("span", { class: "assign-label", attrs: { role: "rowheader" }, text: row.label })
      );
      for (const field of puzzle.data.fields) {
        const select = h("select", {
          class: "select",
          attrs: { "aria-label": `${row.label} — ${field.label}` },
          dataset: { testid: `assign-${row.id}-${field.id}` },
          on: {
            change: () => {
              answer = answer || {};
              answer[row.id] = { ...(answer[row.id] || {}), [field.id]: select.value };
            }
          }
        });
        select.append(h("option", { value: "", text: "—" }));
        for (const option of field.options) select.append(h("option", { value: option.id, text: option.label }));
        rowEl.append(select);
      }
      table.append(rowEl);
    }
    wrap.append(table, submitRow("Vérifier l’attribution", () => submit(answer)));
    return wrap;
  };

  const renderOrder = () => {
    const wrap = h("div", { class: "order-wrap" });
    const list = h("div", { class: "order-list", attrs: { role: "list" } });
    let dragIndex = null;
    const renderList = (focusId = null) => {
      clear(list);
      order.forEach((id, index) => {
        const item = puzzle.data.items.find((entry) => entry.id === id);
        const row = h("div", {
          class: "order-row",
          attrs: { role: "listitem", draggable: "true" },
          dataset: { testid: `order-row-${id}` }
        });
        const handle = h("span", { class: "order-handle", attrs: { "aria-hidden": "true" }, text: "⠿" });
        const number = h("span", { class: "order-number", text: String(index + 1).padStart(2, "0") });
        const text = h("span", { class: "order-text", text: item?.text || id });
        const controls = h("span", { class: "order-controls" },
          h("button", {
            class: "icon-btn",
            type: "button",
            attrs: { "aria-label": `Monter : ${item?.text || id}` },
            disabled: index === 0,
            dataset: { testid: `order-up-${id}` },
            on: {
              click: () => {
                [order[index - 1], order[index]] = [order[index], order[index - 1]];
                renderList(id);
              }
            }
          }, icon("arrowUp", { size: 15 })),
          h("button", {
            class: "icon-btn",
            type: "button",
            attrs: { "aria-label": `Descendre : ${item?.text || id}` },
            disabled: index === order.length - 1,
            dataset: { testid: `order-down-${id}` },
            on: {
              click: () => {
                [order[index + 1], order[index]] = [order[index], order[index + 1]];
                renderList(id);
              }
            }
          }, icon("arrowDown", { size: 15 }))
        );
        row.append(handle, number, text, controls);
        row.addEventListener("dragstart", () => {
          dragIndex = index;
          row.classList.add("is-dragging");
        });
        row.addEventListener("dragend", () => {
          dragIndex = null;
          row.classList.remove("is-dragging");
        });
        row.addEventListener("dragover", (event) => event.preventDefault());
        row.addEventListener("drop", (event) => {
          event.preventDefault();
          if (dragIndex === null || dragIndex === index) return;
          const [moved] = order.splice(dragIndex, 1);
          order.splice(index, 0, moved);
          dragIndex = null;
          renderList(id);
        });
        list.append(row);
        if (focusId === id) setTimeout(() => row.querySelector("button:not([disabled])")?.focus({ preventScroll: true }), 0);
      });
    };
    renderList();
    wrap.append(
      h("p", { class: "interactive-hint", text: "Glissez les lignes ou utilisez les flèches. Les horaires sont dans les documents du dossier." }),
      list,
      submitRow("Vérifier la chronologie", () => submit([...order]))
    );
    return wrap;
  };

  const renderClassify = () => {
    const wrap = h("div", { class: "classify-wrap" });
    const cats = h("div", { class: "category-legend" });
    for (const category of puzzle.data.categories) {
      cats.append(h("div", { class: "category-legend-item" },
        h("strong", { text: category.label }),
        h("span", { text: category.description })
      ));
    }
    wrap.append(cats);
    for (const item of puzzle.data.items) {
      const card = h("div", { class: "classify-card" });
      card.append(h("p", { class: "classify-text", text: item.text }));
      const buttons = h("div", { class: "category-buttons" });
      for (const category of puzzle.data.categories) {
        const button = h("button", {
          class: "category-btn",
          type: "button",
          attrs: { "aria-pressed": "false" },
          dataset: { testid: `classify-${item.id}-${category.id}` },
          on: {
            click: () => {
              answer = answer || {};
              answer[item.id] = category.id;
              for (const other of buttons.querySelectorAll(".category-btn")) {
                other.classList.remove("is-selected");
                other.setAttribute("aria-pressed", "false");
              }
              button.classList.add("is-selected");
              button.setAttribute("aria-pressed", "true");
            }
          }
        }, h("span", { text: category.label }));
        buttons.append(button);
      }
      card.append(buttons);
      wrap.append(card);
    }
    wrap.append(submitRow("Vérifier le classement", () => submit(answer)));
    return wrap;
  };

  const renderSingle = () => {
    const wrap = h("div", { class: "single-wrap" });
    const grid = h("div", { class: "single-grid" });
    const buttons = [];
    for (const option of puzzle.data.options) {
      const button = h("button", {
        class: "single-card",
        type: "button",
        attrs: { "aria-pressed": "false" },
        dataset: { testid: `single-${option.id}` },
        on: {
          click: () => {
            answer = option.id;
            for (const other of buttons) {
              other.classList.remove("is-selected");
              other.setAttribute("aria-pressed", "false");
            }
            button.classList.add("is-selected");
            button.setAttribute("aria-pressed", "true");
          }
        }
      });
      if (option.art) {
        const photo = h("div", { class: "photo-frame" });
        mountPhoto(photo, option.art);
        button.append(photo);
      }
      button.append(
        h("span", { class: "single-card-title", text: option.title }),
        h("span", { class: "single-card-text", text: option.text })
      );
      buttons.push(button);
      grid.append(button);
    }
    wrap.append(grid, submitRow("Valider la réponse", () => submit(answer)));
    return wrap;
  };

  const renderCipher = () => {
    const wrap = h("div", { class: "cipher-wrap" });
    wrap.append(h("p", { class: "kicker", text: "TRANSCRIPTION BRUTE" }), h("pre", { class: "doc-code cipher-text" }, h("code", { text: puzzle.data.ciphertext })));
    const controls = h("div", { class: "cipher-controls" });
    const output = h("pre", { class: "doc-code cipher-output", dataset: { testid: "cipher-output" } });
    const update = () => {
      const decoded = decodeCipher(puzzle.data.ciphertext, decoder);
      output.textContent = decoded;
      mirrorBtn.classList.toggle("is-selected", decoder.mirror);
      mirrorBtn.setAttribute("aria-pressed", String(decoder.mirror));
      reverseBtn.classList.toggle("is-selected", decoder.reverse);
      reverseBtn.setAttribute("aria-pressed", String(decoder.reverse));
    };
    const mirrorBtn = h("button", {
      class: "toggle-btn",
      type: "button",
      attrs: { "aria-pressed": "false" },
      dataset: { testid: "cipher-mirror" },
      on: {
        click: () => {
          decoder.mirror = !decoder.mirror;
          update();
        }
      }
    }, icon("refresh", { size: 15 }), h("span", { text: puzzle.data.decoder.mirror }));
    const reverseBtn = h("button", {
      class: "toggle-btn",
      type: "button",
      attrs: { "aria-pressed": "false" },
      dataset: { testid: "cipher-reverse" },
      on: {
        click: () => {
          decoder.reverse = !decoder.reverse;
          update();
        }
      }
    }, icon("arrowLeft", { size: 15 }), h("span", { text: puzzle.data.decoder.reverse }));
    controls.append(mirrorBtn, reverseBtn, h("button", {
      class: "link-btn",
      type: "button",
      text: "Réinitialiser",
      on: {
        click: () => {
          decoder = { mirror: false, reverse: false };
          update();
        }
      }
    }));
    wrap.append(controls, h("p", { class: "kicker kicker--sub", text: "SORTIE DU DÉCODEUR" }), output);
    update();
    const form = h("form", { class: "puzzle-form" });
    const input = h("input", {
      class: "input",
      type: "text",
      attrs: { autocomplete: "off", spellcheck: "false", "aria-label": puzzle.data.question },
      placeholder: puzzle.data.placeholder || "Votre réponse…",
      dataset: { testid: "cipher-answer" }
    });
    form.append(
      h("label", { class: "field-label", text: puzzle.data.question }),
      input,
      h("button", { class: "btn btn-primary", type: "submit" }, icon("check", { size: 16 }), h("span", { text: "Valider le message" }))
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submit(input.value);
    });
    wrap.append(form);
    return wrap;
  };

  const renderMastermind = () => {
    const wrap = h("div", { class: "mastermind-wrap" });
    const clues = h("div", { class: "mastermind-clues" });
    clues.append(h("p", { class: "kicker", text: "TENTATIVES DE MAINTENANCE" }));
    const clueList = h("ul", { class: "mm-list" });
    for (const clue of puzzle.data.clues) {
      clueList.append(
        h("li", {},
          h("span", { class: "mm-guess", text: clue.guess.split("").join(" ") }),
          h("span", { class: "mm-feedback", text: `${clue.correct} correct${clue.correct > 1 ? "s" : ""}, ${clue.placed} bien placé${clue.placed > 1 ? "s" : ""}` })
        )
      );
    }
    clues.append(clueList);
    wrap.append(clues);

    const progress = gameState.getPuzzleProgress(puzzle.id);
    const guesses = progress.meta?.guesses || [];
    if (guesses.length) {
      const history = h("div", { class: "mastermind-history" });
      history.append(h("p", { class: "kicker", text: "VOS ESSAIS" }));
      const list = h("ul", { class: "mm-list" });
      for (const guess of guesses) {
        list.append(
          h("li", {},
            h("span", { class: "mm-guess", text: String(guess.guess).split("").join(" ") }),
            h("span", { class: "mm-feedback", text: `${guess.correct} correct${guess.correct > 1 ? "s" : ""}, ${guess.placed} bien placé${guess.placed > 1 ? "s" : ""}` })
          )
        );
      }
      history.append(list);
      wrap.append(history);
    }

    const form = h("form", { class: "puzzle-form mastermind-form" });
    const input = h("input", {
      class: "input input--code",
      type: "text",
      attrs: {
        inputmode: "numeric",
        pattern: "[0-9]{4}",
        maxlength: "4",
        autocomplete: "off",
        spellcheck: "false",
        "aria-label": "Code d’intégrité à quatre chiffres"
      },
      placeholder: "••••",
      dataset: { testid: "mastermind-input" }
    });
    form.append(
      h("label", { class: "field-label", text: "Code d’intégrité — quatre chiffres" }),
      input,
      h("button", { class: "btn btn-primary", type: "submit" }, icon("key", { size: 16 }), h("span", { text: "Valider le code" }))
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submit(input.value.trim());
    });
    wrap.append(form);
    return wrap;
  };

  const renderChain = () => {
    const wrap = h("div", { class: "chain-wrap" });
    const available = puzzle.data.cards.filter((card) => gameState.isEvidenceFound(card.evidence));
    const locked = puzzle.data.cards.length - available.length;
    wrap.append(
      h("p", { class: "interactive-hint", text: `Sélectionnez ${puzzle.data.length} preuves et ordonnez-les. ${available.length} preuve${available.length > 1 ? "s" : ""} consultée${available.length > 1 ? "s" : ""}.` })
    );
    if (locked > 0) {
      wrap.append(
        h("p", { class: "warning-inline" }, icon("lock", { size: 14 }), h("span", { text: "Certaines preuves ne sont pas encore consultées. Retournez dans les lieux du dossier 05 pour les retrouver." }))
      );
    }
    const slots = h("div", { class: "chain-slots" });
    let submitBtn = null;
    const updateSubmit = () => {
      if (submitBtn) submitBtn.disabled = selected.length !== puzzle.data.length;
    };
    const renderSlots = () => {
      clear(slots);
      for (let index = 0; index < puzzle.data.length; index += 1) {
        const id = selected[index];
        const card = id ? puzzle.data.cards.find((entry) => entry.id === id) : null;
        const slot = h("div", { class: `chain-slot${card ? " is-filled" : ""}`, dataset: { testid: `chain-slot-${index}` } });
        slot.append(
          h("span", { class: "chain-index", text: String(index + 1).padStart(2, "0") }),
          h("span", { class: "chain-slot-text", text: card?.title || "Preuve attendue…" })
        );
        if (card) {
          slot.append(
            h("span", { class: "chain-controls" },
              h("button", {
                class: "icon-btn",
                type: "button",
                attrs: { "aria-label": "Monter" },
                disabled: index === 0,
                on: {
                  click: () => {
                    [selected[index - 1], selected[index]] = [selected[index], selected[index - 1]];
                    renderSlots();
                  }
                }
              }, icon("arrowUp", { size: 14 })),
              h("button", {
                class: "icon-btn",
                type: "button",
                attrs: { "aria-label": "Descendre" },
                disabled: index === selected.length - 1,
                on: {
                  click: () => {
                    [selected[index + 1], selected[index]] = [selected[index], selected[index + 1]];
                    renderSlots();
                  }
                }
              }, icon("arrowDown", { size: 14 })),
              h("button", {
                class: "icon-btn",
                type: "button",
                attrs: { "aria-label": "Retirer" },
                on: {
                  click: () => {
                    selected.splice(index, 1);
                    renderSlots();
                    renderPool();
                  }
                }
              }, icon("x", { size: 14 }))
            )
          );
        }
        slots.append(slot);
      }
      updateSubmit();
    };
    const pool = h("div", { class: "chain-pool" });
    const renderPool = () => {
      clear(pool);
      for (const card of puzzle.data.cards) {
        const found = gameState.isEvidenceFound(card.evidence);
        const inSequence = selected.includes(card.id);
        const button = h("button", {
          class: `chain-card${!found ? " is-locked" : ""}${inSequence ? " is-selected" : ""}`,
          type: "button",
          disabled: !found || inSequence || selected.length >= puzzle.data.length,
          dataset: { testid: `chain-card-${card.id}` },
          on: {
            click: () => {
              if (selected.length >= puzzle.data.length) return;
              selected.push(card.id);
              renderSlots();
              renderPool();
            }
          }
        });
        button.append(
          h("span", { class: "chain-card-title", text: found ? card.title : "Preuve non consultée" }),
          h("span", { class: "chain-card-excerpt", text: found ? card.excerpt : "Retournez dans les lieux du dossier 05." }),
          h("span", { class: "chain-card-action" }, icon(found ? (inSequence ? "check" : "plus") : "lock", { size: 13 }), h("span", { text: found ? (inSequence ? "Dans la chaîne" : "Ajouter") : "Verrouillée" }))
        );
        pool.append(button);
      }
    };
    renderSlots();
    renderPool();
    wrap.append(h("p", { class: "kicker", text: "CHAÎNE" }), slots, h("p", { class: "kicker", text: "PREUVES DISPONIBLES" }), pool);
    const row = submitRow("Vérifier la chaîne", () => submit([...selected]), selected.length !== puzzle.data.length, "chain-submit");
    submitBtn = row.querySelector("button");
    wrap.append(row);
    updateSubmit();
    return wrap;
  };

  renderBody();
  return () => {
    shell.cleanup();
  };
}
