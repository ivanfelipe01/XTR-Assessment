import pptxgen from "pptxgenjs";
import { maturityForScore, type Pillar } from "../assessment-data";

type Answer = { score: number; note: string };
type Answers = Record<string, Answer>;

const T = {
  bg: "02030D", panel: "080A14", purple: "A83EFF", purpleDark: "2B1765", blue: "009DFF",
  success: "00D990", warning: "FFB800", danger: "FF382F", white: "F7F8FC", muted: "C7CBD6", line: "40355D",
};

const clean = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const clampScore = (value: unknown, max: number) => Math.max(0, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : 0));
const statusFor = (score: number, max: number) => score >= max ? { label: "ATENDIDO", color: T.success, symbol: "✓" } : score <= 0 ? { label: "NÃO ATENDIDO", color: T.danger, symbol: "×" } : { label: "PARCIAL", color: T.warning, symbol: "!" };
const maturityColor = (label: string) => label === "Preocupante" ? T.danger : label === "Baixo" ? T.warning : label === "Intermediário" ? "FFD84D" : label === "Avançado" ? T.blue : T.success;

function summaryFor(pillar: Pillar, answers: Answers, score: number) {
  const missing = pillar.questions.filter((q) => clampScore(answers[q.id]?.score, q.max) === 0).map((q) => q.title.toLowerCase());
  const partial = pillar.questions.filter((q) => { const s = clampScore(answers[q.id]?.score, q.max); return s > 0 && s < q.max; }).map((q) => q.title.toLowerCase());
  if (!missing.length && !partial.length) return "Controles implementados de forma consistente. Recomenda-se preservar as evidências e revisar periodicamente a efetividade das proteções.";
  const gaps = [...partial, ...missing].slice(0, 3).join(", ");
  return `Controles ${score === 0 ? "ainda não implementados" : "parcialmente implementados"}. Permanecem lacunas relevantes em ${gaps || "controles essenciais"}, elevando a exposição do ambiente de backup.`;
}

function estimateLines(text: string, charsPerLine: number) {
  return Math.max(1, Math.ceil(text.length / charsPerLine) + (text.match(/\n/g)?.length ?? 0));
}

function rowUnits(pillar: Pillar, index: number, answers: Answers) {
  const q = pillar.questions[index];
  const note = clean(answers[q.id]?.note, "Evidência não informada pelo cliente.");
  const rec = (q.recommendations?.length ? q.recommendations : ["Definir e executar um plano de adequação para este controle."]).join("\n");
  return Math.max(2.3, estimateLines(q.title, 26) * .72, estimateLines(note, 42) * .58, estimateLines(q.risk, 31) * .55, estimateLines(rec, 35) * .55);
}

function paginate(pillar: Pillar, answers: Answers) {
  const pages: number[][] = [];
  let page: number[] = [];
  let used = 0;
  pillar.questions.forEach((_, index) => {
    const units = rowUnits(pillar, index, answers);
    if (page.length && used + units > 14.5) { pages.push(page); page = []; used = 0; }
    page.push(index); used += units;
  });
  if (page.length) pages.push(page);
  return pages;
}

function addInstitutionalHeader(slide: pptxgen.Slide, logo: string, continuation: boolean) {
  slide.background = { color: T.bg };
  slide.addImage({ data: logo, x: .48, y: .25, w: 1.78, h: .45 });
  slide.addText(continuation ? "DETALHAMENTO DO PILAR · CONTINUAÇÃO" : "RESULTADO DETALHADO DO PILAR", { x: 9.1, y: .38, w: 3.72, h: .17, fontFace: "Arial", fontSize: 7.3, bold: true, color: "7F8494", align: "right", margin: 0, breakLine: false });
}

