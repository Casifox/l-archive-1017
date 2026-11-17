/** Notifications discrètes, empilées, accessibles. */

import { h, clear } from "../dom.js";
import { icon } from "./icons.js";

let host = null;
const MAX_TOASTS = 4;

export function initToasts(element) {
  host = element;
  if (host && !host.getAttribute("aria-live")) host.setAttribute("aria-live", "polite");
}

const ICONS = {
  info: "info",
  success: "check",
  warning: "warning",
  error: "alert",
  achievement: "trophy",
  evidence: "file"
};

export function showToast(message, type = "info", { title = "", duration = 4200, action = null } = {}) {
  if (!host) {
    host = document.getElementById("toast-root");
    if (!host) return null;
  }
  if (host.children.length >= MAX_TOASTS) host.firstElementChild?.remove();

  const toast = h("div", {
    class: `toast toast--${type}`,
    attrs: { role: type === "error" ? "alert" : "status" }
  });
  const iconWrap = h("span", { class: "toast-icon" }, icon(ICONS[type] || "info", { size: 18 }));
  const body = h("div", { class: "toast-body" });
  if (title) body.append(h("p", { class: "toast-title", text: title }));
  body.append(h("p", { class: "toast-message", text: message }));
  if (action?.label) {
    const actionButton = h("button", {
      class: "toast-action",
      type: "button",
      text: action.label,
      on: {
        click: () => {
          action.onClick?.();
          remove();
        }
      }
    });
    body.append(actionButton);
  }
  const close = h("button", {
    class: "toast-close",
    type: "button",
    attrs: { "aria-label": "Fermer la notification" },
    on: { click: () => remove() }
  }, icon("x", { size: 14 }));
  toast.append(iconWrap, body, close);
  host.append(toast);

  let timer = null;
  const remove = () => {
    if (timer) clearTimeout(timer);
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 220);
  };
  const start = () => {
    if (duration > 0) timer = setTimeout(remove, duration);
  };
  toast.addEventListener("mouseenter", () => timer && clearTimeout(timer));
  toast.addEventListener("mouseleave", start);
  start();
  return remove;
}

export function clearToasts() {
  if (host) clear(host);
}
