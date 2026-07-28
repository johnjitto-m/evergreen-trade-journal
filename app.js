"use strict";

const APP_NAMESPACE = "evergreen_trade_journal_v1";
const DEFAULT_HTF = "1h";
const DEFAULT_LTF = "5m";
const DEFAULT_RISK_AMOUNT = "50";

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
const STORAGE_KEYS = {
  trades: `${APP_NAMESPACE}:trades`,
  draft: `${APP_NAMESPACE}:trade_draft`,
  options: `${APP_NAMESPACE}:custom_options`
};

const DEFAULT_OPTIONS = {
  poiMitigation: [
    "Aggressive Retracement",
    "Next Candle Trigger",
    "Coming After Creating a Counter FVG",
    "Trigger Candle Is the Counter FVG Created Candle"
  ],
  entryLevel: ["Spartan CISD", "BB"]
};

const LTF_DEFAULT_LINK_LABELS = [
  "LTF CISD setup",
  "CISD entry setup",
  "BE / SL / TP setup"
];

const LTF_LINK_PRESET_VERSION = 2;

const SMT_PAIR_MAP = {
  EURUSD: "GBPUSD",
  GBPUSD: "EURUSD",
  XAUUSD: "XAGUSD (Silver)",
  USDJPY: "EURJPY",
  GBPJPY: "EURJPY",
  NAS100: "SPX500"
};

const seedTrades = [
  {
    id: createId(), date: "2026-07-27", day: "Monday", pair: "GBPUSD", direction: "Long",
    session: "London", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Today", result: "SL", rr: 4, riskAmount: 100, pnl: -100, slPips: 5,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "GBPUSD vs EURUSD", poiSupported: "Yes", poiSupportType: ["Previous FVG"], thirdCandle: "Positive", poiMitigation: ["Aggressive Retracement"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "Spartan CISD", slPips: "5", beLogic: "BE Level", result: "SL", riskAmount: "100", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-27", day: "Monday", pair: "EURUSD", direction: "Long",
    session: "London", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "TP", rr: 6.5, riskAmount: 100, pnl: 650, slPips: 4.2,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "EURUSD vs GBPUSD", poiSupported: "Yes", poiSupportType: ["Previous OB"], thirdCandle: "Negative", poiMitigation: ["Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BB", slPips: "4.2", beLogic: "Counter FVG Mitigation", result: "TP", riskAmount: "100", riskReward: "6.5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "XAUUSD", direction: "Short",
    session: "New York", htf: "30m", ltf: "5m", status: "Took Trade", entryAttempt: "2nd Entry",
    fvgStatus: "Partial FVG", fvgFormed: "Today", result: "BE", rr: 4, riskAmount: 75, pnl: 0, slPips: 18,
    htfAnalysis: { hasSmt: "No", smtStrength: "", smtPair: "XAUUSD (Gold) vs XAGUSD (Silver)", poiSupported: "No", poiSupportType: [], thirdCandle: "Negative", poiMitigation: ["Coming After Creating a Counter FVG"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "Spartan CISD", slPips: "18", beLogic: "ERL", result: "BE", riskAmount: "75", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "GBPUSD", direction: "Short",
    session: "New York", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "SL", rr: 4, riskAmount: 100, pnl: -100, slPips: 6.1,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "GBPUSD vs EURUSD", poiSupported: "Yes", poiSupportType: ["Previous FVG", "Previous OB"], thirdCandle: "Positive", poiMitigation: ["Trigger Candle Is the Counter FVG Created Candle"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BB", slPips: "6.1", beLogic: "Counter FVG Mitigation", result: "SL", riskAmount: "100", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "EURUSD", direction: "Short",
    session: "London", htf: "15m", ltf: "1m", status: "Missed Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Today", result: "TP", rr: 5, riskAmount: 100, pnl: 500, slPips: 3.8,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "EURUSD vs GBPUSD", poiSupported: "No", poiSupportType: [], thirdCandle: "Negative", poiMitigation: ["Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "Spartan CISD", slPips: "3.8", beLogic: "BE Level", result: "TP", riskAmount: "100", riskReward: "5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-18", day: "Saturday", pair: "NAS100", direction: "Long",
    session: "New York", htf: "1h", ltf: "5m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "TP", rr: 8, riskAmount: 125, pnl: 1000, slPips: 24,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "NAS100 vs SPX500", poiSupported: "Yes", poiSupportType: ["Previous FVG"], thirdCandle: "Positive", poiMitigation: ["Aggressive Retracement", "Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BB", slPips: "24", beLogic: "ERL", result: "TP", riskAmount: "125", riskReward: "8", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-11", day: "Saturday", pair: "USDJPY", direction: "Long",
    session: "Asia", htf: "30m", ltf: "5m", status: "Took Trade", entryAttempt: "2nd Entry",
    fvgStatus: "Partial FVG", fvgFormed: "Today", result: "SL", rr: 3.5, riskAmount: 80, pnl: -80, slPips: 7.4,
    htfAnalysis: { hasSmt: "No", smtStrength: "", smtPair: "USDJPY vs EURJPY", poiSupported: "Yes", poiSupportType: ["Previous OB"], thirdCandle: "Positive", poiMitigation: ["Coming After Creating a Counter FVG"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "Spartan CISD", slPips: "7.4", beLogic: "BE Level", result: "SL", riskAmount: "80", riskReward: "3.5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-06-29", day: "Monday", pair: "GBPJPY", direction: "Short",
    session: "London", htf: "1h", ltf: "5m", status: "Not Taken", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "BE", rr: 4, riskAmount: 100, pnl: 0, slPips: 12.5,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "GBPJPY vs EURJPY", poiSupported: "No", poiSupportType: [], thirdCandle: "Negative", poiMitigation: ["Trigger Candle Is the Counter FVG Created Candle"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BB", slPips: "12.5", beLogic: "Counter FVG Mitigation", result: "BE", riskAmount: "100", riskReward: "4", chartLinks: [] }
  }
];

const elements = {
  modal: document.querySelector("#tradeModal"),
  modalPanel: document.querySelector("#tradeModalPanel"),
  modalEyebrow: document.querySelector("#modalEyebrow"),
  modalTitle: document.querySelector("#tradeModalTitle"),
  stepTabs: document.querySelector("#stepTabs"),
  addTradeBtn: document.querySelector("#addTradeBtn"),
  closeModalBtn: document.querySelector("#closeModalBtn"),
  clearFormBtn: document.querySelector("#clearFormBtn"),
  basicForm: document.querySelector("#basicTradeForm"),
  htfForm: document.querySelector("#htfAnalysisForm"),
  ltfForm: document.querySelector("#ltfAnalysisForm"),
  date: document.querySelector("#tradeDate"),
  day: document.querySelector("#tradeDay"),
  pair: document.querySelector("#tradePair"),
  htf: document.querySelector("#tradeHtf"),
  ltf: document.querySelector("#tradeLtf"),
  smtPairText: document.querySelector("#smtPairText"),
  smtDetails: document.querySelector("#smtDetails"),
  poiSupportDetails: document.querySelector("#poiSupportDetails"),
  poiMitigationOptions: document.querySelector("#poiMitigationOptions"),
  entryLevelOptions: document.querySelector("#entryLevelOptions"),
  addPoiMitigationOptionBtn: document.querySelector("#addPoiMitigationOptionBtn"),
  addEntryLevelOptionBtn: document.querySelector("#addEntryLevelOptionBtn"),
  backToBasicBtn: document.querySelector("#backToBasicBtn"),
  backToHtfBtn: document.querySelector("#backToHtfBtn"),
  basicMessage: document.querySelector("#basicFormMessage"),
  htfMessage: document.querySelector("#htfFormMessage"),
  ltfMessage: document.querySelector("#ltfFormMessage"),
  riskAmount: document.querySelector("#riskAmount"),
  riskReward: document.querySelector("#riskReward"),
  calculatedPnl: document.querySelector("#calculatedPnl"),
  rows: document.querySelector("#tradeRows"),
  weekPnl: document.querySelector("#weekPnl"),
  weekWinRate: document.querySelector("#weekWinRate"),
  weekTrades: document.querySelector("#weekTrades"),
  weekAvgRr: document.querySelector("#weekAvgRr"),
  weekRange: document.querySelector("#weekRange"),
  toast: document.querySelector("#toast"),
  backupBtn: document.querySelector("#backupBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  installBtn: document.querySelector("#installBtn"),
  connectBtn: document.querySelector("#connectBtn"),
  viewAllBtn: document.querySelector("#viewAllBtn"),
  dashboardView: document.querySelector("#dashboardView"),
  researchView: document.querySelector("#researchView"),
  backToDashboardBtn: document.querySelector("#backToDashboardBtn"),
  addTradeResearchBtn: document.querySelector("#addTradeResearchBtn"),
  researchRows: document.querySelector("#researchTradeRows"),
  researchMobileList: document.querySelector("#researchMobileList"),
  filteredPnl: document.querySelector("#filteredPnl"),
  filteredWinRate: document.querySelector("#filteredWinRate"),
  filteredTrades: document.querySelector("#filteredTrades"),
  filteredAvgRr: document.querySelector("#filteredAvgRr"),
  researchResultCount: document.querySelector("#researchResultCount"),
  winningTradeCount: document.querySelector("#winningTradeCount"),
  losingTradeCount: document.querySelector("#losingTradeCount"),
  winningSimilarities: document.querySelector("#winningSimilarities"),
  losingSimilarities: document.querySelector("#losingSimilarities"),
  edgeCards: document.querySelector("#edgeCards"),
  filterGrid: document.querySelector("#filterGrid"),
  filterSearch: document.querySelector("#filterSearch"),
  filterDateFrom: document.querySelector("#filterDateFrom"),
  filterDateTo: document.querySelector("#filterDateTo"),
  filterSort: document.querySelector("#filterSort"),
  activeFilterCount: document.querySelector("#activeFilterCount"),
  clearFiltersBtn: document.querySelector("#clearFiltersBtn"),
  tradeDetailModal: document.querySelector("#tradeDetailModal"),
  closeTradeDetailBtn: document.querySelector("#closeTradeDetailBtn"),
  tradeDetailTitle: document.querySelector("#tradeDetailTitle"),
  tradeDetailContent: document.querySelector("#tradeDetailContent"),
  imagePreviewModal: document.querySelector("#imagePreviewModal"),
  previewImage: document.querySelector("#previewImage"),
  previewStatus: document.querySelector("#previewStatus"),
  previewOpenOriginal: document.querySelector("#previewOpenOriginal"),
  closeImagePreviewBtn: document.querySelector("#closeImagePreviewBtn")
};

const chartUi = {
  htf: {
    list: document.querySelector("#htfChartLinks"),
    addButton: document.querySelector("#addHtfLinkBtn"),
    uploadInput: document.querySelector("#htfUploadInput"),
    dropZone: document.querySelector("#htfDropZone"),
    preview: document.querySelector("#htfDropPreview"),
    openActiveButton: document.querySelector("#openActiveHtfPreviewBtn"),
    defaultLabel: "HTF before mitigation"
  },
  ltf: {
    list: document.querySelector("#ltfChartLinks"),
    addButton: document.querySelector("#addLtfLinkBtn"),
    uploadInput: document.querySelector("#ltfUploadInput"),
    dropZone: document.querySelector("#ltfDropZone"),
    preview: document.querySelector("#ltfDropPreview"),
    openActiveButton: document.querySelector("#openActiveLtfPreviewBtn"),
    defaultLabel: LTF_DEFAULT_LINK_LABELS[0],
    defaultLabels: LTF_DEFAULT_LINK_LABELS
  }
};

let deferredInstallPrompt = null;
let trades = loadTrades();
let optionLibrary = loadOptionLibrary();
let currentDraft = loadDraft() || createEmptyDraft();
let currentStep = currentDraft.lastStep || "basic";

function createEmptyDraft() {
  return {
    id: createId(),
    appNamespace: APP_NAMESPACE,
    createdAt: new Date().toISOString(),
    lastStep: "basic",
    basic: {},
    htf: {
      chartLinks: [{ id: createId(), label: chartUi?.htf?.defaultLabel || "HTF before mitigation", url: "" }],
      uploadedImage: null,
      activePreview: null
    },
    ltf: {
      linkPresetVersion: LTF_LINK_PRESET_VERSION,
      chartLinks: LTF_DEFAULT_LINK_LABELS.map((label) => ({ id: createId(), label, url: "" })),
      uploadedImage: null,
      activePreview: null,
      riskAmount: DEFAULT_RISK_AMOUNT
    }
  };
}

function loadTrades() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.trades);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(seedTrades));
      return structuredClone(seedTrades);
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : structuredClone(seedTrades);
  } catch (error) {
    console.error("Unable to load Evergreen trades:", error);
    return structuredClone(seedTrades);
  }
}

function loadDraft() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.draft);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed?.appNamespace !== APP_NAMESPACE) return null;
    return normaliseDraft(parsed);
  } catch (error) {
    console.warn("Unable to load Evergreen draft:", error);
    return null;
  }
}

function normaliseDraft(draft) {
  const empty = createEmptyDraft();
  const storedLtfLinks = Array.isArray(draft.ltf?.chartLinks) && draft.ltf.chartLinks.length
    ? draft.ltf.chartLinks.map((link) => ({
      id: link.id || createId(),
      label: link.label || "",
      url: link.url || ""
    }))
    : [];

  // One-time migration for drafts created before the dedicated LTF reference cards existed.
  // Existing links and URLs are preserved; only missing preset cards are appended.
  const migratedLtfLinks = Number(draft.ltf?.linkPresetVersion || 0) >= LTF_LINK_PRESET_VERSION
    ? (storedLtfLinks.length ? storedLtfLinks : empty.ltf.chartLinks)
    : LTF_DEFAULT_LINK_LABELS.reduce((links, label) => {
      const alreadyExists = links.some((link) => link.label.trim().toLowerCase() === label.toLowerCase());
      if (!alreadyExists) links.push({ id: createId(), label, url: "" });
      return links;
    }, storedLtfLinks);

  return {
    ...empty,
    ...draft,
    basic: { ...empty.basic, ...(draft.basic || {}) },
    htf: {
      ...empty.htf,
      ...(draft.htf || {}),
      chartLinks: Array.isArray(draft.htf?.chartLinks) && draft.htf.chartLinks.length
        ? draft.htf.chartLinks
        : empty.htf.chartLinks
    },
    ltf: {
      ...empty.ltf,
      ...(draft.ltf || {}),
      riskAmount: draft.ltf?.riskAmount === "" || draft.ltf?.riskAmount == null
        ? DEFAULT_RISK_AMOUNT
        : String(draft.ltf.riskAmount),
      linkPresetVersion: LTF_LINK_PRESET_VERSION,
      chartLinks: migratedLtfLinks.length ? migratedLtfLinks : empty.ltf.chartLinks
    }
  };
}

function loadOptionLibrary() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.options) || "{}");
    return {
      poiMitigation: uniqueValues([...DEFAULT_OPTIONS.poiMitigation, ...(stored.poiMitigation || [])]),
      entryLevel: uniqueValues([...DEFAULT_OPTIONS.entryLevel, ...(stored.entryLevel || [])])
    };
  } catch (error) {
    console.warn("Unable to load Evergreen option library:", error);
    return structuredClone(DEFAULT_OPTIONS);
  }
}

