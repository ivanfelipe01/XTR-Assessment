"use client";

import { useEffect, useMemo, useState } from "react";
import { pillars, maturityForScore, type Pillar } from "./assessment-data";
import { mapObservation, observationFindingId, type AssessmentObservation } from "./observation-mapping";

type View = "overview" | "questionnaire" | "isg" | "findings";
type AnswerState = Record<string, { score: number; note: string }>;
type Vulnerability = { id: string; severity: string; score: number | null; description: string; risk: string; url: string; matchStatus: string; serverId: string; server: string; site: string; version: string; identifiedProduct?: string };
type SoftwareEntry = { id: string; server: string; site: string; version: string; checking: boolean; checkedAt?: string; error?: string; identifiedProduct?: string };
type AssessmentFile = { schemaVersion?: number; assessmentId?: string; client?: string; specialist?: string; exportedAt?: string; answers?: AnswerState; isgAnswers?: AnswerState; software?: SoftwareEntry[]; vulnerabilities?: Vulnerability[]; observations?: AssessmentObservation[]; excludedFindingIds?: string[] };

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

const projectedAnswers = (source: AnswerState): AnswerState => Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => {
  const current = Math.max(0, Math.min(question.max, source[question.id]?.score ?? 0));
  return [question.id, { score: Math.min(question.max, current + Math.ceil((question.max - current) * .7)), note: source[question.id]?.note ?? "" }];
})));

