import pptxgen from "pptxgenjs";
import { pillars } from "../../assessment-data";
import coverReference from "../../assets/ppt-cover-reference.png?inline";
import objectiveReference from "../../assets/ppt-objective-reference.png?inline";
import resilienceMessageReference from "../../assets/ppt-resilience-message-reference.png?inline";
import dataResilienceJourneyReference from "../../assets/ppt-data-resilience-journey-reference.png?inline";
import xtrAssessmentDividerReference from "../../assets/ppt-xtr-assessment-divider-reference.jpg?inline";
import xtremeItLogo from "../../assets/xtreme-it-logo.png?inline";

type ExportPayload = { client: string; answers: Record<string, { score: number; note: string }>; pillarScores: number[]; totalScore: number; maturity: string; findings: Array<{ pillar: { name: string }; question: { title: string; iso: string; nist: string; lgpd: string }; score: number }> };

const C = { bg: "05070D", panel: "111521", cyan: "1DDBE0", magenta: "EC39CB", white: "F5F7FB", muted: "8791A5", line: "283047", danger: "FF4D68" };
function title(slide: pptxgen.Slide, heading: string, sub = "") { slide.background = { color: C.bg }; slide.addText("XTREME IT", { x: .45, y: .24, w: 1.2, h: .2, fontFace: "Arial", fontSize: 8, bold: true, color: C.white }); slide.addText(heading, { x: .55, y: .62, w: 11.8, h: .42, fontFace: "Arial", fontSize: 23, bold: true, color: C.white, breakLine: false }); if (sub) slide.addText(sub, { x: .55, y: 1.04, w: 11.6, h: .22, fontFace: "Arial", fontSize: 8, color: C.muted }); slide.addShape("line", { x: .55, y: 1.34, w: 12.1, h: 0, line: { color: C.line, width: 1 } }); }
export async function POST(request: Request) {
  const data = await request.json() as ExportPayload;
  const generatedAt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const pptx = new pptxgen(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "Xtreme IT"; pptx.subject = "XTR Assessment"; pptx.title = `Assessment de Resiliência de Dados — ${data.client}`; pptx.company = "Xtreme IT"; pptx.lang = "pt-BR"; pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial", lang: "pt-BR" };
  let slide = pptx.addSlide();
  slide.background = { color: "000106" };
  slide.addImage({ data: coverReference, x: 0, y: 0, w: 13.334, h: 7.5 });
  slide.addImage({ data: xtremeItLogo, x: 10.62, y: .48, w: 2.32, h: .59 });
  slide.addShape("rect", { x: 11.5, y: 6.8, w: 1.55, h: .55, fill: { color: "03060D" }, line: { transparency: 100 } });
  slide.addText(generatedAt, { x: 11.55, y: 6.89, w: 1.36, h: .22, fontFace: "Raleway", fontSize: 10, color: "D8D8D8", align: "right", margin: 0, breakLine: false });
  slide.addShape("line", { x: 12.05, y: 7.22, w: .43, h: 0, line: { color: "1DDBE0", width: 1.1 } });
  slide.addShape("line", { x: 12.48, y: 7.22, w: .43, h: 0, line: { color: "EC39CB", width: 1.1 } });
  slide = pptx.addSlide();
  slide.background = { color: "000000" };
  slide.addImage({ data: objectiveReference, x: 0, y: 0, w: 13.334, h: 7.5 });
  slide = pptx.addSlide();
  slide.background = { color: "000000" };
  slide.addImage({ data: resilienceMessageReference, x: 0, y: 0, w: 13.334, h: 7.5 });
  slide = pptx.addSlide();
  slide.background = { color: "00020B" };
  slide.addImage({ data: dataResilienceJourneyReference, x: 0, y: 0, w: 13.334, h: 7.5 });
  slide = pptx.addSlide();
  slide.background = { color: "000000" };
  slide.addImage({ data: xtrAssessmentDividerReference, x: 0, y: 0, w: 13.334, h: 7.5 });
  slide = pptx.addSlide(); title(slide, "Diagnóstico Atual", "Nível de Maturidade em Resiliência de Dados"); slide.addText(String(data.totalScore), { x: .72, y: 1.78, w: 2.3, h: 1.15, fontSize: 60, bold: true, align: "center", color: data.totalScore <= 47 ? C.danger : C.cyan }); slide.addText("/100 PONTOS", { x: 1.25, y: 2.82, w: 1.3, h: .25, fontSize: 9, align: "center", color: C.muted }); slide.addText(data.maturity.toUpperCase(), { x: .72, y: 3.3, w: 2.3, h: .35, fontSize: 16, bold: true, align: "center", color: C.cyan }); pillars.forEach((p, i) => { const y = 1.75 + i * .68; slide.addText(p.name, { x: 3.55, y, w: 3.7, h: .25, fontSize: 11, color: C.white }); slide.addShape("rect", { x: 7.25, y: y + .03, w: 4.1, h: .12, fill: { color: "202637" }, line: { transparency: 100 } }); slide.addShape("rect", { x: 7.25, y: y + .03, w: 4.1 * data.pillarScores[i] / 20, h: .12, fill: { color: i % 2 ? C.cyan : C.magenta }, line: { transparency: 100 } }); slide.addText(`${data.pillarScores[i]}/20`, { x: 11.55, y: y - .04, w: .7, h: .25, fontSize: 10, bold: true, color: C.white }); });
  pillars.forEach((pillar, pIndex) => { slide = pptx.addSlide(); title(slide, pillar.name, `Maturidade e riscos do negócio • ${data.pillarScores[pIndex]}/20 pontos`); const rows = pillar.questions.map((q) => [{ text: q.title, options: { bold: true, color: C.white } }, { text: `${data.answers[q.id]?.score ?? 0}/${q.max}`, options: { bold: true, color: C.cyan, align: "center" as const } }, { text: data.answers[q.id]?.note || q.risk, options: { color: C.muted } }]); slide.addTable([[{ text: "CRITÉRIO", options: { bold: true } }, { text: "NOTA", options: { bold: true } }, { text: "EVIDÊNCIA / EXPOSIÇÃO", options: { bold: true } }], ...rows], { x: .62, y: 1.58, w: 12.05, h: 4.8, border: { type: "solid", color: C.line, width: .5 }, fill: C.panel, color: C.white, fontFace: "Arial", fontSize: 10, rowH: .62, colW: [3.4, .8, 7.85], margin: .12, breakLine: false, autoFit: false }); });
  const chunks = Array.from({ length: Math.ceil(data.findings.length / 7) }, (_, i) => data.findings.slice(i * 7, i * 7 + 7));
  for (const [index, chunk] of chunks.entries()) { slide = pptx.addSlide(); title(slide, "Exposições ISO/IEC 27001 • NIST • LGPD", `Potenciais riscos em recuperação e continuidade ${index + 1}/${chunks.length}`); const rows = chunk.map((f, i) => [String(index * 7 + i + 1).padStart(2, "0"), f.question.title, f.question.iso, f.question.nist, f.question.lgpd]); slide.addTable([["#", "RISCO / GAP MAPEADO", "ISO 27001", "NIST CSF", "LGPD"], ...rows], { x: .62, y: 1.58, w: 12.05, h: 4.9, border: { type: "solid", color: C.line, width: .5 }, fill: C.panel, color: C.white, fontFace: "Arial", fontSize: 9, rowH: .58, colW: [.55, 6.2, 1.6, 1.6, 2.1], margin: .1, bold: false }); }
  slide = pptx.addSlide(); title(slide, "Conclusões e Próximos Passos", "Transformar risco em continuidade operacional"); slide.addText("A prioridade é reduzir as exposições críticas, comprovar a recuperabilidade e estabelecer uma governança contínua para proteção de dados.", { x: .75, y: 1.75, w: 11.4, h: .7, fontSize: 20, bold: true, color: C.white, breakLine: false }); const top = data.findings.slice(0, 5); top.forEach((f, i) => { slide.addText(String(i + 1).padStart(2, "0"), { x: .85, y: 2.8 + i * .58, w: .45, h: .25, fontSize: 9, bold: true, color: C.cyan }); slide.addText(f.question.title, { x: 1.4, y: 2.75 + i * .58, w: 10.5, h: .3, fontSize: 12, color: C.white }); }); slide.addText("Este material apresenta exposições potenciais e não constitui parecer jurídico ou certificação de conformidade.", { x: .75, y: 6.65, w: 11.5, h: .25, fontSize: 7, color: C.muted });
  const output = await pptx.write({ outputType: "arraybuffer" });
  return new Response(output as ArrayBuffer, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": `attachment; filename="XTR-Assessment.pptx"` } });
}
