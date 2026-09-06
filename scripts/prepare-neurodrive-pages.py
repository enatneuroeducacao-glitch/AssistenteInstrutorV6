from pathlib import Path

p = Path("src/main.jsx")
s = p.read_text(encoding="utf-8")

# Visible product identity: keep internal code names intact, but present
# the user-facing application consistently as Assistente NeuroDrive ENAT.
s = s.replace("ENAT - Assistente do Instrutor", "Assistente NeuroDrive ENAT")
s = s.replace("Assistente do Instrutor", "Assistente NeuroDrive ENAT")
s = s.replace("ASSISTENTE DO INSTRUTOR", "ASSISTENTE NEURODRIVE ENAT")
s = s.replace("Assistente do instrutor", "Assistente NeuroDrive ENAT")

# Dynamic header date: remove the stale hard-coded date from the visible shell.
s = s.replace(
    '<div className="header-date">📅 25 de agosto de 2026</div>',
    '<div className="header-date">📅 {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>',
    1,
)

# Lesson phase integrity: the next phase is unlocked only after the current
# phase has been explicitly closed. The DB migration adds phase_completed_at.
old_advance = '''  async function advancePhase() {
    if (readOnly || busy || isFinished) return;

    if (currentPhase >= 5) {
      setMessage("A última fase é a Parada Segura. Para concluir, informe o KM final e finalize a aula.");
      return;
    }

    const nextPhase = currentPhase + 1;
    await updateLesson(
      { phase: nextPhase, status: "running" },
      `Fase atualizada para ${lessonPhaseLabel(nextPhase)}.`
    );
  }

  async function pauseLesson() {'''
new_advance = '''  async function advancePhase() {
    if (readOnly || busy || isFinished || status === "paused") return;

    if (currentPhase >= 5) {
      setMessage("A última fase é a Parada Segura. Registre a parada segura e depois conclua a aula.");
      return;
    }

    // Two-step close/advance keeps the current phase closure explicit in the
    // database. If the second write fails, the phase remains closed and the
    // next attempt can safely finish the transition without losing the event.
    if (!currentLesson?.phase_completed_at) {
      const closed = await updateLesson(
        { phase_completed_at: new Date().toISOString() },
        `${lessonPhaseLabel(currentPhase)} concluída. Liberando a próxima fase...`
      );
      if (!closed) return;
    }

    const nextPhase = currentPhase + 1;
    await updateLesson(
      { phase: nextPhase, status: "running", phase_completed_at: null },
      `Fase atualizada para ${lessonPhaseLabel(nextPhase)}.`
    );
  }

  async function markSafeStop() {
    if (readOnly || busy || isFinished || status === "paused") return;

    if (currentPhase !== 5) {
      setMessage("A Parada Segura só pode ser registrada na fase 5.");
      return;
    }

    if (currentLesson?.safe_stop_at) {
      setMessage("Parada Segura já registrada.");
      return;
    }

    await updateLesson(
      { safe_stop_at: new Date().toISOString() },
      "Parada Segura registrada. A aula está pronta para conclusão."
    );
  }

  async function pauseLesson() {'''
if old_advance not in s:
    raise SystemExit("advancePhase block not found; build stopped safely.")
s = s.replace(old_advance, new_advance, 1)

# Completion integrity: phase 5 must have an explicit safe-stop event.
s = s.replace(
    '''    if (currentPhase !== 5) {
      setMessage("A aula só pode ser concluída após a fase 5 — Parada Segura.");
      return;
    }

    if (!evaluationComplete) {''',
    '''    if (currentPhase !== 5) {
      setMessage("A aula só pode ser concluída após a fase 5 — Parada Segura.");
      return;
    }

    if (!currentLesson?.safe_stop_at) {
      setMessage("Registre a Parada Segura antes de concluir a aula.");
      return;
    }

    if (!evaluationComplete) {''',
    1,
)

# Phase-5 controls: safe stop becomes an explicit green transition before the
# final lesson completion action.
old_controls = '''              <button
                type="button"
                onClick={advancePhase}
                disabled={busy || isFinished || status === "paused" || currentPhase >= 5}
              >
                {currentPhase < 5 ? `CONCLUIR ${lessonPhaseLabel(currentPhase)}` : "FASE FINAL"}
              </button>
            </div>'''
