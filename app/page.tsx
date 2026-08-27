"use client";

import { useEffect, useMemo, useState } from "react";
import { pillars, maturityForScore, type Pillar } from "./assessment-data";
import { automaticComment } from "./assessment-comments";
import { mapObservation, observationFindingId, type AssessmentObservation } from "./observation-mapping";
import { referenceFor, type ReferenceEntry } from "./reference-catalog";

type View = "overview" | "questionnaire" | "isg" | "findings" | "comparison";
type AnswerState = Record<string, { score: number; note: string; noEvidence?: boolean }>;
type Vulnerability = { id: string; severity: string; score: number | null; description: string; risk: string; url: string; matchStatus: string; serverId: string; server: string; site: string; version: string; identifiedProduct?: string };
type SoftwareEntry = { id: string; server: string; site: string; version: string; checking: boolean; checkedAt?: string; error?: string; identifiedProduct?: string };
type AssessmentFile = { schemaVersion?: number; assessmentId?: string; client?: string; specialist?: string; exportedAt?: string; answers?: AnswerState; isgAnswers?: AnswerState; guardianStarted?: boolean; resultsUnlocked?: boolean; software?: SoftwareEntry[]; vulnerabilities?: Vulnerability[]; observations?: AssessmentObservation[]; excludedFindingIds?: string[] };
const specialistOptions = ["Ivan Felipe", "Guilherme Kaspary", "Ciro Missola"] as const;
const maturityBands = [
  { label: "Preocupante", range: "Até 20 pontos", description: "Vulnerabilidades críticas e alto risco operacional.", color: "#ff4d68" },
  { label: "Baixo", range: "Entre 21 e 47 pontos", description: "Controles básicos com falhas relevantes.", color: "#f6b73c" },
  { label: "Intermediário", range: "Entre 48 e 61 pontos", description: "Controles parciais com melhorias necessárias.", color: "#d7cc35" },
  { label: "Avançado", range: "Entre 62 e 74 pontos", description: "Boas práticas e processos consolidados.", color: "#1ddbe0" },
  { label: "Altamente Resiliente", range: "Acima de 75 pontos", description: "Ambiente robusto, otimizado e preparado.", color: "#35d999" },
] as const;

const zeroScoreComment = (id: string) => automaticComment(id, 0);

const demoAnswers: AnswerState = Object.fromEntries(
  pillars.flatMap((pillar) =>
    pillar.questions.map((question, index) => [
      question.id,
      (() => { const score = index % 3 === 0 ? question.max : index % 3 === 1 ? Math.round(question.max / 2) : 0; return { score, note: automaticComment(question.id, score) }; })(),
    ]),
  ),
);

const emptyAnswers: AnswerState = Object.fromEntries(
  pillars.flatMap((pillar) => pillar.questions.map((question) => [question.id, { score: 0, note: zeroScoreComment(question.id) }])),
);

const questionIds = pillars.flatMap((pillar) => pillar.questions.map((question) => question.id));

const guardianAnswersFromCurrent = (source: AnswerState): AnswerState => Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => {
  const current = Math.max(0, Math.min(question.max, source[question.id]?.score ?? 0));
  return [question.id, { score: current, note: automaticComment(question.id, current) }];
})));

const projectedAnswers = (source: AnswerState): AnswerState => Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => {
  const current = Math.max(0, Math.min(question.max, source[question.id]?.score ?? 0));
  const projected = Math.min(question.max, current + Math.ceil((question.max - current) * .7));
  return [question.id, { score: projected, note: automaticComment(question.id, projected) }];
})));

const radarPoints = (scores: number[], radius = 105) => scores.map((score, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / 5; const distance = radius * Math.max(0, Math.min(20, score)) / 20; return `${160 + Math.cos(angle) * distance},${160 + Math.sin(angle) * distance}`; }).join(" ");
const radarLabels = [
  { x: 160, y: 22, anchor: "middle", lines: ["1. Fundamentos de", "Proteção de Dados"] },
  { x: 286, y: 105, anchor: "end", lines: ["2. Replicação e", "Controles"] },
  { x: 268, y: 286, anchor: "end", lines: ["3. Isolamento e", "Compliance"] },
  { x: 52, y: 286, anchor: "start", lines: ["4. Resposta e", "Prontidão"] },
  { x: 34, y: 105, anchor: "start", lines: ["5. Governança e", "Gestão"] },
] as const;

