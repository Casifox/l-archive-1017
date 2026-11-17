/** Paramètres, sauvegarde, export/import, réinitialisation. */

import { h, clear } from "../dom.js";
import { downloadText, dateStamp, readFileAsText } from "../utils.js";
import { formatRealDate, summarizeState } from "../save-schema.js";
import { icon } from "./icons.js";
import { renderBrand, renderShell } from "./shell.js";
import { confirmDialog, confirmWordDialog, openModal } from "./modal.js";
import { showToast } from "./toast.js";

function toggleRow({ label, description, checked, onChange, testid }) {
  const button = h("button", {
    class: `switch${checked ? " is-on" : ""}`,
    type: "button",
    attrs: { role: "switch", "aria-checked": String(checked), "aria-label": label },
    dataset: { testid },
    on: {
      click: () => {
        const next = !button.classList.contains("is-on");
        button.classList.toggle("is-on", next);
        button.setAttribute("aria-checked", String(next));
        onChange(next);
      }
    }
  }, h("span", { class: "switch-knob" }));
  return h("div", { class: "setting-row" },
    h("div", { class: "setting-copy" },
      h("span", { class: "setting-label", text: label }),
      h("span", { class: "setting-desc", text: description })
    ),
    button
  );
}

function segmentedRow({ label, description, options, value, onChange, testid }) {
  const group = h("div", { class: "segmented", attrs: { role: "group", "aria-label": label } });
  const buttons = [];
  for (const option of options) {
    const button = h("button", {
      class: `segment${option.value === value ? " is-active" : ""}`,
      type: "button",
      text: option.label,
      attrs: { "aria-pressed": String(option.value === value) },
      dataset: { testid: `${testid}-${option.value}` },
      on: {
        click: () => {
          for (const other of buttons) {
            other.classList.remove("is-active");
            other.setAttribute("aria-pressed", "false");
          }
          button.classList.add("is-active");
          button.setAttribute("aria-pressed", "true");
          onChange(option.value);
        }
      }
    });
    buttons.push(button);
    group.append(button);
  }
  return h("div", { class: "setting-row setting-row--stack" },
    h("div", { class: "setting-copy" },
      h("span", { class: "setting-label", text: label }),
      h("span", { class: "setting-desc", text: description })
    ),
    group
  );
}

