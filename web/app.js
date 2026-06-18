const $ = (id) => document.getElementById(id);

const state = {
  images: [],
  selected: null,
  result: null,
  results: {},
  view: "image",
  zoom: 1,
  panX: 0,
  panY: 0,
  busy: false,
  stopRequested: false,
  abortController: null,
  language: "fr",
};

const f = {
  imagesDir: $("imagesDir"),
  masksDir: $("masksDir"),
  checkpointPath: $("checkpointPath"),
  prompt: $("prompt"),
  threshold: $("threshold"),
  saveInstances: $("saveInstances"),
  saveMeta: $("saveMeta"),
  setHost: $("setHost"),
  setPort: $("setPort"),
  setOpenBrowser: $("setOpenBrowser"),
  setLanguage: $("setLanguage"),
};


// ---------------------------------------------------------------------------
// Texts
// ---------------------------------------------------------------------------

const I18N = {
  fr: {

    workspace: "Espace de travail",
    imagesFolder: "Dossier des images",
    imagesPh: "C:\\…\\images",
    saveFolder: "Dossier de sauvegarde",
    masksTag: "masques",
    masksPh: "C:\\…\\mask",
    textPrompt: "Prompt texte",
    promptPh: "Ex : cloud, sky, person, car…",
    confThreshold: "Seuil de confiance",
    saveInstancesLbl: "Enregistrer les instances séparées",
    saveMetaLbl: "Enregistrer les métadonnées JSON",
    scan: "Scanner",
    load: "Charger",
    genMask: "Générer le masque",
    genAll: "Générer tout le dossier",
    stopGen: "Stop génération",
    workshop: "Atelier de masques",
    imagesSuffix: "images",
    settings: "Réglages",
    imagesLabel: "Images",
    filterPh: "Filtrer par nom…",
    emptyScanPre: "Clique sur",
    emptyScanPost: "pour lister les images du dossier.",
    tabImage: "Image",
    tabOverlay: "Calque",
    tabMask: "Masque",
    tabCompare: "Comparer",
    swCoral: "Corail",
    swTeal: "Teal",
    swBlue: "Bleu",
    swAmber: "Ambre",
    swMagenta: "Magenta",
    overlayOpacity: "Opacité du calque",
    zoomOutT: "Dézoomer",
    zoomInT: "Zoomer",
    zoomResetT: "Réinitialiser la vue",
    emptyViewTitle: "Aucune image sélectionnée",
    emptyViewBody: "Sélectionne une image à gauche pour l'inspecter.",
    wipeLeft: "calque",
    wipeRight: "source",
    statInstances: "Instances",
    statMaskSaved: "Masque enregistré",
    dlMaskLbl: "Masque",
    dlOverlayLbl: "Calque",
    logsTitle: "Journal",
    clearBtn: "Effacer",
    grpInterface: "Interface",
    langLabel: "Langue",
    grpModel: "Modèle",
    checkpointLabel: "Checkpoint SAM3",
    checkpointHint1: "Chemin du fichier",
    checkpointHint2: ". Relatif au projet ou absolu.",
    grpServer: "Serveur",
    restartTag: "redémarrage requis",
    hostLabel: "Hôte",
    portLabel: "Port",
    openBrowserLbl: "Ouvrir le navigateur au démarrage",
    cancelBtn: "Annuler",
    saveBtn: "Enregistrer",
    noImageCrumb: "aucune image",


    ready: "Prêt.",
    configLoaded: "Configuration chargée.",
    configSavedTitle: "Réglages enregistrés",
    configSavedBody: "Écrits dans config.json.",
    configSavedLog: "Réglages enregistrés dans config.json.",
    saveFailed: "Échec de l'enregistrement",
    scanFailed: "Scan impossible",
    modelLoading: "Chargement du modèle…",
    modelLoadedTitle: "Modèle chargé",
    modelLoadedLog: "Modèle chargé sur",
    modelFailed: "Chargement échoué",
    localAssetsLog: "Assets locaux détectés automatiquement.",
    noImageTitle: "Aucune image",
    noImageBody: "Sélectionne d'abord une image.",
    noFolderEmptyTitle: "Dossier vide",
    noFolderEmptyBody: "Aucune image dans le dossier indiqué.",
    generationStoppedTitle: "Génération arrêtée",
    generationStoppedBody: "L'arrêt a été demandé par l'utilisateur.",
    generationStoppedLog: "Génération arrêtée par l'utilisateur.",
    generationFailed: "Génération échouée",
    maskGeneratedTitle: "Masque généré",
    instancesDetected: "instance(s) détectée(s).",
    nothingToProcessTitle: "Rien à traiter",
    nothingToProcessBody: "Scanne d'abord le dossier.",
    confirmBatch: (n) => `Générer les masques pour ${n} image(s) ?`,
    prep: "Préparation…",
    treatment: "Traitement…",
    batchStoppedTitle: "Batch arrêté",
    batchDoneTitle: "Batch terminé",
    batchDoneErrorsTitle: "Batch terminé avec erreurs",
    batchInterruptedTitle: "Batch interrompu",
    stopRequestedTitle: "Arrêt demandé",
    stopRequestedBody: "La génération s'arrête dès que possible.",
    stopRequestedLog: "Arrêt demandé…",
    logCleared: "Journal effacé.",
    configErrorTitle: "Erreur de configuration",
    statusLoaded: "Modèle chargé",
    statusNotLoaded: "Modèle non chargé",
    device: "device",
  },

  en: {
  
    workspace: "Workspace",
    imagesFolder: "Images folder",
    imagesPh: "C:\\…\\images",
    saveFolder: "Save folder",
    masksTag: "masks",
    masksPh: "C:\\…\\mask",
    textPrompt: "Text prompt",
    promptPh: "e.g. cloud, sky, person, car…",
    confThreshold: "Confidence threshold",
    saveInstancesLbl: "Save separate instances",
    saveMetaLbl: "Save JSON metadata",
    scan: "Scan",
    load: "Load",
    genMask: "Generate mask",
    genAll: "Generate whole folder",
    stopGen: "Stop generation",
    workshop: "Mask workshop",
    imagesSuffix: "images",
    settings: "Settings",
    imagesLabel: "Images",
    filterPh: "Filter by name…",
    emptyScanPre: "Click",
    emptyScanPost: "to list the images in the folder.",
    tabImage: "Image",
    tabOverlay: "Overlay",
    tabMask: "Mask",
    tabCompare: "Compare",
    swCoral: "Coral",
    swTeal: "Teal",
    swBlue: "Blue",
    swAmber: "Amber",
    swMagenta: "Magenta",
    overlayOpacity: "Overlay opacity",
    zoomOutT: "Zoom out",
    zoomInT: "Zoom in",
    zoomResetT: "Reset view",
    emptyViewTitle: "No image selected",
    emptyViewBody: "Select an image on the left to inspect it.",
    wipeLeft: "overlay",
    wipeRight: "source",
    statInstances: "Instances",
    statMaskSaved: "Mask saved",
    dlMaskLbl: "Mask",
    dlOverlayLbl: "Overlay",
    logsTitle: "Log",
    clearBtn: "Clear",
    grpInterface: "Interface",
    langLabel: "Language",
    grpModel: "Model",
    checkpointLabel: "SAM3 checkpoint",
    checkpointHint1: "Path to the file",
    checkpointHint2: ". Relative to the project or absolute.",
    grpServer: "Server",
    restartTag: "restart required",
    hostLabel: "Host",
    portLabel: "Port",
    openBrowserLbl: "Open browser on startup",
    cancelBtn: "Cancel",
    saveBtn: "Save",
    noImageCrumb: "no image",


    ready: "Ready.",
    configLoaded: "Configuration loaded.",
    configSavedTitle: "Settings saved",
    configSavedBody: "Written to config.json.",
    configSavedLog: "Settings saved to config.json.",
    saveFailed: "Save failed",
    scanFailed: "Scan failed",
    modelLoading: "Loading model…",
    modelLoadedTitle: "Model loaded",
    modelLoadedLog: "Model loaded on",
    modelFailed: "Model loading failed",
    localAssetsLog: "Local assets detected automatically.",
    noImageTitle: "No image",
    noImageBody: "Select an image first.",
    noFolderEmptyTitle: "Empty folder",
    noFolderEmptyBody: "No image found in the selected folder.",
    generationStoppedTitle: "Generation stopped",
    generationStoppedBody: "Stop was requested by the user.",
    generationStoppedLog: "Generation stopped by the user.",
    generationFailed: "Generation failed",
    maskGeneratedTitle: "Mask generated",
    instancesDetected: "instance(s) detected.",
    nothingToProcessTitle: "Nothing to process",
    nothingToProcessBody: "Scan the folder first.",
    confirmBatch: (n) => `Generate masks for ${n} image(s)?`,
    prep: "Preparing…",
    treatment: "Processing…",
    batchStoppedTitle: "Batch stopped",
    batchDoneTitle: "Batch finished",
    batchDoneErrorsTitle: "Batch finished with errors",
    batchInterruptedTitle: "Batch interrupted",
    stopRequestedTitle: "Stop requested",
    stopRequestedBody: "Generation will stop as soon as possible.",
    stopRequestedLog: "Stop requested…",
    logCleared: "Log cleared.",
    configErrorTitle: "Configuration error",
    statusLoaded: "Model loaded",
    statusNotLoaded: "Model not loaded",
    device: "device",
  },
};

