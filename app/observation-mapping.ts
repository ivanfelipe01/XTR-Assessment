export type AssessmentObservation = { id: string; text: string };

type ObservationMapping = { iso: string; nist: string; lgpd: string; exposure: string };

const rules: Array<{ pattern: RegExp; mapping: ObservationMapping }> = [
  { pattern: /mfa|rbac|sso|acesso|privil[eé]gio|credencial|senha|dom[ií]nio/i, mapping: { iso: "A.5.15\nA.5.17\nA.5.18", nist: "PR.AA-01\nPR.AA-03\nPR.AA-05", lgpd: "ART. 46\nART. 47", exposure: "Controles de identidade e acesso podem ser insuficientes para impedir ações não autorizadas sobre dados e serviços de backup." } },
  { pattern: /criptograf|tls|cifra/i, mapping: { iso: "A.8.24", nist: "PR.DS-01\nPR.DS-02", lgpd: "ART. 46\nART. 49", exposure: "A proteção criptográfica pode não assegurar adequadamente a confidencialidade e a integridade dos dados em trânsito ou em repouso." } },
  { pattern: /rede|segment|segreg|vlan|firewall/i, mapping: { iso: "A.8.20\nA.8.22", nist: "ID.AM-03\nPR.IR-01", lgpd: "ART. 46\nART. 49", exposure: "A arquitetura de rede pode permitir propagação de incidentes e movimentação lateral até a infraestrutura de backup." } },
  { pattern: /patch|upgrade|vers[aã]o|cve|vulnerabil|desatualiz/i, mapping: { iso: "A.8.8\nA.8.9", nist: "ID.RA-01\nPR.PS-02", lgpd: "ART. 46\nART. 49", exposure: "Vulnerabilidades conhecidas ou configurações desatualizadas podem permanecer exploráveis no ambiente avaliado." } },
  { pattern: /backup|c[oó]pia|imutab|air.?gap|cofre|reten[cç][aã]o/i, mapping: { iso: "A.8.13\nA.5.30", nist: "PR.DS-11\nPR.IR-03", lgpd: "ART. 46\nART. 49", exposure: "A proteção, retenção ou separação das cópias pode ser insuficiente para garantir disponibilidade e recuperação confiável." } },
  { pattern: /restore|restaura|recupera|rto|rpo|teste|golden/i, mapping: { iso: "A.5.29\nA.5.30\nA.8.13", nist: "ID.IM-02\nRC.RP-03\nRC.RP-05", lgpd: "ART. 46\nART. 49\nART. 50", exposure: "A capacidade de recuperação pode não estar comprovada, documentada ou alinhada às necessidades do negócio." } },
  { pattern: /monitor|alerta|observab|log|auditor|trilha/i, mapping: { iso: "A.8.15\nA.8.16", nist: "PR.PS-04\nDE.CM-09", lgpd: "ART. 46\nART. 48\nART. 50", exposure: "Eventos relevantes podem não ser detectados, investigados ou comprovados em tempo adequado." } },
  { pattern: /runbook|documenta|incidente|crise|equipe|respons[aá]vel/i, mapping: { iso: "A.5.2\nA.5.24\nA.5.29", nist: "GV.RR-02\nID.IM-04\nRC.RP-01", lgpd: "ART. 48\nART. 50", exposure: "Papéis, procedimentos ou evidências de resposta e recuperação podem ser insuficientes durante um incidente." } },
];

export const observationFindingId = (id: string) => `observation:${id}`;

export function mapObservation(text: string): ObservationMapping {
  const matches = rules.filter(({ pattern }) => pattern.test(text));
  if (!matches.length) return { iso: "A.5.36", nist: "GV.OV-01", lgpd: "ART. 46\nART. 50", exposure: "A observação indica uma condição que requer validação de risco, definição de controles e evidências formais de tratamento." };
  const unique = (field: "iso" | "nist" | "lgpd") => [...new Set(matches.flatMap(({ mapping }) => mapping[field].split("\n")))].join("\n");
  return { iso: unique("iso"), nist: unique("nist"), lgpd: unique("lgpd"), exposure: [...new Set(matches.map(({ mapping }) => mapping.exposure))].join(" ") };
}
