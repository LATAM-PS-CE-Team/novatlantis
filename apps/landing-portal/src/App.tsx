import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TIPAGENS SOBERANAS E MODELO DE DADOS (NID, BIOMETRIA NIST, I18N, AUDITORIA)
// ============================================================================

export type SupportedLocale = 'pt-BR' | 'es-419' | 'en-US';
export type ActiveModule = 'hub' | '311' | '911' | 'health' | 'education' | 'heraldry';

export interface NistMinutia {
  x: number;
  y: number;
  theta: number;
  quality: number;
  type: 'RIDGE_ENDING' | 'BIFURCATION';
}

export interface CitizenProfile {
  nid: string;
  fullName: string;
  nativeLanguage: SupportedLocale;
  birthDate: string;
  ageYears: number;
  filiation: {
    motherName: string;
    fatherName: string;
  };
  address: {
    street: string;
    district: string;
    postalCode: string;
    lat: number;
    lng: number;
  };
  avatarUrl: string;
  publicKeyEd25519: string;
  biometrics: {
    nistFaceTemplate: string;
    nistFingerprintMinutiae: NistMinutia[];
    biometricConfidenceScore: number;
    icaoCompliant: boolean;
    eyeDistancePx: number;
    headPitchDeg: number;
    illuminationScore: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  relativeTime: string;
  secretariat: string;
  aiAgent: string;
  purpose: Record<SupportedLocale, string>;
  fieldsAccessed: string[];
  hash: string;
}

// ============================================================================
// COMPONENTE SVG: CONSTELAÇÃO NEURAL DE 9 NÓS + LOUROS DE NOVATLANTIS
// (Reproduz fielmente o emblema central da Bandeira Oficial de Novatlantis)
// ============================================================================

export const NovatlantisNeuralEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  // 8 nós periféricos + 1 nó central soberano (exatamente como na bandeira oficial)
  const nodes = [
    { cx: 50, cy: 18 },
    { cx: 72.6, cy: 27.4 },
    { cx: 82, cy: 50 },
    { cx: 72.6, cy: 72.6 },
    { cx: 50, cy: 82 },
    { cx: 27.4, cy: 72.6 },
    { cx: 18, cy: 50 },
    { cx: 27.4, cy: 27.4 },
  ];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Emblema Neural da Bandeira de Novatlantis">
      <defs>
        <radialGradient id="nvNodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Coroa de Louros Prateada (Arco Cívico) */}
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="2.2"
        strokeDasharray="6 3"
        opacity="0.85"
      />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#FBBF24" strokeWidth="0.9" opacity="0.65" />

      {/* Malha Completa de Conexões Agênticas (Grafo K8 + Centro) */}
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => (
          <line
            key={`mesh-${i}-${j}`}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
            stroke="#FBBF24"
            strokeWidth="0.75"
            opacity="0.55"
          />
        ))
      )}
      {nodes.map((n, i) => (
        <line
          key={`center-${i}`}
          x1={50}
          y1={50}
          x2={n.cx}
          y2={n.cy}
          stroke="#FDE68A"
          strokeWidth="1.2"
          opacity="0.85"
        />
      ))}

      {/* 8 Nós Agênticos Ministeriais */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <circle cx={n.cx} cy={n.cy} r="5.5" fill="url(#nvNodeGlow)" />
          <circle cx={n.cx} cy={n.cy} r="2.6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="0.8" />
        </g>
      ))}

      {/* Nó Central: Cidadão Soberano */}
      <circle cx="50" cy="50" r="7.5" fill="url(#nvNodeGlow)" />
      <circle cx="50" cy="50" r="3.6" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  );
};

// ============================================================================
// DICIONÁRIO TRILÍNGUE SÍNCRONO (pt-BR, es-419, en-US)
// ============================================================================

const I18N_DICTIONARY: Record<
  SupportedLocale,
  {
    govHeader: string;
    mottoTranslation: string;
    republicTitle: string;
    republicSubtitle: string;
    aiFirstBadge: string;
    langResolutionLabel: string;
    langSourceAuth: string;
    langSourceAnon: string;
    langSourceOverride: string;
    resetLangOverride: string;
    citizenSelectorLabel: string;
    anonymousVisitor: string;
    navHub: string;
    nav311: string;
    nav911: string;
    navHealth: string;
    navEducation: string;
    navHeraldry: string;
    nidCardTitle: string;
    nidCardSubtitle: string;
    nidVerifiedMod11: string;
    nidHologramActive: string;
    labelFullName: string;
    labelBirthDate: string;
    labelAge: string;
    labelNativeLang: string;
    labelFiliation: string;
    labelAddress: string;
    labelPublicKey: string;
    labelNistScore: string;
    labelNistFaceHash: string;
    labelMinutiaeCount: string;
    editProfileBtn: string;
    saveProfileBtn: string;
    uploadPhotoLabel: string;
    icaoValidatorTitle: string;
    icaoCompliantBadge: string;
    icaoFailedBadge: string;
    icaoCheckEyes: string;
    icaoCheckPose: string;
    icaoCheckLight: string;
    simulatePhotoPass: string;
    simulatePhotoFail: string;
    launchpadTitle: string;
    launchpadSubtitle: string;
    ssoBadge: string;
    auditPanelTitle: string;
    auditPanelSubtitle: string;
    auditAgency: string;
    auditAgent: string;
    auditPurpose: string;
    auditTimestamp: string;
    heraldryTitle: string;
    heraldrySubtitle: string;
    flagTitle: string;
    flagDesc: string;
    coatTitle: string;
    coatDesc: string;
    service311Title: string;
    service311Desc: string;
    issueInputPlaceholder: string;
    analyze311Btn: string;
    llmDepartment: string;
    llmSla: string;
    llmPriority: string;
    service911Title: string;
    service911Desc: string;
    sosOneClickBtn: string;
    triageInputPlaceholder: string;
    dispatchBtn: string;
    unitDispatched: string;
    serviceHealthTitle: string;
    serviceHealthDesc: string;
    startTelemedBtn: string;
    liveTranscriptLabel: string;
    aiSummaryLabel: string;
    digitalRxLabel: string;
    serviceEduTitle: string;
    serviceEduDesc: string;
    adaptiveTrackLabel: string;
    askTutorBtn: string;
  }