new_controls = '''              <button
                type="button"
                onClick={advancePhase}
                disabled={busy || isFinished || status === "paused" || currentPhase >= 5}
              >
                {currentPhase < 5 ? `CONCLUIR ${lessonPhaseLabel(currentPhase)}` : "FASE FINAL"}
              </button>
              {currentPhase === 5 && (
                <button
                  type="button"
                  onClick={markSafeStop}
                  disabled={busy || isFinished || status === "paused" || !!currentLesson?.safe_stop_at}
                  style={{
                    background: currentLesson?.safe_stop_at ? "#2e7d32" : undefined,
                    color: currentLesson?.safe_stop_at ? "#fff" : undefined
                  }}
                >
                  {currentLesson?.safe_stop_at ? "✓ PARADA SEGURA REGISTRADA" : "REGISTRAR PARADA SEGURA"}
                </button>
              )}
            </div>'''
if old_controls not in s:
    raise SystemExit("phase control block not found; build stopped safely.")
s = s.replace(old_controls, new_controls, 1)

# Final completion button: it remains locked until the explicit safe-stop event.
s = s.replace(
    '''              disabled={busy || isFinished || status === "paused" || currentPhase !== 5}
            >
              CONCLUIR AULA
            </button>''',
    '''              disabled={busy || isFinished || status === "paused" || currentPhase !== 5 || !currentLesson?.safe_stop_at}
            >
              CONCLUIR AULA
            </button>''',
    1,
)

# Status summary uses the real safe-stop timestamp when present.
s = s.replace(
    '["STATUS", status === "completed" ? "CONCLUÍDA" : status === "paused" ? "PAUSADA" : "EM ANDAMENTO"],',
    '["STATUS", status === "completed" ? "CONCLUÍDA" : status === "paused" ? "PAUSADA" : currentLesson?.safe_stop_at ? "PARADA SEGURA" : "EM ANDAMENTO"],',
    1,
)

s = s.replace(
    '["DURAÇÃO", elapsedMinutes() != null ? `${elapsedMinutes()} min` : "—"]',
    '["DURAÇÃO", elapsedMinutes() != null ? `${elapsedMinutes()} min` : "—"]',
    1,
)

s = s.replace(
    '<p style={{ marginTop: 0 }}>Na Parada Segura, informe o KM final e registre observações.</p>',
    '<p style={{ marginTop: 0 }}>Na Parada Segura, registre explicitamente a parada, informe o KM final e depois conclua a aula.</p>',
    1,
)

# Donation copy: the core is free, while separately governed course access may
# still have its own commercial/access policy. This removes the contradiction
# introduced by the old subscription wording.
s = s.replace(
    'Não existe cobrança recorrente e nenhuma funcionalidade é condicionada à contribuição.',
    'Não existe cobrança recorrente para esta contribuição. O núcleo do NeuroDrive é gratuito; cursos e formações podem possuir regras próprias de acesso.',
    1,
)

# Preserve the current build-only free-core policy: the Pages build must not
# gate the operational NeuroDrive modules behind the legacy subscription layer.
s = s.replace(
    'const protectedTabs = new Set(["alunos", "agenda", "aulas", "hsi", "rpa", "financeiro"]);',
    'const protectedTabs = new Set([]);',
    1,
)

# The current Pages build keeps legacy subscription infrastructure dormant.
s = s.replace(
    'const pages = {',
    'const pages = {',
    1,
)

old_call = '<SubscriptionPage user={user} subscription={subscription} onRefresh={() => { setSubscriptionLoading(true); setTimeout(() => window.location.reload(), 250); }} onBack={() => setTab("dashboard")} />'
new_call = '<DonationPage user={user} onBack={() => setTab("dashboard")} />'
if old_call not in s:
    raise SystemExit("SubscriptionPage call not found; build stopped safely.")
s = s.replace(old_call, new_call, 1)

start = s.find("function SubscriptionPage(")
end = s.find("\nfunction Root()", start)
if start < 0 or end < 0:
    raise SystemExit("SubscriptionPage boundaries not found; build stopped safely.")

