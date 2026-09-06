import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const SOURCE_KEY = "assistenteinstrutorv6";
const INSTRUMENT = "HSI-DOTH-P";
const INSTRUMENT_VERSION = "1.0";
const LESSONS_REST_PATH = "/rest/v1/ai_lessons";
const SYNC_GUARD = "__ENAT_HSI_LESSON_FETCH_BRIDGE__";

/**
 * Creates a deterministic opaque UUID from a local lesson UUID.
 * The Central Hub receives only this derived technical identifier.
 */
export async function buildStableHSISourceRecordId(localRecordId) {
  if (!localRecordId) throw new Error("localRecordId é obrigatório.");
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto não está disponível.");

  const bytes = new TextEncoder().encode(`ENAT-HSI:${localRecordId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

  // UUID-shaped opaque identifier; the original local id is never transmitted.
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function sendHSIAssessmentToCentral({
  sourceRecordId,
  observedAt = new Date().toISOString(),
  uf = null,
  municipalityCode = null,
  ageBand = null,
  cnhCategory = null,
  cargo = null,
  instrument = INSTRUMENT,
  instrumentVersion = INSTRUMENT_VERSION,
  totalScore = null,
  riskClass = null,
  dimensions = {},
  payloadDigest = null,
}) {
  if (!supabase) throw new Error("Supabase não está configurado para a integração ENAT Hub.");
  if (!sourceRecordId) throw new Error("sourceRecordId é obrigatório para sincronizar a avaliação.");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Sessão do instrutor não autenticada.");

  const { data, error } = await supabase.functions.invoke("enat-hub-ingest", {
    body: {
      source_key: SOURCE_KEY,
      source_record_id: sourceRecordId,
      observed_at: observedAt,
      uf,
      municipality_code: municipalityCode,
      age_band: ageBand,
      cnh_category: cnhCategory,
      cargo,
      instrument,
      instrument_version: instrumentVersion,
      total_score: totalScore,
      risk_class: riskClass,
      dimensions,
      payload_digest: payloadDigest,
    },
  });

  if (error) throw new Error(error.message || "Falha ao sincronizar com a Central ENAT HSI.");
  return data;
}

function parseHSINote(notes) {
  const match = String(notes || "").match(/\[HSI-DOTH-P\]\s*(\{[\s\S]*?\})(?:\n|$)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (!parsed?.scores) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeHSIAgeBand(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 18) return "<18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  if (age <= 64) return "55-64";
  return "65+";
}

/**
 * Syncs a completed local lesson. Failure is deliberately non-blocking.
 */
export async function syncCompletedHSILesson(lesson, { studentBirthDate = null, uf = null, municipalityCode = null } = {}) {
  if (!lesson?.id || String(lesson.status || "").toLowerCase() !== "completed") return { skipped: true };

  const hsi = parseHSINote(lesson.notes);
  if (!hsi) return { skipped: true, reason: "HSI-DOTH-P não encontrado" };

  const sourceRecordId = await buildStableHSISourceRecordId(lesson.id);
  const dimensions = Object.fromEntries(
    Object.entries(hsi.scores || {}).map(([key, value]) => [key, Number(value) * 20])
  );

  return sendHSIAssessmentToCentral({
    sourceRecordId,
    observedAt: lesson.ended_at || hsi.completed_at || new Date().toISOString(),
    uf: uf || lesson.uf || null,
    municipalityCode: municipalityCode || lesson.municipality_code || null,
    ageBand: normalizeHSIAgeBand(studentBirthDate),
    cnhCategory: lesson.cnh_category || null,
    cargo: "INSTRUTOR_DE_TRANSITO",
    instrument: INSTRUMENT,
    instrumentVersion: INSTRUMENT_VERSION,
    totalScore: Number(hsi.normalized_score),
    riskClass: hsi.classification || null,
    dimensions,
    payloadDigest: null,
  });
}

/**
 * Direct completion bridge.
 *
 * main.jsx imports RPAForm at application startup, so this module is loaded
 * before a lesson is executed. We observe only successful REST representations
 * of ai_lessons updates and trigger the Central sync when the returned lesson
 * is actually completed. No local PII is sent to the Central Hub.
 *
 * The guard makes the bridge idempotent at the browser-hook level and avoids
 * installing multiple fetch wrappers during React StrictMode/HMR reloads.
 */
function installLessonCompletionBridge() {
  if (!supabase || typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window[SYNC_GUARD]) return;

  const originalFetch = window.fetch.bind(window);

  const bridgedFetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const request = args[0];
      const init = args[1] || {};
      const url = typeof request === "string" ? request : request?.url || "";
      const method = String(init.method || request?.method || "GET").toUpperCase();

      if (!url.includes(LESSONS_REST_PATH) || method !== "PATCH" || !response.ok) {
        return response;
      }

      const cloned = response.clone();
      const payload = await cloned.json();
      const lessons = Array.isArray(payload) ? payload : [payload];

      for (const lesson of lessons) {
        if (String(lesson?.status || "").toLowerCase() !== "completed") continue;
        if (!lesson?.id || !parseHSINote(lesson.notes)) continue;

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const uf = sessionData?.session?.user?.user_metadata?.uf || null;
          await syncCompletedHSILesson(lesson, { uf });
        } catch (syncError) {
          // Never block or fail the local lesson operation because Central is unavailable.
          console.warn("Sincronização direta HSI-DOTH-P com a Central pendente:", syncError);
        }
      }
    } catch (bridgeError) {
      // The response returned to the app is never altered by the bridge.
      console.warn("Ponte direta ENAT HSI não pôde processar a conclusão:", bridgeError);
    }

    return response;
  };

  window.fetch = bridgedFetch;
  window[SYNC_GUARD] = true;
}

installLessonCompletionBridge();