> = {
  'pt-BR': {
    govHeader: 'GOV.NOVATLANTIS.CLOUD • PROJETO GCP: NOVATLANTIS • LIBERTAS IN DIGITALI',
    mottoTranslation: 'Liberdade na Era Digital • Estado Soberano AI-First',
    republicTitle: 'República Digital de Novatlantis',
    republicSubtitle:
      'Primeira Nação AI-First da Era Agêntica • Identidade Biométrica NIST • Governança Autônoma no Google Cloud',
    aiFirstBadge: 'CONSTELAÇÃO DE 9 NÓS AGÊNTICOS ATIVA',
    langResolutionLabel: 'Resolução de Idioma (3 Camadas):',
    langSourceAuth: 'Camada 1 • Idioma Nativo do Cidadão Autenticado (BD)',
    langSourceAnon: 'Camada 2 • Visitante Anônimo (HTTP Accept-Language + GeoIP)',
    langSourceOverride: 'Camada 3 • Override Explícito do Cabeçalho (localStorage)',
    resetLangOverride: 'Restaurar Automático',
    citizenSelectorLabel: 'Sessão de Cidadão (Simulador SSO):',
    anonymousVisitor: 'Visitante Anônimo (Sem Sessão)',
    navHub: 'NID Hub & Cidadania',
    nav311: '311 Zeladoria Urbana',
    nav911: '911 Emergência IA',
    navHealth: 'Saúde & Telemedicina',
    navEducation: 'Educação Adaptativa',
    navHeraldry: 'Símbolos Nacionais (Bandeira & Brasão)',
    nidCardTitle: 'Carteira de Identidade Nacional (NID)',
    nidCardSubtitle: 'Padrão ANSI/NIST-ITL 1-2011 • ISO/IEC 19794-5 & 19794-2 • Ed25519',
    nidVerifiedMod11: 'Módulo 11 Verificado',
    nidHologramActive: 'Holograma Neural Ativo',
    labelFullName: 'Nome Civil Completo',
    labelBirthDate: 'Data de Nascimento',
    labelAge: 'Idade Cronológica',
    labelNativeLang: 'Idioma Nativo Registrado',
    labelFiliation: 'Filiação Soberana',
    labelAddress: 'Endereço Residencial em Novatlantis',
    labelPublicKey: 'Chave Pública Assimétrica (Ed25519)',
    labelNistScore: 'Confiança Biométrica NIST',
    labelNistFaceHash: 'Template Facial (ISO/IEC 19794-5)',
    labelMinutiaeCount: 'Minúcias Digitais (ISO/IEC 19794-2)',
    editProfileBtn: 'Atualizar Endereço & Biometria Facial',
    saveProfileBtn: 'Assinar com Ed25519 & Salvar no Spanner (Projeto: novatlantis)',
    uploadPhotoLabel: 'Trocar Foto de Perfil (Validação ICAO/NIST em Tempo Real)',
    icaoValidatorTitle: 'Motor de Conformidade Facial ICAO 9303 / NIST Type-10',
    icaoCompliantBadge: 'APROVADO PELO VALIDADOR NIST/ICAO',
    icaoFailedBadge: 'REPROVADO: FORA DO ENQUADRAMENTO ICAO',
    icaoCheckEyes: 'Distância Interpupilar (mín. 90px)',
    icaoCheckPose: 'Ângulo Cefálico Pitch/Yaw (±5°)',
    icaoCheckLight: 'Uniformidade de Iluminação (>85%)',
    simulatePhotoPass: 'Testar Captura Biométrica Conformante (ICAO OK)',
    simulatePhotoFail: 'Testar Foto Descentralizada (Simular Bloqueio NIST)',
    launchpadTitle: 'Single-Click Launchpad — Malha de Serviços Satélites Agênticos',
    launchpadSubtitle: 'Transição instantânea Zero-Trust (OIDC/JWT) sem necessidade de relogar.',
    ssoBadge: 'SSO Ativo • Zero Re-Login',
    auditPanelTitle: 'Painel de Transparência e Auditoria Cidadã (Últimas 48 Horas)',
    auditPanelSubtitle: 'Registro imutável de todas as secretarias e agentes de IA que consultaram seus dados soberanos.',
    auditAgency: 'Secretaria / Órgão',
    auditAgent: 'Agente de IA / Serviço',
    auditPurpose: 'Finalidade Constitucional do Acesso',
    auditTimestamp: 'Horário & Hash',
    heraldryTitle: 'Identidade Visual Soberana — Bandeira & Brasão de Armas de Novatlantis',
    heraldrySubtitle:
      'Concebidos para simbolizar a união entre Democracia Cívica, Soberania Criptográfica, Sustentabilidade Oceânica e Inteligência Artificial Agêntica.',
    flagTitle: 'Bandeira Oficial da República Digital de Novatlantis',
    flagDesc:
      'Fundo Azul-Cobalto Soberano (#082F72) com Triângulo Azul-Oceânico (#009EE0) à tralha. Ao centro, a Coroa de Louros Prateada envolve a Constelação Neural Dourada de 9 Nós (8 Agentes Ministeriais de IA interconectados ao Cidadão Soberano no centro).',
    coatTitle: 'Brasão de Armas Soberano — "NOVATLANTIS • LIBERTAS IN DIGITALI"',
    coatDesc:
      'Timbrado pela Águia Dourada e Azul sob o Sol da IA, empunhando a Chave Criptográfica Ed25519 e a Onda Atlântica. Escudo partido: à destra (azul), o Caduceu e a Balança da Justiça Algorítmica; à sinistra (verde-esmeralda), a Árvore Cibernética da Vida ascendendo às Nuvens Soberanas.',
    service311Title: 'Central 311 — Zeladoria Urbana e Triagem Agêntica',
    service311Desc: 'Envie relatos geolocalizados com fotos. O Agente Gemini classifica a secretaria e estima o SLA.',
    issueInputPlaceholder: 'Descreva o problema urbano (ex: Poste solar apagado ou vazamento na rede pluvial)...',
    analyze311Btn: 'Acionar Agente de Triagem Urbana (LLM)',
    llmDepartment: 'Secretaria Responsável',
    llmSla: 'Prazo Estimado de Reparo (SLA)',
    llmPriority: 'Prioridade Operacional',
    service911Title: 'Central 911 — Resposta Tática de Emergência (Alto Contraste)',
    service911Desc: 'Acionamento com 1 clique, triagem médica/policial por IA de voz/texto e despacho de viaturas.',
    sosOneClickBtn: 'DISPARO DE EMERGÊNCIA 1-CLIQUE (GEOLOCALIZAÇÃO + BIOMETRIA)',
    triageInputPlaceholder: 'Relate a emergência por voz ou texto (ex: Dor torácica aguda / Colisão na via)...',
    dispatchBtn: 'Executar Triagem & Despachar Viaturas no Mapa',
    unitDispatched: 'Unidades Táticas Despachadas em Tempo Real',
    serviceHealthTitle: 'Saúde Digital — Prontuário Soberano & Telemedicina Agêntica',
    serviceHealthDesc: 'Sala de teleconsulta com transcrição clínica ao vivo, sumarização SOAP por IA e prescrição Ed25519.',
    startTelemedBtn: 'Simular Transcrição Clínica & Gerar Prescrição Assinada',
    liveTranscriptLabel: 'Transcrição Ao Vivo (Speech-to-Text Médico)',
    aiSummaryLabel: 'Sumarização Clínica Estruturada (Agente IA)',
    digitalRxLabel: 'Prescrição Digital Assinada (Ed25519 ICP-Novatlantis)',
    serviceEduTitle: 'Educação & Tutoria Adaptativa por Faixa Etária',
    serviceEduDesc: 'Trilhas de aprendizagem geradas dinamicamente por IA com base na idade cadastrada no NID.',
    adaptiveTrackLabel: 'Trilha Curricular Ativa para sua Idade',
    askTutorBtn: 'Gerar Nova Lição Adaptativa com IA',
  },
  'es-419': {
    govHeader: 'GOV.NOVATLANTIS.CLOUD • PROYECTO GCP: NOVATLANTIS • LIBERTAS IN DIGITALI',
    mottoTranslation: 'Libertad en la Era Digital • Estado Soberano AI-First',
    republicTitle: 'República Digital de Novatlantis',
    republicSubtitle:
      'Primera Nación AI-First de la Era Agéntica • Identidad Biométrica NIST • Gobernanza Autónoma en Google Cloud',
    aiFirstBadge: 'CONSTELACIÓN DE 9 NODOS AGÉNTICOS ACTIVA',
    langResolutionLabel: 'Resolución de Idioma (3 Capas):',
    langSourceAuth: 'Capa 1 • Idioma Nativo del Ciudadano Autenticado (BD)',
    langSourceAnon: 'Capa 2 • Visitante Anónimo (HTTP Accept-Language + GeoIP)',
    langSourceOverride: 'Capa 3 • Override Explícito del Encabezado (localStorage)',
    resetLangOverride: 'Restaurar Automático',
    citizenSelectorLabel: 'Sesión de Ciudadano (Simulador SSO):',
    anonymousVisitor: 'Visitante Anónimo (Sin Sesión)',
    navHub: 'NID Hub y Ciudadanía',
    nav311: '311 Atención Urbana',
    nav911: '911 Emergencia IA',
    navHealth: 'Salud y Telemedicina',
    navEducation: 'Educación Adaptativa',
    navHeraldry: 'Símbolos Nacionales (Bandera y Escudo)',
    nidCardTitle: 'Documento Nacional de Identidad (NID)',
    nidCardSubtitle: 'Estándar ANSI/NIST-ITL 1-2011 • ISO/IEC 19794-5 & 19794-2 • Ed25519',
    nidVerifiedMod11: 'Módulo 11 Verificado',
    nidHologramActive: 'Holograma Neural Activo',
    labelFullName: 'Nombre Civil Completo',
    labelBirthDate: 'Fecha de Nacimiento',
    labelAge: 'Edad Cronológica',
    labelNativeLang: 'Idioma Nativo Registrado',
    labelFiliation: 'Filiación Soberana',
    labelAddress: 'Dirección Residencial en Novatlantis',
    labelPublicKey: 'Clave Pública Asimétrica (Ed25519)',
    labelNistScore: 'Confianza Biométrica NIST',
    labelNistFaceHash: 'Plantilla Facial (ISO/IEC 19794-5)',
    labelMinutiaeCount: 'Minucias Dactilares (ISO/IEC 19794-2)',
    editProfileBtn: 'Actualizar Dirección y Biometría Facial',
    saveProfileBtn: 'Firmar con Ed25519 y Guardar en Spanner (Proyecto: novatlantis)',
    uploadPhotoLabel: 'Cambiar Foto de Perfil (Validación ICAO/NIST en Tiempo Real)',
    icaoValidatorTitle: 'Motor de Conformidad Facial ICAO 9303 / NIST Type-10',
    icaoCompliantBadge: 'APROBADO POR EL VALIDADOR NIST/ICAO',
    icaoFailedBadge: 'RECHAZADO: FUERA DEL ENCUADRE ICAO',
    icaoCheckEyes: 'Distancia Interpupilar (mín. 90px)',
    icaoCheckPose: 'Ángulo Cefálico Pitch/Yaw (±5°)',
    icaoCheckLight: 'Uniformidad de Iluminación (>85%)',
    simulatePhotoPass: 'Probar Captura Biométrica Conforme (ICAO OK)',
    simulatePhotoFail: 'Probar Foto Descentrada (Simular Bloqueo NIST)',
    launchpadTitle: 'Single-Click Launchpad — Malla de Servicios Satélite Agénticos',
    launchpadSubtitle: 'Transición instantánea Zero-Trust (OIDC/JWT) sin necesidad de volver a iniciar sesión.',
    ssoBadge: 'SSO Activo • Sin Re-Login',
    auditPanelTitle: 'Panel de Transparencia y Auditoría Ciudadana (Últimas 48 Horas)',
    auditPanelSubtitle: 'Registro inmutable de todas las secretarías y agentes de IA que consultaron sus datos soberanos.',
    auditAgency: 'Secretaría / Organismo',
    auditAgent: 'Agente de IA / Servicio',
    auditPurpose: 'Finalidad Constitucional del Acceso',
    auditTimestamp: 'Horario y Hash',
    heraldryTitle: 'Identidad Visual Soberana — Bandera y Escudo de Armas de Novatlantis',
    heraldrySubtitle:
      'Diseñados para simbolizar la unión entre Democracia Cívica, Soberanía Criptográfica, Sostenibilidad Oceánica e Inteligencia Artificial Agéntica.',
    flagTitle: 'Bandera Oficial de la República Digital de Novatlantis',
    flagDesc:
      'Campo Azul Cobalto Soberano (#082F72) con Triángulo Azul Oceánico (#009EE0). En el centro, la Corona de Laureles Plateada rodea la Constelación Neural Dorada de 9 Nodos (8 Agentes Ministeriales de IA conectados al Ciudadano Soberano en el centro).',
    coatTitle: 'Escudo de Armas Soberano — "NOVATLANTIS • LIBERTAS IN DIGITALI"',
    coatDesc:
      'Coronado por el Águila Dorada y Azul bajo el Sol de la IA, sosteniendo la Llave Criptográfica Ed25519 y la Ola Atlántica. Escudo partido: a la diestra (azul), el Caduceo y la Balanza de la Justicia Algorítmica; a la siniestra (verde esmeralda), el Árbol Cibernético de la Vida ascendiendo a las Nubes Soberanas.',
    service311Title: 'Central 311 — Mantenimiento Urbano y Triaje Agéntico',
    service311Desc: 'Envíe reportes geolocalizados con fotos. El Agente Gemini clasifica el departamento y estima el SLA.',
    issueInputPlaceholder: 'Describa el incidente urbano (ej: Luminaria solar apagada o fuga hidráulica)...',
    analyze311Btn: 'Activar Agente de Triaje Urbano (LLM)',
    llmDepartment: 'Secretaría Responsable',
    llmSla: 'Tiempo Estimado de Reparación (SLA)',
    llmPriority: 'Prioridad Operativa',
    service911Title: 'Central 911 — Respuesta Táctica de Emergencia (Alto Contraste)',
    service911Desc: 'Activación con 1 clic, triaje médico/policial por IA de voz/texto y despacho de patrullas.',
    sosOneClickBtn: 'DISPARO DE EMERGENCIA 1-CLIC (GEOLOCALIZACIÓN + BIOMETRÍA)',
    triageInputPlaceholder: 'Reporte la emergencia por voz o texto (ej: Dolor torácico agudo / Accidente vial)...',
    dispatchBtn: 'Ejecutar Triaje y Despachar Unidades en el Mapa',
    unitDispatched: 'Unidades Tácticas Despachadas en Tiempo Real',
    serviceHealthTitle: 'Salud Digital — Historia Clínica Soberana y Telemedicina Agéntica',
    serviceHealthDesc: 'Sala de teleconsulta con transcripción en vivo, resumen clínico por IA y receta firmada Ed25519.',
    startTelemedBtn: 'Simular Transcripción Clínica y Emitir Receta Firmada',
    liveTranscriptLabel: 'Transcripción en Vivo (Speech-to-Text Médico)',
    aiSummaryLabel: 'Resumen Clínico Estructurado (Agente IA)',
    digitalRxLabel: 'Receta Digital Firmada (Ed25519 ICP-Novatlantis)',
    serviceEduTitle: 'Educación y Tutoría Adaptativa por Edad',
    serviceEduDesc: 'Rutas de aprendizaje personalizadas por IA según la edad registrada en el NID del estudiante.',
    adaptiveTrackLabel: 'Ruta Curricular Activa para su Edad',
    askTutorBtn: 'Generar Nueva Lección Adaptativa con IA',
  },
  'en-US': {
    govHeader: 'GOV.NOVATLANTIS.CLOUD • GCP PROJECT: NOVATLANTIS • LIBERTAS IN DIGITALI',
    mottoTranslation: 'Liberty in the Digital Age • AI-First Sovereign State',
    republicTitle: 'Digital Republic of Novatlantis',
    republicSubtitle:
      'First AI-First Nation of the Agentic Era • NIST Biometric Identity • Autonomous Governance on Google Cloud',
    aiFirstBadge: '9-NODE AGENTIC NEURAL CONSTELLATION ACTIVE',
    langResolutionLabel: 'Language Resolution (3-Tier):',
    langSourceAuth: 'Tier 1 • Authenticated Citizen Native Language (DB)',
    langSourceAnon: 'Tier 2 • Anonymous Visitor (HTTP Accept-Language + GeoIP)',
    langSourceOverride: 'Tier 3 • Explicit Global Header Override (localStorage)',
    resetLangOverride: 'Reset to Automatic',
    citizenSelectorLabel: 'Citizen Session (SSO Simulator):',
    anonymousVisitor: 'Anonymous Visitor (No Session)',
    navHub: 'NID Hub & Citizenship',
    nav311: '311 Urban Services',
    nav911: '911 AI Emergency',
    navHealth: 'Health & Telemedicine',
    navEducation: 'Adaptive Education',
    navHeraldry: 'National Symbols (Flag & Coat of Arms)',
    nidCardTitle: 'National Identity Card (NID)',
    nidCardSubtitle: 'ANSI/NIST-ITL 1-2011 Standard • ISO/IEC 19794-5 & 19794-2 • Ed25519',
    nidVerifiedMod11: 'Modulo-11 Verified',
    nidHologramActive: 'Neural Hologram Active',
    labelFullName: 'Full Legal Name',
    labelBirthDate: 'Date of Birth',
    labelAge: 'Chronological Age',
    labelNativeLang: 'Registered Native Language',
    labelFiliation: 'Sovereign Filiation (Parents)',
    labelAddress: 'Residential Address in Novatlantis',
    labelPublicKey: 'Asymmetric Public Key (Ed25519)',
    labelNistScore: 'NIST Biometric Confidence',
    labelNistFaceHash: 'Facial Template (ISO/IEC 19794-5)',
    labelMinutiaeCount: 'Fingerprint Minutiae (ISO/IEC 19794-2)',
    editProfileBtn: 'Update Address & Facial Biometrics',
    saveProfileBtn: 'Sign with Ed25519 & Save to Spanner (Project: novatlantis)',
    uploadPhotoLabel: 'Replace Profile Photo (Real-Time ICAO/NIST Validation)',
    icaoValidatorTitle: 'ICAO 9303 / NIST Type-10 Facial Framing Engine',
    icaoCompliantBadge: 'PASSED NIST/ICAO BIOMETRIC VALIDATION',
    icaoFailedBadge: 'REJECTED: NON-COMPLIANT ICAO FRAMING',
    icaoCheckEyes: 'Inter-pupillary Distance (min. 90px)',
    icaoCheckPose: 'Head Pitch/Yaw Angle (±5°)',
    icaoCheckLight: 'Illumination Uniformity (>85%)',
    simulatePhotoPass: 'Test Compliant Biometric Capture (ICAO OK)',
    simulatePhotoFail: 'Test Off-Center Photo (Simulate NIST Rejection)',
    launchpadTitle: 'Single-Click Launchpad — Agentic Satellite Services Mesh',
    launchpadSubtitle: 'Instant Zero-Trust (OIDC/JWT) handoff with zero re-login required.',
    ssoBadge: 'Active SSO • Zero Re-Login',
    auditPanelTitle: 'Citizen Data Transparency & Audit Ledger (Last 48 Hours)',
    auditPanelSubtitle: 'Immutable log of every ministry and AI agent that accessed your sovereign records.',
    auditAgency: 'Ministry / Secretariat',
    auditAgent: 'AI Agent / Service ID',
    auditPurpose: 'Constitutional Access Purpose',
    auditTimestamp: 'Timestamp & Hash',
    heraldryTitle: 'Sovereign Visual Identity — Flag & Coat of Arms of Novatlantis',
    heraldrySubtitle:
      'Designed to symbolize the union of Civic Democracy, Cryptographic Sovereignty, Oceanic Sustainability, and Agentic Artificial Intelligence.',
    flagTitle: 'Official Flag of the Digital Republic of Novatlantis',
    flagDesc:
      'Sovereign Cobalt Blue field (#082F72) with an Oceanic Cyan hoist triangle (#009EE0). At the center, the Silver Laurel Wreath encircles the 9-Node Golden Neural Constellation (8 Ministerial AI Agents interconnected with the Sovereign Citizen at the core).',
    coatTitle: 'Sovereign Coat of Arms — "NOVATLANTIS • LIBERTAS IN DIGITALI"',
    coatDesc:
      'Crested by the Golden-and-Azure Eagle rising before the AI Sun, clutching the Ed25519 Cryptographic Key and the Atlantic Wave. Shield divided per pale: dexter (azure) features the Caduceus & Scales of Algorithmic Justice; sinister (emerald) features the Cybernetic Tree of Life ascending into Sovereign Clouds.',
    service311Title: '311 Center — Urban Maintenance & Agentic Triage',
    service311Desc: 'Submit geolocated reports with photos. The Gemini Agent classifies the department and estimates SLA.',
    issueInputPlaceholder: 'Describe the urban issue (e.g., Solar streetlight outage or water main leak)...',
    analyze311Btn: 'Trigger Urban Triage AI Agent (LLM)',
    llmDepartment: 'Responsible Department',
    llmSla: 'Estimated Repair SLA',
    llmPriority: 'Operational Priority',
    service911Title: '911 Center — High-Contrast Tactical Emergency Dispatch',
    service911Desc: '1-Click SOS trigger, voice/text AI medical & police triage, and live autonomous unit dispatch.',
    sosOneClickBtn: '1-CLICK EMERGENCY SOS (GEOLOCATION + BIOMETRIC DISPATCH)',
    triageInputPlaceholder: 'Report the emergency via voice or text (e.g., Acute chest pain / Traffic collision)...',
    dispatchBtn: 'Run AI Triage & Dispatch Tactical Units on Map',
    unitDispatched: 'Real-Time Dispatched Tactical Units',
    serviceHealthTitle: 'Digital Health — Sovereign EHR & Agentic Telemedicine',
    serviceHealthDesc: 'Virtual consultation room with live speech transcription, AI clinical summary, and Ed25519 e-Rx.',
    startTelemedBtn: 'Simulate Live Clinical Transcription & Sign Digital Rx',
    liveTranscriptLabel: 'Live Medical Speech-to-Text Transcription',
    aiSummaryLabel: 'AI Clinical SOAP Summary',
    digitalRxLabel: 'Digitally Signed Prescription (Ed25519 ICP-Novatlantis)',
    serviceEduTitle: 'Education & Age-Adaptive AI Tutoring',
    serviceEduDesc: 'Personalized learning pathways generated by AI based on the student’s registered NID age.',
    adaptiveTrackLabel: 'Active Curriculum Pathway for Your Age',
    askTutorBtn: 'Generate New Adaptive AI Lesson',
  },
};

