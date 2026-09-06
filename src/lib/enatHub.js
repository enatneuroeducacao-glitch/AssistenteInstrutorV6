import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Sends an aggregated HSI-DOTH-P result to the Central ENAT Hub.
 * No CPF, name, e-mail, student id or lesson id is sent as a source identifier.
 * The source_record_id must be a non-PII stable UUID generated for the assessment.
 */
export async function sendHSIAssessmentToCentral({
  sourceRecordId,
  observedAt = new Date().toISOString(),
  uf = null,
  municipalityCode = null,
  ageBand = null,
  cnhCategory = null,
  cargo = null,
  instrument = "HSI-DOTH-P",
  instrumentVersion = null,
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
      source_key: "assistenteinstrutorv6",
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
