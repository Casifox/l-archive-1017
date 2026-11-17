/**
 * Petite fabrique DOM sûre.
 *
 * Aucun contenu utilisateur n’est injecté via innerHTML. Les seuls usages
 * d’innerHTML concernent les icônes SVG internes (js/ui/icons.js), qui sont
 * des constantes de confiance.
 */

export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class" || key === "className") {
      element.className = value;
    } else if (key === "text") {
      element.textContent = String(value);
    } else if (key === "dataset") {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        if (dataValue !== null && dataValue !== undefined) element.dataset[dataKey] = String(dataValue);
      }
    } else if (key === "style") {
      for (const [styleKey, styleValue] of Object.entries(value)) {
        if (styleValue !== null && styleValue !== undefined) element.style[styleKey] = String(styleValue);
      }
    } else if (key === "on") {
      for (const [eventName, handler] of Object.entries(value)) {
        if (typeof handler === "function") element.addEventListener(eventName, handler);
      }
    } else if (key === "attrs") {
      for (const [attr, attrValue] of Object.entries(value)) {
        if (attrValue === null || attrValue === undefined || attrValue === false) continue;
        element.setAttribute(attr, attrValue === true ? "" : String(attrValue));
      }
    } else if (key === "html") {
      // Réservé aux constantes internes de confiance. Ne jamais passer de
      // donnée de sauvegarde ou de contenu utilisateur ici.
      element.innerHTML = value;
    } else if (key in element && typeof value !== "object") {
      element[key] = value;
    } else {
      element.setAttribute(key, String(value));
    }
  }
  append(element, children);
  return element;
}

export function append(parent, children) {
  if (children === null || children === undefined || children === false) return parent;
  if (Array.isArray(children)) {
    for (const child of children) append(parent, child);
    return parent;
  }
  if (children instanceof Node) {
    parent.append(children);
    return parent;
  }
  parent.append(document.createTextNode(String(children)));
  return parent;
}

export function clear(element) {
  if (!element) return element;
  while (element.firstChild) element.removeChild(element.firstChild);
  return element;
}

export function replace(element, ...children) {
  clear(element);
  append(element, children);
  return element;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

/** Ajoute un écouteur et renvoie sa fonction de nettoyage. */
export function on(target, type, handler, options) {
  if (!target) return () => {};
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** Délégation d’événement, avec nettoyage. */
export function delegate(root, selector, type, handler) {
  if (!root) return () => {};
  const listener = (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}

export function focusFirst(container) {
  const focusable = getFocusable(container);
  if (focusable.length) focusable[0].focus();
  else container?.focus?.();
}

export function getFocusable(container) {
  if (!container) return [];
  return [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ].filter((element) => element.offsetParent !== null || element === document.activeElement);
}

/**
 * Piège le focus dans un conteneur (modales). Renvoie la fonction de
 * nettoyage et restaure le focus précédent.
 */
export function trapFocus(container) {
  const previous = document.activeElement;
  const handler = (event) => {
    if (event.key !== "Tab") return;
    const focusable = getFocusable(container);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener("keydown", handler);
  focusFirst(container);
  return () => {
    container.removeEventListener("keydown", handler);
    if (previous instanceof HTMLElement) previous.focus();
  };
}

export function setBusy(button, busy, label = "Veuillez patienter…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = label;
    button.setAttribute("aria-busy", "true");
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
    button.removeAttribute("aria-busy");
  }
}