const radarPolygon = (scores: number[]) => `polygon(50% ${50 - (scores[0] ?? 0) * 2.2}%, ${50 + (scores[1] ?? 0) * 2.1}% ${50 - (scores[1] ?? 0) * .6}%, ${50 + (scores[2] ?? 0) * 1.3}% ${50 + (scores[2] ?? 0) * 1.8}%, ${50 - (scores[3] ?? 0) * 1.3}% ${50 + (scores[3] ?? 0) * 1.8}%, ${50 - (scores[4] ?? 0) * 2.1}% ${50 - (scores[4] ?? 0) * .6}%)`;

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
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [newAssessmentOpen, setNewAssessmentOpen] = useState(false);
  const [specialist, setSpecialist] = useState("");
  const [assessmentId, setAssessmentId] = useState(() => crypto.randomUUID());
  const [importError, setImportError] = useState("");
  const [view, setView] = useState<View>("overview");
  const [answers, setAnswers] = useState<AnswerState>(demoAnswers);
  const [isgAnswers, setIsgAnswers] = useState<AnswerState>(() => projectedAnswers(demoAnswers));
  const [client, setClient] = useState("Cliente demonstração");
  const [activePillar, setActivePillar] = useState(0);
  const [isgActivePillar, setIsgActivePillar] = useState(0);
  const [software, setSoftware] = useState<SoftwareEntry[]>([{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [observations, setObservations] = useState<AssessmentObservation[]>([]);
  const [excludedFindingIds, setExcludedFindingIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(true);
  const [exporting, setExporting] = useState(false);

  const pillarScores = useMemo(
    () => pillars.map((pillar) => pillar.questions.reduce((sum, q) => sum + (answers[q.id]?.score ?? 0), 0)),
    [answers],
  );
  const totalScore = pillarScores.reduce((sum, score) => sum + score, 0);
  const isgPillarScores = useMemo(() => pillars.map((pillar) => pillar.questions.reduce((sum, question) => sum + (isgAnswers[question.id]?.score ?? 0), 0)), [isgAnswers]);
  const isgTotalScore = isgPillarScores.reduce((sum, score) => sum + score, 0);
  const maturity = maturityForScore(totalScore);
  const isgMaturity = maturityForScore(isgTotalScore);
  const allFindings = useMemo(
    () => pillars.flatMap((pillar) => pillar.questions.filter((q) => (answers[q.id]?.score ?? 0) < q.max).map((q) => ({ pillar, question: q, score: answers[q.id]?.score ?? 0 }))),
    [answers],
  );
  const findings = useMemo(() => allFindings.filter(({ question }) => !excludedFindingIds.includes(question.id)), [allFindings, excludedFindingIds]);
  const activeObservationFindings = useMemo(() => observations.filter((observation) => observation.text.trim() && !excludedFindingIds.includes(observationFindingId(observation.id))), [excludedFindingIds, observations]);
  const findingCount = findings.length + vulnerabilities.length + activeObservationFindings.length;

  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/assessments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: assessmentId, client, answers: { specialist, answers, isgAnswers, software, vulnerabilities, observations, excludedFindingIds }, score: totalScore, maturity: maturity.label }),
        });
        setSaved(true);
      } catch { /* stays as a draft in the current session */ }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, assessmentId, client, excludedFindingIds, isgAnswers, maturity.label, observations, saved, software, specialist, totalScore, vulnerabilities]);

  const createAssessment = () => {
    if (!client.trim() || !specialist.trim()) return;
    setAssessmentId(crypto.randomUUID());
    setAnswers(emptyAnswers);
    setIsgAnswers(projectedAnswers(emptyAnswers));
    setSoftware([{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
    setVulnerabilities([]);
    setObservations([]);
    setExcludedFindingIds([]);
    setView("overview");
    setActivePillar(0);
    setNewAssessmentOpen(false);
    setAssessmentStarted(true);
    setSaved(false);
  };

  const importAssessment = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      const imported = JSON.parse(await file.text()) as AssessmentFile;
      if (!imported.client || !imported.answers || typeof imported.answers !== "object") throw new Error("Arquivo incompatível");
      const legacyContainer = imported.answers as AnswerState & { answers?: AnswerState; isgAnswers?: AnswerState; specialist?: string };
      const sourceAnswers = legacyContainer.answers && typeof legacyContainer.answers === "object" ? legacyContainer.answers : imported.answers;
      const sourceIsgAnswers = imported.isgAnswers && typeof imported.isgAnswers === "object" ? imported.isgAnswers : legacyContainer.isgAnswers;
      const normalizedAnswers: AnswerState = Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => {
        const value = sourceAnswers?.[question.id];
        return [question.id, { score: Math.max(0, Math.min(question.max, Number(value?.score) || 0)), note: typeof value?.note === "string" ? value.note : "" }];
      })));
      setAssessmentId(imported.assessmentId || crypto.randomUUID());
      setClient(imported.client.trim());
      setSpecialist(typeof imported.specialist === "string" ? imported.specialist : typeof legacyContainer.specialist === "string" ? legacyContainer.specialist : "Não informado");
      setAnswers(normalizedAnswers);
      const importedIsg = sourceIsgAnswers && typeof sourceIsgAnswers === "object" ? Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => { const value = sourceIsgAnswers[question.id]; return [question.id, { score: Math.max(0, Math.min(question.max, Number(value?.score) || 0)), note: typeof value?.note === "string" ? value.note : "" }]; }))) : projectedAnswers(normalizedAnswers);
      setIsgAnswers(importedIsg);
      setSoftware(Array.isArray(imported.software) && imported.software.length ? imported.software.map((entry) => ({ ...entry, id: entry.id || crypto.randomUUID(), checking: false, error: undefined })) : [{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
      setVulnerabilities(Array.isArray(imported.vulnerabilities) ? imported.vulnerabilities : []);
      setObservations(Array.isArray(imported.observations) ? imported.observations.filter((item) => item && typeof item.id === "string" && typeof item.text === "string") : []);
      setExcludedFindingIds(Array.isArray(imported.excludedFindingIds) ? imported.excludedFindingIds.filter((id) => typeof id === "string") : []);
      setView("overview");
      setActivePillar(0);
      setAssessmentStarted(true);
      setSaved(true);
    } catch {
      setImportError("Não foi possível importar este arquivo. Selecione um JSON gerado pelo XTR Assessment.");
    }
  };

  const updateAnswer = (id: string, patch: Partial<AnswerState[string]>) => {
    setAnswers((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    setExcludedFindingIds((current) => current.filter((findingId) => findingId !== id));
    setSaved(false);
  };
  const updateIsgAnswer = (id: string, patch: Partial<AnswerState[string]>) => { setIsgAnswers((current) => ({ ...current, [id]: { ...current[id], ...patch } })); setSaved(false); };

  const deleteFinding = (id: string) => {
    setExcludedFindingIds((current) => current.includes(id) ? current : [...current, id]);
    setSaved(false);
  };

  const deleteVulnerability = (serverId: string, id: string) => {
    setVulnerabilities((current) => current.filter((item) => !(item.serverId === serverId && item.id === id)));
    setSaved(false);
  };

  const addObservation = () => { setObservations((current) => [...current, { id: crypto.randomUUID(), text: "" }]); setSaved(false); };
  const updateObservation = (id: string, text: string) => { setObservations((current) => current.map((item) => item.id === id ? { ...item, text } : item)); setExcludedFindingIds((current) => current.filter((findingId) => findingId !== observationFindingId(id))); setSaved(false); };
  const deleteObservation = (id: string) => { setObservations((current) => current.filter((item) => item.id !== id)); setExcludedFindingIds((current) => current.filter((findingId) => findingId !== observationFindingId(id))); setSaved(false); };

  const updateSoftware = (id: string, patch: Partial<SoftwareEntry>) => {
    setSoftware((current) => current.map((item) => item.id === id ? { ...item, ...patch, error: undefined } : item));
    setSaved(false);
  };

  const addSoftware = () => {
    setSoftware((current) => [...current, { id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
    setSaved(false);
  };

  const removeSoftware = (id: string) => {
    setSoftware((current) => current.filter((item) => item.id !== id));
    setVulnerabilities((current) => current.filter((item) => item.serverId !== id));
    setSaved(false);
  };

  const checkVulnerabilities = async (entry: SoftwareEntry) => {
    if (!entry.server.trim() || !entry.version.trim()) {
      updateSoftware(entry.id, { error: "Informe o Backup Server e a versão." });
      return;
    }
    updateSoftware(entry.id, { checking: true });
    try {
      const params = new URLSearchParams({ product: entry.server, version: entry.version });
      const response = await fetch(`/api/vulnerabilities?${params}`);
      const data = await response.json() as { vulnerabilities?: Omit<Vulnerability, "serverId" | "server" | "site" | "version">[]; identifiedProduct?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Consulta indisponível");
      const matches = (data.vulnerabilities ?? []).map((item) => ({ ...item, serverId: entry.id, server: entry.server, site: entry.site, version: entry.version, identifiedProduct: data.identifiedProduct }));
      setVulnerabilities((current) => [...current.filter((item) => item.serverId !== entry.id), ...matches]);
      updateSoftware(entry.id, { checking: false, checkedAt: new Date().toLocaleString("pt-BR"), identifiedProduct: data.identifiedProduct });
    } catch (error) {
      updateSoftware(entry.id, { checking: false, error: error instanceof Error ? error.message : "Falha na consulta" });
    }
  };

  const exportDeck = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client, specialist, answers, isgAnswers, pillarScores, totalScore, maturity: maturity.label, findings, software, vulnerabilities, observations, excludedFindingIds }),
      });
      if (!response.ok) throw new Error("export failed");
      const blob = await response.blob();
      const safeClient = client.replace(/[^a-z0-9]+/gi, "-");
      const download = (content: Blob, filename: string) => { const url = URL.createObjectURL(content); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
      download(blob, `XTR-Assessment-${safeClient}.pptx`);
      const assessmentFile: AssessmentFile = { schemaVersion: 2, assessmentId, client, specialist, exportedAt: new Date().toISOString(), answers, isgAnswers, software: software.map((entry) => ({ id: entry.id, server: entry.server, site: entry.site, version: entry.version, checkedAt: entry.checkedAt, identifiedProduct: entry.identifiedProduct, checking: false })), vulnerabilities, observations, excludedFindingIds };
      download(new Blob([JSON.stringify(assessmentFile, null, 2)], { type: "application/json" }), `XTR-Assessment-${safeClient}.json`);
    } finally { setExporting(false); }
  };

  if (!assessmentStarted) return (
    <main className="welcome-screen">
      <section className="welcome-panel">
        <img className="welcome-logo" src="/xtr-assessment-logo.png" alt="XTR Assessment" />
        <span className="eyebrow">MATURIDADE EM RESILIÊNCIA DE DADOS</span>
        <h1>Inicie ou retome um Assessment</h1>
        <p>Crie uma nova avaliação para um cliente ou importe um arquivo JSON exportado anteriormente.</p>
        <div className="welcome-actions">
          <button className="welcome-option primary-option" onClick={() => { setClient(""); setSpecialist(""); setNewAssessmentOpen(true); }}><span>＋</span><div><b>Criar novo Assessment</b><small>Informe cliente e especialista responsável</small></div><i>→</i></button>
          <label className="welcome-option import-option"><span>⇧</span><div><b>Importar Assessment</b><small>Carregue um arquivo JSON do XTR Assessment</small></div><i>→</i><input type="file" accept="application/json,.json" onChange={(event) => { void importAssessment(event.target.files?.[0]); event.target.value = ""; }} /></label>
        </div>
        {importError && <p className="welcome-error">{importError}</p>}
        <div className="welcome-powered"><small>Powered by</small><img src="/xtreme-it-logo.png" alt="Xtreme IT" /></div>
      </section>
      {newAssessmentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewAssessmentOpen(false); }}><section className="assessment-modal" role="dialog" aria-modal="true" aria-labelledby="new-assessment-title"><button className="modal-close" aria-label="Fechar" onClick={() => setNewAssessmentOpen(false)}>×</button><span className="eyebrow">NOVO ASSESSMENT</span><h2 id="new-assessment-title">Identificação da avaliação</h2><p>Essas informações acompanharão o Assessment e o arquivo de retomada.</p><label>CLIENTE<input autoFocus value={client} onChange={(event) => setClient(event.target.value)} placeholder="Nome do cliente" /></label><label>ESPECIALISTA RESPONSÁVEL<input value={specialist} onChange={(event) => setSpecialist(event.target.value)} placeholder="Nome do especialista" onKeyDown={(event) => { if (event.key === "Enter") createAssessment(); }} /></label><button className="primary modal-submit" disabled={!client.trim() || !specialist.trim()} onClick={createAssessment}>Iniciar Assessment</button></section></div>}
    </main>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-logo" src="/xtr-assessment-logo.png" alt="XTR Assessment" /></div>
        <nav aria-label="Navegação principal">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>⌁</span> Visão geral</button>
          <button className={view === "questionnaire" ? "active" : ""} onClick={() => setView("questionnaire")}><span>◫</span> Questionário</button>
          <button className={view === "isg" ? "active" : ""} onClick={() => setView("isg")}><span>↗</span> Score com ISG</button>
          <button className={view === "findings" ? "active" : ""} onClick={() => setView("findings")}><span>△</span> Achados <em>{findingCount}</em></button>
        </nav>
        <div className="sidebar-foot xtreme-credit"><small>Powered by</small><img src="/xtreme-it-logo.png" alt="Xtreme IT" /></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-brand"><img src="/xtr-assessment-logo.png" alt="" /><p>XTR ASSESSMENT <span>/</span> {view === "overview" ? "VISÃO GERAL" : view === "questionnaire" ? "QUESTIONÁRIO" : view === "isg" ? "SCORE COM ISG" : "ACHADOS"}</p></div>
          <div className="top-actions"><span className="save-state"><i />{saved ? "Salvo agora" : "Salvando..."}</span><button className="primary" onClick={exportDeck} disabled={exporting}>{exporting ? "Gerando..." : "Gerar Relatório"}</button></div>
        </header>

        {view === "overview" && (
          <div className="page overview-page">
            <div className="page-title"><div><span className="eyebrow">DIAGNÓSTICO ATUAL</span><h1>Maturidade em Resiliência de Dados</h1><p>Visão consolidada do nível de proteção, prontidão e governança.</p></div><div className="assessment-identification"><label>CLIENTE<input value={client} onChange={(e) => { setClient(e.target.value); setSaved(false); }} /></label><label>ESPECIALISTA RESPONSÁVEL<input value={specialist} onChange={(e) => { setSpecialist(e.target.value); setSaved(false); }} /></label></div></div>
            <section className="overview-cards">
              <article className="score-card compact-score current-score-card glow-card">
                <div className="score-orbit" style={{ "--score": `${totalScore}%`, "--score-color": scoreColor(totalScore) } as React.CSSProperties}><div><strong style={{ color: scoreColor(totalScore) }}>{totalScore}</strong><span>/100</span><small>PONTOS</small></div></div>
                <div className="score-copy"><span>CENÁRIO ATUAL</span><h2 style={{ color: scoreColor(totalScore) }}>{maturity.label}</h2><p>{maturity.description}</p><div className="scale"><i style={{ left: `${totalScore}%` }} /><span>0</span><span>20</span><span>47</span><span>61</span><span>74</span><span>100</span></div></div>
              </article>
              <article className="score-card compact-score isg-score-card glow-card">
                <div className="score-orbit" style={{ "--score": `${isgTotalScore}%`, "--score-color": scoreColor(isgTotalScore) } as React.CSSProperties}><div><strong style={{ color: scoreColor(isgTotalScore) }}>{isgTotalScore}</strong><span>/100</span><small>COM ISG</small></div></div>
                <div className="score-copy"><span>MATURIDADE PROJETADA</span><h2 style={{ color: scoreColor(isgTotalScore) }}>{isgMaturity.label}</h2><p>{isgMaturity.description}</p><div className="isg-gain">↗ +{Math.max(0, isgTotalScore - totalScore)} pontos de maturidade</div><button className="score-detail-link" onClick={() => setView("isg")}>Revisar projeção →</button></div>
              </article>
              <article className="radar-card glow-card"><div className="section-head"><div><span>MATURIDADE POR PILAR</span><h3>Equilíbrio de capacidades</h3></div><div className="radar-key"><span><i className="current-dot" />ATUAL</span><span><i className="future-dot" />COM ISG</span></div></div><div className="radar-wrap"><div className="radar"><i className="future-shape" style={{ clipPath: radarPolygon(isgPillarScores) }} /><i className="current-shape" style={{ clipPath: radarPolygon(pillarScores) }} /></div><div className="radar-legend"><span>Fundamentos de<br />Proteção de Dados</span><span>Replicação e<br />Controles</span><span>Isolamento e<br />Compliance</span><span>Resposta e<br />Prontidão</span><span>Governança e<br />Gestão</span></div></div></article>
              <article className="panel overview-pillar-card"><div className="section-head"><div><span>DESEMPENHO</span><h3>Resultado por pilar</h3></div><button onClick={() => setView("questionnaire")}>Revisar respostas →</button></div><PillarBars answers={answers} /></article>
            </section>
            <section className="frameworks"><span>CROSS-COMPLIANCE</span><b>ISO/IEC 27001:2022</b><b>NIST CSF 2.0</b><b>LGPD</b><small>Mapeamentos são exposições potenciais e requerem validação especializada.</small></section>
          </div>
        )}

        {view === "questionnaire" && (
          <div className="page questionnaire-page">
            <div className="page-title"><div><span className="eyebrow">QUESTIONÁRIO BASE</span><h1>Avaliação por pilar</h1><p>Registre a pontuação e as evidências observadas no ambiente.</p></div><div className="progress-ring">{totalScore}<small>/100</small></div></div>
            <div className="pillar-tabs seven-tabs" role="tablist">{pillars.map((pillar, index) => <button key={pillar.id} className={activePillar === index ? "active" : ""} onClick={() => setActivePillar(index)} style={{ "--pillar": pillar.color } as React.CSSProperties}><span>{pillar.icon}</span><div><small>PILAR {index + 1}</small><b>{pillar.name}</b></div><em>{pillarScores[index]}/20</em></button>)}<button className={activePillar === 5 ? "active software-tab" : "software-tab"} onClick={() => setActivePillar(5)} style={{ "--pillar": "#1ddbe0" } as React.CSSProperties}><span>▣</span><div><small>INVENTÁRIO</small><b>Versões de Software</b></div><em>{software.length}</em></button><button className={activePillar === 6 ? "active observation-tab" : "observation-tab"} onClick={() => setActivePillar(6)} style={{ "--pillar": "#ec39cb" } as React.CSSProperties}><span>✎</span><div><small>REGISTRO LIVRE</small><b>Observações</b></div><em>{observations.length}</em></button></div>
            {activePillar < 5 ? <QuestionList pillar={pillars[activePillar]} answers={answers} updateAnswer={updateAnswer} /> : activePillar === 5 ? <SoftwareVersions entries={software} vulnerabilities={vulnerabilities} update={updateSoftware} add={addSoftware} remove={removeSoftware} check={checkVulnerabilities} /> : <Observations observations={observations} add={addObservation} update={updateObservation} remove={deleteObservation} />}
          </div>
        )}

        {view === "isg" && (
          <div className="page questionnaire-page isg-page">
            <div className="page-title"><div><span className="eyebrow">CENÁRIO FUTURO · SERVIÇOS GERENCIADOS</span><h1>Score com ISG</h1><p>Simule a evolução da maturidade após a adoção dos serviços gerenciados da Xtreme IT.</p></div><div className="projection-score"><span>ATUAL <b>{totalScore}/100</b></span><strong>{isgTotalScore}<small>/100</small></strong><em>+{Math.max(0, isgTotalScore - totalScore)} pontos</em><button className="ghost" onClick={() => { setIsgAnswers(projectedAnswers(answers)); setSaved(false); }}>Recalcular projeção</button></div></div>
            <div className="pillar-tabs isg-tabs" role="tablist">{pillars.map((pillar, index) => <button key={pillar.id} className={isgActivePillar === index ? "active" : ""} onClick={() => setIsgActivePillar(index)} style={{ "--pillar": pillar.color } as React.CSSProperties}><span>{pillar.icon}</span><div><small>PILAR {index + 1}</small><b>{pillar.name}</b></div><em>{isgPillarScores[index]}/20</em></button>)}</div>
            <QuestionList pillar={pillars[isgActivePillar]} answers={isgAnswers} updateAnswer={updateIsgAnswer} />
          </div>
        )}

        {view === "findings" && (
          <div className="page findings-page"><div className="page-title"><div><span className="eyebrow">EXPOSIÇÕES E RISCOS</span><h1>Achados priorizados</h1><p>Cruzamento técnico com ISO/IEC 27001, NIST CSF 2.0, LGPD e NVD, considerando também os comentários, evidências e observações livres.</p></div><div className="stat-pill"><strong>{findingCount}</strong><span>achados<br />ativos</span></div></div>{vulnerabilities.length > 0 && <section className="vulnerability-findings"><div className="section-head"><div><span>VULNERABILIDADES DE SOFTWARE</span><h3>CVEs e riscos mapeados para a versão instalada</h3></div><em>{vulnerabilities.length} CVEs</em></div>{vulnerabilities.map((vuln) => <div className="vulnerability-row" key={`${vuln.serverId}-${vuln.id}`}><div className="vulnerability-identity"><div><a href={vuln.url} target="_blank" rel="noreferrer">{vuln.id}</a><button className="delete-cve" onClick={() => deleteVulnerability(vuln.serverId, vuln.id)}>Excluir</button></div><span>{vuln.identifiedProduct || vuln.server}{vuln.site ? ` · Site: ${vuln.site}` : ""} · {vuln.version}</span></div><a href={vuln.url} target="_blank" rel="noreferrer" className="vulnerability-risk"><b>RISCO MAPEADO</b><strong>{vuln.risk}</strong><p>{vuln.description}</p></a><em className={vuln.severity === "CRITICAL" || vuln.severity === "HIGH" ? "critical" : "medium"}>{vuln.severity}{vuln.score ? ` · ${vuln.score}` : ""}</em><small>{vuln.matchStatus}</small></div>)}</section>}<div className="findings-table"><div className="table-head"><span>ACHADO</span><span>CRITICIDADE</span><span>ISO 27001</span><span>NIST</span><span>LGPD</span><span>AÇÃO</span></div>{findings.map(({ pillar, question, score }, index) => <div className="table-row" key={question.id}><span><i>{String(index + 1).padStart(2, "0")}</i><div><b>{question.title}</b><small>{pillar.name} · {score}/{question.max} pontos</small>{answers[question.id]?.note?.trim() && <small className="finding-evidence">Comentário/Evidência: {answers[question.id].note.trim()}</small>}</div></span><em className={score === 0 ? "critical" : "medium"}>{score === 0 ? "CRÍTICA" : "MÉDIA"}</em><code>{question.iso}</code><code>{question.nist}</code><code>{question.lgpd}</code><button className="delete-finding" onClick={() => deleteFinding(question.id)}>Excluir</button></div>)}{activeObservationFindings.map((observation, index) => { const mapping = mapObservation(observation.text); return <div className="table-row observation-finding" key={observationFindingId(observation.id)}><span><i>{String(findings.length + index + 1).padStart(2, "0")}</i><div><b>Observação registrada no Assessment</b><small>Observações · Cruzamento automático indicativo</small><small className="finding-evidence">{observation.text}</small></div></span><em className="medium">ANÁLISE</em><code>{mapping.iso}</code><code>{mapping.nist}</code><code>{mapping.lgpd}</code><button className="delete-finding" onClick={() => { setExcludedFindingIds((current) => [...current, observationFindingId(observation.id)]); setSaved(false); }}>Excluir</button></div>; })}</div></div>
        )}

      </section>
    </main>
  );
}

