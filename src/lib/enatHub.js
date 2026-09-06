import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const SOURCE_KEY = "assistenteinstrutorv6";
const INSTRUMENT = "HSI-DOTH-P";
const INSTRUMENT_VERSION = "1.0";

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
