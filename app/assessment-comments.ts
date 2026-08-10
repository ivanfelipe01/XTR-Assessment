type CommentSet = { scores: string[]; noEvidence: string };

const comments: Record<string, CommentSet> = {
  imutabilidade: {
    scores: [
      "Os backups não estão protegidos por imutabilidade, Object Lock ou funcionalidade equivalente.",
      "A imutabilidade está disponível ou planejada, mas ainda não protege efetivamente os backups.",
      "A imutabilidade protege parcialmente os backups, com cobertura limitada a determinados repositórios ou cargas.",
      "A imutabilidade está implementada na maior parte do ambiente, mas ainda possui lacunas de cobertura, configuração ou governança.",
      "A imutabilidade está implementada e configurada para proteger os backups críticos contra alteração ou exclusão não autorizada.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o uso de imutabilidade, Object Lock ou funcionalidade equivalente.",
  },
  hardening: {
    scores: [
      "Os componentes da infraestrutura de backup não possuem hardening implementado.",
      "Existem ações isoladas de hardening, sem padrão definido ou cobertura consistente do ambiente.",
      "O hardening está parcialmente implementado, mas ainda existem configurações inseguras ou não avaliadas.",
      "O hardening está aplicado na maior parte do ambiente, com poucas pendências de configuração, revisão ou documentação.",
      "O hardening está implementado e mantido em todos os componentes relevantes da infraestrutura de backup.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o hardening dos componentes da infraestrutura de backup.",
  },
  acesso: {
    scores: [
      "Os acessos ao ambiente de backup não são protegidos por RBAC, MFA ou SSO.",
      "Existem controles básicos de acesso, mas sem adoção consistente de RBAC, MFA ou SSO.",
      "RBAC, MFA ou SSO estão implementados parcialmente, sem cobertura de todos os usuários, perfis ou componentes críticos.",
      "Os controles de acesso estão amplamente implementados, mas ainda existem exceções ou revisões pendentes.",
      "RBAC, MFA e SSO estão implementados de forma consistente, com privilégios controlados e acessos protegidos.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a implementação de RBAC, MFA e SSO.",
  },
  criptografia: {
    scores: [
      "Os dados de backup não estão criptografados em trânsito nem em repouso.",
      "A criptografia está disponível ou aplicada apenas em situações isoladas, sem cobertura efetiva do ambiente.",
      "A criptografia protege parcialmente os dados, apenas em trânsito ou em parte dos repositórios e mídias.",
      "A criptografia está aplicada na maior parte dos fluxos e armazenamentos, mas ainda existem exceções ou controles pendentes.",
      "Os dados de backup estão protegidos por criptografia em trânsito e em repouso nos componentes aplicáveis.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a criptografia dos dados de backup em trânsito e em repouso.",
  },
  segregacao: {
    scores: [
      "O tráfego e os componentes de backup não estão segregados da rede corporativa.",
      "Existem separações pontuais de rede, mas o ambiente de backup permanece amplamente conectado à rede corporativa.",
      "A segregação está parcialmente implementada, protegendo apenas determinados componentes ou fluxos de backup.",
      "A maior parte do ambiente está segregada, mas ainda existem exceções, rotas permissivas ou controles pendentes.",
      "A rede de backup está segregada de forma consistente, com fluxos controlados e exposição reduzida ao ambiente corporativo.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a segregação da rede de backup.",
  },
  "copia-secundaria": {
    scores: [
      "Os backups não possuem cópia secundária em um domínio de falha distinto.",
      "A cópia secundária está planejada ou disponível apenas para uma parcela mínima dos backups.",
      "Alguns backups possuem cópia secundária, mas cargas importantes permanecem em um único domínio de falha.",
      "A cópia secundária atende parte relevante do ambiente, porém ainda existem lacunas de cobertura ou monitoramento.",
      "A maior parte dos backups possui cópia secundária em domínio de falha distinto, com poucas pendências.",
      "Os backups críticos possuem cópia secundária em domínio de falha distinto, com execução e integridade monitoradas.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a existência e a integridade de uma cópia secundária dos backups.",
  },
  ltr: {
    scores: [
      "Os backups não possuem política ou armazenamento destinado à retenção de longo prazo.",
      "Existem retenções prolongadas pontuais, sem política formal ou alinhamento com requisitos do negócio.",
      "A retenção de longo prazo atende apenas algumas cargas ou requisitos específicos.",
      "Existe política parcial de longo prazo, mas ainda há lacunas de cobertura, governança ou validação.",
      "A retenção de longo prazo está amplamente implementada, restando poucas cargas ou requisitos sem atendimento.",
      "A retenção de longo prazo está implementada e alinhada aos requisitos de negócio, auditoria e regulamentação aplicáveis.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a política e a execução da retenção de longo prazo.",
  },
  monitoramento: {
    scores: [
      "O ambiente de backup não é monitorado continuamente como uma aplicação crítica.",
      "O ambiente é verificado de forma reativa ou manual, sem acompanhamento contínuo.",
      "Alguns componentes ou eventos são monitorados, mas sem cobertura centralizada e tratamento consistente.",
      "O monitoramento cobre os principais componentes, porém ainda existem lacunas de alertas, indicadores ou processos.",
      "O ambiente é amplamente monitorado, com alertas e tratamento operacional, mas ainda possui melhorias pontuais.",
      "O ambiente de backup é monitorado continuamente como serviço crítico, com indicadores, alertas e tratamento estruturado de incidentes.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o monitoramento contínuo do ambiente de backup.",
  },
  patches: {
    scores: [
      "Não existe um processo recorrente para avaliação e aplicação de upgrades e patches no ambiente de backup.",
      "Upgrades e patches são aplicados apenas de forma reativa ou em situações emergenciais.",
      "Existem atualizações periódicas em parte do ambiente, mas sem processo consistente ou cobertura completa.",
      "Há um processo definido de atualização, ainda com atrasos, exceções ou componentes fora do ciclo regular.",
      "Upgrades e patches são aplicados regularmente na maior parte do ambiente, com poucas pendências.",
      "Existe processo recorrente e controlado de avaliação, homologação e aplicação de upgrades e patches em todo o ambiente aplicável.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a regularidade e a cobertura de upgrades e patches.",
  },
  airgap: {
    scores: [
      "As cópias de backup não estão protegidas por isolamento físico ou lógico via Air-Gap.",
      "O Air-Gap está apenas em estudo ou planejamento, sem isolamento efetivo das cópias.",
      "Existem mecanismos básicos de isolamento, mas ainda dependentes do mesmo ambiente administrativo ou de rede.",
      "Parte das cópias está isolada, porém com cobertura limitada ou períodos de desconexão insuficientes.",
      "O Air-Gap protege cargas relevantes, mas ainda existem dependências, acessos ou processos que reduzem sua efetividade.",
      "A maior parte das cópias críticas está protegida por Air-Gap, com poucas lacunas técnicas ou operacionais.",
      "O Air-Gap está amplamente implementado, com isolamento verificável e controles consistentes, restando melhorias pontuais.",
      "O Air-Gap está implementado para as cópias críticas, com isolamento verificável e controles que impedem alterações não autorizadas.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o isolamento físico ou lógico das cópias por Air-Gap.",
  },
  cofre: {
    scores: [
      "Não existe um cofre de dados desconectado da produção e mantido fora do ambiente produtivo.",
      "O cofre de dados está apenas em estudo ou planejamento, sem proteção efetiva das cópias.",
      "Existe uma cópia externa ou separada, mas sem isolamento suficiente da produção.",
      "O cofre protege parte das cargas, porém ainda compartilha dependências, acessos ou componentes com o ambiente produtivo.",
      "O cofre está operacional para cargas relevantes, mas possui lacunas de cobertura, isolamento ou validação.",
      "A maior parte das cargas críticas está protegida no cofre, com acesso restrito e poucas pendências.",
      "O cofre está amplamente implementado e isolado, mas ainda requer melhorias pontuais em testes ou governança.",
      "O cofre de dados está implementado fora do ambiente produtivo, com isolamento, acesso restrito e recuperação validada.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o isolamento, a cobertura e a validação do cofre de dados.",
  },
  compliance: {
    scores: [
      "Os requisitos regulatórios aplicáveis ao ambiente de backup não estão mapeados ou atendidos.",
      "Os requisitos aplicáveis são conhecidos parcialmente, mas ainda não foram formalmente avaliados.",
      "Existe mapeamento inicial de requisitos, com poucos controles implementados ou evidenciados.",
      "Parte dos requisitos está atendida, mas ainda existem lacunas relevantes de controle, documentação ou evidência.",
      "A maior parte dos requisitos aplicáveis está atendida, com pendências específicas de adequação ou comprovação.",
      "Os requisitos estão amplamente atendidos e documentados, restando melhorias pontuais ou revisões periódicas.",
      "Os requisitos regulatórios aplicáveis estão mapeados, atendidos e sustentados por controles, evidências e revisões periódicas.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar o atendimento dos requisitos regulatórios aplicáveis.",
  },
  "clean-room": {
    scores: [
      "Não existe uma Clean Room isolada para testes e validações de recuperação.",
      "Existe planejamento ou capacidade limitada de testes, sem uma Clean Room efetivamente isolada.",
      "A Clean Room está disponível e permite testes parciais, mas possui limitações de cobertura, automação ou validação.",
      "A Clean Room está implementada e isolada, permitindo testar recuperações e validar a integridade das cargas restauradas.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a existência e o isolamento de uma Clean Room.",
  },
  deteccao: {
    scores: [
      "As cópias e a infraestrutura de backup não possuem mecanismos de detecção de ameaças cibernéticas.",
      "A detecção está apenas planejada ou depende de verificações manuais e reativas.",
      "Existem mecanismos básicos de detecção, com cobertura restrita a poucos componentes ou eventos.",
      "Parte do ambiente é monitorada quanto a ameaças, mas existem lacunas relevantes de cobertura ou correlação.",
      "Os principais componentes possuem detecção, porém alertas e processos de resposta ainda são parcialmente estruturados.",
      "A maior parte do ambiente está protegida por mecanismos de detecção integrados à operação.",
      "A detecção está amplamente implementada, com alertas e tratamento estruturado, restando melhorias pontuais.",
      "Existem mecanismos contínuos de detecção de anomalias e ameaças em todo o ambiente crítico, integrados ao processo de resposta.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a cobertura e a efetividade dos mecanismos de detecção de ameaças.",
  },
  auditoria: {
    scores: [
      "Não existem relatórios ou trilhas de auditoria destinados à análise de brechas e atividades suspeitas.",
      "Existem registros técnicos limitados, sem centralização ou processo definido de análise.",
      "Parte das atividades é registrada, mas a cobertura, retenção ou revisão dos eventos é insuficiente.",
      "As principais atividades possuem trilhas de auditoria, porém ainda existem lacunas de correlação, alerta ou investigação.",
      "A auditoria está amplamente implementada, com relatórios e tratamento operacional, restando melhorias pontuais.",
      "Trilhas de auditoria e relatórios de atividades suspeitas estão implementados, preservados e integrados ao processo de investigação.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a cobertura e a preservação das trilhas de auditoria.",
  },
  "golden-copy": {
    scores: [
      "Não existe um processo para identificar e validar uma Golden Copy confiável e livre de ameaças.",
      "A seleção da cópia para recuperação ocorre de forma manual, sem critérios formais de confiabilidade.",
      "Existem verificações básicas das cópias, mas sem validação consistente de integridade ou presença de ameaças.",
      "Parte das cargas possui processo de identificação e validação de cópias confiáveis.",
      "A maior parte das cargas críticas possui Golden Copy validada, com poucas pendências de cobertura ou automação.",
      "Existe processo implementado para identificar, validar e preservar Golden Copies íntegras e livres de ameaças antes da restauração.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a integridade e a confiabilidade da Golden Copy.",
  },
  testes: {
    scores: [
      "Testes periódicos e documentados de recuperação não são realizados.",
      "Testes são realizados apenas de forma eventual, reativa ou sem registros consistentes.",
      "Algumas cargas são testadas, mas sem periodicidade definida ou cobertura dos serviços críticos.",
      "Existe um programa parcial de testes, com lacunas de cobertura, evidências ou acompanhamento dos resultados.",
      "Os principais serviços são testados periodicamente, mas ainda existem pendências de abrangência ou tratamento dos desvios.",
      "Os testes cobrem a maior parte das cargas críticas, com evidências e medição de resultados, restando melhorias pontuais.",
      "Os testes de recuperação são executados periodicamente, documentados e utilizados para validar RTO, RPO e recuperabilidade.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a periodicidade, a cobertura e os resultados dos testes de recuperação.",
  },
  equipe: {
    scores: [
      "Não existe uma equipe formalmente preparada para responder a incidentes de recuperação.",
      "A atuação depende de pessoas específicas, sem papéis, cobertura ou disponibilidade formalmente definidos.",
      "Existem profissionais com conhecimento parcial, mas sem estrutura suficiente para atender incidentes críticos.",
      "Há uma equipe identificada, porém com lacunas de capacitação, disponibilidade, responsabilidades ou escalonamento.",
      "A equipe possui papéis e conhecimentos básicos definidos, mas a prontidão ainda não é regularmente exercitada.",
      "A maior parte das competências e responsabilidades está estruturada, com poucas dependências ou lacunas operacionais.",
      "A equipe está preparada e possui responsabilidades, escalonamento e disponibilidade definidos, restando melhorias pontuais.",
      "Existe equipe especializada e disponível, com responsabilidades claras e prontidão validada por exercícios recorrentes.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a capacitação, a disponibilidade e a prontidão da equipe.",
  },
  runbooks: {
    scores: [
      "Os processos de recuperação não possuem runbooks atualizados e formalizados.",
      "O processo depende predominantemente de conhecimento informal ou de profissionais específicos.",
      "Existem documentos básicos, mas incompletos, desatualizados ou restritos a poucas cargas.",
      "Parte dos processos de recuperação está documentada, porém existem lacunas relevantes de cobertura ou detalhamento.",
      "Os principais processos possuem runbooks, mas a atualização e validação ainda não ocorrem de forma consistente.",
      "A maior parte dos serviços críticos possui runbooks documentados, com poucas pendências de revisão ou teste.",
      "Os runbooks estão amplamente atualizados, versionados e validados, restando melhorias pontuais.",
      "Os processos de recuperação possuem runbooks completos, versionados, atualizados frequentemente e validados em testes.",
    ],
    noEvidence: "Não foram apresentadas evidências suficientes para confirmar a cobertura, a atualização e a validação dos runbooks.",
  },
};

export const scoreComment = (id: string, score: number) =>
  comments[id]?.scores[score] ?? "A condição deste controle deve ser descrita e validada pelo especialista.";

export const evidenceComment = (id: string) =>
  comments[id]?.noEvidence ?? "Não foram apresentadas evidências suficientes para confirmar a condição avaliada.";

export const automaticComment = (id: string, score: number, noEvidence = false) =>
  noEvidence ? `${evidenceComment(id)} ${scoreComment(id, score)}` : scoreComment(id, score);

