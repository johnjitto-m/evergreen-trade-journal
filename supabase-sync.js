"use strict";

(function initialiseEvergreenCloudModule() {
  const TABLE_TRADES = "evergreen_trades";
  const TABLE_OPTIONS = "evergreen_journal_options";
  const IMAGE_BUCKET = "evergreen-trade-images";
  const SIGNED_URL_SECONDS = 60 * 60 * 24;

  let client = null;
  let session = null;
  let authSubscription = null;

  function requireClient() {
    if (!client) throw new Error("Supabase client has not been initialised.");
    return client;
  }

  function getConfig() {
    const config = window.EVERGREEN_SUPABASE_CONFIG || {};
    return {
      url: String(config.url || "").trim(),
      publishableKey: String(config.publishableKey || "").trim()
    };
  }

  function isConfigured() {
    const config = getConfig();
    return config.url.startsWith("https://") && Boolean(config.publishableKey);
  }

  async function init(onAuthChange) {
    if (!isConfigured()) throw new Error("Supabase URL or publishable key is missing.");
    if (!window.supabase?.createClient) throw new Error("Supabase JavaScript failed to load.");

    const config = getConfig();
    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "evergreen_trade_journal_supabase_auth"
      }
    });

    const { data: listenerData } = client.auth.onAuthStateChange((event, nextSession) => {
      session = nextSession;
      window.setTimeout(() => onAuthChange?.(nextSession, event), 0);
    });
    authSubscription = listenerData?.subscription || null;

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
    return session;
  }

  function destroy() {
    authSubscription?.unsubscribe?.();
    authSubscription = null;
  }

  function getSession() {
    return session;
  }

  function getUser() {
    return session?.user || null;
  }

  async function signInWithMagicLink(email, redirectTo) {
    const supabaseClient = requireClient();
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
  }

  function cleanAnalysis(analysis = {}) {
    const {
      chartLinks,
      uploadedImage,
      activePreview,
      ...rest
    } = analysis;

    return {
      ...rest,
      uploadedImageName: uploadedImage?.name || rest.uploadedImageName || ""
    };
  }

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new Error("The uploaded screenshot is not a valid image data URL.");
    const mime = match[1] || "application/octet-stream";
    const isBase64 = Boolean(match[2]);
    const payload = match[3] || "";
    const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  function extensionForMime(mime) {
    const map = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif"
    };
    return map[mime] || "png";
  }

  async function uploadAnalysisImage(type, trade, userId) {
    const analysis = trade[`${type}Analysis`] || {};
    const image = analysis.uploadedImage;
    if (!image) return trade[`${type}ImagePath`] || null;

    if (image.path && !String(image.dataUrl || "").startsWith("data:")) return image.path;
    if (!String(image.dataUrl || "").startsWith("data:")) return image.path || trade[`${type}ImagePath`] || null;

    const blob = dataUrlToBlob(image.dataUrl);
    const extension = extensionForMime(blob.type || image.type);
    const path = `${userId}/${trade.id}/${type}.${extension}`;
    const { error } = await requireClient()
      .storage
      .from(IMAGE_BUCKET)
      .upload(path, blob, {
        contentType: blob.type || image.type || "image/png",
        cacheControl: "3600",
        upsert: true
      });
    if (error) throw error;
    return path;
  }

  async function signedImage(path, fallbackName) {
    if (!path) return null;
    const { data, error } = await requireClient()
      .storage
      .from(IMAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error) {
      console.warn("Unable to create Evergreen chart signed URL:", error);
      return { path, name: fallbackName || "Chart screenshot", dataUrl: "" };
    }
    return {
      path,
      name: fallbackName || "Chart screenshot",
      dataUrl: data.signedUrl
    };
  }

  async function rowToTrade(row) {
    const htfAnalysis = row.htf_analysis || {};
    const ltfAnalysis = row.ltf_analysis || {};
    const [htfImage, ltfImage] = await Promise.all([
      signedImage(row.htf_image_path, htfAnalysis.uploadedImageName || "HTF screenshot"),
      signedImage(row.ltf_image_path, ltfAnalysis.uploadedImageName || "LTF screenshot")
    ]);

    return {
      id: row.id,
      date: row.trade_date,
      day: row.trade_day,
      pair: row.pair,
      direction: row.direction,
      session: row.session,
      htf: row.htf,
      ltf: row.ltf,
      status: row.trade_status,
      entryAttempt: row.entry_attempt,
      fvgStatus: row.fvg_status,
      fvgFormed: row.fvg_formed_day,
      result: row.result,
      slPips: optionalNumber(row.sl_pips),
      riskAmount: optionalNumber(row.risk_amount),
      rr: optionalNumber(row.rr),
      pnl: optionalNumber(row.pnl),
      htfAnalysis: {
        ...htfAnalysis,
        chartLinks: Array.isArray(row.htf_chart_links) ? row.htf_chart_links : [],
        uploadedImage: htfImage,
        activePreview: null
      },
      ltfAnalysis: {
        ...ltfAnalysis,
        chartLinks: Array.isArray(row.ltf_chart_links) ? row.ltf_chart_links : [],
        uploadedImage: ltfImage,
        activePreview: null
      },
      htfImagePath: row.htf_image_path || null,
      ltfImagePath: row.ltf_image_path || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cloudUserId: row.user_id,
      appNamespace: "evergreen_trade_journal_v1"
    };
  }

  function optionalNumber(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function tradeToRow(trade, userId, imagePaths = {}) {
    return {
      id: trade.id,
      user_id: userId,
      trade_date: trade.date,
      trade_day: trade.day,
      pair: trade.pair,
      direction: trade.direction,
      session: trade.session,
      htf: trade.htf,
      ltf: trade.ltf,
      trade_status: trade.status,
      entry_attempt: trade.entryAttempt,
      fvg_status: trade.fvgStatus,
      fvg_formed_day: trade.fvgFormed,
      result: trade.result || null,
      sl_pips: optionalNumber(trade.slPips),
      risk_amount: optionalNumber(trade.riskAmount),
      rr: optionalNumber(trade.rr),
      pnl: optionalNumber(trade.pnl),
      htf_analysis: cleanAnalysis(trade.htfAnalysis),
      ltf_analysis: cleanAnalysis(trade.ltfAnalysis),
      htf_chart_links: trade.htfAnalysis?.chartLinks || [],
      ltf_chart_links: trade.ltfAnalysis?.chartLinks || [],
      htf_image_path: imagePaths.htf ?? trade.htfImagePath ?? null,
      ltf_image_path: imagePaths.ltf ?? trade.ltfImagePath ?? null,
      updated_at: new Date().toISOString()
    };
  }

  async function loadTrades() {
    const { data, error } = await requireClient()
      .from(TABLE_TRADES)
      .select("*")
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data || []).map(rowToTrade));
  }

  async function saveTrade(trade) {
    const user = getUser();
    if (!user) throw new Error("Sign in before syncing a trade.");

    const [htfPath, ltfPath] = await Promise.all([
      uploadAnalysisImage("htf", trade, user.id),
      uploadAnalysisImage("ltf", trade, user.id)
    ]);

    const payload = tradeToRow(trade, user.id, { htf: htfPath, ltf: ltfPath });
    const { data, error } = await requireClient()
      .from(TABLE_TRADES)
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return rowToTrade(data);
  }

  async function deleteTrade(trade) {
    const user = getUser();
    if (!user) throw new Error("Sign in before deleting a cloud trade.");

    const paths = [
      trade.htfImagePath || trade.htfAnalysis?.uploadedImage?.path,
      trade.ltfImagePath || trade.ltfAnalysis?.uploadedImage?.path
    ].filter(Boolean);

    const { data, error } = await requireClient()
      .from(TABLE_TRADES)
      .delete()
      .eq("id", trade.id)
      .eq("user_id", user.id)
      .select("id");
    if (error) throw error;

    if (!Array.isArray(data)) {
      throw new Error("Supabase did not confirm the trade deletion.");
    }

    if (paths.length) {
      const { error: storageError } = await requireClient().storage.from(IMAGE_BUCKET).remove(paths);
      if (storageError) console.warn("Trade deleted, but chart image cleanup failed:", storageError);
    }
  }

  async function loadOptions() {
    const { data, error } = await requireClient()
      .from(TABLE_OPTIONS)
      .select("category,label")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function saveOption(category, label) {
    const user = getUser();
    if (!user) throw new Error("Sign in before syncing an option.");
    const { error } = await requireClient()
      .from(TABLE_OPTIONS)
      .upsert({ user_id: user.id, category, label, is_active: true }, {
        onConflict: "user_id,category,label",
        ignoreDuplicates: true
      });
    if (error) throw error;
  }

  async function syncOptions(optionLibrary) {
    const jobs = [];
    for (const label of optionLibrary.poiMitigation || []) jobs.push(saveOption("htf_poi_mitigation", label));
    for (const label of optionLibrary.entryLevel || []) jobs.push(saveOption("ltf_entry_level", label));
    await Promise.all(jobs);
  }

  window.EvergreenCloud = Object.freeze({
    isConfigured,
    init,
    destroy,
    getSession,
    getUser,
    signInWithMagicLink,
    signOut,
    loadTrades,
    saveTrade,
    deleteTrade,
    loadOptions,
    saveOption,
    syncOptions
  });
})();