export function mountSettings(root, context) {
  const { gameState, settings, audio, navigate, refresh } = context;
  const loaded = gameState.isLoaded();
  if (loaded) gameState.setPlaying(false);

  const current = settings.get();
  const panel = h("div", { class: "settings-panel" });

  const volumeValue = h("span", { class: "volume-value", text: `${Math.round(current.volume * 100)} %` });
  const volume = h("input", {
    class: "range",
    type: "range",
    min: "0",
    max: "100",
    step: "1",
    value: String(Math.round(current.volume * 100)),
    attrs: { "aria-label": "Volume sonore" },
    dataset: { testid: "volume" },
    on: {
      input: () => {
        const value = Number(volume.value) / 100;
        volumeValue.textContent = `${Math.round(value * 100)} %`;
        settings.update({ volume: value });
        audio.setVolume(value);
      }
    }
  });

  panel.append(
    h("section", { class: "settings-section panel" },
      h("div", { class: "settings-section-head" },
        h("span", { class: "settings-icon" }, icon("soundOn", { size: 20 })),
        h("div", {}, h("h2", { text: "Son" }), h("p", { class: "muted small", text: "Ambiance et retours sonores générés localement. Aucun fichier audio externe." }))
      ),
      h("div", { class: "setting-row" },
        h("div", { class: "setting-copy" },
          h("span", { class: "setting-label", text: "Volume" }),
          h("span", { class: "setting-desc", text: "Le son ne démarre qu’après une première interaction." })
        ),
        h("div", { class: "volume-control" }, volume, volumeValue)
      ),
      toggleRow({
        label: "Sons",
        description: "Ambiance, clics, validations et succès.",
        checked: current.sound,
        testid: "sound-enabled",
        onChange: (value) => {
          settings.update({ sound: value });
          audio.setEnabled(value);
          if (value) audio.play("click");
        }
      })
    ),
    h("section", { class: "settings-section panel" },
      h("div", { class: "settings-section-head" },
        h("span", { class: "settings-icon" }, icon("eye", { size: 20 })),
        h("div", {}, h("h2", { text: "Confort visuel" }), h("p", { class: "muted small", text: "Les réglages s’appliquent immédiatement à toute l’interface." }))
      ),
      segmentedRow({
        label: "Taille du texte",
        description: "Agrandit ou réduit l’ensemble de l’interface.",
        value: current.textSize,
        options: [{ value: "sm", label: "Petit" }, { value: "md", label: "Normal" }, { value: "lg", label: "Grand" }, { value: "xl", label: "Très grand" }],
        testid: "text-size",
        onChange: (value) => settings.update({ textSize: value })
      }),
      segmentedRow({
        label: "Vitesse du texte",
        description: "Vitesse d’apparition des dialogues.",
        value: current.textSpeed,
        options: [{ value: "slow", label: "Lent" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Rapide" }, { value: "instant", label: "Instantané" }],
        testid: "text-speed",
        onChange: (value) => settings.update({ textSpeed: value })
      }),
      toggleRow({
        label: "Réduire les animations",
        description: "Supprime les transitions longues, les secousses et les effets de particules.",
        checked: current.reduceMotion,
        testid: "reduce-motion",
        onChange: (value) => settings.update({ reduceMotion: value })
      }),
      toggleRow({
        label: "Mode confort",
        description: "Palette plus chaude, moins de contraste bleu, halos réduits.",
        checked: current.comfort,
        testid: "comfort-mode",
        onChange: (value) => settings.update({ comfort: value })
      }),
      toggleRow({
        label: "Contraste élevé",
        description: "Renforce les bordures, le texte et les repères de focus.",
        checked: current.highContrast,
        testid: "high-contrast",
        onChange: (value) => settings.update({ highContrast: value })
      })
    ),
    h("section", { class: "settings-preview panel" },
      h("p", { class: "kicker", text: "APERÇU" }),
      h("p", { class: "preview-text", text: "« La mémoire n’est pas un dossier. C’est une pièce dans laquelle on entre plusieurs fois. »" }),
      h("p", { class: "preview-terminal", text: "> archive --lire dossier_05\n> connexion stable · témoin rouge · chambre 14" })
    )
  );

  const saveSection = h("section", { class: "settings-section panel" });
  saveSection.append(
    h("div", { class: "settings-section-head" },
      h("span", { class: "settings-icon" }, icon("save", { size: 20 })),
      h("div", {}, h("h2", { text: "Sauvegarde" }), h("p", { class: "muted small", text: gameState.saveManager.available ? "La progression est conservée dans ce navigateur." : "Le stockage local est indisponible : la progression ne survivra pas à la fermeture." }))
    )
  );

  if (loaded) {
    const state = gameState.getState();
    const summary = summarizeState(state);
    saveSection.append(
      h("div", { class: "save-summary" },
        h("div", {}, h("span", { class: "kicker", text: "SESSION ACTUELLE" }), h("p", { text: `Dossier ${String(summary.dossier).padStart(2, "0")} · ${summary.evidence} preuves · ${summary.puzzles} énigmes` })),
        h("p", { class: "muted small", text: `Dernière sauvegarde : ${formatRealDate(summary.updatedAt)}` })
      )
    );
  }

  const fileInput = h("input", {
    type: "file",
    accept: ".json,application/json",
    hidden: true,
    dataset: { testid: "import-file" }
  });

  const importButton = h("button", {
    class: "btn btn-ghost",
    type: "button",
    dataset: { testid: "import-save" },
    on: { click: () => fileInput.click() }
  }, icon("upload", { size: 16 }), h("span", { text: "Importer une sauvegarde" }));

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const result = gameState.importSave(text);
      if (!result.ok) {
        openModal({
          title: "Import refusé",
          content: h("p", { class: "modal-text", text: result.error || "La sauvegarde est invalide." }),
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
      navigate("/hub");
    } catch (error) {
      showToast("Le fichier n’a pas pu être lu.", "error", { title: "Import" });
      console.error(error);
    }
  });

  const exportButton = h("button", {
    class: "btn btn-ghost",
    type: "button",
    disabled: !loaded,
    dataset: { testid: "export-save" },
    on: {
      click: () => {
        try {
          const text = gameState.exportSave();
          downloadText(`archive-1017-sauvegarde-${dateStamp()}.json`, text);
          showToast("Sauvegarde exportée.", "success", { title: "Export" });
        } catch (error) {
          showToast(error.message || "Export impossible.", "error", { title: "Export" });
        }
      }
    }
  }, icon("download", { size: 16 }), h("span", { text: "Exporter la sauvegarde" }));

  saveSection.append(h("div", { class: "button-row" }, exportButton, importButton, fileInput));

  const clearProfileToggle = h("input", {
    type: "checkbox",
    class: "checkbox",
    id: "clear-profile",
    dataset: { testid: "clear-profile" }
  });

  const resetButton = h("button", {
    class: "btn btn-danger",
    type: "button",
    dataset: { testid: "reset-progress" },
    on: {
      click: async () => {
        const ok = await confirmWordDialog({
          title: "Réinitialiser la progression",
          message: "Cette action efface la sauvegarde locale et la copie de secours. Les succès et les fins découvertes sont conservés, sauf si vous cochez la case ci-dessus.",
          word: "EFFACER",
          confirmLabel: "Tout effacer"
        });
        if (!ok) return;
        const clearProfile = clearProfileToggle.checked;
        gameState.resetProgress({ clearProfile });
        showToast("Progression réinitialisée.", "success", { title: "Archive" });
        navigate("/menu");
      }
    }
  }, icon("trash", { size: 16 }), h("span", { text: "Réinitialiser la progression" }));

  const resetSettings = h("button", {
    class: "btn btn-ghost",
    type: "button",
    dataset: { testid: "reset-settings" },
    on: {
      click: async () => {
        const ok = await confirmDialog({
          title: "Réinitialiser les paramètres",
          message: "Les réglages d’affichage et de son reviendront à leurs valeurs par défaut.",
          confirmLabel: "Réinitialiser",
          cancelLabel: "Annuler"
        });
        if (!ok) return;
        settings.reset();
        refresh();
      }
    }
  }, icon("refresh", { size: 16 }), h("span", { text: "Réinitialiser les paramètres" }));

  const dangerSection = h("section", { class: "settings-section panel settings-danger" },
    h("div", { class: "settings-section-head" },
      h("span", { class: "settings-icon" }, icon("warning", { size: 20 })),
      h("div", {}, h("h2", { text: "Zone sensible" }), h("p", { class: "muted small", text: "La réinitialisation est définitive. Une confirmation écrite est demandée." }))
    ),
    h("label", { class: "checkbox-row", attrs: { for: "clear-profile" } },
      clearProfileToggle,
      h("span", { text: "Effacer aussi les succès et les fins découvertes" })
    ),
    h("div", { class: "button-row" }, resetSettings, resetButton)
  );

  const content = h("div", { class: "settings-layout" }, panel, saveSection, dangerSection);

  if (loaded) {
    const shell = renderShell(root, {
      context,
      active: "parametres",
      eyebrow: "PARAMÈTRES",
      title: "Réglages de l’archive",
      subtitle: "Affichage, son, sauvegarde. Les changements sont appliqués immédiatement.",
      back: { path: "/hub", label: "Salle des archives" },
      content
    });
    return () => shell.cleanup();
  }

  clear(root);
  const screen = h("div", { class: "standalone-screen" });
  const top = h("header", { class: "standalone-top" },
    renderBrand({ href: "#/menu" }),
    h("a", { class: "btn btn-ghost", href: "#/menu" }, icon("arrowLeft", { size: 16 }), h("span", { text: "Menu" }))
  );
  const main = h("main", { class: "standalone-main", id: "main" },
    h("div", { class: "page-head" },
      h("p", { class: "eyebrow", text: "PARAMÈTRES" }),
      h("h1", { class: "page-title", text: "Réglages de l’archive" }),
      h("p", { class: "page-subtitle", text: "Affichage, son, sauvegarde. Les changements sont appliqués immédiatement." })
    ),
    content
  );
  screen.append(top, main);
  root.append(screen);
  return () => clear(root);
}
