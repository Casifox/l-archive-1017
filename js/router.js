/**
 * Routeur par hash — compatible GitHub Pages dans un sous-dossier.
 *
 * Chaque écran expose mount(root, ctx) et renvoie une fonction de nettoyage
 * (ou un objet { destroy }). Le routeur détruit l’écran précédent avant de
 * monter le suivant, ce qui évite les écouteurs orphelins.
 */

const DEFAULT_ROUTE = "/menu";

const ROUTES = [
  { name: "menu", pattern: /^\/menu$/, label: "Accueil" },
  { name: "charger", pattern: /^\/charger$/, label: "Charger une sauvegarde" },
  { name: "intro", pattern: /^\/intro$/, label: "Connexion", guard: "intro" },
  { name: "hub", pattern: /^\/hub$/, label: "Salle des archives", guard: "game" },
  { name: "dossier", pattern: /^\/dossier\/(\d+)$/, label: "Dossier", guard: "dossier" },
  { name: "enquete", pattern: /^\/dossier\/(\d+)\/enquete$/, label: "Enquête", guard: "dossier" },
  { name: "cloture", pattern: /^\/dossier\/(\d+)\/cloture$/, label: "Clôture", guard: "cloture" },
  { name: "puzzle", pattern: /^\/enigme\/([a-z0-9-]+)$/, label: "Énigme", guard: "puzzle" },
  { name: "preuves", pattern: /^\/preuves$/, label: "Preuves", guard: "game" },
  { name: "journal", pattern: /^\/journal$/, label: "Journal", guard: "game" },
  { name: "tableau", pattern: /^\/tableau$/, label: "Tableau d’enquête", guard: "game" },
  { name: "succes", pattern: /^\/succes$/, label: "Succès", guard: "game" },
  { name: "statistiques", pattern: /^\/statistiques$/, label: "Statistiques", guard: "game" },
  { name: "parametres", pattern: /^\/parametres$/, label: "Paramètres" },
  { name: "aide", pattern: /^\/aide$/, label: "Aide" },
  { name: "credits", pattern: /^\/credits$/, label: "Crédits" },
  { name: "finale", pattern: /^\/finale$/, label: "La dernière porte", guard: "finale" },
  { name: "fin", pattern: /^\/fin(?:\/([a-z]+))?$/, label: "Fin", guard: "ending" }
];

export class Router {
  constructor({ root, screens, context, fallbackScreen = null }) {
    this.root = root;
    this.screens = screens;
    this.context = context;
    this.fallbackScreen = fallbackScreen;
    this.current = null;
    this.currentRoute = null;
    this.cleanup = null;
    this.started = false;
    this._hashHandler = () => this.handle();
    this._errorHandler = (event) => this.handleRuntimeError(event);
  }

  start() {
    if (this.started) return;
    this.started = true;
    window.addEventListener("hashchange", this._hashHandler);
    window.addEventListener("error", this._errorHandler);
    window.addEventListener("unhandledrejection", this._errorHandler);
    if (!window.location.hash) {
      this.navigate(DEFAULT_ROUTE, { replace: true });
    } else {
      this.handle();
    }
  }

  stop() {
    this.started = false;
    window.removeEventListener("hashchange", this._hashHandler);
    window.removeEventListener("error", this._errorHandler);
    window.removeEventListener("unhandledrejection", this._errorHandler);
    this.destroyCurrent();
  }

  destroyCurrent() {
    if (typeof this.cleanup === "function") {
      try {
        this.cleanup();
      } catch (error) {
        console.error("Erreur de nettoyage d’écran", error);
      }
    }
    this.cleanup = null;
    this.current = null;
    if (this.root) this.root.replaceChildren();
  }

  getPath() {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#")) return DEFAULT_ROUTE;
    const path = hash.slice(1);
    return path.startsWith("/") ? path : `/${path}`;
  }

