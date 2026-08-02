import pptxgen from "pptxgenjs";
import { pillars } from "../assessment-data";
import type { VulnerabilityForExport } from "./vulnerability-summary";

type Answer = { score: number; note: string };
type Answers = Record<string, Answer>;
type LgpdExposure = { gap: string; controls: string; exposure: string };

const T = { bg: "02030D", panel: "050610", header: "351A61", white: "F7F8FC", muted: "D6D8E1", line: "65447E" };
const controlCross: Record<string, string> = {
  imutabilidade: "ART. 46\nART. 49",
  hardening: "ART. 46\nART. 49",
  acesso: "ART. 46\nART. 47",
  criptografia: "ART. 46\nART. 49",
  segregacao: "ART. 46\nART. 49",
  "copia-secundaria": "ART. 46\nART. 49",
  ltr: "ART. 15\nART. 16\nART. 46",
  monitoramento: "ART. 46\nART. 48",
  patches: "ART. 46\nART. 49",
  airgap: "ART. 46\nART. 49",
  cofre: "ART. 46\nART. 49",
  compliance: "ART. 6º, X\nART. 50",
  "clean-room": "ART. 46\nART. 49",
  deteccao: "ART. 46\nART. 48",
  auditoria: "ART. 48\nART. 50",
  "golden-copy": "ART. 46\nART. 49",
  testes: "ART. 46\nART. 49\nART. 50",
  equipe: "ART. 46\nART. 50",
  runbooks: "ART. 48\nART. 50",
};

const clean = (value: unknown, fallback = "") => typeof value === "string" && value.trim() ? value.trim() : fallback;
const score = (value: unknown, max: number) => Math.max(0, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : 0));
const commentControlRules = [
  [/mfa|rbac|sso|acesso|privil[eé]gio|credencial|dom[ií]nio/i, ["ART. 46", "ART. 47"]],
  [/criptograf|tls|cifra|rede|segment|segreg|vlan|patch|upgrade|vers[aã]o|cve|vulnerabil|air.?gap|cofre|imutab|restore|restaura|recupera|teste/i, ["ART. 46", "ART. 49"]],
  [/monitor|alerta|observab|log|auditor|incidente|crise/i, ["ART. 46", "ART. 48", "ART. 50"]],
  [/runbook|documenta|governan/i, ["ART. 48", "ART. 50"]],
] as const;
function controlsWithComment(base: string, comment: string) {
  const controls = new Set(base.split("\n").filter(Boolean));
  commentControlRules.forEach(([pattern, additions]) => { if (pattern.test(comment)) additions.forEach((item) => controls.add(item)); });
  return [...controls].join("\n");
}

function buildExposures(answers: Answers, vulnerabilities: VulnerabilityForExport[], excludedFindingIds: string[]) {
  const rows: LgpdExposure[] = [];
  const excluded = new Set(excludedFindingIds);
  pillars.forEach((pillar) => pillar.questions.forEach((question) => {
    if (excluded.has(question.id)) return;
    const current = score(answers[question.id]?.score, question.max);
    if (current >= question.max) return;
    const evidence = clean(answers[question.id]?.note);
    const status = current <= 0 ? "Controle não atendido" : `Controle parcialmente atendido (${current}/${question.max})`;
    rows.push({
      gap: `${question.title}\n${status}${evidence ? ` · Evidência: ${evidence}` : " · Evidência não informada"}`,
      controls: controlsWithComment(controlCross[question.id] ?? question.lgpd, evidence),
      exposure: `${question.risk}${evidence ? ` Contexto considerado no cruzamento: ${evidence}` : ""}`,
    });
  }));

  const groups = new Map<string, VulnerabilityForExport[]>();
  vulnerabilities.forEach((vulnerability) => {
    const key = vulnerability.serverId || `${vulnerability.site}|${vulnerability.version}`;
    groups.set(key, [...(groups.get(key) ?? []), vulnerability]);
  });
  groups.forEach((cves) => {
    const first = cves[0];
    const ids = cves.map((cve) => cve.id).join(", ");
    const risks = [...new Set(cves.map((cve) => clean(cve.risk)).filter(Boolean))].slice(0, 2).join(" ");
    rows.push({
      gap: `${clean(first.site, "Site não informado")} · ${clean(first.identifiedProduct || first.server, "Software de backup")} ${clean(first.version)}\nCVEs aplicáveis: ${ids}`,
      controls: "ART. 46\nART. 49",
      exposure: risks || "Vulnerabilidades conhecidas podem comprometer a segurança do tratamento e a disponibilidade, integridade ou confidencialidade de dados pessoais mantidos em backup.",
    });
  });

  return rows.length ? rows : [{
    gap: "Nenhuma exposição potencial identificada com os dados disponíveis",
    controls: "—",
    exposure: "Manter evidências, monitoramento e revisões periódicas. A ausência de achados não comprova, isoladamente, conformidade integral com a LGPD.",
  }];
}