// ============================================================================
// PERFIS SINTÉTICOS DE DEMONSTRAÇÃO (EXTRAÍDOS DO LOTE DE 100.000 CIDADÃOS)
// ============================================================================

const DEMO_CITIZENS: Record<string, CitizenProfile> = {
  'NID-100-0000-0019': {
    nid: 'NID-100-0000-0019',
    fullName: 'Helena Oliveira Silva',
    nativeLanguage: 'pt-BR',
    birthDate: '1992-05-14',
    ageYears: 34,
    filiation: {
      motherName: 'Clara Oliveira Silva',
      fatherName: 'Rafael Santos Silva',
    },
    address: {
      street: 'Av. Ada Lovelace, 1024',
      district: 'Distrito Tecnológico',
      postalCode: 'NV-10-412',
      lat: -23.5412,
      lng: -46.6481,
    },
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    publicKeyEd25519: 'MCowBQYDK2VwAyEA8f92aB4c7dE10F39aBcDeF0123456789NovatlantisKey=',
    biometrics: {
      nistFaceTemplate: 'Rk1gIDIwAAH0AAB+L2f9pQ8zX1vN4mK7jH2gT5rB9yW3cE6uI0oP==',
      nistFingerprintMinutiae: [
        { x: 142, y: 218, theta: 45, quality: 96, type: 'RIDGE_ENDING' },
        { x: 205, y: 184, theta: 128, quality: 94, type: 'BIFURCATION' },
        { x: 288, y: 310, theta: 215, quality: 92, type: 'RIDGE_ENDING' },
        { x: 176, y: 342, theta: 302, quality: 98, type: 'BIFURCATION' },
      ],
      biometricConfidenceScore: 0.984,
      icaoCompliant: true,
      eyeDistancePx: 118,
      headPitchDeg: 1.2,
      illuminationScore: 96,
    },
  },
  'NID-100-0000-0027': {
    nid: 'NID-100-0000-0027',
    fullName: 'Mateo Hernández García',
    nativeLanguage: 'es-419',
    birthDate: '2011-11-03',
    ageYears: 14,
    filiation: {
      motherName: 'Sofía Hernández García',
      fatherName: 'Santiago López García',
    },
    address: {
      street: 'Orla das Marés Limpas, 450',
      district: 'Distrito Oceânico',
      postalCode: 'NV-20-805',
      lat: -23.591,
      lng: -46.672,
    },
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    publicKeyEd25519: 'MCowBQYDK2VwAyEA4k81mP2x9zL05V71cDeFgH9876543210NovatlantisKey=',
    biometrics: {
      nistFaceTemplate: 'Rk1gIDIwAAH0AAC9K3m8wP1xZ4nB7vC2lQ5tR8yU0iO3pA6sD9fG==',
      nistFingerprintMinutiae: [
        { x: 112, y: 190, theta: 32, quality: 95, type: 'RIDGE_ENDING' },
        { x: 244, y: 210, theta: 164, quality: 91, type: 'BIFURCATION' },
        { x: 310, y: 295, theta: 275, quality: 93, type: 'RIDGE_ENDING' },
      ],
      biometricConfidenceScore: 0.971,
      icaoCompliant: true,
      eyeDistancePx: 112,
      headPitchDeg: -1.8,
      illuminationScore: 93,
    },
  },
  'NID-100-0000-0035': {
    nid: 'NID-100-0000-0035',
    fullName: 'Olivia Sterling Davis',
    nativeLanguage: 'en-US',
    birthDate: '2019-04-22',
    ageYears: 7,
    filiation: {
      motherName: 'Charlotte Sterling Davis',
      fatherName: 'William Miller Davis',
    },
    address: {
      street: 'Praça da Constituição Digital, 88',
      district: 'Colina da Justiça',
      postalCode: 'NV-30-119',
      lat: -23.5195,
      lng: -46.618,
    },
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    publicKeyEd25519: 'MCowBQYDK2VwAyEA7z19qW3e5rT8yU2iO4pA6sD8fG0hJ2kLNovatlantisKey=',
    biometrics: {
      nistFaceTemplate: 'Rk1gIDIwAAH0AAD7P1q2W3e4R5t6Y7u8I9o0P1a2S3d4F5g6H7j8==',
      nistFingerprintMinutiae: [
        { x: 160, y: 175, theta: 18, quality: 97, type: 'BIFURCATION' },
        { x: 220, y: 260, theta: 140, quality: 95, type: 'RIDGE_ENDING' },
        { x: 290, y: 310, theta: 255, quality: 90, type: 'BIFURCATION' },
      ],
      biometricConfidenceScore: 0.992,
      icaoCompliant: true,
      eyeDistancePx: 124,
      headPitchDeg: 0.6,
      illuminationScore: 98,
    },
  },
};

