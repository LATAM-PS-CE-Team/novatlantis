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
  Launch as LaunchIcon
} from '@mui/icons-material';
import { TopNavUserWidget, AuthUserProfile } from './components/TopNavUserWidget';

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

// Design System inspirado em https://america.gov/ (National Design Studio / USWDS Minimalist Front Door)
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

const POPULAR_SERVICES = [
  {
    id: 'passport',
    title: 'Passaporte Digital ICAO & Vistos',
    agency: 'Chancelaria Soberana & Suprema Corte',
    description: 'Emissão e renovação instantânea com assinatura Ed25519 e liberação automática de e-Gate em 174 países.',
    questionPrompt: 'Como emitir ou renovar meu Passaporte Digital ICAO?',
    servicePrompt: 'Emitir e validar meu Passaporte Digital ICAO agora',
    tab: 'treasury',
    icon: <PublicIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'company',
    title: 'Abrir Empresa em 45s & Dividendo UBI',
    agency: 'Ministério do Tesouro & Economia Soberana',
    description: 'Constituição imediata de empresa autônoma no Simples Agêntico (3%) com 250 TFLOPs de crédito computacional.',
    questionPrompt: 'Como abrir uma empresa autônoma em 45 segundos e como funciona o UBI?',
    servicePrompt: 'Abrir empresa autônoma agora no Ministério do Tesouro',
    tab: 'treasury',
    icon: <BusinessIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'health',
    title: 'Telemedicina 24/7 & Prontuário HL7',
    agency: 'Ministério da Saúde & Rede Hospitalar',
    description: 'Consultas médicas por vídeo com triagem IA, histórico vacinal, tipo sanguíneo e prescrição digital.',
    questionPrompt: 'Como funciona o atendimento de Telemedicina 24/7 e o prontuário HL7 FHIR?',
    servicePrompt: 'Agendar teleconsulta médica agora com resumo clínico HL7',
    tab: 'health',
    icon: <HealthIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'education',
    title: 'Boletim Escolar & Tutoria Adaptativa IA',
    agency: 'Ministério da Educação & Escolas Soberanas',
    description: 'Acompanhamento de notas em Matemática, Ciências e IA & Robótica, frequência escolar e tutoria personalizada.',
    questionPrompt: 'Como consultar o boletim escolar e frequência dos meus filhos?',
    servicePrompt: 'Consultar boletim escolar e frequência no Ministério da Educação',
    tab: 'education',
    icon: <SchoolIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'urban',
    title: 'Zeladoria Urbana 311 & Emergência 911',
    agency: 'Centro Integrado de Comando Urbano',
    description: 'Solicitação de reparos de iluminação, vias e saneamento (SLA 6h) ou despacho tático de emergência 911.',
    questionPrompt: 'Como abrir um chamado urbano 311 no meu distrito?',
    servicePrompt: 'Abrir chamado 311 para reparo de iluminação e zeladoria no meu distrito',
    tab: 'urban',
    icon: <UrbanIcon sx={{ color: '#0a2240' }} />
  },
  {
    id: 'identity',
    title: 'Carteira Digital NID & Árvore Familiar',
    agency: 'Autoridade Nacional de Identidade 360',
    description: 'Credencial soberana com biometria NIST, vínculo familiar somente leitura e permissões RBAC de Estado.',
    questionPrompt: 'Como funciona a Identidade Soberana NID e o acesso ao Backstage?',
    servicePrompt: 'Consultar minha Carteira Digital NID e vínculos familiares',
    tab: 'identity',
    icon: <BadgeIcon sx={{ color: '#0a2240' }} />
  }
];

