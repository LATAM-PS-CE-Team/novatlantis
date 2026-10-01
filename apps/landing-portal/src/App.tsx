import React, { useState, useRef } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Button,
  TextField,
  Chip,
  Grid,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  Https as HttpsIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Mic as MicIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  LocalHospital as HealthIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  ReportProblem as UrbanIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  Launch as LaunchIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import {
  TopNavUserWidget,
  SupportedLanguage,
  resolveInitialLanguage
} from './components/TopNavUserWidget';

const CITIZEN_PORTAL_URL = 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app';
const GOV_BACKSTAGE_URL = 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app';

interface CitizenProfile {
  nid: string;
  full_name: string;
  email: string;
  age: number;
  gender: string;
  native_language: string;
  profession: string;
  specialty: string;
  iam_role: string;
  effective_role_code: string;
  role_title: string;
  ministry_label: string;
  backstage_allowed: boolean;
  allowed_modules: string[];
  district: string;
  tax_status: string;
  ubi_monthly_credits: number;
}

interface CitationItem {
  id: number;
  agency: string;
  title: string;
  url: string;
}

interface ServiceRequestAction {
  requires_auth: boolean;
  service_id: string;
  service_title: string;
  service_description: string;
  service_prompt: string;
  target_portal: string;
  target_tab: string;
}

interface OrchestrationStep {
  agent: string;
  step: string;
  status: string;
  latency_ms: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'orchestrator';
  text: string;
  timestamp: string;
  intent?: string;
  authenticated?: boolean;
  citations?: CitationItem[];
  service_request_action?: ServiceRequestAction | null;
  orchestration_steps?: OrchestrationStep[];
  action_card?: {
    type: string;
    title: string;
    reference_id: string;
    status: string;
    target_portal: string;
    target_url: string;
    details: Record<string, string>;
  } | null;
}

const americaGovTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0a2240',
      dark: '#051428',
      light: '#1e3a5f'
    },
    secondary: {
      main: '#b91c1c'
    },
    background: {
      default: '#fcfbf9',
      paper: '#ffffff'
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563'
    }
  },
  typography: {
    fontFamily: '"Public Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Merriweather", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontFamily: '"Merriweather", "Georgia", serif',
      fontWeight: 700,
      letterSpacing: '-0.02em'
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.015em'
    }
  },
  shape: {
    borderRadius: 12
  }
});

interface ServiceEntry {
  id: string;
  title: Record<SupportedLanguage, string>;
  agency: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  questionPrompt: Record<SupportedLanguage, string>;
  servicePrompt: Record<SupportedLanguage, string>;
  tab: string;
  icon: React.ReactNode;
}