export function validateNIDMod11Client(nid: string): boolean {
  if (!/^NID-\d{3}-\d{4}-\d{4}$/.test(nid)) return false;
  const digits = nid.replace(/^NID-/, '').replace(/-/g, '');
  const weights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const rem = sum % 11;
  const dv = rem < 2 ? 0 : 11 - rem;
  return Number(digits[10]) === dv;
}

const STORAGE_OVERRIDE_KEY = 'novatlantis_lang_override';

export const App: React.FC = () => {
  const [selectedCitizenId, setSelectedCitizenId] = useState<string>('NID-100-0000-0019');
  const [citizensMap, setCitizensMap] = useState<Record<string, CitizenProfile>>(DEMO_CITIZENS);
  const currentCitizen: CitizenProfile | null =
    selectedCitizenId === 'ANONYMOUS' ? null : citizensMap[selectedCitizenId] ?? null;

  const [explicitLangOverride, setExplicitLangOverride] = useState<SupportedLocale | null>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_OVERRIDE_KEY);
      if (saved === 'pt-BR' || saved === 'es-419' || saved === 'en-US') {
        return saved;
      }
    } catch {
      // Ignore SSR
    }
    return null;
  });

  const { activeLocale, resolutionLayer } = useMemo((): {
    activeLocale: SupportedLocale;
    resolutionLayer: 'OVERRIDE' | 'AUTHENTICATED_DB' | 'ANONYMOUS_HEADER';
  } => {
    if (explicitLangOverride) {
      return { activeLocale: explicitLangOverride, resolutionLayer: 'OVERRIDE' };
    }
    if (currentCitizen) {
      return { activeLocale: currentCitizen.nativeLanguage, resolutionLayer: 'AUTHENTICATED_DB' };
    }
    const navLang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'pt-br';
    if (navLang.startsWith('es')) return { activeLocale: 'es-419', resolutionLayer: 'ANONYMOUS_HEADER' };
    if (navLang.startsWith('en')) return { activeLocale: 'en-US', resolutionLayer: 'ANONYMOUS_HEADER' };
    return { activeLocale: 'pt-BR', resolutionLayer: 'ANONYMOUS_HEADER' };
  }, [explicitLangOverride, currentCitizen]);

  const t = I18N_DICTIONARY[activeLocale];

  const handleSetLanguageOverride = (locale: SupportedLocale) => {
    setExplicitLangOverride(locale);
    try {
      window.localStorage.setItem(STORAGE_OVERRIDE_KEY, locale);
    } catch {
      // Ignore
    }
  };

  const handleClearLanguageOverride = () => {
    setExplicitLangOverride(null);
    try {
      window.localStorage.removeItem(STORAGE_OVERRIDE_KEY);
    } catch {
      // Ignore
    }
  };

  const [activeModule, setActiveModule] = useState<ActiveModule>('hub');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [draftDistrict, setDraftDistrict] = useState<string>('Distrito Tecnológico');
  const [draftStreet, setDraftStreet] = useState<string>('Av. Ada Lovelace, 1024');
  const [draftPostal, setDraftPostal] = useState<string>('NV-10-412');

  useEffect(() => {
    if (currentCitizen) {
      setDraftDistrict(currentCitizen.address.district);
      setDraftStreet(currentCitizen.address.street);
      setDraftPostal(currentCitizen.address.postalCode);
    }
  }, [currentCitizen]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUD-9941',
      timestamp: '2026-09-30 18:12:04 UTC',
      relativeTime: '1h 32m',
      secretariat: 'Ministério da Saúde Digital (Caduceu Prateado)',
      aiAgent: 'agent-telemed-clinical-v4',
      purpose: {
        'pt-BR': 'Verificação de alergias medicamentosas e assinatura de prontuário eletrônico',
        'es-419': 'Verificación de alergias farmacológicas y firma de historia clínica electrónica',
        'en-US': 'Medication allergy verification and electronic health record signature check',
      },
      fieldsAccessed: ['nid', 'birth_date', 'public_key_ed25519'],
      hash: 'sha256:9f84b2c1e07a44d9',
    },
    {
      id: 'AUD-9882',
      timestamp: '2026-09-30 09:45:19 UTC',
      relativeTime: '10h 01m',
      secretariat: 'Autoridade Soberana NID (Chave Dourada Ed25519)',
      aiAgent: 'agent-nist-biometric-verifier',
      purpose: {
        'pt-BR': 'Autenticação Single Sign-On (OIDC/JWT) e validação de template ISO/IEC 19794-5',
        'es-419': 'Autenticación Single Sign-On (OIDC/JWT) y validación de plantilla ISO/IEC 19794-5',
        'en-US': 'Single Sign-On (OIDC/JWT) authentication & ISO/IEC 19794-5 template verification',
      },
      fieldsAccessed: ['nid', 'nist_face_template', 'native_language'],
      hash: 'sha256:3c71e8a5b42f190c',
    },
    {
      id: 'AUD-9710',
      timestamp: '2026-09-29 14:20:51 UTC',
      relativeTime: '29h 23m',
      secretariat: 'Secretaria de Zeladoria & Árvore Cibernética (311)',
      aiAgent: 'agent-311-urban-triage-llm',
      purpose: {
        'pt-BR': 'Confirmação de jurisdição distrital para protocolo de iluminação fotovoltaica',
        'es-419': 'Confirmación de jurisdicción distrital para protocolo de iluminación fotovoltaica',
        'en-US': 'District jurisdiction confirmation for solar streetlight maintenance ticket',
      },
      fieldsAccessed: ['nid', 'address.district', 'address.coordinates'],
      hash: 'sha256:7d29f4c8a11e60b3',
    },
  ]);

  const appendAuditLog = (
    secretariat: string,
    aiAgent: string,
    purpose: Record<SupportedLocale, string>,
    fieldsAccessed: string[]
  ) => {
    const randomHex = Math.floor(Math.random() * 0xffffffffffff)
      .toString(16)
      .padStart(12, '0');
    const newEntry: AuditLogEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      relativeTime: 'Agora / Just now',
      secretariat,
      aiAgent,
      purpose,
      fieldsAccessed,
      hash: `sha256:4e91${randomHex}`,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleLaunchService = (target: ActiveModule) => {
    setActiveModule(target);
    if (target === '311') {
      appendAuditLog(
        'Secretaria de Zeladoria Urbana (311)',
        'agent-311-sso-gateway',
        {
          'pt-BR': 'Acesso Single-Click Launchpad (Zero Re-Login) com geolocalização distrital',
          'es-419': 'Acceso Single-Click Launchpad (Sin Re-Login) con geolocalización distrital',
          'en-US': 'Single-Click Launchpad SSO access with district geolocation handoff',
        },
        ['nid', 'address.district', 'native_language']
      );
    } else if (target === '911') {
      appendAuditLog(
        'Comando Tático de Emergências (911)',
        'agent-911-tactical-dispatcher',
        {
          'pt-BR': 'Pré-carregamento de coordenadas GPS e dados vitais de emergência',
          'es-419': 'Precarga de coordenadas GPS y datos vitales de emergencia',
          'en-US': 'Pre-loading GPS coordinates and vital emergency profile',
        },
        ['nid', 'full_name', 'address.coordinates', 'biometrics']
      );
    } else if (target === 'health') {
      appendAuditLog(
        'Ministério da Saúde Digital (Telemedicina)',
        'agent-telemed-scribe-gemini',
        {
          'pt-BR': 'Abertura de sessão clínica criptografada e verificação de chave Ed25519',
          'es-419': 'Apertura de sesión clínica cifrada y verificación de clave Ed25519',
          'en-US': 'Encrypted clinical session initialization & Ed25519 key verification',
        },
        ['nid', 'birth_date', 'public_key_ed25519']
      );
    } else if (target === 'education') {
      appendAuditLog(
        'Ministério da Educação e Ciência Quântica',
        'agent-edu-adaptive-tutor',
        {
          'pt-BR': 'Consulta de idade cronológica para calibração da trilha curricular adaptativa',
          'es-419': 'Consulta de edad cronológica para calibración de la ruta curricular adaptativa',
          'en-US': 'Chronological age lookup for adaptive AI curriculum calibration',
        },
        ['nid', 'birth_date', 'age_years', 'native_language']
      );
    }
  };

  const handleSimulatePhotoUpload = (compliant: boolean) => {
    if (!currentCitizen) return;
    const updated: CitizenProfile = {
      ...currentCitizen,
      avatarUrl: compliant
        ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      biometrics: {
        ...currentCitizen.biometrics,
        icaoCompliant: compliant,
        biometricConfidenceScore: compliant ? 0.991 : 0.612,
        eyeDistancePx: compliant ? 122 : 68,
        headPitchDeg: compliant ? 0.8 : 14.5,
        illuminationScore: compliant ? 97 : 64,
        nistFaceTemplate: compliant
          ? 'Rk1gIDIwAAH0AAJ9X8v7B6n5M4k3J2h1G0f9D8s7A6p5O4i3U2y1=='
          : 'INVALID_ICAO_FRAME_LOW_CONFIDENCE',
      },
    };
    setCitizensMap((prev) => ({ ...prev, [currentCitizen.nid]: updated }));
    appendAuditLog(
      'Secretaria de Identidade Soberana (NID)',
      'agent-icao-9303-vision-validator',
      {
        'pt-BR': compliant
          ? 'Validação biométrica facial ANSI/NIST-ITL 1-2011 aprovada (Score: 0.991)'
          : 'Tentativa de atualização de foto rejeitada por enquadramento fora do padrão ICAO',
        'es-419': compliant
          ? 'Validación biométrica facial ANSI/NIST-ITL 1-2011 aprobada (Score: 0.991)'
          : 'Intento de actualización de foto rechazado por encuadre fuera del estándar ICAO',
        'en-US': compliant
          ? 'ANSI/NIST-ITL 1-2011 facial biometric validation passed (Score: 0.991)'
          : 'Photo update rejected due to non-compliant ICAO 9303 facial framing',
      },
      ['biometrics.nist_face_template', 'avatar_url']
    );
  };

  const handleSaveAddressUpdate = () => {
    if (!currentCitizen) return;
    const updated: CitizenProfile = {
      ...currentCitizen,
      address: {
        ...currentCitizen.address,
        district: draftDistrict,
        street: draftStreet,
        postalCode: draftPostal,
      },
    };
    setCitizensMap((prev) => ({ ...prev, [currentCitizen.nid]: updated }));
    setIsEditingProfile(false);
    appendAuditLog(
      'Cadastro Territorial Soberano (Cloud Spanner: novatlantis)',
      'agent-nid-registry-signer',
      {
        'pt-BR': `Atualização de endereço residencial para ${draftDistrict} assinada via Ed25519`,
        'es-419': `Actualización de dirección residencial a ${draftDistrict} firmada vía Ed25519`,
        'en-US': `Residential address update to ${draftDistrict} cryptographically signed via Ed25519`,
      },
      ['address.street', 'address.district', 'address.postal_code']
    );
  };

  const [issue311Text, setIssue311Text] = useState<string>(
    'Luminária fotovoltaica inteligente piscando e sensor ambiental offline na Av. Ada Lovelace.'
  );
  const [triage311Result, setTriage311Result] = useState<{
    protocol: string;
    department: string;
    sla: string;
    priority: string;
    confidence: string;
  } | null>({
    protocol: 'NV-311-2026-88412',
    department: 'Secretaria de Infraestrutura Energética & Smart Grid',
    sla: '4 horas e 30 minutos (Equipe Autônoma Solar-04)',
    priority: 'ALTA • INFRAESTRUTURA CRÍTICA',
    confidence: '99.2% (Gemini 2.5 Flash)',
  });

  const handleAnalyze311 = () => {
    const isWater = /água|vazamento|pluvial|water|fuga|maré/i.test(issue311Text);
    setTriage311Result({
      protocol: `NV-311-2026-${Math.floor(10000 + Math.random() * 89999)}`,
      department: isWater
        ? 'Autoridade Hídrica e Dessalinização Oceânica'
        : 'Secretaria de Infraestrutura Energética & Smart Grid',
      sla: isWater ? '2 horas (Unidade Hidráulica H-12)' : '4 horas (Equipe Autônoma Solar-04)',
      priority: isWater ? 'URGENTE • SEGURANÇA HÍDRICA' : 'ALTA • ZELADORIA INTELIGENTE',
      confidence: '99.4% (Gemini 2.5 Flash)',
    });
    appendAuditLog(
      'Secretaria de Zeladoria Urbana (311)',
      'agent-311-gemini-classifier',
      {
        'pt-BR': 'Classificação automatizada de chamado urbano e despacho de equipe de manutenção',
        'es-419': 'Clasificación automatizada de reporte urbano y despacho de equipo de mantenimiento',
        'en-US': 'Automated urban maintenance classification and field crew dispatch',
      },
      ['nid', 'address.coordinates']
    );
  };

  const [emergency911Text, setEmergency911Text] = useState<string>(
    'Cidadão consciente apresentando dor torácica súbita próximo à estação central do Distrito Tecnológico.'
  );
  const [dispatched911Units, setDispatched911Units] = useState<
    Array<{ code: string; type: string; eta: string; status: string }>
  >([
    {
      code: 'AMB-NV-07 (UTI Móvel Autônoma)',
      type: 'Suporte Avançado de Vida (Cardiologia)',
      eta: '2 min 40 seg',
      status: 'EM ROTA PRIORITÁRIA • SEMÁFOROS ABERTOS POR IA',
    },
    {
      code: 'DRONE-MED-02 (Desfibrilador Aéreo)',
      type: 'VANT de Resposta Rápida',
      eta: '55 segundos',
      status: 'EM VOO • COORDENADAS TRAVADAS',
    },
  ]);

  const handleTrigger911SOS = () => {
    setDispatched911Units([
      {
        code: 'AMB-NV-01 (Unidade Alfa)',
        type: 'Resgate Médico & Trauma',
        eta: '1 min 50 seg',
        status: 'DESPACHO IMEDIATO 1-CLIQUE • TELEMETRIA ATIVA',
      },
      {
        code: 'PATRULHA-NV-14 (Guarda Cívica)',
        type: 'Escolta Viária & Perímetro Seguro',
        eta: '2 min 10 seg',
        status: 'SINCRONIZADO COM CENTRAL 911',
      },
    ]);
    appendAuditLog(
      'Comando Tático de Emergências (911)',
      'agent-911-autonomous-dispatch',
      {
        'pt-BR': 'Acionamento SOS 1-Clique: envio de coordenadas precisas e tipo sanguíneo/alergias às viaturas',
        'es-419': 'Activación SOS 1-Clic: envío de coordenadas precisas y perfil médico a las unidades',
        'en-US': '1-Click SOS Dispatch: precise GPS coordinates and vital medical profile sent to units',
      },
      ['nid', 'full_name', 'address.coordinates', 'biometrics']
    );
  };

  const [telemedPrescriptionId, setTelemedPrescriptionId] = useState<string>('RX-NV-2026-90411-ED25519');

  const handleGenerateTelemedRx = () => {
    setTelemedPrescriptionId(`RX-NV-2026-${Math.floor(10000 + Math.random() * 89999)}-ED25519`);
    appendAuditLog(
      'Ministério da Saúde Digital (Telemedicina)',
      'agent-clinical-summarizer-pro',
      {
        'pt-BR': 'Emissão de sumarização clínica SOAP e prescrição digital assinada com Ed25519',
        'es-419': 'Emisión de resumen clínico SOAP y receta digital firmada con Ed25519',
        'en-US': 'SOAP clinical summary generation & Ed25519 digitally signed prescription issuance',
      },
      ['nid', 'birth_date', 'public_key_ed25519']
    );
  };

  const educationPathway = useMemo(() => {
    const age = currentCitizen?.ageYears ?? 30;
    if (age <= 8) {
      return {
        stage: 'Educação Infantil & Alfabetização Bilíngue Assistida por IA (01m – 8 anos)',
        modules: [
          'Fonética Interativa e Narrativas Visuais da Fauna Atlântica',
          'Lógica Lúdica com Blocos Espaciais e Música Matemática',
          'Cidadania Mirim: Cuidando dos Oceanos e Energia Limpa',
        ],
        aiTutorNote:
          'O Agente Pedagógico calibrou atividades visuais curtas (12 min), gamificadas e com síntese de voz acolhedora para a idade de ' +
          age +
          ' anos.',
      };
    }
    if (age <= 17) {
      return {
        stage: 'Ensino Fundamental II / Médio Tecnológico & Pensamento Computacional (9 – 17 anos)',
        modules: [
          'Robótica Sustentável, Python Aplicado e Sensores Urbanos IoT',
          'História das Democracias Digitais e Direitos Algorítmicos',
          'Biologia Marinha e Modelagem Climática de Novatlantis',
        ],
        aiTutorNote:
          'O Tutor Socrático ativou laboratórios práticos de código e desafios STEM adaptados para estudantes de ' +
          age +
          ' anos.',
      };
    }
    return {
      stage: 'Educação Superior, Pós-Graduação & Pesquisa Avançada (18 – 100 anos)',
      modules: [
        'Arquitetura de Sistemas Multi-Agentes no Google Cloud & Segurança Zero-Trust',
        'Criptografia Pós-Quântica e Governança de Dados Públicos (ANSI/NIST)',
        'Engenharia de Energia Fotovoltaica Offshore e Dessalinização',
      ],
      aiTutorNote:
        'Currículo executivo/universitário personalizado para ' +
        age +
        ' anos com simulações de arquitetura em nuvem e artigos científicos revisados por pares.',
    };
  }, [currentCitizen]);

  return (
    <div className="min-h-screen bg-[#041434] text-slate-100 font-sans antialiased">
      {/* ===================================================================
          BARRA CONSTITUCIONAL SOBERANA + SELETOR DE IDIOMA EM 100% DAS TELAS
          =================================================================== */}
      <div className="bg-[#020B1E] text-slate-200 border-b border-blue-900/60 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/flag-novatlantis.jpg"
              alt="Bandeira Oficial de Novatlantis"
              className="w-7 h-4.5 object-cover rounded-xs border border-amber-400/50 shadow-xs"
            />
            <span className="font-mono tracking-wider uppercase text-amber-300 font-semibold">{t.govHeader}</span>
          </div>

          {/* Indicador da Arquitetura de Idiomas em 3 Camadas + Botão Seletor Global */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-[#082F72]/60 border border-sky-500/30 px-2.5 py-1 rounded text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">{t.langResolutionLabel}</span>
              <span className="font-medium text-sky-300">
                {resolutionLayer === 'OVERRIDE'
                  ? t.langSourceOverride
                  : resolutionLayer === 'AUTHENTICATED_DB'
                  ? t.langSourceAuth
                  : t.langSourceAnon}
              </span>
              {explicitLangOverride && (
                <button
                  onClick={handleClearLanguageOverride}
                  className="ml-1.5 underline text-amber-300 hover:text-amber-200"
                >
                  ({t.resetLangOverride})
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[#082F72]/80 p-1 rounded-md border border-sky-400/30" role="group">
              {(['pt-BR', 'es-419', 'en-US'] as SupportedLocale[]).map((loc) => {
                const active = activeLocale === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => handleSetLanguageOverride(loc)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-200 hover:text-white hover:bg-blue-800/60'
                    }`}
                  >
                    {loc === 'pt-BR' ? 'PT-BR' : loc === 'es-419' ? 'ES-419' : 'EN-US'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          CABEÇALHO DE ESTADO AI-FIRST COM BRASÃO, BANDEIRA E LEMA OFICIAL
          =================================================================== */}
      <header className="bg-gradient-to-r from-[#062356] via-[#082F72] to-[#051C48] border-b border-amber-400/30 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Brasão de Armas Oficial de Novatlantis */}
            <div className="relative shrink-0 bg-white p-1 rounded-2xl border-2 border-amber-400 shadow-lg">
              <img
                src="/assets/coat-of-arms-novatlantis.jpg"
                alt="Brasão de Armas de Novatlantis — Libertas in Digitali"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heraldic text-[11px] sm:text-xs tracking-[0.2em] uppercase text-amber-300 font-bold">
                  NOVATLANTIS • LIBERTAS IN DIGITALI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                  ● {t.aiFirstBadge}
                </span>
              </div>
              <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                {t.republicTitle}
              </h1>
              <p className="text-xs sm:text-sm text-sky-200/90">{t.republicSubtitle}</p>
            </div>
          </div>

          {/* Bandeira Oficial + Simulador de Sessão Cidadã */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden xl:flex items-center gap-2.5 bg-[#041434]/80 border border-sky-400/30 px-3 py-1.5 rounded-xl">
              <img
                src="/assets/flag-novatlantis.jpg"
                alt="Bandeira de Novatlantis"
                className="w-12 h-8 object-cover rounded border border-amber-400/50"
              />
              <NovatlantisNeuralEmblemSvg className="w-8 h-8" />
            </div>

            <div className="flex flex-col">
              <label htmlFor="citizen-switcher" className="text-[11px] font-semibold text-amber-300 mb-0.5">
                {t.citizenSelectorLabel}
              </label>
              <select
                id="citizen-switcher"
                value={selectedCitizenId}
                onChange={(e) => {
                  setSelectedCitizenId(e.target.value);
                  handleClearLanguageOverride();
                }}
                className="text-xs sm:text-sm bg-[#041434] border border-amber-400/50 rounded-xl px-3 py-2 font-medium text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="NID-100-0000-0019">
                  Helena Silva (NID-100-0000-0019 • Nativo: pt-BR • 34 anos)
                </option>
                <option value="NID-100-0000-0027">
                  Mateo García (NID-100-0000-0027 • Nativo: es-419 • 14 anos)
                </option>
                <option value="NID-100-0000-0035">
                  Olivia Davis (NID-100-0000-0035 • Nativo: en-US • 7 anos)
                </option>
                <option value="ANONYMOUS">{t.anonymousVisitor}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Barra de Abas dos Serviços Satélites e Símbolos Nacionais */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto pb-3">
          <button
            onClick={() => setActiveModule('hub')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === 'hub'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-100 hover:bg-blue-900/60 border border-transparent'
            }`}
          >
            🪪 {t.navHub}
          </button>
          <button
            onClick={() => handleLaunchService('311')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === '311'
                ? 'bg-[#009EE0] text-slate-950 shadow-md'
                : 'text-slate-100 hover:bg-blue-900/60'
            }`}
          >
            🏙️ {t.nav311}
          </button>
          <button
            onClick={() => handleLaunchService('911')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === '911'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-red-200 bg-red-950/70 hover:bg-red-900/80 border border-red-500/40'
            }`}
          >
            🚨 {t.nav911}
          </button>
          <button
            onClick={() => handleLaunchService('health')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === 'health'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-100 hover:bg-blue-900/60'
            }`}
          >
            🩺 {t.navHealth}
          </button>
          <button
            onClick={() => handleLaunchService('education')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === 'education'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-100 hover:bg-blue-900/60'
            }`}
          >
            🎓 {t.navEducation}
          </button>
          <button
            onClick={() => setActiveModule('heraldry')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === 'heraldry'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-400/40'
            }`}
          >
            🦅 {t.navHeraldry}
          </button>
        </div>
      </header>

      {/* ===================================================================
          CONTEÚDO PRINCIPAL
          =================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* -----------------------------------------------------------------
            VISÃO 1: NID HUB, CARD HOLOGRÁFICO COM BANDEIRA/BRASÃO E AUDITORIA
            ----------------------------------------------------------------- */}
        {activeModule === 'hub' && (
          <>
            {/* Banner de Identidade Nacional AI-First (Bandeira + Brasão + Constelação de 9 Nós) */}
            <section className="rounded-2xl bg-gradient-to-r from-[#082F72] via-[#06245A] to-[#046A38]/80 border border-amber-400/40 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/flag-novatlantis.jpg"
                  alt="Bandeira Oficial da República Digital de Novatlantis"
                  className="w-28 sm:w-36 h-20 sm:h-24 object-cover rounded-xl border-2 border-amber-400 shadow-lg shrink-0"
                />
                <div className="space-y-1">
                  <div className="text-xs font-heraldic tracking-widest text-amber-300 uppercase font-bold">
                    NOVATLANTIS • LIBERTAS IN DIGITALI
                  </div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white">{t.mottoTranslation}</h2>
                  <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl">
                    Ecossistema governamental AI-First implantado no projeto Google Cloud{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-950/70 text-amber-300 font-mono">novatlantis</code>{' '}
                    com 100.000 cidadãos soberanos, biometria NIST e 8 agentes ministeriais autônomos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModule('heraldry')}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
              >
                🦅 Explorar Bandeira & Brasão
              </button>
            </section>

            {currentCitizen ? (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Esquerda (7 cols): Card de Identidade Nacional (NID) com Cores da Bandeira */}
                <div className="lg:col-span-7 bg-gradient-to-br from-[#082F72] via-[#051B44] to-[#03102B] text-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-amber-400/50 relative overflow-hidden">
                  {/* Cabeçalho do Documento Soberano com Brasão e Emblema Neural */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-sky-400/30">
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/coat-of-arms-novatlantis.jpg"
                        alt="Brasão de Novatlantis"
                        className="w-12 h-12 rounded-lg bg-white p-0.5 border border-amber-400 object-contain"
                      />
                      <div>
                        <span className="text-[11px] font-heraldic uppercase tracking-widest text-amber-300 block font-bold">
                          REPÚBLICA DIGITAL DE NOVATLANTIS • LIBERTAS IN DIGITALI
                        </span>
                        <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight mt-0.5">
                          {t.nidCardTitle}
                        </h2>
                        <p className="text-xs text-sky-200/80">{t.nidCardSubtitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/60">
                        ✓ {t.nidVerifiedMod11}: {validateNIDMod11Client(currentCitizen.nid) ? 'OK' : 'ERR'}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300">{t.nidHologramActive}</span>
                    </div>
                  </div>

                  {/* Corpo do Documento Virtual Dinâmico */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    {/* Foto de Perfil com Retículo Biométrico ICAO/NIST */}
                    <div className="sm:col-span-4 flex flex-col items-center">
                      <div className="relative w-36 h-44 rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg bg-slate-900">
                        <img
                          src={currentCitizen.avatarUrl}
                          alt={currentCitizen.fullName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-2 border border-dashed border-sky-300/80 rounded-lg pointer-events-none flex flex-col justify-between p-1.5">
                          <span className="text-[9px] font-mono bg-slate-950/85 text-amber-300 px-1 rounded self-start">
                            ICAO 9303
                          </span>
                          <span className="text-[9px] font-mono bg-slate-950/85 text-emerald-300 px-1 rounded self-end">
                            {(currentCitizen.biometrics.biometricConfidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* QR Code Biométrico Assinado + Emblema Neural */}
                      <div className="mt-4 bg-white p-2.5 rounded-xl shadow-md flex items-center gap-2.5 text-slate-900 w-full justify-center border border-amber-400">
                        <svg
                          viewBox="0 0 64 64"
                          className="w-12 h-12 shrink-0"
                          aria-label="QR Code Biométrico Soberano"
                        >
                          <rect width="64" height="64" fill="#ffffff" />
                          <rect x="4" y="4" width="18" height="18" fill="#082F72" />
                          <rect x="7" y="7" width="12" height="12" fill="#ffffff" />
                          <rect x="10" y="10" width="6" height="6" fill="#009EE0" />
                          <rect x="42" y="4" width="18" height="18" fill="#082F72" />
                          <rect x="45" y="7" width="12" height="12" fill="#ffffff" />
                          <rect x="48" y="10" width="6" height="6" fill="#009EE0" />
                          <rect x="4" y="42" width="18" height="18" fill="#082F72" />
                          <rect x="7" y="45" width="12" height="12" fill="#ffffff" />
                          <rect x="10" y="48" width="6" height="6" fill="#046A38" />
                          <rect x="26" y="8" width="4" height="4" fill="#082F72" />
                          <rect x="34" y="12" width="4" height="8" fill="#082F72" />
                          <rect x="26" y="24" width="12" height="4" fill="#D97706" />
                          <rect x="12" y="28" width="8" height="4" fill="#082F72" />
                          <rect x="28" y="34" width="6" height="6" fill="#046A38" />
                          <rect x="40" y="28" width="4" height="12" fill="#082F72" />
                          <rect x="50" y="32" width="8" height="4" fill="#082F72" />
                          <rect x="26" y="46" width="8" height="4" fill="#082F72" />
                          <rect x="38" y="46" width="6" height="6" fill="#009EE0" />
                          <rect x="48" y="44" width="10" height="4" fill="#082F72" />
                          <rect x="44" y="54" width="14" height="6" fill="#082F72" />
                        </svg>
                        <div className="text-[10px] leading-tight font-mono">
                          <div className="font-bold text-[#082F72]">QR BIOMÉTRICO</div>
                          <div className="text-slate-600">ISO/IEC 19794-5</div>
                          <div className="text-emerald-700 font-bold">CHAVE ED25519</div>
                        </div>
                      </div>
                    </div>

                    {/* Dados Civis e Biométricos do Cidadão */}
                    <div className="sm:col-span-8 space-y-3 text-sm">
                      <div className="bg-[#041434]/90 border border-amber-400/40 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-amber-300 block font-semibold">
                            IDENTIDADE SOBERANA (NID)
                          </span>
                          <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
                            {currentCitizen.nid}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-sky-300 block">
                            {t.labelNativeLang}
                          </span>
                          <span className="font-mono text-sm font-bold text-amber-300">
                            {currentCitizen.nativeLanguage}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#041434]/70 rounded-lg p-3 border border-sky-400/20">
                          <span className="text-[11px] text-sky-200/70 block">{t.labelFullName}</span>
                          <span className="font-semibold text-white">{currentCitizen.fullName}</span>
                        </div>
                        <div className="bg-[#041434]/70 rounded-lg p-3 border border-sky-400/20">
                          <span className="text-[11px] text-sky-200/70 block">
                            {t.labelBirthDate} / {t.labelAge}
                          </span>
                          <span className="font-semibold text-white">
                            {currentCitizen.birthDate} ({currentCitizen.ageYears} yrs)
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#041434]/70 rounded-lg p-3 border border-sky-400/20">
                        <span className="text-[11px] text-sky-200/70 block">{t.labelFiliation}</span>
                        <span className="text-xs sm:text-sm text-slate-100">
                          {currentCitizen.filiation.motherName} • {currentCitizen.filiation.fatherName}
                        </span>
                      </div>

                      <div className="bg-[#041434]/70 rounded-lg p-3 border border-sky-400/20">
                        <span className="text-[11px] text-sky-200/70 block">{t.labelAddress}</span>
                        <span className="text-xs sm:text-sm font-medium text-amber-300">
                          {currentCitizen.address.street} — {currentCitizen.address.district} (
                          {currentCitizen.address.postalCode})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
                        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-sky-500/30">
                          <span className="text-[10px] text-sky-300 block">{t.labelNistFaceHash}</span>
                          <span className="text-slate-200 truncate block">
                            {currentCitizen.biometrics.nistFaceTemplate}
                          </span>
                        </div>
                        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-300 block">{t.labelMinutiaeCount}</span>
                          <span className="text-amber-300 block">
                            {currentCitizen.biometrics.nistFingerprintMinutiae.length} pts (x,y,θ,q) • Score:{' '}
                            {currentCitizen.biometrics.biometricConfidenceScore.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita (5 cols): Gestão Cadastral + Validador Facial ICAO/NIST */}
                <div className="lg:col-span-5 bg-[#071F4A] rounded-2xl p-6 shadow-xl border border-sky-400/30 space-y-5">
                  <div className="flex items-center justify-between border-b border-sky-400/20 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">{t.icaoValidatorTitle}</h3>
                      <p className="text-xs text-sky-200/80">{t.uploadPhotoLabel}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        currentCitizen.biometrics.icaoCompliant
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : 'bg-red-950 text-red-300 border border-red-500/50'
                      }`}
                    >
                      {currentCitizen.biometrics.icaoCompliant ? t.icaoCompliantBadge : t.icaoFailedBadge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-[#041434] border border-sky-400/20">
                      <span className="text-[11px] text-sky-200/80 block">{t.icaoCheckEyes}</span>
                      <span className="font-mono font-bold text-sm text-amber-300">
                        {currentCitizen.biometrics.eyeDistancePx} px
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041434] border border-sky-400/20">
                      <span className="text-[11px] text-sky-200/80 block">{t.icaoCheckPose}</span>
                      <span className="font-mono font-bold text-sm text-amber-300">
                        {currentCitizen.biometrics.headPitchDeg}°
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041434] border border-sky-400/20">
                      <span className="text-[11px] text-sky-200/80 block">{t.icaoCheckLight}</span>
                      <span className="font-mono font-bold text-sm text-amber-300">
                        {currentCitizen.biometrics.illuminationScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleSimulatePhotoUpload(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      📷 {t.simulatePhotoPass}
                    </button>
                    <button
                      onClick={() => handleSimulatePhotoUpload(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ⚠️ {t.simulatePhotoFail}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-sky-400/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        {t.labelAddress}
                      </span>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="text-xs font-bold text-sky-300 hover:underline cursor-pointer"
                      >
                        {t.editProfileBtn}
                      </button>
                    </div>

                    {isEditingProfile ? (
                      <div className="space-y-3 bg-[#041434] p-4 rounded-xl border border-amber-400/40">
                        <div>
                          <label className="block text-xs font-medium text-sky-200 mb-1">Distrito Soberano</label>
                          <select
                            value={draftDistrict}
                            onChange={(e) => setDraftDistrict(e.target.value)}
                            className="w-full text-sm bg-[#082F72] border border-sky-400/40 text-white rounded-lg px-3 py-2"
                          >
                            <option value="Distrito Tecnológico">Distrito Tecnológico</option>
                            <option value="Distrito Oceânico">Distrito Oceânico</option>
                            <option value="Colina da Justiça">Colina da Justiça</option>
                            <option value="Porto Solar">Porto Solar</option>
                            <option value="Vale da Inovação">Vale da Inovação</option>
                            <option value="Bosque Esmeralda">Bosque Esmeralda</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-sky-200 mb-1">Logradouro e Número</label>
                            <input
                              type="text"
                              value={draftStreet}
                              onChange={(e) => setDraftStreet(e.target.value)}
                              className="w-full text-sm bg-[#082F72] border border-sky-400/40 text-white rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-sky-200 mb-1">Código Postal</label>
                            <input
                              type="text"
                              value={draftPostal}
                              onChange={(e) => setDraftPostal(e.target.value)}
                              className="w-full text-sm bg-[#082F72] border border-sky-400/40 text-white rounded-lg px-3 py-2 font-mono"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleSaveAddressUpdate}
                          className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          🔏 {t.saveProfileBtn}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-sky-200 bg-[#041434] p-3 rounded-lg border border-sky-400/20 font-mono truncate">
                        🔑 {currentCitizen.publicKeyEd25519}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="bg-[#071F4A] border border-amber-400/40 rounded-2xl p-8 text-center space-y-4">
                <h2 className="text-xl font-bold text-white">{t.anonymousVisitor}</h2>
                <p className="text-sm text-sky-200 max-w-2xl mx-auto">
                  {t.langSourceAnon}. Selecione um cidadão no menu superior para autenticar via Biometria NIST / SSO.
                </p>
              </section>
            )}

            {/* Single-Click Launchpad para os 4 Serviços Satélites */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white">{t.launchpadTitle}</h2>
                  <p className="text-xs sm:text-sm text-sky-200/80">{t.launchpadSubtitle}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  🔐 {t.ssoBadge}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleLaunchService('311')}
                  className="text-left bg-[#071F4A] hover:bg-[#092961] p-5 rounded-2xl border border-sky-400/30 shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#009EE0]/20 text-sky-300 border border-sky-400/40 flex items-center justify-center text-xl mb-3">
                    🏙️
                  </div>
                  <h3 className="font-bold text-white group-hover:text-amber-300">{t.nav311}</h3>
                  <p className="text-xs text-sky-200/80 mt-1">{t.service311Desc}</p>
                </button>

                <button
                  onClick={() => handleLaunchService('911')}
                  className="text-left bg-red-950/90 hover:bg-red-900 text-white p-5 rounded-2xl border-2 border-red-500/60 shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center text-xl mb-3 font-bold">
                    🚨
                  </div>
                  <h3 className="font-bold text-white">{t.nav911}</h3>
                  <p className="text-xs text-red-200 mt-1">{t.service911Desc}</p>
                </button>

                <button
                  onClick={() => handleLaunchService('health')}
                  className="text-left bg-[#071F4A] hover:bg-[#092961] p-5 rounded-2xl border border-emerald-400/30 shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center text-xl mb-3">
                    🩺
                  </div>
                  <h3 className="font-bold text-white group-hover:text-emerald-300">{t.navHealth}</h3>
                  <p className="text-xs text-sky-200/80 mt-1">{t.serviceHealthDesc}</p>
                </button>

                <button
                  onClick={() => handleLaunchService('education')}
                  className="text-left bg-[#071F4A] hover:bg-[#092961] p-5 rounded-2xl border border-amber-400/30 shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xl mb-3">
                    🎓
                  </div>
                  <h3 className="font-bold text-white group-hover:text-amber-300">{t.navEducation}</h3>
                  <p className="text-xs text-sky-200/80 mt-1">{t.serviceEduDesc}</p>
                </button>
              </div>
            </section>

            {/* Painel de Auditoria em Tempo Real (Últimas 48 Horas) */}
            <section className="bg-[#071F4A] rounded-2xl border border-sky-400/30 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-sky-400/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-white">🛡️ {t.auditPanelTitle}</h2>
                  <p className="text-xs sm:text-sm text-sky-200/80">{t.auditPanelSubtitle}</p>
                </div>
                <span className="font-mono text-xs bg-[#041434] text-amber-300 px-3 py-1.5 rounded-lg border border-amber-400/30">
                  GCP Project: novatlantis • Spanner Audit • {auditLogs.length} eventos (48h)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#041434] text-amber-300 border-b border-sky-400/20 uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">{t.auditAgency}</th>
                      <th className="py-3 px-4">{t.auditAgent}</th>
                      <th className="py-3 px-4">{t.auditPurpose}</th>
                      <th className="py-3 px-4">{t.auditTimestamp}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-400/15">
                    {auditLogs.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#082F72]/50">
                        <td className="py-3.5 px-4 font-semibold text-white">{entry.secretariat}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-sky-300">{entry.aiAgent}</td>
                        <td className="py-3.5 px-4 text-slate-200">
                          <div>{entry.purpose[activeLocale]}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.fieldsAccessed.map((f) => (
                              <span
                                key={f}
                                className="px-1.5 py-0.5 bg-[#041434] text-amber-300 border border-amber-400/30 rounded text-[10px] font-mono"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-sky-200/70 whitespace-nowrap">
                          <div className="text-white font-medium">{entry.relativeTime}</div>
                          <div>{entry.hash}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* -----------------------------------------------------------------
            VISÃO HERÁLDICA: BANDEIRA OFICIAL & BRASÃO DE ARMAS DE NOVATLANTIS
            ----------------------------------------------------------------- */}
        {activeModule === 'heraldry' && (
          <section className="space-y-8">
            <div className="bg-[#071F4A] border border-amber-400/40 rounded-2xl p-6 sm:p-8 shadow-xl">
              <span className="font-heraldic text-xs uppercase tracking-[0.25em] text-amber-300 block font-bold">
                NOVATLANTIS • LIBERTAS IN DIGITALI
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">{t.heraldryTitle}</h2>
              <p className="text-sm text-sky-200/90 mt-2 max-w-3xl">{t.heraldrySubtitle}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Card da Bandeira Oficial */}
                <div className="bg-[#041434] rounded-2xl p-6 border border-sky-400/30 flex flex-col justify-between space-y-4">
                  <div className="rounded-xl overflow-hidden border-2 border-amber-400/60 bg-slate-900 flex items-center justify-center p-3">
                    <img
                      src="/assets/flag-novatlantis.jpg"
                      alt="Bandeira Oficial de Novatlantis"
                      className="w-full max-h-72 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-display font-bold text-amber-300">{t.flagTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{t.flagDesc}</p>
                  </div>
                </div>

                {/* Card do Brasão de Armas Oficial */}
                <div className="bg-[#041434] rounded-2xl p-6 border border-amber-400/40 flex flex-col justify-between space-y-4">
                  <div className="rounded-xl overflow-hidden border-2 border-amber-400/60 bg-white flex items-center justify-center p-3">
                    <img
                      src="/assets/coat-of-arms-novatlantis.jpg"
                      alt="Brasão de Armas de Novatlantis"
                      className="w-full max-h-72 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-heraldic font-bold text-amber-300">{t.coatTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{t.coatDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -----------------------------------------------------------------
            VISÃO 2: APP 311 (SERVIÇOS URBANOS & ZELADORIA COM AGENTE LLM)
            ----------------------------------------------------------------- */}
        {activeModule === '311' && (
          <section className="bg-[#071F4A] rounded-2xl border border-sky-400/40 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-400/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">🏙️ {t.service311Title}</h2>
                <p className="text-sm text-sky-200">{t.service311Desc}</p>
              </div>
              <span className="font-mono text-xs bg-[#041434] text-sky-300 px-3 py-1.5 rounded-lg border border-sky-400/30">
                📍 GPS: {currentCitizen?.address.district ?? 'Distrito Tecnológico'} ({currentCitizen?.address.lat},{' '}
                {currentCitizen?.address.lng})
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                  Relato do Cidadão + Evidência Fotográfica Georreferenciada
                </label>
                <textarea
                  rows={4}
                  value={issue311Text}
                  onChange={(e) => setIssue311Text(e.target.value)}
                  placeholder={t.issueInputPlaceholder}
                  className="w-full rounded-xl bg-[#041434] border border-sky-400/40 text-white p-3.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleAnalyze311}
                  className="w-full py-3 px-4 rounded-xl bg-[#009EE0] hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                >
                  🤖 {t.analyze311Btn}
                </button>
              </div>

              {triage311Result && (
                <div className="bg-[#041434] text-white rounded-xl p-6 space-y-4 border border-amber-400/40">
                  <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
                    <span className="font-mono text-xs text-amber-300">PROTOCOLO: {triage311Result.protocol}</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-semibold">
                      {triage311Result.confidence}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-sky-200/70 block">{t.llmDepartment}</span>
                    <span className="text-base font-bold text-white">{triage311Result.department}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#082F72]/60 p-3 rounded-lg border border-sky-400/20">
                      <span className="text-xs text-sky-200/70 block">{t.llmSla}</span>
                      <span className="text-sm font-semibold text-emerald-300">{triage311Result.sla}</span>
                    </div>
                    <div className="bg-[#082F72]/60 p-3 rounded-lg border border-sky-400/20">
                      <span className="text-xs text-sky-200/70 block">{t.llmPriority}</span>
                      <span className="text-sm font-semibold text-amber-300">{triage311Result.priority}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* -----------------------------------------------------------------
            VISÃO 3: APP 911 (EMERGÊNCIA DE ALTO CONTRASTE & DESPACHO TÁTICO)
            ----------------------------------------------------------------- */}
        {activeModule === '911' && (
          <section className="bg-zinc-950 text-white rounded-2xl border-2 border-red-600 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-red-500 uppercase">🚨 {t.service911Title}</h2>
                <p className="text-sm text-zinc-300">{t.service911Desc}</p>
              </div>
              <button
                onClick={handleTrigger911SOS}
                className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-wide shadow-lg border-2 border-white cursor-pointer"
              >
                ⚡ {t.sosOneClickBtn}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-red-400">
                  Triagem Agêntica de Voz / Texto em Tempo Real
                </label>
                <textarea
                  rows={3}
                  value={emergency911Text}
                  onChange={(e) => setEmergency911Text(e.target.value)}
                  placeholder={t.triageInputPlaceholder}
                  className="w-full rounded-xl bg-zinc-900 border-2 border-zinc-700 text-white p-3.5 text-sm focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={handleTrigger911SOS}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase cursor-pointer"
                >
                  📡 {t.dispatchBtn}
                </button>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  🗺️ {t.unitDispatched} ({currentCitizen?.address.district ?? 'Distrito Tecnológico'})
                </h3>
                {dispatched911Units.map((u) => (
                  <div
                    key={u.code}
                    className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{u.code}</div>
                      <div className="text-xs text-zinc-400">{u.type}</div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-1">{u.status}</div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-zinc-400 block">ETA</span>
                      <span className="text-base font-black text-amber-400">{u.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* -----------------------------------------------------------------
            VISÃO 4: APP SAÚDE (TELEMEDICINA AGÊNTICA & PRESCRIÇÃO ED25519)
            ----------------------------------------------------------------- */}
        {activeModule === 'health' && (
          <section className="bg-[#071F4A] rounded-2xl border border-emerald-400/40 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-400/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">🩺 {t.serviceHealthTitle}</h2>
                <p className="text-sm text-sky-200">{t.serviceHealthDesc}</p>
              </div>
              <button
                onClick={handleGenerateTelemedRx}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer"
              >
                🎙️ {t.startTelemedBtn}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#041434] rounded-xl p-4 border border-sky-400/30 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">{t.liveTranscriptLabel}</h3>
                <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed">
                  [00:14] Médica: &quot;Olá {currentCitizen?.fullName ?? 'Cidadão'}, como está a recuperação?&quot;
                  <br />
                  [00:22] Paciente: &quot;Sem febre nas últimas 48h, apenas leve fadiga muscular.&quot;
                  <br />
                  [00:35] Médica: &quot;Sinais vitais normais na telemetria wearable (SpO2 99%, FC 68 bpm).&quot;
                </p>
              </div>

              <div className="bg-[#041434] rounded-xl p-4 border border-emerald-400/40 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">{t.aiSummaryLabel}</h3>
                <ul className="text-xs sm:text-sm text-slate-200 space-y-1.5">
                  <li>
                    <strong className="text-amber-300">Subjetivo (S):</strong> Paciente afebril há 48h, relata melhora
                    clínica progressiva.
                  </li>
                  <li>
                    <strong className="text-amber-300">Objetivo (O):</strong> Telemetria SpO2 99%, FC 68 bpm, PA 118/76
                    mmHg.
                  </li>
                  <li>
                    <strong className="text-amber-300">Avaliação (A):</strong> Convalescença viral sem complicações
                    respiratórias.
                  </li>
                  <li>
                    <strong className="text-amber-300">Plano (P):</strong> Hidratação, reposição eletrolítica e retorno
                    preventivo em 14 dias.
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950 text-white rounded-xl p-4 border border-amber-400/50 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">{t.digitalRxLabel}</h3>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div>ID: {telemedPrescriptionId}</div>
                  <div>PACIENTE: {currentCitizen?.nid ?? 'NID-100-0000-0019'}</div>
                  <div>PRESCRIÇÃO: Complexo Polivitamínico & Hidratação Oral 500ml 2x/dia</div>
                  <div className="text-emerald-300 pt-1 truncate">
                    ASSINATURA ED25519: {currentCitizen?.publicKeyEd25519}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -----------------------------------------------------------------
            VISÃO 5: APP EDUCAÇÃO (TUTORIA ADAPTATIVA POR FAIXA ETÁRIA)
            ----------------------------------------------------------------- */}
        {activeModule === 'education' && (
          <section className="bg-[#071F4A] rounded-2xl border border-amber-400/40 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-400/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">🎓 {t.serviceEduTitle}</h2>
                <p className="text-sm text-sky-200">{t.serviceEduDesc}</p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                Idade Cadastrada no NID: {currentCitizen?.ageYears ?? 34} anos
              </span>
            </div>

            <div className="bg-[#041434] text-white rounded-xl p-6 space-y-4 border border-sky-400/30">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 block">
                  {t.adaptiveTrackLabel}
                </span>
                <h3 className="text-lg font-bold mt-1">{educationPathway.stage}</h3>
                <p className="text-xs sm:text-sm text-sky-200 mt-1">{educationPathway.aiTutorNote}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {educationPathway.modules.map((mod, idx) => (
                  <div key={mod} className="bg-[#082F72]/60 border border-amber-400/30 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-mono text-amber-300">MÓDULO 0{idx + 1}</span>
                    <h4 className="font-semibold text-sm text-white">{mod}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