function saveTrades() {
  localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(trades));
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(currentDraft));
    return true;
  } catch (error) {
    console.error("Unable to save Evergreen draft:", error);
    showToast("Draft is too large for browser storage. Remove a large uploaded screenshot or use chart links.");
    return false;
  }
}

function saveOptionLibrary() {
  localStorage.setItem(STORAGE_KEYS.options, JSON.stringify(optionLibrary));
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function setDefaultDate() {
  if (elements.date.value) return;
  const now = new Date();
  elements.date.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  updateDay();
}

function updateDay() {
  if (!elements.date.value) {
    elements.day.value = "";
    return;
  }
  const date = new Date(`${elements.date.value}T12:00:00`);
  elements.day.value = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

function updateLtf() {
  const mapping = {
    "5m": "1m",
    "15m": "1m",
    "30m": "5m",
    "1h": "5m",
    "4h": "15m"
  };
  elements.ltf.value = mapping[elements.htf.value] ?? DEFAULT_LTF;
}

function updateSmtPair() {
  const pair = elements.pair.value;
  const comparison = SMT_PAIR_MAP[pair] || "Comparison Pair";
  elements.smtPairText.textContent = pair === "XAUUSD"
    ? `XAUUSD (Gold) vs ${comparison}`
    : `${pair} vs ${comparison}`;
}

function openModal() {
  currentDraft = loadDraft() || createEmptyDraft();
  optionLibrary = loadOptionLibrary();
  renderDynamicOptions();
  restoreDraftIntoForms();
  renderAllChartLinks();
  updateChartPreviews();
  showStep(currentDraft.lastStep || "basic");
  elements.modal.hidden = false;
  document.body.classList.add("modal-open");
  clearMessages();
}

function closeModal() {
  captureVisibleStep();
  saveDraft();
  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function clearAllTradeForms() {
  currentDraft = createEmptyDraft();
  elements.basicForm.reset();
  elements.htfForm.reset();
  elements.ltfForm.reset();
  setDefaultDate();
  elements.htf.value = DEFAULT_HTF;
  updateLtf();
  elements.riskAmount.value = DEFAULT_RISK_AMOUNT;
  updateSmtPair();
  renderDynamicOptions();
  renderAllChartLinks();
  updateChartPreviews();
  updateConditionalPanels();
  updateCalculatedPnl();
  syncChoiceCards();
  showStep("basic");
  saveDraft();
  clearMessages();
  showToast("New Evergreen trade form cleared.");
}

function clearMessages() {
  elements.basicMessage.textContent = "";
  elements.htfMessage.textContent = "";
  elements.ltfMessage.textContent = "";
}

function showStep(step) {
  const validStep = ["basic", "htf", "ltf"].includes(step) ? step : "basic";
  currentStep = validStep;
  currentDraft.lastStep = validStep;

  document.querySelectorAll(".wizard-step").forEach((section) => {
    section.hidden = section.dataset.step !== validStep;
  });

  const titles = {
    basic: ["NEW TRADE", "Step 1 — Basic Info"],
    htf: ["HTF ANALYSIS", "FVG POI Checklist"],
    ltf: ["LTF ANALYSIS", "Execution Checklist"]
  };
  elements.modalEyebrow.textContent = titles[validStep][0];
  elements.modalTitle.textContent = titles[validStep][1];
  elements.modalPanel.classList.toggle("analysis-mode", validStep !== "basic");

  document.querySelectorAll(".step-tab").forEach((button) => {
    const target = button.dataset.stepTarget;
    button.classList.toggle("active", target === validStep);
    button.disabled = target === "htf"
      ? !Object.keys(currentDraft.basic || {}).length
      : target === "ltf"
        ? !Object.keys(currentDraft.htf || {}).some((key) => !["chartLinks", "uploadedImage", "activePreview"].includes(key))
        : false;
  });

  saveDraft();
  window.setTimeout(() => {
    const scrollTarget = validStep === "basic"
      ? elements.date
      : document.querySelector(`#${validStep}Step .analysis-questions`);
    scrollTarget?.focus?.({ preventScroll: true });
  }, 20);
}

function captureVisibleStep() {
  if (currentStep === "basic") captureBasicForm();
  if (currentStep === "htf") captureHtfForm();
  if (currentStep === "ltf") captureLtfForm();
}

function captureBasicForm() {
  const data = Object.fromEntries(new FormData(elements.basicForm).entries());
  currentDraft.basic = data;
  return data;
}

function captureHtfForm() {
  const formData = new FormData(elements.htfForm);
  currentDraft.htf = {
    ...currentDraft.htf,
    hasSmt: formData.get("hasSmt") || "",
    smtStrength: formData.get("smtStrength") || "",
    smtPair: elements.smtPairText.textContent,
    poiSupported: formData.get("poiSupported") || "",
    poiSupportType: formData.getAll("poiSupportType"),
    thirdCandle: formData.get("thirdCandle") || "",
    poiMitigation: formData.getAll("poiMitigation")
  };
  return currentDraft.htf;
}

function captureLtfForm() {
  const formData = new FormData(elements.ltfForm);
  currentDraft.ltf = {
    ...currentDraft.ltf,
    entryLevel: formData.get("entryLevel") || "",
    slPips: formData.get("slPips") || "",
    beLogic: formData.get("beLogic") || "",
    result: formData.get("result") || "",
    riskAmount: formData.get("riskAmount") || "",
    riskReward: formData.get("riskReward") || ""
  };
  return currentDraft.ltf;
}

function restoreDraftIntoForms() {
  elements.basicForm.reset();
  elements.htfForm.reset();
  elements.ltfForm.reset();

  setFormValues(elements.basicForm, currentDraft.basic);
  if (!currentDraft.basic?.date) setDefaultDate();
  if (!currentDraft.basic?.htf) elements.htf.value = DEFAULT_HTF;
  updateDay();
  updateLtf();
  updateSmtPair();

  setFormValues(elements.htfForm, currentDraft.htf);
  setFormValues(elements.ltfForm, currentDraft.ltf);
  if (!elements.riskAmount.value) elements.riskAmount.value = DEFAULT_RISK_AMOUNT;
  updateConditionalPanels();
  updateCalculatedPnl();
  syncChoiceCards();
}

function setFormValues(form, values = {}) {
  Object.entries(values).forEach(([name, value]) => {
    if (["chartLinks", "uploadedImage", "activePreview", "smtPair"].includes(name)) return;
    const controls = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
    controls.forEach((control) => {
      if (control.type === "radio") {
        control.checked = String(control.value) === String(value);
      } else if (control.type === "checkbox") {
        control.checked = Array.isArray(value) && value.includes(control.value);
      } else if (!Array.isArray(value)) {
        control.value = value ?? "";
      }
    });
  });
}

function syncChoiceCards() {
  document.querySelectorAll(".choice-card").forEach((card) => {
    const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
    card.classList.toggle("selected", Boolean(input?.checked));
  });
}

function updateConditionalPanels() {
  const hasSmt = elements.htfForm.querySelector('input[name="hasSmt"]:checked')?.value;
  elements.smtDetails.hidden = hasSmt !== "Yes";
  if (hasSmt !== "Yes") {
    elements.htfForm.querySelectorAll('input[name="smtStrength"]').forEach((input) => {
      input.checked = false;
    });
  }

  const poiSupported = elements.htfForm.querySelector('input[name="poiSupported"]:checked')?.value;
  elements.poiSupportDetails.hidden = poiSupported !== "Yes";
  if (poiSupported !== "Yes") {
    elements.htfForm.querySelectorAll('input[name="poiSupportType"]').forEach((input) => {
      input.checked = false;
    });
  }
  syncChoiceCards();
}

function handleBasicSubmit(event) {
  event.preventDefault();
  elements.basicMessage.textContent = "";
  if (!elements.basicForm.checkValidity()) {
    elements.basicMessage.textContent = "Complete all required basic details.";
    elements.basicForm.reportValidity();
    return;
  }

  captureBasicForm();
  updateSmtPair();
  saveDraft();
  showStep("htf");
}

function handleHtfSubmit(event) {
  event.preventDefault();
  elements.htfMessage.textContent = "";
  captureHtfForm();

  if (!elements.htfForm.checkValidity()) {
    elements.htfMessage.textContent = "Answer all required HTF questions.";
    elements.htfForm.reportValidity();
    return;
  }
  if (currentDraft.htf.hasSmt === "Yes" && !currentDraft.htf.smtStrength) {
    elements.htfMessage.textContent = "Select Weak SMT or Strong SMT.";
    return;
  }
  if (currentDraft.htf.poiSupported === "Yes" && !currentDraft.htf.poiSupportType.length) {
    elements.htfMessage.textContent = "Select Previous FVG, Previous OB, or both.";
    return;
  }
  if (!currentDraft.htf.poiMitigation.length) {
    elements.htfMessage.textContent = "Select at least one POI mitigation behaviour.";
    return;
  }

  saveDraft();
  showStep("ltf");
}

function handleLtfSubmit(event) {
  event.preventDefault();
  elements.ltfMessage.textContent = "";
  captureLtfForm();

  if (!elements.ltfForm.checkValidity()) {
    elements.ltfMessage.textContent = "Complete all required LTF and outcome fields.";
    elements.ltfForm.reportValidity();
    return;
  }
  if (!currentDraft.ltf.entryLevel) {
    elements.ltfMessage.textContent = "Select the entry level used.";
    return;
  }

  const riskAmount = Number(currentDraft.ltf.riskAmount || 0);
  const riskReward = Number(currentDraft.ltf.riskReward || 0);
  const pnl = calculatePnl(currentDraft.ltf.result, riskAmount, riskReward);
  const basic = currentDraft.basic;

  const trade = {
    id: currentDraft.id,
    date: basic.date,
    day: basic.day,
    pair: basic.pair,
    direction: basic.direction,
    session: basic.session,
    htf: basic.htf,
    ltf: basic.ltf,
    status: basic.status,
    entryAttempt: basic.entryAttempt,
    fvgStatus: basic.fvgStatus,
    fvgFormed: basic.fvgFormed,
    result: currentDraft.ltf.result,
    rr: riskReward,
    riskAmount,
    pnl,
    slPips: Number(currentDraft.ltf.slPips),
    htfAnalysis: structuredClone(currentDraft.htf),
    ltfAnalysis: structuredClone(currentDraft.ltf),
    createdAt: currentDraft.createdAt,
    updatedAt: new Date().toISOString(),
    appNamespace: APP_NAMESPACE
  };

  const existingIndex = trades.findIndex((item) => item.id === trade.id);
  if (existingIndex >= 0) trades[existingIndex] = trade;
  else trades.unshift(trade);

  saveTrades();
  localStorage.removeItem(STORAGE_KEYS.draft);
  currentDraft = createEmptyDraft();
  renderTrades();
  closeModalWithoutSavingDraft();
  showToast("Evergreen trade saved with Basic, HTF, and LTF analysis.");
}

function closeModalWithoutSavingDraft() {
  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");
  currentStep = "basic";
}

function calculatePnl(result, riskAmount, riskReward) {
  if (result === "TP") return riskAmount * riskReward;
  if (result === "SL") return -riskAmount;
  return 0;
}

function updateCalculatedPnl() {
  const result = elements.ltfForm.querySelector('input[name="result"]:checked')?.value || "BE";
  const pnl = calculatePnl(result, Number(elements.riskAmount.value || 0), Number(elements.riskReward.value || 0));
  elements.calculatedPnl.textContent = formatCurrency(pnl);
  elements.calculatedPnl.classList.toggle("negative", pnl < 0);
}

function renderDynamicOptions() {
  renderOptionCards({
    container: elements.poiMitigationOptions,
    values: optionLibrary.poiMitigation,
    name: "poiMitigation",
    type: "checkbox",
    selected: currentDraft.htf?.poiMitigation || []
  });
  renderOptionCards({
    container: elements.entryLevelOptions,
    values: optionLibrary.entryLevel,
    name: "entryLevel",
    type: "radio",
    selected: currentDraft.ltf?.entryLevel ? [currentDraft.ltf.entryLevel] : []
  });
  syncChoiceCards();
}

function renderOptionCards({ container, values, name, type, selected }) {
  container.innerHTML = "";
  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = `choice-card ${type === "checkbox" ? "checkbox-card" : ""}`;
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.value = value;
    input.checked = selected.includes(value);
    if (type === "radio") input.required = true;
    const strong = document.createElement("strong");
    strong.textContent = value;
    label.append(input, strong);
    container.appendChild(label);
  });
}

function addCustomOption(category) {
  const promptLabel = category === "poiMitigation"
    ? "Enter a new POI mitigation behaviour:"
    : "Enter a new LTF entry level:";
  const raw = window.prompt(promptLabel);
  if (raw === null) return;
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) {
    showToast("Option name cannot be empty.");
    return;
  }
  if (value.length > 80) {
    showToast("Keep the option name under 80 characters.");
    return;
  }
  const exists = optionLibrary[category].some((item) => item.toLowerCase() === value.toLowerCase());
  if (exists) {
    showToast("That option already exists.");
    return;
  }

  optionLibrary[category].push(value);
  saveOptionLibrary();
  if (category === "poiMitigation") {
    currentDraft.htf.poiMitigation = uniqueValues([...(currentDraft.htf.poiMitigation || []), value]);
  } else {
    currentDraft.ltf.entryLevel = value;
  }
  renderDynamicOptions();
  saveDraft();
  showToast("Option saved to the Evergreen option library for future trades.");
}