const POPULAR_SERVICES: ServiceEntry[] = [
  {
    id: 'passport',
    title: {
      'pt-BR': 'Passaporte Digital ICAO & Vistos',
      'es-419': 'Pasaporte Digital OACI y Visas',
      'en-US': 'ICAO Digital Passport & Visas'
    },
    agency: {
      'pt-BR': 'Chancelaria Soberana & Suprema Corte',
      'es-419': 'Cancillería Soberana y Corte Suprema',
      'en-US': 'Sovereign Chancellery & Supreme Court'
    },
    description: {
      'pt-BR': 'Emissão e renovação instantânea com assinatura Ed25519 e liberação automática de e-Gate em 174 países.',
      'es-419': 'Emisión y renovación instantánea con firma Ed25519 y liberación automática de e-Gate en 174 países.',
      'en-US': 'Instant issuance and renewal with Ed25519 signature and automatic e-Gate clearance in 174 countries.'
    },
    questionPrompt: {
      'pt-BR': 'Como emitir ou renovar meu Passaporte Digital ICAO?',
      'es-419': '¿Cómo emitir o renovar mi Pasaporte Digital OACI?',
      'en-US': 'How do I issue or renew my ICAO Digital Passport?'
    },
    servicePrompt: {
      'pt-BR': 'Emitir e validar meu Passaporte Digital ICAO agora',
      'es-419': 'Emitir y validar mi Pasaporte Digital OACI ahora',
      'en-US': 'Issue and validate my ICAO Digital Passport now'
    },
    tab: 'treasury',
    icon: <PublicIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'company',
    title: {
      'pt-BR': 'Abrir Empresa em 45s & Dividendo UBI',
      'es-419': 'Abrir Empresa en 45s y Dividendo RBU',
      'en-US': 'Open a Company in 45s & UBI Dividend'
    },
    agency: {
      'pt-BR': 'Ministério do Tesouro & Economia Soberana',
      'es-419': 'Ministerio del Tesoro y Economía Soberana',
      'en-US': 'Ministry of the Treasury & Sovereign Economy'
    },
    description: {
      'pt-BR': 'Constituição imediata de empresa autônoma no Simples Agêntico (3%) com 250 TFLOPs de crédito computacional.',
      'es-419': 'Constitución inmediata de empresa autónoma en el Régimen Agéntico (3%) con 250 TFLOPs de crédito computacional.',
      'en-US': 'Instant incorporation of an autonomous enterprise under the Agentic Tax Regime (3%) with 250 TFLOPs compute grant.'
    },
    questionPrompt: {
      'pt-BR': 'Como abrir uma empresa autônoma em 45 segundos e como funciona o UBI?',
      'es-419': '¿Cómo abrir una empresa autónoma en 45 segundos y cómo funciona la RBU?',
      'en-US': 'How do I open an autonomous company in 45 seconds and how does UBI work?'
    },
    servicePrompt: {
      'pt-BR': 'Abrir empresa autônoma agora no Ministério do Tesouro',
      'es-419': 'Abrir empresa autónoma ahora en el Ministerio del Tesoro',
      'en-US': 'Open an autonomous company now at the Ministry of the Treasury'
    },
    tab: 'treasury',
    icon: <BusinessIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'health',
    title: {
      'pt-BR': 'Telemedicina 24/7 & Prontuário HL7',
      'es-419': 'Telemedicina 24/7 e Historia Clínica HL7',
      'en-US': '24/7 Telemedicine & HL7 Health Record'
    },
    agency: {
      'pt-BR': 'Ministério da Saúde & Rede Hospitalar',
      'es-419': 'Ministerio de Salud y Red Hospitalaria',
      'en-US': 'Ministry of Health & Hospital Network'
    },
    description: {
      'pt-BR': 'Consultas médicas por vídeo com triagem IA, histórico vacinal, tipo sanguíneo e prescrição digital.',
      'es-419': 'Consultas médicas por video con triaje IA, historial de vacunación, grupo sanguíneo y receta digital.',
      'en-US': 'Video medical consultations with AI triage, vaccination history, blood type, and digital prescription.'
    },
    questionPrompt: {
      'pt-BR': 'Como funciona o atendimento de Telemedicina 24/7 e o prontuário HL7 FHIR?',
      'es-419': '¿Cómo funciona la atención de Telemedicina 24/7 y la historia clínica HL7 FHIR?',
      'en-US': 'How do 24/7 Telemedicine and the HL7 FHIR health record work?'
    },
    servicePrompt: {
      'pt-BR': 'Agendar teleconsulta médica agora com resumo clínico HL7',
      'es-419': 'Programar teleconsulta médica ahora con resumen clínico HL7',
      'en-US': 'Schedule a medical teleconsultation now with HL7 clinical summary'
    },
    tab: 'health',
    icon: <HealthIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'education',
    title: {
      'pt-BR': 'Boletim Escolar & Tutoria Adaptativa IA',
      'es-419': 'Boletín Escolar y Tutoría Adaptativa IA',
      'en-US': 'School Report Card & Adaptive AI Tutoring'
    },
    agency: {
      'pt-BR': 'Ministério da Educação & Escolas Soberanas',
      'es-419': 'Ministerio de Educación y Escuelas Soberanas',
      'en-US': 'Ministry of Education & Sovereign Schools'
    },
    description: {
      'pt-BR': 'Acompanhamento de notas em Matemática, Ciências e IA & Robótica, frequência escolar e tutoria personalizada.',
      'es-419': 'Seguimiento de calificaciones en Matemáticas, Ciencias e IA y Robótica, asistencia escolar y tutoría personalizada.',
      'en-US': 'Grade tracking in Mathematics, Sciences, and AI & Robotics, school attendance, and personalized tutoring.'
    },
    questionPrompt: {
      'pt-BR': 'Como consultar o boletim escolar e frequência dos meus filhos?',
      'es-419': '¿Cómo consultar el boletín escolar y la asistencia de mis hijos?',
      'en-US': 'How can I check my children’s school report card and attendance?'
    },
    servicePrompt: {
      'pt-BR': 'Consultar boletim escolar e frequência no Ministério da Educação',
      'es-419': 'Consultar boletín escolar y asistencia en el Ministerio de Educación',
      'en-US': 'Check school report card and attendance at the Ministry of Education'
    },
    tab: 'education',
    icon: <SchoolIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'urban_311',
    title: {
      'pt-BR': 'Zeladoria Urbana 311',
      'es-419': 'Mantenimiento Urbano 311',
      'en-US': '311 Urban Maintenance'
    },
    agency: {
      'pt-BR': 'Secretaria de Zeladoria & Infraestrutura Urbana',
      'es-419': 'Secretaría de Mantenimiento e Infraestructura Urbana',
      'en-US': 'Department of Urban Maintenance & Infrastructure'
    },
    description: {
      'pt-BR': 'Solicitação de reparos de iluminação pública, vias, pavimentação e saneamento com triagem IA (SLA 6h).',
      'es-419': 'Solicitud de reparaciones de alumbrado público, vías, pavimentación y saneamiento con triaje IA (SLA 6h).',
      'en-US': 'Request street lighting, road, paving, and sanitation repairs with AI triage (6h SLA).'
    },
    questionPrompt: {
      'pt-BR': 'Como abrir um chamado urbano 311 no meu distrito?',
      'es-419': '¿Cómo abrir un reporte urbano 311 en mi distrito?',
      'en-US': 'How do I open a 311 urban service ticket in my district?'
    },
    servicePrompt: {
      'pt-BR': 'Abrir chamado 311 para reparo de iluminação e zeladoria no meu distrito',
      'es-419': 'Abrir reporte 311 para reparación de alumbrado y mantenimiento en mi distrito',
      'en-US': 'Open a 311 ticket for lighting repair and urban maintenance in my district'
    },
    tab: 'urban_311',
    icon: <UrbanIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'emergency_911',
    title: {
      'pt-BR': 'Emergência 911 (SOS Tático & Médico)',
      'es-419': 'Emergencia 911 (SOS Táctico y Médico)',
      'en-US': '911 Emergency (Tactical & Medical SOS)'
    },
    agency: {
      'pt-BR': 'Central Nacional de Despacho de Emergências 911',
      'es-419': 'Central Nacional de Despacho de Emergencias 911',
      'en-US': 'National 911 Emergency Dispatch Center'
    },
    description: {
      'pt-BR': 'Acionamento imediato de viaturas e ambulâncias com cruzamento automático de Prontuário HL7 e contato familiar.',
      'es-419': 'Despacho inmediato de patrullas y ambulancias con cruce automático de Historia Clínica HL7 y contacto familiar.',
      'en-US': 'Immediate dispatch of patrol units and ambulances with automatic HL7 health record and family contact lookup.'
    },
    questionPrompt: {
      'pt-BR': 'Como funciona o despacho de Emergência 911 com prontuário HL7?',
      'es-419': '¿Cómo funciona el despacho de Emergencia 911 con historia clínica HL7?',
      'en-US': 'How does 911 Emergency dispatch with HL7 health records work?'
    },
    servicePrompt: {
      'pt-BR': 'Acionar protocolo de Emergência 911 com suporte médico HL7',
      'es-419': 'Activar protocolo de Emergencia 911 con soporte médico HL7',
      'en-US': 'Trigger 911 Emergency protocol with HL7 medical support'
    },
    tab: 'emergency_911',
    icon: <ShieldIcon sx={{ color: '#b91c1c' }} />
  },
  {
    id: 'identity',
    title: {
      'pt-BR': 'Carteira Digital NID & Árvore Familiar',
      'es-419': 'Credencial Digital NID y Árbol Familiar',
      'en-US': 'NID Digital Wallet & Family Tree'
    },
    agency: {
      'pt-BR': 'Autoridade Nacional de Identidade 360',
      'es-419': 'Autoridad Nacional de Identidad 360',
      'en-US': 'National Identity 360 Authority'
    },
    description: {
      'pt-BR': 'Credencial soberana com biometria NIST, vínculo familiar somente leitura e permissões RBAC de Estado.',
      'es-419': 'Credencial soberana con biometría NIST, vínculo familiar de solo lectura y permisos RBAC de Estado.',
      'en-US': 'Sovereign credential with NIST biometrics, read-only family graph, and state RBAC permissions.'
    },
    questionPrompt: {
      'pt-BR': 'Como funciona a Identidade Soberana NID e o acesso ao Backstage?',
      'es-419': '¿Cómo funciona la Identidad Soberana NID y el acceso al Backstage?',
      'en-US': 'How do the NID Sovereign Identity and Backstage access work?'
    },
    servicePrompt: {
      'pt-BR': 'Consultar minha Carteira Digital NID e vínculos familiares',
      'es-419': 'Consultar mi Credencial Digital NID y vínculos familiares',
      'en-US': 'Check my NID Digital Wallet and family relationships'
    },
    tab: 'identity',
    icon: <BadgeIcon sx={{ color: '#0a2240' }} />
  }
];

