import React, { useState, useEffect } from 'react';
import {
  Shield,
  Globe,
  CheckCircle2,
  Stethoscope,
  GraduationCap,
  Siren,
  Wrench,
  Lock,
  ExternalLink,
  Activity,
  Users,
  Landmark,
  Plane,
  Briefcase,
  ArrowLeft,
  Home,
  FileText,
  KeyRound,
  HeartPulse,
  MapPin
} from 'lucide-react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Container,
  Box,
  Paper,
  Typography,
  Chip,
  Tabs,
  Tab,
  Alert,
  Button
} from '@mui/material';
import { TopNavUserWidget } from './components/TopNavUserWidget';
import { novatlantisTheme } from './theme';

type Language = 'pt-BR' | 'es-419' | 'en-US';
type CitizenTab = 'identity' | 'family_address' | 'health' | 'education' | 'urban' | 'treasury';

const LANDING_PORTAL_URL = 'https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app';
const GOV_BACKSTAGE_URL = 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app';

const QUICK_USERS = [
  { nid: 'NID-000-0000-0001-9', label: 'Jopoco (Primeiro-Ministro / Cidadão #1)' },
  { nid: 'NID-000-0000-0010-8', label: 'Pedro Albuquerque Viana (Estudante 11 anos)' },
  { nid: 'NID-000-0000-0011-6', label: 'Alice Albuquerque Viana (Estudante 6 anos)' },
  { nid: 'NID-000-0000-0003-5', label: 'Helena Viana Oliveira (Mãe / Gestora IAM)' },
  { nid: 'NID-000-0000-0006-0', label: 'Prof. Lucas Albuquerque Silva (Pai / Professor)' },
  { nid: 'NID-000-0000-0004-3', label: 'Dra. Sofia Mendes Costa (Médica Pediatra)' }
];