function RadarChart({ current, guardians, showCurrent = true, showGuardians = true }: { current: number[]; guardians: number[]; showCurrent?: boolean; showGuardians?: boolean }) {
  const axisPoints = Array.from({ length: 5 }, (_, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / 5; return { x: 160 + Math.cos(angle) * 105, y: 160 + Math.sin(angle) * 105 }; });
  return <svg className="radar-chart" viewBox="0 0 320 320" role="img" aria-label="Comparação da maturidade dos cinco pilares"><defs><filter id="radar-glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>{[.25, .5, .75, 1].map((scale) => <polygon key={scale} className="radar-grid" points={radarPoints([20 * scale, 20 * scale, 20 * scale, 20 * scale, 20 * scale])} />)}{axisPoints.map((point, index) => <line key={index} className="radar-axis" x1="160" y1="160" x2={point.x} y2={point.y} />)}{radarLabels.map((label) => <text key={label.lines[0]} className="radar-pillar-label" x={label.x} y={label.y} textAnchor={label.anchor}>{label.lines.map((line, index) => <tspan key={line} x={label.x} dy={index === 0 ? 0 : 11}>{line}</tspan>)}</text>)}<text x="166" y="137">5</text><text x="166" y="111">10</text><text x="166" y="85">15</text><text x="166" y="58">20</text>{showGuardians && <polygon className="radar-area guardians-area" points={radarPoints(guardians)} />}{showCurrent && <polygon className="radar-area current-area" points={radarPoints(current)} />}{showGuardians && guardians.map((score, index) => { const [x, y] = radarPoints(guardians).split(" ")[index].split(",").map(Number); const labelX = 160 + (x - 160) * .84; const labelY = 160 + (y - 160) * .84; return <g key={`g-${index}`}><circle className="guardian-point" cx={x} cy={y} r="2.2" /><text className="guardian-value" x={labelX + 4} y={labelY - 4}>{score}</text></g>; })}{showCurrent && current.map((score, index) => { const [x, y] = radarPoints(current).split(" ")[index].split(",").map(Number); const labelX = 160 + (x - 160) * .68; const labelY = 160 + (y - 160) * .68; return <g key={`c-${index}`}><circle className="current-point" cx={x} cy={y} r="2.2" />{score !== guardians[index] && <text className="current-value" x={labelX + 4} y={labelY + 8}>{score}</text>}</g>; })}</svg>;
}

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
  const [guardianStarted, setGuardianStarted] = useState(false);
  const [resultsUnlocked, setResultsUnlocked] = useState(false);
  const [client, setClient] = useState("Cliente demonstração");
  const [activePillar, setActivePillar] = useState(0);
  const [isgActivePillar, setIsgActivePillar] = useState(0);
  const [pendingScrollId, setPendingScrollId] = useState<{ id: string; requestedAt: number } | null>(null);
  const [guidedMode, setGuidedMode] = useState(true);
  const [supplementaryView, setSupplementaryView] = useState<"inventory" | "observations" | null>(null);
  const [software, setSoftware] = useState<SoftwareEntry[]>([{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [observations, setObservations] = useState<AssessmentObservation[]>([]);
  const [excludedFindingIds, setExcludedFindingIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeReference, setActiveReference] = useState<ReferenceEntry | null>(null);

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
  const currentCommentCount = questionIds.filter((id) => answers[id]?.note.trim()).length;
  const currentComplete = currentCommentCount === questionIds.length;
  const guardianCompletedIds = useMemo(() => questionIds.filter((id) => { const unchanged = (isgAnswers[id]?.score ?? 0) === (answers[id]?.score ?? 0); return unchanged || Boolean(isgAnswers[id]?.note.trim()); }), [answers, isgAnswers]);
  const guardianReviewedCount = guardianCompletedIds.length;
  const guardianComplete = currentComplete && guardianReviewedCount === questionIds.length;

  useEffect(() => {
    if (!assessmentStarted || !guidedMode) return;
    if ((!currentComplete || !guardianStarted) && view !== "questionnaire") setView("questionnaire");
    else if ((!guardianComplete || !resultsUnlocked) && (view === "overview" || view === "findings" || view === "comparison")) setView("isg");
  }, [assessmentStarted, guidedMode, currentComplete, guardianComplete, guardianStarted, resultsUnlocked, view]);

  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/assessments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: assessmentId, client, answers: { specialist, answers, isgAnswers, guardianStarted, resultsUnlocked, software, vulnerabilities, observations, excludedFindingIds }, score: totalScore, maturity: maturity.label }),
        });
        setSaved(true);
      } catch { /* stays as a draft in the current session */ }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, assessmentId, client, excludedFindingIds, guardianStarted, isgAnswers, maturity.label, observations, resultsUnlocked, saved, software, specialist, totalScore, vulnerabilities]);

  const createAssessment = () => {
    if (!client.trim() || !specialist.trim()) return;
    setAssessmentId(crypto.randomUUID());
    setAnswers(emptyAnswers);
    setIsgAnswers(guardianAnswersFromCurrent(emptyAnswers));
    setGuardianStarted(false);
    setResultsUnlocked(false);
    setSoftware([{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
    setVulnerabilities([]);
    setObservations([]);
    setExcludedFindingIds([]);
    setView("questionnaire");
    setActivePillar(0);
    setSupplementaryView(null);
    setNewAssessmentOpen(false);
    setAssessmentStarted(true);
    setGuidedMode(true);
    setSaved(false);
  };

  const importAssessment = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      const imported = JSON.parse(await file.text()) as AssessmentFile;
      if (!imported.client || !imported.answers || typeof imported.answers !== "object") throw new Error("Arquivo incompatível");
      const legacyContainer = imported.answers as AnswerState & { answers?: AnswerState; isgAnswers?: AnswerState; guardianStarted?: boolean; resultsUnlocked?: boolean; specialist?: string };
      const sourceAnswers = legacyContainer.answers && typeof legacyContainer.answers === "object" ? legacyContainer.answers : imported.answers;
      const sourceIsgAnswers = imported.isgAnswers && typeof imported.isgAnswers === "object" ? imported.isgAnswers : legacyContainer.isgAnswers;
      const normalizedAnswers: AnswerState = Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => {
        const value = sourceAnswers?.[question.id];
        const score = Math.max(0, Math.min(question.max, Number(value?.score) || 0));
        const noEvidence = value?.noEvidence === true;
        return [question.id, { score, noEvidence, note: typeof value?.note === "string" && value.note.trim() ? value.note : automaticComment(question.id, score, noEvidence) }];
      })));
      setAssessmentId(imported.assessmentId || crypto.randomUUID());
      setClient(imported.client.trim());
      setSpecialist(typeof imported.specialist === "string" ? imported.specialist : typeof legacyContainer.specialist === "string" ? legacyContainer.specialist : "Não informado");
      setAnswers(normalizedAnswers);
      const importedIsg = sourceIsgAnswers && typeof sourceIsgAnswers === "object" ? Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => { const value = sourceIsgAnswers[question.id]; const minimum = normalizedAnswers[question.id]?.score ?? 0; const score = Math.max(minimum, Math.min(question.max, Number(value?.score) || 0)); const noEvidence = value?.noEvidence === true; return [question.id, { score, noEvidence, note: typeof value?.note === "string" && value.note.trim() ? value.note : automaticComment(question.id, score, noEvidence) }]; }))) : guardianAnswersFromCurrent(normalizedAnswers);
      setIsgAnswers(importedIsg);
      // Imported assessments skip the guided-journey gating entirely: every step
      // starts unlocked and the specialist lands straight on the overview.
      setGuardianStarted(true);
      setResultsUnlocked(true);
      setSoftware(Array.isArray(imported.software) && imported.software.length ? imported.software.map((entry) => ({ ...entry, id: entry.id || crypto.randomUUID(), checking: false, error: undefined })) : [{ id: crypto.randomUUID(), server: "", site: "", version: "", checking: false }]);
      setVulnerabilities(Array.isArray(imported.vulnerabilities) ? imported.vulnerabilities : []);
      setObservations(Array.isArray(imported.observations) ? imported.observations.filter((item) => item && typeof item.id === "string" && typeof item.text === "string") : []);
      setExcludedFindingIds(Array.isArray(imported.excludedFindingIds) ? imported.excludedFindingIds.filter((id) => typeof id === "string") : []);
      setView("overview");
      setActivePillar(0);
      setSupplementaryView(null);
      setAssessmentStarted(true);
      setGuidedMode(false);
      setSaved(true);
    } catch {
      setImportError("Não foi possível importar este arquivo. Selecione um JSON gerado pelo XTR Assessment.");
    }
  };

  const updateAnswer = (id: string, patch: Partial<AnswerState[string]>) => {
    setAnswers((current) => {
      const previous = current[id] ?? { score: 0, note: zeroScoreComment(id) };
      const score = typeof patch.score === "number" ? patch.score : previous.score;
      const noEvidence = typeof patch.noEvidence === "boolean" ? patch.noEvidence : previous.noEvidence === true;
      const regenerate = typeof patch.score === "number" || typeof patch.noEvidence === "boolean";
      const note = typeof patch.note === "string" ? patch.note : regenerate ? automaticComment(id, score, noEvidence) : previous.note;
      return { ...current, [id]: { ...previous, ...patch, score, noEvidence, note } };
    });
    if (typeof patch.score === "number") setIsgAnswers((current) => { const previous = current[id] ?? { score: patch.score!, note: "" }; const score = Math.max(patch.score!, previous.score); return { ...current, [id]: { ...previous, score, note: score !== previous.score ? automaticComment(id, score, previous.noEvidence === true) : previous.note } }; });
    setGuardianReviewedIds((current) => current.filter((questionId) => questionId !== id));
    setResultsUnlocked(false);
    setExcludedFindingIds((current) => current.filter((findingId) => findingId !== id));
    setSaved(false);
  };
  const updateIsgAnswer = (id: string, patch: Partial<AnswerState[string]>) => {
    const minimum = answers[id]?.score ?? 0;
    setIsgAnswers((current) => { const previous = current[id] ?? { score: minimum, note: automaticComment(id, minimum) }; const score = typeof patch.score === "number" ? Math.max(minimum, patch.score) : previous.score; const noEvidence = typeof patch.noEvidence === "boolean" ? patch.noEvidence : previous.noEvidence === true; const regenerate = typeof patch.score === "number" || typeof patch.noEvidence === "boolean"; const note = typeof patch.note === "string" ? patch.note : regenerate ? automaticComment(id, score, noEvidence) : previous.note; return { ...current, [id]: { ...previous, ...patch, score, noEvidence, note } }; });
    setResultsUnlocked(false);
    setSaved(false);
  };
  const startGuardianEnvironment = () => {
    setIsgAnswers((current) => Object.fromEntries(pillars.flatMap((pillar) => pillar.questions.map((question) => { const score = Math.max(answers[question.id]?.score ?? 0, current[question.id]?.score ?? 0); const previous = current[question.id]; return [question.id, { score, noEvidence: previous?.noEvidence === true, note: previous?.note?.trim() ? previous.note : automaticComment(question.id, score, previous?.noEvidence === true) }]; }))));
    setGuardianStarted(true);
    setResultsUnlocked(false);
    setIsgActivePillar(0);
    setView("isg");
    setSaved(false);
  };

  const unlockResults = () => {
    setResultsUnlocked(true);
    window.scrollTo(0, 0);
    setView("overview");
    setSaved(false);
  };

  const goToCurrentPending = () => {
    const pendingId = questionIds.find((id) => !answers[id]?.note.trim());
    if (!pendingId) return;
    const pillarIndex = pillars.findIndex((pillar) => pillar.questions.some((question) => question.id === pendingId));
    if (pillarIndex !== -1) { setActivePillar(pillarIndex); setSupplementaryView(null); }
    setPendingScrollId({ id: pendingId, requestedAt: Date.now() });
  };

  const goToGuardianPending = () => {
    const pendingId = questionIds.find((id) => !guardianCompletedIds.includes(id));
    if (!pendingId) return;
    const pillarIndex = pillars.findIndex((pillar) => pillar.questions.some((question) => question.id === pendingId));
    if (pillarIndex !== -1) setIsgActivePillar(pillarIndex);
    setPendingScrollId({ id: pendingId, requestedAt: Date.now() });
  };

  useEffect(() => {
    if (!pendingScrollId) return;
    document.getElementById(`question-${pendingScrollId.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pendingScrollId]);

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
      const assessmentFile: AssessmentFile = { schemaVersion: 3, assessmentId, client, specialist, exportedAt: new Date().toISOString(), answers, isgAnswers, guardianStarted, resultsUnlocked, software: software.map((entry) => ({ id: entry.id, server: entry.server, site: entry.site, version: entry.version, checkedAt: entry.checkedAt, identifiedProduct: entry.identifiedProduct, checking: false })), vulnerabilities, observations, excludedFindingIds };
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
          <button className="welcome-option primary-option" onClick={() => { setClient(""); setSpecialist(""); setNewAssessmentOpen(true); }}><span>＋</span><div><b>Criar novo Assessment</b><small>Informe cliente e especialista responsável</small></div></button>
          <label className="welcome-option import-option"><span className="import-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 3v16m0 0-6-6m6 6 6-6M5 10H3v14a5 5 0 0 0 5 5h16a5 5 0 0 0 5-5V10h-2" /></svg></span><div><b>Importar Assessment</b><small>Carregue um arquivo JSON do XTR Assessment</small></div><input type="file" accept="application/json,.json" onChange={(event) => { void importAssessment(event.target.files?.[0]); event.target.value = ""; }} /></label>
        </div>
        {importError && <p className="welcome-error">{importError}</p>}
        <div className="welcome-powered"><small>Powered by</small><img src="/xtreme-it-logo.png" alt="Xtreme IT" /></div>
      </section>
      {newAssessmentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewAssessmentOpen(false); }}><section className="assessment-modal" role="dialog" aria-modal="true" aria-labelledby="new-assessment-title"><button className="modal-close" aria-label="Fechar" onClick={() => setNewAssessmentOpen(false)}>×</button><span className="eyebrow">NOVO ASSESSMENT</span><h2 id="new-assessment-title">Identificação da avaliação</h2><p>Essas informações acompanharão o Assessment e o arquivo de retomada.</p><label>CLIENTE<input autoFocus value={client} onChange={(event) => setClient(event.target.value)} placeholder="Nome do cliente" /></label><label>ESPECIALISTA RESPONSÁVEL<select value={specialist} onChange={(event) => setSpecialist(event.target.value)}><option value="" disabled>Selecione o especialista</option>{specialistOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><button className="primary modal-submit" disabled={!client.trim() || !specialist.trim()} onClick={createAssessment}>Iniciar Assessment</button></section></div>}
    </main>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-logo" src="/xtr-assessment-logo.png" alt="XTR Assessment" /></div>
        <nav aria-label="Navegação principal">
          <small className="nav-section-label">JORNADA GUIADA</small>
          <button className={view === "questionnaire" ? "active" : ""} onClick={() => setView("questionnaire")}><span>01</span> Ambiente Atual <em className="nav-score" style={{ "--score-color": scoreColor(totalScore) } as React.CSSProperties}>{totalScore}/100</em></button>
          <button className={view === "isg" ? "active" : ""} onClick={() => setView("isg")} disabled={guidedMode && (!currentComplete || !guardianStarted)} title={!guidedMode ? undefined : !currentComplete ? "Preencha todos os comentários do Ambiente Atual" : !guardianStarted ? "Clique em Continuar para Ambiente Data Guardians" : undefined}><span>02</span> Ambiente Data Guardians <em className="nav-score" style={{ "--score-color": scoreColor(isgTotalScore) } as React.CSSProperties}>{isgTotalScore}/100</em></button>
          <small className="nav-section-label results-label">RESULTADOS</small>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")} disabled={guidedMode && (!guardianComplete || !resultsUnlocked)}><span>⌁</span> Visão geral</button>
          <button className={view === "comparison" ? "active" : ""} onClick={() => setView("comparison")} disabled={guidedMode && (!guardianComplete || !resultsUnlocked)}><span>⇄</span> Comparativo</button>
          <button className={view === "findings" ? "active" : ""} onClick={() => setView("findings")} disabled={guidedMode && (!guardianComplete || !resultsUnlocked)}><span>△</span> Riscos <em>{findingCount}</em></button>
        </nav>
        <div className="sidebar-foot xtreme-credit"><small>Powered by</small><img src="/xtreme-it-logo.png" alt="Xtreme IT" /></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-brand"><img src="/xtr-assessment-logo.png" alt="" /><p>XTR ASSESSMENT <span>/</span> {view === "overview" ? "VISÃO GERAL" : view === "questionnaire" ? "AMBIENTE ATUAL" : view === "isg" ? "AMBIENTE DATA GUARDIANS" : view === "comparison" ? "COMPARATIVO" : "RISCOS"}</p></div>
          <div className="top-actions"><span className="internal-use"><i />Uso interno</span><span className="report-action" data-tooltip={guidedMode && (!guardianComplete || !resultsUnlocked) ? "O relatório será liberado após concluir o Ambiente Data Guardians e clicar em Ver Resultados." : undefined}><button className="primary" onClick={exportDeck} disabled={exporting || (guidedMode && (!guardianComplete || !resultsUnlocked))}>{exporting ? "Gerando..." : "Gerar Relatório"}</button></span></div>
        </header>

        {view === "overview" && (
          <div className="page overview-page">
            <div className="page-title"><div><span className="eyebrow">DIAGNÓSTICO ATUAL</span><h1>Maturidade em Resiliência de Dados</h1><p>Visão consolidada do nível de proteção, prontidão e governança.</p></div><div className="assessment-identification"><label>CLIENTE<input value={client} onChange={(e) => { setClient(e.target.value); setSaved(false); }} /></label><label>ESPECIALISTA RESPONSÁVEL<select value={specialist} onChange={(e) => { setSpecialist(e.target.value); setSaved(false); }}><option value="" disabled>Selecione o especialista</option>{specialistOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div></div>
            <section className="maturity-dashboard">
              <article className="maturity-highlight" style={{ "--maturity-color": scoreColor(totalScore) } as React.CSSProperties}><header><span>◇</span><div><small>DASHBOARD DE MATURIDADE</small><b>BACKUP SECURITY</b></div></header><div className="maturity-state"><span>NÍVEL DE MATURIDADE</span><strong>{maturity.label}<i className="maturity-state-arrow">→</i><span style={{ color: scoreColor(isgTotalScore) }}>{isgMaturity.label}</span></strong></div><div className="dashboard-score-pair"><div className="dashboard-score-unit"><div className="dashboard-score-orbit" style={{ "--score": `${totalScore}%`, "--orbit-color": scoreColor(totalScore) } as React.CSSProperties}><div><strong>{totalScore}</strong><span>/100</span></div></div><small>ATUAL</small></div><span className="dashboard-score-arrow">→</span><div className="dashboard-score-unit"><div className="dashboard-score-orbit" style={{ "--score": `${isgTotalScore}%`, "--orbit-color": scoreColor(isgTotalScore) } as React.CSSProperties}><div><strong>{isgTotalScore}</strong><span>/100</span></div></div><small>DATA GUARDIANS</small></div></div><footer><span>Evolução projetada</span><b style={{ color: scoreColor(isgTotalScore) }}>+{isgTotalScore - totalScore} pontos</b></footer></article>
              <article className="category-maturity"><header><span>▣</span><h2>Nível de maturidade por categoria</h2></header><div className="category-columns-head" aria-hidden="true"><span>Escala 0-20</span><span>Atual <i>→</i> Data Guardians</span></div>{pillars.map((pillar, index) => <div className="category-row" key={pillar.id} style={{ "--pillar-color": pillar.color } as React.CSSProperties}><span className="category-icon">{pillar.icon}</span><i>{index + 1}</i><b>{pillar.name}</b><div className="category-progress"><span style={{ width: `${isgPillarScores[index] * 5}%` }} /><i style={{ width: `${pillarScores[index] * 5}%` }} /></div><small>0 <em>10</em> 20</small><strong>{pillarScores[index]}<span> → {isgPillarScores[index]}/20</span></strong></div>)}</article>
            </section>
            <section className="maturity-bands">{maturityBands.map((band) => { const isCurrent = maturity.label === band.label; const isGuardian = isgMaturity.label === band.label; return <article key={band.label} className={`${isCurrent ? "current-band" : ""} ${isGuardian ? "guardian-band" : ""}`} style={{ "--band-color": band.color } as React.CSSProperties}><header><span>◇</span><b>{band.label}</b></header><p>{band.description}</p><strong>{band.range}</strong>{(isCurrent || isGuardian) && <em>{isCurrent && isGuardian ? "ATUAL + AMBIENTE DATA GUARDIANS" : isCurrent ? "ATUAL" : "AMBIENTE DATA GUARDIANS"}</em>}</article>; })}</section>
            <section className="frameworks"><span>CROSS-COMPLIANCE</span><b>ISO/IEC 27001:2022</b><b>NIST CSF 2.0</b><b>LGPD</b><small>Mapeamentos são exposições potenciais e requerem validação especializada.</small></section>
          </div>
        )}

        {view === "questionnaire" && (
          <div className="page questionnaire-page">
            <JourneyStatus step={1} current={currentCommentCount} total={questionIds.length} complete={currentComplete} />
            <div className="page-title"><div><span className="eyebrow">ETAPA 1 · DIAGNÓSTICO</span><h1>Ambiente Atual</h1><p>Avalie cada controle e registre obrigatoriamente a evidência observada.</p></div><div className="progress-ring">{totalScore}<small>/100</small></div></div>
            <div className="pillar-tabs" role="tablist">{pillars.map((pillar, index) => <button key={pillar.id} className={activePillar === index && supplementaryView === null ? "active" : ""} onClick={() => { setActivePillar(index); setSupplementaryView(null); }} style={{ "--pillar": pillar.color } as React.CSSProperties}><span>{pillar.icon}</span><div><small>PILAR {index + 1}</small><b>{pillar.name}</b></div><em>{pillarScores[index]}/20</em></button>)}</div>
            <section className="supplementary-navigation"><div><span className="eyebrow">DADOS COMPLEMENTARES</span><p>Inventário e registros livres ficam separados da avaliação dos cinco pilares.</p></div><button className={supplementaryView === "inventory" ? "active" : ""} onClick={() => setSupplementaryView(supplementaryView === "inventory" ? null : "inventory")}><span>▣</span><b>Inventário</b><em>{software.length}</em></button><button className={supplementaryView === "observations" ? "active" : ""} onClick={() => setSupplementaryView(supplementaryView === "observations" ? null : "observations")}><span>✎</span><b>Registro Livre</b><em>{observations.length}</em></button></section>
            {supplementaryView === "inventory" ? <SoftwareVersions entries={software} vulnerabilities={vulnerabilities} update={updateSoftware} add={addSoftware} remove={removeSoftware} check={checkVulnerabilities} /> : supplementaryView === "observations" ? <Observations observations={observations} add={addObservation} update={updateObservation} remove={deleteObservation} /> : <QuestionList mode="current" pillar={pillars[activePillar]} answers={answers} updateAnswer={updateAnswer} openReference={setActiveReference} />}
            <JourneyFooter complete={currentComplete} incompleteMessage={`Preencha os ${questionIds.length - currentCommentCount} comentário(s) obrigatório(s) para continuar.`} actionLabel="Continuar para Ambiente Data Guardians" onContinue={startGuardianEnvironment} onPending={goToCurrentPending} />
          </div>
        )}

        {view === "isg" && (
          <div className="page questionnaire-page isg-page">
            <JourneyStatus step={2} current={guardianReviewedCount} total={questionIds.length} complete={guardianComplete} />
            <div className="page-title"><div><span className="eyebrow">ETAPA 2 · JORNADA DE EVOLUÇÃO</span><h1>Ambiente Data Guardians</h1><p>Revise cada controle. A pontuação parte do ambiente atual e pode apenas permanecer ou aumentar.</p></div><div className="projection-score"><span>ATUAL <b>{totalScore}/100</b></span><strong>{isgTotalScore}<small>/100</small></strong><em>+{Math.max(0, isgTotalScore - totalScore)} pontos</em></div></div>
            <div className="pillar-tabs isg-tabs" role="tablist">{pillars.map((pillar, index) => <button key={pillar.id} className={isgActivePillar === index ? "active" : ""} onClick={() => setIsgActivePillar(index)} style={{ "--pillar": pillar.color } as React.CSSProperties}><span>{pillar.icon}</span><div><small>PILAR {index + 1}</small><b>{pillar.name}</b></div><em>{isgPillarScores[index]}/20</em></button>)}</div>
            <QuestionList mode="guardians" pillar={pillars[isgActivePillar]} answers={isgAnswers} updateAnswer={updateIsgAnswer} referenceAnswers={answers} openReference={setActiveReference} />
            <JourneyFooter complete={guardianComplete} incompleteMessage={`Revise os ${questionIds.length - guardianReviewedCount} item(ns) restante(s) para ver os resultados.`} actionLabel="Ver Resultados" onContinue={unlockResults} onPending={goToGuardianPending} />
          </div>
        )}

        {view === "findings" && (
          <div className="page findings-page"><div className="page-title"><div><span className="eyebrow">EXPOSIÇÕES E RISCOS</span><h1>Riscos priorizados</h1><p>Cruzamento técnico com ISO/IEC 27001, NIST CSF 2.0, LGPD e NVD, considerando também os comentários, evidências e observações livres.</p></div><div className="stat-pill"><strong>{findingCount}</strong><span>riscos<br />ativos</span></div></div>{vulnerabilities.length > 0 && <section className="vulnerability-findings"><div className="section-head"><div><span>VULNERABILIDADES DE SOFTWARE</span><h3>CVEs e riscos mapeados para a versão instalada</h3></div><em>{vulnerabilities.length} CVEs</em></div>{vulnerabilities.map((vuln) => <div className="vulnerability-row" key={`${vuln.serverId}-${vuln.id}`}><div className="vulnerability-identity"><div><a href={vuln.url} target="_blank" rel="noreferrer">{vuln.id}</a><button className="delete-cve" onClick={() => deleteVulnerability(vuln.serverId, vuln.id)}>Excluir</button></div><span>{vuln.identifiedProduct || vuln.server}{vuln.site ? ` · Site: ${vuln.site}` : ""} · {vuln.version}</span></div><a href={vuln.url} target="_blank" rel="noreferrer" className="vulnerability-risk"><b>RISCO MAPEADO</b><strong>{vuln.risk}</strong><p>{vuln.description}</p></a><em className={vuln.severity === "CRITICAL" || vuln.severity === "HIGH" ? "critical" : "medium"}>{vuln.severity}{vuln.score ? ` · ${vuln.score}` : ""}</em><small>{vuln.matchStatus}</small></div>)}</section>}<div className="findings-table"><div className="table-head"><span>RISCO</span><span>CRITICIDADE</span><span>ISO 27001</span><span>NIST</span><span>LGPD</span><span>AÇÃO</span></div>{findings.map(({ pillar, question, score }, index) => <div className="table-row" key={question.id}><span><i>{String(index + 1).padStart(2, "0")}</i><div><b>{question.title}</b><small>{pillar.name} · {score}/{question.max} pontos</small>{answers[question.id]?.note?.trim() && <small className="finding-evidence">Comentário/Evidência: {answers[question.id].note.trim()}</small>}</div></span><em className={score === 0 ? "critical" : "medium"}>{score === 0 ? "CRÍTICA" : "MÉDIA"}</em><ReferenceTags compact codes={[question.iso]} openReference={setActiveReference} /><ReferenceTags compact codes={[question.nist]} openReference={setActiveReference} /><ReferenceTags compact codes={[question.lgpd]} openReference={setActiveReference} /><button className="delete-finding" onClick={() => deleteFinding(question.id)}>Excluir</button></div>)}{activeObservationFindings.map((observation, index) => { const mapping = mapObservation(observation.text); return <div className="table-row observation-finding" key={observationFindingId(observation.id)}><span><i>{String(findings.length + index + 1).padStart(2, "0")}</i><div><b>Observação registrada no Assessment</b><small>Observações · Cruzamento automático indicativo</small><small className="finding-evidence">{observation.text}</small></div></span><em className="medium">ANÁLISE</em><ReferenceTags compact codes={[mapping.iso]} openReference={setActiveReference} /><ReferenceTags compact codes={[mapping.nist]} openReference={setActiveReference} /><ReferenceTags compact codes={[mapping.lgpd]} openReference={setActiveReference} /><button className="delete-finding" onClick={() => { setExcludedFindingIds((current) => [...current, observationFindingId(observation.id)]); setSaved(false); }}>Excluir</button></div>; })}</div></div>
        )}

        {view === "comparison" && <ComparisonView currentAnswers={answers} guardianAnswers={isgAnswers} currentScore={totalScore} guardianScore={isgTotalScore} />}

      </section>
      {activeReference && <ReferenceModal reference={activeReference} close={() => setActiveReference(null)} />}
    </main>
  );
}

function JourneyStatus({ step, current, total, complete }: { step: 1 | 2; current: number; total: number; complete: boolean }) {
  return <section className="journey-status"><div><span className={step >= 1 ? "active" : ""}>1</span><b>Ambiente Atual</b></div><i /><div><span className={step >= 2 ? "active" : ""}>2</span><b>Ambiente Data Guardians</b></div><i /><div><span className={complete ? "active" : ""}>3</span><b>Resultados</b></div><strong>{current}/{total} {step === 1 ? "comentários" : "itens confirmados"}</strong></section>;
}

function JourneyFooter({ complete, incompleteMessage, actionLabel, onContinue, onPending }: { complete: boolean; incompleteMessage: string; actionLabel: string; onContinue: () => void; onPending: () => void }) {
  return <section className={`journey-footer ${complete ? "complete" : ""}`}><div><b>{complete ? "Etapa concluída" : "Etapa em andamento"}</b><span>{complete ? "Todos os requisitos desta etapa foram atendidos." : incompleteMessage}</span></div><button className="primary" onClick={complete ? onContinue : onPending}>{complete ? actionLabel : "Ir para primeira pendência"} →</button></section>;
}

function ReferenceTags({ codes, openReference, compact = false }: { codes: string[]; openReference: (reference: ReferenceEntry) => void; compact?: boolean }) {
  const references = codes.flatMap((code) => code.split(/\n|,/)).map((code) => referenceFor(code)).filter((entry): entry is ReferenceEntry => Boolean(entry));
  return <div className={compact ? "reference-tags compact-reference-tags" : "framework-tags reference-tags"}>{references.map((reference) => <button type="button" key={`${reference.framework}-${reference.code}`} onClick={() => openReference(reference)} title={`Abrir ${reference.code}`}><span>{reference.code}</span><i aria-hidden="true">↗</i></button>)}</div>;
}

function ReferenceModal({ reference, close }: { reference: ReferenceEntry; close: () => void }) {
  return <div className="reference-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="reference-modal" role="dialog" aria-modal="true" aria-labelledby="reference-title"><button className="reference-modal-close" onClick={close} aria-label="Fechar referência">×</button><span className="eyebrow">{reference.framework}</span><div className="reference-code">{reference.code}</div><h2 id="reference-title">{reference.title}</h2><span className="reference-content-type">{reference.contentType}</span><p>{reference.text}</p>{reference.framework === "ISO/IEC 27001:2022" && <aside>O texto acima é uma explicação do objetivo do controle. A redação normativa integral deve ser consultada em uma cópia licenciada da norma.</aside>}<a href={reference.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte oficial <span>↗</span></a><small>{reference.sourceLabel}</small></section></div>;
}

function QuestionList({ mode, pillar, answers, updateAnswer, referenceAnswers, openReference }: { mode: "current" | "guardians"; pillar: Pillar; answers: AnswerState; updateAnswer: (id: string, patch: Partial<AnswerState[string]>) => void; referenceAnswers?: AnswerState; openReference: (reference: ReferenceEntry) => void }) {
  return <section className="question-list"><div className="question-intro"><span style={{ color: pillar.color }}>{pillar.icon}</span><div><small>{pillar.name.toUpperCase()}</small><h2>{pillar.description}</h2></div><strong>{pillar.questions.reduce((sum, q) => sum + answers[q.id].score, 0)}<small>/20</small></strong></div>{pillar.questions.map((q, index) => { const answer = answers[q.id]; const reference = referenceAnswers?.[q.id]; const unchanged = mode === "guardians" && answer.score === (reference?.score ?? 0); const missingGuardianComment = mode === "guardians" && !unchanged && !answer.note.trim(); const reviewed = unchanged || !missingGuardianComment; const missingComment = mode === "current" && !answer.note.trim(); return <article id={`question-${q.id}`} className={`question-card ${missingComment || missingGuardianComment ? "missing-comment" : ""} ${reviewed ? "reviewed" : ""}`} key={q.id}><div className="question-number">{String(index + 1).padStart(2, "0")}</div><div className="question-main"><div className="question-heading"><h3>{q.title}</h3>{mode === "current" && missingComment && <em className="required-badge">Comentário obrigatório</em>}{mode === "guardians" && <em className={reviewed ? "completed-badge" : "required-badge"}>{unchanged ? "Sem alteração" : missingGuardianComment ? "Comentário obrigatório" : "Alteração registrada"}</em>}</div><p>{q.risk}</p><div className="question-tools"><ReferenceTags codes={[q.iso, q.nist, q.lgpd]} openReference={openReference} />{mode === "current" && <button type="button" className={`no-evidence-toggle ${answer.noEvidence ? "active" : ""}`} aria-pressed={answer.noEvidence === true} onClick={() => updateAnswer(q.id, { noEvidence: !answer.noEvidence })}>{answer.noEvidence ? "✓ Sem evidência" : "Sem evidência"}</button>}</div>{mode === "guardians" && <div className="reference-comment"><b>REFERÊNCIA DO AMBIENTE ATUAL</b><span>{reference?.note || "Comentário não informado."}</span></div>}<textarea required={mode === "current" || missingGuardianComment} className={answer.score === 0 ? "standard-comment" : ""} aria-label={`${mode === "current" ? "Comentário" : "Observação Data Guardians"} para ${q.title}`} placeholder={mode === "current" ? "Descreva obrigatoriamente a condição observada..." : unchanged ? "Observação opcional quando a nota não for alterada." : "Descreva a melhoria aplicada no Ambiente Data Guardians..."} value={answer.note} onChange={(e) => updateAnswer(q.id, { note: e.target.value })} /></div><div className="score-selector"><label>{mode === "current" ? "PONTUAÇÃO ATUAL" : "PONTUAÇÃO DATA GUARDIANS"}</label><strong style={{ color: answer.score === q.max ? "var(--success)" : answer.score === 0 ? "var(--danger)" : "var(--warning)" }}>{answer.score}<small>/{q.max}</small></strong>{mode === "guardians" && <div className="guardian-score-lock"><span>🔒 Nota Ambiente Atual</span><b>{reference?.score ?? 0}/{q.max}</b></div>}<input type="range" min={0} max={q.max} value={answer.score} onChange={(e) => updateAnswer(q.id, { score: mode === "guardians" ? Math.max(reference?.score ?? 0, Number(e.target.value)) : Number(e.target.value) })} style={{ "--value": `${(answer.score / q.max) * 100}%` } as React.CSSProperties} /><div><span>Não atende</span><span>Atende</span></div></div></article>; })}</section>;
}

function ComparisonView({ currentAnswers, guardianAnswers, currentScore, guardianScore }: { currentAnswers: AnswerState; guardianAnswers: AnswerState; currentScore: number; guardianScore: number }) {
  const currentMaturity = maturityForScore(currentScore);
  const guardianMaturity = maturityForScore(guardianScore);
  const improvements = pillars.flatMap((pillar) => pillar.questions.map((question) => ({ pillar, question, current: currentAnswers[question.id]?.score ?? 0, guardian: guardianAnswers[question.id]?.score ?? 0 })).filter(({ current, guardian }) => guardian > current));
  const pillarImprovements = pillars.map((pillar) => {
    const current = pillar.questions.reduce((sum, question) => sum + (currentAnswers[question.id]?.score ?? 0), 0);
    const guardian = pillar.questions.reduce((sum, question) => sum + (guardianAnswers[question.id]?.score ?? 0), 0);
    return { pillar, current, guardian, gain: guardian - current, controls: improvements.filter((item) => item.pillar.id === pillar.id) };
  }).filter(({ gain }) => gain > 0);
  const currentPillarScores = pillars.map((pillar) => pillar.questions.reduce((sum, question) => sum + (currentAnswers[question.id]?.score ?? 0), 0)); const guardianPillarScores = pillars.map((pillar) => pillar.questions.reduce((sum, question) => sum + (guardianAnswers[question.id]?.score ?? 0), 0)); return <div className="page comparison-page"><div className="page-title"><div><span className="eyebrow">RESULTADO DA JORNADA</span><h1>Comparativo dos ambientes</h1><p>Visão direta da evolução de maturidade proporcionada pelo modelo Data Guardians.</p></div></div><section className="comparison-radar-stage"><article className="single-radar-card current-radar-card"><header><span>1</span><h2>Maturidade Atual</h2></header><RadarChart current={currentPillarScores} guardians={guardianPillarScores} showGuardians={false} /></article><div className="comparison-transition"><strong><span>{currentScore}<small>/100</small></span><i>→</i><span>{guardianScore}<small>/100</small></span></strong><b>+{guardianScore-currentScore} pontos de maturidade</b><div><span style={{color:scoreColor(currentScore)}}>{currentMaturity.label}</span><i>→</i><span style={{color:scoreColor(guardianScore)}}>{guardianMaturity.label}</span></div></div><article className="single-radar-card guardian-radar-card"><header><span>2</span><h2>Maturidade no Ambiente Data Guardians</h2></header><RadarChart current={currentPillarScores} guardians={guardianPillarScores} showCurrent={false} /></article></section><section className="comparison-narrative"><span>◇</span><p>Com a evolução para o Ambiente Data Guardians, a maturidade aumenta de <b>{currentScore}/100</b> para <b>{guardianScore}/100</b>, com melhoria em <b>{improvements.length} controles</b> distribuídos por <b>{pillarImprovements.length} pilares</b>.</p></section><div className="improvement-heading"><div><span className="eyebrow">PRINCIPAIS EVOLUÇÕES</span><h2>Pontos de melhoria do Ambiente Data Guardians</h2></div><small>Somente controles com ganho de pontuação</small></div>{improvements.length ? <section className="improvement-highlights">{improvements.map(({pillar,question,current,guardian})=><article key={question.id} style={{"--pillar-color":pillar.color} as React.CSSProperties}><span>{pillar.icon}</span><div><small>{pillar.name}</small><h3>{question.title}</h3><p>{guardianAnswers[question.id]?.note}</p><small className="improvement-score-copy">{current}/{question.max} → {guardian}/{question.max}</small></div><strong>+{guardian-current}</strong></article>)}</section>:<section className="no-improvements"><strong>Nenhuma melhoria de pontuação registrada</strong><p>As notas do Ambiente Data Guardians permanecem iguais às do Ambiente Atual.</p></section>}</div>;
}

function SoftwareVersions({ entries, vulnerabilities, update, add, remove, check }: { entries: SoftwareEntry[]; vulnerabilities: Vulnerability[]; update: (id: string, patch: Partial<SoftwareEntry>) => void; add: () => void; remove: (id: string) => void; check: (entry: SoftwareEntry) => void }) {
  return <section className="software-inventory"><div className="software-intro"><div><span className="eyebrow">INVENTÁRIO DE BACKUP</span><h2>Versões de Software</h2><p>Informe o produto, a localidade do cliente e a versão instalada.</p></div><button className="primary" onClick={add}>＋ Adicionar Backup Server</button></div><div className="software-list">{entries.map((entry, index) => { const count = vulnerabilities.filter((item) => item.serverId === entry.id).length; return <article className="software-card" key={entry.id}><div className="software-index">{String(index + 1).padStart(2, "0")}</div><label>PRODUTO OU FABRICANTE<input value={entry.server} onChange={(e) => update(entry.id, { server: e.target.value, identifiedProduct: undefined })} placeholder="Ex.: Veeam" /></label><label>SITE<input value={entry.site} onChange={(e) => update(entry.id, { site: e.target.value })} placeholder="Ex.: Unidade Ribeirão Preto" /></label><label>VERSÃO / BUILD<input value={entry.version} onChange={(e) => update(entry.id, { version: e.target.value, identifiedProduct: undefined })} placeholder="Ex.: 12.3.2.3617" /></label><div className="software-actions"><button className="primary" onClick={() => check(entry)} disabled={entry.checking}>{entry.checking ? "Identificando produto..." : "Verificar vulnerabilidades"}</button>{entries.length > 1 && <button className="remove-button" onClick={() => remove(entry.id)}>Remover</button>}</div>{entry.error && <p className="software-error">{entry.error}</p>}{entry.checkedAt && !entry.error && <p className="software-status"><i /> Produto identificado: <b>{entry.identifiedProduct || entry.server}</b>{entry.site ? <> · Site: <b>{entry.site}</b></> : null} · Consulta NVD: {entry.checkedAt} · {count} vulnerabilidade(s)</p>}</article>; })}</div><div className="nvd-note"><b>Fonte: National Vulnerability Database (NVD/NIST).</b><span>O produto é inferido pelo fabricante e pelo padrão da versão. Correspondências ambíguas não são registradas automaticamente.</span></div></section>;
}

function Observations({ observations, add, update, remove }: { observations: AssessmentObservation[]; add: () => void; update: (id: string, text: string) => void; remove: (id: string) => void }) {
  return <section className="observations-panel"><div className="software-intro"><div><span className="eyebrow">REGISTRO COMPLEMENTAR</span><h2>Observações</h2><p>Registre condições adicionais identificadas durante o Assessment. Cada texto será cruzado com ISO/IEC 27001, NIST CSF e LGPD.</p></div><button className="primary" onClick={add}>＋ Incluir Observação</button></div>{observations.length === 0 ? <div className="observations-empty"><span>✎</span><b>Nenhuma observação registrada</b><p>Use “Incluir Observação” para documentar informações que não estejam contempladas nos pilares.</p></div> : <div className="observations-list">{observations.map((observation, index) => { const mapping = observation.text.trim() ? mapObservation(observation.text) : null; return <article className="observation-card" key={observation.id}><div className="observation-head"><span>OBSERVAÇÃO {String(index + 1).padStart(2, "0")}</span><button onClick={() => remove(observation.id)}>Excluir</button></div><textarea autoFocus={!observation.text} value={observation.text} onChange={(event) => update(observation.id, event.target.value)} placeholder="Descreva a condição, evidência, risco ou oportunidade de melhoria identificada..." />{mapping && <div className="observation-cross"><span><b>ISO/IEC 27001</b>{mapping.iso.replaceAll("\n", " · ")}</span><span><b>NIST CSF</b>{mapping.nist.replaceAll("\n", " · ")}</span><span><b>LGPD</b>{mapping.lgpd.replaceAll("\n", " · ")}</span></div>}</article>; })}</div>}<div className="nvd-note"><b>Cruzamento técnico indicativo.</b><span>As referências devem ser validadas por especialistas de segurança, compliance e jurídico antes de uma conclusão formal de não conformidade.</span></div></section>;
}