const LANDING_I18N: Record<
  SupportedLanguage,
  {
    officialBanner: string;
    howToVerify: string;
    verifyTitle1: string;
    verifyDesc1: string;
    verifyTitle2: string;
    verifyDesc2: string;
    govTitle: string;
    portalBadge: string;
    govSubtitle: string;
    drawerSubtitle: string;
    drawerOfficialEnvs: string;
    citizenPortalLabel: string;
    citizenPortalSubAuth: string;
    citizenPortalSubAnon: string;
    backstageLabel: string;
    backstageSub: string;
    drawerAskConcierge: string;
    drawerLanguageTitle: string;
    heroChipAuth: string;
    heroChipAnon: string;
    heroGreetingPrefix: string;
    heroGreetingAnon: string;
    heroSubheading: string;
    promptPlaceholder: string;
    simplifyFormBtn: string;
    simplifyFormPrompt: string;
    chatStatusAuth: string;
    chatStatusAnon: string;
    askBtn: string;
    askingBtn: string;
    pills: string[];
    conciergeHeader: string;
    clearChat: string;
    officialCitations: string;
    trackInCitizenPortal: string;
    executeServiceNow: string;
    requestServiceLogin: string;
    directoryOverline: string;
    directoryHeading: string;
    askQuestionBtn: string;
    requestServiceBtn: string;
    footerSubtitle: string;
    footerRight1: string;
    footerRight2: string;
  }