export default function App() {
  const [lang, setLang] = useState<Language>('pt-BR');
  const [activeTab, setActiveTab] = useState<CitizenTab>('identity');
  const [loginInput, setLoginInput] = useState('NID-000-0000-0001-9');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dossier, setDossier] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Forms
  const [newAddressId, setNewAddressId] = useState('');
  const [newDistrict, setNewDistrict] = useState('Distrito Tecnológico');
  const [ticketCategory, setTicketCategory] = useState('Iluminação Pública Inteligente & Sensores IoT');
  const [ticketDesc, setTicketDesc] = useState('');
  const [sosType, setSosType] = useState('Emergência Médica • Unidade Móvel UTI');
  const [telemedSpecialty, setTelemedSpecialty] = useState('Clínica Geral & Medicina Preventiva IA');
  const [telemedSymptoms, setTelemedSymptoms] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySector, setCompanySector] = useState('Inteligência Artificial Soberana & Robótica');

  const loadCitizen = async (identifier: string) => {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      if (!res.ok) return;
      const data = await res.json();
      setDossier(data);
      setLoginInput(data.citizen.nid);
      setNewAddressId(data.citizen.address_id || 'ADDR-NOV-2026-101');
      setNewDistrict(data.citizen.district || 'Distrito Tecnológico');
      if (data.citizen.native_language && ['pt-BR', 'es-419', 'en-US'].includes(data.citizen.native_language)) {
        setLang(data.citizen.native_language as Language);
      }
      loadDashboard(data.citizen.nid);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDashboard = async (nid: string) => {
    try {
      const res = await fetch(`/api/citizen/dashboard?nid=${encodeURIComponent(nid)}`);
      const data = await res.json();
      setDashboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialNid = params.get('nid') || 'NID-000-0000-0001-9';
    const initialTab = params.get('tab') as CitizenTab | null;
    if (initialTab && ['identity', 'family_address', 'health', 'education', 'urban', 'treasury'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
    loadCitizen(initialNid);
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier?.citizen) return;
    const res = await fetch(`/api/users/${encodeURIComponent(dossier.citizen.nid)}/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nid: dossier.citizen.nid,
        address_id: newAddressId,
        district: newDistrict
      })
    });
    const data = await res.json();
    if (data.updated) {
      setDossier(data.dossier);
      loadDashboard(dossier.citizen.nid);
      setStatusBanner(`Endereço soberano atualizado para ${newAddressId} (${newDistrict}) no banco de 100.000 cidadãos.`);
    }
  };

  const handleCreate311 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier?.citizen) return;
    const res = await fetch('/api/services/311', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizen_nid: dossier.citizen.nid,
        category: ticketCategory,
        district: dossier.citizen.district,
        description: ticketDesc || 'Solicitação de manutenção preventiva aberta via Portal do Cidadão.'
      })
    });
    const data = await res.json();
    if (data.created) {
      setTicketDesc('');
      loadDashboard(dossier.citizen.nid);
      setStatusBanner(`Chamado 311 #${data.ticket.ticket_id} registrado e encaminhado para ${data.ticket.assigned_department}.`);
    }
  };

  const handleCreate911 = async () => {
    if (!dossier?.citizen) return;
    const res = await fetch('/api/services/911', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizen_nid: dossier.citizen.nid,
        emergency_type: sosType,
        district: dossier.citizen.district
      })
    });
    const data = await res.json();
    if (data.dispatched) {
      loadDashboard(dossier.citizen.nid);
      setStatusBanner(`DESPACHO 911 #${data.dispatch.dispatch_id} ACIONADO! ETA: ${data.dispatch.eta_minutes} minutos.`);
    }
  };

  const handleCreateTelemed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier?.citizen) return;
    const res = await fetch('/api/services/telemed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_nid: dossier.citizen.nid,
        specialty: telemedSpecialty,
        symptoms: telemedSymptoms
      })
    });
    const data = await res.json();
    if (data.created) {
      setTelemedSymptoms('');
      loadDashboard(dossier.citizen.nid);
      setStatusBanner(`Teleconsulta #${data.consultation.consult_id} realizada! Receita ICP: ${data.consultation.prescription_code}.`);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier?.citizen) return;
    const res = await fetch('/api/services/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_nid: dossier.citizen.nid,
        company_name: companyName || `${dossier.citizen.full_name.split(' ')[0]} Digital Ventures S.A.`,
        sector: companySector
      })
    });
    const data = await res.json();
    if (data.created) {
      setCompanyName('');
      loadDashboard(dossier.citizen.nid);
      setStatusBanner(`Empresa ${data.company.company_name} (${data.company.company_id}) constituída em ${data.company.incorporation_seconds} segundos!`);
    }
  };

  const handleIssuePassport = async () => {
    if (!dossier?.citizen) return;
    const res = await fetch('/api/services/passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nid: dossier.citizen.nid })
    });
    const data = await res.json();
    if (data.issued) {
      loadCitizen(dossier.citizen.nid);
      setStatusBanner(`Passaporte Biométrico ICAO Doc 9303 #${data.passport.passport_number} emitido/revalidado com sucesso!`);
    }
  };

  const citizen = dossier?.citizen;

  return (
    <ThemeProvider theme={novatlantisTheme}>
      <CssBaseline />
      <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e] flex flex-col">
        {/* TOP BAR SOBERANA */}
        <div className="bg-[#001530] text-white text-xs border-b border-[#002046]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img src="/assets/flag.jpg" alt="Bandeira de Novatlantis" className="h-4 w-6 object-cover border border-white/30" />
              <span className="font-mono uppercase tracking-wider font-semibold text-[#b4c5ff]">
                REPÚBLICA DIGITAL DE NOVATLANTIS • PORTAL DO CIDADÃO • ALLOYDB + GOVERNMENT DATA PLATFORM
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`${LANDING_PORTAL_URL}?nid=${encodeURIComponent(citizen?.nid || 'NID-000-0000-0001-9')}`}
                className="text-[#b4c5ff] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal Principal da Nação
              </a>
              <div className="flex items-center gap-1 bg-[#002046] px-2 py-0.5 rounded border border-white/15">
                <Globe className="w-3.5 h-3.5 text-[#b4c5ff]" />
                {(['pt-BR', 'es-419', 'en-US'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                      lang === l ? 'bg-[#b4c5ff] text-[#002046] font-bold' : 'text-slate-300'
                    }`}
                  >
                    {l.split('-')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CABEÇALHO MATERIAL UI DO PORTAL DO CIDADÃO COM FONTE AMPLIADA E APENAS STATUS DO USUÁRIO */}
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '3px solid #002046', zIndex: 30 }}>
          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              sx={{
                py: { xs: 2, md: 2.5 },
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Paper variant="outlined" sx={{ p: 0.75, borderRadius: 2, borderColor: '#cbd5e1', bgcolor: '#fff' }}>
                  <Box
                    component="img"
                    src="/assets/coat_of_arms.jpg"
                    alt="Brasão Oficial"
                    sx={{ height: { xs: 50, md: 64 }, width: { xs: 50, md: 64 }, objectFit: 'contain' }}
                  />
                </Paper>
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '1.6rem', sm: '2.05rem', md: '2.4rem' },
                        fontWeight: 800,
                        color: '#002046',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15
                      }}
                    >
                      Governo da República de Novatlantis
                    </Typography>
                    <Chip
                      label="Portal do Cidadão • 360°"
                      sx={{
                        bgcolor: '#dae2ff',
                        color: '#001848',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.8rem', md: '0.92rem' },
                        height: { xs: 30, md: 34 },
                        px: 1
                      }}
                    />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: '0.95rem', sm: '1.12rem', md: '1.22rem' },
                      fontWeight: 500,
                      color: '#43474f',
                      mt: 0.5
                    }}
                  >
                    Chancelaria Digital • Autoatendimento Soberano • Módulo de Usuários AlloyDB & GDP (100.000 Cidadãos)
                  </Typography>
                </Box>
              </Box>

              {/* APENAS O STATUS DO USUÁRIO COM A FOTO */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TopNavUserWidget
                  currentNid={citizen?.nid}
                  onUserAuthenticated={(nid) => loadCitizen(nid)}
                />
              </Box>
            </Toolbar>
          </Container>

          {/* BARRA DE ABAS MATERIAL UI DO PORTAL DO CIDADÃO */}
          <Box sx={{ bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Container maxWidth="xl">
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val as CitizenTab)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab value="identity" label="1. Carteira Soberana NID & Biometria NIST" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
                <Tab value="family_address" label="2. Grafo Familiar & Endereço Soberano" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
                <Tab value="health" label="3. Saúde HL7 & Telemedicina" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
                <Tab value="education" label="4. Educação & Notas Escolares (GDP)" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
                <Tab value="urban" label="5. Zeladoria 311 & Emergência 911" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
                <Tab value="treasury" label="6. Economia, Empresa 45s & Passaporte ICAO" sx={{ fontWeight: 700, fontSize: '0.82rem' }} />
              </Tabs>
            </Container>
          </Box>
        </AppBar>

        {/* BANNER DE FEEDBACK */}
        {statusBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
            <Alert severity="success" onClose={() => setStatusBanner(null)}>
              {statusBanner}
            </Alert>
          </div>
        )}

      {/* CONTEÚDO PRINCIPAL DO PORTAL DO CIDADÃO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {citizen && (
          <>
            {/* ABA 1: CARTEIRA SOBERANA NID & BIOMETRIA NIST */}
            {activeTab === 'identity' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#002046] text-white rounded p-6 border-2 border-[#b4c5ff]/40 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <div className="flex items-center gap-3">
                      <img src="/assets/coat_of_arms.jpg" alt="Brasão" className="h-10 w-10 rounded bg-white p-0.5" />
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#b4c5ff]">
                          REPÚBLICA DIGITAL DE NOVATLANTIS • DOCUMENTO OFICIAL DE IDENTIDADE
                        </div>
                        <div className="font-serif-authority text-lg font-bold">
                          Carteira de Identidade Soberana (NID Mod-11)
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      NIST & ICAO VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">Nome Civil Completo</div>
                      <div className="text-base font-bold text-white">{citizen.full_name}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">Identificador Soberano (NID)</div>
                      <div className="text-base font-mono font-bold text-[#b4c5ff]">{citizen.nid}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">Data de Nascimento & Idade</div>
                      <div className="font-mono text-white">
                        {citizen.birth_date} ({citizen.age} anos)
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">E-mail Institucional / Cidadão</div>
                      <div className="font-mono text-white">{citizen.email}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">Profissão & Especialidade</div>
                      <div className="text-white">
                        {citizen.profession} • {citizen.specialty}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase font-mono text-[10px]">Domicílio & Distrito</div>
                      <div className="font-mono text-white">
                        {citizen.address_id} ({citizen.district})
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#001530] border border-white/15 rounded p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-mono text-[10px]">Padrão Biométrico</span>
                      <strong className="font-mono text-[#b4c5ff]">{citizen.nist_biometrics?.standard}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono text-[10px]">Score Facial / Minúcias</span>
                      <strong className="font-mono text-emerald-400">
                        {(citizen.nist_biometrics?.face_confidence * 100).toFixed(1)}% ({citizen.nist_biometrics?.minutiae_points} pts)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono text-[10px]">Chave Pública Ed25519</span>
                      <strong className="font-mono text-white">{citizen.nist_biometrics?.ed25519_key_fingerprint}</strong>
                    </div>
                  </div>
                </div>

                {/* PAINEL DE AUDITORIA DE TRANSPARÊNCIA 48H */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4">
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <h3 className="font-serif-authority text-base font-bold text-[#002046] flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#002046]" />
                      Auditoria de Acesso aos Seus Dados (48h)
                    </h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#dae2ff] text-[#001848] rounded font-bold">
                      Zero-Trust Ledger
                    </span>
                  </div>
                  <p className="text-xs text-[#43474f]">
                    Todo acesso de secretarias ou agentes de IA ao seu registro civil ou clínico é gravado de forma transparente.
                  </p>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {(dashboard?.audit_log || []).map((log: any) => (
                      <div key={log.id} className="p-3 rounded bg-[#f8f9fb] border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#002046]">
                          <span className="font-bold">{log.action}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        <div className="text-[#191c1e] font-medium">{log.details}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Autoridade: {log.actor_name} ({log.actor_nid})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: GRAFO FAMILIAR & ENDEREÇO SOBERANO */}
            {activeTab === 'family_address' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                        Núcleo e Vínculos Familiares (`GET /api/v1/profile/family`)
                      </h3>
                      <p className="text-xs text-[#43474f]">
                        Consulta em modo estritamente <strong>somente leitura (Read-Only)</strong> mantida pelo Registro Civil Central.
                      </p>
                    </div>
                    <span className="font-mono text-[11px] bg-slate-800 text-[#b4c5ff] px-2.5 py-1 rounded font-bold">
                      SOMENTE LEITURA (READ-ONLY)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[...(dossier?.family?.outgoing || []), ...(dossier?.family?.incoming || [])].map((rel: any, idx: number) => {
                      const relatedNid = rel.target_name ? rel.target_nid : rel.source_nid;
                      const relatedName = rel.target_name || rel.source_name;
                      const relatedAge = rel.target_age ?? rel.source_age;
                      const relatedProf = rel.target_profession || rel.source_profession;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded bg-[#f8f9fb] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#002046] text-sm">{relatedName}</div>
                            <div className="font-mono text-[11px] text-[#43474f]">
                              {relatedNid} • {relatedAge} anos • {relatedProf}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#dae2ff] text-[#001848] font-bold">
                              {rel.relation_type}
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Registro Civil Imutável
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ATUALIZAÇÃO DE ENDEREÇO SOBERANO */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#002046]" />
                      Gestão Cadastral de Domicílio Soberano
                    </h3>
                    <p className="text-xs text-[#43474f]">
                      Altere seu endereço e distrito em tempo real na tabela `dim_citizens`.
                    </p>
                  </div>
                  <form onSubmit={handleUpdateAddress} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Código de Endereço Oficial (`address_id`)</label>
                      <input
                        type="text"
                        value={newAddressId}
                        onChange={(e) => setNewAddressId(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Distrito Administrativo</label>
                      <select
                        value={newDistrict}
                        onChange={(e) => setNewDistrict(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      >
                        <option value="Distrito Tecnológico">Distrito Tecnológico</option>
                        <option value="Colina da Justiça">Colina da Justiça</option>
                        <option value="Distrito Oceânico">Distrito Oceânico</option>
                        <option value="Vale da Inovação">Vale da Inovação</option>
                        <option value="Porto Soberano">Porto Soberano</option>
                        <option value="Bosque das Ciências">Bosque das Ciências</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
                    >
                      Salvar Novo Domicílio no Datalake GDF
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ABA 3: SAÚDE HL7 & TELEMEDICINA */}
            {activeTab === 'health' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046] flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-[#002046]" />
                      Prontuário Eletrônico Nacional HL7 FHIR (`health_records`)
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                      {dossier?.health?.vaccination_status || 'UP_TO_DATE'}
                    </span>
                  </div>
                  {dossier?.health ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded bg-[#f8f9fb] border border-slate-200">
                        <span className="text-slate-500 block font-mono text-[10px]">TIPO SANGUÍNEO</span>
                        <strong className="text-base font-mono text-[#002046]">{dossier.health.blood_type}</strong>
                      </div>
                      <div className="p-3 rounded bg-[#f8f9fb] border border-slate-200">
                        <span className="text-slate-500 block font-mono text-[10px]">DOADOR DE ÓRGÃOS</span>
                        <strong className="text-base font-mono text-[#002046]">
                          {dossier.health.organ_donor ? 'SIM (ATIVO)' : 'NÃO'}
                        </strong>
                      </div>
                      <div className="p-3 rounded bg-[#f8f9fb] border border-slate-200">
                        <span className="text-slate-500 block font-mono text-[10px]">CONDIÇÕES CRÔNICAS</span>
                        <strong className="text-[#191c1e]">{dossier.health.chronic_conditions}</strong>
                      </div>
                      <div className="p-3 rounded bg-[#f8f9fb] border border-slate-200">
                        <span className="text-slate-500 block font-mono text-[10px]">ALERGIAS MAPEADAS</span>
                        <strong className="text-[#191c1e]">{dossier.health.allergies}</strong>
                      </div>
                      <div className="col-span-2 p-3 rounded bg-[#dae2ff]/30 border border-[#002046]/20">
                        <span className="text-slate-600 block font-mono text-[10px]">MÉDICO DE FAMÍLIA DESIGNADO</span>
                        <strong className="text-[#002046] text-sm">
                          {dossier.health.doctor_name || 'Dra. Sofia Mendes Costa'} ({dossier.health.assigned_primary_care_physician_nid})
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Prontuário em sincronização.</p>
                  )}
                </div>

                {/* TELECONSULTA AGÊNTICA */}
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                      Agendar / Iniciar Teleconsulta Médica Assistida por IA
                    </h3>
                    <p className="text-xs text-[#43474f]">
                      Gera resumo clínico estruturado e receita digital assinada via ICP-Novatlantis.
                    </p>
                  </div>
                  <form onSubmit={handleCreateTelemed} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Especialidade Clínica</label>
                      <select
                        value={telemedSpecialty}
                        onChange={(e) => setTelemedSpecialty(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      >
                        <option value="Clínica Geral & Medicina Preventiva IA">Clínica Geral & Medicina Preventiva IA</option>
                        <option value="Pediatria & Imunologia">Pediatria & Imunologia</option>
                        <option value="Cardiologia & Check-up Executivo">Cardiologia & Check-up Executivo</option>
                        <option value="Saúde Mental & Neurociência">Saúde Mental & Neurociência</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Relato de Sintomas ou Solicitação</label>
                      <input
                        type="text"
                        value={telemedSymptoms}
                        onChange={(e) => setTelemedSymptoms(e.target.value)}
                        placeholder="Ex: Renovação de receita preventiva e check-up anual..."
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
                    >
                      Realizar Teleconsulta & Emitir Prescrição ICP
                    </button>
                  </form>

                  <div className="pt-2 space-y-2">
                    <div className="font-mono text-[11px] uppercase font-bold text-[#002046]">
                      Histórico de Teleconsultas & Prescrições
                    </div>
                    {(dashboard?.telemed_consultations || []).slice(0, 3).map((tm: any) => (
                      <div key={tm.consult_id} className="p-3 rounded bg-[#f8f9fb] border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono text-[10px]">
                          <strong className="text-[#002046]">{tm.consult_id} • {tm.specialty}</strong>
                          <span className="text-emerald-700 font-bold">{tm.prescription_code}</span>
                        </div>
                        <div className="text-[#43474f]">{tm.ai_clinical_summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: EDUCAÇÃO & DESEMPENHO ESCOLAR */}
            {activeTab === 'education' && (
              <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
                <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif-authority text-xl font-bold text-[#002046]">
                      Boletim Escolar Nacional & Tutoria Adaptativa por IA (`edu_enrollments`)
                    </h3>
                    <p className="text-xs text-[#43474f]">
                      Desempenho acadêmico por matéria sincronizado com o Ambiente dos Professores no Backstage Governamental.
                    </p>
                  </div>
                  <button
                    onClick={() => loadCitizen('NID-000-0000-0010-8')}
                    className="px-3 py-1.5 rounded bg-[#dae2ff] text-[#001848] text-xs font-semibold"
                  >
                    Visualizar Exemplo Aluno: Pedro Albuquerque (11 anos)
                  </button>
                </div>

                {dossier?.education ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-[#f8f9fb] border border-slate-200 rounded p-4 space-y-2.5 text-xs">
                      <div className="font-mono text-xs uppercase font-bold text-[#002046]">
                        Dados da Matrícula Ativa
                      </div>
                      <div>
                        <span className="text-slate-500">Matrícula ID: </span>
                        <strong className="font-mono">{dossier.education.enrollment_id}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Unidade Escolar: </span>
                        <strong>{dossier.education.school_id}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Nível / Série: </span>
                        <strong>{dossier.education.education_level} • {dossier.education.grade_level}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Professor Regente: </span>
                        <strong>{dossier.education.teacher_name || 'Prof. Lucas Albuquerque Silva'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Frequência Escolar: </span>
                        <strong className="font-mono text-emerald-700">{dossier.education.attendance_rate}%</strong>
                      </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200">
                        <div className="font-mono text-[10px] uppercase text-slate-500">Matemática</div>
                        <div className="font-mono text-2xl font-bold text-[#002046] mt-1">
                          {dossier.education.score_mathematics}
                        </div>
                      </div>
                      <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200">
                        <div className="font-mono text-[10px] uppercase text-slate-500">Ciências</div>
                        <div className="font-mono text-2xl font-bold text-[#002046] mt-1">
                          {dossier.education.score_sciences}
                        </div>
                      </div>
                      <div className="p-4 rounded bg-[#dae2ff]/40 border border-[#002046]/30">
                        <div className="font-mono text-[10px] uppercase text-[#001848] font-bold">IA & Robótica</div>
                        <div className="font-mono text-2xl font-bold text-[#002046] mt-1">
                          {dossier.education.score_ai_robotics}
                        </div>
                      </div>
                      <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200">
                        <div className="font-mono text-[10px] uppercase text-slate-500">Idiomas</div>
                        <div className="font-mono text-2xl font-bold text-[#002046] mt-1">
                          {dossier.education.score_languages}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200 text-xs text-[#43474f]">
                    Este cidadão ({citizen.full_name}, {citizen.age} anos) está no ciclo de Educação Continuada / Pós-Graduação Livre. Clique no botão acima para inspecionar o boletim escolar de <strong>Pedro Albuquerque Viana (11 anos)</strong>.
                  </div>
                )}
              </div>
            )}

            {/* ABA 5: ZELADORIA 311 & EMERGÊNCIA 911 */}
            {activeTab === 'urban' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <h3 className="font-serif-authority text-lg font-bold text-[#002046] flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#002046]" />
                    Abertura de Chamado Urbano 311 (Com Triagem IA)
                  </h3>
                  <form onSubmit={handleCreate311} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Categoria de Zeladoria</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      >
                        <option value="Iluminação Pública Inteligente & Sensores IoT">Iluminação Pública Inteligente & Sensores IoT</option>
                        <option value="Zeladoria Viária & Drenagem Pluvial">Zeladoria Viária & Drenagem Pluvial</option>
                        <option value="Coleta Seletiva Automatizada & Resíduos">Coleta Seletiva Automatizada & Resíduos</option>
                        <option value="Manutenção de Parques & Mobiliário Urbano">Manutenção de Parques & Mobiliário Urbano</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Descrição da Ocorrência</label>
                      <input
                        type="text"
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        placeholder="Descreva o problema na sua quadra ou distrito..."
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
                    >
                      Protocolar Demanda 311 para Atendimento no Backstage
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 bg-white border-2 border-red-800 rounded p-6 space-y-4">
                  <h3 className="font-serif-authority text-lg font-bold text-red-900 flex items-center gap-2">
                    <Siren className="w-5 h-5 text-red-700" />
                    Acionamento Rápido de Emergência 911
                  </h3>
                  <p className="text-xs text-[#43474f]">
                    Aciona imediatamente o Comando Operacional 911 com coordenadas do seu distrito ({citizen.district}).
                  </p>
                  <div className="space-y-3 text-xs">
                    <select
                      value={sosType}
                      onChange={(e) => setSosType(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    >
                      <option value="Emergência Médica • Unidade Móvel UTI">Emergência Médica • Unidade Móvel UTI</option>
                      <option value="Patrulha de Segurança Cidadã & Defesa Civil">Patrulha de Segurança Cidadã & Defesa Civil</option>
                      <option value="Resgate Marítimo & Guarda Costeira">Resgate Marítimo & Guarda Costeira</option>
                    </select>
                    <button
                      onClick={handleCreate911}
                      className="w-full bg-red-800 text-white font-bold py-3 rounded hover:bg-red-900 transition"
                    >
                      DISPARAR PROTOCOLO SOS 911 IMEDIATO
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 6: ECONOMIA SOBERANA, EMPRESA EM 45S & PASSAPORTE ICAO */}
            {activeTab === 'treasury' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <h3 className="font-serif-authority text-lg font-bold text-[#002046] flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#002046]" />
                    GovBiz • Abertura Instantânea de Empresa em 45 Segundos
                  </h3>
                  <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Razão Social da Nova Empresa</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Atlântica Sistemas Quânticos S.A."
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#002046] mb-1">Setor Econômico</label>
                      <input
                        type="text"
                        value={companySector}
                        onChange={(e) => setCompanySector(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#002046] text-white font-bold py-2.5 rounded hover:bg-[#00356e] transition"
                    >
                      Constituir Empresa em 45 Segundos
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046] flex items-center gap-2">
                      <Plane className="w-5 h-5 text-[#002046]" />
                      Passaporte Biométrico ICAO Doc 9303 (`sec_passports`)
                    </h3>
                    <button
                      onClick={handleIssuePassport}
                      className="bg-[#002046] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#00356e]"
                    >
                      Emitir / Revalidar Passaporte ICAO
                    </button>
                  </div>

                  {dossier?.passport ? (
                    <div className="p-4 rounded bg-[#001530] text-white space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-[#b4c5ff]">
                        <span>PASSAPORTE Nº: {dossier.passport.passport_number}</span>
                        <span>STATUS: {dossier.passport.passport_status}</span>
                      </div>
                      <div>VALIDADE: {dossier.passport.issue_date} ATÉ {dossier.passport.expiry_date}</div>
                      <div className="bg-black/40 p-2.5 rounded border border-white/15 text-[11px] tracking-widest overflow-x-auto">
                        <div>{dossier.passport.icao_mrz_line1}</div>
                        <div>{dossier.passport.icao_mrz_line2}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#43474f]">
                      Clique em <strong>Emitir / Revalidar Passaporte ICAO</strong> acima para gerar imediatamente seu documento internacional no padrão ICAO Doc 9303.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </ThemeProvider>
  );
}