function ensureChartState(type) {
  if (!currentDraft[type]) currentDraft[type] = {};
  if (!Array.isArray(currentDraft[type].chartLinks) || !currentDraft[type].chartLinks.length) {
    currentDraft[type].chartLinks = [{
      id: createId(),
      label: chartUi[type].defaultLabel,
      url: ""
    }];
  }
}

function addChartLink(type, preset = {}) {
  ensureChartState(type);
  currentDraft[type].chartLinks.push({
    id: createId(),
    label: preset.label || "",
    url: preset.url || ""
  });
  renderChartLinks(type);
  saveDraft();
}

function renderAllChartLinks() {
  renderChartLinks("htf");
  renderChartLinks("ltf");
}

function renderChartLinks(type) {
  ensureChartState(type);
  const ui = chartUi[type];
  ui.list.innerHTML = "";

  currentDraft[type].chartLinks.forEach((link, index) => {
    const card = document.createElement("article");
    const isActivePreview = currentDraft[type].activePreview?.linkId === link.id;
    card.className = `chart-link-card ${link.url ? "has-link" : ""} ${isActivePreview ? "active" : ""}`;
    card.dataset.id = link.id;
    card.innerHTML = `
      <div class="chart-link-fields">
        <label>
          <span>Label</span>
          <input data-link-field="label" type="text" value="${escapeAttribute(link.label)}" placeholder="${type.toUpperCase()} chart ${index + 1}" />
        </label>
        <label>
          <span>Link</span>
          <input data-link-field="url" type="url" value="${escapeAttribute(link.url)}" placeholder="https://www.tradingview.com/x/..." />
        </label>
      </div>
      <div class="chart-link-actions">
        <button class="link-action" data-link-action="preview" type="button">Preview</button>
        <button class="link-action" data-link-action="open" type="button">Open</button>
        <button class="link-action remove" data-link-action="remove" type="button">Remove</button>
      </div>
    `;
    ui.list.appendChild(card);
  });
}

