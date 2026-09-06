from pathlib import Path

p = Path("src/main.jsx")
s = p.read_text(encoding="utf-8")

s = s.replace(
    '["assinatura", "ASSINATURA ENAT", BadgeCheck]',
    '["assinatura", "APOIE O NEURODRIVE", BadgeCheck]',
    1,
)

s = s.replace(
    '"Assinatura ENAT",\n    "Plano Profissional recorrente de R$ 50,00 por mês, com funcionalidades e cursos incluídos.",\n    "ASSINAR"',
    '"Apoie o NeuroDrive",\n    "Contribuição espontânea para manutenção e evolução do sistema.",\n    "APOIAR"',
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
              Escolha livremente o valor que deseja contribuir. Não existe cobrança recorrente e nenhuma funcionalidade é condicionada à contribuição.
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