donation = '''function DonationPage({ user, onBack }) {
  const pixKey = "enat.neuroeducacao@gmail.com";
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      <div className="panel" style={{ padding: 30 }}>
        <button type="button" className="link" onClick={onBack}>VOLTAR</button>
        <div style={{ textAlign: "center", maxWidth: 780, margin: "10px auto 0" }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>💙</div>
          <small style={{ fontWeight: 900, letterSpacing: ".08em", color: "#55BFEF" }}>ENAT — NEURODRIVE</small>
          <h1 style={{ margin: "8px 0" }}>Apoie a continuidade do NeuroDrive</h1>
          <p style={{ color: "#5f6b7a", lineHeight: 1.7, fontSize: 16 }}>
            O NeuroDrive é uma iniciativa do ENAT para oferecer aos instrutores de trânsito ferramentas de organização,
            acompanhamento pedagógico e inteligência aplicada à segurança viária.
          </p>
          <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 12, background: "#eef9fe", border: "1px solid #bfe8f8", color: "#17456b", fontWeight: 800 }}>
            O acesso ao NeuroDrive é gratuito.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 24 }}>
          <div className="panel" style={{ padding: 22, background: "#f8fbfe" }}>
            <h2 style={{ marginTop: 0 }}>Por que contribuir?</h2>
            <p style={{ color: "#5f6b7a", lineHeight: 1.65 }}>
              A manutenção da plataforma envolve hospedagem, infraestrutura, segurança, banco de dados,
              desenvolvimento, suporte e evolução contínua das ferramentas do ENAT.
            </p>
            <p style={{ color: "#5f6b7a", lineHeight: 1.65, marginBottom: 0 }}>
              Se o sistema é útil para você e deseja ajudar na sua continuidade, qualquer contribuição espontânea será bem-vinda.
            </p>
          </div>

          <div className="panel" style={{ padding: 22, border: "2px solid #55BFEF" }}>
            <small style={{ color: "#55BFEF", fontWeight: 900, letterSpacing: ".08em" }}>CONTRIBUIÇÃO VOLUNTÁRIA</small>
            <h2 style={{ margin: "7px 0" }}>Apoio via PIX</h2>
            <p style={{ color: "#5f6b7a", lineHeight: 1.55 }}>
              Escolha livremente o valor que deseja contribuir. Não existe cobrança recorrente para esta contribuição. O núcleo do NeuroDrive é gratuito; cursos e formações podem possuir regras próprias de acesso.
            </p>
            <div style={{ padding: 14, borderRadius: 10, background: "#fff", border: "1px solid #dbe5f2", wordBreak: "break-word", fontWeight: 800 }}>
              {pixKey}
            </div>
            <button type="button" onClick={copyPix} style={{ width: "100%", marginTop: 12 }}>
              {copied ? "✓ CHAVE PIX COPIADA" : "📋 COPIAR CHAVE PIX"}
            </button>
            <p style={{ fontSize: 12, color: "#7a8694", lineHeight: 1.5, marginBottom: 0 }}>
              Antes de confirmar a transferência, confira o destinatário exibido pelo seu banco.
            </p>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16, padding: 22 }}>
          <h2 style={{ marginTop: 0 }}>Nosso compromisso</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>✓ Manter o núcleo do NeuroDrive acessível aos instrutores.</div>
            <div>✓ Continuar desenvolvendo ferramentas para a prática profissional.</div>
            <div>✓ Ampliar a inteligência comportamental aplicada à segurança no trânsito.</div>
            <div>✓ Preservar a privacidade dos registros individuais e utilizar indicadores agregados de forma responsável.</div>
          </div>
        </div>

        <div style={{ marginTop: 18, padding: 18, textAlign: "center", borderTop: "1px solid #dbe5f2", color: "#667780", lineHeight: 1.65 }}>
          <strong style={{ color: "#243b67" }}>“O NeuroDrive é gratuito porque a segurança no trânsito deve produzir conhecimento, não barreiras.”</strong>
          <br />
          <span>ENAT — Ensino Neuroeducacional Aplicado ao Trânsito</span>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <small style={{ color: "#7a8694" }}>Contato: enat.neuroeducacao@gmail.com</small>
        </div>
      </div>
    </div>
  );
}
'''

s = s[:start] + donation + s[end:]
p.write_text(s, encoding="utf-8")