function handleChartListInput(type, event) {
  const field = event.target.closest("[data-link-field]");
  if (!field) return;
  const card = field.closest(".chart-link-card");
  const link = currentDraft[type].chartLinks.find((item) => item.id === card?.dataset.id);
  if (!link) return;
  link[field.dataset.linkField] = field.value;
  card.classList.toggle("has-link", Boolean(link.url));
  if (field.dataset.linkField === "url" && currentDraft[type].activePreview?.linkId === link.id) {
    currentDraft[type].activePreview = null;
    updateChartPreview(type);
  }
  saveDraft();
}

function handleChartListAction(type, event) {
  const button = event.target.closest("[data-link-action]");
  if (!button) return;
  const card = button.closest(".chart-link-card");
  const link = currentDraft[type].chartLinks.find((item) => item.id === card?.dataset.id);
  if (!link) return;

  const action = button.dataset.linkAction;
  if (action === "remove") {
    currentDraft[type].chartLinks = currentDraft[type].chartLinks.filter((item) => item.id !== link.id);
    if (currentDraft[type].activePreview?.linkId === link.id) {
      currentDraft[type].activePreview = null;
      updateChartPreview(type);
    }
    ensureChartState(type);
    renderChartLinks(type);
    saveDraft();
    return;
  }

  if (!link.url) {
    showToast("Paste a TradingView or image link first.");
    return;
  }
  if (!isSafeHttpUrl(link.url)) {
    showToast("Use a valid http or https link.");
    return;
  }

  if (action === "open") {
    window.open(link.url, "_blank", "noopener,noreferrer");
  } else {
    const preview = resolveImagePreview(link.url);
    if (!preview.src || preview.message) {
      showToast(preview.message || "Preview is unavailable for this link.");
      return;
    }
    currentDraft[type].activePreview = {
      src: preview.src,
      originalSrc: link.url,
      linkId: link.id,
      label: link.label || `${type.toUpperCase()} chart`
    };
    updateChartPreview(type);
    renderChartLinks(type);
    saveDraft();
    showToast(`${type.toUpperCase()} chart loaded in the preview panel.`);
  }
}

function isSafeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function resolveImagePreview(value) {
  const original = String(value || "").trim();
  try {
    const url = new URL(original);
    const host = url.hostname.toLowerCase();
    const snapshotMatch = url.pathname.match(/^\/x\/([a-zA-Z0-9_-]+)\/?$/);
    const isDirectImage = /\.(?:png|jpe?g|webp|gif)(?:$|\?)/i.test(`${url.pathname}${url.search}`);

    if (isDirectImage) {
      return { src: original, message: "" };
    }

    if (host.endsWith("tradingview.com") && snapshotMatch) {
      const snapshotId = snapshotMatch[1];
      return {
        src: `https://s3.tradingview.com/snapshots/${snapshotId.charAt(0).toLowerCase()}/${snapshotId}.png`,
        message: ""
      };
    }

    if (host.endsWith("tradingview.com") && !snapshotMatch) {
      return {
        src: "",
        message: "This is a TradingView webpage link, not a snapshot-image link. In TradingView, use the camera icon and choose Copy link to chart image."
      };
    }

    return { src: original, message: "" };
  } catch {
    return { src: "", message: "Use a valid http or https image link." };
  }
}

function setPreviewStatus(message, isError = false) {
  elements.previewStatus.textContent = message;
  elements.previewStatus.hidden = !message;
  elements.previewStatus.classList.toggle("error", Boolean(isError));
}

function openImagePreview(src, originalSrc = src, message = "") {
  elements.previewImage.hidden = true;
  elements.previewImage.removeAttribute("src");
  const canOpenOriginal = /^https?:\/\//i.test(String(originalSrc || ""));
  elements.previewOpenOriginal.href = canOpenOriginal ? originalSrc : "#";
  elements.previewOpenOriginal.hidden = !canOpenOriginal;
  elements.imagePreviewModal.hidden = false;

  if (message || !src) {
    setPreviewStatus(message || "Preview is unavailable for this link.", true);
    return;
  }

  setPreviewStatus("Loading chart preview…");
  elements.previewImage.src = src;
}