function QuestionList({ pillar, answers, updateAnswer }: { pillar: Pillar; answers: AnswerState; updateAnswer: (id: string, patch: Partial<AnswerState[string]>) => void }) {
  return <section className="question-list"><div className="question-intro"><span style={{ color: pillar.color }}>{pillar.icon}</span><div><small>{pillar.name.toUpperCase()}</small><h2>{pillar.description}</h2></div><strong>{pillar.questions.reduce((sum, q) => sum + answers[q.id].score, 0)}<small>/20</small></strong></div>{pillar.questions.map((q, index) => <article className="question-card" key={q.id}><div className="question-number">{String(index + 1).padStart(2, "0")}</div><div className="question-main"><h3>{q.title}</h3><p>{q.risk}</p><div className="framework-tags"><span>{q.iso}</span><span>{q.nist}</span><span>{q.lgpd}</span></div><textarea aria-label={`Observação para ${q.title}`} placeholder="Descreva a evidência ou observação técnica..." value={answers[q.id].note} onChange={(e) => updateAnswer(q.id, { note: e.target.value })} /></div><div className="score-selector"><label>PONTUAÇÃO</label><strong style={{ color: answers[q.id].score === q.max ? "var(--success)" : answers[q.id].score === 0 ? "var(--danger)" : "var(--warning)" }}>{answers[q.id].score}<small>/{q.max}</small></strong><input type="range" min="0" max={q.max} value={answers[q.id].score} onChange={(e) => updateAnswer(q.id, { score: Number(e.target.value) })} style={{ "--value": `${(answers[q.id].score / q.max) * 100}%` } as React.CSSProperties} /><div><span>Não atende</span><span>Atende</span></div></div></article>)}</section>;
}

