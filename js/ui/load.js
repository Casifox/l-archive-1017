/** Chargement, restauration, export et import de sauvegarde. */

import { h, clear } from "../dom.js";
import { BACKUP_KEY, SAVE_KEY } from "../save-manager.js";
import { formatRealDate, formatShortPlayTime, summarizeState } from "../save-schema.js";
import { dateStamp, downloadText, readFileAsText } from "../utils.js";
import { icon } from "./icons.js";
import { renderStaticPage } from "./page.js";
import { confirmDialog, openModal } from "./modal.js";
import { showToast } from "./toast.js";

function saveCard({ title, summary, emptyText, actions }) {
  const card = h("section", { class: "panel load-card" });
  card.append(h("p", { class: "kicker", text: title }));
  if (summary) {
    card.append(
      h("div", { class: "load-summary" },
        h("p", { class: "load-summary-main", text: `Dossier ${String(summary.dossier).padStart(2, "0")} · ${summary.completed} dossier${summary.completed > 1 ? "s" : ""} clos` }),
        h("p", { class: "load-summary-line", text: `${summary.evidence} preuves · ${summary.puzzles} énigmes · ${formatShortPlayTime(summary.playTime)}` }),
        h("p", { class: "muted small", text: `Dernière sauvegarde : ${formatRealDate(summary.updatedAt)}` })
      )
    );
  } else {
    card.append(h("p", { class: "muted small", text: emptyText }));
  }
  if (actions?.length) {
    const row = h("div", { class: "button-row" });
    for (const action of actions) {
      row.append(
        h("button", {
          class: `btn ${action.variant === "primary" ? "btn-primary" : action.variant === "danger" ? "btn-danger" : "btn-ghost"}`,
          type: "button",
          text: action.label,
          disabled: Boolean(action.disabled),
          dataset: { testid: action.testid || "" },
          on: { click: action.onClick }
        })
      );
    }
    card.append(row);
  }
  return card;
}