function closeImagePreview() {
  elements.imagePreviewModal.hidden = true;
  elements.previewImage.hidden = true;
  elements.previewImage.removeAttribute("src");
  elements.previewOpenOriginal.removeAttribute("href");
  setPreviewStatus("");
}

function bindChartUi(type) {
  const ui = chartUi[type];
  ui.addButton.addEventListener("click", () => addChartLink(type));
  ui.list.addEventListener("input", (event) => handleChartListInput(type, event));
  ui.list.addEventListener("click", (event) => handleChartListAction(type, event));
  ui.uploadInput.addEventListener("change", () => {
    const [file] = ui.uploadInput.files;
    if (file) handleChartImage(type, file);
    ui.uploadInput.value = "";
  });

  ui.dropZone.tabIndex = 0;
  ui.dropZone.addEventListener("click", () => {
    const active = getActiveChartPreview(type);
    if (active?.src) openImagePreview(active.src, active.originalSrc || active.src);
    else ui.uploadInput.click();
  });
  ui.openActiveButton.addEventListener("click", () => {
    const active = getActiveChartPreview(type);
    if (active?.src) openImagePreview(active.src, active.originalSrc || active.src);
  });
  ui.preview.addEventListener("load", () => {
    ui.preview.hidden = false;
    ui.dropZone.classList.add("has-preview");
    ui.openActiveButton.hidden = false;
  });
  ui.preview.addEventListener("error", () => {
    ui.preview.hidden = true;
    ui.dropZone.classList.remove("has-preview");
    ui.openActiveButton.hidden = true;
    showToast("That chart image could not be loaded. Check the TradingView snapshot link and your internet connection.");
  });
  ui.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    ui.dropZone.classList.add("drag-active");
  });
  ui.dropZone.addEventListener("dragleave", () => ui.dropZone.classList.remove("drag-active"));
  ui.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    ui.dropZone.classList.remove("drag-active");
    const [file] = event.dataTransfer.files;
    if (file) handleChartImage(type, file);
  });
  ui.dropZone.addEventListener("paste", (event) => handleChartPaste(type, event));
}

function handleChartPaste(type, event) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (imageItem) {
    const file = imageItem.getAsFile();
    if (file) handleChartImage(type, file);
    return;
  }
  const text = event.clipboardData?.getData("text/plain")?.trim();
  if (text && isSafeHttpUrl(text)) {
    const empty = currentDraft[type].chartLinks.find((link) => !link.url);
    if (empty) empty.url = text;
    else addChartLink(type, { url: text });
    renderChartLinks(type);
    saveDraft();
  }
}