function t(key, ...args) {
  const table = I18N[state.language] || I18N.fr;
  const value = table[key] ?? I18N.fr[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}


// ---------------------------------------------------------------------------
// Prefs
// ---------------------------------------------------------------------------

const PREFS = (() => {
  try {
    return JSON.parse(localStorage.getItem("sam3ui") || "{}");
  } catch {
    return {};
  }
})();

function savePref(key, value) {
  PREFS[key] = value;

  try {
    localStorage.setItem("sam3ui", JSON.stringify(PREFS));
  } catch {}
}


// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  }[c]));
}

function fileUrl(url, opts = {}) {
  if (!url) return "";

  let finalUrl = url.replaceAll("#", "%23");

  if (opts.download) finalUrl += "&download=1";
  if (opts.bust) finalUrl += "&t=" + Date.now();

  return finalUrl;
}

function requestBody(extra = {}) {
  return {
    images_dir: f.imagesDir.value.trim(),
    masks_dir: f.masksDir.value.trim(),
    checkpoint_path: f.checkpointPath.value.trim(),

    // SAM3 repo and BPE are now detected locally by Python.
    sam3_repo_path: "",
    bpe_path: "",

    prompt: f.prompt.value.trim() || "mask",
    confidence_threshold: Number(f.threshold.value),
    save_instance_masks: f.saveInstances.checked,
    save_meta_json: f.saveMeta.checked,

    ...extra,
  };
}

