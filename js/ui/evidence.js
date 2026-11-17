/** Rendu sûr des documents et fiches de preuve. */

import { h } from "../dom.js";
import { icon } from "./icons.js";
import { openModal } from "./modal.js";

export function renderEvidenceBlocks(item) {
  const container = h("div", { class: "evidence-document" });
  for (const block of item.blocks || []) {
    switch (block.type) {
      case "meta":
        container.append(
          h("p", { class: "doc-meta" },
            h("span", { class: "doc-meta-label", text: block.label }),
            h("span", { class: "doc-meta-value", text: block.value })
          )
        );
        break;
      case "quote":
        container.append(h("blockquote", { class: "doc-quote", text: block.text }));
        break;
      case "code":
        container.append(h("pre", { class: "doc-code" }, h("code", { text: block.text })));
        break;
      case "list": {
        const list = h("ul", { class: "doc-list" });
        for (const entry of block.items || []) list.append(h("li", { text: entry }));
        container.append(list);
        break;
      }
      case "warning":
        container.append(
          h("p", { class: "doc-warning" }, icon("warning", { size: 15 }), h("span", { text: block.text }))
        );
        break;
      case "p":
      default:
        container.append(h("p", { class: "doc-paragraph", text: block.text || "" }));
        break;
    }
  }
  return container;
}

export function evidenceMeta(item) {
  return h("div", { class: "evidence-meta" },
    h("span", { class: "evidence-tag" }, icon("file", { size: 13 }), h("span", { text: item.category })),
    item.date ? h("span", { class: "evidence-tag" }, icon("clock", { size: 13 }), h("span", { text: item.date })) : null,
    h("span", { class: "evidence-tag" }, icon("archive", { size: 13 }), h("span", { text: `Dossier ${String(item.dossier).padStart(2, "0")}` })),
    item.secret ? h("span", { class: "evidence-tag evidence-tag--secret" }, icon("lock", { size: 13 }), h("span", { text: "Document secret" })) : null,
    item.important ? h("span", { class: "evidence-tag evidence-tag--important" }, icon("alert", { size: 13 }), h("span", { text: "Pièce essentielle" })) : null
  );
}

export function openEvidenceModal(context, item, { onRead = null } = {}) {
  const { gameState } = context;
  if (!item) return null;
  const content = h("div", { class: "evidence-modal-content" });
  content.append(evidenceMeta(item), renderEvidenceBlocks(item));
  if (item.summary) {
    content.prepend(h("p", { class: "evidence-summary", text: item.summary }));
  }
  const modal = openModal({
    title: item.title,
    subtitle: `Document ${String(item.dossier).padStart(2, "0")} — ${item.category}`,
    content,
    size: "lg",
    testid: "evidence-modal",
    onClose: () => {
      gameState.markEvidenceRead(item.id);
      onRead?.(item);
    },
    actions: [{ label: "Fermer", variant: "primary", testid: "evidence-close" }]
  });
  return modal;
}

export function renderEvidenceCard(item, { onOpen, selected = false, footer = null, testid = "" } = {}) {
  const card = h("button", {
    class: `evidence-card${selected ? " is-selected" : ""}`,
    type: "button",
    dataset: { testid: testid || `evidence-card-${item.id}`, evidenceId: item.id },
    attrs: { "aria-pressed": String(selected) },
    on: { click: () => onOpen?.(item) }
  });
  card.append(
    h("div", { class: "evidence-card-top" },
      h("span", { class: "evidence-card-icon" }, icon("file", { size: 16 })),
      h("span", { class: "evidence-card-category", text: item.category }),
      item.secret ? h("span", { class: "evidence-card-flag", title: "Document secret" }, icon("lock", { size: 12 })) : null,
      item.important ? h("span", { class: "evidence-card-flag evidence-card-flag--important", title: "Pièce essentielle" }, icon("alert", { size: 12 })) : null
    ),
    h("h3", { class: "evidence-card-title", text: item.title }),
    h("p", { class: "evidence-card-summary", text: item.summary }),
    h("div", { class: "evidence-card-foot" },
      h("span", { class: "evidence-card-date", text: item.date || `Dossier ${String(item.dossier).padStart(2, "0")}` }),
      footer || h("span", { class: "evidence-card-open" }, h("span", { text: "Lire" }), icon("arrowRight", { size: 12 }))
    )
  );
  return card;
}
