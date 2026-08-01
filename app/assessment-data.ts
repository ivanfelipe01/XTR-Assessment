export type Question = { id: string; title: string; max: number; risk: string; recommendations?: string[]; iso: string; nist: string; lgpd: string };
export type Pillar = { id: string; name: string; short: string; description: string; color: string; icon: string; questions: Question[] };

export const pillars: Pillar[] = [
  { id: "fundamentos", name: "Fundamentos de Proteção de Dados", short: "Fundamentos", description: "Controles essenciais para proteger a plataforma de backup", color: "#e743cb", icon: "◉", questions: [
    { id: "imutabilidade", title: "Backup com imutabilidade", max: 4, risk: "Risco de exclusão ou alteração de backups por ações maliciosas ou acidentais.", recommendations: ["Manter e revisar periodicamente a política de imutabilidade para garantir proteção contínua dos backups."], iso: "A.8.13", nist: "PR.DS", lgpd: "Art. 46" },
    { id: "hardening", title: "Hardening dos elementos da infraestrutura de backup", max: 4, risk: "Aumento da superfície de ataque e maior probabilidade de exploração de vulnerabilidades no ambiente de backup.", recommendations: ["Aplicar hardening em todos os componentes e considerar uma appliance virtual Linux para reduzir a exposição do ambiente Veeam Windows."], iso: "A.8.9", nist: "PR.PS", lgpd: "Art. 46" },
    { id: "acesso", title: "RBAC, MFA e SSO implementados", max: 4, risk: "O acesso não autorizado pode comprometer, excluir ou manipular dados críticos de backup.", recommendations: ["Implementar RBAC, MFA e SSO no ambiente de backup.", "Aplicar o princípio do menor privilégio e revisar os acessos periodicamente."], iso: "A.5.15", nist: "PR.AA", lgpd: "Art. 46" },
    { id: "criptografia", title: "Criptografia em trânsito e/ou em repouso", max: 4, risk: "Os dados podem ser interceptados ou acessados em caso de vazamento ou acesso indevido ao armazenamento.", recommendations: ["Ativar criptografia em trânsito, como TLS, e em repouso nos repositórios, backups e mídias."], iso: "A.8.24", nist: "PR.DS", lgpd: "Art. 46" },
    { id: "segregacao", title: "Rede segregada para backup", max: 4, risk: "O tráfego não isolado pode permitir movimentação lateral e comprometer o ambiente de backup.", recommendations: ["Implementar segmentação de rede dedicada para o ambiente de backup, isolando-o do tráfego corporativo."], iso: "A.8.22", nist: "PR.IR", lgpd: "Art. 46" },
  ]},
  { id: "replicacao", name: "Replicação e Controles", short: "Replicação", description: "Redundância, retenção, monitoramento e atualização", color: "#5f8cff", icon: "⟲", questions: [
    { id: "copia-secundaria", title: "Replicação dos dados de backup (pelo menos uma cópia secundária)", max: 5, risk: "Uma única cópia cria ponto único de falha e pode impedir a recuperação após indisponibilidade ou ataque destrutivo.", recommendations: ["Manter ao menos uma cópia secundária em domínio de falha distinto e monitorar continuamente o sucesso da replicação."], iso: "A.8.13", nist: "PR.DS", lgpd: "Art. 46" },
    { id: "ltr", title: "Armazenamento Long Term Retention", max: 5, risk: "A retenção insuficiente pode impedir a recuperação histórica e o atendimento a requisitos legais e de negócio.", recommendations: ["Definir políticas de retenção de longo prazo alinhadas às exigências do negócio, regulatórias e de auditoria."], iso: "A.8.13", nist: "PR.DS", lgpd: "Art. 15" },
    { id: "monitoramento", title: "Backup monitorado continuamente como aplicação Tier 1", max: 5, risk: "Falhas, degradações e anomalias podem permanecer invisíveis e comprometer a capacidade de recuperação.", recommendations: ["Monitorar o ambiente de backup continuamente como aplicação Tier 1, com alertas, indicadores de saúde e tratamento de incidentes."], iso: "A.8.16", nist: "DE.CM", lgpd: "Art. 48" },
    { id: "patches", title: "Upgrades e patches aplicados regularmente", max: 5, risk: "Vulnerabilidades conhecidas podem permanecer exploráveis e comprometer componentes críticos da infraestrutura de backup.", recommendations: ["Estabelecer processo recorrente de avaliação, homologação e aplicação de upgrades e patches de segurança."], iso: "A.8.8", nist: "PR.PS", lgpd: "Art. 46" },
  ]},
  { id: "isolamento", name: "Isolamento e Compliance", short: "Isolamento", description: "Separação física e lógica das cópias críticas", color: "#19d6d2", icon: "⬡", questions: [
    { id: "airgap", title: "Isolamento dos dados via Air-Gap", max: 7, risk: "O mesmo incidente pode atingir produção e backup.", iso: "A.8.13", nist: "PR.IR", lgpd: "Art. 46" },
    { id: "cofre", title: "Cofre de dados desconectado da produção", max: 7, risk: "Não existe cópia isolada contra ataques destrutivos.", iso: "A.5.30", nist: "RC.RP", lgpd: "Art. 46" },
    { id: "compliance", title: "Compliance com padrões regulatórios", max: 6, risk: "A organização pode não demonstrar aderência aplicável.", iso: "A.5.31", nist: "GV.OC", lgpd: "Art. 50" },
  ]},
  { id: "resposta", name: "Resposta e Prontidão", short: "Resposta", description: "Detecção, validação e recuperação confiável", color: "#ff4d68", icon: "△", questions: [
    { id: "clean-room", title: "Clean Room para testes de recuperação", max: 3, risk: "Testes podem contaminar ou impactar o ambiente produtivo.", iso: "A.5.30", nist: "RC.RP", lgpd: "Art. 46" },
    { id: "deteccao", title: "Mecanismos de detecção de ameaças", max: 7, risk: "Ransomware pode atingir cópias sem detecção tempestiva.", iso: "A.8.16", nist: "DE.AE", lgpd: "Art. 48" },
    { id: "auditoria", title: "Relatório e auditoria de brechas suspeitas", max: 5, risk: "Faltam evidências para investigação e resposta.", iso: "A.5.28", nist: "RS.AN", lgpd: "Art. 48" },
    { id: "golden-copy", title: "Golden Copy confiável para restauração", max: 5, risk: "Cópias contaminadas podem ser restauradas.", iso: "A.8.13", nist: "RC.RP", lgpd: "Art. 46" },
  ]},
  { id: "governanca", name: "Governança e Gestão", short: "Governança", description: "Pessoas, processos e prontidão operacional", color: "#35d999", icon: "◇", questions: [
    { id: "testes", title: "Testes periódicos de recuperação", max: 6, risk: "A recuperabilidade real permanece não comprovada.", iso: "A.5.30", nist: "ID.IM", lgpd: "Art. 46" },
    { id: "equipe", title: "Equipe especializada e pronta", max: 7, risk: "Dependência operacional reduz prontidão em incidentes.", iso: "A.5.2", nist: "GV.RR", lgpd: "Art. 46" },
    { id: "runbooks", title: "Runbooks de recuperação atualizados", max: 7, risk: "A resposta pode ser improvisada em cenário de crise.", iso: "A.5.29", nist: "RS.MA", lgpd: "Art. 48" },
  ]},
];

export const maturityForScore = (score: number) => {
  if (score <= 20) return { label: "Preocupante", description: "Exposição elevada e baixa previsibilidade de recuperação." };
  if (score <= 47) return { label: "Baixo", description: "Controles básicos existem, mas há gaps relevantes de resiliência." };
  if (score <= 61) return { label: "Intermediário", description: "Capacidades implementadas com oportunidades importantes de evolução." };
  if (score <= 74) return { label: "Avançado", description: "Boa maturidade, com controles consistentes e gaps pontuais." };
  return { label: "Altamente Resiliente", description: "Proteção integrada, testada e governada de forma contínua." };
};
