/** Pages simples : coquille de jeu si une partie est chargée, sinon page autonome. */

import { h, clear } from "../dom.js";
import { renderBrand, renderShell } from "./shell.js";

export function renderStaticPage(root, context, { eyebrow, title, subtitle, content, backPath = "/menu", backLabel = "Menu principal" }) {
  const loaded = context.gameState?.isLoaded?.();
  if (loaded) {
    const shell = renderShell(root, {
      context,
      active: "",
      eyebrow,
      title,
      subtitle,
      back: { path: backPath, label: backLabel },
      content
    });
    return () => shell.cleanup();
  }

  clear(root);
  const screen = h("div", { class: "standalone-screen" });
  const top = h("header", { class: "standalone-top" },
    renderBrand({ href: "#/menu" }),
    h("a", { class: "btn btn-ghost", href: `#${backPath}` }, h("span", { text: backLabel }))
  );
  const main = h("main", { class: "standalone-main", id: "main" },
    h("div", { class: "page-head" },
      eyebrow ? h("p", { class: "eyebrow", text: eyebrow }) : null,
      h("h1", { class: "page-title", text: title }),
      subtitle ? h("p", { class: "page-subtitle", text: subtitle }) : null
    ),
    h("div", { class: "page-body" }, content)
  );
  screen.append(top, main);
  root.append(screen);
  return () => clear(root);
}