export function App() {
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

  // Envia pergunta ou solicitação de serviço ao Concierge AI
  // Funciona tanto sem login (citizenNid = null) quanto autenticado!
  const sendToConcierge = async (messageText: string, explicitNid?: string | null) => {
    const cleanMsg = messageText.trim();
    if (!cleanMsg) return;

    const effectiveNid = explicitNid !== undefined ? explicitNid : currentUser?.nid || null;

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: cleanMsg,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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
          message: cleanMsg
        })
      });
      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: data.message_id || `AGT-${Date.now()}`,
        sender: 'orchestrator',
        text: data.reply || 'Orientação governamental processada.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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

  // Acionado quando o usuário clica em "Solicitar Serviço" (no Chat ou nos Cards)
  const handleRequestService = (servicePrompt: string, serviceTitle: string) => {
    if (!currentUser) {
      // Usuário não está logado -> guarda o serviço desejado e abre o Modal de Login!
      pendingServicePromptRef.current = servicePrompt;
      setLoginReasonMessage(
        `Autenticação necessária para solicitar o serviço: "${serviceTitle}". Após entrar com seu NID, sua solicitação será executada automaticamente.`
      );
      setLoginTriggerCount((prev) => prev + 1);
      return;
    }

    // Se já estiver logado, executa imediatamente o serviço no Concierge com o NID autenticado
    sendToConcierge(servicePrompt, currentUser.nid);
  };

  const buildCrossPortalUrl = (baseUrl: string, tab?: string) => {
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    if (ssoToken) params.set('sso_token', ssoToken);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const handleNavigateToPortal = (targetPortal: 'citizen' | 'backstage', tab?: string) => {
    if (!currentUser) {
      setLoginReasonMessage(
        targetPortal === 'backstage'
          ? 'Para acessar o Backstage Governamental, autentique-se com uma credencial de Servidor Público / Identidade 360.'
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
                Um site oficial do Governo da República Digital de Novatlantis
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
                Saiba como verificar
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: '#4b5563', fontSize: '0.72rem', display: { xs: 'none', md: 'block' } }}
            >
              National Design Studio • AlloyDB for PostgreSQL 15 • Government Data Platform (100k Cidadãos)
            </Typography>
          </Box>

          <Collapse in={govBannerOpen}>
            <Grid container spacing={2} sx={{ pt: 1.5, pb: 1, mt: 0.5, borderTop: '1px solid #e2e0d8' }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <AccountBalanceIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#111827' }}>
                      Portais oficiais utilizam infraestrutura soberana no Google Cloud (Project: novatlantis)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Conectado diretamente ao cluster AlloyDB <code>novatlantis-sovereign-cluster</code> e ao Data
                      Lakehouse governamental.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <HttpsIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#111827' }}>
                      Perguntas públicas abertas e autenticação exigida apenas na solicitação de serviços
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qualquer cidadão ou visitante pode consultar informações no Concierge IA sem login. A assinatura
                      NID é solicitada somente ao executar um serviço oficial.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Container>
      </Box>

      {/* 2. CABEÇALHO INSTITUCIONAL (Estilo america.gov com Menu Hambúrguer ☰ + Título Ampliado + Status do Usuário) */}
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
          <Toolbar disableGutters sx={{ py: 1.5, justifyContent: 'space-between', gap: 2 }}>
            {/* Esquerda: Botão Hambúrguer (☰) + Brasão + Título Institucional Ampliado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setNavDrawerOpen(true)}
                sx={{
                  border: '1px solid #d1d5db',
                  borderRadius: 2,
                  p: 1,
                  color: '#0a2240',
                  bgcolor: '#ffffff',
                  '&:hover': { bgcolor: '#f3f4f6', borderColor: '#0a2240' }
                }}
                aria-label="Abrir Menu de Navegação da Nação"
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
                    Governo da República de Novatlantis
                  </Typography>
                  <Chip
                    label="Portal Principal da Nação"
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
                  Chancelaria Digital • Agente Orquestrador de Estado • Módulo de Usuários GDF (100.000 Cidadãos)
                </Typography>
              </Box>
            </Box>

            {/* Direita: APENAS o Item do Status do Usuário com Foto / Login NID */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TopNavUserWidget
                currentNid={currentUser?.nid}
                openLoginTrigger={loginTriggerCount}
                loginReasonMessage={loginReasonMessage}
                citizenPortalUrl={CITIZEN_PORTAL_URL}
                govBackstageUrl={GOV_BACKSTAGE_URL}
                onUserAuthenticated={async (nid, _authProfile, token) => {
                  if (token) setSsoToken(token);
                  const loadedProfile = await loadFullCitizenContext(nid);
                  // Se o cidadão clicou em "Solicitar Serviço" antes de estar logado, executa agora!
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

      {/* MENU HAMBÚRGUER GLOBAL DA NAÇÃO (Drawer Lateral Estilo america.gov) */}
      <Drawer
        anchor="left"
        open={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        PaperProps={{
          sx: { width: 330, bgcolor: '#fcfbf9', borderRight: '1px solid #e5e4dc' }
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: '#0a2240', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              República de Novatlantis
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
              Diretório Nacional de Serviços
            </Typography>
          </Box>
          <IconButton onClick={() => setNavDrawerOpen(false)} sx={{ color: '#ffffff' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ py: 1.5 }}>
          <Box sx={{ px: 2.5, py: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.06em' }}>
              AMBIENTES OFICIAIS DO ESTADO
            </Typography>
          </Box>

          <ListItemButton
            onClick={() => {
              setNavDrawerOpen(false);
              handleNavigateToPortal('citizen', 'identity');
            }}
          >
            <ListItemIcon>
              <BadgeIcon sx={{ color: '#0a2240' }} />
            </ListItemIcon>
            <ListItemText
              primary="Portal do Cidadão"
              secondary={currentUser ? `Autenticado: ${currentUser.nid}` : 'Requer login NID ao acessar'}
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => {
              setNavDrawerOpen(false);
              handleNavigateToPortal('backstage');
            }}
          >
            <ListItemIcon>
              <AdminIcon sx={{ color: '#0f766e' }} />
            </ListItemIcon>
            <ListItemText
              primary="Backstage Governamental"
              secondary="Servidores Públicos, Médicos, Professores e PM"
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ px: 2.5, py: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.06em' }}>
              PERGUNTAR AO CONCIERGE (SEM LOGIN)
            </Typography>
          </Box>

          {POPULAR_SERVICES.map((srv) => (
            <ListItemButton
              key={srv.id}
              onClick={() => {
                setNavDrawerOpen(false);
                sendToConcierge(srv.questionPrompt);
              }}
            >
              <ListItemIcon>{srv.icon}</ListItemIcon>
              <ListItemText
                primary={srv.title}
                secondary={srv.agency}
                primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.73rem' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

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
                  ? `SESSÃO AUTENTICADA • ${currentUser.full_name.toUpperCase()} (${currentUser.nid})`
                  : 'PORTA DE ENTRADA DIGITAL DA NAÇÃO • PERGUNTE SEM PRECISAR DE LOGIN'
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
              {currentUser ? `Olá, ${currentUser.full_name.split(' ')[0]}.` : 'Olá, Novatlantis.'}
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
              Tudo o que você precisa do governo, comece por aqui.
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
                placeholder="Pergunte qualquer coisa sobre serviços públicos, passaporte, saúde, educação, impostos ou abertura de empresas..."
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
                {/* Botões utilitários estilo america.gov (Simplificador de Documento Oficial + Indicador de Login) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DescriptionIcon fontSize="small" />}
                    onClick={() =>
                      sendToConcierge(
                        'Explique em linguagem simples os requisitos e documentos para emitir o Passaporte Digital ICAO e abrir uma empresa em 45 segundos.'
                      )
                    }
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
                    Simplificar Formulário / Regra Oficial
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
                        ? `Logado: ${currentUser.nid}`
                        : 'Chat Público Livre (Login só ao solicitar serviço)'
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
                    onClick={() => sendToConcierge('Como funciona o atendimento de Telemedicina 24/7 e o prontuário HL7?')}
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
                    {chatLoading ? 'Consultando...' : 'Perguntar'}
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
            {[
              'Como emitir meu Passaporte Digital ICAO?',
              'Como abrir uma empresa em 45 segundos?',
              'Como agendar teleconsulta médica 24/7?',
              'Como consultar o boletim escolar dos meus filhos?',
              'Como abrir um chamado urbano 311?',
              'Como funciona o acesso ao Backstage Governamental?'
            ].map((pill) => (
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
                      CONCIERGE OFICIAL DA REPÚBLICA DE NOVATLANTIS
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setChatMessages([])}
                    sx={{ textTransform: 'none', color: '#6b7280', fontSize: '0.78rem' }}
                  >
                    Limpar conversa
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
                                FONTES OFICIAIS & LEGISLAÇÃO CITADA:
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
                                Acompanhar no Portal do Cidadão
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
                                {currentUser
                                  ? 'Executar Serviço Agora'
                                  : 'Solicitar Serviço (Fazer Login NID)'}
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
              SERVIÇOS PÚBLICOS DIGITAIS • REPÚBLICA DE NOVATLANTIS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0a2240', fontFamily: '"Merriweather", serif' }}>
              Serviços mais procurados pelos cidadãos
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
              Portal do Cidadão
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
              Backstage Governamental
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
                      {srv.agency}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0a2240', mb: 1, fontSize: '1.08rem' }}>
                    {srv.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.55, mb: 2.5 }}>
                    {srv.description}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid #f3f4f6' }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => sendToConcierge(srv.questionPrompt)}
                    sx={{ textTransform: 'none', fontWeight: 700, color: '#0a2240' }}
                  >
                    Tirar Dúvida
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={() => handleRequestService(srv.servicePrompt, srv.title)}
                    sx={{
                      ml: 'auto',
                      bgcolor: '#0a2240',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#163a66' }
                    }}
                  >
                    Solicitar Serviço
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
                    Governo da República Digital de Novatlantis
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                    Um portal desenhado para servir ao cidadão • AlloyDB + Government Data Platform
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                Projeto GCP: <code>novatlantis</code> • Base Soberana: 100.000 Cidadãos
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                Autenticação Zero-Trust • Perguntas Públicas sem Login • Transações Assinadas com NID
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
