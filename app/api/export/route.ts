import pptxgen from "pptxgenjs";
import { pillars } from "../../assessment-data";
import coverReference from "../../assets/ppt-cover-reference.png?inline";
import objectiveReference from "../../assets/ppt-objective-reference.png?inline";
import resilienceMessageReference from "../../assets/ppt-resilience-message-reference.png?inline";
import dataResilienceJourneyReference from "../../assets/ppt-data-resilience-journey-reference.png?inline";
import xtrAssessmentDividerReference from "../../assets/ppt-xtr-assessment-divider-reference.jpg?inline";
import diagnosisDashboardBackground from "../../assets/ppt-diagnosis-dashboard-background.jpg?inline";
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
  slide = pptx.addSlide();
  slide.background = { color: "000000" };
  slide.addImage({ data: diagnosisDashboardBackground, x: 0, y: 0, w: 13.334, h: 7.5 });
  const maturityColors = ["FF4D68", "FF8A4C", "FFD166", "1DDBE0", "35D999"];
  const currentMaturityColor = data.totalScore <= 20 ? maturityColors[0] : data.totalScore <= 47 ? maturityColors[1] : data.totalScore <= 61 ? maturityColors[2] : data.totalScore <= 74 ? maturityColors[3] : maturityColors[4];
  slide.addShape("roundRect", { x: .55, y: 2.35, w: 2.45, h: 3.25, rectRadius: .08, fill: { color: "080B12", transparency: 8 }, line: { color: "263044", width: 1 } });
  slide.addText("SCORE DE MATURIDADE", { x: .78, y: 2.62, w: 2, h: .25, fontFace: "Arial", fontSize: 10, bold: true, color: "AAB2C2", align: "center", margin: 0 });
  slide.addShape("ellipse", { x: 1.04, y: 3.02, w: 1.47, h: 1.47, fill: { color: "05070D" }, line: { color: currentMaturityColor, width: 4 } });
  slide.addText(String(data.totalScore), { x: 1.15, y: 3.32, w: 1.02, h: .55, fontFace: "Arial", fontSize: 34, bold: true, color: currentMaturityColor, align: "center", margin: 0, breakLine: false });
  slide.addText("/100", { x: 1.86, y: 3.7, w: .42, h: .2, fontFace: "Arial", fontSize: 8, color: "AAB2C2", margin: 0 });
  slide.addText(data.maturity.toUpperCase(), { x: .76, y: 4.7, w: 2.02, h: .34, fontFace: "Arial", fontSize: 13, bold: true, color: currentMaturityColor, align: "center", margin: 0, breakLine: false });
  slide.addText(data.client || "Assessment em andamento", { x: .76, y: 5.16, w: 2.02, h: .2, fontFace: "Arial", fontSize: 8, color: "8791A5", align: "center", margin: 0, breakLine: false });
  slide.addShape("roundRect", { x: 3.18, y: 2.35, w: 9.56, h: 1.42, rectRadius: .06, fill: { color: "080B12", transparency: 8 }, line: { color: "263044", width: 1 } });
  slide.addText("LEGENDA DOS NÍVEIS DE MATURIDADE", { x: 3.45, y: 2.56, w: 4.2, h: .2, fontFace: "Arial", fontSize: 9, bold: true, color: "AAB2C2", margin: 0 });
  const maturityRanges = [["PREOCUPANTE", "Até 20 pontos"], ["BAIXO", "21 a 47 pontos"], ["INTERMEDIÁRIO", "48 a 61 pontos"], ["AVANÇADO", "62 a 74 pontos"], ["ALTAMENTE RESILIENTE", "Acima de 75 pontos"]];
  maturityRanges.forEach(([label, range], index) => { const x = 3.44 + index * 1.82; slide.addShape("roundRect", { x, y: 2.91, w: 1.67, h: .58, rectRadius: .04, fill: { color: maturityColors[index], transparency: data.maturity.toUpperCase() === label ? 72 : 90 }, line: { color: maturityColors[index], width: data.maturity.toUpperCase() === label ? 2 : .8 } }); slide.addText(label, { x: x + .08, y: 3.01, w: 1.51, h: .14, fontFace: "Arial", fontSize: label.length > 14 ? 6.2 : 7.2, bold: true, color: maturityColors[index], align: "center", margin: 0, breakLine: false }); slide.addText(range, { x: x + .08, y: 3.2, w: 1.51, h: .13, fontFace: "Arial", fontSize: 6.3, color: "D8DCE6", align: "center", margin: 0, breakLine: false }); });
  slide.addShape("roundRect", { x: 3.18, y: 3.98, w: 9.56, h: 2.2, rectRadius: .06, fill: { color: "080B12", transparency: 5 }, line: { color: "263044", width: 1 } });
  slide.addText("RESULTADO POR PILAR", { x: 3.45, y: 4.19, w: 3.2, h: .2, fontFace: "Arial", fontSize: 9, bold: true, color: "AAB2C2", margin: 0 });
  pillars.forEach((p, i) => { const y = 4.55 + i * .3; const pillarColor = p.color.replace("#", "").toUpperCase(); const score = data.pillarScores[i] ?? 0; slide.addText(p.name, { x: 3.45, y, w: 2.65, h: .17, fontFace: "Arial", fontSize: 7.4, color: "F5F7FB", margin: 0, breakLine: false }); slide.addShape("roundRect", { x: 6.25, y: y + .02, w: 5.35, h: .1, rectRadius: .02, fill: { color: "202637" }, line: { transparency: 100 } }); if (score > 0) slide.addShape("roundRect", { x: 6.25, y: y + .02, w: 5.35 * score / 20, h: .1, rectRadius: .02, fill: { color: pillarColor }, line: { transparency: 100 } }); slide.addText(`${score}/20`, { x: 11.82, y: y - .02, w: .58, h: .17, fontFace: "Arial", fontSize: 7.5, bold: true, color: pillarColor, align: "right", margin: 0, breakLine: false }); });
  pillars.forEach((pillar, pIndex) => { slide = pptx.addSlide(); title(slide, pillar.name, `Maturidade e riscos do negócio • ${data.pillarScores[pIndex]}/20 pontos`); const rows = pillar.questions.map((q) => [{ text: q.title, options: { bold: true, color: C.white } }, { text: `${data.answers[q.id]?.score ?? 0}/${q.max}`, options: { bold: true, color: C.cyan, align: "center" as const } }, { text: data.answers[q.id]?.note || q.risk, options: { color: C.muted } }]); slide.addTable([[{ text: "CRITÉRIO", options: { bold: true } }, { text: "NOTA", options: { bold: true } }, { text: "EVIDÊNCIA / EXPOSIÇÃO", options: { bold: true } }], ...rows], { x: .62, y: 1.58, w: 12.05, h: 4.8, border: { type: "solid", color: C.line, width: .5 }, fill: C.panel, color: C.white, fontFace: "Arial", fontSize: 10, rowH: .62, colW: [3.4, .8, 7.85], margin: .12, breakLine: false, autoFit: false }); });
  const chunks = Array.from({ length: Math.ceil(data.findings.length / 7) }, (_, i) => data.findings.slice(i * 7, i * 7 + 7));
  for (const [index, chunk] of chunks.entries()) { slide = pptx.addSlide(); title(slide, "Exposições ISO/IEC 27001 • NIST • LGPD", `Potenciais riscos em recuperação e continuidade ${index + 1}/${chunks.length}`); const rows = chunk.map((f, i) => [String(index * 7 + i + 1).padStart(2, "0"), f.question.title, f.question.iso, f.question.nist, f.question.lgpd]); slide.addTable([["#", "RISCO / GAP MAPEADO", "ISO 27001", "NIST CSF", "LGPD"], ...rows], { x: .62, y: 1.58, w: 12.05, h: 4.9, border: { type: "solid", color: C.line, width: .5 }, fill: C.panel, color: C.white, fontFace: "Arial", fontSize: 9, rowH: .58, colW: [.55, 6.2, 1.6, 1.6, 2.1], margin: .1, bold: false }); }
  slide = pptx.addSlide(); title(slide, "Conclusões e Próximos Passos", "Transformar risco em continuidade operacional"); slide.addText("A prioridade é reduzir as exposições críticas, comprovar a recuperabilidade e estabelecer uma governança contínua para proteção de dados.", { x: .75, y: 1.75, w: 11.4, h: .7, fontSize: 20, bold: true, color: C.white, breakLine: false }); const top = data.findings.slice(0, 5); top.forEach((f, i) => { slide.addText(String(i + 1).padStart(2, "0"), { x: .85, y: 2.8 + i * .58, w: .45, h: .25, fontSize: 9, bold: true, color: C.cyan }); slide.addText(f.question.title, { x: 1.4, y: 2.75 + i * .58, w: 10.5, h: .3, fontSize: 12, color: C.white }); }); slide.addText("Este material apresenta exposições potenciais e não constitui parecer jurídico ou certificação de conformidade.", { x: .75, y: 6.65, w: 11.5, h: .25, fontSize: 7, color: C.muted });
  const output = await pptx.write({ outputType: "arraybuffer" });
  return new Response(output as ArrayBuffer, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": `attachment; filename="XTR-Assessment.pptx"` } });
}
