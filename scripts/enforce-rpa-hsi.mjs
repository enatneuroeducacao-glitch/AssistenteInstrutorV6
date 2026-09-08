import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const file = path.join(root, "src", "main.jsx");
let source = fs.readFileSync(file, "utf8");

// RPA ÚNICO must never be created when a lesson merely starts.
const startMarker = "      // A primeira aula inaugura o RPA do aluno e passa a funcionar como linha de base.";
const startEndMarker = "      console.log(\"Aula criada:\", data);";
const s = source.indexOf(startMarker);
const e = source.indexOf(startEndMarker, s);
if (s < 0 || e < 0) throw new Error("Guard RPA: bloco de criação no início da aula não encontrado.");
source = source.slice(0, s) + "      // RPA ÚNICO: a emissão ocorre somente após a conclusão válida do HSI-DOTH-P.\n\n" + source.slice(e);

source = source.replace(
  "      setMsg(lessonNumber === 1\n        ? \"1ª aula iniciada. A linha de base do RPA foi preparada para alimentar a evolução do aluno.\"\n        : `Aula ${lessonNumber} iniciada. O RPA do aluno foi atualizado.`);",
  "      setMsg(`Aula ${lessonNumber} iniciada. O RPA ÚNICO será gerado somente após a conclusão do HSI-DOTH-P e da aula.`);"
);

// RPA is created/updated only after the completion gate confirms all five HSI factors.
const rpaStart = "      const rpaUpdate = {";
const rpaEnd = "    if (updated && onCompleted) {";
const rs = source.indexOf(rpaStart);
const re = source.indexOf(rpaEnd, rs);
if (rs < 0 || re < 0) throw new Error("Guard RPA: bloco de atualização no encerramento não encontrado.");

const replacement = `      // RPA ÚNICO só existe depois de um HSI-DOTH-P completo.\n      // A conclusão da aula já foi bloqueada acima quando hsiComplete=false.\n      const { data: existingRpa } = await supabase\n        .from("ai_rpa_reports")\n        .select("id, first_lesson_id, baseline_at, baseline_km_start, baseline_objective, baseline_cnh_category")\n        .eq("user_id", user.id)\n        .eq("student_id", updated.student_id)\n        .maybeSingle();\n\n      const rpaPatch = {\n        user_id: user.id,\n        student_id: updated.student_id,\n        first_lesson_id: existingRpa?.first_lesson_id || updated.id,\n        latest_lesson_id: updated.id,\n        total_lessons: Number(updated.lesson_number || 1),\n        status: "EM_FORMACAO",\n        baseline_captured: true,\n        baseline_at: existingRpa?.baseline_at || endedAt,\n        baseline_km_start: existingRpa?.baseline_km_start ?? Number(updated.km_start),\n        baseline_objective: existingRpa?.baseline_objective || updated.objective || null,\n        baseline_cnh_category: existingRpa?.baseline_cnh_category || updated.cnh_category || null,\n        latest_quality_score: Number((evaluationAverage * 20).toFixed(2)),\n        latest_hsi_score: Number((hsiAverage * 20).toFixed(2)),\n        latest_average: Number(evaluationAverage.toFixed(2)),\n        latest_evaluation: pedagogicalEvaluation,\n        continuity_plan: pedagogicalAnalysis.next_lesson_recommendation || null,\n        latest_notes: mergedNotes || null,\n        updated_at: new Date().toISOString()\n      };\n\n      const { error: rpaError } = await supabase\n        .from("ai_rpa_reports")\n        .upsert(rpaPatch, { onConflict: "user_id,student_id" });\n\n      if (rpaError) {\n        console.error("HSI concluído, mas o RPA ÚNICO não pôde ser emitido:", rpaError);\n        setMessage("A aula foi concluída e o HSI-DOTH-P foi registrado, mas o RPA não pôde ser emitido. O registro será preservado para sincronização administrativa.");\n      }\n\n    }\n\n`;
source = source.slice(0, rs) + replacement + source.slice(re);

fs.writeFileSync(file, source, "utf8");
console.log("RPA ÚNICO protegido: emissão somente após HSI-DOTH-P completo.");