function handleChartImage(type, file) {
  if (!file.type.startsWith("image/")) {
    showToast("Select an image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("For local drafts, keep screenshots under 2 MB. TradingView links are better until Supabase Storage is connected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    currentDraft[type].uploadedImage = {
      name: file.name || `${type}-chart.png`,
      type: file.type,
      dataUrl: String(reader.result)
    };
    currentDraft[type].activePreview = {
      src: String(reader.result),
      originalSrc: "",
      linkId: "",
      label: file.name || `${type.toUpperCase()} uploaded chart`
    };
    updateChartPreview(type);
    saveDraft();
    showToast(`${type.toUpperCase()} screenshot added to this Evergreen draft.`);
  };
  reader.readAsDataURL(file);
}

function updateChartPreviews() {
  updateChartPreview("htf");
  updateChartPreview("ltf");
}

function getActiveChartPreview(type) {
  const active = currentDraft[type]?.activePreview;
  if (active?.src) return active;

  const uploaded = currentDraft[type]?.uploadedImage?.dataUrl;
  if (uploaded) {
    return {
      src: uploaded,
      originalSrc: "",
      linkId: "",
      label: currentDraft[type]?.uploadedImage?.name || `${type.toUpperCase()} uploaded chart`
    };
  }
  return null;
}

function updateChartPreview(type) {
  const ui = chartUi[type];
  const active = getActiveChartPreview(type);
  const image = active?.src || "";

  ui.dropZone.classList.toggle("has-preview", Boolean(image));
  ui.openActiveButton.hidden = !image;

  if (!image) {
    ui.preview.hidden = true;
    ui.preview.removeAttribute("src");
    return;
  }

  ui.preview.hidden = false;
  if (ui.preview.getAttribute("src") !== image) ui.preview.src = image;
  ui.preview.alt = active?.label ? `${active.label} preview` : `${type.toUpperCase()} chart preview`;
}


const RESEARCH_FILTER_KEYS = [
  "direction", "status", "pair", "result", "session", "htf", "entryAttempt", "fvgStatus",
  "fvgFormed", "hasSmt", "smtStrength", "poiSupportType", "thirdCandle", "poiMitigation",
  "entryLevel", "beLogic"
];

const INSIGHT_LABELS = {
  pair: "Pair",
  direction: "Direction",
  session: "Session",
  fvgStatus: "FVG status",
  fvgFormed: "FVG formed",
  hasSmt: "SMT",
  smtStrength: "SMT strength",
  poiSupportType: "POI support",
  thirdCandle: "Third candle",
  poiMitigation: "Mitigation",
  entryLevel: "Entry level",
  beLogic: "BE logic"
};

function getTradeField(trade, key) {
  const nested = {
    hasSmt: trade.htfAnalysis?.hasSmt,
    smtStrength: trade.htfAnalysis?.smtStrength,
    smtPair: trade.htfAnalysis?.smtPair,
    poiSupported: trade.htfAnalysis?.poiSupported,
    poiSupportType: trade.htfAnalysis?.poiSupportType,
    thirdCandle: trade.htfAnalysis?.thirdCandle,
    poiMitigation: trade.htfAnalysis?.poiMitigation,
    entryLevel: trade.ltfAnalysis?.entryLevel,
    beLogic: trade.ltfAnalysis?.beLogic
  };
  return Object.prototype.hasOwnProperty.call(nested, key) ? nested[key] : trade[key];
}

function getComparableValues(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [String(value).trim()];
}

function populateFilterOptions() {
  document.querySelectorAll("select[data-filter-key]").forEach((select) => {
    const currentValue = select.value;
    const key = select.dataset.filterKey;
    const firstOption = select.options[0]?.cloneNode(true);
    const values = uniqueValues(
      trades.flatMap((trade) => getComparableValues(getTradeField(trade, key)))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    select.innerHTML = "";
    if (firstOption) select.appendChild(firstOption);
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (values.includes(currentValue)) select.value = currentValue;
  });
}

function collectResearchFilters() {
  const filters = {
    search: elements.filterSearch.value.trim().toLowerCase(),
    dateFrom: elements.filterDateFrom.value,
    dateTo: elements.filterDateTo.value,
    sort: elements.filterSort.value
  };
  RESEARCH_FILTER_KEYS.forEach((key) => {
    filters[key] = document.querySelector(`select[data-filter-key="${key}"]`)?.value || "";
  });
  return filters;
}

function tradeSearchText(trade) {
  const values = [
    trade.date, trade.day, trade.pair, trade.direction, trade.status, trade.entryAttempt,
    trade.fvgStatus, trade.fvgFormed, trade.result, trade.session, trade.htf, trade.ltf,
    getTradeField(trade, "hasSmt"), getTradeField(trade, "smtStrength"),
    getTradeField(trade, "smtPair"), getTradeField(trade, "poiSupported"),
    ...getComparableValues(getTradeField(trade, "poiSupportType")),
    getTradeField(trade, "thirdCandle"),
    ...getComparableValues(getTradeField(trade, "poiMitigation")),
    getTradeField(trade, "entryLevel"), getTradeField(trade, "beLogic")
  ];
  return values.filter(Boolean).join(" ").toLowerCase();
}

function getFilteredTrades() {
  const filters = collectResearchFilters();
  const filtered = trades.filter((trade) => {
    if (filters.search && !tradeSearchText(trade).includes(filters.search)) return false;
    if (filters.dateFrom && String(trade.date || "") < filters.dateFrom) return false;
    if (filters.dateTo && String(trade.date || "") > filters.dateTo) return false;

    return RESEARCH_FILTER_KEYS.every((key) => {
      const selected = filters[key];
      if (!selected) return true;
      return getComparableValues(getTradeField(trade, key)).includes(selected);
    });
  });

  const sorters = {
    newest: (a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    oldest: (a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
    "pnl-high": (a, b) => Number(b.pnl || 0) - Number(a.pnl || 0),
    "pnl-low": (a, b) => Number(a.pnl || 0) - Number(b.pnl || 0),
    "rr-high": (a, b) => Number(b.rr || 0) - Number(a.rr || 0),
    "rr-low": (a, b) => Number(a.rr || 0) - Number(b.rr || 0)
  };
  return filtered.sort(sorters[filters.sort] || sorters.newest);
}

function activeResearchFilterCount() {
  const filters = collectResearchFilters();
  return [
    filters.search, filters.dateFrom, filters.dateTo,
    ...RESEARCH_FILTER_KEYS.map((key) => filters[key])
  ].filter(Boolean).length;
}

function renderResearchView() {
  if (!elements.researchRows) return;
  const filtered = getFilteredTrades();
  updateResearchStats(filtered);
  renderSimilaritySnapshot(filtered);
  renderEdgeCards(filtered);
  renderResearchTradeRows(filtered);

  const count = filtered.length;
  const activeCount = activeResearchFilterCount();
  elements.researchResultCount.textContent = `${count} ${count === 1 ? "result" : "results"}`;
  elements.activeFilterCount.textContent = activeCount
    ? `${activeCount} active ${activeCount === 1 ? "filter" : "filters"}`
    : "No active filters";
}

function updateResearchStats(filtered) {
  const counted = filtered.filter((trade) => trade.status === "Took Trade");
  const wins = counted.filter((trade) => trade.result === "TP").length;
  const pnl = counted.reduce((total, trade) => total + Number(trade.pnl || 0), 0);
  const rrTrades = counted.filter((trade) => Number.isFinite(Number(trade.rr)) && Number(trade.rr) > 0);
  const avgRr = rrTrades.length
    ? rrTrades.reduce((total, trade) => total + Number(trade.rr), 0) / rrTrades.length
    : 0;

  elements.filteredPnl.textContent = formatCurrency(pnl);
  elements.filteredPnl.classList.toggle("negative", pnl < 0);
  elements.filteredWinRate.textContent = counted.length ? `${((wins / counted.length) * 100).toFixed(1)}%` : "0.0%";
  elements.filteredTrades.textContent = String(filtered.length);
  elements.filteredAvgRr.textContent = `${avgRr.toFixed(2)}R`;
}

function mostCommonInsight(subset, key) {
  const counts = new Map();
  subset.forEach((trade) => {
    getComparableValues(getTradeField(trade, key)).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });
  const [value, count] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];
  if (!value || !subset.length) return null;
  return { key, value, count, percentage: Math.round((count / subset.length) * 100) };
}

function renderSimilarityList(container, subset) {
  const insightKeys = ["direction", "session", "fvgStatus", "fvgFormed", "hasSmt", "smtStrength", "poiSupportType", "thirdCandle", "poiMitigation", "entryLevel", "beLogic"];
  const insights = insightKeys.map((key) => mostCommonInsight(subset, key)).filter(Boolean).slice(0, 6);
  if (!insights.length) {
    container.innerHTML = '<p class="empty-insight">Not enough recorded trades for a similarity pattern.</p>';
    return;
  }
  container.innerHTML = insights.map((insight) => `
    <p><strong>${insight.percentage}%</strong><span>${escapeHtml(INSIGHT_LABELS[insight.key])}: ${escapeHtml(insight.value)}</span></p>
  `).join("");
}

function renderSimilaritySnapshot(filtered) {
  const counted = filtered.filter((trade) => trade.status === "Took Trade");
  const winners = counted.filter((trade) => trade.result === "TP");
  const losers = counted.filter((trade) => trade.result === "SL");
  elements.winningTradeCount.textContent = `${winners.length} TP ${winners.length === 1 ? "trade" : "trades"}`;
  elements.losingTradeCount.textContent = `${losers.length} SL ${losers.length === 1 ? "trade" : "trades"}`;
  renderSimilarityList(elements.winningSimilarities, winners);
  renderSimilarityList(elements.losingSimilarities, losers);
}

function getPerformanceGroups(tradesToGroup, key) {
  const groups = new Map();
  tradesToGroup.forEach((trade) => {
    const values = getComparableValues(getTradeField(trade, key));
    values.forEach((value) => {
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value).push(trade);
    });
  });
  return [...groups.entries()].map(([value, group]) => {
    const wins = group.filter((trade) => trade.result === "TP").length;
    return {
      value,
      count: group.length,
      winRate: group.length ? (wins / group.length) * 100 : 0,
      pnl: group.reduce((total, trade) => total + Number(trade.pnl || 0), 0)
    };
  });
}

function bestPerformance(tradesToGroup, key, worst = false) {
  const groups = getPerformanceGroups(tradesToGroup, key);
  groups.sort((a, b) => {
    if (worst) return a.winRate - b.winRate || a.pnl - b.pnl || b.count - a.count;
    return b.winRate - a.winRate || b.pnl - a.pnl || b.count - a.count;
  });
  return groups[0] || null;
}

function renderEdgeCards(filtered) {
  const counted = filtered.filter((trade) => trade.status === "Took Trade");
  const definitions = [
    ["BEST PAIR", "pair", false],
    ["BEST SESSION", "session", false],
    ["BEST SMT TYPE", "smtStrength", false],
    ["BEST POI SUPPORT", "poiSupportType", false],
    ["BEST MITIGATION", "poiMitigation", false],
    ["BEST ENTRY LEVEL", "entryLevel", false],
    ["BEST BE LOGIC", "beLogic", false],
    ["WORST MITIGATION", "poiMitigation", true]
  ];
  elements.edgeCards.innerHTML = definitions.map(([title, key, worst]) => {
    const result = bestPerformance(counted, key, worst);
    if (!result) {
      return `<article class="edge-card ${worst ? "edge-card-worst" : ""}"><p>${title}</p><h3>Not enough data</h3><small>Add more completed trades.</small></article>`;
    }
    return `
      <article class="edge-card ${worst ? "edge-card-worst" : ""}">
        <p>${title}</p>
        <h3>${escapeHtml(result.value)}</h3>
        <small>${result.count} ${result.count === 1 ? "trade" : "trades"} · ${result.winRate.toFixed(1)}% win rate · ${escapeHtml(formatCurrency(result.pnl))} P/L</small>
      </article>
    `;
  }).join("");
}

function formatTradeDate(trade) {
  if (!trade.date) return { dateText: "—", dayText: trade.day || "" };
  const date = new Date(`${trade.date}T12:00:00`);
  const dateText = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(date).replaceAll("/", "-");
  const dayText = trade.day || new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  return { dateText, dayText };
}

function tradeActionButtons(trade) {
  return `
    <button class="action-btn" type="button" data-action="view" data-id="${escapeAttribute(trade.id)}">View</button>
    <button class="action-btn" type="button" data-action="edit" data-id="${escapeAttribute(trade.id)}">Edit</button>
    <button class="action-btn delete" type="button" data-action="delete" data-id="${escapeAttribute(trade.id)}">Delete</button>
  `;
}

function renderResearchTradeRows(filtered) {
  elements.researchRows.innerHTML = "";
  elements.researchMobileList.innerHTML = "";
  if (!filtered.length) {
    elements.researchRows.innerHTML = '<tr><td colspan="13" class="empty-table-cell">No trades match the current filters.</td></tr>';
    elements.researchMobileList.innerHTML = '<div class="empty-mobile-state">No trades match the current filters.</div>';
    return;
  }

  filtered.forEach((trade, index) => {
    const { dateText, dayText } = formatTradeDate(trade);
    const smt = getTradeField(trade, "hasSmt") === "Yes"
      ? getTradeField(trade, "smtStrength") || "Yes"
      : getTradeField(trade, "hasSmt") || "—";
    const support = getComparableValues(getTradeField(trade, "poiSupportType")).join(", ") || getTradeField(trade, "poiSupported") || "—";
    const entryLevel = getTradeField(trade, "entryLevel") || "—";
    const pnl = Number(trade.pnl || 0);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="date-cell">${escapeHtml(dateText)}<small>${escapeHtml(dayText)}</small></td>
      <td><strong>${escapeHtml(trade.pair || "—")}</strong></td>
      <td><span class="pill ${trade.direction === "Long" ? "pill-long" : "pill-short"}">${escapeHtml(trade.direction || "—")}</span></td>
      <td><span class="pill pill-status">${escapeHtml(trade.status || "—")}</span></td>
      <td>${escapeHtml(trade.entryAttempt || "—")}</td>
      <td>${escapeHtml(smt)}</td>
      <td class="wrap-cell">${escapeHtml(support)}</td>
      <td class="wrap-cell">${escapeHtml(entryLevel)}</td>
      <td><span class="pill ${resultClass(trade.result)}">${escapeHtml(trade.result || "—")}</span></td>
      <td>${Number(trade.rr || 0).toFixed(2)}R</td>
      <td class="pnl-cell ${pnl < 0 ? "negative" : pnl > 0 ? "positive" : ""}">${escapeHtml(formatCurrency(pnl))}</td>
      <td><div class="actions-cell">${tradeActionButtons(trade)}</div></td>
    `;
    elements.researchRows.appendChild(row);

    const card = document.createElement("article");
    card.className = "mobile-trade-card";
    card.innerHTML = `
      <div class="mobile-trade-head">
        <div><strong>${escapeHtml(trade.pair || "—")}</strong><span>${escapeHtml(dateText)} · ${escapeHtml(dayText)}</span></div>
        <span class="pill ${resultClass(trade.result)}">${escapeHtml(trade.result || "—")}</span>
      </div>
      <div class="mobile-trade-metrics">
        <span><small>Direction</small>${escapeHtml(trade.direction || "—")}</span>
        <span><small>Entry</small>${escapeHtml(entryLevel)}</span>
        <span><small>RR</small>${Number(trade.rr || 0).toFixed(2)}R</span>
        <span><small>P/L</small><b class="${pnl < 0 ? "negative" : pnl > 0 ? "positive" : ""}">${escapeHtml(formatCurrency(pnl))}</b></span>
      </div>
      <div class="mobile-trade-tags"><span>${escapeHtml(smt)}</span><span>${escapeHtml(support)}</span></div>
      <div class="actions-cell">${tradeActionButtons(trade)}</div>
    `;
    elements.researchMobileList.appendChild(card);
  });
}

function showPage(view) {
  const showResearch = view === "research";
  elements.dashboardView.hidden = showResearch;
  elements.researchView.hidden = !showResearch;
  if (showResearch) {
    populateFilterOptions();
    renderResearchView();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearResearchFilters() {
  elements.filterSearch.value = "";
  elements.filterDateFrom.value = "";
  elements.filterDateTo.value = "";
  elements.filterSort.value = "newest";
  document.querySelectorAll("select[data-filter-key]").forEach((select) => { select.value = ""; });
  renderResearchView();
}

function detailItem(label, value) {
  const values = getComparableValues(value);
  const display = values.length ? values.join(", ") : "Not recorded";
  return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`;
}

function chartLinksMarkup(title, analysis) {
  const links = (analysis?.chartLinks || []).filter((item) => item.url);
  if (!links.length && !analysis?.uploadedImage?.dataUrl) return "";
  const linkMarkup = links.map((item) => {
    const safeUrl = /^https?:\/\//i.test(item.url) ? item.url : "";
    return safeUrl ? `<a href="${escapeAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label || "Open chart")}</a>` : "";
  }).join("");
  const imageMarkup = analysis?.uploadedImage?.dataUrl
    ? `<button class="detail-chart-preview" type="button" data-preview-image="${escapeAttribute(analysis.uploadedImage.dataUrl)}">Preview uploaded screenshot</button>`
    : "";
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><div class="detail-link-list">${linkMarkup}${imageMarkup}</div></section>`;
}

function openTradeDetail(trade) {
  const { dateText, dayText } = formatTradeDate(trade);
  elements.tradeDetailTitle.textContent = `${trade.pair || "Trade"} · ${dateText}`;
  elements.tradeDetailContent.innerHTML = `
    <section class="detail-section">
      <h3>Basic Information</h3>
      <div class="detail-grid">
        ${detailItem("Date", `${dateText} · ${dayText}`)}
        ${detailItem("Pair", trade.pair)}
        ${detailItem("Direction", trade.direction)}
        ${detailItem("Session", trade.session)}
        ${detailItem("HTF / LTF", `${trade.htf || "—"} / ${trade.ltf || "—"}`)}
        ${detailItem("Status", trade.status)}
        ${detailItem("Entry Attempt", trade.entryAttempt)}
        ${detailItem("FVG Status", trade.fvgStatus)}
        ${detailItem("FVG Formed", trade.fvgFormed)}
      </div>
    </section>
    <section class="detail-section">
      <h3>HTF Analysis</h3>
      <div class="detail-grid">
        ${detailItem("SMT", getTradeField(trade, "hasSmt"))}
        ${detailItem("SMT Strength", getTradeField(trade, "smtStrength"))}
        ${detailItem("SMT Pair", getTradeField(trade, "smtPair"))}
        ${detailItem("POI Supported", getTradeField(trade, "poiSupported"))}
        ${detailItem("POI Support", getTradeField(trade, "poiSupportType"))}
        ${detailItem("Third Candle", getTradeField(trade, "thirdCandle"))}
        ${detailItem("Mitigation Behaviour", getTradeField(trade, "poiMitigation"))}
      </div>
    </section>
    <section class="detail-section">
      <h3>LTF Execution</h3>
      <div class="detail-grid">
        ${detailItem("Entry Level", getTradeField(trade, "entryLevel"))}
        ${detailItem("SL Pips", trade.slPips ?? trade.ltfAnalysis?.slPips)}
        ${detailItem("BE Logic", getTradeField(trade, "beLogic"))}
        ${detailItem("Outcome", trade.result)}
        ${detailItem("Risk", formatCurrency(trade.riskAmount || 0))}
        ${detailItem("RR", `${Number(trade.rr || 0).toFixed(2)}R`)}
        ${detailItem("P/L", formatCurrency(trade.pnl || 0))}
      </div>
    </section>
    ${chartLinksMarkup("HTF Chart References", trade.htfAnalysis)}
    ${chartLinksMarkup("LTF Chart References", trade.ltfAnalysis)}
  `;
  elements.tradeDetailModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeTradeDetail() {
  elements.tradeDetailModal.hidden = true;
  if (elements.modal.hidden) document.body.classList.remove("modal-open");
}

function editTrade(trade) {
  const basic = {
    date: trade.date || "",
    day: trade.day || "",
    pair: trade.pair || "EURUSD",
    direction: trade.direction || "Long",
    session: trade.session || "London",
    htf: trade.htf || DEFAULT_HTF,
    ltf: trade.ltf || DEFAULT_LTF,
    status: trade.status || "Took Trade",
    entryAttempt: trade.entryAttempt || "1st Entry",
    fvgStatus: trade.fvgStatus || "Fresh FVG",
    fvgFormed: trade.fvgFormed || "Today"
  };
  currentDraft = normaliseDraft({
    id: trade.id,
    appNamespace: APP_NAMESPACE,
    createdAt: trade.createdAt || new Date().toISOString(),
    lastStep: "basic",
    basic,
    htf: structuredClone(trade.htfAnalysis || {}),
    ltf: structuredClone(trade.ltfAnalysis || {})
  });
  saveDraft();
  openModal();
}

function renderTrades() {
  elements.rows.innerHTML = "";
  const weeklyTrades = trades.filter((trade) => isDateInCurrentWeek(trade.date));

  if (!weeklyTrades.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="10" class="muted">No Evergreen trades this week. Click “Add Trade” to begin.</td>';
    elements.rows.appendChild(row);
    updateStats(weeklyTrades);
    populateFilterOptions();
    renderResearchView();
    return;
  }

  weeklyTrades.forEach((trade, index) => {
    const date = new Date(`${trade.date}T12:00:00`);
    const dateText = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date).replaceAll("/", "-");
    const dayText = trade.day || new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="date-cell">${dateText}<small>${escapeHtml(dayText)}</small></td>
      <td>${escapeHtml(trade.pair)}</td>
      <td><span class="pill ${trade.direction === "Long" ? "pill-long" : "pill-short"}">${escapeHtml(trade.direction)}</span></td>
      <td><span class="pill pill-status">${escapeHtml(trade.status)}</span></td>
      <td><span class="pill pill-entry">${escapeHtml(String(trade.entryAttempt || "").replace(" Entry", ""))}</span></td>
      <td>${escapeHtml(trade.fvgStatus)}</td>
      <td>${escapeHtml(trade.fvgFormed)}</td>
      <td><span class="pill ${resultClass(trade.result)}">${escapeHtml(trade.result || "—")}</span></td>
      <td class="actions-cell">
        <button class="action-btn" type="button" data-action="view" data-id="${trade.id}">View</button>
        <button class="action-btn" type="button" data-action="edit" data-id="${trade.id}">Edit</button>
        <button class="action-btn delete" type="button" data-action="delete" data-id="${trade.id}">Delete</button>
      </td>
    `;
    elements.rows.appendChild(row);
  });

  updateStats(weeklyTrades);
  populateFilterOptions();
  renderResearchView();
}

function isDateInCurrentWeek(dateString) {
  if (!dateString) return false;
  const target = new Date(`${dateString}T12:00:00`);
  const { monday, sunday } = getCurrentWeekRange();
  return target >= monday && target <= sunday;
}

function getCurrentWeekRange() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function updateStats(weeklyTrades = trades.filter((trade) => isDateInCurrentWeek(trade.date))) {
  const counted = weeklyTrades.filter((trade) => trade.status === "Took Trade");
  const wins = counted.filter((trade) => trade.result === "TP").length;
  const pnl = counted.reduce((total, trade) => total + Number(trade.pnl || 0), 0);
  const rrTrades = counted.filter((trade) => Number.isFinite(Number(trade.rr)) && Number(trade.rr) > 0);
  const avgRr = rrTrades.length
    ? rrTrades.reduce((total, trade) => total + Number(trade.rr), 0) / rrTrades.length
    : 0;

  elements.weekPnl.textContent = formatCurrency(pnl);
  elements.weekWinRate.textContent = counted.length ? `${((wins / counted.length) * 100).toFixed(1)}%` : "0.0%";
  elements.weekTrades.textContent = String(counted.length);
  elements.weekAvgRr.textContent = `${avgRr.toFixed(2)}R`;
}

function updateWeekRange() {
  const { monday, sunday } = getCurrentWeekRange();
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const range = sameMonth
    ? `${monthFormatter.format(monday)} ${monday.getDate()} – ${sunday.getDate()}, ${sunday.getFullYear()}`
    : `${monthFormatter.format(monday)} ${monday.getDate()} – ${monthFormatter.format(sunday)} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  elements.weekRange.textContent = `${range} · Monday to Sunday`;
}

function resultClass(result) {
  if (result === "TP") return "pill-tp";
  if (result === "SL") return "pill-sl";
  return "pill-be";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => elements.toast.classList.remove("show"), 3400);
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = {
    app: "Evergreen Trade Journal",
    namespace: APP_NAMESPACE,
    exportedAt: new Date().toISOString(),
    trades,
    optionLibrary
  };
  downloadFile(
    `evergreen-trade-journal-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
  showToast("Evergreen JSON backup downloaded.");
}

function exportCsv() {
  const headers = [
    "date", "pair", "direction", "status", "entryAttempt", "fvgStatus", "fvgFormed",
    "hasSmt", "smtStrength", "smtPair", "poiSupported", "poiSupportType", "thirdCandle",
    "poiMitigation", "entryLevel", "slPips", "beLogic", "result", "riskAmount", "rr", "pnl"
  ];
  const rows = trades.map((trade) => {
    const flat = {
      ...trade,
      hasSmt: trade.htfAnalysis?.hasSmt,
      smtStrength: trade.htfAnalysis?.smtStrength,
      smtPair: trade.htfAnalysis?.smtPair,
      poiSupported: trade.htfAnalysis?.poiSupported,
      poiSupportType: trade.htfAnalysis?.poiSupportType?.join(" | "),
      thirdCandle: trade.htfAnalysis?.thirdCandle,
      poiMitigation: trade.htfAnalysis?.poiMitigation?.join(" | "),
      entryLevel: trade.ltfAnalysis?.entryLevel,
      beLogic: trade.ltfAnalysis?.beLogic
    };
    return headers.map((key) => csvCell(flat[key])).join(",");
  });
  downloadFile(
    `evergreen-trades-${new Date().toISOString().slice(0, 10)}.csv`,
    [headers.join(","), ...rows].join("\n"),
    "text/csv;charset=utf-8"
  );
  showToast("Evergreen CSV exported.");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (parsed.namespace && parsed.namespace !== APP_NAMESPACE) {
        throw new Error("This backup belongs to a different journal namespace.");
      }
      const importedTrades = Array.isArray(parsed) ? parsed : parsed.trades;
      if (!Array.isArray(importedTrades)) {
        throw new Error("No trades array found in this file.");
      }
      trades = importedTrades;
      if (parsed.optionLibrary) {
        optionLibrary = {
          poiMitigation: uniqueValues([...DEFAULT_OPTIONS.poiMitigation, ...(parsed.optionLibrary.poiMitigation || [])]),
          entryLevel: uniqueValues([...DEFAULT_OPTIONS.entryLevel, ...(parsed.optionLibrary.entryLevel || [])])
        };
        saveOptionLibrary();
      }
      saveTrades();
      renderTrades();
      showToast(`Imported ${trades.length} Evergreen trades.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Import failed.");
    } finally {
      elements.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function handleRowAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const trade = trades.find((item) => item.id === button.dataset.id);
  if (!trade) return;

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete the ${trade.pair} Evergreen trade from ${trade.date}?`);
    if (!confirmed) return;
    trades = trades.filter((item) => item.id !== trade.id);
    saveTrades();
    renderTrades();
    showToast("Trade deleted from the Evergreen journal only.");
    return;
  }

  if (button.dataset.action === "view") {
    openTradeDetail(trade);
    return;
  }

  if (button.dataset.action === "edit") {
    editTrade(trade);
  }
}

function bindEvents() {
  elements.addTradeBtn.addEventListener("click", openModal);
  elements.addTradeResearchBtn.addEventListener("click", openModal);
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.clearFormBtn.addEventListener("click", clearAllTradeForms);
  elements.date.addEventListener("change", updateDay);
  elements.htf.addEventListener("change", updateLtf);
  elements.pair.addEventListener("change", updateSmtPair);
  elements.basicForm.addEventListener("submit", handleBasicSubmit);
  elements.htfForm.addEventListener("submit", handleHtfSubmit);
  elements.ltfForm.addEventListener("submit", handleLtfSubmit);
  elements.backToBasicBtn.addEventListener("click", () => {
    captureHtfForm();
    showStep("basic");
  });
  elements.backToHtfBtn.addEventListener("click", () => {
    captureLtfForm();
    showStep("htf");
  });

  elements.stepTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step-target]");
    if (!button || button.disabled) return;
    captureVisibleStep();
    showStep(button.dataset.stepTarget);
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('.choice-card input[type="radio"], .choice-card input[type="checkbox"]')) {
      syncChoiceCards();
      updateConditionalPanels();
      updateCalculatedPnl();
      captureVisibleStep();
      saveDraft();
    }
  });

  elements.riskAmount.addEventListener("input", updateCalculatedPnl);
  elements.riskReward.addEventListener("input", updateCalculatedPnl);
  elements.addPoiMitigationOptionBtn.addEventListener("click", () => addCustomOption("poiMitigation"));
  elements.addEntryLevelOptionBtn.addEventListener("click", () => addCustomOption("entryLevel"));

  bindChartUi("htf");
  bindChartUi("ltf");

  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });

  elements.closeImagePreviewBtn.addEventListener("click", closeImagePreview);
  elements.previewImage.addEventListener("load", () => {
    elements.previewImage.hidden = false;
    setPreviewStatus("");
  });
  elements.previewImage.addEventListener("error", () => {
    elements.previewImage.hidden = true;
    setPreviewStatus("The preview image could not be loaded. Check that you copied a public TradingView snapshot link, not the normal chart-page URL.", true);
  });
  elements.imagePreviewModal.addEventListener("click", (event) => {
    if (event.target === elements.imagePreviewModal) closeImagePreview();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.imagePreviewModal.hidden) closeImagePreview();
    else if (!elements.tradeDetailModal.hidden) closeTradeDetail();
    else if (!elements.modal.hidden) closeModal();
  });

  elements.rows.addEventListener("click", handleRowAction);
  elements.researchRows.addEventListener("click", handleRowAction);
  elements.researchMobileList.addEventListener("click", handleRowAction);
  elements.backupBtn.addEventListener("click", exportJson);
  elements.exportBtn.addEventListener("click", exportCsv);
  elements.importBtn.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const [file] = elements.importFile.files;
    if (file) importJsonFile(file);
  });

  elements.connectBtn.addEventListener("click", () => {
    showToast("Supabase is intentionally not connected yet. Use the Evergreen-only tables in supabase-schema.sql.");
  });

  elements.viewAllBtn.addEventListener("click", () => showPage("research"));
  elements.backToDashboardBtn.addEventListener("click", () => showPage("dashboard"));
  elements.clearFiltersBtn.addEventListener("click", clearResearchFilters);
  elements.filterGrid.addEventListener("input", renderResearchView);
  elements.filterGrid.addEventListener("change", renderResearchView);

  elements.closeTradeDetailBtn.addEventListener("click", closeTradeDetail);
  elements.tradeDetailModal.addEventListener("click", (event) => {
    if (event.target === elements.tradeDetailModal) closeTradeDetail();
  });
  elements.tradeDetailContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preview-image]");
    if (!button) return;
    openImagePreview(button.dataset.previewImage);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  elements.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showToast("Install is available after the app is served through localhost or GitHub Pages.");
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
}

setDefaultDate();
updateLtf();
updateSmtPair();
renderDynamicOptions();
renderAllChartLinks();
updateChartPreviews();
updateConditionalPanels();
updateCalculatedPnl();
updateWeekRange();
syncChoiceCards();
renderTrades();
bindEvents();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  });
}