const columns = [
  { label: "RISCO / GAP MAPEADO", x: .48, w: 3.38 },
  { label: "DISPOSITIVO LGPD\nRELACIONADO", x: 3.86, w: 2.3 },
  { label: "POTENCIAL EXPOSIÇÃO / RISCO DE NÃO ATENDIMENTO", x: 6.16, w: 6.7 },
];

function addTableHeader(slide: pptxgen.Slide, page: number, pages: number) {
  columns.forEach((column, index) => {
    slide.addShape("rect", { x: column.x, y: 2.25, w: column.w, h: .52, fill: { color: T.header }, line: { color: T.line, width: .7 } });
    const label = index === 2 && pages > 1 ? `${column.label}  ·  ${page + 1}/${pages}` : column.label;
    slide.addText(label, { x: column.x + .08, y: 2.38, w: column.w - .16, h: .24, fontFace: "Arial", fontSize: 7.5, bold: true, color: T.white, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  });
}

function addRow(slide: pptxgen.Slide, row: LgpdExposure, number: number, y: number, h: number) {
  columns.forEach((column) => slide.addShape("rect", { x: column.x, y, w: column.w, h, fill: { color: T.panel, transparency: 2 }, line: { color: T.line, width: .55 } }));
  slide.addShape("ellipse", { x: .68, y: y + h / 2 - .19, w: .38, h: .38, fill: { color: T.panel }, line: { color: T.white, width: 1 } });
  slide.addText(String(number), { x: .68, y: y + h / 2 - .06, w: .38, h: .12, fontFace: "Arial", fontSize: 7.7, bold: true, color: T.white, align: "center", margin: 0 });
  slide.addText(row.gap, { x: 1.18, y: y + .16, w: 2.48, h: h - .3, fontFace: "Arial", fontSize: 7.1, bold: true, color: T.white, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText(row.controls, { x: 4.08, y: y + .16, w: 1.86, h: h - .3, fontFace: "Arial", fontSize: 8.5, bold: true, color: T.white, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText(row.exposure, { x: 6.38, y: y + .16, w: 6.26, h: h - .3, fontFace: "Arial", fontSize: 7.2, bold: true, color: T.muted, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
}

export function addLgpdExposureSlides(pptx: pptxgen, answers: Answers, vulnerabilities: VulnerabilityForExport[], background: string, excludedFindingIds: string[] = []) {
  const rows = buildExposures(answers ?? {}, vulnerabilities ?? [], excludedFindingIds);
  const pageSize = 4;
  const pages = Array.from({ length: Math.ceil(rows.length / pageSize) }, (_, index) => rows.slice(index * pageSize, (index + 1) * pageSize));
  pages.forEach((pageRows, pageIndex) => {
    const slide = pptx.addSlide();
    slide.background = { color: T.bg };
    slide.addImage({ data: background, x: 0, y: 0, w: 13.334, h: 7.5 });
    addTableHeader(slide, pageIndex, pages.length);
    const rowHeight = 4.24 / pageRows.length;
    pageRows.forEach((row, index) => addRow(slide, row, pageIndex * pageSize + index + 1, 2.77 + index * rowHeight, rowHeight));
    slide.addText("Referência: Lei nº 13.709/2018 (LGPD) e orientações da ANPD. Cruzamento técnico indicativo, condicionado ao tratamento de dados pessoais; não constitui parecer jurídico ou auditoria formal.", { x: .52, y: 7.13, w: 12.26, h: .12, fontFace: "Arial", fontSize: 5.6, color: "858B9B", margin: 0, align: "right", breakLine: false, fit: "shrink" });
  });
}
