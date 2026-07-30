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
  options: `${APP_NAMESPACE}:custom_options`,
  authEmail: `${APP_NAMESPACE}:auth_email`,
  syncedIdsPrefix: `${APP_NAMESPACE}:cloud_synced_ids`
};

const DEFAULT_OPTIONS = {
  dayBiasFactor: [
    "Sweep CHOCH",
    "OB Mitigation",
    "FVG Mitigation",
    "Counter FVG Mitigation",
    "Doji"
  ],
  poiMitigation: [
    "Aggressive Retracement",
    "Next Candle Trigger",
    "Coming After Creating a Counter FVG",
    "Trigger Candle Is the Counter FVG Created Candle"
  ],
  htfPoiBackedBy: ["SC OB", "FVG", "IFVG", "Breaker Block", "Liq Sweep", "Previous Day High / Low Sweep"],
  tradeComments: [
    "Good Trade",
    "Took ERL Without Triggering the Adjusted RR",
    "Went to the ERL but not our RR"
  ]
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

const INSTRUMENT_VISUALS = {
  EURUSD: { name: "Euro / U.S. Dollar", icon: "icons/instruments/eurusd.svg" },
  GBPUSD: { name: "British Pound / U.S. Dollar", icon: "icons/instruments/gbpusd.svg" },
  XAUUSD: { name: "Gold / U.S. Dollar", icon: "icons/instruments/xauusd.svg" },
  USDJPY: { name: "U.S. Dollar / Japanese Yen", icon: "icons/instruments/usdjpy.svg" },
  GBPJPY: { name: "British Pound / Japanese Yen", icon: "icons/instruments/gbpjpy.svg" },
  NAS100: { name: "Nasdaq 100 Index", icon: "icons/instruments/nas100.svg" }
};

const seedTrades = [
  {
    id: createId(), date: "2026-07-27", day: "Monday", pair: "GBPUSD", direction: "Long",
    session: "London", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Today", result: "SL", rr: 4, riskAmount: 100, pnl: -100, slPips: 5,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "GBPUSD vs EURUSD", thirdCandle: "Positive", poiMitigation: ["Aggressive Retracement"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "CISD", slPips: "5", beLogic: "BE Level", result: "SL", riskAmount: "100", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-27", day: "Monday", pair: "EURUSD", direction: "Long",
    session: "London", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "TP", rr: 6.5, riskAmount: 100, pnl: 650, slPips: 4.2,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "EURUSD vs GBPUSD", thirdCandle: "Negative", poiMitigation: ["Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BREAKER BLOCK", slPips: "4.2", beLogic: "Counter FVG Mitigation", result: "TP", riskAmount: "100", riskReward: "6.5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "XAUUSD", direction: "Short",
    session: "New York", htf: "30m", ltf: "5m", status: "Took Trade", entryAttempt: "2nd Entry",
    fvgStatus: "Partial FVG", fvgFormed: "Today", result: "BE", rr: 4, riskAmount: 75, pnl: 0, slPips: 18,
    htfAnalysis: { hasSmt: "No", smtStrength: "", smtPair: "XAUUSD (Gold) vs XAGUSD (Silver)", thirdCandle: "Negative", poiMitigation: ["Coming After Creating a Counter FVG"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "CISD", slPips: "18", beLogic: "ERL", result: "BE", riskAmount: "75", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "GBPUSD", direction: "Short",
    session: "New York", htf: "15m", ltf: "1m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "SL", rr: 4, riskAmount: 100, pnl: -100, slPips: 6.1,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "GBPUSD vs EURUSD", thirdCandle: "Positive", poiMitigation: ["Trigger Candle Is the Counter FVG Created Candle"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BREAKER BLOCK", slPips: "6.1", beLogic: "Counter FVG Mitigation", result: "SL", riskAmount: "100", riskReward: "4", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-28", day: "Tuesday", pair: "EURUSD", direction: "Short",
    session: "London", htf: "15m", ltf: "1m", status: "Missed Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Today", result: "TP", rr: 5, riskAmount: 100, pnl: 500, slPips: 3.8,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Strong SMT", smtPair: "EURUSD vs GBPUSD", thirdCandle: "Negative", poiMitigation: ["Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "CISD", slPips: "3.8", beLogic: "BE Level", result: "TP", riskAmount: "100", riskReward: "5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-18", day: "Saturday", pair: "NAS100", direction: "Long",
    session: "New York", htf: "1h", ltf: "5m", status: "Took Trade", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "TP", rr: 8, riskAmount: 125, pnl: 1000, slPips: 24,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "NAS100 vs SPX500", thirdCandle: "Positive", poiMitigation: ["Aggressive Retracement", "Next Candle Trigger"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BREAKER BLOCK", slPips: "24", beLogic: "ERL", result: "TP", riskAmount: "125", riskReward: "8", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-07-11", day: "Saturday", pair: "USDJPY", direction: "Long",
    session: "Asia", htf: "30m", ltf: "5m", status: "Took Trade", entryAttempt: "2nd Entry",
    fvgStatus: "Partial FVG", fvgFormed: "Today", result: "SL", rr: 3.5, riskAmount: 80, pnl: -80, slPips: 7.4,
    htfAnalysis: { hasSmt: "No", smtStrength: "", smtPair: "USDJPY vs EURJPY", thirdCandle: "Positive", poiMitigation: ["Coming After Creating a Counter FVG"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "CISD", slPips: "7.4", beLogic: "BE Level", result: "SL", riskAmount: "80", riskReward: "3.5", chartLinks: [] }
  },
  {
    id: createId(), date: "2026-06-29", day: "Monday", pair: "GBPJPY", direction: "Short",
    session: "London", htf: "1h", ltf: "5m", status: "Not Taken", entryAttempt: "1st Entry",
    fvgStatus: "Fresh FVG", fvgFormed: "Previous Day", result: "BE", rr: 4, riskAmount: 100, pnl: 0, slPips: 12.5,
    htfAnalysis: { hasSmt: "Yes", smtStrength: "Weak SMT", smtPair: "GBPJPY vs EURJPY", thirdCandle: "Negative", poiMitigation: ["Trigger Candle Is the Counter FVG Created Candle"], chartLinks: [] },
    ltfAnalysis: { entryLevel: "BREAKER BLOCK", slPips: "12.5", beLogic: "Counter FVG Mitigation", result: "BE", riskAmount: "100", riskReward: "4", chartLinks: [] }
  }
];

const elements = {
  modal: document.querySelector("#tradeModal"),
  modalPanel: document.querySelector("#tradeModalPanel"),
  modalEyebrow: document.querySelector("#modalEyebrow"),
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
  pairFieldIcon: document.querySelector("#pairFieldIcon"),
  htf: document.querySelector("#tradeHtf"),
  ltf: document.querySelector("#tradeLtf"),
  smtPairText: document.querySelector("#smtPairText"),
  smtDetails: document.querySelector("#smtDetails"),
  cleanHtfCisdDetails: document.querySelector("#cleanHtfCisdDetails"),
  dayBiasProsOptions: document.querySelector("#dayBiasProsOptions"),
  dayBiasConsOptions: document.querySelector("#dayBiasConsOptions"),
  dayBiasProsSummary: document.querySelector("#dayBiasProsSummary"),
  dayBiasConsSummary: document.querySelector("#dayBiasConsSummary"),
  dayBiasProsDropdown: document.querySelector("#dayBiasProsDropdown"),
  dayBiasConsDropdown: document.querySelector("#dayBiasConsDropdown"),
  poiMitigationOptions: document.querySelector("#poiMitigationOptions"),
  htfPoiBackedByOptions: document.querySelector("#htfPoiBackedByOptions"),
  tradeCommentOptions: document.querySelector("#tradeCommentOptions"),
  tradeCommentSummary: document.querySelector("#tradeCommentSummary"),
  tradeCommentDropdown: document.querySelector("#tradeCommentDropdown"),
  addDayBiasProsOptionBtn: document.querySelector("#addDayBiasProsOptionBtn"),
  addDayBiasConsOptionBtn: document.querySelector("#addDayBiasConsOptionBtn"),
  addPoiMitigationOptionBtn: document.querySelector("#addPoiMitigationOptionBtn"),
  addHtfPoiBackedByOptionBtn: document.querySelector("#addHtfPoiBackedByOptionBtn"),
  addTradeCommentOptionBtn: document.querySelector("#addTradeCommentOptionBtn"),
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
  weekWinningEdge: document.querySelector("#weekWinningEdge"),
  weekWinningEdgeNote: document.querySelector("#weekWinningEdgeNote"),
  weekWinningEdgeCard: document.querySelector("#weekWinningEdgeCard"),
  weekRange: document.querySelector("#weekRange"),
  toast: document.querySelector("#toast"),
  backupBtn: document.querySelector("#backupBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  installBtn: document.querySelector("#installBtn"),
  syncPanel: document.querySelector(".sync-panel"),
  syncProviderText: document.querySelector("#syncProviderText"),
  syncStateText: document.querySelector("#syncStateText"),
  syncUserText: document.querySelector("#syncUserText"),
  syncNoteText: document.querySelector("#syncNoteText"),
  syncNowBtn: document.querySelector("#syncNowBtn"),
  connectBtn: document.querySelector("#connectBtn"),
  authModal: document.querySelector("#authModal"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authMessage: document.querySelector("#authMessage"),
  sendMagicLinkBtn: document.querySelector("#sendMagicLinkBtn"),
  closeAuthModalBtn: document.querySelector("#closeAuthModalBtn"),
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
  filterSlPipsMin: document.querySelector("#filterSlPipsMin"),
  filterSlPipsMax: document.querySelector("#filterSlPipsMax"),
  filterDateFrom: document.querySelector("#filterDateFrom"),
  filterDateTo: document.querySelector("#filterDateTo"),
  filterSort: document.querySelector("#filterSort"),
  activeFilterCount: document.querySelector("#activeFilterCount"),
  clearFiltersBtn: document.querySelector("#clearFiltersBtn"),
  tradeDetailModal: document.querySelector("#tradeDetailModal"),
  closeTradeDetailBtn: document.querySelector("#closeTradeDetailBtn"),
  tradeDetailTitle: document.querySelector("#tradeDetailTitle"),
  tradeDetailContent: document.querySelector("#tradeDetailContent"),
  deleteConfirmModal: document.querySelector("#deleteConfirmModal"),
  deleteConfirmTitle: document.querySelector("#deleteConfirmTitle"),
  deleteConfirmMessage: document.querySelector("#deleteConfirmMessage"),
  deleteConfirmStatus: document.querySelector("#deleteConfirmStatus"),
  cancelDeleteBtn: document.querySelector("#cancelDeleteBtn"),
  confirmDeleteBtn: document.querySelector("#confirmDeleteBtn"),
  imagePreviewModal: document.querySelector("#imagePreviewModal"),
  previewImage: document.querySelector("#previewImage"),
  previewStatus: document.querySelector("#previewStatus"),
  previewOpenOriginal: document.querySelector("#previewOpenOriginal"),
  closeImagePreviewBtn: document.querySelector("#closeImagePreviewBtn")
};

const chartUi = {
  day: {
    list: document.querySelector("#dayChartLinks"),
    addButton: document.querySelector("#addDayLinkBtn"),
    uploadInput: null,
    dropZone: document.querySelector("#dayDropZone"),
    preview: document.querySelector("#dayDropPreview"),
    openActiveButton: document.querySelector("#openActiveDayPreviewBtn"),
    defaultLabel: "Day bias chart"
  },
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
let cloudSession = null;
let cloudUser = null;
let cloudInitialised = false;
let cloudBusy = false;
let loadedCloudUserId = null;
let pendingDeleteTradeId = null;

function syncedIdsKey(userId) {
  return `${STORAGE_KEYS.syncedIdsPrefix}:${userId}`;
}

function loadSyncedIds(userId = cloudUser?.id) {
  if (!userId) return new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(syncedIdsKey(userId)) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Unable to read Evergreen cloud sync markers:", error);
    return new Set();
  }
}

function saveSyncedIds(ids, userId = cloudUser?.id) {
  if (!userId) return;
  localStorage.setItem(syncedIdsKey(userId), JSON.stringify([...ids]));
}

function markTradeSynced(tradeId, userId = cloudUser?.id) {
  if (!userId || !tradeId) return;
  const ids = loadSyncedIds(userId);
  ids.add(tradeId);
  saveSyncedIds(ids, userId);
}

function unmarkTradeSynced(tradeId, userId = cloudUser?.id) {
  if (!userId || !tradeId) return;
  const ids = loadSyncedIds(userId);
  ids.delete(tradeId);
  saveSyncedIds(ids, userId);
}

function getLocalOnlyTrades(userId = cloudUser?.id) {
  if (!userId) return trades;
  const syncedIds = loadSyncedIds(userId);
  return trades.filter((trade) => {
    if (trade.cloudUserId && trade.cloudUserId !== userId) return false;
    return !syncedIds.has(trade.id) && trade.cloudUserId !== userId;
  });
}

function updateCloudUi(message = "") {
  const signedIn = Boolean(cloudUser);
  const localOnlyCount = signedIn ? getLocalOnlyTrades(cloudUser.id).length : trades.length;
  elements.syncPanel?.classList.toggle("is-connected", signedIn && !message);
  elements.syncPanel?.classList.toggle("is-error", Boolean(message));

  if (!window.EvergreenCloud?.isConfigured?.()) {
    elements.syncProviderText.textContent = "Supabase Not Configured";
    elements.syncStateText.textContent = "Add the project URL and publishable key.";
    elements.syncUserText.hidden = true;
    elements.syncNowBtn.hidden = true;
    elements.connectBtn.textContent = "Unavailable";
    elements.connectBtn.disabled = true;
    return;
  }

  elements.syncProviderText.textContent = signedIn ? "Supabase Connected" : "Supabase Configured";
  elements.connectBtn.disabled = cloudBusy;
  elements.syncNowBtn.disabled = cloudBusy;

  if (message) {
    elements.syncStateText.textContent = message;
  } else if (cloudBusy) {
    elements.syncStateText.textContent = "Syncing Evergreen data…";
  } else if (signedIn) {
    const cloudCount = trades.filter((trade) => trade.cloudUserId === cloudUser.id).length;
    elements.syncStateText.textContent = `${cloudCount} cloud trade${cloudCount === 1 ? "" : "s"} synced.`;
  } else if (cloudInitialised) {
    elements.syncStateText.textContent = "Sign in to sync across devices.";
  } else {
    elements.syncStateText.textContent = "Checking connection…";
  }

  elements.syncUserText.hidden = !signedIn;
  elements.syncUserText.textContent = signedIn ? `Signed in as ${cloudUser.email || "Supabase user"}` : "";
  elements.connectBtn.textContent = signedIn ? "Logout" : "Sign In";
  elements.syncNowBtn.hidden = !signedIn;
  elements.syncNowBtn.textContent = localOnlyCount > 0 ? `Sync Local Data (${localOnlyCount})` : "Sync Options / Refresh";
  elements.syncNoteText.textContent = signedIn
    ? (localOnlyCount > 0
      ? `${localOnlyCount} local trade${localOnlyCount === 1 ? " is" : "s are"} not in Supabase yet.`
      : "Evergreen cloud data is isolated from the old journal.")
    : "Evergreen uses a separate Supabase project, tables, and image bucket.";
}

function openAuthModal() {
  elements.authMessage.textContent = "";
  elements.authEmail.value = localStorage.getItem(STORAGE_KEYS.authEmail) || "";
  elements.authModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => elements.authEmail.focus(), 0);
}

function closeAuthModal() {
  elements.authModal.hidden = true;
  if (elements.modal.hidden && elements.tradeDetailModal.hidden && elements.imagePreviewModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function cloudOptionCategory(category) {
  const categories = {
    dayBiasFactor: "day_bias_factor",
    poiMitigation: "htf_poi_mitigation",
    htfPoiBackedBy: "htf_poi_backing",
    tradeComments: "ltf_trade_comment"
  };
  return categories[category] || category;
}

function replaceTradeInLocalList(trade) {
  const index = trades.findIndex((item) => item.id === trade.id);
  if (index >= 0) trades[index] = trade;
  else trades.unshift(trade);
  saveTrades();
  renderTrades();
}

async function loadCloudData() {
  if (!cloudUser || cloudBusy) return;
  cloudBusy = true;
  updateCloudUi();
  try {
    const [cloudTrades, cloudOptions] = await Promise.all([
      window.EvergreenCloud.loadTrades(),
      window.EvergreenCloud.loadOptions()
    ]);

    const syncedIds = loadSyncedIds(cloudUser.id);
    const cloudIds = new Set(cloudTrades.map((trade) => trade.id));
    const localOnly = trades.filter((trade) => {
      if (trade.cloudUserId && trade.cloudUserId !== cloudUser.id) return false;
      if (cloudIds.has(trade.id)) return false;
      if (syncedIds.has(trade.id)) return false;
      return true;
    });

    trades = [...cloudTrades, ...localOnly];
    cloudIds.forEach((id) => syncedIds.add(id));
    saveSyncedIds(syncedIds, cloudUser.id);

    const cloudDayBiasFactors = cloudOptions
      .filter((option) => ["day_bias_factor", "day_bias_setup"].includes(option.category))
      .map((option) => option.label);
    const cloudPoi = cloudOptions
      .filter((option) => option.category === "htf_poi_mitigation")
      .map((option) => option.label);
    const cloudPoiBacking = cloudOptions
      .filter((option) => option.category === "htf_poi_backing")
      .map((option) => option.label);
    const cloudTradeComments = cloudOptions
      .filter((option) => option.category === "ltf_trade_comment")
      .map((option) => option.label);
    optionLibrary = {
      dayBiasFactor: uniqueValues([
        ...DEFAULT_OPTIONS.dayBiasFactor,
        ...(optionLibrary.dayBiasFactor || []),
        ...cloudDayBiasFactors
      ]),
      poiMitigation: uniqueValues([...DEFAULT_OPTIONS.poiMitigation, ...optionLibrary.poiMitigation, ...cloudPoi]),
      htfPoiBackedBy: uniqueValues([...DEFAULT_OPTIONS.htfPoiBackedBy, ...(optionLibrary.htfPoiBackedBy || []), ...cloudPoiBacking]),
      tradeComments: uniqueValues([...DEFAULT_OPTIONS.tradeComments, ...optionLibrary.tradeComments, ...cloudTradeComments])
    };

    saveTrades();
    saveOptionLibrary();
    renderDynamicOptions();
    renderTrades();
    loadedCloudUserId = cloudUser.id;
    updateCloudUi();
  } catch (error) {
    console.error("Unable to load Evergreen cloud data:", error);
    updateCloudUi(`Cloud error: ${error.message || "Unable to load data."}`);
    showToast("Cloud connection failed. Run supabase-schema.sql and check Auth settings.");
  } finally {
    cloudBusy = false;
    updateCloudUi(elements.syncPanel?.classList.contains("is-error") ? elements.syncStateText.textContent : "");
  }
}

async function handleCloudAuthChange(session, event = "") {
  cloudSession = session;
  cloudUser = session?.user || null;
  cloudInitialised = true;

  if (!cloudUser) {
    loadedCloudUserId = null;
    updateCloudUi();
    return;
  }

  closeAuthModal();
  updateCloudUi();
  if (loadedCloudUserId !== cloudUser.id || ["SIGNED_IN", "INITIAL_SESSION", "TOKEN_REFRESHED"].includes(event)) {
    await loadCloudData();
  }
}

async function initialiseCloud() {
  updateCloudUi();
  if (!window.EvergreenCloud?.isConfigured?.()) {
    cloudInitialised = true;
    updateCloudUi();
    return;
  }

  try {
    const initialSession = await window.EvergreenCloud.init(handleCloudAuthChange);
    await handleCloudAuthChange(initialSession, "INITIAL_SESSION");
  } catch (error) {
    cloudInitialised = true;
    console.error("Supabase initialisation failed:", error);
    updateCloudUi(`Connection error: ${error.message || "Supabase could not start."}`);
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = elements.authEmail.value.trim();
  if (!email) return;
  elements.authMessage.textContent = "Sending secure sign-in link…";
  elements.sendMagicLinkBtn.disabled = true;
  localStorage.setItem(STORAGE_KEYS.authEmail, email);
  try {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    await window.EvergreenCloud.signInWithMagicLink(email, redirectTo);
    elements.authMessage.textContent = "Magic link sent. Check your inbox and open the link on this device.";
  } catch (error) {
    console.error("Magic-link sign-in failed:", error);
    elements.authMessage.textContent = error.message || "Unable to send the sign-in link.";
  } finally {
    elements.sendMagicLinkBtn.disabled = false;
  }
}

async function syncLocalDataToCloud() {
  if (!cloudUser || cloudBusy) return;
  const localOnly = getLocalOnlyTrades(cloudUser.id);
  if (localOnly.length) {
    const confirmed = window.confirm(
      `Upload ${localOnly.length} local trade${localOnly.length === 1 ? "" : "s"} to Evergreen Supabase? ` +
      "Every local trade currently shown will be uploaded, including any demo entries you have not deleted."
    );
    if (!confirmed) return;
  }

  cloudBusy = true;
  updateCloudUi();
  try {
    for (const localTrade of localOnly) {
      const syncedTrade = await window.EvergreenCloud.saveTrade(localTrade);
      replaceTradeInLocalList(syncedTrade);
      markTradeSynced(syncedTrade.id, cloudUser.id);
    }
    await window.EvergreenCloud.syncOptions(optionLibrary);
    showToast(localOnly.length
      ? `${localOnly.length} Evergreen trade${localOnly.length === 1 ? "" : "s"} synced to Supabase.`
      : "Evergreen custom options refreshed in Supabase.");
  } catch (error) {
    console.error("Local-to-cloud sync failed:", error);
    showToast(`Cloud sync stopped: ${error.message || "Unknown Supabase error."}`);
  } finally {
    cloudBusy = false;
    updateCloudUi();
  }
}

async function syncSavedTradeToCloud(trade) {
  if (!cloudUser) return null;
  try {
    const syncedTrade = await window.EvergreenCloud.saveTrade(trade);
    markTradeSynced(syncedTrade.id, cloudUser.id);
    replaceTradeInLocalList(syncedTrade);
    updateCloudUi();
    return syncedTrade;
  } catch (error) {
    console.error("Evergreen cloud trade save failed:", error);
    updateCloudUi();
    showToast(`Trade saved locally, but cloud sync failed: ${error.message || "Unknown error."}`);
    return null;
  }
}

function createEmptyDraft() {
  return {
    id: createId(),
    appNamespace: APP_NAMESPACE,
    createdAt: new Date().toISOString(),
    lastStep: "basic",
    basic: {},
    day: {
      chartLinks: [{ id: createId(), label: chartUi?.day?.defaultLabel || "Day bias chart", url: "" }],
      activePreview: null
    },
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
      riskAmount: DEFAULT_RISK_AMOUNT,
      tradeComments: []
    }
  };
}

function loadTrades() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.trades);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load Evergreen trades:", error);
    return [];
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
    day: {
      ...empty.day,
      ...(draft.day || {}),
      chartLinks: Array.isArray(draft.day?.chartLinks) && draft.day.chartLinks.length
        ? draft.day.chartLinks.map((link) => ({
          id: link.id || createId(),
          label: link.label || chartUi.day.defaultLabel,
          url: link.url || ""
        }))
        : empty.day.chartLinks
    },
    htf: {
      ...empty.htf,
      ...(draft.htf || {}),
      fvgFormed: draft.htf?.fvgFormed || draft.basic?.fvgFormed || "",
      dayBiasPros: Array.isArray(draft.htf?.dayBiasPros)
        ? uniqueValues(draft.htf.dayBiasPros)
        : (Array.isArray(draft.htf?.dayBiasSetup) ? uniqueValues(draft.htf.dayBiasSetup) : []),
      dayBiasCons: Array.isArray(draft.htf?.dayBiasCons)
        ? uniqueValues(draft.htf.dayBiasCons)
        : [],
      htfPoiBackedBy: Array.isArray(draft.htf?.htfPoiBackedBy)
        ? uniqueValues(draft.htf.htfPoiBackedBy)
        : [],
      chartLinks: Array.isArray(draft.htf?.chartLinks) && draft.htf.chartLinks.length
        ? draft.htf.chartLinks
        : empty.htf.chartLinks
    },
    ltf: {
      ...empty.ltf,
      ...(draft.ltf || {}),
      entryLevel: normaliseEntryLevel(draft.ltf?.entryLevel),
      tradeComments: Array.isArray(draft.ltf?.tradeComments)
        ? uniqueValues(draft.ltf.tradeComments)
        : [],
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
      dayBiasFactor: uniqueValues([
        ...DEFAULT_OPTIONS.dayBiasFactor,
        ...(stored.dayBiasFactor || []),
        ...(stored.dayBiasSetup || [])
      ]),
      poiMitigation: uniqueValues([...DEFAULT_OPTIONS.poiMitigation, ...(stored.poiMitigation || [])]),
      htfPoiBackedBy: uniqueValues([...DEFAULT_OPTIONS.htfPoiBackedBy, ...(stored.htfPoiBackedBy || [])]),
      tradeComments: uniqueValues([...DEFAULT_OPTIONS.tradeComments, ...(stored.tradeComments || [])])
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

function getCheckedValue(name, fallback = "Not selected") {
  return document.querySelector(`#tradeModal input[name="${CSS.escape(name)}"]:checked`)?.value || fallback;
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`#tradeModal input[name="${CSS.escape(name)}"]:checked`)]
    .map((input) => input.value)
    .filter(Boolean);
}

function setBlueprintText(field, value) {
  document.querySelectorAll(`[data-summary-field="${CSS.escape(field)}"]`).forEach((node) => {
    node.textContent = value;
  });
}

function updateInstrumentVisuals() {
  const pair = elements.pair.value || "EURUSD";
  const visual = INSTRUMENT_VISUALS[pair] || { name: pair, icon: "icons/instruments/default.svg" };

  if (elements.pairFieldIcon) {
    elements.pairFieldIcon.src = visual.icon;
    elements.pairFieldIcon.alt = `${pair} instrument logo`;
  }

  document.querySelectorAll("[data-summary-logo]").forEach((image) => {
    image.src = visual.icon;
    image.alt = `${pair} instrument logo`;
  });
  document.querySelectorAll("[data-summary-pair]").forEach((node) => {
    node.textContent = pair;
  });
  document.querySelectorAll("[data-summary-name]").forEach((node) => {
    node.textContent = visual.name;
  });
}

function updateTradeBlueprint() {
  updateInstrumentVisuals();

  const direction = document.querySelector("#tradeDirection")?.value || "Not selected";
  const htf = elements.htf.value || DEFAULT_HTF;
  const ltf = elements.ltf.value || DEFAULT_LTF;
  const dayBias = getCheckedValue("dayBias");
  const dayPros = getCheckedValues("dayBiasPros");
  const dayCons = getCheckedValues("dayBiasCons");
  const hasSmt = getCheckedValue("hasSmt");
  const smtStrength = getCheckedValue("smtStrength", "");
  const interaction = getCheckedValue("fvgInteraction");
  const poiZone = getCheckedValue("poiZone");
  const entries = getCheckedValues("entryLevel");
  const slPips = document.querySelector("#slPips")?.value?.trim() || "—";
  const beLogic = getCheckedValue("beLogic");
  const outcome = getCheckedValue("result", "Open");
  const pnl = elements.calculatedPnl?.textContent || "$0.00";

  setBlueprintText("direction", direction);
  setBlueprintText("timeframes", `${String(htf).toUpperCase()} → ${ltf}`);
  setBlueprintText("dayBias", dayBias);
  setBlueprintText("daySetups", `${dayPros.length} pro · ${dayCons.length} con`);
  setBlueprintText("smt", hasSmt === "Yes" && smtStrength ? smtStrength : hasSmt);
  setBlueprintText("interaction", interaction);
  setBlueprintText("poiZone", poiZone);
  setBlueprintText("entry", entries.length ? entries.join(" + ") : "Not selected");
  setBlueprintText("sl", slPips === "—" ? "—" : `${slPips} pips`);
  setBlueprintText("beLogic", beLogic);
  setBlueprintText("outcome", outcome === "Open" ? "Open" : `${outcome} · ${pnl}`);

  document.querySelectorAll(".trade-blueprint").forEach((panel) => {
    panel.dataset.direction = direction.toLowerCase();
    panel.dataset.outcome = outcome.toLowerCase();
  });
}

function openModal() {
  currentDraft = loadDraft() || createEmptyDraft();
  optionLibrary = loadOptionLibrary();
  renderDynamicOptions();
  restoreDraftIntoForms();
  renderAllChartLinks();
  updateChartPreviews();
  showStep(currentDraft.lastStep || "basic");
  updateTradeBlueprint();
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
  updateTradeBlueprint();
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
    basic: "BASIC AND DAY ANALYSIS",
    htf: "HTF ANALYSIS",
    ltf: "LTF ANALYSIS"
  };
  elements.modalEyebrow.textContent = titles[validStep];
  elements.modalPanel.classList.toggle("analysis-mode", validStep !== "basic");

  document.querySelectorAll(".step-tab").forEach((button) => {
    const target = button.dataset.stepTarget;
    button.classList.toggle("active", target === validStep);
    button.disabled = target === "htf"
      ? !Object.keys(currentDraft.basic || {}).length
      : target === "ltf"
        ? !["hasSmt", "thirdCandle", "fvgInteraction", "poiZone", "cleanHtfCisd", "poiMitigation"]
          .some((key) => getComparableValues(currentDraft.htf?.[key]).length)
        : false;
  });

  updateTradeBlueprint();
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
  const formData = new FormData(elements.basicForm);
  const data = Object.fromEntries(formData.entries());
  delete data.dayBias;
  delete data.dayBiasPros;
  delete data.dayBiasCons;
  currentDraft.basic = data;
  currentDraft.htf = {
    ...currentDraft.htf,
    dayBias: formData.get("dayBias") || "",
    dayBiasPros: formData.getAll("dayBiasPros"),
    dayBiasCons: formData.getAll("dayBiasCons")
  };
  return data;
}

function captureHtfForm() {
  const formData = new FormData(elements.htfForm);
  currentDraft.htf = {
    ...currentDraft.htf,
    hasSmt: formData.get("hasSmt") || "",
    smtStrength: formData.get("smtStrength") || "",
    smtPair: elements.smtPairText.textContent,
    fvgFormed: formData.get("fvgFormed") || "",
    thirdCandle: formData.get("thirdCandle") || "",
    fvgInteraction: formData.get("fvgInteraction") || "",
    poiZone: formData.get("poiZone") || "",
    cleanHtfCisd: formData.get("cleanHtfCisd") || "",
    htfCisdLocation: formData.get("htfCisdLocation") || "",
    poiMitigation: formData.getAll("poiMitigation"),
    htfPoiBackedBy: formData.getAll("htfPoiBackedBy")
  };
  return currentDraft.htf;
}

function normaliseEntryLevel(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => {
    const entry = String(item ?? "").trim();
    if (entry === "Spartan CISD") return "CISD";
    if (entry === "BB" || entry.toLowerCase() === "breaker block") return "BREAKER BLOCK";
    return entry;
  }).find((entry) => ["CISD", "BREAKER BLOCK", "PCL CISD"].includes(entry)) || "";
}

function applySweepEntryDefault() {
  if (currentDraft.htf?.fvgInteraction !== "Sweep") return;
  if (!currentDraft.ltf) currentDraft.ltf = {};
  currentDraft.ltf.entryLevel = "CISD";

  const cisdOption = elements.ltfForm.querySelector(
    'input[name="entryLevel"][value="CISD"]'
  );
  if (cisdOption) cisdOption.checked = true;
  syncChoiceCards();
}

function captureLtfForm() {
  const formData = new FormData(elements.ltfForm);
  currentDraft.ltf = {
    ...currentDraft.ltf,
    entryLevel: formData.get("entryLevel") || "",
    slPips: formData.get("slPips") || "",
    beLogic: formData.get("beLogic") || "",
    rrAdjusted: formData.get("rrAdjusted") || "",
    entryTrigger: formData.get("entryTrigger") || "",
    result: formData.get("result") || "",
    riskAmount: formData.get("riskAmount") || "",
    riskReward: formData.get("riskReward") || "",
    tradeComments: formData.getAll("tradeComments")
  };
  return currentDraft.ltf;
}

function restoreDraftIntoForms() {
  elements.basicForm.reset();
  elements.htfForm.reset();
  elements.ltfForm.reset();

  // Older journals may still contain the removed “Missed Trade” status.
  // Treat it as Not Taken when that trade is edited.
  if (currentDraft.basic?.status === "Missed Trade") {
    currentDraft.basic.status = "Not Taken";
  }

  setFormValues(elements.basicForm, currentDraft.basic);
  setFormValues(elements.basicForm, {
    dayBias: currentDraft.htf?.dayBias || "",
    dayBiasPros: currentDraft.htf?.dayBiasPros || currentDraft.htf?.dayBiasSetup || [],
    dayBiasCons: currentDraft.htf?.dayBiasCons || []
  });
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


  const cleanHtfCisd = elements.htfForm.querySelector('input[name="cleanHtfCisd"]:checked')?.value;
  elements.cleanHtfCisdDetails.hidden = cleanHtfCisd !== "Yes";
  if (cleanHtfCisd !== "Yes") {
    elements.htfForm.querySelectorAll('input[name="htfCisdLocation"]').forEach((input) => {
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

  saveDraft();
  showStep("ltf");
}

async function handleLtfSubmit(event) {
  event.preventDefault();
  elements.ltfMessage.textContent = "";
  captureLtfForm();

  if (!elements.ltfForm.checkValidity()) {
    elements.ltfMessage.textContent = "Correct the invalid numeric value before saving.";
    elements.ltfForm.reportValidity();
    return;
  }

  const riskAmount = optionalNumber(currentDraft.ltf.riskAmount);
  const riskReward = optionalNumber(currentDraft.ltf.riskReward);
  const slPips = optionalNumber(currentDraft.ltf.slPips);
  const pnl = calculatePnl(currentDraft.ltf.result, riskAmount ?? 0, riskReward ?? 0);
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
    fvgFormed: currentDraft.htf.fvgFormed,
    result: currentDraft.ltf.result,
    rr: riskReward,
    riskAmount,
    pnl: currentDraft.ltf.result ? pnl : null,
    slPips,
    htfAnalysis: {
      ...structuredClone(currentDraft.htf),
      dayChartLinks: structuredClone(currentDraft.day?.chartLinks || [])
    },
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

  if (cloudUser) {
    showToast("Trade saved locally. Syncing to Supabase…");
    const syncedTrade = await syncSavedTradeToCloud(trade);
    if (syncedTrade) showToast("Evergreen trade saved and synced to Supabase.");
  } else {
    showToast("Evergreen trade saved locally. Sign in to enable cloud sync.");
  }
}

function closeModalWithoutSavingDraft() {
  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");
  currentStep = "basic";
}

function optionalNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
    container: elements.dayBiasProsOptions,
    values: optionLibrary.dayBiasFactor,
    name: "dayBiasPros",
    type: "checkbox",
    selected: currentDraft.htf?.dayBiasPros || currentDraft.htf?.dayBiasSetup || []
  });
  renderOptionCards({
    container: elements.dayBiasConsOptions,
    values: optionLibrary.dayBiasFactor,
    name: "dayBiasCons",
    type: "checkbox",
    selected: currentDraft.htf?.dayBiasCons || []
  });
  renderOptionCards({
    container: elements.poiMitigationOptions,
    values: optionLibrary.poiMitigation,
    name: "poiMitigation",
    type: "checkbox",
    selected: currentDraft.htf?.poiMitigation || []
  });
  renderOptionCards({
    container: elements.htfPoiBackedByOptions,
    values: optionLibrary.htfPoiBackedBy,
    name: "htfPoiBackedBy",
    type: "checkbox",
    selected: currentDraft.htf?.htfPoiBackedBy || []
  });
  renderOptionCards({
    container: elements.tradeCommentOptions,
    values: optionLibrary.tradeComments,
    name: "tradeComments",
    type: "checkbox",
    selected: Array.isArray(currentDraft.ltf?.tradeComments) ? currentDraft.ltf.tradeComments : []
  });
  syncChoiceCards();
  updateTradeCommentSummary();
  updateDayBiasFactorSummaries();
}

function renderOptionCards({ container, values, name, type, selected }) {
  if (!container) return;
  container.innerHTML = "";
  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = `choice-card ${type === "checkbox" ? "checkbox-card" : ""}`;
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.value = value;
    input.checked = selected.includes(value);
    const strong = document.createElement("strong");
    strong.textContent = value;
    label.append(input, strong);
    container.appendChild(label);
  });
}

function updateTradeCommentSummary() {
  if (!elements.tradeCommentSummary) return;
  const selected = getCheckedValues("tradeComments");
  if (!selected.length) {
    elements.tradeCommentSummary.textContent = "Select trade comments";
    return;
  }
  elements.tradeCommentSummary.textContent = selected.length === 1
    ? selected[0]
    : `${selected.length} comments selected`;
}

function updateDayBiasFactorSummaries() {
  const update = (name, element, emptyLabel) => {
    if (!element) return;
    const selected = getCheckedValues(name);
    element.textContent = selected.length ? `${emptyLabel}: ${selected.join(", ")}` : `Select ${emptyLabel}`;
    element.title = selected.join(", ");
  };
  update("dayBiasPros", elements.dayBiasProsSummary, "Pros");
  update("dayBiasCons", elements.dayBiasConsSummary, "Cons");
}

async function addCustomOption(category, selectionTarget = "") {
  const promptLabels = {
    dayBiasFactor: "Enter a new Day bias Pro / Con option:",
    poiMitigation: "Enter a new POI mitigation behaviour:",
    htfPoiBackedBy: "Enter a new POI backing option:",
    tradeComments: "Enter a new trade comment:"
  };
  const promptLabel = promptLabels[category] || "Enter a new option:";
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
  if (category === "dayBiasFactor") {
    const targetKey = selectionTarget === "dayBiasCons" ? "dayBiasCons" : "dayBiasPros";
    currentDraft.htf[targetKey] = uniqueValues([...(currentDraft.htf[targetKey] || []), value]);
  } else if (category === "poiMitigation") {
    currentDraft.htf.poiMitigation = uniqueValues([...(currentDraft.htf.poiMitigation || []), value]);
  } else if (category === "htfPoiBackedBy") {
    currentDraft.htf.htfPoiBackedBy = uniqueValues([...(currentDraft.htf.htfPoiBackedBy || []), value]);
  } else if (category === "tradeComments") {
    currentDraft.ltf.tradeComments = uniqueValues([
      ...(currentDraft.ltf.tradeComments || []),
      value
    ]);
  }
  renderDynamicOptions();
  saveDraft();

  if (cloudUser) {
    try {
      await window.EvergreenCloud.saveOption(cloudOptionCategory(category), value);
      showToast("Option saved locally and to Evergreen Supabase.");
    } catch (error) {
      console.error("Custom option cloud save failed:", error);
      showToast("Option saved locally, but Supabase sync failed.");
    }
  } else {
    showToast("Option saved locally. Sign in to sync it across devices.");
  }
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
  renderChartLinks("day");
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
  if (field.dataset.linkField === "url") {
    const preview = activateChartLinkPreview(type, link);
    card.classList.toggle("active", preview);
    if (preview) {
      card.parentElement?.querySelectorAll(".chart-link-card.active").forEach((item) => {
        if (item !== card) item.classList.remove("active");
      });
    }
  } else if (currentDraft[type].activePreview?.linkId === link.id) {
    currentDraft[type].activePreview.label = link.label || `${type.toUpperCase()} chart`;
    updateChartPreview(type);
  }
  saveDraft();
}

function activateChartLinkPreview(type, link) {
  const url = String(link?.url || "").trim();
  if (!url || !isSafeHttpUrl(url)) {
    if (currentDraft[type].activePreview?.linkId === link?.id) {
      currentDraft[type].activePreview = null;
      updateChartPreview(type);
    }
    setChartPreviewHint(type, "");
    return false;
  }

  const preview = resolveImagePreview(url);
  if (!preview.src || preview.message) {
    if (currentDraft[type].activePreview) {
      currentDraft[type].activePreview = null;
      updateChartPreview(type);
    }
    setChartPreviewHint(type, preview.message || "Preview is unavailable for this link.");
    return false;
  }

  setChartPreviewHint(type, "");
  currentDraft[type].activePreview = {
    src: preview.src,
    originalSrc: url,
    linkId: link.id,
    label: link.label || `${type.toUpperCase()} chart`
  };
  updateChartPreview(type);
  return true;
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
    if (!activateChartLinkPreview(type, link)) {
      const preview = resolveImagePreview(link.url);
      showToast(preview.message || "Preview is unavailable for this link.");
      return;
    }
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

    const isTradingView = host === "tradingview.com" || host.endsWith(".tradingview.com");

    if (isTradingView && snapshotMatch) {
      const snapshotId = snapshotMatch[1];
      return {
        src: `https://s3.tradingview.com/snapshots/${snapshotId.charAt(0).toLowerCase()}/${snapshotId}.png`,
        message: ""
      };
    }

    if (isTradingView && !snapshotMatch) {
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

function setChartPreviewHint(type, message) {
  const hint = chartUi[type]?.dropZone?.querySelector("p");
  if (!hint) return;
  if (!hint.dataset.defaultText) hint.dataset.defaultText = hint.textContent.trim();
  hint.textContent = message || hint.dataset.defaultText;
  hint.classList.toggle("preview-error", Boolean(message));
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
  if (ui.uploadInput) {
    ui.uploadInput.addEventListener("change", () => {
      const [file] = ui.uploadInput.files;
      if (file) handleChartImage(type, file);
      ui.uploadInput.value = "";
    });
  }

  ui.dropZone.tabIndex = 0;
  ui.dropZone.addEventListener("click", () => {
    const active = getActiveChartPreview(type);
    if (active?.src) openImagePreview(active.src, active.originalSrc || active.src);
    else if (ui.uploadInput) ui.uploadInput.click();
    else showToast("Paste a Day chart snapshot link below, then click Preview.");
  });
  ui.openActiveButton.addEventListener("click", () => {
    const active = getActiveChartPreview(type);
    if (active?.src) openImagePreview(active.src, active.originalSrc || active.src);
  });
  ui.preview.addEventListener("load", () => {
    setChartPreviewHint(type, "");
    ui.preview.hidden = false;
    ui.dropZone.classList.add("has-preview");
    ui.openActiveButton.hidden = false;
  });
  ui.preview.addEventListener("error", () => {
    ui.preview.hidden = true;
    ui.dropZone.classList.remove("has-preview");
    ui.openActiveButton.hidden = true;
    setChartPreviewHint(type, "That chart image could not be loaded. Confirm the TradingView snapshot is public and try again.");
    showToast("That chart image could not be loaded. Check the TradingView snapshot link and your internet connection.");
  });
  if (ui.uploadInput) {
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
  }
  ui.dropZone.addEventListener("paste", (event) => handleChartPaste(type, event));
}

function handleChartPaste(type, event) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (imageItem) {
    if (!chartUi[type].uploadInput) {
      showToast("Use a TradingView snapshot link for the Day chart preview.");
      return;
    }
    const file = imageItem.getAsFile();
    if (file) handleChartImage(type, file);
    return;
  }
  const text = event.clipboardData?.getData("text/plain")?.trim();
  if (text && isSafeHttpUrl(text)) {
    const empty = currentDraft[type].chartLinks.find((link) => !link.url);
    if (empty) {
      empty.url = text;
      activateChartLinkPreview(type, empty);
    } else {
      const link = { id: createId(), label: `${type.toUpperCase()} chart`, url: text };
      currentDraft[type].chartLinks.push(link);
      activateChartLinkPreview(type, link);
    }
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
  updateChartPreview("day");
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
  "fvgFormed", "dayBias", "dayBiasPros", "dayBiasCons", "hasSmt", "smtStrength", "thirdCandle", "fvgInteraction",
  "poiZone", "cleanHtfCisd", "htfCisdLocation", "poiMitigation", "htfPoiBackedBy", "entryLevel", "beLogic", "rrAdjusted", "entryTrigger", "tradeComments"
];

const INSIGHT_LABELS = {
  pair: "Pair",
  direction: "Direction",
  entryAttempt: "Entry attempt",
  session: "Session",
  fvgStatus: "FVG status",
  fvgFormed: "FVG formed",
  dayBias: "Day bias",
  dayBiasPros: "Day bias Pro",
  dayBiasCons: "Day bias Con",
  hasSmt: "SMT",
  smtStrength: "SMT strength",
  thirdCandle: "Third candle",
  fvgInteraction: "FVG interaction",
  poiZone: "POI premium / discount",
  cleanHtfCisd: "Clean HTF CISD",
  htfCisdLocation: "HTF CISD location",
  poiMitigation: "Mitigation behaviour",
  htfPoiBackedBy: "HTF POI backing",
  entryLevel: "Entry level",
  beLogic: "BE logic",
  rrAdjusted: "Entry adjusted for RR",
  entryTrigger: "Entry trigger",
  tradeComments: "Trade comments"
};

const WEEKLY_WINNING_EDGE_KEYS = [
  "dayBias",
  "dayBiasPros",
  "dayBiasCons",
  "hasSmt",
  "smtStrength",
  "cleanHtfCisd",
  "htfCisdLocation",
  "fvgFormed",
  "thirdCandle",
  "fvgInteraction",
  "poiZone",
  "htfPoiBackedBy",
  "poiMitigation",
  "entryLevel",
  "entryTrigger",
];

function getTradeField(trade, key) {
  const nested = {
    entryAttempt: trade.entryAttempt,
    fvgFormed: trade.htfAnalysis?.fvgFormed || trade.fvgFormed,
    dayBias: trade.htfAnalysis?.dayBias,
    dayBiasPros: trade.htfAnalysis?.dayBiasPros || trade.htfAnalysis?.dayBiasSetup,
    dayBiasCons: trade.htfAnalysis?.dayBiasCons,
    hasSmt: trade.htfAnalysis?.hasSmt,
    smtStrength: trade.htfAnalysis?.smtStrength,
    smtPair: trade.htfAnalysis?.smtPair,
    thirdCandle: trade.htfAnalysis?.thirdCandle,
    fvgInteraction: trade.htfAnalysis?.fvgInteraction,
    poiZone: trade.htfAnalysis?.poiZone,
    cleanHtfCisd: trade.htfAnalysis?.cleanHtfCisd,
    htfCisdLocation: trade.htfAnalysis?.htfCisdLocation,
    poiMitigation: trade.htfAnalysis?.poiMitigation,
    htfPoiBackedBy: trade.htfAnalysis?.htfPoiBackedBy,
    entryLevel: normaliseEntryLevel(trade.ltfAnalysis?.entryLevel),
    beLogic: trade.ltfAnalysis?.beLogic,
    rrAdjusted: trade.ltfAnalysis?.rrAdjusted,
    entryTrigger: trade.ltfAnalysis?.entryTrigger,
    tradeComments: trade.ltfAnalysis?.tradeComments
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
    slPipsMin: elements.filterSlPipsMin.value,
    slPipsMax: elements.filterSlPipsMax.value,
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
    getTradeField(trade, "dayBias"),
    ...getComparableValues(getTradeField(trade, "dayBiasPros")),
    ...getComparableValues(getTradeField(trade, "dayBiasCons")),
    getTradeField(trade, "hasSmt"), getTradeField(trade, "smtStrength"),
    getTradeField(trade, "smtPair"),
    getTradeField(trade, "thirdCandle"),
    getTradeField(trade, "fvgInteraction"),
    getTradeField(trade, "poiZone"),
    getTradeField(trade, "cleanHtfCisd"),
    getTradeField(trade, "htfCisdLocation"),
    ...getComparableValues(getTradeField(trade, "poiMitigation")),
    ...getComparableValues(getTradeField(trade, "htfPoiBackedBy")),
    ...getComparableValues(getTradeField(trade, "entryLevel")),
    getTradeField(trade, "beLogic"),
    getTradeField(trade, "rrAdjusted"),
    getTradeField(trade, "entryTrigger"),
    ...getComparableValues(getTradeField(trade, "tradeComments"))
  ];
  return values.filter(Boolean).join(" ").toLowerCase();
}

function getFilteredTrades() {
  const filters = collectResearchFilters();
  const filtered = trades.filter((trade) => {
    if (filters.search && !tradeSearchText(trade).includes(filters.search)) return false;
    if (filters.dateFrom && String(trade.date || "") < filters.dateFrom) return false;
    if (filters.dateTo && String(trade.date || "") > filters.dateTo) return false;
    const slPips = optionalNumber(trade.slPips ?? trade.ltfAnalysis?.slPips);
    if (filters.slPipsMin !== "" && (slPips === null || slPips < Number(filters.slPipsMin))) return false;
    if (filters.slPipsMax !== "" && (slPips === null || slPips > Number(filters.slPipsMax))) return false;

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
    filters.search, filters.slPipsMin, filters.slPipsMax, filters.dateFrom, filters.dateTo,
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
  const completed = counted.filter((trade) => ["TP", "SL", "BE"].includes(trade.result));
  const wins = completed.filter((trade) => trade.result === "TP").length;
  const pnl = completed.reduce((total, trade) => total + Number(trade.pnl || 0), 0);
  const rrTrades = completed.filter((trade) => Number.isFinite(Number(trade.rr)) && Number(trade.rr) > 0);
  const avgRr = rrTrades.length
    ? rrTrades.reduce((total, trade) => total + Number(trade.rr), 0) / rrTrades.length
    : 0;

  elements.filteredPnl.textContent = formatCurrency(pnl);
  elements.filteredPnl.classList.toggle("negative", pnl < 0);
  elements.filteredWinRate.textContent = completed.length ? `${((wins / completed.length) * 100).toFixed(1)}%` : "0.0%";
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
  const insightKeys = ["direction", "session", "fvgStatus", "fvgFormed", "dayBias", "dayBiasPros", "dayBiasCons", "hasSmt", "smtStrength", "thirdCandle", "fvgInteraction", "poiZone", "cleanHtfCisd", "htfCisdLocation", "poiMitigation", "htfPoiBackedBy", "entryLevel", "beLogic", "rrAdjusted", "entryTrigger", "tradeComments"];
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
  const counted = filtered.filter((trade) =>
    trade.status === "Took Trade" && ["TP", "SL", "BE"].includes(trade.result)
  );
  const definitions = [
    ["BEST PAIR", "pair", false],
    ["BEST SESSION", "session", false],
    ["BEST DAY BIAS", "dayBias", false],
    ["BEST DAY BIAS PRO", "dayBiasPros", false],
    ["BEST DAY BIAS CON", "dayBiasCons", false],
    ["BEST SMT TYPE", "smtStrength", false],
    ["BEST FVG INTERACTION", "fvgInteraction", false],
    ["BEST POI ZONE", "poiZone", false],
    ["BEST CLEAN HTF CISD", "cleanHtfCisd", false],
    ["BEST HTF CISD LOCATION", "htfCisdLocation", false],
    ["BEST MITIGATION", "poiMitigation", false],
    ["BEST HTF POI BACKING", "htfPoiBackedBy", false],
    ["BEST ENTRY LEVEL", "entryLevel", false],
    ["BEST BE LOGIC", "beLogic", false],
    ["BEST ENTRY RR ADJUSTMENT", "rrAdjusted", false],
    ["BEST ENTRY TRIGGER", "entryTrigger", false],
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
    elements.researchRows.innerHTML = '<tr><td colspan="12" class="empty-table-cell">No trades match the current filters.</td></tr>';
    elements.researchMobileList.innerHTML = '<div class="empty-mobile-state">No trades match the current filters.</div>';
    return;
  }

  filtered.forEach((trade, index) => {
    const { dateText, dayText } = formatTradeDate(trade);
    const smt = getTradeField(trade, "hasSmt") === "Yes"
      ? getTradeField(trade, "smtStrength") || "Yes"
      : getTradeField(trade, "hasSmt") || "—";
    const entryLevel = getComparableValues(getTradeField(trade, "entryLevel")).join(", ") || "—";
    const pnl = optionalNumber(trade.pnl);
    const rr = optionalNumber(trade.rr);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="date-cell">${escapeHtml(dateText)}<small>${escapeHtml(dayText)}</small></td>
      <td><strong>${escapeHtml(trade.pair || "—")}</strong></td>
      <td><span class="pill ${trade.direction === "Long" ? "pill-long" : "pill-short"}">${escapeHtml(trade.direction || "—")}</span></td>
      <td><span class="pill pill-status">${escapeHtml(trade.status || "—")}</span></td>
      <td>${escapeHtml(trade.entryAttempt || "—")}</td>
      <td>${escapeHtml(smt)}</td>
      <td class="wrap-cell">${escapeHtml(entryLevel)}</td>
      <td><span class="pill ${resultClass(trade.result)}">${escapeHtml(trade.result || "—")}</span></td>
      <td>${rr === null ? "—" : `${rr.toFixed(2)}R`}</td>
      <td class="pnl-cell ${pnl !== null && pnl < 0 ? "negative" : pnl !== null && pnl > 0 ? "positive" : ""}">${escapeHtml(pnl === null ? "—" : formatCurrency(pnl))}</td>
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
        <span><small>RR</small>${rr === null ? "—" : `${rr.toFixed(2)}R`}</span>
        <span><small>P/L</small><b class="${pnl !== null && pnl < 0 ? "negative" : pnl !== null && pnl > 0 ? "positive" : ""}">${escapeHtml(pnl === null ? "—" : formatCurrency(pnl))}</b></span>
      </div>
      <div class="mobile-trade-tags"><span>${escapeHtml(smt)}</span></div>
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
  elements.filterSlPipsMin.value = "";
  elements.filterSlPipsMax.value = "";
  elements.filterDateFrom.value = "";
  elements.filterDateTo.value = "";
  elements.filterSort.value = "newest";
  document.querySelectorAll("select[data-filter-key]").forEach((select) => { select.value = ""; });
  renderResearchView();
}

function detailItem(label, value, extraClass = "") {
  const values = getComparableValues(value);
  const display = values.length ? values.join(", ") : "Not recorded";
  return `<div class="detail-item ${escapeAttribute(extraClass)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`;
}

function chartLinksMarkup(title, analysis, tone = "htf") {
  const links = (analysis?.chartLinks || []).filter((item) => item.url);
  const hasScreenshot = Boolean(analysis?.uploadedImage?.dataUrl);
  const count = links.length + (hasScreenshot ? 1 : 0);

  const linkMarkup = links.map((item, index) => {
    const safeUrl = /^https?:\/\//i.test(item.url) ? item.url : "";
    if (!safeUrl) return "";
    return `<a class="detail-reference-link" href="${escapeAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(item.label || `${title} ${index + 1}`)}</span>
      <small>Open chart ↗</small>
    </a>`;
  }).join("");

  const imageMarkup = hasScreenshot
    ? `<button class="detail-reference-link detail-chart-preview" type="button" data-preview-image="${escapeAttribute(analysis.uploadedImage.dataUrl)}">
        <span>${escapeHtml(analysis.uploadedImage.name || `${title} screenshot`)}</span>
        <small>Preview image</small>
      </button>`
    : "";

  const emptyMarkup = !count
    ? `<p class="detail-reference-empty">No ${escapeHtml(title.toLowerCase())} saved.</p>`
    : "";

  return `<section class="detail-reference-panel detail-reference-panel--${escapeAttribute(tone)}">
    <div class="detail-reference-heading">
      <div>
        <p>${escapeHtml(tone.toUpperCase())} CHARTS</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <span>${count} reference${count === 1 ? "" : "s"}</span>
    </div>
    <div class="detail-reference-list">${linkMarkup}${imageMarkup}${emptyMarkup}</div>
  </section>`;
}

function reviewMetric(label, value, modifier = "") {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return `<div class="trade-review-metric ${escapeAttribute(modifier)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`;
}

function reviewAnswerValues(value) {
  const values = getComparableValues(value);
  return values.length ? values : ["Not recorded"];
}

function reviewAnswerCards(value, modifier = "") {
  return reviewAnswerValues(value).map((item) => `
    <span class="review-answer-card ${escapeAttribute(modifier)}">${escapeHtml(item)}</span>
  `).join("");
}

function reviewQuestionCard(number, question, value, extraClass = "", modifier = "") {
  return `<fieldset class="review-question-card ${escapeAttribute(extraClass)}">
    <legend class="section-label">${escapeHtml(question)}</legend>
    <div class="review-answer-grid">${reviewAnswerCards(value, modifier)}</div>
  </fieldset>`;
}

function reviewBasicField(label, value, modifier = "") {
  const values = getComparableValues(value);
  const display = values.length ? values.join(", ") : "Not recorded";
  return `<div class="review-basic-field ${escapeAttribute(modifier)}">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(display)}</strong>
  </div>`;
}

function getMatchingOutcomeLink(analysis, tradeResult) {
  const links = (analysis?.chartLinks || []).filter((item) => item?.url && item?.label);
  const result = String(tradeResult || "").trim().toUpperCase();
  if (!result) return null;

  const keywordMap = {
    TP: ["tp", "target"],
    SL: ["sl", "stop"],
    BE: ["be", "break even", "breakeven"]
  };

  const keywords = keywordMap[result] || [];
  return links.find((link) => {
    const label = String(link.label || "").toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  }) || null;
}

function getReviewChartPreview(analysis, options = {}) {
  const preferredLink = options.preferredLink;
  if (preferredLink?.url) {
    const preview = resolveImagePreview(preferredLink.url);
    if (preview.src && !preview.message) {
      return {
        src: preview.src,
        originalSrc: preferredLink.url,
        label: preferredLink.label || "Trade outcome snapshot"
      };
    }
  }

  if (analysis?.uploadedImage?.dataUrl) {
    return {
      src: analysis.uploadedImage.dataUrl,
      originalSrc: analysis.uploadedImage.dataUrl,
      label: analysis.uploadedImage.name || "Uploaded screenshot"
    };
  }

  if (analysis?.activePreview?.src) {
    return {
      src: analysis.activePreview.src,
      originalSrc: analysis.activePreview.originalSrc || analysis.activePreview.src,
      label: analysis.activePreview.label || "Active chart snapshot"
    };
  }

  for (const link of analysis?.chartLinks || []) {
    if (!link?.url) continue;
    const preview = resolveImagePreview(link.url);
    if (preview.src && !preview.message) {
      return {
        src: preview.src,
        originalSrc: link.url,
        label: link.label || "TradingView snapshot"
      };
    }
  }

  return null;
}

function reviewChartPanel(title, analysis, tone = "htf", options = {}) {
  const links = (analysis?.chartLinks || []).filter((item) => item?.url);
  const preview = getReviewChartPreview(analysis, options);
  const linkMarkup = links.map((item, index) => {
    const safeUrl = /^https?:\/\//i.test(item.url) ? item.url : "";
    if (!safeUrl) return "";
    return `<a class="review-chart-link" href="${escapeAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(item.label || `${title} ${index + 1}`)}</span>
      <small>Open ↗</small>
    </a>`;
  }).join("");

  const mediaMarkup = preview
    ? `<button class="review-chart-media has-image" type="button" data-preview-image="${escapeAttribute(preview.src)}" aria-label="Open ${escapeAttribute(title)} preview">
        <img src="${escapeAttribute(preview.src)}" alt="${escapeAttribute(preview.label)}" />
        <span>Open full preview</span>
      </button>`
    : `<div class="review-chart-media review-chart-placeholder">
        <strong>No active preview</strong>
        <span>${links.length ? "Open a saved reference below." : "No chart reference was saved."}</span>
      </div>`;

  return `<section class="review-chart-panel review-chart-panel--${escapeAttribute(tone)}">
    <div class="review-chart-heading">
      <div>
        <p class="section-label">CHART REFERENCES</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <span>${links.length} link${links.length === 1 ? "" : "s"}</span>
    </div>
    ${mediaMarkup}
    <div class="review-chart-links">${linkMarkup || '<span class="review-chart-empty">No saved links</span>'}</div>
  </section>`;
}

function reviewChartWorkspace(trade) {
  const charts = [
    {
      key: "day",
      label: "Day",
      title: "Day Time Frame",
      analysis: { chartLinks: trade.htfAnalysis?.dayChartLinks || [] },
      options: {}
    },
    { key: "htf", label: "HTF", title: "HTF Charts", analysis: trade.htfAnalysis, options: {} },
    {
      key: "ltf",
      label: "LTF",
      title: "LTF Charts",
      analysis: trade.ltfAnalysis,
      options: { preferredLink: getMatchingOutcomeLink(trade.ltfAnalysis, trade.result) }
    }
  ];
  const firstActive = charts.find((chart) => getReviewChartPreview(chart.analysis, chart.options))?.key || "day";
  const totalLinks = charts.reduce(
    (count, chart) => count + (chart.analysis?.chartLinks || []).filter((item) => item?.url).length,
    0
  );
  const tabs = charts.map((chart) => `
    <button class="review-chart-tab${chart.key === firstActive ? " active" : ""}" type="button" role="tab"
      data-review-chart-tab="${chart.key}" aria-selected="${chart.key === firstActive}">
      ${chart.label}
    </button>
  `).join("");
  const panes = charts.map((chart) => `
    <div class="review-chart-pane" role="tabpanel" data-review-chart-pane="${chart.key}"${chart.key === firstActive ? "" : " hidden"}>
      ${reviewChartPanel(chart.title, chart.analysis, chart.key, chart.options)}
    </div>
  `).join("");

  return `<aside class="review-chart-workspace" aria-label="Saved trade charts">
    <div class="review-chart-workspace-heading">
      <div>
        <p class="section-label">CHART WORKSPACE</p>
        <h3>Trade References</h3>
      </div>
      <span>${totalLinks} link${totalLinks === 1 ? "" : "s"}</span>
    </div>
    <div class="review-chart-tabs" role="tablist" aria-label="Chart timeframe">${tabs}</div>
    <div class="review-chart-panes">${panes}</div>
  </aside>`;
}

function openTradeDetail(trade) {
  const { dateText, dayText } = formatTradeDate(trade);
  const rrNumber = optionalNumber(trade.rr);
  const pnlNumber = optionalNumber(trade.pnl);
  const riskNumber = optionalNumber(trade.riskAmount);
  const pnlText = pnlNumber === null ? "Not recorded" : formatCurrency(pnlNumber);
  const pnlTone = pnlNumber === null ? "" : pnlNumber > 0 ? "is-positive" : pnlNumber < 0 ? "is-negative" : "";
  const outcomeTone = trade.result === "TP" ? "answer-positive" : trade.result === "SL" ? "answer-negative" : trade.result === "BE" ? "answer-neutral" : "";

  const smtAnswer = getTradeField(trade, "hasSmt") === "Yes"
    ? ["Yes", getTradeField(trade, "smtStrength"), getTradeField(trade, "smtPair")]
    : getTradeField(trade, "hasSmt");
  const cleanCisdAnswer = getTradeField(trade, "cleanHtfCisd") === "Yes"
    ? ["Yes", getTradeField(trade, "htfCisdLocation")]
    : getTradeField(trade, "cleanHtfCisd");
  elements.tradeDetailTitle.textContent = `${trade.pair || "Trade"} · ${dateText}`;
  elements.tradeDetailContent.innerHTML = `
    <div class="trade-view-shell">
      <section class="trade-view-basic-panel trade-view-overview">
        <div class="trade-view-overview-primary">
          <div class="trade-view-identity">
            <p class="section-label">BASIC TRADE INFORMATION</p>
            <h3>${escapeHtml(trade.pair || "Trade")}</h3>
            <p>${escapeHtml(dateText)} <span>·</span> ${escapeHtml(dayText)}</p>
            <div class="trade-view-title-pills">
              <span class="pill ${trade.direction === "Long" ? "pill-long" : "pill-short"}">${escapeHtml(trade.direction || "—")}</span>
              <span class="pill pill-status">${escapeHtml(trade.status || "—")}</span>
            </div>
          </div>
          <div class="trade-view-primary-metrics">
            ${reviewMetric("P/L", pnlText, pnlTone)}
            ${reviewMetric("RR", rrNumber === null ? "—" : `${rrNumber.toFixed(2)}R`)}
            ${reviewMetric("Risk", riskNumber === null ? "—" : formatCurrency(riskNumber))}
            ${reviewMetric("Result", trade.result || "Pending", outcomeTone)}
          </div>
        </div>
        <div class="trade-view-basic-grid trade-view-basic-grid--secondary">
          ${reviewBasicField("Session", trade.session)}
          ${reviewBasicField("HTF / LTF", `${trade.htf || "—"} / ${trade.ltf || "—"}`)}
          ${reviewBasicField("Entry Attempt", trade.entryAttempt)}
          ${reviewBasicField("FVG Status", trade.fvgStatus)}
          ${reviewBasicField("Day Bias", getTradeField(trade, "dayBias"))}
          ${reviewBasicField("Day Bias Pros", getTradeField(trade, "dayBiasPros"))}
          ${reviewBasicField("Day Bias Cons", getTradeField(trade, "dayBiasCons"))}
        </div>
      </section>

      <div class="trade-view-board">
          <section class="review-analysis-panel review-analysis-panel--htf">
            <div class="trade-view-section-heading compact-heading">
              <div>
                <p class="section-label">HTF ANALYSIS</p>
              </div>
            </div>
            <div class="review-question-grid review-question-grid--htf">
              ${reviewQuestionCard("1", "SMT", smtAnswer)}
              ${reviewQuestionCard("2", "HTF CLEAN CISD", cleanCisdAnswer)}
              ${reviewQuestionCard("3", "FVG FORMED", getTradeField(trade, "fvgFormed"))}
              ${reviewQuestionCard("4", "FVG'S THIRD CANDLE", getTradeField(trade, "thirdCandle"))}
              ${reviewQuestionCard("5", "FVG MITIGATION / SWEEP", getTradeField(trade, "fvgInteraction"))}
              ${reviewQuestionCard("6", "PREMIUM / DISCOUNT", getTradeField(trade, "poiZone"))}
              ${reviewQuestionCard("7", "POI BACKED BY", getTradeField(trade, "htfPoiBackedBy"))}
              ${reviewQuestionCard("8", "POI MITIGATION BEHAVIOR", getTradeField(trade, "poiMitigation"))}
            </div>
          </section>

          <section class="review-analysis-panel review-analysis-panel--ltf">
            <div class="trade-view-section-heading compact-heading">
              <div>
                <p class="section-label">LTF ANALYSIS</p>
              </div>
            </div>
            <div class="review-question-grid review-question-grid--ltf">
              ${reviewQuestionCard("1", "ENTRY OPTION", getTradeField(trade, "entryLevel"))}
              ${reviewQuestionCard("2", "STOP-LOSS PIPS", trade.slPips ?? trade.ltfAnalysis?.slPips)}
              ${reviewQuestionCard("3", "BREAK EVEN LEVEL", getTradeField(trade, "beLogic"))}
              ${reviewQuestionCard("4", "Entry ADJUSTED FOR RR", getTradeField(trade, "rrAdjusted"))}
              ${reviewQuestionCard("5", "ENTERY TRIGGER BY ANYTHING", getTradeField(trade, "entryTrigger"))}
              ${reviewQuestionCard("6", "ABOUT THE TRADE", getTradeField(trade, "tradeComments"))}
            </div>
          </section>
          ${reviewChartWorkspace(trade)}
      </div>
    </div>
  `;
  elements.tradeDetailModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeTradeDetail() {
  elements.tradeDetailModal.hidden = true;
  if (elements.modal.hidden) document.body.classList.remove("modal-open");
}

function editTrade(trade) {
  const savedHtfAnalysis = structuredClone(trade.htfAnalysis || {});
  const savedDayChartLinks = Array.isArray(savedHtfAnalysis.dayChartLinks)
    ? savedHtfAnalysis.dayChartLinks
    : [];
  delete savedHtfAnalysis.dayChartLinks;

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
    fvgStatus: trade.fvgStatus || "Fresh FVG"
  };
  savedHtfAnalysis.fvgFormed ||= trade.fvgFormed || "Today";
  currentDraft = normaliseDraft({
    id: trade.id,
    appNamespace: APP_NAMESPACE,
    createdAt: trade.createdAt || new Date().toISOString(),
    lastStep: "basic",
    basic,
    day: {
      chartLinks: savedDayChartLinks,
      activePreview: null
    },
    htf: savedHtfAnalysis,
    ltf: structuredClone(trade.ltfAnalysis || {})
  });
  saveDraft();
  openModal();
}

function getDashboardSortTime(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareWeeklyDashboardTrades(a, b) {
  // Monday stays at the top and Sunday stays at the bottom because the
  // dashboard is limited to the current Monday-to-Sunday week.
  const dateA = new Date(`${a.date}T12:00:00`).getTime();
  const dateB = new Date(`${b.date}T12:00:00`).getTime();
  const dateDifference = dateA - dateB;

  if (dateDifference !== 0) return dateDifference;

  // For multiple trades on the same day, older entries remain above newer
  // entries. A newly saved trade therefore appears at the bottom of that day.
  const createdDifference = getDashboardSortTime(a.createdAt) - getDashboardSortTime(b.createdAt);
  if (createdDifference !== 0) return createdDifference;

  // Stable fallback for older imported records that do not have createdAt.
  return String(a.id || "").localeCompare(String(b.id || ""));
}

function renderTrades() {
  elements.rows.innerHTML = "";
  const weeklyTrades = trades
    .filter((trade) => isDateInCurrentWeek(trade.date))
    .sort(compareWeeklyDashboardTrades);

  if (!weeklyTrades.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="11" class="muted">No Evergreen trades this week. Click “Add Trade” to begin.</td>';
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
    const hasSmtAnswer = getTradeField(trade, "hasSmt");
    const smtDisplay = hasSmtAnswer === "Yes"
      ? String(getTradeField(trade, "smtStrength") || "Yes").replace(/\s*SMT$/i, "")
      : hasSmtAnswer || "—";

    const row = document.createElement("tr");
    row.dataset.tradeId = trade.id;
    row.tabIndex = 0;
    row.setAttribute("aria-label", `View ${trade.pair || "trade"} from ${dateText}`);
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="date-cell">${dateText}<small>${escapeHtml(dayText)}</small></td>
      <td>${escapeHtml(trade.pair)}</td>
      <td>${escapeHtml(getTradeField(trade, "dayBias") || "—")}</td>
      <td><span class="pill ${trade.direction === "Long" ? "pill-long" : "pill-short"}">${escapeHtml(trade.direction)}</span></td>
      <td><span class="pill ${poiZoneClass(getTradeField(trade, "poiZone"))}">${escapeHtml(getTradeField(trade, "poiZone") || "—")}</span></td>
      <td>${escapeHtml(smtDisplay)}</td>
      <td>${escapeHtml(trade.entryAttempt || "—")}</td>
      <td class="dashboard-entry-cell">
        <span class="pill ${trade.status === "Took Trade" ? "pill-entry-took" : "pill-entry-not-taken"}">${escapeHtml(trade.status === "Took Trade" ? "Took" : "Not Taken")}</span>
      </td>
      <td><span class="pill ${resultClass(trade.result)}">${escapeHtml(trade.result || "—")}</span></td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" type="button" data-action="edit" data-id="${trade.id}">Edit</button>
          <button class="action-btn delete" type="button" data-action="delete" data-id="${trade.id}">Delete</button>
        </div>
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
  const completed = counted.filter((trade) => ["TP", "SL", "BE"].includes(trade.result));
  const wins = completed.filter((trade) => trade.result === "TP").length;
  const pnl = completed.reduce((total, trade) => total + Number(trade.pnl || 0), 0);
  const winningTrades = completed.filter((trade) => trade.result === "TP");
  const winningEdge = winningTrades.length >= 2
    ? WEEKLY_WINNING_EDGE_KEYS
      .map((key, priority) => ({ ...mostCommonInsight(winningTrades, key), priority }))
      .filter((insight) => insight.value && insight.count >= 2)
      .sort((a, b) => b.percentage - a.percentage || b.count - a.count || a.priority - b.priority)[0]
    : null;

  elements.weekPnl.textContent = formatCurrency(pnl);
  elements.weekWinRate.textContent = completed.length ? `${((wins / completed.length) * 100).toFixed(1)}%` : "0.0%";
  elements.weekTrades.textContent = String(counted.length);
  if (winningEdge) {
    const matchingTradeIds = winningTrades
      .filter((trade) => getComparableValues(getTradeField(trade, winningEdge.key)).includes(winningEdge.value))
      .map((trade) => trade.id);
    elements.weekWinningEdge.textContent = winningEdge.value;
    elements.weekWinningEdgeNote.textContent = `${INSIGHT_LABELS[winningEdge.key]} · ${winningEdge.percentage}% of ${winningTrades.length} TP trades`;
    elements.weekWinningEdgeCard.dataset.tradeIds = matchingTradeIds.join(",");
    elements.weekWinningEdgeCard.dataset.edgeLabel = winningEdge.value;
    elements.weekWinningEdgeCard.classList.remove("is-highlighting");
    elements.weekWinningEdgeCard.classList.add("has-winning-edge");
    elements.weekWinningEdgeCard.setAttribute("aria-pressed", "false");
  } else if (winningTrades.length < 2) {
    elements.weekWinningEdge.textContent = "Need 2 TP trades";
    elements.weekWinningEdgeNote.textContent = `${winningTrades.length} weekly ${winningTrades.length === 1 ? "winner" : "winners"} recorded`;
    elements.weekWinningEdgeCard.dataset.tradeIds = "";
    elements.weekWinningEdgeCard.dataset.edgeLabel = "";
    elements.weekWinningEdgeCard.classList.remove("has-winning-edge", "is-highlighting");
    elements.weekWinningEdgeCard.setAttribute("aria-pressed", "false");
  } else {
    elements.weekWinningEdge.textContent = "No shared pattern";
    elements.weekWinningEdgeNote.textContent = "Record more setup details to reveal an edge";
    elements.weekWinningEdgeCard.dataset.tradeIds = "";
    elements.weekWinningEdgeCard.dataset.edgeLabel = "";
    elements.weekWinningEdgeCard.classList.remove("has-winning-edge", "is-highlighting");
    elements.weekWinningEdgeCard.setAttribute("aria-pressed", "false");
  }
}

function toggleWeeklyWinningEdgeHighlight() {
  const tradeIds = (elements.weekWinningEdgeCard.dataset.tradeIds || "").split(",").filter(Boolean);
  if (!tradeIds.length) {
    showToast("Add at least two matching TP trades to reveal a weekly winning edge.");
    return;
  }

  const shouldHighlight = !elements.weekWinningEdgeCard.classList.contains("is-highlighting");
  elements.weekWinningEdgeCard.classList.toggle("is-highlighting", shouldHighlight);
  elements.weekWinningEdgeCard.setAttribute("aria-pressed", String(shouldHighlight));
  elements.rows.querySelectorAll("tr[data-trade-id]").forEach((row) => {
    row.classList.toggle("winning-edge-match", shouldHighlight && tradeIds.includes(row.dataset.tradeId));
  });

  if (!shouldHighlight) {
    showToast("Winning-edge highlights cleared.");
    return;
  }

  const firstMatch = elements.rows.querySelector("tr.winning-edge-match");
  firstMatch?.scrollIntoView({ behavior: "smooth", block: "center" });
  const label = elements.weekWinningEdgeCard.dataset.edgeLabel || "winning edge";
  showToast(`${tradeIds.length} TP ${tradeIds.length === 1 ? "trade shares" : "trades share"} ${label}.`);
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

function poiZoneClass(zone) {
  if (zone === "Premium") return "pill-premium";
  if (zone === "Discount") return "pill-discount";
  return "pill-neutral";
}

function resultClass(result) {
  if (result === "TP") return "pill-tp";
  if (result === "SL") return "pill-sl";
  if (result === "BE") return "pill-be";
  return "pill-neutral";
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
    "dayBias", "dayBiasPros", "dayBiasCons", "hasSmt", "smtStrength", "smtPair", "thirdCandle",
    "fvgInteraction", "poiZone", "cleanHtfCisd", "htfCisdLocation", "poiMitigation", "htfPoiBackedBy", "entryLevel", "slPips", "beLogic", "rrAdjusted", "entryTrigger", "tradeComments", "result", "riskAmount", "rr", "pnl"
  ];
  const rows = trades.map((trade) => {
    const flat = {
      ...trade,
      dayBias: trade.htfAnalysis?.dayBias,
      dayBiasPros: getComparableValues(trade.htfAnalysis?.dayBiasPros || trade.htfAnalysis?.dayBiasSetup).join(" | "),
      dayBiasCons: getComparableValues(trade.htfAnalysis?.dayBiasCons).join(" | "),
      hasSmt: trade.htfAnalysis?.hasSmt,
      smtStrength: trade.htfAnalysis?.smtStrength,
      smtPair: trade.htfAnalysis?.smtPair,
      thirdCandle: trade.htfAnalysis?.thirdCandle,
      fvgInteraction: trade.htfAnalysis?.fvgInteraction,
      poiZone: trade.htfAnalysis?.poiZone,
      cleanHtfCisd: trade.htfAnalysis?.cleanHtfCisd,
      htfCisdLocation: trade.htfAnalysis?.htfCisdLocation,
      poiMitigation: trade.htfAnalysis?.poiMitigation?.join(" | "),
      htfPoiBackedBy: getComparableValues(trade.htfAnalysis?.htfPoiBackedBy).join(" | "),
      entryLevel: getComparableValues(trade.ltfAnalysis?.entryLevel).join(" | "),
      beLogic: trade.ltfAnalysis?.beLogic,
      rrAdjusted: trade.ltfAnalysis?.rrAdjusted,
      entryTrigger: trade.ltfAnalysis?.entryTrigger,
      tradeComments: getComparableValues(trade.ltfAnalysis?.tradeComments).join(" | ")
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
          dayBiasFactor: uniqueValues([
            ...DEFAULT_OPTIONS.dayBiasFactor,
            ...(parsed.optionLibrary.dayBiasFactor || []),
            ...(parsed.optionLibrary.dayBiasSetup || [])
          ]),
          poiMitigation: uniqueValues([...DEFAULT_OPTIONS.poiMitigation, ...(parsed.optionLibrary.poiMitigation || [])]),
          htfPoiBackedBy: uniqueValues([...DEFAULT_OPTIONS.htfPoiBackedBy, ...(parsed.optionLibrary.htfPoiBackedBy || [])]),
          tradeComments: uniqueValues([...DEFAULT_OPTIONS.tradeComments, ...(parsed.optionLibrary.tradeComments || [])])
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

function openDeleteConfirm(trade) {
  pendingDeleteTradeId = trade.id;
  elements.deleteConfirmTitle.textContent = `Delete ${trade.pair || "trade"}?`;
  elements.deleteConfirmMessage.textContent = `${trade.pair || "Trade"} · ${trade.date || "No date"} will be permanently removed from Evergreen Supabase and this browser.`;
  elements.deleteConfirmStatus.textContent = "";
  elements.confirmDeleteBtn.disabled = false;
  elements.cancelDeleteBtn.disabled = false;
  elements.deleteConfirmModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => elements.cancelDeleteBtn.focus(), 0);
}

function closeDeleteConfirm() {
  if (elements.confirmDeleteBtn.disabled) return;
  pendingDeleteTradeId = null;
  elements.deleteConfirmModal.hidden = true;
  elements.deleteConfirmStatus.textContent = "";
  if (elements.modal.hidden && elements.tradeDetailModal.hidden && elements.imagePreviewModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

async function confirmPendingDelete() {
  const trade = trades.find((item) => item.id === pendingDeleteTradeId);
  if (!trade) {
    closeDeleteConfirm();
    showToast("Trade is no longer available.");
    return;
  }

  elements.confirmDeleteBtn.disabled = true;
  elements.cancelDeleteBtn.disabled = true;
  elements.deleteConfirmStatus.textContent = "Deleting trade…";

  const isCloudTrade = Boolean(cloudUser) && (
    trade.cloudUserId === cloudUser.id || loadSyncedIds(cloudUser.id).has(trade.id)
  );

  try {
    if (isCloudTrade) {
      await window.EvergreenCloud.deleteTrade(trade);
      unmarkTradeSynced(trade.id, cloudUser.id);
    }

    trades = trades.filter((item) => item.id !== trade.id);
    saveTrades();
    renderTrades();
    updateCloudUi();

    pendingDeleteTradeId = null;
    elements.deleteConfirmModal.hidden = true;
    elements.confirmDeleteBtn.disabled = false;
    elements.cancelDeleteBtn.disabled = false;
    document.body.classList.remove("modal-open");
    showToast(isCloudTrade ? "Trade deleted from Evergreen Supabase." : "Local Evergreen trade deleted.");
  } catch (error) {
    console.error("Trade deletion failed:", error);
    elements.deleteConfirmStatus.textContent = `Delete failed: ${error.message || "Unknown Supabase error."}`;
    elements.confirmDeleteBtn.disabled = false;
    elements.cancelDeleteBtn.disabled = false;
  }
}

async function handleRowAction(event) {
  const button = event.target.closest("button[data-action]");
  const dashboardRow = event.target.closest("#tradeRows tr[data-trade-id]");
  const tradeId = button?.dataset.id || dashboardRow?.dataset.tradeId;
  if (!tradeId) return;
  const trade = trades.find((item) => item.id === tradeId);
  if (!trade) return;

  if (!button && dashboardRow) {
    openTradeDetail(trade);
    return;
  }

  if (button.dataset.action === "delete") {
    openDeleteConfirm(trade);
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
  elements.htf.addEventListener("change", () => {
    updateLtf();
    updateTradeBlueprint();
  });
  elements.pair.addEventListener("change", () => {
    updateSmtPair();
    updateTradeBlueprint();
  });
  elements.basicForm.addEventListener("submit", handleBasicSubmit);
  elements.htfForm.addEventListener("submit", handleHtfSubmit);
  elements.ltfForm.addEventListener("submit", handleLtfSubmit);
  elements.basicForm.addEventListener("input", updateTradeBlueprint);
  elements.basicForm.addEventListener("change", updateTradeBlueprint);
  elements.htfForm.addEventListener("change", updateTradeBlueprint);
  elements.ltfForm.addEventListener("input", updateTradeBlueprint);
  elements.ltfForm.addEventListener("change", updateTradeBlueprint);
  elements.backToBasicBtn.addEventListener("click", () => {
    captureHtfForm();
    showStep("basic");
  });
  elements.backToHtfBtn.addEventListener("click", () => {
    captureLtfForm();
    showStep("htf");
  });

  elements.stepTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step-target]");
    if (!button || button.disabled) return;
    captureVisibleStep();
    showStep(button.dataset.stepTarget);
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('.choice-card input[type="radio"], .choice-card input[type="checkbox"]')) {
      syncChoiceCards();
      updateTradeCommentSummary();
      updateDayBiasFactorSummaries();
      updateConditionalPanels();
      updateCalculatedPnl();
      captureVisibleStep();

      // Sweep suggests CISD once, at the moment Sweep is selected.
      // After that, the trader can manually uncheck CISD and the choice is preserved.
      if (
        event.target.matches('input[name="fvgInteraction"]') &&
        event.target.checked &&
        event.target.value === "Sweep"
      ) {
        applySweepEntryDefault();
      }

      updateTradeBlueprint();
      saveDraft();
    }
  });

  elements.riskAmount.addEventListener("input", () => {
    updateCalculatedPnl();
    updateTradeBlueprint();
  });
  elements.riskReward.addEventListener("input", () => {
    updateCalculatedPnl();
    updateTradeBlueprint();
  });
  elements.addDayBiasProsOptionBtn?.addEventListener("click", () => addCustomOption("dayBiasFactor", "dayBiasPros"));
  elements.addDayBiasConsOptionBtn?.addEventListener("click", () => addCustomOption("dayBiasFactor", "dayBiasCons"));
  elements.addPoiMitigationOptionBtn.addEventListener("click", () => addCustomOption("poiMitigation"));
  elements.addHtfPoiBackedByOptionBtn.addEventListener("click", () => addCustomOption("htfPoiBackedBy"));
  elements.addTradeCommentOptionBtn.addEventListener("click", () => addCustomOption("tradeComments"));

  [elements.dayBiasProsDropdown, elements.dayBiasConsDropdown].forEach((dropdown) => {
    dropdown?.addEventListener("toggle", () => {
      if (!dropdown.open) return;
      [elements.dayBiasProsDropdown, elements.dayBiasConsDropdown].forEach((other) => {
        if (other && other !== dropdown) other.open = false;
      });
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideDayBiasDropdown = event.target.closest(
      "#dayBiasProsDropdown, #dayBiasConsDropdown"
    );
    if (clickedInsideDayBiasDropdown) return;
    if (elements.dayBiasProsDropdown) elements.dayBiasProsDropdown.open = false;
    if (elements.dayBiasConsDropdown) elements.dayBiasConsDropdown.open = false;
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#tradeCommentDropdown")) return;
    if (elements.tradeCommentDropdown) elements.tradeCommentDropdown.open = false;
  });

  bindChartUi("day");
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
    if (!elements.authModal.hidden) closeAuthModal();
    else if (!elements.imagePreviewModal.hidden) closeImagePreview();
    else if (!elements.tradeDetailModal.hidden) closeTradeDetail();
    else if (!elements.modal.hidden) closeModal();
  });

  elements.rows.addEventListener("click", handleRowAction);
  elements.weekWinningEdgeCard.addEventListener("click", toggleWeeklyWinningEdgeHighlight);
  elements.weekWinningEdgeCard.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    toggleWeeklyWinningEdgeHighlight();
  });
  elements.rows.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key) || event.target.closest("button")) return;
    const row = event.target.closest("tr[data-trade-id]");
    if (!row) return;
    event.preventDefault();
    const trade = trades.find((item) => item.id === row.dataset.tradeId);
    if (trade) openTradeDetail(trade);
  });
  elements.researchRows.addEventListener("click", handleRowAction);
  elements.researchMobileList.addEventListener("click", handleRowAction);
  elements.backupBtn.addEventListener("click", exportJson);
  elements.exportBtn.addEventListener("click", exportCsv);
  elements.importBtn.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const [file] = elements.importFile.files;
    if (file) importJsonFile(file);
  });

  elements.connectBtn.addEventListener("click", async () => {
    if (!cloudUser) {
      openAuthModal();
      return;
    }
    const confirmed = window.confirm(`Sign out ${cloudUser.email || "this Supabase user"}?`);
    if (!confirmed) return;
    try {
      await window.EvergreenCloud.signOut();
      showToast("Signed out of Evergreen Supabase. Local cached data remains on this device.");
    } catch (error) {
      showToast(`Unable to sign out: ${error.message || "Unknown error."}`);
    }
  });
  elements.syncNowBtn.addEventListener("click", syncLocalDataToCloud);
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.closeAuthModalBtn.addEventListener("click", closeAuthModal);
  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) closeAuthModal();
  });

  elements.viewAllBtn.addEventListener("click", () => showPage("research"));
  elements.backToDashboardBtn.addEventListener("click", () => showPage("dashboard"));
  elements.clearFiltersBtn.addEventListener("click", clearResearchFilters);
  elements.filterGrid.addEventListener("input", renderResearchView);
  elements.filterGrid.addEventListener("change", renderResearchView);

  elements.closeTradeDetailBtn.addEventListener("click", closeTradeDetail);
  elements.cancelDeleteBtn.addEventListener("click", closeDeleteConfirm);
  elements.confirmDeleteBtn.addEventListener("click", confirmPendingDelete);
  elements.deleteConfirmModal.addEventListener("click", (event) => {
    if (event.target === elements.deleteConfirmModal) closeDeleteConfirm();
  });
  elements.tradeDetailModal.addEventListener("click", (event) => {
    if (event.target === elements.tradeDetailModal) closeTradeDetail();
  });
  elements.tradeDetailContent.addEventListener("click", (event) => {
    const chartTab = event.target.closest("[data-review-chart-tab]");
    if (chartTab) {
      const workspace = chartTab.closest(".review-chart-workspace");
      const activeKey = chartTab.dataset.reviewChartTab;
      workspace.querySelectorAll("[data-review-chart-tab]").forEach((tab) => {
        const active = tab.dataset.reviewChartTab === activeKey;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      workspace.querySelectorAll("[data-review-chart-pane]").forEach((pane) => {
        pane.hidden = pane.dataset.reviewChartPane !== activeKey;
      });
      return;
    }
    const button = event.target.closest("[data-preview-image]");
    if (!button) return;
    openImagePreview(button.dataset.previewImage);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.deleteConfirmModal.hidden) closeDeleteConfirm();
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
updateTradeBlueprint();
updateWeekRange();
syncChoiceCards();
renderTrades();
bindEvents();
initialiseCloud();

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