function SoftwareVersions({ entries, vulnerabilities, update, add, remove, check }: { entries: SoftwareEntry[]; vulnerabilities: Vulnerability[]; update: (id: string, patch: Partial<SoftwareEntry>) => void; add: () => void; remove: (id: string) => void; check: (entry: SoftwareEntry) => void }) {
  return <section className="software-inventory"><div className="software-intro"><div><span className="eyebrow">INVENTÁRIO DE BACKUP</span><h2>Versões de Software</h2><p>Informe o produto, a localidade do cliente e a versão instalada.</p></div><button className="primary" onClick={add}>＋ Adicionar Backup Server</button></div><div className="software-list">{entries.map((entry, index) => { const count = vulnerabilities.filter((item) => item.serverId === entry.id).length; return <article className="software-card" key={entry.id}><div className="software-index">{String(index + 1).padStart(2, "0")}</div><label>PRODUTO OU FABRICANTE<input value={entry.server} onChange={(e) => update(entry.id, { server: e.target.value, identifiedProduct: undefined })} placeholder="Ex.: Veeam" /></label><label>SITE<input value={entry.site} onChange={(e) => update(entry.id, { site: e.target.value })} placeholder="Ex.: Unidade Ribeirão Preto" /></label><label>VERSÃO / BUILD<input value={entry.version} onChange={(e) => update(entry.id, { version: e.target.value, identifiedProduct: undefined })} placeholder="Ex.: 12.3.2.3617" /></label><div className="software-actions"><button className="primary" onClick={() => check(entry)} disabled={entry.checking}>{entry.checking ? "Identificando produto..." : "Verificar vulnerabilidades"}</button>{entries.length > 1 && <button className="remove-button" onClick={() => remove(entry.id)}>Remover</button>}</div>{entry.error && <p className="software-error">{entry.error}</p>}{entry.checkedAt && !entry.error && <p className="software-status"><i /> Produto identificado: <b>{entry.identifiedProduct || entry.server}</b>{entry.site ? <> · Site: <b>{entry.site}</b></> : null} · Consulta NVD: {entry.checkedAt} · {count} vulnerabilidade(s)</p>}</article>; })}</div><div className="nvd-note"><b>Fonte: National Vulnerability Database (NVD/NIST).</b><span>O produto é inferido pelo fabricante e pelo padrão da versão. Correspondências ambíguas não são registradas automaticamente.</span></div></section>;
}

