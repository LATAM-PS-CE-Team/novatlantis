import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Chip,
  Stack,
  Alert,
  Paper,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import {
  Shield,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Stethoscope,
  GraduationCap,
  Siren,
  Wrench,
  Lock,
  Unlock,
  ExternalLink,
  Award,
  Scale,
  Users,
  Database,
  ArrowLeft,
  Home,
  UserCheck
} from 'lucide-react';
import { novatlantisTheme } from './theme';
import { TopNavUserWidget } from './components/TopNavUserWidget';

type Language = 'pt-BR' | 'es-419' | 'en-US';
type BackstageTab = 'pm_cabinet' | 'iam360' | 'health_mgmt' | 'edu_mgmt' | 'ops_311_911' | 'justice_datalake';

const LANDING_PORTAL_URL = 'https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app';
const CITIZEN_PORTAL_URL = 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app';

const BACKSTAGE_MENU_ITEMS: { id: BackstageTab; title: string; subtitle: string }[] = [
  {
    id: 'pm_cabinet',
    title: '1. Gabinete Primeiro-Ministro & Secretário-Geral',
    subtitle: 'Comando executivo da nação e KPIs soberanos'
  },
  {
    id: 'iam360',
    title: '2. Identidade 360 (Gestão RBAC/ABAC)',
    subtitle: 'Concessão e revogação de acesso administrativo'
  },
  {
    id: 'health_mgmt',
    title: '3. Gestão da Saúde (Hospitais & Médicos)',
    subtitle: 'Rede hospitalar HL7 FHIR e fila de telemedicina'
  },
  {
    id: 'edu_mgmt',
    title: '4. Gestão da Educação (Escolas, Provas & Notas)',
    subtitle: 'Lançamento de notas, frequência e avaliações'
  },
  {
    id: 'ops_311_911',
    title: '5. Comando 311 & 911 (Demandas do Cidadão)',
    subtitle: 'Resolução de chamados urbanos e despacho tático'
  },
  {
    id: 'justice_datalake',
    title: '6. Justiça, Tesouro, AlloyDB & GDP 100k',
    subtitle: 'Explorador de 100.000 cidadãos e auditoria fiscal'
  }
];

