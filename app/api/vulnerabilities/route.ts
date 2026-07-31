type NvdMetric = { cvssData?: { baseScore?: number; baseSeverity?: string } };
type NvdCve = { id: string; descriptions?: Array<{ lang: string; value: string }>; metrics?: { cvssMetricV31?: NvdMetric[]; cvssMetricV30?: NvdMetric[]; cvssMetricV2?: NvdMetric[] } };

function coreProduct(value: string) {
  return value.replace(/\b(?:de|da|do)\s+(?:localidade|unidade|site)\b.*$/i, "").replace(/\b(?:localidade|unidade|site)\b.*$/i, "").trim();
}

function versionMatches(candidate: string, requested: string) {
  const clean = requested.trim().toLowerCase().replace(/\.x$/i, "");
  return candidate.toLowerCase() === requested.toLowerCase() || candidate.toLowerCase().startsWith(clean);
}

function mapRisk(description: string) {
  const value = description.toLowerCase();
  if (/remote code execution|execute arbitrary code|arbitrary code execution|\brce\b/.test(value)) return "Execução remota de código e comprometimento do Backup Server";
  if (/privilege escalation|elevation of privilege|escalate privileges/.test(value)) return "Elevação de privilégios e tomada de controle do ambiente de backup";
  if (/authentication bypass|bypass authentication|improper authentication/.test(value)) return "Bypass de autenticação e acesso não autorizado";
  if (/denial of service|\bdos\b/.test(value)) return "Indisponibilidade do serviço de backup e impacto na capacidade de recuperação";
  if (/information disclosure|sensitive information|data exposure|leak/.test(value)) return "Exposição de informações sensíveis e dados de configuração";
  if (/arbitrary file|path traversal|directory traversal|file manipulation/.test(value)) return "Manipulação indevida de arquivos ou repositórios de backup";
  if (/sql injection|command injection|code injection/.test(value)) return "Injeção de comandos e comprometimento da infraestrutura de backup";
  return "Comprometimento potencial da confidencialidade, integridade ou disponibilidade dos backups";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = coreProduct(url.searchParams.get("product") ?? "");
  const version = (url.searchParams.get("version") ?? "").trim();
  if (!product || !version) return Response.json({ error: "Produto e versão são obrigatórios." }, { status: 400 });

  try {
    const cpeUrl = new URL("https://services.nvd.nist.gov/rest/json/cpes/2.0");
    cpeUrl.searchParams.set("keywordSearch", product);
    cpeUrl.searchParams.set("resultsPerPage", "100");
    const cpeResponse = await fetch(cpeUrl, { headers: { "user-agent": "XTR-Assessment/1.0" } });
    if (!cpeResponse.ok) throw new Error("A NVD não respondeu à pesquisa de produtos.");
    const cpeData = await cpeResponse.json() as { products?: Array<{ cpe?: { cpeName?: string; titles?: Array<{ title: string }> } }> };
    const candidates = (cpeData.products ?? []).map((item) => item.cpe).filter(Boolean);
    const exact = candidates.find((item) => { const parts = item?.cpeName?.split(":") ?? []; return versionMatches(parts[5] ?? "", version); });

    if (!exact?.cpeName) return Response.json({ product, version, cpe: null, vulnerabilities: [], warning: "Não foi encontrada correspondência CPE confirmada para esta versão. Nenhum CVE foi registrado automaticamente.", source: "https://nvd.nist.gov/developers/vulnerabilities", checkedAt: new Date().toISOString() });

    const cveUrl = new URL("https://services.nvd.nist.gov/rest/json/cves/2.0");
    const matchStatus = "Versão confirmada no CPE/NVD";
    cveUrl.searchParams.set("cpeName", exact.cpeName);
    cveUrl.searchParams.set("resultsPerPage", "100");
    cveUrl.searchParams.set("noRejected", "");
    const cveResponse = await fetch(cveUrl, { headers: { "user-agent": "XTR-Assessment/1.0" } });
    if (!cveResponse.ok) throw new Error("A NVD não respondeu à consulta de vulnerabilidades.");
    const cveData = await cveResponse.json() as { vulnerabilities?: Array<{ cve: NvdCve }> };
    const vulnerabilities = (cveData.vulnerabilities ?? []).slice(0, 50).map(({ cve }) => {
      const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData ?? cve.metrics?.cvssMetricV30?.[0]?.cvssData ?? cve.metrics?.cvssMetricV2?.[0]?.cvssData;
      const description = cve.descriptions?.find((item) => item.lang === "en")?.value ?? "Descrição indisponível.";
      return { id: cve.id, severity: metric?.baseSeverity ?? "NÃO CLASSIFICADA", score: metric?.baseScore ?? null, description, risk: mapRisk(description), url: `https://nvd.nist.gov/vuln/detail/${cve.id}`, matchStatus };
    });
    return Response.json({ product, version, cpe: exact?.cpeName ?? null, vulnerabilities, source: "https://nvd.nist.gov/developers/vulnerabilities", checkedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha na consulta à NVD." }, { status: 502 });
  }
}