async function api(url, body = null, options = {}) {
  const fetchOptions = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        ...options,
      }
    : {
        method: "GET",
        ...options,
      };

  const response = await fetch(url, fetchOptions);
  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data || response.statusText);
  }

  return data;
}

function isAbortError(error) {
  return error?.name === "AbortError" || String(error?.message || "").includes("interrompue");
}


// ---------------------------------------------------------------------------
// Logs / Toasts
// ---------------------------------------------------------------------------

function log(message, type = "info") {
  const box = $("logBox");
  const line = document.createElement("div");
  const time = new Date().toLocaleTimeString();

  const cls = type === "error" ? "l-err" : type === "ok" ? "l-ok" : "";

  line.innerHTML = `
    <span class="l-time">${time}</span>
    <span class="${cls}">${escapeHtml(message)}</span>
  `;

  box.appendChild(line);
  box.parentElement.scrollTop = box.parentElement.scrollHeight;

  $("logsLast").textContent = message;
  $("logsLast").className = "last" + (type === "error" ? " l-err" : type === "ok" ? " l-ok" : "");
}

function toast(title, body = "", type = "info", ms = 4200) {
  const el = document.createElement("div");

  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="tc">
      <b>${escapeHtml(title)}</b>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    </div>
  `;

  $("toasts").appendChild(el);

  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 220);
  }, ms);
}


// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

async function loadConfig() {
  const config = await api("/api/config");

  f.imagesDir.value = PREFS.imagesDir || config.images_dir || "";
  f.masksDir.value = PREFS.masksDir || config.masks_dir || "";
  f.checkpointPath.value = config.checkpoint_path || "";

  state.language = config.language === "en" ? "en" : "fr";

  if (f.setLanguage) f.setLanguage.value = state.language;

  f.prompt.value = "";
  f.threshold.value = config.confidence_threshold ?? 0.35;
  f.saveInstances.checked = config.save_instance_masks ?? true;
  f.saveMeta.checked = config.save_meta_json ?? false;

  f.setHost.value = config.host || "127.0.0.1";
  f.setPort.value = config.port ?? 7860;
  f.setOpenBrowser.checked = config.open_browser_on_start ?? true;

  updateThreshold();
  applyLanguage();
  await refreshStatus();

  if (!config.checkpoint_path) openSettings();
  else if (!f.imagesDir.value) f.imagesDir.focus();

  log(t("configLoaded"), "ok");
}

async function saveConfig() {
  try {
    await api("/api/config", {
      ...requestBody(),
      prompt: f.prompt.value.trim(),
      language: f.setLanguage?.value || "fr",
      host: f.setHost.value.trim() || "127.0.0.1",
      port: Number(f.setPort.value) || 7860,
      open_browser_on_start: f.setOpenBrowser.checked,
    });

    toast(t("configSavedTitle"), t("configSavedBody"), "ok");
    log(t("configSavedLog"), "ok");
    closeSettings();

  } catch (error) {
    toast(t("saveFailed"), error.message, "err");
    log(error.message, "error");
  }
}


// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

function applyLanguage() {
  state.language = f.setLanguage?.value === "en" ? "en" : "fr";
  document.documentElement.lang = state.language;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });

  const crumb = $("crumbCurrent");
  if (crumb && !state.selected) crumb.textContent = t("noImageCrumb");

  refreshStatus();
}


// ---------------------------------------------------------------------------
// Status / Busy
// ---------------------------------------------------------------------------

async function refreshStatus() {
  try {
    const status = await api("/api/status");
    const device = String(status.device || "?").toUpperCase();

    if ($("deviceText")) $("deviceText").textContent = `${t("device")} ${device}`;
    if ($("devicePillText")) $("devicePillText").textContent = device;

    const st = $("status");

    if (st) {
      st.classList.toggle("ready", !!status.model_loaded);
      st.classList.remove("loading");
    }

    if ($("statusText")) {
      $("statusText").textContent = status.model_loaded ? t("statusLoaded") : t("statusNotLoaded");
    }

    $("devicePill")?.classList.toggle("ready", !!status.model_loaded);

  } catch {}
}

function setBusy(value, canStop = false) {
  state.busy = value;

  ["processOneBtn", "processAllBtn", "scanBtn", "loadModelBtn", "saveConfigBtn"].forEach((id) => {
    const button = $(id);
    if (button) button.disabled = value;
  });

  const stopBtn = $("stopBtn");

  if (stopBtn) {
    stopBtn.classList.toggle("hidden", !(value && canStop));
    stopBtn.disabled = !(value && canStop) || state.stopRequested;
  }

  $("status")?.classList.toggle("loading", value);
}

async function stopGeneration() {
  if (!state.busy || state.stopRequested) return;

  state.stopRequested = true;
  setBusy(true, true);

  log(t("stopRequestedLog"), "error");
  toast(t("stopRequestedTitle"), t("stopRequestedBody"), "info");

  try {
    await api("/api/stop", {});
  } catch (error) {
    log(error.message, "error");
  }

  if (state.abortController) {
    state.abortController.abort();
  }
}


// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function openSettings() {
  $("settingsModal").hidden = false;
  setTimeout(() => f.checkpointPath.focus(), 30);
}

function closeSettings() {
  $("settingsModal").hidden = true;
}

function updateThreshold() {
  $("thresholdValue").textContent = Number(f.threshold.value).toFixed(2);
}


// ---------------------------------------------------------------------------
// Image List
// ---------------------------------------------------------------------------

function filteredImages() {
  const q = $("searchImages").value.toLowerCase().trim();

  return state.images.filter((img) => {
    return !q || img.name.toLowerCase().includes(q);
  });
}

function renderFilmstrip() {
  const list = filteredImages();

  $("imageCount").textContent = state.images.length;
  $("filterCount").textContent = list.length;

  const strip = $("filmstrip");
  strip.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");

    empty.className = "empty";
    empty.innerHTML = state.images.length
      ? `<div class="ic">⊘</div><p>Aucune image ne correspond.</p>`
      : `<div class="ic">⌖</div><p>Clique sur <b>Scanner</b> pour lister les images.</p>`;

    strip.appendChild(empty);
    return;
  }

  for (const img of list) {
    const done = !!state.results[img.path];
    const row = document.createElement("div");

    row.className = "thumb" + (state.selected?.path === img.path ? " active" : "");
    row.innerHTML = `
      <div class="tw">
        <img loading="lazy" src="${fileUrl(img.url)}" alt="">
      </div>

      <div class="meta">
        <b>${escapeHtml(img.name)}</b>
        <span>${escapeHtml(img.path)}</span>
      </div>

      ${done ? '<span class="badge">✓</span>' : ""}
    `;

    row.addEventListener("click", () => selectImage(img));
    strip.appendChild(row);
  }
}

function selectImage(img) {
  state.selected = img;
  state.result = state.results[img.path] || null;

  $("crumbCurrent").textContent = img.name;

  resetZoom();

  if (!state.result && ["mask", "overlay", "compare"].includes(state.view)) {
    setView("image");
  } else {
    applyResultToUI();
    setView(state.result ? state.view : "image");
  }

  loadStageImages();
  renderFilmstrip();
}


// ---------------------------------------------------------------------------
// Viewer
// ---------------------------------------------------------------------------
const stage = $("stage");
const pan = $("pan");
const viewport = $("viewport");
const layerBase = $("layerBase");
const layerMask = $("layerMask");

function showEmptyViewport(empty) {
  $("viewportEmpty").style.display = empty ? "block" : "none";
  pan.style.display = empty ? "none" : "block";
  viewport.classList.toggle("empty-state", empty);

  if (empty) $("results").style.display = "none";
}

function loadStageImages() {
  if (!state.selected) {
    showEmptyViewport(true);
    return;
  }

  showEmptyViewport(false);

  layerBase.onload = fitStage;
  layerBase.src = fileUrl(state.selected.url);

  if (!state.result) {
    layerMask.removeAttribute("src");
    $("layerTint").style.webkitMaskImage = "none";
    $("layerTint").style.maskImage = "none";
    return;
  }

  const maskUrl = fileUrl(state.result.combined_mask?.url, { bust: true });

  layerMask.src = maskUrl;
  $("layerTint").style.webkitMaskImage = `url("${maskUrl}")`;
  $("layerTint").style.maskImage = `url("${maskUrl}")`;
}

function fitStage() {
  if (!layerBase.naturalWidth) return;

  const vw = viewport.clientWidth - 36;
  const vh = viewport.clientHeight - 36;
  const ratio = layerBase.naturalWidth / layerBase.naturalHeight;

  let w = vw;
  let h = vw / ratio;

  if (h > vh) {
    h = vh;
    w = vh * ratio;
  }

  stage.style.width = Math.max(40, Math.round(w)) + "px";
  stage.style.height = Math.max(40, Math.round(h)) + "px";

  applyTransform();
}

function applyTransform() {
  pan.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  $("zoomLabel").textContent = Math.round(state.zoom * 100) + "%";
}

function resetZoom() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  applyTransform();
}

function zoomBy(factor, cx, cy) {
  const next = Math.min(8, Math.max(0.2, state.zoom * factor));

  if (cx != null) {
    const rect = viewport.getBoundingClientRect();

    const ox = cx - rect.left - rect.width / 2 - state.panX;
    const oy = cy - rect.top - rect.height / 2 - state.panY;
    const k = next / state.zoom;

    state.panX -= ox * (k - 1);
    state.panY -= oy * (k - 1);
  }

  state.zoom = next;
  applyTransform();
}

function setView(view) {
  const needResult = ["mask", "overlay", "compare"].includes(view);

  if (needResult && !state.result) view = "image";

  state.view = view;
  stage.dataset.view = view;
  viewport.dataset.view = view;

  if (view === "compare") resetZoom();

  document.querySelectorAll(".vt").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  $("ovCtrl").classList.toggle("hidden", !(view === "overlay" || view === "compare"));

  savePref("view", view);
}

function enableResultTabs(enabled) {
  document.querySelectorAll(".vt").forEach((button) => {
    if (button.dataset.view !== "image") {
      button.disabled = !enabled;
    }
  });
}


// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function applyResultToUI() {
  const result = state.result;
  const box = $("results");

  if (!result) {
    box.style.display = "none";
    enableResultTabs(false);
    return;
  }

  box.style.display = "flex";
  enableResultTabs(true);

  $("instancesCount").textContent = result.num_instances ?? 0;
  $("maskPath").textContent = result.combined_mask?.path || "—";
  $("maskPath").title = result.combined_mask?.path || "";

  $("dlMask").href = fileUrl(result.combined_mask?.url, { download: true });
  $("dlOverlay").href = fileUrl(result.overlay?.url, { download: true });

  const baseName = state.selected?.name?.replace(/\.[^.]+$/, "") || "mask";

  $("dlMask").download = baseName + "_mask.png";
  $("dlOverlay").download = baseName + "_overlay.png";

  const list = $("instancesList");
  list.innerHTML = "";

  for (const [i, inst] of (result.instances || []).entries()) {
    const item = document.createElement("div");

    item.className = "inst";
    item.innerHTML = `
      <div class="iw">
        <img src="${fileUrl(inst.url, { bust: true })}" alt="">
      </div>
      <span>#${i}</span>
    `;

    list.appendChild(item);
  }
}

function storeResult(result) {
  const path = result.image?.path;

  if (path) state.results[path] = result;

  if (state.selected && state.selected.path === path) {
    state.result = result;
    applyResultToUI();
    loadStageImages();
    setView("overlay");
  }

  renderFilmstrip();
}


// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function scanImages() {
  setBusy(true);

  try {
    const data = await api("/api/scan", requestBody());

    state.images = data.images || [];
    renderFilmstrip();

    if (state.images.length) {
      selectImage(state.images[0]);
    } else {
      state.selected = null;
      showEmptyViewport(true);
    }

    log(`${data.count} image(s) trouvée(s).`, "ok");

    if (!data.count) {
      toast(t("noFolderEmptyTitle"), t("noFolderEmptyBody"), "info");
    }

  } catch (error) {
    toast(t("scanFailed"), error.message, "err");
    log(error.message, "error");

  } finally {
    setBusy(false);
  }
}

async function loadModel() {
  setBusy(true);
  log(t("modelLoading"));

  try {
    const data = await api("/api/load-model", requestBody());

    await refreshStatus();

    toast(t("modelLoadedTitle"), `Sur ${String(data.model.device).toUpperCase()}.`, "ok");
    log(`${t("modelLoadedLog")} ${data.model.device}.`, "ok");
    log(t("localAssetsLog"));

  } catch (error) {
    toast(t("modelFailed"), error.message, "err");
    log(error.message, "error");

  } finally {
    setBusy(false);
  }
}

async function processOne() {
  if (!state.selected) {
    toast(t("noImageTitle"), t("noImageBody"), "info");
    return;
  }

  state.stopRequested = false;
  state.abortController = new AbortController();

  setBusy(true, true);
  log(`Génération du masque pour ${state.selected.name}…`);

  try {
    const data = await api(
      "/api/process-one",
      requestBody({ image_path: state.selected.path }),
      { signal: state.abortController.signal },
    );

    storeResult(data);
    await refreshStatus();

    log(`${state.selected.name} → ${data.num_instances} instance(s).`, "ok");
    toast(t("maskGeneratedTitle"), `${data.num_instances} ${t("instancesDetected")}`, "ok");

  } catch (error) {
    if (state.stopRequested || isAbortError(error)) {
      toast(t("generationStoppedTitle"), t("generationStoppedBody"), "info");
      log(t("generationStoppedLog"), "error");
    } else {
      toast(t("generationFailed"), error.message, "err");
      log(error.message, "error");
    }

  } finally {
    state.abortController = null;
    state.stopRequested = false;
    setBusy(false);
  }
}

async function processAll() {
  if (!state.images.length) {
    toast(t("nothingToProcessTitle"), t("nothingToProcessBody"), "info");
    return;
  }

  if (!confirm(t("confirmBatch", state.images.length))) return;

  state.stopRequested = false;
  state.abortController = new AbortController();

  setBusy(true, true);

  const progress = $("progress");
  const progressBar = $("progressBar");
  const progressLabel = $("progressLabel");
  const progressCount = $("progressCount");

  progress.classList.add("on");
  progressBar.style.width = "0%";
  progressLabel.textContent = t("prep");
  progressCount.textContent = `0 / ${state.images.length}`;

  let done = 0;
  let errors = 0;
  let total = state.images.length;

  try {
    const response = await fetch("/api/process-all-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody()),
      signal: state.abortController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error("Le flux de traitement n'a pas pu démarrer.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done: streamDone, value } = await reader.read();

      if (streamDone) break;

      buffer += decoder.decode(value, { stream: true });

      let lineEnd;

      while ((lineEnd = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (!line) continue;

        const event = JSON.parse(line);

        if (event.event === "start") {
          total = event.total;
          progressCount.textContent = `0 / ${total}`;
        }

        if (event.event === "item") {
          if (event.ok) {
            done++;
            storeResult(event.result);
            progressLabel.textContent = event.result.image?.name || t("treatment");
          } else {
            errors++;
            log(`${event.image}: ${event.error}`, "error");
          }

          const current = done + errors;
          const pct = Math.round((current / total) * 100);

          progressBar.style.width = pct + "%";
          progressCount.textContent = `${current} / ${total}`;
        }

        if (event.event === "done") {
          done = event.done;
          errors = event.errors;
        }

        if (event.event === "stopped") {
          state.stopRequested = true;
          done = event.done;
          errors = event.errors;
          total = event.total || total;
          progressLabel.textContent = "Arrêt demandé";
        }
      }
    }

    await refreshStatus();

    if (state.stopRequested) {
      toast(t("batchStoppedTitle"), `${done} masque(s) terminé(s) avant l'arrêt.`, "info");
      log(`Batch arrêté : ${done} masque(s), ${errors} erreur(s).`, "error");
    } else {
      const type = errors ? "err" : "ok";
      toast(errors ? t("batchDoneErrorsTitle") : t("batchDoneTitle"), `${done} réussi(s), ${errors} erreur(s).`, type);
      log(`Batch terminé : ${done} masque(s), ${errors} erreur(s).`, errors ? "error" : "ok");
    }

  } catch (error) {
    if (state.stopRequested || isAbortError(error)) {
      toast(t("batchStoppedTitle"), `${done + errors} image(s) traitée(s) avant l'arrêt.`, "info");
      log(`Batch arrêté par l'utilisateur après ${done + errors} image(s).`, "error");
    } else {
      toast(t("batchInterruptedTitle"), error.message, "err");
      log(error.message, "error");
    }

  } finally {
    state.abortController = null;
    state.stopRequested = false;

    setTimeout(() => progress.classList.remove("on"), 700);
    setBusy(false);
  }
}


// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

function setOverlayColor(color) {
  document.documentElement.style.setProperty("--ov-color", color);

  document.querySelectorAll(".swatch").forEach((s) => {
    s.classList.toggle("active", s.dataset.c === color);
  });

  savePref("ovColor", color);
}

function setOverlayAlpha(alpha) {
  document.documentElement.style.setProperty("--ov-alpha", alpha);
  savePref("ovAlpha", alpha);
}


// ---------------------------------------------------------------------------
// Compare Wipe
// ---------------------------------------------------------------------------

let wipeDrag = false;

function setWipe(percent) {
  percent = Math.min(100, Math.max(0, percent));

  stage.style.setProperty("--wipe", percent + "%");
  $("wipe").style.setProperty("--wipe", percent + "%");
}

function wipeFromEvent(event) {
  const rect = stage.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const percent = ((clientX - rect.left) / rect.width) * 100;

  setWipe(percent);
}


// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function wire() {
  document.querySelectorAll(".vt").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) setView(button.dataset.view);
    });
  });

  $("zoomIn").addEventListener("click", () => zoomBy(1.25));
  $("zoomOut").addEventListener("click", () => zoomBy(0.8));
  $("zoomReset").addEventListener("click", resetZoom);

  viewport.addEventListener("wheel", (event) => {
    if (!state.selected || state.view === "compare") return;

    event.preventDefault();

    zoomBy(event.deltaY < 0 ? 1.12 : 0.89, event.clientX, event.clientY);
  }, { passive: false });

  let dragging = false;
  let sx = 0;
  let sy = 0;
  let px = 0;
  let py = 0;

  viewport.addEventListener("pointerdown", (event) => {
    if (state.view === "compare" || !state.selected) return;

    dragging = true;

    viewport.classList.add("panning");
    viewport.setPointerCapture(event.pointerId);

    sx = event.clientX;
    sy = event.clientY;
    px = state.panX;
    py = state.panY;
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    state.panX = px + (event.clientX - sx);
    state.panY = py + (event.clientY - sy);

    applyTransform();
  });

  function stopDrag() {
    dragging = false;
    viewport.classList.remove("panning");
  }

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
  viewport.addEventListener("dblclick", resetZoom);

  $("wipeHandle").addEventListener("pointerdown", (event) => {
    wipeDrag = true;
    event.preventDefault();
  });

  $("wipe").addEventListener("pointerdown", (event) => {
    if (event.target === $("wipeHandle")) return;

    wipeDrag = true;
    wipeFromEvent(event);
  });

  window.addEventListener("pointermove", (event) => {
    if (wipeDrag) wipeFromEvent(event);
  });

  window.addEventListener("pointerup", () => {
    wipeDrag = false;
  });

  $("swatches").addEventListener("click", (event) => {
    const swatch = event.target.closest(".swatch");

    if (swatch) setOverlayColor(swatch.dataset.c);
  });

  $("ovAlpha").addEventListener("input", (event) => {
    setOverlayAlpha(event.target.value);
  });

  f.threshold.addEventListener("input", updateThreshold);

  $("saveConfigBtn").addEventListener("click", (event) => {
    event.preventDefault();
    saveConfig();
  });

  f.setLanguage?.addEventListener("change", () => {
    applyLanguage();
  });

  $("scanBtn").addEventListener("click", scanImages);
  $("loadModelBtn").addEventListener("click", loadModel);
  $("processOneBtn").addEventListener("click", processOne);
  $("processAllBtn").addEventListener("click", processAll);
  $("stopBtn").addEventListener("click", stopGeneration);
  $("searchImages").addEventListener("input", renderFilmstrip);

  $("clearLogBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    $("logBox").innerHTML = "";
    $("logsLast").textContent = t("logCleared");
  });

  $("logsHead").addEventListener("click", (event) => {
    if (event.target.closest("#clearLogBtn")) return;

    $("logs").classList.toggle("open");
    savePref("logsOpen", $("logs").classList.contains("open"));
  });

  $("settingsBtn").addEventListener("click", openSettings);
  $("settingsClose").addEventListener("click", closeSettings);
  $("settingsCancel").addEventListener("click", closeSettings);

  $("settingsModal").addEventListener("click", (event) => {
    if (event.target === $("settingsModal")) closeSettings();
  });

  f.imagesDir.addEventListener("input", () => {
    savePref("imagesDir", f.imagesDir.value.trim());
  });

  f.masksDir.addEventListener("input", () => {
    savePref("masksDir", f.masksDir.value.trim());
  });

  document.addEventListener("keydown", (event) => {
    if (!$("settingsModal").hidden) {
      if (event.key === "Escape") closeSettings();
      return;
    }

    if (event.target.matches("input, textarea")) {
      if (event.key === "Enter" && event.target.id === "prompt" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        processOne();
      }

      return;
    }

    if (state.busy) return;

    const list = filteredImages();
    const index = list.findIndex((img) => img.path === state.selected?.path);

    if (event.key === "ArrowDown" || event.key === "j") {
      event.preventDefault();

      if (list.length) {
        selectImage(list[Math.min(list.length - 1, index + 1)] || list[0]);
      }
    }

    if (event.key === "ArrowUp" || event.key === "k") {
      event.preventDefault();

      if (list.length) {
        selectImage(list[Math.max(0, index - 1)] || list[0]);
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      processOne();
    }

    if (event.key === "1") setView("image");
    if (event.key === "2") setView("overlay");
    if (event.key === "3") setView("mask");
    if (event.key === "4") setView("compare");
  });

  let resizeTimer;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (state.selected) fitStage();
    }, 120);
  });
}


// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function restorePrefs() {
  if (PREFS.ovColor) {
    setOverlayColor(PREFS.ovColor);
  }

  if (PREFS.ovAlpha != null) {
    $("ovAlpha").value = PREFS.ovAlpha;
    setOverlayAlpha(PREFS.ovAlpha);
  }

  if (PREFS.logsOpen) {
    $("logs").classList.add("open");
  }

  setWipe(50);
}

wire();
restorePrefs();

loadConfig().catch((error) => {
  toast(t("configErrorTitle"), error.message, "err");
  log(error.message, "error");
});