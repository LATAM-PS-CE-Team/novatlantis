import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Drawer,
  Divider,
  IconButton
} from '@mui/material';
import {
  Shield,
  Globe,
  Search,
  CheckCircle2,
  Stethoscope,
  GraduationCap,
  Siren,
  Wrench,
  ExternalLink,
  Activity,
  Sparkles,
  Scale,
  Database,
  ArrowRight,
  MessageSquare,
  Send,
  X,
  Bot,
  Terminal,
  ChevronRight,
  Layers
} from 'lucide-react';
import { TopNavUserWidget } from './components/TopNavUserWidget';
import { novatlantisTheme } from './theme';

type Language = 'pt-BR' | 'es-419' | 'en-US';

const CITIZEN_PORTAL_URL = 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app';
const GOV_BACKSTAGE_URL = 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app';

const SATELLITE_URLS = {
  nid: 'https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app',
  s311: 'https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app',
  s911: 'https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app',
  health: 'https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app',
  edu: 'https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app'
};

interface CitizenProfile {
  nid: string;
  full_name: string;
  email: string;
  birth_date: string;
  age: number;
  gender: string;
  civil_status: string;
  native_language: Language;
  citizenship_status: string;
  profession: string;
  specialty: string;
  iam_role: string;
  address_id: string;
  district: string;
  tax_status: string;
  backstage_allowed: boolean;
  permissions: string[];
  role_info?: {
    role_code: string;
    title_pt: string;
    department: string;
    clearance_level: number;
  };
}

interface OrchestrationStep {
  agent: string;
  step: string;
  status: string;
  latency_ms: number;
}

interface ActionCard {
  type: string;
  title: string;
  reference_id: string;
  status: string;
  target_portal: 'citizen-portal' | 'gov-backstage';
  target_url: string;
  details: Record<string, string>;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  intent?: string;
  orchestration_steps?: OrchestrationStep[];
  action_card?: ActionCard | null;
  suggested_prompts?: string[];
}

const I18N: Record<
  Language,
  {
    govHeader: string;
    govBanner: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    openChatButton: string;
    architectureTitle: string;
    architectureDesc: string;
    citizenPortalTitle: string;
    citizenPortalDesc: string;
    backstagePortalTitle: string;
    backstagePortalDesc: string;
    lifeEventsTitle: string;
    lifeEventsSubtitle: string;
    innovationsTitle: string;
    innovationsSubtitle: string;
  }