> = {
  'pt-BR': {
    officialBanner: 'Um site oficial do Governo da República Digital de Novatlantis',
    howToVerify: 'Saiba como verificar',
    verifyTitle1: 'Portais oficiais utilizam infraestrutura soberana no Google Cloud (Project: novatlantis)',
    verifyDesc1: 'Conectado diretamente ao cluster AlloyDB novatlantis-sovereign-cluster e ao Data Lakehouse governamental.',
    verifyTitle2: 'Perguntas públicas abertas e autenticação exigida apenas na solicitação de serviços',
    verifyDesc2: 'Qualquer cidadão ou visitante pode consultar informações no Concierge IA sem login. A assinatura NID é solicitada somente ao executar um serviço oficial.',
    govTitle: 'Governo da República de Novatlantis',
    portalBadge: 'Portal Principal da Nação',
    govSubtitle: 'Chancelaria Digital • Agente Orquestrador de Estado • Módulo de Usuários GDF (100.000 Cidadãos)',
    drawerSubtitle: 'Diretório Nacional de Serviços',
    drawerOfficialEnvs: 'AMBIENTES OFICIAIS DO ESTADO',
    citizenPortalLabel: 'Portal do Cidadão',
    citizenPortalSubAuth: 'Autenticado',
    citizenPortalSubAnon: 'Requer login NID ao acessar',
    backstageLabel: 'Backstage Governamental',
    backstageSub: 'Servidores Públicos, Médicos, Professores e PM',
    drawerAskConcierge: 'PERGUNTAR AO CONCIERGE (SEM LOGIN)',
    drawerLanguageTitle: 'IDIOMA OFICIAL DA REPÚBLICA (I18N)',
    heroChipAuth: 'SESSÃO AUTENTICADA',
    heroChipAnon: 'PORTA DE ENTRADA DIGITAL DA NAÇÃO • PERGUNTE SEM PRECISAR DE LOGIN',
    heroGreetingPrefix: 'Olá',
    heroGreetingAnon: 'Olá, Novatlantis.',
    heroSubheading: 'Tudo o que você precisa do governo, comece por aqui.',
    promptPlaceholder: 'Pergunte qualquer coisa sobre serviços públicos, passaporte, saúde, educação, impostos ou abertura de empresas...',
    simplifyFormBtn: 'Simplificar Formulário / Regra Oficial',
    simplifyFormPrompt: 'Explique em linguagem simples os requisitos e documentos para emitir o Passaporte Digital ICAO e abrir uma empresa em 45 segundos.',
    chatStatusAuth: 'Logado',
    chatStatusAnon: 'Chat Público Livre (Login só ao solicitar serviço)',
    askBtn: 'Perguntar',
    askingBtn: 'Consultando...',
    pills: [
      'Como emitir meu Passaporte Digital ICAO?',
      'Como abrir uma empresa em 45 segundos?',
      'Como agendar teleconsulta médica 24/7?',
      'Como consultar o boletim escolar dos meus filhos?',
      'Como abrir um chamado urbano 311?',
      'Como funciona o acesso ao Backstage Governamental?'
    ],
    conciergeHeader: 'CONCIERGE OFICIAL DA REPÚBLICA DE NOVATLANTIS',
    clearChat: 'Limpar conversa',
    officialCitations: 'FONTES OFICIAIS & LEGISLAÇÃO CITADA:',
    trackInCitizenPortal: 'Acompanhar no Portal do Cidadão',
    executeServiceNow: 'Executar Serviço Agora',
    requestServiceLogin: 'Solicitar Serviço (Fazer Login NID)',
    directoryOverline: 'SERVIÇOS PÚBLICOS DIGITAIS • REPÚBLICA DE NOVATLANTIS',
    directoryHeading: 'Serviços mais procurados pelos cidadãos',
    askQuestionBtn: 'Tirar Dúvida',
    requestServiceBtn: 'Solicitar Serviço',
    footerSubtitle: 'Um portal desenhado para servir ao cidadão • AlloyDB + Government Data Platform',
    footerRight1: 'Projeto GCP: novatlantis • Base Soberana: 100.000 Cidadãos',
    footerRight2: 'Autenticação Zero-Trust • Perguntas Públicas sem Login • Transações Assinadas com NID'
  },
  'es-419': {
    officialBanner: 'Un sitio oficial del Gobierno de la República Digital de Novatlantis',
    howToVerify: 'Así es como puede verificarlo',
    verifyTitle1: 'Los portales oficiales utilizan infraestructura soberana en Google Cloud (Project: novatlantis)',
    verifyDesc1: 'Conectado directamente al clúster AlloyDB novatlantis-sovereign-cluster y al Data Lakehouse gubernamental.',
    verifyTitle2: 'Preguntas públicas abiertas y autenticación requerida solo al solicitar servicios',
    verifyDesc2: 'Cualquier ciudadano o visitante puede consultar información en el Concierge IA sin iniciar sesión. La firma NID se solicita únicamente al ejecutar un servicio oficial.',
    govTitle: 'Gobierno de la República de Novatlantis',
    portalBadge: 'Portal Principal de la Nación',
    govSubtitle: 'Cancillería Digital • Agente Orquestador de Estado • Módulo de Usuarios GDF (100.000 Ciudadanos)',
    drawerSubtitle: 'Directorio Nacional de Servicios',
    drawerOfficialEnvs: 'AMBIENTES OFICIALES DEL ESTADO',
    citizenPortalLabel: 'Portal del Ciudadano',
    citizenPortalSubAuth: 'Autenticado',
    citizenPortalSubAnon: 'Requiere ingreso con NID al acceder',
    backstageLabel: 'Backstage Gubernamental',
    backstageSub: 'Servidores Públicos, Médicos, Profesores y PM',
    drawerAskConcierge: 'PREGUNTAR AL CONCIERGE (SIN LOGIN)',
    drawerLanguageTitle: 'IDIOMA OFICIAL DE LA REPÚBLICA (I18N)',
    heroChipAuth: 'SESIÓN AUTENTICADA',
    heroChipAnon: 'PUERTA DE ENTRADA DIGITAL DE LA NACIÓN • PREGUNTE SIN NECESIDAD DE LOGIN',
    heroGreetingPrefix: 'Hola',
    heroGreetingAnon: 'Hola, Novatlantis.',
    heroSubheading: 'Todo lo que necesitas del gobierno, empieza por aquí.',
    promptPlaceholder: 'Pregunte cualquier cosa sobre servicios públicos, pasaporte, salud, educación, impuestos o apertura de empresas...',
    simplifyFormBtn: 'Simplificar Formulario / Norma Oficial',
    simplifyFormPrompt: 'Explique en lenguaje sencillo los requisitos y documentos para emitir el Pasaporte Digital OACI y abrir una empresa en 45 segundos.',
    chatStatusAuth: 'Autenticado',
    chatStatusAnon: 'Chat Público Libre (Login solo al solicitar servicio)',
    askBtn: 'Preguntar',
    askingBtn: 'Consultando...',
    pills: [
      '¿Cómo emitir mi Pasaporte Digital OACI?',
      '¿Cómo abrir una empresa en 45 segundos?',
      '¿Cómo programar teleconsulta médica 24/7?',
      '¿Cómo consultar el boletín escolar de mis hijos?',
      '¿Cómo abrir un reporte urbano 311?',
      '¿Cómo funciona el acceso al Backstage Gubernamental?'
    ],
    conciergeHeader: 'CONCIERGE OFICIAL DE LA REPÚBLICA DE NOVATLANTIS',
    clearChat: 'Limpiar conversación',
    officialCitations: 'FUENTES OFICIALES Y LEGISLACIÓN CITADA:',
    trackInCitizenPortal: 'Seguir en el Portal del Ciudadano',
    executeServiceNow: 'Ejecutar Servicio Ahora',
    requestServiceLogin: 'Solicitar Servicio (Ingresar con NID)',
    directoryOverline: 'SERVICIOS PÚBLICOS DIGITALES • REPÚBLICA DE NOVATLANTIS',
    directoryHeading: 'Servicios más solicitados por los ciudadanos',
    askQuestionBtn: 'Consultar Duda',
    requestServiceBtn: 'Solicitar Servicio',
    footerSubtitle: 'Un portal diseñado para servir al ciudadano • AlloyDB + Government Data Platform',
    footerRight1: 'Proyecto GCP: novatlantis • Base Soberana: 100.000 Ciudadanos',
    footerRight2: 'Autenticación Zero-Trust • Consultas Públicas sin Login • Transacciones Firmadas con NID'
  },
  'en-US': {
    officialBanner: 'An official website of the Government of the Digital Republic of Novatlantis',
    howToVerify: 'Here’s how you know',
    verifyTitle1: 'Official portals use sovereign infrastructure on Google Cloud (Project: novatlantis)',
    verifyDesc1: 'Directly connected to the AlloyDB cluster novatlantis-sovereign-cluster and the Government Data Lakehouse.',
    verifyTitle2: 'Open public questions and authentication required only when requesting services',
    verifyDesc2: 'Any citizen or visitor can ask questions in the AI Concierge without signing in. NID authentication is requested only when executing an official service.',
    govTitle: 'Government of the Republic of Novatlantis',
    portalBadge: 'Main National Portal',
    govSubtitle: 'Digital Chancellery • State Orchestrator Agent • GDF User Module (100,000 Citizens)',
    drawerSubtitle: 'National Directory of Services',
    drawerOfficialEnvs: 'OFFICIAL STATE ENVIRONMENTS',
    citizenPortalLabel: 'Citizen Portal',
    citizenPortalSubAuth: 'Authenticated',
    citizenPortalSubAnon: 'Requires NID sign-in upon access',
    backstageLabel: 'Government Backstage',
    backstageSub: 'Civil Servants, Physicians, Teachers & PM',
    drawerAskConcierge: 'ASK THE CONCIERGE (NO LOGIN REQUIRED)',
    drawerLanguageTitle: 'OFFICIAL REPUBLIC LANGUAGE (I18N)',
    heroChipAuth: 'AUTHENTICATED SESSION',
    heroChipAnon: 'DIGITAL FRONT DOOR OF THE NATION • ASK WITHOUT SIGNING IN',
    heroGreetingPrefix: 'Hello',
    heroGreetingAnon: 'Hello, Novatlantis.',
    heroSubheading: 'Whatever you need from government, start here.',
    promptPlaceholder: 'Ask anything about public services, passports, healthcare, education, taxes, or starting a business...',
    simplifyFormBtn: 'Simplify Official Form / Rule',
    simplifyFormPrompt: 'Explain in plain language the requirements and documents to issue the ICAO Digital Passport and open a business in 45 seconds.',
    chatStatusAuth: 'Signed in',
    chatStatusAnon: 'Free Public Chat (Sign-in only when requesting a service)',
    askBtn: 'Ask',
    askingBtn: 'Asking...',
    pills: [
      'How do I issue my ICAO Digital Passport?',
      'How do I open a business in 45 seconds?',
      'How do I schedule a 24/7 medical teleconsultation?',
      'How can I check my children’s school report card?',
      'How do I open a 311 urban service ticket?',
      'How does Government Backstage access work?'
    ],
    conciergeHeader: 'OFFICIAL CONCIERGE OF THE REPUBLIC OF NOVATLANTIS',
    clearChat: 'Clear conversation',
    officialCitations: 'OFFICIAL SOURCES & CITED LEGISLATION:',
    trackInCitizenPortal: 'Track in Citizen Portal',
    executeServiceNow: 'Execute Service Now',
    requestServiceLogin: 'Request Service (Sign in with NID)',
    directoryOverline: 'DIGITAL PUBLIC SERVICES • REPUBLIC OF NOVATLANTIS',
    directoryHeading: 'Most requested citizen services',
    askQuestionBtn: 'Ask Question',
    requestServiceBtn: 'Request Service',
    footerSubtitle: 'A portal designed to serve the citizen • AlloyDB + Government Data Platform',
    footerRight1: 'GCP Project: novatlantis • Sovereign Base: 100,000 Citizens',
    footerRight2: 'Zero-Trust Auth • Public Questions without Sign-in • NID-Signed Transactions'
  }
};

