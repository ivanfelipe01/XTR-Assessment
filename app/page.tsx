"use client";

import { useEffect, useMemo, useState } from "react";
import { pillars, maturityForScore, type Pillar } from "./assessment-data";

type View = "overview" | "questionnaire" | "findings" | "report";
type AnswerState = Record<string, { score: number; note: string }>;

const demoAnswers: AnswerState = Object.fromEntries(
  pillars.flatMap((pillar) =>
    pillar.questions.map((question, index) => [
      question.id,
      { score: index % 3 === 0 ? question.max : index % 3 === 1 ? Math.round(question.max / 2) : 0, note: "" },
    ]),
  ),
);

const emptyAnswers: AnswerState = Object.fromEntries(
  pillars.flatMap((pillar) => pillar.questions.map((question) => [question.id, { score: 0, note: "" }])),
);

function scoreColor(score: number) {
  if (score <= 20) return "var(--danger)";
  if (score <= 47) return "var(--warning)";
  if (score <= 61) return "#d7cc35";
  if (score <= 74) return "var(--cyan)";
  return "var(--success)";
}

function PillarBars({ answers }: { answers: AnswerState }) {
  return (
    <div className="pillar-bars">
      {pillars.map((pillar) => {
        const total = pillar.questions.reduce((sum, q) => sum + (answers[q.id]?.score ?? 0), 0);
        return (
          <div className="pillar-row" key={pillar.id}>
            <span className="pillar-icon standardized"><img src="/pillar-result-icon.png" alt="" /></span>
            <div className="pillar-copy"><b>{pillar.name}</b><small>{total}/20 pontos</small></div>
            <div className="bar"><i style={{ width: `${total * 5}%`, background: pillar.color }} /></div>
            <strong style={{ color: pillar.color }}>{total}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [answers, setAnswers] = useState<AnswerState>(demoAnswers);
  const [client, setClient] = useState("Cliente demonstração");
  const [activePillar, setActivePillar] = useState(0);
  const [saved, setSaved] = useState(true);
  const [exporting, setExporting] = useState(false);

  const pillarScores = useMemo(
    () => pillars.map((pillar) => pillar.questions.reduce((sum, q) => sum + (answers[q.id]?.score ?? 0), 0)),
    [answers],
  );
  const totalScore = pillarScores.reduce((sum, score) => sum + score, 0);
  const maturity = maturityForScore(totalScore);
  const findings = useMemo(
    () => pillars.flatMap((pillar) => pillar.questions.filter((q) => (answers[q.id]?.score ?? 0) < q.max).map((q) => ({ pillar, question: q, score: answers[q.id]?.score ?? 0 }))),
    [answers],
  );

  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/assessments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: "current", client, answers, score: totalScore, maturity: maturity.label }),
        });
        setSaved(true);
      } catch { /* stays as a draft in the current session */ }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, client, maturity.label, saved, totalScore]);

  const updateAnswer = (id: string, patch: Partial<AnswerState[string]>) => {
    setAnswers((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    setSaved(false);
  };

  const exportDeck = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client, answers, pillarScores, totalScore, maturity: maturity.label, findings }),
      });
      if (!response.ok) throw new Error("export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `XTR-Assessment-${client.replace(/[^a-z0-9]+/gi, "-")}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-logo" src="/xtr-assessment-logo.png" alt="XTR Assessment" /></div>
        <nav aria-label="Navegação principal">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>⌁</span> Visão geral</button>
          <button className={view === "questionnaire" ? "active" : ""} onClick={() => setView("questionnaire")}><span>◫</span> Questionário</button>
          <button className={view === "findings" ? "active" : ""} onClick={() => setView("findings")}><span>△</span> Achados <em>{findings.length}</em></button>
          <button className={view === "report" ? "active" : ""} onClick={() => setView("report")}><span>▤</span> Relatório</button>
        </nav>
        <div className="sidebar-foot xtreme-credit"><small>Powered by</small><img src="/xtreme-it-logo.png" alt="Xtreme IT" /></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-brand"><img src="/xtr-assessment-logo.png" alt="" /><p>XTR ASSESSMENT <span>/</span> {view === "overview" ? "VISÃO GERAL" : view.toUpperCase()}</p></div>
          <div className="top-actions"><span className="save-state"><i />{saved ? "Salvo agora" : "Salvando..."}</span><button className="primary" onClick={exportDeck} disabled={exporting}>{exporting ? "Gerando..." : "Exportar PowerPoint"}</button></div>
        </header>

        {view === "overview" && (
          <div className="page overview-page">
            <div className="page-title"><div><span className="eyebrow">DIAGNÓSTICO ATUAL</span><h1>Maturidade em Resiliência de Dados</h1><p>Visão consolidada do nível de proteção, prontidão e governança.</p></div><label>CLIENTE<input value={client} onChange={(e) => { setClient(e.target.value); setSaved(false); }} /></label></div>
            <section className="hero-grid">
              <article className="score-card glow-card">
                <div className="score-orbit" style={{ "--score": `${totalScore}%`, "--score-color": scoreColor(totalScore) } as React.CSSProperties}><div><strong style={{ color: scoreColor(totalScore) }}>{totalScore}</strong><span>/100</span><small>PONTOS</small></div></div>
                <div className="score-copy"><span>NÍVEL DE MATURIDADE</span><h2 style={{ color: scoreColor(totalScore) }}>{maturity.label}</h2><p>{maturity.description}</p><div className="scale"><i style={{ left: `${totalScore}%` }} /><span>0</span><span>20</span><span>47</span><span>61</span><span>74</span><span>100</span></div></div>
              </article>
              <article className="radar-card glow-card"><div className="section-head"><div><span>MATURIDADE POR PILAR</span><h3>Equilíbrio de capacidades</h3></div><b>ATUAL</b></div><div className="radar-wrap"><div className="radar"><i style={{ clipPath: `polygon(50% ${50 - pillarScores[0] * 2.2}%, ${50 + pillarScores[1] * 2.1}% ${50 - pillarScores[1] * .6}%, ${50 + pillarScores[2] * 1.3}% ${50 + pillarScores[2] * 1.8}%, ${50 - pillarScores[3] * 1.3}% ${50 + pillarScores[3] * 1.8}%, ${50 - pillarScores[4] * 2.1}% ${50 - pillarScores[4] * .6}%)` }} /></div><div className="radar-legend"><span>Fundamentos de<br />Proteção de Dados</span><span>Replicação e<br />Controles</span><span>Isolamento e<br />Compliance</span><span>Resposta e<br />Prontidão</span><span>Governança e<br />Gestão</span></div></div></article>
            </section>
            <section className="content-grid"><article className="panel"><div className="section-head"><div><span>DESEMPENHO</span><h3>Resultado por pilar</h3></div><button onClick={() => setView("questionnaire")}>Revisar respostas →</button></div><PillarBars answers={answers} /></article><article className="panel priority"><div className="section-head"><div><span>ATENÇÃO IMEDIATA</span><h3>Gaps prioritários</h3></div><em>{findings.filter((f) => f.score === 0).length} críticos</em></div>{findings.slice(0, 3).map(({ pillar, question }) => <div className="finding-mini" key={question.id}><span style={{ color: pillar.color }}>{pillar.icon}</span><div><b>{question.title}</b><small>{question.risk}</small></div><i>ALTA</i></div>)}<button className="full-link" onClick={() => setView("findings")}>Ver todos os achados</button></article></section>
            <section className="frameworks"><span>CROSS-COMPLIANCE</span><b>ISO/IEC 27001:2022</b><b>NIST CSF 2.0</b><b>LGPD</b><small>Mapeamentos são exposições potenciais e requerem validação especializada.</small></section>
          </div>
        )}

        {view === "questionnaire" && (
          <div className="page questionnaire-page">
            <div className="page-title"><div><span className="eyebrow">QUESTIONÁRIO BASE</span><h1>Avaliação por pilar</h1><p>Registre a pontuação e as evidências observadas no ambiente.</p></div><div className="progress-ring">{totalScore}<small>/100</small></div></div>
            <div className="pillar-tabs" role="tablist">{pillars.map((pillar, index) => <button key={pillar.id} className={activePillar === index ? "active" : ""} onClick={() => setActivePillar(index)} style={{ "--pillar": pillar.color } as React.CSSProperties}><span>{pillar.icon}</span><div><small>PILAR {index + 1}</small><b>{pillar.name}</b></div><em>{pillarScores[index]}/20</em></button>)}</div>
            <QuestionList pillar={pillars[activePillar]} answers={answers} updateAnswer={updateAnswer} />
          </div>
        )}

        {view === "findings" && (
          <div className="page"><div className="page-title"><div><span className="eyebrow">EXPOSIÇÕES E RISCOS</span><h1>Achados priorizados</h1><p>Cruzamento técnico com ISO/IEC 27001, NIST CSF 2.0 e LGPD.</p></div><div className="stat-pill"><strong>{findings.length}</strong><span>achados<br />ativos</span></div></div><div className="findings-table"><div className="table-head"><span>ACHADO</span><span>CRITICIDADE</span><span>ISO 27001</span><span>NIST</span><span>LGPD</span></div>{findings.map(({ pillar, question, score }, index) => <div className="table-row" key={question.id}><span><i>{String(index + 1).padStart(2, "0")}</i><div><b>{question.title}</b><small>{pillar.name} · {score}/{question.max} pontos</small></div></span><em className={score === 0 ? "critical" : "medium"}>{score === 0 ? "CRÍTICA" : "MÉDIA"}</em><code>{question.iso}</code><code>{question.nist}</code><code>{question.lgpd}</code></div>)}</div></div>
        )}

        {view === "report" && (
          <div className="page report-page"><div className="page-title"><div><span className="eyebrow">RELATÓRIO EXECUTIVO</span><h1>Prévia da apresentação</h1><p>Conteúdo estruturado para o padrão institucional XTR Assessment.</p></div><button className="primary large" onClick={exportDeck}>{exporting ? "Gerando apresentação..." : "Gerar PowerPoint editável"}</button></div><div className="deck-preview"><div className="deck-slide"><div className="deck-brand">XTREME IT</div><div><span>ASSESSMENT DE MATURIDADE</span><h2>EM <b>RESILIÊNCIA DE DADOS</b></h2><p>{client}</p></div><img className="deck-logo" src="/xtr-assessment-logo.png" alt="XTR Assessment" /></div><div className="deck-outline"><h3>Estrutura prevista</h3>{["Capa e objetivo", "Diagnóstico atual", "Maturidade por pilar", "Exposições ISO/IEC 27001", "Exposições NIST CSF", "Exposições LGPD", "Conclusões e próximos passos"].map((item, i) => <div key={item}><span>{String(i + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</div></div></div>
        )}
      </section>
    </main>
  );
}

function QuestionList({ pillar, answers, updateAnswer }: { pillar: Pillar; answers: AnswerState; updateAnswer: (id: string, patch: Partial<AnswerState[string]>) => void }) {
  return <section className="question-list"><div className="question-intro"><span style={{ color: pillar.color }}>{pillar.icon}</span><div><small>{pillar.name.toUpperCase()}</small><h2>{pillar.description}</h2></div><strong>{pillar.questions.reduce((sum, q) => sum + answers[q.id].score, 0)}<small>/20</small></strong></div>{pillar.questions.map((q, index) => <article className="question-card" key={q.id}><div className="question-number">{String(index + 1).padStart(2, "0")}</div><div className="question-main"><h3>{q.title}</h3><p>{q.risk}</p><div className="framework-tags"><span>{q.iso}</span><span>{q.nist}</span><span>{q.lgpd}</span></div><textarea aria-label={`Observação para ${q.title}`} placeholder="Descreva a evidência ou observação técnica..." value={answers[q.id].note} onChange={(e) => updateAnswer(q.id, { note: e.target.value })} /></div><div className="score-selector"><label>PONTUAÇÃO</label><strong style={{ color: answers[q.id].score === q.max ? "var(--success)" : answers[q.id].score === 0 ? "var(--danger)" : "var(--warning)" }}>{answers[q.id].score}<small>/{q.max}</small></strong><input type="range" min="0" max={q.max} value={answers[q.id].score} onChange={(e) => updateAnswer(q.id, { score: Number(e.target.value) })} style={{ "--value": `${(answers[q.id].score / q.max) * 100}%` } as React.CSSProperties} /><div><span>Não atende</span><span>Atende</span></div></div></article>)}</section>;
}