function addPillarCard(slide: pptxgen.Slide, pillar: Pillar, index: number, score: number, max: number) {
  slide.addShape("roundRect", { x: .48, y: .9, w: 12.36, h: .92, rectRadius: .05, fill: { color: "070913", transparency: 4 }, line: { color: T.purple, width: 1 } });
  slide.addShape("ellipse", { x: .72, y: 1.1, w: .48, h: .48, fill: { color: T.purpleDark, transparency: 16 }, line: { color: T.purple, width: 1.2 } });
  slide.addText("▣", { x: .72, y: 1.19, w: .48, h: .17, fontFace: "Arial", fontSize: 12, bold: true, color: T.purple, align: "center", margin: 0 });
  slide.addText(`NÍVEL ${index + 1}`, { x: 1.38, y: 1.06, w: .9, h: .15, fontFace: "Arial", fontSize: 7.2, bold: true, color: T.purple, margin: 0 });
  slide.addText(pillar.name.toUpperCase(), { x: 1.38, y: 1.27, w: 3.55, h: .24, fontFace: "Arial", fontSize: 13.5, bold: true, color: T.white, margin: 0, breakLine: false, fit: "shrink" });
  slide.addShape("line", { x: 5.12, y: 1.08, w: 0, h: .55, line: { color: T.line, width: 1 } });
  slide.addShape("ellipse", { x: 5.42, y: 1.12, w: .42, h: .42, fill: { color: "101426" }, line: { color: T.blue, width: 1 } });
  slide.addText("◉", { x: 5.42, y: 1.2, w: .42, h: .16, fontFace: "Arial", fontSize: 10, color: T.blue, align: "center", margin: 0 });
  slide.addText(clean(pillar.description, "Avalia os controles que sustentam a proteção e a resiliência do ambiente de backup."), { x: 5.98, y: 1.09, w: 4.3, h: .49, fontFace: "Arial", fontSize: 8.6, color: T.muted, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText("MÁXIMA", { x: 10.5, y: 1.07, w: .78, h: .14, fontFace: "Arial", fontSize: 6.5, bold: true, color: T.purple, align: "center", margin: 0 });
  slide.addText(String(max), { x: 10.5, y: 1.25, w: .78, h: .3, fontFace: "Arial", fontSize: 19, bold: true, color: T.purple, align: "center", margin: 0 });
  slide.addText("ATUAL", { x: 11.63, y: 1.07, w: .78, h: .14, fontFace: "Arial", fontSize: 6.5, bold: true, color: T.blue, align: "center", margin: 0 });
  slide.addText(String(score), { x: 11.63, y: 1.25, w: .78, h: .3, fontFace: "Arial", fontSize: 19, bold: true, color: T.blue, align: "center", margin: 0 });
}

const columns = [
  { label: "CONTROLE AVALIADO", x: .48, w: 2.12 },
  { label: "EVIDÊNCIA / RESPOSTA DO CLIENTE", x: 2.6, w: 2.66 },
  { label: "RISCO ASSOCIADO", x: 5.26, w: 2.22 },
  { label: "COMO RESOLVER", x: 7.48, w: 2.76 },
  { label: "PONTUAÇÃO\nMÁXIMA", x: 10.24, w: 1.28 },
  { label: "PONTUAÇÃO\nATUAL", x: 11.52, w: 1.32 },
];

function addTableHeader(slide: pptxgen.Slide) {
  columns.forEach((c) => {
    slide.addShape("rect", { x: c.x, y: 2.02, w: c.w, h: .48, fill: { color: T.purpleDark }, line: { color: "5A3D83", width: .6 } });
    slide.addText(c.label, { x: c.x + .06, y: 2.15, w: c.w - .12, h: .2, fontFace: "Arial", fontSize: 6.4, bold: true, color: T.white, align: "center", valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  });
}

function addControlRow(slide: pptxgen.Slide, pillar: Pillar, index: number, answers: Answers, y: number, h: number) {
  const q = pillar.questions[index];
  const score = clampScore(answers[q.id]?.score, q.max);
  const status = statusFor(score, q.max);
  const note = clean(answers[q.id]?.note, "Evidência não informada pelo cliente.");
  const recommendations = q.recommendations?.length ? q.recommendations : ["Definir e executar um plano de adequação para este controle."];
  columns.forEach((c) => slide.addShape("rect", { x: c.x, y, w: c.w, h, fill: { color: T.panel }, line: { color: T.line, width: .55 } }));
  slide.addShape("ellipse", { x: .65, y: y + .17, w: .3, h: .3, fill: { color: T.purpleDark, transparency: 12 }, line: { color: T.purple, width: .8 } });
  slide.addText(["◉", "⚙", "◎", "▱", "⇄"][index % 5], { x: .65, y: y + .23, w: .3, h: .12, fontFace: "Arial", fontSize: 7.2, color: T.purple, align: "center", margin: 0 });
  slide.addText(q.title, { x: 1.02, y: y + .14, w: 1.42, h: h - .25, fontFace: "Arial", fontSize: 7.6, bold: true, color: T.white, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  slide.addShape("ellipse", { x: 2.76, y: y + .17, w: .28, h: .28, fill: { color: status.color, transparency: 78 }, line: { color: status.color, width: 1 } });
  slide.addText(status.symbol, { x: 2.76, y: y + .215, w: .28, h: .13, fontFace: "Arial", fontSize: 8.4, bold: true, color: status.color, align: "center", margin: 0 });
  slide.addText(status.label, { x: 3.13, y: y + .15, w: 1.74, h: .15, fontFace: "Arial", fontSize: 6.1, bold: true, color: status.color, margin: 0 });
  slide.addText(note, { x: 2.76, y: y + .39, w: 2.34, h: h - .5, fontFace: "Arial", fontSize: 6.7, color: T.muted, valign: "top", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText([{ text: "• ", options: { color: T.purple, bold: true } }, { text: clean(q.risk, "Risco não informado."), options: { color: T.muted } }], { x: 5.43, y: y + .17, w: 1.9, h: h - .3, fontFace: "Arial", fontSize: 6.6, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  const recRuns = recommendations.flatMap((rec, i) => [{ text: "• ", options: { color: T.purple, bold: true } }, { text: `${clean(rec, "Recomendação não informada.")}${i < recommendations.length - 1 ? "\n" : ""}`, options: { color: T.muted } }]);
  slide.addText(recRuns, { x: 7.65, y: y + .17, w: 2.42, h: h - .3, fontFace: "Arial", fontSize: 6.5, valign: "mid", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText(String(q.max), { x: 10.24, y: y + h / 2 - .18, w: 1.28, h: .36, fontFace: "Arial", fontSize: 19, bold: true, color: T.purple, align: "center", valign: "mid", margin: 0 });
  slide.addText(String(score), { x: 11.52, y: y + h / 2 - .18, w: 1.32, h: .36, fontFace: "Arial", fontSize: 19, bold: true, color: T.blue, align: "center", valign: "mid", margin: 0 });
}

function addFooter(slide: pptxgen.Slide, pillar: Pillar, answers: Answers, score: number, max: number) {
  const normalized = max ? Math.round(score / max * 100) : 0;
  const maturity = maturityForScore(normalized);
  const color = maturityColor(maturity.label);
  slide.addShape("roundRect", { x: .48, y: 6.62, w: 12.36, h: .62, rectRadius: .05, fill: { color: "070913" }, line: { color: T.purple, width: 1 } });
  slide.addText("◎", { x: .68, y: 6.79, w: .28, h: .18, fontFace: "Arial", fontSize: 11, color: T.purple, align: "center", margin: 0 });
  slide.addText("RESUMO DO PILAR", { x: 1.03, y: 6.72, w: 1.2, h: .13, fontFace: "Arial", fontSize: 6.2, bold: true, color: T.purple, margin: 0 });
  slide.addText(summaryFor(pillar, answers, score), { x: 1.03, y: 6.91, w: 6.87, h: .2, fontFace: "Arial", fontSize: 6.4, color: T.muted, margin: 0, breakLine: false, fit: "shrink" });
  slide.addShape("line", { x: 8.15, y: 6.76, w: 0, h: .34, line: { color: T.line, width: 1 } });
  slide.addText("MATURIDADE", { x: 8.38, y: 6.72, w: 1.25, h: .13, fontFace: "Arial", fontSize: 6.2, bold: true, color: T.muted, align: "center", margin: 0 });
  slide.addText(`${maturity.label === "Baixo" || maturity.label === "Preocupante" ? "⚠ " : "✓ "}${maturity.label}`, { x: 8.34, y: 6.91, w: 1.35, h: .18, fontFace: "Arial", fontSize: 10.5, bold: true, color, align: "center", margin: 0 });
  slide.addShape("line", { x: 9.9, y: 6.76, w: 0, h: .34, line: { color: T.line, width: 1 } });
  slide.addText("PONTUAÇÃO DO PILAR", { x: 10.12, y: 6.72, w: 2.34, h: .13, fontFace: "Arial", fontSize: 6.2, bold: true, color: T.muted, align: "center", margin: 0 });
  slide.addText([{ text: String(score), options: { color: T.blue, bold: true } }, { text: ` / ${max}`, options: { color: T.white, bold: true } }], { x: 10.12, y: 6.89, w: 2.34, h: .22, fontFace: "Arial", fontSize: 14.5, align: "center", margin: 0 });
}

export function addPillarDetailSlides(pptx: pptxgen, pillar: Pillar, pillarIndex: number, answers: Answers, logo: string) {
  const score = pillar.questions.reduce((sum, q) => sum + clampScore(answers[q.id]?.score, q.max), 0);
  const max = pillar.questions.reduce((sum, q) => sum + q.max, 0);
  const pages = paginate(pillar, answers);
  pages.forEach((indices, pageIndex) => {
    const slide = pptx.addSlide();
    addInstitutionalHeader(slide, logo, pageIndex > 0);
    addPillarCard(slide, pillar, pillarIndex, score, max);
    addTableHeader(slide);
    const available = pageIndex === pages.length - 1 ? 3.92 : 4.65;
    const weights = indices.map((index) => rowUnits(pillar, index, answers));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    let y = 2.5;
    indices.forEach((index, position) => {
      const h = available * weights[position] / totalWeight;
      addControlRow(slide, pillar, index, answers, y, h);
      y += h;
    });
    if (pageIndex === pages.length - 1) addFooter(slide, pillar, answers, score, max);
    else slide.addText(`Continua no próximo slide · ${pageIndex + 1}/${pages.length}`, { x: 9.8, y: 7.08, w: 3.02, h: .12, fontFace: "Arial", fontSize: 5.8, color: "72798B", align: "right", margin: 0 });
  });
}