function Observations({ observations, add, update, remove }: { observations: AssessmentObservation[]; add: () => void; update: (id: string, text: string) => void; remove: (id: string) => void }) {
  return <section className="observations-panel"><div className="software-intro"><div><span className="eyebrow">REGISTRO COMPLEMENTAR</span><h2>Observações</h2><p>Registre condições adicionais identificadas durante o Assessment. Cada texto será cruzado com ISO/IEC 27001, NIST CSF e LGPD.</p></div><button className="primary" onClick={add}>＋ Incluir Observação</button></div>{observations.length === 0 ? <div className="observations-empty"><span>✎</span><b>Nenhuma observação registrada</b><p>Use “Incluir Observação” para documentar informações que não estejam contempladas nos pilares.</p></div> : <div className="observations-list">{observations.map((observation, index) => { const mapping = observation.text.trim() ? mapObservation(observation.text) : null; return <article className="observation-card" key={observation.id}><div className="observation-head"><span>OBSERVAÇÃO {String(index + 1).padStart(2, "0")}</span><button onClick={() => remove(observation.id)}>Excluir</button></div><textarea autoFocus={!observation.text} value={observation.text} onChange={(event) => update(observation.id, event.target.value)} placeholder="Descreva a condição, evidência, risco ou oportunidade de melhoria identificada..." />{mapping && <div className="observation-cross"><span><b>ISO/IEC 27001</b>{mapping.iso.replaceAll("\n", " · ")}</span><span><b>NIST CSF</b>{mapping.nist.replaceAll("\n", " · ")}</span><span><b>LGPD</b>{mapping.lgpd.replaceAll("\n", " · ")}</span></div>}</article>; })}</div>}<div className="nvd-note"><b>Cruzamento técnico indicativo.</b><span>As referências devem ser validadas por especialistas de segurança, compliance e jurídico antes de uma conclusão formal de não conformidade.</span></div></section>;
}
