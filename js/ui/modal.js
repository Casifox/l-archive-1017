/** Modales accessibles : focus piégé, Échap, empilement, verrou de scroll. */

import { h, append, clear, trapFocus } from "../dom.js";
import { icon } from "./icons.js";

const stack = [];
let scrollLock = null;
let idCounter = 0;

function lockScroll() {
  if (scrollLock) return;
  scrollLock = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight
  };
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  document.body.classList.add("modal-open");
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
}

function unlockScroll() {
  if (!scrollLock) return;
  document.body.style.overflow = scrollLock.overflow;
  document.body.style.paddingRight = scrollLock.paddingRight;
  document.body.classList.remove("modal-open");
  scrollLock = null;
}

export function hasOpenModal() {
  return stack.length > 0;
}

export function closeTopModal() {
  const top = stack[stack.length - 1];
  if (top) top.close();
}

export function closeAllModals() {
  while (stack.length) stack[stack.length - 1].close();
}

/**
 * Ouvre une modale.
 * @param {{title:string, subtitle?:string, content:Node|Node[], actions?:Array, size?:string, dismissible?:boolean, onClose?:Function, testid?:string}} options
 */
export function openModal({
  title,
  subtitle = "",
  content = null,
  actions = [],
  size = "md",
  dismissible = true,
  onClose = null,
  testid = "modal"
}) {
  const root = document.getElementById("modal-root");
  if (!root) return { close: () => {}, element: null };

  const id = `modal-title-${++idCounter}`;
  const overlay = h("div", { class: "modal-overlay", dataset: { testid: `${testid}-overlay` } });
  const panel = h("section", {
    class: `modal modal--${size}`,
    attrs: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": id,
      tabindex: "-1"
    },
    dataset: { testid }
  });

  const header = h("header", { class: "modal-header" });
  const titleWrap = h("div", { class: "modal-title-wrap" });
  titleWrap.append(h("p", { class: "modal-eyebrow", text: "ARCHIVE 1017" }));
  titleWrap.append(h("h2", { class: "modal-title", id, text: title }));
  if (subtitle) titleWrap.append(h("p", { class: "modal-subtitle", text: subtitle }));
  header.append(titleWrap);
  if (dismissible) {
    const closeButton = h("button", {
      class: "icon-btn modal-close",
      type: "button",
      attrs: { "aria-label": "Fermer" },
      on: { click: () => close() }
    }, icon("x", { size: 18 }));
    header.append(closeButton);
  }
  panel.append(header);

  const body = h("div", { class: "modal-body" });
  append(body, content);
  panel.append(body);

  if (actions.length) {
    const footer = h("footer", { class: "modal-footer" });
    for (const action of actions) {
      if (action.node) {
        footer.append(action.node);
        continue;
      }
      const button = h("button", {
        class: `btn ${action.variant === "primary" ? "btn-primary" : action.variant === "danger" ? "btn-danger" : "btn-ghost"}`,
        type: "button",
        text: action.label,
        disabled: Boolean(action.disabled),
        dataset: { testid: action.testid || `modal-action-${action.label}` },
        on: {
          click: () => {
            const result = action.onClick?.();
            if (action.closeOnClick !== false && result !== false) close();
          }
        }
      });
      footer.append(button);
    }
    panel.append(footer);
  }

  overlay.append(panel);
  root.append(overlay);
  lockScroll();
  const releaseFocus = trapFocus(panel);

  const onKeyDown = (event) => {
    if (event.key === "Escape" && dismissible) {
      event.preventDefault();
      close();
    }
  };
  document.addEventListener("keydown", onKeyDown);

  const onOverlayClick = (event) => {
    if (event.target === overlay && dismissible) close();
  };
  overlay.addEventListener("mousedown", onOverlayClick);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeyDown);
    releaseFocus();
    overlay.classList.add("is-leaving");
    const index = stack.findIndex((entry) => entry.close === close);
    if (index >= 0) stack.splice(index, 1);
    setTimeout(() => {
      overlay.remove();
      if (!stack.length) unlockScroll();
    }, 180);
    onClose?.();
  }

  const entry = { close, element: panel, overlay, body };
  stack.push(entry);
  return entry;
}

/** Confirmation simple. Résout true si confirmé. */
export function confirmDialog({
  title = "Confirmer",
  message = "",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false
}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    openModal({
      title,
      content: h("p", { class: "modal-text", text: message }),
      size: "sm",
      onClose: () => finish(false),
      actions: [
        { label: cancelLabel, variant: "ghost", onClick: () => finish(false) },
        {
          label: confirmLabel,
          variant: danger ? "danger" : "primary",
          onClick: () => {
            finish(true);
            return true;
          },
          testid: "confirm-accept"
        }
      ]
    });
  });
}

/** Confirmation par mot saisi. Résout true si le mot correspond. */
export function confirmWordDialog({
  title,
  message,
  word,
  confirmLabel = "Confirmer",
  inputLabel = `Tapez « ${word} » pour confirmer`
}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const input = h("input", {
      class: "input",
      type: "text",
      attrs: { autocomplete: "off", spellcheck: "false", "aria-label": inputLabel },
      placeholder: word,
      dataset: { testid: "confirm-word-input" }
    });
    const error = h("p", { class: "form-error", attrs: { role: "alert" } });
    const content = h("div", { class: "confirm-word" },
      h("p", { class: "modal-text", text: message }),
      h("label", { class: "field-label", text: inputLabel }),
      input,
      error
    );
    const modal = openModal({
      title,
      content,
      size: "sm",
      onClose: () => finish(false),
      actions: [
        { label: "Annuler", variant: "ghost", onClick: () => finish(false) },
        {
          label: confirmLabel,
          variant: "danger",
          testid: "confirm-word-accept",
          closeOnClick: false,
          onClick: () => {
            if (input.value.trim().toLowerCase() !== word.toLowerCase()) {
              error.textContent = `Le mot ne correspond pas. Tapez « ${word} ».`;
              input.focus();
              return false;
            }
            finish(true);
            modal.close();
            return true;
          }
        }
      ]
    });
    setTimeout(() => input.focus(), 60);
  });
}

export function getModalStackSize() {
  return stack.length;
}