> = {
  'pt-BR': {
    govHeader: 'REPÚBLICA DIGITAL DE NOVATLANTIS • PORTAL PRINCIPAL DA NAÇÃO',
    govBanner: 'Infraestrutura Pública Digital Soberana • AlloyDB for PostgreSQL 15 • Government Data Platform (GDP)',
    heroTitle: 'A serviço do povo de Novatlantis.',
    heroSubtitle:
      'Portal institucional da República Digital de Novatlantis com interface Material UI e banco transacional AlloyDB. Utilize a barra de busca abaixo para abrir uma conversa em tempo real com o Agente Orquestrador de Estado ou acesse o Portal do Cidadão e o Backstage Governamental.',
    searchPlaceholder:
      'Pergunte ou solicite um serviço ao Agente Orquestrador (ex: "Emitir passaporte ICAO", "Abrir empresa em 45s", "Agendar teleconsulta")...',
    searchButton: 'Conversar com o Agente',
    openChatButton: 'Abrir Chat do Agente Orquestrador',
    architectureTitle: 'Arquitetura Soberana Separada em 3 Aplicações Full-Stack + AlloyDB + GDP',
    architectureDesc:
      'Cada portal opera com Frontend React + Material UI e Backend Node.js integrado ao AlloyDB for PostgreSQL 15 e ao Government Data Platform (100.000 cidadãos).',
    citizenPortalTitle: 'Portal do Cidadão (Autoatendimento 360°)',
    citizenPortalDesc:
      'Aplicação exclusiva do cidadão: Carteira NID com biometria NIST, Grafo Familiar, atualização de endereço, Saúde HL7 & Telemedicina, Notas Escolares, Chamados 311/911, Renda Básica e Passaporte ICAO.',
    backstagePortalTitle: 'Backstage Governamental & Identidade 360',
    backstagePortalDesc:
      'Aplicação exclusiva dos servidores e gestores públicos (Primeiro-Ministro Jopoco, Secretário-Geral, Gestor de Identidade 360, Médicos, Professores e Comandantes) com revogação RBAC/ABAC em tempo real.',
    lifeEventsTitle: 'Serviços Públicos por Eventos da Vida',
    lifeEventsSubtitle:
      'Acesso austero, transparente e direto aos serviços essenciais do Estado, organizados em torno da vida do cidadão.',
    innovationsTitle: 'Inovações da Nação AI-First na Era Agêntica',
    innovationsSubtitle: 'Serviços governamentais proativos baseados no AlloyDB e no Government Data Platform (GDP).'
  },
  'es-419': {
    govHeader: 'REPÚBLICA DIGITAL DE NOVATLANTIS • PORTAL PRINCIPAL DE LA NACIÓN',
    govBanner: 'Infraestructura Pública Digital Soberana • AlloyDB for PostgreSQL 15 • Government Data Platform (GDP)',
    heroTitle: 'Al servicio del pueblo de Novatlantis.',
    heroSubtitle:
      'Portal institucional de la República Digital de Novatlantis con interfaz Material UI y AlloyDB. Utilice la barra de búsqueda para conversar en tiempo real con el Agente Orquestador del Estado.',
    searchPlaceholder:
      'Pregunte o solicite un servicio al Agente Orquestador (ej: "Emitir pasaporte ICAO", "Abrir empresa en 45s", "Agendar teleconsulta")...',
    searchButton: 'Conversar con el Agente',
    openChatButton: 'Abrir Chat del Agente Orquestador',
    architectureTitle: 'Arquitectura Soberana Separada en 3 Aplicaciones Full-Stack + AlloyDB + GDP',
    architectureDesc:
      'Cada portal opera con Frontend React + Material UI y Backend Node.js integrado a AlloyDB for PostgreSQL 15 y al Government Data Platform (100.000 ciudadanos).',
    citizenPortalTitle: 'Portal del Ciudadano (Autoservicio 360°)',
    citizenPortalDesc:
      'Aplicación exclusiva del ciudadano: Credencial NID con biometría NIST, Grafo Familiar, dirección, Salud HL7 y Telemedicina, Calificaciones Escolares, Tickets 311/911 y Pasaporte ICAO.',
    backstagePortalTitle: 'Backstage Gubernamental e Identidad 360',
    backstagePortalDesc:
      'Aplicación exclusiva de servidores y gestores públicos (Primer Ministro Jopoco, Secretario General, Gestor de Identidad 360, Médicos y Profesores) con revocación RBAC/ABAC inmediata.',
    lifeEventsTitle: 'Servicios Públicos por Eventos de Vida',
    lifeEventsSubtitle: 'Acceso austero, transparente y directo a los servicios esenciales del Estado.',
    innovationsTitle: 'Innovaciones de la Nación AI-First en la Era Agéntica',
    innovationsSubtitle: 'Servicios gubernamentales proactivos basados en AlloyDB y el Government Data Platform (GDP).'
  },
  'en-US': {
    govHeader: 'DIGITAL REPUBLIC OF NOVATLANTIS • NATIONAL MASTER PORTAL',
    govBanner: 'Sovereign Digital Public Infrastructure • AlloyDB for PostgreSQL 15 • Government Data Platform (GDP)',
    heroTitle: 'Working for the people of Novatlantis.',
    heroSubtitle:
      'Official institutional portal of the Digital Republic of Novatlantis powered by Material UI and AlloyDB. Use the search bar below to open a real-time chat with the State Orchestrator Agent.',
    searchPlaceholder:
      'Ask or request a service from the State Orchestrator Agent (e.g., "Issue ICAO passport", "Open company in 45s", "Schedule telemedicine")...',
    searchButton: 'Chat with Agent',
    openChatButton: 'Open Orchestrator Agent Chat',
    architectureTitle: 'Sovereign Architecture Separated into 3 Full-Stack Applications + AlloyDB + GDP',
    architectureDesc:
      'Each portal operates with its own React + Material UI Frontend and Node.js Backend backed by AlloyDB for PostgreSQL 15 and the Government Data Platform (100,000 citizens).',
    citizenPortalTitle: 'Citizen Portal (360° Self-Service)',
    citizenPortalDesc:
      'Dedicated citizen application: NID Credential with NIST biometrics, Family Graph, address updates, HL7 Health & Telemedicine, Student Grades, 311/911 Requests, and ICAO Passport.',
    backstagePortalTitle: 'Government Backstage & Identity 360',
    backstagePortalDesc:
      'Dedicated public servant & manager application (Prime Minister Jopoco, Secretary-General, Identity 360 Manager, Doctors, and Teachers) with instant RBAC/ABAC revocation.',
    lifeEventsTitle: 'Public Services by Life Events',
    lifeEventsSubtitle: 'Clean, austere, and accountable access to essential State services organized around citizen needs.',
    innovationsTitle: 'AI-First Nation Innovations in the Agentic Era',
    innovationsSubtitle: 'Proactive government services powered by AlloyDB and the Government Data Platform (GDP).'
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('pt-BR');
  const [currentUser, setCurrentUser] = useState<CitizenProfile | null>(null);
  const [lakehouseStats, setLakehouseStats] = useState<any>(null);

  // Orchestrator Chat State
  const [searchBarInput, setSearchBarInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const t = I18N[lang];

  const loadUser = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUser(data.citizen);
      if (data.citizen.native_language && ['pt-BR', 'es-419', 'en-US'].includes(data.citizen.native_language)) {
        setLang(data.citizen.native_language as Language);
      }
      setChatTurns([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          message:
            `Saudações institucionais, **${data.citizen.full_name}** (\`${data.citizen.nid}\`).\n\n` +
            `Sou o **Agente Orquestrador de Estado de Novatlantis**, conectado em tempo real ao **AlloyDB for PostgreSQL 15** e ao **Government Data Platform (100.000 cidadãos)**.\n` +
            `Seu perfil atual na aplicação **Identidade 360** é \`${data.citizen.iam_role}\` (${data.citizen.profession} • ${data.citizen.district}).\n\n` +
            `Como posso auxiliá-lo hoje? Posso consultar seu prontuário, emitir seu Passaporte Digital ICAO, abrir uma empresa em 45 segundos, agendar uma teleconsulta médica, verificar notas escolares ou registrar um chamado 311/911.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'SOVEREIGN_WELCOME',
          suggested_prompts: [
            'Consultar meu prontuário completo e família no GDF',
            'Emitir ou validar meu Passaporte Digital ICAO',
            'Abrir uma empresa em 45 segundos no Distrito Tecnológico',
            'Agendar teleconsulta médica com resumo clínico IA',
            'Verificar notas escolares e desempenho em IA & Robótica',
            'Abrir chamado 311 para reparo de iluminação pública'
          ]
        }
      ]);
    } catch (e) {
      console.error('Erro ao carregar cidadão:', e);
    }
  };

  const loadHealthStats = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setLakehouseStats(data.lakehouse_counts);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nidParam = params.get('nid') || 'NID-000-0000-0001-9';
    loadUser(nidParam);
    loadHealthStats();
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatTurns, chatOpen]);

  const sendMessageToOrchestrator = async (rawMessage: string) => {
    const clean = rawMessage.trim();
    if (!clean) return;
    setChatOpen(true);

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      message: clean,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatTurns((prev) => [...prev, userTurn]);
    setChatInput('');
    setChatSending(true);

    try {
      const res = await fetch('/api/orchestrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nid: currentUser?.nid || 'NID-000-0000-0001-9',
          message: clean,
          lang
        })
      });
      const data = await res.json();
      const assistantTurn: ChatTurn = {
        id: data.message_id || `a-${Date.now()}`,
        role: 'assistant',
        message: data.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        orchestration_steps: data.orchestration_steps,
        action_card: data.action_card,
        suggested_prompts: data.suggested_prompts
      };
      setChatTurns((prev) => [...prev, assistantTurn]);
    } catch {
      setChatTurns((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          message: 'Ocorreu uma falha temporária na comunicação com o motor do Agente Orquestrador.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBarInput.trim()) {
      setChatOpen(true);
      return;
    }
    const q = searchBarInput;
    setSearchBarInput('');
    sendMessageToOrchestrator(q);
  };

  const citizenPortalLink = `${CITIZEN_PORTAL_URL}?nid=${encodeURIComponent(currentUser?.nid || 'NID-000-0000-0001-9')}`;
  const backstagePortalLink = `${GOV_BACKSTAGE_URL}?nid=${encodeURIComponent(currentUser?.nid || 'NID-000-0000-0001-9')}`;

  return (
    <ThemeProvider theme={novatlantisTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        {/* 1. FAIXA DE AUTORIDADE SOBERANA (TOP BANNER) */}
        <Box sx={{ bgcolor: '#001530', color: '#ffffff', borderBottom: '1px solid #002046', py: 1 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="img"
                  src="/assets/flag.jpg"
                  alt="Bandeira Oficial de Novatlantis"
                  sx={{ height: 18, width: 26, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', letterSpacing: '0.06em', fontWeight: 700, color: '#b4c5ff' }}
                >
                  {t.govHeader}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ display: { xs: 'none', md: 'inline' }, color: '#cbd5e1' }}>
                  {t.govBanner}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: '#002046',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <Globe size={14} color="#b4c5ff" />
                  {(['pt-BR', 'es-419', 'en-US'] as Language[]).map((l) => (
                    <Button
                      key={l}
                      size="small"
                      onClick={() => setLang(l)}
                      sx={{
                        minWidth: 32,
                        px: 0.75,
                        py: 0.1,
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        bgcolor: lang === l ? '#b4c5ff' : 'transparent',
                        color: lang === l ? '#002046' : '#cbd5e1',
                        fontWeight: lang === l ? 800 : 500,
                        '&:hover': { bgcolor: lang === l ? '#b4c5ff' : 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      {l.split('-')[0].toUpperCase()}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* 2. CABEÇALHO INSTITUCIONAL MATERIAL UI COM FONTE AMPLIADA E APENAS STATUS DO USUÁRIO */}
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            borderBottom: '3px solid #002046',
            zIndex: 30
          }}
        >
          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              sx={{
                py: { xs: 2, md: 2.75 },
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 0.75,
                    borderRadius: 2,
                    borderColor: '#cbd5e1',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/coat_of_arms.jpg"
                    alt="Brasão Oficial de Novatlantis"
                    sx={{ height: { xs: 52, md: 68 }, width: { xs: 52, md: 68 }, objectFit: 'contain' }}
                  />
                </Paper>
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '1.65rem', sm: '2.1rem', md: '2.5rem' },
                        fontWeight: 800,
                        color: '#002046',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15
                      }}
                    >
                      Governo da República de Novatlantis
                    </Typography>
                    <Chip
                      label="Portal Principal da Nação"
                      sx={{
                        bgcolor: '#dae2ff',
                        color: '#001848',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.82rem', md: '0.95rem' },
                        height: { xs: 30, md: 36 },
                        px: 1,
                        borderRadius: 1.5
                      }}
                    />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: '0.98rem', sm: '1.14rem', md: '1.25rem' },
                      fontWeight: 500,
                      color: '#43474f',
                      mt: 0.6,
                      lineHeight: 1.35
                    }}
                  >
                    Chancelaria Digital • Agente Orquestrador de Estado • Módulo de Usuários GDF (100.000 Cidadãos)
                  </Typography>
                </Box>
              </Box>

              {/* APENAS O WIDGET DE STATUS DO USUÁRIO COM A FOTO (SEM BOTÕES EXTRAS NO CABEÇALHO) */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TopNavUserWidget
                  currentNid={currentUser?.nid}
                  onUserAuthenticated={(nid) => loadUser(nid)}
                />
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* 3. CONTEÚDO PRINCIPAL DO PORTAL DA NAÇÃO (MATERIAL UI) */}
        <Box component="main" sx={{ flex: 1 }}>
          {/* HERO INSTITUCIONAL COM BARRA DE BUSCA DO AGENTE ORQUESTRADOR */}
          <Box sx={{ bgcolor: '#002046', color: '#ffffff', borderBottom: '4px solid #b4c5ff', py: { xs: 5, md: 7 } }}>
            <Container maxWidth="xl">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' },
                  gap: 4,
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                  <Box>
                    <Chip
                      icon={<Bot size={15} color="#b4c5ff" />}
                      label="ORQUESTRADOR AGÊNTICO NACIONAL • ALLOYDB FOR POSTGRESQL 15 + GOVERNMENT DATA PLATFORM"
                      sx={{
                        bgcolor: '#00356e',
                        color: '#b4c5ff',
                        border: '1px solid rgba(180,197,255,0.35)',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.74rem'
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.6rem', md: '3rem' },
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {t.heroTitle}
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#e2e8f0', maxWidth: 780, fontSize: '1.05rem', lineHeight: 1.6 }}>
                    {t.heroSubtitle}
                  </Typography>

                  {/* BARRA DE BUSCA MATERIAL UI QUE ABRE O CHAT DO AGENTE ORQUESTRADOR */}
                  <Box
                    component="form"
                    onSubmit={handleHeroSearchSubmit}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1.5,
                      maxWidth: 780,
                      pt: 1
                    }}
                  >
                    <TextField
                      fullWidth
                      value={searchBarInput}
                      onChange={(e) => setSearchBarInput(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                        sx: {
                          bgcolor: '#ffffff',
                          borderRadius: 1.5,
                          fontSize: '0.95rem'
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<MessageSquare size={18} />}
                      sx={{
                        px: 3.5,
                        py: 1.75,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        color: '#001848',
                        bgcolor: '#b4c5ff',
                        '&:hover': { bgcolor: '#ffffff' }
                      }}
                    >
                      {t.searchButton}
                    </Button>
                  </Box>

                  {/* SUGESTÕES RÁPIDAS */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, pt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#b4c5ff', fontWeight: 700 }}>
                      ACIONAR AGENTE VIA CHAT:
                    </Typography>
                    {[
                      'Consultar meu prontuário e família no GDF',
                      'Emitir meu Passaporte Digital ICAO',
                      'Abrir empresa em 45s no Distrito Tecnológico',
                      'Agendar teleconsulta médica com IA',
                      'Verificar notas escolares e desempenho',
                      'Abrir chamado 311 na minha rua'
                    ].map((prompt) => (
                      <Chip
                        key={prompt}
                        icon={<Sparkles size={12} color="#b4c5ff" />}
                        label={prompt}
                        size="small"
                        onClick={() => sendMessageToOrchestrator(prompt)}
                        sx={{
                          bgcolor: '#00356e',
                          color: '#e2e8f0',
                          border: '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#b4c5ff', color: '#001848' }
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* PAINEL DE INDICADORES SOBERANOS EM TEMPO REAL (ALLOYDB + GDP) */}
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: '#001530',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 2,
                    p: 3
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.12)',
                      pb: 1.5,
                      mb: 2
                    }}
                  >
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#b4c5ff', fontWeight: 700 }}>
                      ALLOYDB + GOVERNMENT DATA PLATFORM
                    </Typography>
                    <Chip
                      label="ONLINE • US-CENTRAL1"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontFamily: 'monospace',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        height: 22
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Paper sx={{ bgcolor: '#002046', p: 1.5, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        População no AlloyDB
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                        {lakehouseStats ? lakehouseStats.citizens.toLocaleString('pt-BR') : '100.000'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b4c5ff', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                        novatlantis-primary-01
                      </Typography>
                    </Paper>
                    <Paper sx={{ bgcolor: '#002046', p: 1.5, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Vínculos Familiares
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                        {lakehouseStats ? lakehouseStats.family_links.toLocaleString('pt-BR') : '71.425'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b4c5ff', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                        Grafo Civil Read-Only
                      </Typography>
                    </Paper>
                    <Paper sx={{ bgcolor: '#002046', p: 1.5, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Matrículas GDP / EDP
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                        {lakehouseStats ? lakehouseStats.edu_enrollments.toLocaleString('pt-BR') : '20.440'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b4c5ff', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                        v_mdl_users / v_mdl_grades
                      </Typography>
                    </Paper>
                    <Paper sx={{ bgcolor: '#002046', p: 1.5, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Passaportes ICAO
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                        {lakehouseStats ? lakehouseStats.passports.toLocaleString('pt-BR') : '44.088'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b4c5ff', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                        Fronteira Biométrica
                      </Typography>
                    </Paper>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setChatOpen(true)}
                    startIcon={<Bot size={16} />}
                    sx={{
                      bgcolor: '#00356e',
                      color: '#ffffff',
                      border: '1px solid rgba(180,197,255,0.4)',
                      '&:hover': { bgcolor: '#b4c5ff', color: '#001848' }
                    }}
                  >
                    Abrir Console de Chat do Agente Orquestrador
                  </Button>
                </Paper>
              </Box>
            </Container>
          </Box>

          <Container maxWidth="xl" sx={{ py: 5, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* ARQUITETURA ALLOYDB + GOVERNMENT DATA PLATFORM (BASEADA NO EDUCATION DATA PLATFORM) */}
            <Paper variant="outlined" sx={{ p: 3.5, borderRadius: 2, border: '2px solid #002046', bgcolor: '#ffffff' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  pb: 2,
                  mb: 2.5,
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Database size={26} color="#002046" />
                  <Box>
                    <Typography variant="h5" sx={{ color: '#002046', fontWeight: 800 }}>
                      Infraestrutura de Dados Soberana: AlloyDB for PostgreSQL 15 + Government Data Platform (GDP)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Implantado no projeto Google Cloud <code>novatlantis</code> segundo o blueprint oficial{' '}
                      <code>GoogleCloudPlatform/education-data-platform</code>.
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="ALLOYDB PRIMARY: 10.223.28.2 • BIGQUERY 5 CAMADAS ATIVAS"
                  color="primary"
                  sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Chip label="1. OLTP + HTAP" size="small" color="primary" sx={{ mb: 1, fontFamily: 'monospace' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#002046' }}>
                      AlloyDB for PostgreSQL 15
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Cluster <code>novatlantis-sovereign-cluster</code> e instância <code>novatlantis-primary-01</code>{' '}
                      (<code>10.223.28.2</code>) na rede <code>novatlantis-vpc</code> com Columnar Engine e AlloyDB AI.
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Chip label="2. DROP-OFF & LOAD" size="small" color="primary" sx={{ mb: 1, fontFamily: 'monospace' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#002046' }}>
                      Ingestão GCS, Pub/Sub & APIs
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Buckets <code>gs://novatlantis-gdp-drp-cs-0</code> e <code>gs://novatlantis-gdp-load-cs-0</code>,
                      tópico Pub/Sub <code>novatlantis-gdp-drp-ps-0</code> e conector REST APIs.
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Chip label="3. DWH LANDING & CURATED" size="small" color="primary" sx={{ mb: 1, fontFamily: 'monospace' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#002046' }}>
                      BigQuery Medallion & Looker
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Datasets <code>novatlantis_gdp_dwh_lnd_bq_0</code> e <code>novatlantis_gdp_dwh_cur_bq_0</code> com
                      11 tabelas e views <code>v_mdl_users</code>, <code>v_mdl_courses</code> e <code>v_mdl_grades</code>.
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Chip label="4. DWH CONFIDENTIAL" size="small" color="primary" sx={{ mb: 1, fontFamily: 'monospace' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#002046' }}>
                      Governança PII & Biometria NIST
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Dataset <code>novatlantis_gdp_dwh_conf_bq_0</code> (<code>citizens_pii_biometrics</code> com
                      100.000 registros) e Data Catalog Policy Tags (<code>3_Confidential</code>).
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>

            {/* SEPARAÇÃO EM 3 APLICAÇÕES FULL-STACK COMPLETAS E INDEPENDENTES */}
            <Box>
              <Box
                sx={{
                  borderBottom: '2px solid #002046',
                  pb: 1.5,
                  mb: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ color: '#002046', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Layers size={26} color="#002046" />
                    {t.architectureTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t.architectureDesc}
                  </Typography>
                </Box>
                <Chip
                  label="SSO Integrado com a Base AlloyDB de 100.000 Cidadãos"
                  sx={{ bgcolor: '#dae2ff', color: '#001848', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                {/* CARD 1: PORTAL DO CIDADÃO */}
                <Card variant="outlined" sx={{ border: '2px solid #002046', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label="APLICAÇÃO FULL-STACK 02 • AUTOATENDIMENTO CIDADÃO"
                        size="small"
                        sx={{ bgcolor: '#dae2ff', color: '#001848', fontFamily: 'monospace', fontWeight: 800 }}
                      />
                      <Chip
                        icon={<CheckCircle2 size={14} />}
                        label="Cloud Run + AlloyDB"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ color: '#002046', mb: 1.5 }}>
                      {t.citizenPortalTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                      {t.citizenPortalDesc}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Carteira NID & Grafo Familiar
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Validação NIST, árvore genealógica somente leitura e endereço.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Saúde HL7 & Educação GDP
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Telemedicina com prescrição IA e boletim escolar por matéria.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Zeladoria 311 & SOS 911
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Abertura de chamados urbanos e despacho de emergência.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Empresa 45s & Passaporte ICAO
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Registro empresarial instantâneo e MRZ ICAO 9303.
                        </Typography>
                      </Paper>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#43474f' }}>
                      Sessão SSO: <strong>{currentUser?.full_name}</strong> ({currentUser?.nid})
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      href={citizenPortalLink}
                      endIcon={<ArrowRight size={16} />}
                    >
                      Acessar Portal do Cidadão
                    </Button>
                  </CardActions>
                </Card>

                {/* CARD 2: BACKSTAGE GOVERNAMENTAL */}
                <Card variant="outlined" sx={{ border: '2px solid #002046', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label="APLICAÇÃO FULL-STACK 03 • SERVIDORES & GESTORES PÚBLICOS"
                        size="small"
                        sx={{ bgcolor: '#002046', color: '#b4c5ff', fontFamily: 'monospace', fontWeight: 800 }}
                      />
                      <Chip
                        icon={<CheckCircle2 size={14} />}
                        label="RBAC/ABAC Identidade 360"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ color: '#002046', mb: 1.5 }}>
                      {t.backstagePortalTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                      {t.backstagePortalDesc}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Gabinete PM Jopoco & IAM 360
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Concessão e revogação imediata de permissões de servidores.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Gestão de Hospitais & Médicos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unidades de saúde, corpo clínico e atendimento de telemedicina.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Gestão de Escolas & Professores
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Lançamento de notas por matéria e aplicação de provas no GDP.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8f9fb' }}>
                        <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 700 }}>
                          Comando 311/911 & Datalake
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Resolução de demandas, fronteiras e exploração AlloyDB/BigQuery.
                        </Typography>
                      </Paper>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#43474f' }}>
                      Status RBAC:{' '}
                      <strong style={{ color: currentUser?.backstage_allowed ? '#047857' : '#b45309' }}>
                        {currentUser?.backstage_allowed ? `AUTORIZADO (${currentUser.iam_role})` : 'CIDADÃO COMUM (RESTRITO)'}
                      </strong>
                    </Typography>
                    <Button
                      variant="contained"
                      href={backstagePortalLink}
                      endIcon={<ArrowRight size={16} />}
                      sx={{ bgcolor: '#00356e', '&:hover': { bgcolor: '#002046' } }}
                    >
                      Acessar Backstage Governamental
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            </Box>

            {/* MATRIZ DE EVENTOS DA VIDA (MATERIAL UI CARDS) */}
            <Box>
              <Box
                sx={{
                  borderBottom: '2px solid #002046',
                  pb: 1.5,
                  mb: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ color: '#002046' }}>
                    {t.lifeEventsTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.lifeEventsSubtitle}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#43474f' }}>
                  Material UI Design System • AlloyDB + Government Data Platform
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {[
                  {
                    icon: Shield,
                    title: 'Identidade Civil, Família e Residência',
                    desc: 'Carteira Nacional NID com dígito verificador Mod-11, biometria NIST, árvore familiar Read-Only e atualização de domicílio.',
                    actionLabel: 'Abrir no Portal do Cidadão',
                    href: `${citizenPortalLink}&tab=identity`,
                    agentPrompt: 'Consultar meu prontuário completo e família no GDF'
                  },
                  {
                    icon: Stethoscope,
                    title: 'Saúde Pública, Hospitais e Telemedicina',
                    desc: 'Prontuário clínico HL7 FHIR, histórico vacinal, doação de órgãos e sala de teleconsulta assistida por IA.',
                    actionLabel: 'Acessar Saúde do Cidadão',
                    href: `${citizenPortalLink}&tab=health`,
                    agentPrompt: 'Agendar teleconsulta médica com resumo clínico IA'
                  },
                  {
                    icon: GraduationCap,
                    title: 'Educação Pública, Notas e Currículo IA',
                    desc: 'Acompanhamento de matrícula escolar no Government Data Platform (v_mdl_grades), frequência e desempenho por matéria.',
                    actionLabel: 'Acessar Educação do Cidadão',
                    href: `${citizenPortalLink}&tab=education`,
                    agentPrompt: 'Verificar notas escolares e desempenho em IA & Robótica'
                  },
                  {
                    icon: Wrench,
                    title: 'Zeladoria Urbana 311 e Obras Civis',
                    desc: 'Relato de problemas de iluminação, pavimentação, drenagem e resíduos com roteamento automático para equipes de campo.',
                    actionLabel: 'Abrir Zeladoria 311',
                    href: `${citizenPortalLink}&tab=urban`,
                    agentPrompt: 'Abrir chamado 311 para reparo de iluminação pública'
                  },
                  {
                    icon: Siren,
                    title: 'Defesa Civil e Despacho de Emergência 911',
                    desc: 'Acionamento prioritário de unidades médicas, defesa civil e guarda costeira com protocolo de resposta < 4 minutos.',
                    actionLabel: 'Acionar Emergência 911',
                    href: `${citizenPortalLink}&tab=urban`,
                    agentPrompt: 'Acionar despacho de emergência 911 com prioridade'
                  },
                  {
                    icon: Scale,
                    title: 'Economia Soberana, Empresas em 45s e Fronteiras',
                    desc: 'Renda Básica Universal (UBI), abertura instantânea de empresas e emissão de Passaporte Biométrico ICAO Doc 9303.',
                    actionLabel: 'Acessar Tesouro & Passaporte',
                    href: `${citizenPortalLink}&tab=treasury`,
                    agentPrompt: 'Emitir ou validar meu Passaporte Digital ICAO'
                  }
                ].map((card, i) => (
                  <Card
                    key={i}
                    variant="outlined"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: '#002046' }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            bgcolor: '#f2f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#002046'
                          }}
                        >
                          <card.icon size={20} />
                        </Box>
                        <Chip label="Serviço Oficial" size="small" sx={{ fontFamily: 'monospace', fontSize: '0.68rem' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#002046', fontSize: '1.1rem', mb: 1 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                        {card.desc}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, pt: 1, justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                      <Button size="small" href={card.href} endIcon={<ArrowRight size={14} />}>
                        {card.actionLabel}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => sendMessageToOrchestrator(card.agentPrompt)}
                        sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}
                      >
                        Pedir ao Agente
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* MICROSSERVIÇOS VERTICAIS NO CLOUD RUN */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#002046', mb: 0.5 }}>
                Ecossistema Completo de Aplicações Soberanas em Produção (Google Cloud Run • Argolis)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Todas as aplicações principais e microsserviços setoriais operam integrados ao AlloyDB e ao Government Data Platform no projeto <code>novatlantis</code>.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5 }}>
                <Button variant="contained" color="secondary" href={citizenPortalLink} endIcon={<ExternalLink size={14} />}>
                  Portal Cidadão
                </Button>
                <Button variant="contained" color="primary" href={backstagePortalLink} endIcon={<ExternalLink size={14} />}>
                  Gov Backstage
                </Button>
                <Button variant="outlined" href={SATELLITE_URLS.nid} target="_blank" endIcon={<ExternalLink size={14} />}>
                  Identity NID
                </Button>
                <Button variant="outlined" href={SATELLITE_URLS.s311} target="_blank" endIcon={<ExternalLink size={14} />}>
                  Serviços 311
                </Button>
                <Button variant="outlined" href={SATELLITE_URLS.s911} target="_blank" endIcon={<ExternalLink size={14} />}>
                  Emergência 911
                </Button>
                <Button variant="outlined" href={SATELLITE_URLS.health} target="_blank" endIcon={<ExternalLink size={14} />}>
                  Saúde Telemed
                </Button>
                <Button variant="outlined" href={SATELLITE_URLS.edu} target="_blank" endIcon={<ExternalLink size={14} />}>
                  Educação IA
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* DRAWER MATERIAL UI DO AGENTE ORQUESTRADOR DE ESTADO */}
        <Drawer
          anchor="right"
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 620 }, borderLeft: '4px solid #002046', display: 'flex', flexDirection: 'column' }
          }}
        >
          <Box
            sx={{
              bgcolor: '#002046',
              color: '#ffffff',
              px: 3,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Bot size={24} color="#b4c5ff" />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>
                  Agente Orquestrador de Estado • Novatlantis
                </Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                  Cidadão em sessão: <strong>{currentUser?.full_name}</strong> ({currentUser?.nid}) • AlloyDB + GDP
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setChatOpen(false)} sx={{ color: '#ffffff' }}>
              <X size={20} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f8f9fb', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chatTurns.map((turn) => (
              <Box
                key={turn.id}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: turn.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    maxWidth: '90%',
                    p: 2,
                    bgcolor: turn.role === 'user' ? '#002046' : '#ffffff',
                    color: turn.role === 'user' ? '#ffffff' : '#191c1e'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      mb: 1,
                      pb: 0.5,
                      borderBottom: '1px solid rgba(148,163,184,0.25)',
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      opacity: 0.8
                    }}
                  >
                    <span>
                      {turn.role === 'user'
                        ? `${currentUser?.full_name || 'Cidadão'} (${currentUser?.nid})`
                        : `AGENTE ORQUESTRADOR DE ESTADO ${turn.intent ? `• [${turn.intent}]` : ''}`}
                    </span>
                    <span>{turn.timestamp}</span>
                  </Box>

                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '0.84rem', lineHeight: 1.55 }}>
                    {turn.message}
                  </Typography>

                  {turn.orchestration_steps && turn.orchestration_steps.length > 0 && (
                    <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: '#f2f4f6' }}>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#002046', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
                      >
                        <Terminal size={12} /> Trace de Orquestração Multi-Agente (AlloyDB + GDP)
                      </Typography>
                      {turn.orchestration_steps.map((s, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.7rem', color: '#43474f' }}>
                          <span>
                            <strong>{s.agent}:</strong> {s.step}
                          </span>
                          <span style={{ color: '#047857', fontWeight: 700 }}>
                            {s.status} ({s.latency_ms}ms)
                          </span>
                        </Box>
                      ))}
                    </Paper>
                  )}

                  {turn.action_card && (
                    <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, border: '2px solid #002046', bgcolor: '#eff6ff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip label={turn.action_card.type} size="small" color="primary" sx={{ fontFamily: 'monospace', fontSize: '0.68rem' }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#065f46' }}>
                          {turn.action_card.status} • #{turn.action_card.reference_id}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ color: '#002046', fontWeight: 800, mb: 1 }}>
                        {turn.action_card.title}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        href={turn.action_card.target_url}
                        endIcon={<ExternalLink size={13} />}
                      >
                        Abrir no {turn.action_card.target_portal === 'gov-backstage' ? 'Backstage Governamental' : 'Portal do Cidadão'}
                      </Button>
                    </Paper>
                  )}

                  {turn.suggested_prompts && turn.suggested_prompts.length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {turn.suggested_prompts.map((sp) => (
                        <Chip
                          key={sp}
                          label={sp}
                          size="small"
                          icon={<ChevronRight size={12} />}
                          onClick={() => sendMessageToOrchestrator(sp)}
                          sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}
            {chatSending && (
              <Paper variant="outlined" sx={{ p: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Activity size={16} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  Orquestrando agentes setoriais no AlloyDB e Government Data Platform...
                </Typography>
              </Paper>
            )}
            <div ref={chatBottomRef} />
          </Box>

          <Divider />
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessageToOrchestrator(chatInput);
            }}
            sx={{ p: 2, bgcolor: '#ffffff', display: 'flex', gap: 1.5 }}
          >
            <TextField
              fullWidth
              size="small"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite sua solicitação ao Agente Orquestrador..."
            />
            <Button type="submit" variant="contained" color="primary" disabled={chatSending} endIcon={<Send size={15} />}>
              Enviar
            </Button>
          </Box>
        </Drawer>

        {/* RODAPÉ INSTITUCIONAL */}
        <Box component="footer" sx={{ bgcolor: '#001530', color: '#cbd5e1', borderTop: '4px solid #002046', mt: 6, py: 4 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component="img"
                  src="/assets/coat_of_arms.jpg"
                  alt="Brasão de Novatlantis"
                  sx={{ height: 42, width: 42, objectFit: 'contain', borderRadius: 1, bgcolor: '#fff', p: 0.5 }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700 }}>
                    República Digital de Novatlantis • Chancelaria do Primeiro-Ministro (Jopoco)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                    Projeto GCP: novatlantis • AlloyDB for PostgreSQL 15 • Government Data Platform (GDP) • 100.000 Cidadãos
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button size="small" sx={{ color: '#b4c5ff' }} href={citizenPortalLink}>
                  Portal do Cidadão
                </Button>
                <Button size="small" sx={{ color: '#b4c5ff' }} href={backstagePortalLink}>
                  Backstage Governamental
                </Button>
                <Button size="small" sx={{ color: '#b4c5ff' }} onClick={() => setChatOpen(true)}>
                  Chat do Agente Orquestrador
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