export function mountLoad(root, context) {
  const { gameState, navigate, audio } = context;
  gameState.setPlaying(false);
  const loaded = gameState.saveManager.load();
  const primary = gameState.saveManager.getSummary(SAVE_KEY);
  const backup = gameState.saveManager.getSummary(BACKUP_KEY);
  const storageOk = gameState.saveManager.available;
  const importing = { busy: false };

  const continueGame = () => {
    const result = gameState.loadFromStorage();
    if (!result.ok) {
      openModal({
        title: "Sauvegarde indisponible",
        content: h("p", { class: "modal-text", text: result.error || "Aucune sauvegarde lisible." }),
        size: "sm",
        actions: [{ label: "Fermer", variant: "primary" }]
      });
      return;
    }
    audio.unlock();
    gameState.setPlaying(true);
    const state = gameState.getState();
    if (state.ending) navigate(`/fin/${state.ending}`);
    else if (!state.introDone) navigate("/intro");
    else navigate("/hub");
  };

  const exportCurrent = () => {
    try {
      let state = gameState.isLoaded() ? gameState.getState() : null;
      if (!state) {
        const result = gameState.saveManager.load();
        if (!result.ok) throw new Error("Aucune sauvegarde valide à exporter.");
        state = result.state;
      }
      const text = gameState.saveManager.exportSave(state);
      downloadText(`archive-1017-sauvegarde-${dateStamp()}.json`, text);
      showToast("Sauvegarde exportée.", "success", { title: "Export" });
    } catch (error) {
      showToast(error.message || "Export impossible.", "error", { title: "Export" });
    }
  };

  const restoreBackup = async () => {
    const ok = await confirmDialog({
      title: "Restaurer la copie de secours",
      message: "La sauvegarde principale sera remplacée par la copie de secours. La progression actuelle de la copie principale sera perdue.",
      confirmLabel: "Restaurer",
      cancelLabel: "Annuler",
      danger: true
    });
    if (!ok) return;
    const result = gameState.saveManager.restoreBackup();
    if (!result.ok) {
      showToast(result.error || "Restauration impossible.", "error", { title: "Sauvegarde" });
      return;
    }
    const loadedNow = gameState.loadFromStorage();
    if (!loadedNow.ok) {
      showToast(loadedNow.error || "La copie restaurée n’a pas pu être chargée.", "error", { title: "Sauvegarde" });
      return;
    }
    audio.play("success");
    showToast("Copie de secours restaurée.", "success", { title: "Sauvegarde" });
    context.refresh();
  };

  const importFile = async (file) => {
    if (!file || importing.busy) return;
    importing.busy = true;
    try {
      const text = await readFileAsText(file);
      const result = gameState.importSave(text);
      if (!result.ok) {
        openModal({
          title: "Import refusé",
          content: h("p", { class: "modal-text", text: result.error || "Le fichier n’est pas une sauvegarde valide." }),
          size: "sm",
          actions: [{ label: "Fermer", variant: "primary" }]
        });
        return;
      }
      const summary = summarizeState(result.state);
      const ok = await confirmDialog({
        title: "Importer cette sauvegarde ?",
        message: `Dossier ${String(summary.dossier).padStart(2, "0")} · ${summary.evidence} preuves · ${summary.puzzles} énigmes · ${summary.completed} dossiers clos. La sauvegarde actuelle sera conservée en copie de secours.`,
        confirmLabel: "Importer",
        cancelLabel: "Annuler"
      });
      if (!ok) return;
      const adopted = gameState.adoptState(result.state);
      if (!adopted.ok) {
        showToast(adopted.error || "Import impossible.", "error", { title: "Sauvegarde" });
        return;
      }
      audio.play("success");
      showToast("Sauvegarde importée.", "success", { title: "Import" });
      navigate("/hub");
    } catch (error) {
      showToast("Le fichier n’a pas pu être lu.", "error", { title: "Import" });
      console.error(error);
    } finally {
      importing.busy = false;
    }
  };

  const fileInput = h("input", {
    type: "file",
    accept: ".json,application/json",
    hidden: true,
    dataset: { testid: "load-import-file" },
    on: {
      change: () => {
        const file = fileInput.files?.[0];
        fileInput.value = "";
        if (file) importFile(file);
      }
    }
  });

  const dropzone = h("div", {
    class: "import-zone",
    attrs: { role: "button", tabindex: "0", "aria-label": "Importer une sauvegarde" },
    on: {
      click: () => fileInput.click(),
      keydown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          fileInput.click();
        }
      },
      dragover: (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragover");
      },
      dragleave: () => dropzone.classList.remove("is-dragover"),
      drop: (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragover");
        const file = event.dataTransfer?.files?.[0];
        if (file) importFile(file);
      }
    }
  },
    icon("upload", { size: 24 }),
    h("p", { class: "import-title", text: "Importer un fichier de sauvegarde" }),
    h("p", { class: "muted small", text: "Glissez un fichier .json ici, ou cliquez pour choisir. Le format est vérifié avant tout remplacement." })
  );

  const continueButton = {
    label: "Continuer",
    variant: "primary",
    testid: "load-continue",
    disabled: !loaded.ok,
    onClick: continueGame
  };

  const cards = h("div", { class: "load-grid" },
    saveCard({
      title: "SAUVEGARDE PRINCIPALE",
      summary: primary.summary,
      emptyText: primary.exists ? "La sauvegarde principale est illisible. Une copie de secours peut être disponible." : "Aucune sauvegarde principale.",
      actions: [
        continueButton,
        { label: "Exporter", variant: "ghost", testid: "load-export", onClick: exportCurrent },
        { label: "Restaurer la copie de secours", variant: "ghost", testid: "load-restore", disabled: !backup.summary, onClick: restoreBackup }
      ]
    }),
    saveCard({
      title: "COPIE DE SECOURS",
      summary: backup.summary,
      emptyText: "Aucune copie de secours disponible.",
      actions: [
        { label: "Restaurer cette copie", variant: "ghost", testid: "load-restore-backup", disabled: !backup.summary, onClick: restoreBackup }
      ]
    })
  );

  const content = h("div", { class: "load-layout" },
    !storageOk ? h("div", { class: "banner banner--warning", attrs: { role: "status" } }, icon("warning", { size: 18 }), h("p", { text: "Le stockage local est indisponible. Vous pouvez importer une sauvegarde pour cette session, mais elle ne sera pas conservée après fermeture." })) : null,
    loaded.reason === "newer-version" ? h("div", { class: "banner banner--danger", attrs: { role: "alert" } }, icon("alert", { size: 18 }), h("p", { text: "La sauvegarde principale a été créée par une version plus récente. Elle n’a pas été modifiée. Mettez à jour le jeu ou importez une sauvegarde compatible." })) : null,
    loaded.recovered ? h("div", { class: "banner banner--info", attrs: { role: "status" } }, icon("info", { size: 18 }), h("p", { text: "La sauvegarde principale était illisible. La copie de secours a été restaurée automatiquement." })) : null,
    cards,
    h("section", { class: "panel load-import" },
      h("p", { class: "kicker", text: "IMPORT" }),
      dropzone,
      fileInput
    ),
    h("section", { class: "panel load-info" },
      h("p", { class: "kicker", text: "COMMENT FONCTIONNE LA SAUVEGARDE" }),
      h("ul", { class: "help-list" },
        h("li", {}, icon("check", { size: 13 }), h("span", { text: "La sauvegarde est automatique après chaque action importante." })),
        h("li", {}, icon("check", { size: 13 }), h("span", { text: "Une copie de secours est créée avant chaque nouvelle écriture." })),
        h("li", {}, icon("check", { size: 13 }), h("span", { text: "L’import vérifie le format et refuse les données invalides sans toucher à la sauvegarde actuelle." })),
        h("li", {}, icon("check", { size: 13 }), h("span", { text: "L’export produit un fichier JSON lisible, sans donnée personnelle." }))
      ),
      h("a", { class: "text-link", href: "#/parametres" }, h("span", { text: "Gérer la progression et les paramètres" }), icon("arrowRight", { size: 13 }))
    ),
    !loaded.ok && !primary.summary && !backup.summary
      ? h("div", { class: "empty-state panel" },
          icon("archive", { size: 30 }),
          h("h2", { text: "Aucune sauvegarde locale." }),
          h("p", { class: "muted", text: "Commencez une nouvelle session ou importez un fichier exporté." }),
          h("button", {
            class: "btn btn-primary",
            type: "button",
            text: "Nouvelle partie",
            on: {
              click: () => {
                gameState.createNewGame();
                navigate("/intro");
              }
            }
          })
        )
      : null
  );

  return renderStaticPage(root, context, {
    eyebrow: "SAUVEGARDE",
    title: "Charger une sauvegarde",
    subtitle: "Reprendre une session, restaurer une copie de secours ou importer un fichier.",
    content,
    backPath: gameState.isLoaded() ? "/hub" : "/menu",
    backLabel: gameState.isLoaded() ? "Salle des archives" : "Menu principal"
  });
}