  navigate(path, { replace = false } = {}) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const target = `#${normalized}`;
    if (window.location.hash === target) {
      this.handle();
      return;
    }
    if (replace) {
      const url = `${window.location.pathname}${window.location.search}${target}`;
      window.history.replaceState(null, "", url);
      this.handle();
    } else {
      window.location.hash = target;
    }
  }

  refresh() {
    this.handle({ force: true });
  }

  match(path) {
    for (const route of ROUTES) {
      const match = path.match(route.pattern);
      if (match) {
        const params = {};
        if (route.name === "dossier" || route.name === "enquete" || route.name === "cloture") params.id = Number(match[1]);
        if (route.name === "puzzle") params.puzzleId = match[1];
        if (route.name === "fin") params.endingId = match[1] || null;
        return { route, params };
      }
    }
    return null;
  }

  guard(route, params) {
    const state = this.context.gameState;
    const ensureLoaded = () => {
      if (state.isLoaded()) return true;
      const result = state.loadFromStorage();
      return result.ok;
    };

    if (route.guard === "intro") {
      return ensureLoaded() ? null : "/menu";
    }

    if (route.guard) {
      if (!ensureLoaded()) return "/menu";
      const current = state.getState();
      if (!current?.introDone && route.name !== "intro") return "/intro";
    }

    if (route.name === "dossier" || route.name === "enquete" || route.name === "cloture") {
      if (!state.isDossierUnlocked(params.id)) return "/hub";
      if (route.name === "cloture") {
        const dossier = state.getDossier(params.id);
        if (!dossier) return "/hub";
        const progress = state.getDossierProgress(params.id);
        if (!progress.completed && !progress.canComplete) return `/dossier/${params.id}`;
      }
    }

    if (route.name === "puzzle") {
      const puzzle = state.getPuzzle(params.puzzleId);
      if (!puzzle) return "/hub";
      if (!state.isDossierUnlocked(puzzle.dossier)) return "/hub";
    }

    if (route.name === "finale") {
      if (!state.isDossierCompleted(5)) return "/hub";
      const current = state.getState();
      if (current?.ending) return `/fin/${current.ending}`;
    }

    if (route.name === "fin") {
      const ending = state.getState()?.ending;
      if (!ending) return "/finale";
      if (params.endingId && params.endingId !== ending) return `/fin/${ending}`;
    }

    return null;
  }

  handle({ force = false } = {}) {
    const path = this.getPath();
    if (!force && this.currentRoute?.path === path) return;

    const matched = this.match(path);
    if (!matched) {
      this.renderScreen("not-found", { path }, { name: "not-found", label: "Introuvable" }, `/404`);
      return;
    }

    const redirect = this.guard(matched.route, matched.params);
    if (redirect) {
      if (redirect !== path) this.navigate(redirect, { replace: true });
      return;
    }

    this.renderScreen(
      matched.route.name,
      { ...matched.params, path },
      matched.route,
      path
    );
  }

  renderScreen(name, params, route, path) {
    const screen = this.screens[name] || this.fallbackScreen;
    if (!screen || typeof screen.mount !== "function") {
      console.error(`Écran introuvable : ${name}`);
      return;
    }

    this.destroyCurrent();
    this.currentRoute = { name, path };
    document.title = `${route.label} — L’ARCHIVE 1017`;
    const announcer = document.getElementById("route-announcer");
    if (announcer) announcer.textContent = `${route.label}.`;
    window.scrollTo({ top: 0, behavior: "auto" });

    try {
      const result = screen.mount(this.root, {
        ...this.context,
        params,
        route,
        navigate: (target, options) => this.navigate(target, options),
        refresh: () => this.refresh(),
        setTitle: (title) => {
          document.title = `${title} — L’ARCHIVE 1017`;
          if (announcer) announcer.textContent = `${title}.`;
        }
      });
      if (typeof result === "function") this.cleanup = result;
      else if (result && typeof result.destroy === "function") this.cleanup = () => result.destroy();
      else this.cleanup = null;

      const main = this.root.querySelector("main");
      if (main) {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    } catch (error) {
      console.error(`Erreur de rendu de l’écran ${name}`, error);
      this.renderError(error);
    }
  }

  renderError(error) {
    if (!this.root) return;
    this.root.replaceChildren();
    const wrapper = document.createElement("div");
    wrapper.className = "fatal-screen";
    const panel = document.createElement("div");
    panel.className = "panel fatal-panel";
    const title = document.createElement("h1");
    title.textContent = "L’archive a rencontré une erreur.";
    const text = document.createElement("p");
    text.textContent = "La session n’a pas été perdue. Rechargez la page ou revenez à l’accueil.";
    const actions = document.createElement("div");
    actions.className = "button-row";
    const reload = document.createElement("button");
    reload.className = "btn btn-primary";
    reload.textContent = "Recharger";
    reload.addEventListener("click", () => window.location.reload());
    const home = document.createElement("a");
    home.className = "btn btn-ghost";
    home.href = "#/menu";
    home.textContent = "Accueil";
    actions.append(reload, home);
    panel.append(title, text, actions);
    wrapper.append(panel);
    this.root.append(wrapper);
    console.error(error);
  }

  handleRuntimeError(event) {
    // Les erreurs non gérées ne doivent jamais être masquées : on les
    // journalise, et on laisse le jeu continuer si possible.
    console.error("Erreur non gérée", event?.error || event?.reason || event);
  }
}

export { ROUTES };