export default function App() {
  const [lang, setLang] = useState<Language>('pt-BR');
  const [backstageTab, setBackstageTab] = useState<BackstageTab>('pm_cabinet');
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [loginTriggerCount, setLoginTriggerCount] = useState(0);
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Backstage Data States
  const [backstageOverview, setBackstageOverview] = useState<any>(null);
  const [iamState, setIamState] = useState<any>(null);
  const [healthBackstage, setHealthBackstage] = useState<any>(null);
  const [eduBackstage, setEduBackstage] = useState<any>(null);
  const [opsBackstage, setOpsBackstage] = useState<any>(null);
  const [justiceBackstage, setJusticeBackstage] = useState<any>(null);
  const [datalakeExplorerResults, setDatalakeExplorerResults] = useState<any[]>([]);
  const [datalakeFilter, setDatalakeFilter] = useState('NID-000');

  // Forms
  const [iamTargetNid, setIamTargetNid] = useState('NID-000-0000-0005-1');
  const [iamSelectedRole, setIamSelectedRole] = useState('DOCTOR_TELEMED');
  const [examSchool, setExamSchool] = useState('Liceu Politécnico de Inteligência Artificial');
  const [examSubject, setExamSubject] = useState('IA & Robótica');
  const [examTitle, setExamTitle] = useState('');
  const [gradeStudentNid, setGradeStudentNid] = useState('NID-000-0000-0010-8');
  const [gradeMath, setGradeMath] = useState(95);
  const [gradeSci, setGradeSci] = useState(92);
  const [gradeAi, setGradeAi] = useState(99);
  const [gradeLang, setGradeLang] = useState(91);

  const loadUserSession = async (identifier: string) => {
    if (!identifier) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUser(data.citizen);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllBackstageData = async () => {
    try {
      const [ovRes, iamRes, hRes, eRes, oRes, jRes, dlRes] = await Promise.all([
        fetch('/api/backstage/overview'),
        fetch('/api/iam360/roles'),
        fetch('/api/backstage/health'),
        fetch('/api/backstage/education'),
        fetch('/api/backstage/operations'),
        fetch('/api/backstage/justice-treasury'),
        fetch(`/api/gdf/search?q=${encodeURIComponent(datalakeFilter)}&limit=25`)
      ]);
      setBackstageOverview(await ovRes.json());
      setIamState(await iamRes.json());
      setHealthBackstage(await hRes.json());
      setEduBackstage(await eRes.json());
      setOpsBackstage(await oRes.json());
      setJusticeBackstage(await jRes.json());
      const dlData = await dlRes.json();
      setDatalakeExplorerResults(dlData.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // IMPORTANTE: Nenhum usuário inicia logado sem cookie/token válido no TopNavUserWidget
    loadAllBackstageData();
  }, []);

  const handleCitizenSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/gdf/search?q=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const res = await fetch('/api/iam360/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_nid: currentUser.nid,
        target_nid: iamTargetNid,
        new_role: iamSelectedRole
      })
    });
    const data = await res.json();
    if (data.updated) {
      setStatusMessage(
        `IDENTIDADE 360: Permissão [${iamSelectedRole}] concedida a ${data.target_citizen.full_name} (${data.target_citizen.nid}). Acesso administrativo liberado.`
      );
      if (currentUser.nid === iamTargetNid) {
        loadUserSession(currentUser.nid);
      }
      loadAllBackstageData();
    } else if (data.error) {
      setStatusMessage(`ERRO IAM 360: ${data.error}`);
    }
  };

  const handleRevokeRole = async (targetNid: string) => {
    if (!currentUser) return;
    const res = await fetch('/api/iam360/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_nid: currentUser.nid,
        target_nid: targetNid
      })
    });
    const data = await res.json();
    if (data.revoked) {
      setStatusMessage(
        `IDENTIDADE 360: Permissão administrativa de ${data.target_citizen.full_name} (${targetNid}) REVOGADA. Usuário revertido imediatamente para CITIZEN_COMMON.`
      );
      if (currentUser.nid === targetNid) {
        loadUserSession(currentUser.nid);
      }
      loadAllBackstageData();
    } else if (data.error) {
      setStatusMessage(`ERRO IAM 360: ${data.error}`);
    }
  };

  const handleResolve311 = async (ticketId: string) => {
    if (!currentUser) return;
    const res = await fetch('/api/services/311/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: ticketId,
        actor_nid: currentUser.nid
      })
    });
    const data = await res.json();
    if (data.resolved) {
      setStatusMessage(`Chamado 311 #${ticketId} concluído com sucesso por ${currentUser.full_name}.`);
      loadAllBackstageData();
    }
  };

  const handleUpdateStudentGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const res = await fetch('/api/backstage/education/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_nid: currentUser.nid,
        student_nid: gradeStudentNid,
        score_mathematics: gradeMath,
        score_sciences: gradeSci,
        score_ai_robotics: gradeAi,
        score_languages: gradeLang,
        attendance_rate: 98.5
      })
    });
    const data = await res.json();
    if (data.updated) {
      setStatusMessage(`Notas escolares do aluno ${gradeStudentNid} atualizadas no Datalake GDF.`);
      loadAllBackstageData();
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const res = await fetch('/api/backstage/education/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_nid: currentUser.nid,
        school_name: examSchool,
        subject: examSubject,
        title: examTitle || `Avaliação Nacional de ${examSubject}`,
        grade_level: '6º Ano Fundamental'
      })
    });
    const data = await res.json();
    if (data.created) {
      setExamTitle('');
      setStatusMessage(`Prova #${data.exam.exam_id} publicada na rede nacional de ensino.`);
      loadAllBackstageData();
    }
  };

  const handleSearchDatalake = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/gdf/search?q=${encodeURIComponent(datalakeFilter)}&limit=30`);
    const data = await res.json();
    setDatalakeExplorerResults(data.results || []);
  };

  const activeMenuObj = BACKSTAGE_MENU_ITEMS.find((m) => m.id === backstageTab) || BACKSTAGE_MENU_ITEMS[0];

  return (
    <ThemeProvider theme={novatlantisTheme}>
      <CssBaseline />
      <div className="min-h-screen bg-[#fcfbf9] text-[#111827] flex flex-col">
        {/* 1. FAIXA OFICIAL SUPERIOR (Estilo america.gov) */}
        <Box sx={{ bgcolor: '#f1f0ec', borderBottom: '1px solid #e2e0d8', py: 0.65, px: 2 }}>
          <Container maxWidth="xl" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <img src="/assets/flag.jpg" alt="Bandeira" className="h-3.5 w-5 object-cover border border-slate-300 rounded-sm" />
              <Typography variant="caption" sx={{ color: '#1f2937', fontWeight: 600, fontSize: '0.76rem' }}>
                Um site oficial do Governo da República Digital de Novatlantis • Backstage Governamental
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <a
                href={ssoToken ? `${LANDING_PORTAL_URL}?sso_token=${encodeURIComponent(ssoToken)}` : LANDING_PORTAL_URL}
                className="text-[#0a2240] hover:underline flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Home Page (Concierge IA)
              </a>
              <a
                href={ssoToken ? `${CITIZEN_PORTAL_URL}?sso_token=${encodeURIComponent(ssoToken)}` : CITIZEN_PORTAL_URL}
                className="text-[#0a2240] hover:underline flex items-center gap-1 text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5" /> Portal do Cidadão
              </a>
            </Stack>
          </Container>
        </Box>

        {/* 2. CABEÇALHO DO BACKSTAGE GOVERNAMENTAL (Design System america.gov + Botão Hambúrguer ☰) */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(252, 251, 249, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#0a2240',
            borderBottom: '1px solid #e5e4dc',
            zIndex: 30
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={() => setHamburgerOpen(true)}
                  sx={{
                    border: '1px solid #d1d5db',
                    borderRadius: 2,
                    p: 1,
                    color: '#0a2240',
                    bgcolor: '#ffffff',
                    '&:hover': { bgcolor: '#f3f4f6', borderColor: '#0a2240' }
                  }}
                  aria-label="Abrir Menu Hambúrguer do Backstage Governamental"
                >
                  <MenuIcon />
                </IconButton>

                <Box
                  component="img"
                  src="/assets/coat_of_arms.jpg"
                  alt="Brasão"
                  sx={{
                    height: { xs: 44, md: 54 },
                    width: { xs: 44, md: 54 },
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1.5px solid #0a2240'
                  }}
                />
                <Box>
                  <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                    <Typography
                      sx={{
                        fontSize: { xs: '1.15rem', sm: '1.45rem', md: '1.75rem' },
                        fontWeight: 900,
                        color: '#0a2240',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15
                      }}
                    >
                      Governo da República de Novatlantis
                    </Typography>
                    <Chip
                      label="Backstage Governamental & Identidade 360"
                      size="small"
                      sx={{
                        bgcolor: '#0a2240',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: 25
                      }}
                    />
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: { xs: '0.78rem', sm: '0.92rem', md: '1.02rem' },
                      fontWeight: 600,
                      color: '#374151'
                    }}
                  >
                    {currentUser?.backstage_allowed
                      ? `Ambiente Ativo (☰): ${activeMenuObj.title}`
                      : 'Chancelaria Digital • Agente Orquestrador de Estado • Módulo de Usuários GDF (100.000 Cidadãos)'}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TopNavUserWidget
                  currentNid={currentUser?.nid}
                  openLoginTrigger={loginTriggerCount}
                  citizenPortalUrl={CITIZEN_PORTAL_URL}
                  govBackstageUrl={window.location.origin}
                  onUserAuthenticated={(nid, _user, token) => {
                    if (token) setSsoToken(token);
                    loadUserSession(nid);
                  }}
                  onUserLoggedOut={() => {
                    setCurrentUser(null);
                    setSsoToken(null);
                  }}
                />
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* MENU HAMBÚRGUER VERTICAL (☰) PARA NAVEGAR ENTRE OS AMBIENTES DO BACKSTAGE */}
        <Drawer
          anchor="left"
          open={hamburgerOpen}
          onClose={() => setHamburgerOpen(false)}
          PaperProps={{
            sx: { width: 350, bgcolor: '#fcfbf9', borderRight: '1px solid #e5e4dc' }
          }}
        >
          <Box
            sx={{
              p: 2.5,
              bgcolor: '#0a2240',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Menu do Backstage (☰)
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                {currentUser ? `${currentUser.full_name} (${currentUser.effective_role_code})` : 'Autenticação Necessária'}
              </Typography>
            </Box>
            <IconButton onClick={() => setHamburgerOpen(false)} sx={{ color: '#ffffff' }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ py: 1.5 }}>
            <Box sx={{ px: 2.5, py: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#6b7280', letterSpacing: '0.06em' }}>
                AMBIENTES ADMINISTRATIVOS DO ESTADO
              </Typography>
            </Box>

            {BACKSTAGE_MENU_ITEMS.map((item) => (
              <ListItemButton
                key={item.id}
                selected={backstageTab === item.id}
                onClick={() => {
                  setBackstageTab(item.id);
                  setHamburgerOpen(false);
                }}
                sx={{ py: 1.35 }}
              >
                <ListItemText
                  primary={item.title}
                  secondary={item.subtitle}
                  primaryTypographyProps={{
                    fontWeight: backstageTab === item.id ? 800 : 600,
                    fontSize: '0.88rem',
                    color: '#0a2240'
                  }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItemButton>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <ListItemButton
              component="a"
              href={ssoToken ? `${LANDING_PORTAL_URL}?sso_token=${encodeURIComponent(ssoToken)}` : LANDING_PORTAL_URL}
            >
              <ListItemIcon>
                <ArrowBackIcon sx={{ color: '#0a2240' }} />
              </ListItemIcon>
              <ListItemText
                primary="Voltar à Home Page (Concierge IA)"
                secondary="Portal Principal da Nação"
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.88rem' }}
              />
            </ListItemButton>
          </List>
        </Drawer>

        {/* BANNER DE STATUS OPERACIONAL */}
        {statusMessage && (
          <Container maxWidth="xl" sx={{ pt: 2 }}>
            <Alert
              severity="info"
              onClose={() => setStatusMessage(null)}
              sx={{ bgcolor: '#dae2ff', color: '#001848', borderLeft: '4px solid #002046', fontWeight: 600 }}
            >
              {statusMessage}
            </Alert>
          </Container>
        )}

        {/* CONTEÚDO PRINCIPAL DO BACKSTAGE */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {!currentUser ? (
          <Paper
            elevation={0}
            sx={{
              maxWidth: 650,
              mx: 'auto',
              mt: 4,
              p: { xs: 3.5, md: 5 },
              textAlign: 'center',
              borderRadius: 4,
              bgcolor: '#ffffff',
              border: '1px solid #e5e4dc',
              boxShadow: '0 16px 40px -12px rgba(10, 34, 64, 0.08)'
            }}
          >
            <ShieldIcon sx={{ fontSize: 48, color: '#0a2240', mb: 2 }} />
            <Typography
              variant="h4"
              sx={{ fontFamily: '"Merriweather", Georgia, serif', fontWeight: 700, color: '#0a2240', mb: 1.5 }}
            >
              Backstage Governamental • Identidade 360
            </Typography>
            <Typography variant="body1" sx={{ color: '#4b5563', mb: 3.5, lineHeight: 1.6 }}>
              Nenhum servidor público está logado no momento. O acesso ao Backstage Governamental exige autenticação
              com um NID que possua nomeação ativa na aplicação <strong>Identidade 360</strong> (Primeiro-Ministro,
              Secretário-Geral, Gestor IAM 360, Médico, Professor ou Comando 311/911).
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShieldIcon />}
                onClick={() => setLoginTriggerCount((c) => c + 1)}
                sx={{
                  bgcolor: '#0a2240',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 3.5,
                  py: 1.25,
                  '&:hover': { bgcolor: '#163a66' }
                }}
              >
                Entrar com NID (Servidor Público)
              </Button>
              <Button
                variant="outlined"
                size="large"
                href={LANDING_PORTAL_URL}
                sx={{
                  borderColor: '#0a2240',
                  color: '#0a2240',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 3
                }}
              >
                Voltar à Home Page
              </Button>
            </Box>
          </Paper>
        ) : !currentUser.backstage_allowed ? (
          <div className="bg-white border-2 border-red-800 rounded p-8 max-w-3xl mx-auto my-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 text-red-900">
              <AlertTriangle className="w-8 h-8 text-red-700 shrink-0" />
              <div>
                <div className="font-mono text-xs uppercase font-bold text-red-700">
                  POLÍTICA ZERO-TRUST • APLICAÇÃO IDENTIDADE 360 (RBAC/ABAC)
                </div>
                <h2 className="font-serif-authority text-2xl font-bold text-[#002046]">
                  Acesso ao Backstage Governamental Restrito
                </h2>
              </div>
            </div>

            <p className="text-sm text-[#43474f] leading-relaxed">
              O usuário autenticado <strong>{currentUser.full_name}</strong> (<code className="font-mono">{currentUser.nid}</code> •{' '}
              <code className="font-mono">{currentUser.email}</code>) possui atualmente o perfil{' '}
              <strong className="font-mono text-red-800">CITIZEN_COMMON (Cidadão Comum)</strong> na aplicação{' '}
              <strong>Identidade 360</strong>. Conforme a diretriz soberana da República de Novatlantis, cidadãos comuns ou ex-servidores cuja permissão profissional foi revogada não têm acesso aos ambientes administrativos do Backstage.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={ssoToken ? `${CITIZEN_PORTAL_URL}?sso_token=${encodeURIComponent(ssoToken)}` : CITIZEN_PORTAL_URL}
                className="bg-[#002046] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#00356e] transition flex items-center gap-2"
              >
                Ir para o Portal do Cidadão ({currentUser.full_name})
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLoginTriggerCount((c) => c + 1)}
                className="bg-[#dae2ff] text-[#001848] px-4 py-2.5 rounded text-xs font-bold hover:bg-[#b4c5ff] transition"
              >
                Alternar para Conta de Servidor Público (Login NID)
              </button>
            </div>
          </div>
        ) : (
          currentUser && (
            <>
              {/* Barra de Ambiente Atual com Atalho para o Menu Hambúrguer (☰) */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e5e4dc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MenuIcon />}
                    onClick={() => setHamburgerOpen(true)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#0a2240',
                      color: '#0a2240',
                      borderRadius: 2
                    }}
                  >
                    Alternar Ambiente (☰)
                  </Button>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a2240' }}>
                      {activeMenuObj.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activeMenuObj.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`Servidor Autenticado: ${currentUser.full_name} (${currentUser.effective_role_code})`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                />
              </Paper>

              {/* AMBIENTE 1: GABINETE DO PRIMEIRO-MINISTRO (JOPOCO) & SECRETÁRIO-GERAL */}
              {backstageTab === 'pm_cabinet' && (
                <div className="space-y-6">
                  <div className="bg-[#002046] text-white rounded p-6 border-b-4 border-[#b4c5ff] flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-mono text-xs uppercase text-[#b4c5ff]">
                        CHANCELARIA SUPREMA DE NOVATLANTIS • COMANDO EXECUTIVO DA NAÇÃO
                      </div>
                      <h2 className="font-serif-authority text-2xl font-bold">
                        Gabinete do Primeiro-Ministro (Jopoco) & Secretaria-Geral
                      </h2>
                      <p className="text-xs text-slate-300">
                        Visão consolidada do Government Data Fabric (100.000 cidadãos), servidores públicos ativos e execução orçamentária.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBackstageTab('iam360')}
                        className="bg-[#b4c5ff] text-[#001848] px-4 py-2 rounded text-xs font-bold hover:bg-white transition"
                      >
                        Gerenciar Permissões na Identidade 360
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <div className="text-xs text-slate-500 font-mono uppercase">População Total GDF</div>
                      <div className="text-2xl font-mono font-bold text-[#002046] mt-1">
                        {backstageOverview?.kpis?.total_citizens?.toLocaleString('pt-BR') || '100.000'}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono mt-1">100% Identidades Mod-11</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <div className="text-xs text-slate-500 font-mono uppercase">Vínculos Familiares</div>
                      <div className="text-2xl font-mono font-bold text-[#002046] mt-1">
                        {backstageOverview?.kpis?.total_family_links?.toLocaleString('pt-BR') || '71.425'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-1">Tabela rel_family_graph</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <div className="text-xs text-slate-500 font-mono uppercase">Médicos Credenciados</div>
                      <div className="text-2xl font-mono font-bold text-[#002046] mt-1">
                        {backstageOverview?.kpis?.total_doctors?.toLocaleString('pt-BR') || '589'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-1">6 Unidades Hospitalares</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <div className="text-xs text-slate-500 font-mono uppercase">Professores na Rede</div>
                      <div className="text-2xl font-mono font-bold text-[#002046] mt-1">
                        {backstageOverview?.kpis?.total_teachers?.toLocaleString('pt-BR') || '912'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-1">20.440 Alunos Matriculados</div>
                    </div>
                  </div>
                </div>
              )}

              {/* AMBIENTE 2: IDENTIDADE 360 (GESTÃO DE ACESSOS RBAC/ABAC) */}
              {backstageTab === 'iam360' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-6 space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <div className="font-mono text-[10px] uppercase text-[#00356e] font-bold">
                        GOVERNANÇA SOBERANA DE IDENTIDADES • IAM 360
                      </div>
                      <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                        Conceder Permissão Administrativa a um Cidadão
                      </h3>
                      <p className="text-xs text-[#43474f]">
                        O Primeiro-Ministro (`jopoco`), o Secretário-Geral e o Gestor de Identidades 360 concedem ou revogam acessos profissionais ao Backstage.
                      </p>
                    </div>

                    <form onSubmit={handleGrantRole} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#002046] mb-1">
                          NID do Cidadão / Servidor (Qualquer dos 100.000 cidadãos)
                        </label>
                        <input
                          type="text"
                          value={iamTargetNid}
                          onChange={(e) => setIamTargetNid(e.target.value)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#002046] mb-1">
                          Papel Governamental na Identidade 360
                        </label>
                        <select
                          value={iamSelectedRole}
                          onChange={(e) => setIamSelectedRole(e.target.value)}
                          className="w-full border border-slate-300 rounded px-3 py-2"
                        >
                          <option value="IDENTITY_MANAGER_360">IDENTITY_MANAGER_360 (Gestor de Identidades 360)</option>
                          <option value="SECRETARY_GENERAL">SECRETARY_GENERAL (Secretário-Geral)</option>
                          <option value="DOCTOR_AND_HEALTH_MANAGER">DOCTOR_AND_HEALTH_MANAGER (Gestor de Saúde & Médico)</option>
                          <option value="DOCTOR_TELEMED">DOCTOR_TELEMED (Médico de Telemedicina)</option>
                          <option value="TEACHER_AND_EDU_MANAGER">TEACHER_AND_EDU_MANAGER (Gestor de Educação & Professor)</option>
                          <option value="TEACHER_EDUCATOR">TEACHER_EDUCATOR (Professor da Rede Pública)</option>
                          <option value="OPERATIONS_311_911_MANAGER">OPERATIONS_311_911_MANAGER (Comandante 311/911)</option>
                          <option value="JUSTICE_AND_TREASURY_MANAGER">JUSTICE_AND_TREASURY_MANAGER (Magistrado & Tesouro)</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
                      >
                        Conceder Permissão na Identidade 360
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                          Servidores Públicos com Acesso Ativo ao Backstage
                        </h3>
                        <p className="text-xs text-[#43474f]">
                          Ao clicar em <strong>Revogar Permissão</strong>, o servidor volta imediatamente a ser <code className="font-mono">CITIZEN_COMMON</code> e perde o acesso administrativo.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {(iamState?.privileged_servants || []).map((srv: any) => (
                        <div
                          key={srv.nid}
                          className="p-3 rounded bg-[#f8f9fb] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#002046]">{srv.full_name}</div>
                            <div className="font-mono text-[11px] text-[#43474f]">
                              {srv.nid} • {srv.email} • {srv.profession}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#dae2ff] text-[#001848] font-bold">
                              {srv.iam_role}
                            </span>
                            {srv.nid !== 'NID-000-0000-0001-9' && (
                              <button
                                onClick={() => handleRevokeRole(srv.nid)}
                                className="px-2.5 py-1 rounded bg-red-800 text-white text-[11px] font-semibold hover:bg-red-900 transition"
                              >
                                Revogar Permissão
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AMBIENTE 3: GESTÃO DA SAÚDE (HOSPITAIS, CLÍNICAS, MÉDICOS E TELEMEDICINA) */}
              {backstageTab === 'health_mgmt' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-3">
                      <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                        Rede Nacional de Hospitais e Clínicas
                      </h3>
                      <div className="space-y-2 text-xs">
                        {(healthBackstage?.facilities || []).map((f: any) => (
                          <div key={f.facility_id} className="p-3 rounded bg-[#f8f9fb] border border-slate-200 flex justify-between">
                            <div>
                              <div className="font-bold text-[#002046]">{f.name}</div>
                              <div className="text-[11px] text-slate-600">
                                {f.district} • Diretor: {f.director}
                              </div>
                            </div>
                            <div className="text-right font-mono text-[11px]">
                              <div className="text-emerald-700 font-bold">Ocupação: {f.occupancy_rate}%</div>
                              <div>Fila Telemed: {f.telemed_queue}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-3">
                      <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                        Corpo Clínico & Atendimento de Telemedicina
                      </h3>
                      <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                        {(healthBackstage?.telemed_consultations || []).map((c: any) => (
                          <div key={c.consult_id} className="p-3 rounded bg-[#f8f9fb] border border-slate-200 space-y-1">
                            <div className="flex justify-between font-mono text-[11px]">
                              <strong className="text-[#002046]">
                                {c.consult_id} • Paciente: {c.patient_name} ({c.patient_nid})
                              </strong>
                              <span className="text-emerald-700 font-bold">{c.status}</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Médico Responsável: <strong>{c.doctor_name}</strong> • {c.facility}
                            </div>
                            <div className="text-[#191c1e]">{c.ai_clinical_summary}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AMBIENTE 4: GESTÃO DA EDUCAÇÃO (ESCOLAS, PROFESSORES, PROVAS E NOTAS POR MATÉRIA) */}
              {backstageTab === 'edu_mgmt' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                      Diário de Classe do Professor • Lançamento de Notas por Matéria
                    </h3>
                    <form onSubmit={handleUpdateStudentGrades} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#002046] mb-1">NID do Aluno Matriculado</label>
                        <input
                          type="text"
                          value={gradeStudentNid}
                          onChange={(e) => setGradeStudentNid(e.target.value)}
                          className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-[#002046] mb-1">Matemática</label>
                          <input
                            type="number"
                            value={gradeMath}
                            onChange={(e) => setGradeMath(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#002046] mb-1">Ciências</label>
                          <input
                            type="number"
                            value={gradeSci}
                            onChange={(e) => setGradeSci(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#002046] mb-1">IA & Robótica</label>
                          <input
                            type="number"
                            value={gradeAi}
                            onChange={(e) => setGradeAi(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#002046] mb-1">Idiomas</label>
                          <input
                            type="number"
                            value={gradeLang}
                            onChange={(e) => setGradeLang(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#002046] text-white font-bold py-2 rounded hover:bg-[#00356e] transition"
                      >
                        Atualizar Notas Escolares no GDF
                      </button>
                    </form>

                    <form onSubmit={handleCreateExam} className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                      <div className="font-serif-authority font-bold text-sm text-[#002046]">
                        Aplicar Nova Prova Nacional
                      </div>
                      <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="Título da Avaliação (ex: Prova Semestral de Robótica)"
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                      <button
                        type="submit"
                        className="w-full bg-[#00356e] text-white font-bold py-2 rounded hover:bg-[#002046] transition"
                      >
                        Publicar e Aplicar Prova
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-3">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                      Alunos Matriculados & Desempenho por Matéria (`edu_enrollments`)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 bg-[#f2f4f6] font-mono text-[10px] uppercase text-[#002046]">
                            <th className="p-2">Aluno / NID</th>
                            <th className="p-2">Escola / Série</th>
                            <th className="p-2">Mat</th>
                            <th className="p-2">Ciên</th>
                            <th className="p-2">IA & Rob</th>
                            <th className="p-2">Idiom</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(eduBackstage?.student_enrollments || []).slice(0, 10).map((st: any) => (
                            <tr key={st.enrollment_id} className="border-b border-slate-100 hover:bg-[#f8f9fb]">
                              <td className="p-2">
                                <div className="font-bold text-[#002046]">{st.student_name}</div>
                                <div className="font-mono text-[10px] text-slate-500">{st.student_nid}</div>
                              </td>
                              <td className="p-2 text-[11px]">
                                {st.school_id} • {st.grade_level}
                              </td>
                              <td className="p-2 font-mono font-bold">{st.score_mathematics}</td>
                              <td className="p-2 font-mono font-bold">{st.score_sciences}</td>
                              <td className="p-2 font-mono font-bold text-[#00356e]">{st.score_ai_robotics}</td>
                              <td className="p-2 font-mono font-bold">{st.score_languages}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* AMBIENTE 5: COMANDO OPERACIONAL 311 & 911 */}
              {backstageTab === 'ops_311_911' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-3">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                      Fila de Demandas Urbanas 311 Enviadas pelos Cidadãos
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {(opsBackstage?.tickets_311 || []).map((tk: any) => (
                        <div key={tk.ticket_id} className="p-3.5 rounded bg-[#f8f9fb] border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#002046]">
                              #{tk.ticket_id} • {tk.category}
                            </span>
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                                tk.status === 'CONCLUIDO'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {tk.status}
                            </span>
                          </div>
                          <div className="text-[#191c1e]">{tk.description}</div>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                            <span>
                              Solicitante: <strong>{tk.citizen_name}</strong> ({tk.citizen_nid}) • {tk.district}
                            </span>
                            {tk.status !== 'CONCLUIDO' && (
                              <button
                                onClick={() => handleResolve311(tk.ticket_id)}
                                className="bg-[#002046] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#00356e]"
                              >
                                Concluir Atendimento 311
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-3">
                    <h3 className="font-serif-authority text-lg font-bold text-red-900">
                      Despachos de Emergência 911 em Tempo Real
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {(opsBackstage?.dispatches_911 || []).map((dp: any) => (
                        <div key={dp.dispatch_id} className="p-3.5 rounded bg-red-50/60 border border-red-200 space-y-1">
                          <div className="flex justify-between font-mono text-[11px] font-bold text-red-900">
                            <span>#{dp.dispatch_id} • {dp.emergency_type}</span>
                            <span>ETA: {dp.eta_minutes} min</span>
                          </div>
                          <div className="text-[#191c1e] font-medium">{dp.ai_protocol}</div>
                          <div className="text-[11px] text-slate-600">
                            Cidadão: {dp.citizen_name} ({dp.citizen_nid}) • {dp.district}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AMBIENTE 6: JUSTIÇA, TESOURO & EXPLORADOR DO DATALAKE DE 100.000 CIDADÃOS */}
              {backstageTab === 'justice_datalake' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                          Explorador AlloyDB & Government Data Platform (100.000 Cidadãos)
                        </h3>
                        <p className="text-xs text-[#43474f]">
                          Cluster AlloyDB: <code className="font-mono font-bold">novatlantis-sovereign-cluster (10.223.28.2:5432)</code> • BigQuery GDP: <code className="font-mono font-bold">novatlantis_gdp_dwh_cur_bq_0</code>
                        </p>
                      </div>
                      <form onSubmit={handleSearchDatalake} className="flex gap-2 text-xs">
                        <input
                          type="text"
                          value={datalakeFilter}
                          onChange={(e) => setDatalakeFilter(e.target.value)}
                          placeholder="Filtrar por nome, NID, profissão ou e-mail..."
                          className="border border-slate-300 rounded px-3 py-1.5 w-64"
                        />
                        <button
                          type="submit"
                          className="bg-[#002046] text-white px-4 py-1.5 rounded font-bold hover:bg-[#00356e]"
                        >
                          Consultar AlloyDB / GDP 100k
                        </button>
                      </form>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 bg-[#f2f4f6] font-mono text-[10px] uppercase text-[#002046]">
                            <th className="p-2">NID</th>
                            <th className="p-2">Nome Civil</th>
                            <th className="p-2">Idade</th>
                            <th className="p-2">Profissão & Especialidade</th>
                            <th className="p-2">Distrito</th>
                            <th className="p-2">Papel IAM 360</th>
                            <th className="p-2">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datalakeExplorerResults.map((row: any) => (
                            <tr key={row.nid} className="border-b border-slate-100 hover:bg-[#f8f9fb]">
                              <td className="p-2 font-mono font-bold text-[#002046]">{row.nid}</td>
                              <td className="p-2 font-semibold">{row.full_name}</td>
                              <td className="p-2 font-mono">{row.age}</td>
                              <td className="p-2">
                                {row.profession} ({row.specialty})
                              </td>
                              <td className="p-2">{row.district}</td>
                              <td className="p-2 font-mono text-[10px]">{row.iam_role}</td>
                              <td className="p-2">
                                <button
                                  onClick={() => {
                                    setIamTargetNid(row.nid);
                                    setBackstageTab('iam360');
                                  }}
                                  className="px-2 py-1 rounded bg-[#dae2ff] text-[#001848] font-semibold text-[11px]"
                                >
                                  Gerenciar no IAM 360
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
        </main>
      </div>
    </ThemeProvider>
  );
}