export function App() {
  const [lang, setLang] = useState<SupportedLanguage>(() => resolveInitialLanguage());
  const t = LANDING_I18N[lang] || LANDING_I18N['pt-BR'];

  // IMPORTANTE: Nenhum usuário inicia logado por padrão (currentUser = null)
  const [currentUser, setCurrentUser] = useState<CitizenProfile | null>(null);
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [govBannerOpen, setGovBannerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  // Trigger externo para abrir o modal de login apenas quando o usuário solicitar um serviço
  const [loginTriggerCount, setLoginTriggerCount] = useState(0);
  const [loginReasonMessage, setLoginReasonMessage] = useState<string | null>(null);
  const pendingServicePromptRef = useRef<string | null>(null);

  // Estado do Concierge AI (america.gov Prompt & Conversation Stream)
  const [promptInput, setPromptInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatSectionRef = useRef<HTMLDivElement | null>(null);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('novatlantis_lang', newLang);
    }
  };

  const loadFullCitizenContext = async (nidOrEmail: string): Promise<CitizenProfile | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: nidOrEmail })
      });
      if (!res.ok) return null;
      const data = await res.json();
      setCurrentUser(data.citizen);
      return data.citizen;
    } catch {
      return null;
    }
  };

  const sendToConcierge = async (messageText: string, explicitNid?: string | null) => {
    const cleanMsg = messageText.trim();
    if (!cleanMsg) return;

    const effectiveNid = explicitNid !== undefined ? explicitNid : currentUser?.nid || null;

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: cleanMsg,
      timestamp: new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setChatLoading(true);

    setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);

    try {
      const res = await fetch('/api/orchestrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nid: effectiveNid,
          message: cleanMsg,
          lang
        })
      });
      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: data.message_id || `AGT-${Date.now()}`,
        sender: 'orchestrator',
        text: data.reply || 'Orientação governamental processada.',
        timestamp: new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        authenticated: Boolean(data.authenticated),
        citations: data.citations || [],
        service_request_action: data.service_request_action || null,
        orchestration_steps: data.orchestration_steps || [],
        action_card: data.action_card || null
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch {
      // ignore network error
    } finally {
      setChatLoading(false);
    }
  };

  const handleRequestService = (servicePrompt: string, serviceTitle: string) => {
    if (!currentUser) {
      pendingServicePromptRef.current = servicePrompt;
      setLoginReasonMessage(
        lang === 'es-419'
          ? `Autenticación requerida para solicitar el servicio: "${serviceTitle}". Tras ingresar con su NID, su solicitud se ejecutará automáticamente.`
          : lang === 'en-US'
          ? `Authentication required to request the service: "${serviceTitle}". After signing in with your NID, your request will be executed automatically.`
          : `Autenticação necessária para solicitar o serviço: "${serviceTitle}". Após entrar com seu NID, sua solicitação será executada automaticamente.`
      );
      setLoginTriggerCount((prev) => prev + 1);
      return;
    }

    sendToConcierge(servicePrompt, currentUser.nid);
  };

  const buildCrossPortalUrl = (baseUrl: string, tab?: string) => {
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    if (ssoToken) params.set('sso_token', ssoToken);
    if (lang) params.set('lang', lang);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const handleNavigateToPortal = (targetPortal: 'citizen' | 'backstage', tab?: string) => {
    if (!currentUser) {
      setLoginReasonMessage(
        targetPortal === 'backstage'
          ? lang === 'es-419'
            ? 'Para acceder al Backstage Gubernamental, autentíquese con una credencial de Servidor Público / Identidad 360.'
            : lang === 'en-US'
            ? 'To access the Government Backstage, sign in with a Civil Servant / Identity 360 credential.'
            : 'Para acessar o Backstage Governamental, autentique-se com uma credencial de Servidor Público / Identidade 360.'
          : lang === 'es-419'
          ? 'Para acceder a sus servicios personales en el Portal del Ciudadano, inicie sesión con su NID.'
          : lang === 'en-US'
          ? 'To access your personal services in the Citizen Portal, sign in with your NID.'
          : 'Para acessar seus serviços pessoais no Portal do Cidadão, faça login com seu NID.'
      );
      setLoginTriggerCount((prev) => prev + 1);
      return;
    }
    const base = targetPortal === 'backstage' ? GOV_BACKSTAGE_URL : CITIZEN_PORTAL_URL;
    window.location.href = buildCrossPortalUrl(base, tab);
  };

  return (
    <ThemeProvider theme={americaGovTheme}>
      <CssBaseline />

      {/* 1. FAIXA OFICIAL SUPERIOR (Estilo USWDS / america.gov) */}
      <Box sx={{ bgcolor: '#f1f0ec', borderBottom: '1px solid #e2e0d8', py: 0.65, px: 2 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                component="img"
                src="/assets/flag.jpg"
                alt="Bandeira Oficial de Novatlantis"
                sx={{ width: 20, height: 13, objectFit: 'cover', borderRadius: 0.5, border: '1px solid #cbd5e1' }}
              />
              <Typography variant="caption" sx={{ color: '#1f2937', fontWeight: 600, fontSize: '0.76rem' }}>
                {t.officialBanner}
              </Typography>
              <Button
                size="small"
                onClick={() => setGovBannerOpen(!govBannerOpen)}
                endIcon={govBannerOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                sx={{
                  fontSize: '0.74rem',
                  py: 0,
                  px: 0.75,
                  minHeight: 20,
                  textTransform: 'none',
                  color: '#0a2240',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                {t.howToVerify}
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: '#4b5563', fontSize: '0.72rem', display: { xs: 'none', md: 'block' } }}
            >
              National Design Studio • AlloyDB PostgreSQL 15 • i18n ({lang})
            </Typography>
          </Box>

          <Collapse in={govBannerOpen}>
            <Grid container spacing={2} sx={{ pt: 1.5, pb: 1, mt: 0.5, borderTop: '1px solid #e2e0d8' }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <AccountBalanceIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#111827' }}>
                      {t.verifyTitle1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.verifyDesc1}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <HttpsIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#111827' }}>
                      {t.verifyTitle2}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.verifyDesc2}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Container>
      </Box>

      {/* 2. CABEÇALHO INSTITUCIONAL (Estilo america.gov com Menu Hambúrguer ☰ + Título Ampliado + Seletor de Idiomas PT/ES/EN + Status do Usuário) */}
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'rgba(252, 251, 249, 0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e5e4dc'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.5, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            {/* Esquerda: Botão Hambúrguer (☰) + Brasão + Título Institucional Ampliado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setNavDrawerOpen((prev) => !prev)}
                sx={{
                  border: '1px solid #d1d5db',
                  borderRadius: 2,
                  p: 1,
                  color: '#0a2240',
                  bgcolor: navDrawerOpen ? '#e2e8f0' : '#ffffff',
                  '&:hover': { bgcolor: '#f3f4f6', borderColor: '#0a2240' }
                }}
                aria-label="Alternar Navigation Drawer da Nação"
              >
                <MenuIcon />
              </IconButton>

              <Box
                component="img"
                src="/assets/coat_of_arms.jpg"
                alt="Brasão da República de Novatlantis"
                sx={{
                  width: { xs: 44, md: 56 },
                  height: { xs: 44, md: 56 },
                  borderRadius: 2,
                  objectFit: 'cover',
                  border: '1.5px solid #0a2240'
                }}
              />

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: '#0a2240',
                      fontSize: { xs: '1.15rem', sm: '1.45rem', md: '1.75rem' },
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {t.govTitle}
                  </Typography>
                  <Chip
                    label={t.portalBadge}
                    size="small"
                    sx={{
                      bgcolor: '#0a2240',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      height: 26
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: { xs: '0.78rem', sm: '0.92rem', md: '1.04rem' },
                    mt: 0.35,
                    lineHeight: 1.3
                  }}
                >
                  {t.govSubtitle}
                </Typography>
              </Box>
            </Box>

            {/* Direita: Seletor de Idiomas (PT / ES / EN) + Status do Usuário com Foto / Login NID */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TopNavUserWidget
                lang={lang}
                onLanguageChange={handleLanguageChange}
                currentNid={currentUser?.nid}
                openLoginTrigger={loginTriggerCount}
                loginReasonMessage={loginReasonMessage}
                citizenPortalUrl={CITIZEN_PORTAL_URL}
                govBackstageUrl={GOV_BACKSTAGE_URL}
                onUserAuthenticated={async (nid, _authProfile, token) => {
                  if (token) setSsoToken(token);
                  const loadedProfile = await loadFullCitizenContext(nid);
                  if (pendingServicePromptRef.current && loadedProfile) {
                    const pendingPrompt = pendingServicePromptRef.current;
                    pendingServicePromptRef.current = null;
                    setLoginReasonMessage(null);
                    sendToConcierge(pendingPrompt, loadedProfile.nid);
                  }
                }}
                onUserLoggedOut={() => {
                  setCurrentUser(null);
                  setSsoToken(null);
                  pendingServicePromptRef.current = null;
                }}
              />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* LAYOUT FLEX PRINCIPAL: NAVIGATION DRAWER PERSISTENTE (GOOGLE MATERIAL DESIGN SIDEBAR) + CONTEÚDO DA PÁGINA */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 110px)' }}>
        <Box
          component="aside"
          sx={{
            width: navDrawerOpen ? { xs: 290, sm: 340 } : 0,
            flexShrink: 0,
            bgcolor: '#fcfbf9',
            borderRight: navDrawerOpen ? '1px solid #e5e4dc' : 'none',
            transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            overflowY: navDrawerOpen ? 'auto' : 'hidden'
          }}
        >
          <Box sx={{ minWidth: 290 }}>
            <Box sx={{ p: 2.5, bgcolor: '#0a2240', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {t.govTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                  {t.drawerSubtitle}
                </Typography>
              </Box>
              <IconButton onClick={() => setNavDrawerOpen(false)} sx={{ color: '#ffffff' }} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Seletor de Idiomas também dentro do Navigation Drawer */}
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f1f0ec', borderBottom: '1px solid #e5e4dc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LanguageIcon sx={{ fontSize: 16, color: '#0a2240' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0a2240', letterSpacing: '0.05em' }}>
                  {t.drawerLanguageTitle}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(
                  [
                    { code: 'pt-BR', label: 'Português' },
                    { code: 'es-419', label: 'Español' },
                    { code: 'en-US', label: 'English' }
                  ] as { code: SupportedLanguage; label: string }[]
                ).map((l) => (
                  <Button
                    key={l.code}
                    size="small"
                    variant={lang === l.code ? 'contained' : 'outlined'}
                    onClick={() => handleLanguageChange(l.code)}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      bgcolor: lang === l.code ? '#0a2240' : '#ffffff',
                      color: lang === l.code ? '#ffffff' : '#0a2240',
                      borderColor: '#cbd5e1'
                    }}
                  >
                    {l.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <List sx={{ py: 1.5 }}>
              <Box sx={{ px: 2.5, py: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.06em' }}>
                  {t.drawerOfficialEnvs}
                </Typography>
              </Box>

              <ListItemButton
                onClick={() => {
                  handleNavigateToPortal('citizen', 'identity');
                }}
              >
                <ListItemIcon>
                  <BadgeIcon sx={{ color: '#0a2240' }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.citizenPortalLabel}
                  secondary={currentUser ? `${t.citizenPortalSubAuth}: ${currentUser.nid}` : t.citizenPortalSubAnon}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  handleNavigateToPortal('citizen', 'urban_311');
                }}
              >
                <ListItemIcon>
                  <UrbanIcon sx={{ color: '#0a2240' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Módulo Zeladoria Urbana 311"
                  secondary="Reparos urbanos, vias e iluminação"
                  primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem' }}
                />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  handleNavigateToPortal('citizen', 'emergency_911');
                }}
              >
                <ListItemIcon>
                  <ShieldIcon sx={{ color: '#b91c1c' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Módulo Emergência 911 (SOS)"
                  secondary="Despacho imediato com prontuário HL7"
                  primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}
                />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  handleNavigateToPortal('backstage');
                }}
              >
                <ListItemIcon>
                  <AdminIcon sx={{ color: '#0f766e' }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.backstageLabel}
                  secondary={t.backstageSub}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ px: 2.5, py: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.06em' }}>
                  {t.drawerAskConcierge}
                </Typography>
              </Box>

              {POPULAR_SERVICES.map((srv) => (
                <ListItemButton
                  key={srv.id}
                  onClick={() => {
                    sendToConcierge(srv.questionPrompt[lang]);
                  }}
                >
                  <ListItemIcon>{srv.icon}</ListItemIcon>
                  <ListItemText
                    primary={srv.title[lang]}
                    secondary={srv.agency[lang]}
                    primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.73rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 3. HERO PRINCIPAL INSPIRADO EM HTTPS://AMERICA.GOV/ ("Whatever you need from government, start here") */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 9 },
          pb: { xs: 6, md: 8 },
          background:
            'radial-gradient(circle at 50% 0%, rgba(10, 34, 64, 0.06) 0%, rgba(252, 251, 249, 0) 70%)'
        }}
      >
        <Container maxWidth="md">
          {/* Saudação Editorial Centralizada estilo america.gov */}
          <Box sx={{ textAlign: 'center', mb: 4.5 }}>
            <Chip
              icon={<SparkleIcon sx={{ fontSize: '15px !important', color: '#0a2240 !important' }} />}
              label={
                currentUser
                  ? `${t.heroChipAuth} • ${currentUser.full_name.toUpperCase()} (${currentUser.nid})`
                  : t.heroChipAnon
              }
              sx={{
                mb: 2.5,
                px: 1,
                bgcolor: '#eef2f6',
                color: '#0a2240',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                border: '1px solid #cbd5e1'
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.25rem', sm: '3rem', md: '3.6rem' },
                color: '#0a2240',
                mb: 1.5,
                lineHeight: 1.12
              }}
            >
              {currentUser ? `${t.heroGreetingPrefix}, ${currentUser.full_name.split(' ')[0]}.` : t.heroGreetingAnon}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 400,
                color: '#374151',
                fontSize: { xs: '1.15rem', md: '1.45rem' },
                maxWidth: 680,
                mx: 'auto',
                lineHeight: 1.45
              }}
            >
              {t.heroSubheading}
            </Typography>
          </Box>

          {/* CAIXA DE DIÁLOGO CENTRAL DO CONCIERGE IA (america.gov Prompt Box) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 4,
              bgcolor: '#ffffff',
              border: '1.5px solid #d1d5db',
              boxShadow: '0 16px 40px -12px rgba(10, 34, 64, 0.10)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              '&:focus-within': {
                borderColor: '#0a2240',
                boxShadow: '0 20px 48px -12px rgba(10, 34, 64, 0.16)'
              }
            }}
          >
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                sendToConcierge(promptInput);
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                variant="standard"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendToConcierge(promptInput);
                  }
                }}
                placeholder={t.promptPlaceholder}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: '1.02rem', md: '1.14rem' },
                    color: '#111827',
                    lineHeight: 1.5,
                    px: 1,
                    py: 0.5
                  }
                }}
              />

              <Divider sx={{ my: 1.5, borderColor: '#f3f4f6' }} />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                {/* Botões utilitários estilo america.gov */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DescriptionIcon fontSize="small" />}
                    onClick={() => sendToConcierge(t.simplifyFormPrompt)}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      borderColor: '#e5e7eb',
                      color: '#374151',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      px: 1.5,
                      '&:hover': { borderColor: '#0a2240', bgcolor: '#f9fafb' }
                    }}
                  >
                    {t.simplifyFormBtn}
                  </Button>

                  <Chip
                    size="small"
                    icon={
                      currentUser ? (
                        <CheckCircleIcon sx={{ fontSize: '14px !important' }} />
                      ) : (
                        <LockOpenIcon sx={{ fontSize: '14px !important' }} />
                      )
                    }
                    label={
                      currentUser
                        ? `${t.chatStatusAuth}: ${currentUser.nid}`
                        : t.chatStatusAnon
                    }
                    color={currentUser ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.74rem', fontWeight: 600, height: 28 }}
                  />
                </Box>

                {/* Ações de Voz + Enviar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    title="Consulta por Voz Assistida"
                    onClick={() => sendToConcierge(POPULAR_SERVICES[2].questionPrompt[lang])}
                    sx={{
                      border: '1px solid #e5e7eb',
                      color: '#4b5563',
                      '&:hover': { bgcolor: '#f3f4f6', color: '#0a2240' }
                    }}
                  >
                    <MicIcon fontSize="small" />
                  </IconButton>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={chatLoading || !promptInput.trim()}
                    endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: 999,
                      px: 2.75,
                      py: 0.9,
                      bgcolor: '#0a2240',
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      '&:hover': { bgcolor: '#163a66' }
                    }}
                  >
                    {chatLoading ? t.askingBtn : t.askBtn}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* PÍLULAS DE SUGESTÃO RÁPIDA (Estilo america.gov abaixo da busca) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mt: 2.5
            }}
          >
            {t.pills.map((pill) => (
              <Chip
                key={pill}
                label={pill}
                onClick={() => sendToConcierge(pill)}
                sx={{
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e4dc',
                  color: '#1f2937',
                  fontWeight: 500,
                  fontSize: '0.82rem',
                  py: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#0a2240',
                    color: '#ffffff',
                    borderColor: '#0a2240'
                  }
                }}
              />
            ))}
          </Box>

          {/* 4. STREAM DE RESPOSTAS DO CONCIERGE IA (Com Citações Oficiais e Botão "Solicitar Serviço") */}
          <Box ref={chatSectionRef} sx={{ mt: chatMessages.length > 0 ? 4 : 0 }}>
            {chatMessages.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 3.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e4dc',
                  boxShadow: '0 10px 30px rgba(10, 34, 64, 0.06)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserIcon sx={{ color: '#0a2240', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240' }}>
                      {t.conciergeHeader}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setChatMessages([])}
                    sx={{ textTransform: 'none', color: '#6b7280', fontSize: '0.78rem' }}
                  >
                    {t.clearChat}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {chatMessages.map((msg) => (
                    <Box key={msg.id}>
                      {msg.sender === 'user' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Paper
                            elevation={0}
                            sx={{
                              px: 2.5,
                              py: 1.5,
                              bgcolor: '#0a2240',
                              color: '#ffffff',
                              borderRadius: '18px 18px 4px 18px',
                              maxWidth: '85%'
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.96rem' }}>
                              {msg.text}
                            </Typography>
                          </Paper>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: '#fcfbf9',
                            border: '1px solid #e5e4dc'
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: 'pre-line',
                              color: '#111827',
                              lineHeight: 1.68,
                              fontSize: '0.97rem'
                            }}
                          >
                            {msg.text}
                          </Typography>

                          {/* Citações Oficiais de Agências do Governo (Estilo america.gov) */}
                          {msg.citations && msg.citations.length > 0 && (
                            <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #e5e4dc' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  color: '#4b5563',
                                  display: 'block',
                                  mb: 1,
                                  letterSpacing: '0.04em'
                                }}
                              >
                                {t.officialCitations}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {msg.citations.map((cit) => (
                                  <Chip
                                    key={cit.id}
                                    label={`[${cit.id}] ${cit.agency}: ${cit.title}`}
                                    size="small"
                                    sx={{
                                      bgcolor: '#f3f4f6',
                                      color: '#1f2937',
                                      fontWeight: 600,
                                      fontSize: '0.74rem'
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Recibo Oficial de Transação Executada (quando já autenticado) */}
                          {msg.action_card && (
                            <Alert
                              severity="success"
                              icon={<CheckCircleIcon />}
                              sx={{ mt: 2.5, borderRadius: 2, border: '1px solid #86efac', bgcolor: '#f0fdf4' }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#14532d' }}>
                                {msg.action_card.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', display: 'block', color: '#166534', mt: 0.5, mb: 1.25 }}
                              >
                                Protocolo AlloyDB: {msg.action_card.reference_id} • Status: {msg.action_card.status}
                              </Typography>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                endIcon={<LaunchIcon fontSize="small" />}
                                onClick={() => handleNavigateToPortal('citizen', msg.service_request_action?.target_tab)}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                              >
                                {t.trackInCitizenPortal}
                              </Button>
                            </Alert>
                          )}

                          {/* Card de Solicitação de Serviço (Exige Login se não autenticado, ou executa se autenticado) */}
                          {msg.service_request_action && !msg.action_card && (
                            <Paper
                              variant="outlined"
                              sx={{
                                mt: 2.5,
                                p: 2,
                                borderRadius: 2.5,
                                bgcolor: '#ffffff',
                                borderColor: '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 2
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 240 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  {currentUser ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  ) : (
                                    <LockIcon sx={{ color: '#b45309', fontSize: 18 }} />
                                  )}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240' }}>
                                    {msg.service_request_action.service_title}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {msg.service_request_action.service_description}
                                </Typography>
                              </Box>

                              <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() =>
                                  handleRequestService(
                                    msg.service_request_action!.service_prompt,
                                    msg.service_request_action!.service_title
                                  )
                                }
                                sx={{
                                  bgcolor: '#0a2240',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  px: 2.5,
                                  py: 1,
                                  '&:hover': { bgcolor: '#163a66' }
                                }}
                              >
                                {currentUser ? t.executeServiceNow : t.requestServiceLogin}
                              </Button>
                            </Paper>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Container>
      </Box>

      {/* 5. DIRETÓRIO DE SERVIÇOS ESSENCIAIS DO ESTADO (Layout Minimalista america.gov) */}
      <Container maxWidth="lg" sx={{ pb: 9 }}>
        <Divider sx={{ mb: 6, borderColor: '#e5e4dc' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.08em', display: 'block' }}
            >
              {t.directoryOverline}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0a2240', fontFamily: '"Merriweather", serif' }}>
              {t.directoryHeading}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => handleNavigateToPortal('citizen', 'identity')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#0a2240',
                color: '#0a2240',
                borderRadius: 999,
                px: 2.5
              }}
            >
              {t.citizenPortalLabel}
            </Button>
            <Button
              variant="outlined"
              endIcon={<AdminIcon />}
              onClick={() => handleNavigateToPortal('backstage')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#cbd5e1',
                color: '#374151',
                borderRadius: 999,
                px: 2.5
              }}
            >
              {t.backstageLabel}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {POPULAR_SERVICES.map((srv) => (
            <Grid item xs={12} md={4} key={srv.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e4dc',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#0a2240',
                    boxShadow: '0 12px 28px -8px rgba(10, 34, 64, 0.08)'
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
                    <Box
                      sx={{
                        p: 1.1,
                        borderRadius: 2,
                        bgcolor: '#f3f4f6',
                        display: 'inline-flex'
                      }}
                    >
                      {srv.icon}
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#4b5563' }}>
                      {srv.agency[lang]}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0a2240', mb: 1, fontSize: '1.08rem' }}>
                    {srv.title[lang]}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.55, mb: 2.5 }}>
                    {srv.description[lang]}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid #f3f4f6' }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => sendToConcierge(srv.questionPrompt[lang])}
                    sx={{ textTransform: 'none', fontWeight: 700, color: '#0a2240' }}
                  >
                    {t.askQuestionBtn}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => handleRequestService(srv.servicePrompt[lang], srv.title[lang])}
                    sx={{
                      ml: 'auto',
                      bgcolor: '#0a2240',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#163a66' }
                    }}
                  >
                    {t.requestServiceBtn}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 6. RODAPÉ OFICIAL AUSTERO (america.gov Footer) */}
      <Box sx={{ bgcolor: '#0a2240', color: '#ffffff', py: 5, borderTop: '4px solid #b91c1c' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box
                  component="img"
                  src="/assets/coat_of_arms.jpg"
                  alt="Brasão"
                  sx={{ width: 42, height: 42, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.3)' }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t.govTitle}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {t.footerSubtitle}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                {t.footerRight1}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                {t.footerRight2}
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
