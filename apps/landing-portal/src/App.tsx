import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Stethoscope,
  GraduationCap,
  Siren,
  Wrench,
  Lock,
  ExternalLink,
  Activity,
  Award,
  Sparkles,
  Scale,
  Users,
  Database,
  Landmark,
  Plane,
  Briefcase,
  ArrowRight,
  MessageSquare,
  Send,
  X,
  Bot,
  UserCheck,
  Terminal,
  ChevronRight,
  Layers
} from 'lucide-react';

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

const QUICK_PROFILES = [
  {
    nid: 'NID-000-0000-0001-9',
    label: 'Jopoco (Primeiro-Ministro / Root)',
    roleBadge: 'PRIME_MINISTER_ROOT',
    email: 'jopoco@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0002-7',
    label: 'Dr. Aurelius Valerius (Secretário-Geral)',
    roleBadge: 'SECRETARY_GENERAL',
    email: 'secretario.geral@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0003-5',
    label: 'Helena Viana (Gestora Identidade 360)',
    roleBadge: 'IDENTITY_MANAGER_360',
    email: 'gestor.identidade@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0004-3',
    label: 'Dra. Sofia Mendes (Gestora Saúde & Médica)',
    roleBadge: 'DOCTOR_AND_HEALTH_MANAGER',
    email: 'sofia.mendes@saude.novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0006-0',
    label: 'Prof. Lucas Albuquerque (Gestor Educação)',
    roleBadge: 'TEACHER_AND_EDU_MANAGER',
    email: 'lucas.albuquerque@educacao.novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0010-8',
    label: 'Pedro Albuquerque (Cidadão / Estudante)',
    roleBadge: 'CITIZEN_COMMON',
    email: 'pedro.albuquerque@cidadao.novatlantis.gov.cloud'
  }
];

const I18N: Record<Language, {
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
}> = {
  'pt-BR': {
    govHeader: 'REPÚBLICA DIGITAL DE NOVATLANTIS • PORTAL PRINCIPAL DA NAÇÃO',
    govBanner: 'Infraestrutura Pública Digital Soberana • 3 Aplicações Full-Stack Independentes • Base GDF 100.000 Cidadãos',
    heroTitle: 'A serviço do povo de Novatlantis.',
    heroSubtitle: 'Portal institucional da República Digital de Novatlantis. Utilize a barra de busca abaixo para abrir uma conversa em tempo real com o Agente Orquestrador de Estado ou acesse diretamente o Portal do Cidadão e o Backstage Governamental.',
    searchPlaceholder: 'Pergunte ou solicite um serviço ao Agente Orquestrador (ex: "Emitir passaporte ICAO", "Abrir empresa em 45s", "Agendar teleconsulta")...',
    searchButton: 'Conversar com o Agente',
    openChatButton: 'Abrir Chat do Agente Orquestrador',
    architectureTitle: 'Arquitetura Soberana Separada em 3 Aplicações Full-Stack',
    architectureDesc: 'Cada portal opera com seu próprio Frontend React e Backend Node.js + SQLite integrados ao Módulo de Usuários de 100.000 cidadãos.',
    citizenPortalTitle: 'Portal do Cidadão (Autoatendimento 360°)',
    citizenPortalDesc: 'Aplicação exclusiva do cidadão: Carteira NID com biometria NIST, Grafo Familiar, atualização de endereço, Saúde HL7 & Telemedicina, Notas Escolares, Chamados 311/911, Renda Básica e Passaporte ICAO.',
    backstagePortalTitle: 'Backstage Governamental & Identidade 360',
    backstagePortalDesc: 'Aplicação exclusiva dos servidores e gestores públicos (Primeiro-Ministro Jopoco, Secretário-Geral, Gestor de Identidade 360, Médicos, Professores e Comandantes) com revogação RBAC/ABAC em tempo real.',
    lifeEventsTitle: 'Serviços Públicos por Eventos da Vida',
    lifeEventsSubtitle: 'Acesso austero, transparente e direto aos serviços essenciais do Estado, organizados em torno da vida do cidadão.',
    innovationsTitle: 'Inovações da Nação AI-First na Era Agêntica',
    innovationsSubtitle: 'Serviços governamentais proativos baseados no Government Data Fabric (GDF) de 100.000 cidadãos.'
  },
  'es-419': {
    govHeader: 'REPÚBLICA DIGITAL DE NOVATLANTIS • PORTAL PRINCIPAL DE LA NACIÓN',
    govBanner: 'Infraestructura Pública Digital Soberana • 3 Aplicaciones Full-Stack Independientes • Base GDF 100.000 Ciudadanos',
    heroTitle: 'Al servicio del pueblo de Novatlantis.',
    heroSubtitle: 'Portal institucional de la República Digital de Novatlantis. Utilice la barra de búsqueda para conversar en tiempo real con el Agente Orquestador del Estado o acceda al Portal del Ciudadano y al Backstage Gubernamental.',
    searchPlaceholder: 'Pregunte o solicite un servicio al Agente Orquestador (ej: "Emitir pasaporte ICAO", "Abrir empresa en 45s", "Agendar teleconsulta")...',
    searchButton: 'Conversar con el Agente',
    openChatButton: 'Abrir Chat del Agente Orquestador',
    architectureTitle: 'Arquitectura Soberana Separada en 3 Aplicaciones Full-Stack',
    architectureDesc: 'Cada portal opera con su propio Frontend React y Backend Node.js + SQLite integrados al Módulo de Usuarios de 100.000 ciudadanos.',
    citizenPortalTitle: 'Portal del Ciudadano (Autoservicio 360°)',
    citizenPortalDesc: 'Aplicación exclusiva del ciudadano: Credencial NID con biometría NIST, Grafo Familiar, dirección, Salud HL7 y Telemedicina, Calificaciones Escolares, Tickets 311/911 y Pasaporte ICAO.',
    backstagePortalTitle: 'Backstage Gubernamental e Identidad 360',
    backstagePortalDesc: 'Aplicación exclusiva de servidores y gestores públicos (Primer Ministro Jopoco, Secretario General, Gestor de Identidad 360, Médicos y Profesores) con revocación RBAC/ABAC inmediata.',
    lifeEventsTitle: 'Servicios Públicos por Eventos de Vida',
    lifeEventsSubtitle: 'Acceso austero, transparente y directo a los servicios esenciales del Estado.',
    innovationsTitle: 'Innovaciones de la Nación AI-First en la Era Agéntica',
    innovationsSubtitle: 'Servicios gubernamentales proactivos basados en el Government Data Fabric (GDF) de 100.000 ciudadanos.'
  },
  'en-US': {
    govHeader: 'DIGITAL REPUBLIC OF NOVATLANTIS • NATIONAL MASTER PORTAL',
    govBanner: 'Sovereign Digital Public Infrastructure • 3 Independent Full-Stack Applications • 100,000-Citizen GDF Users Module',
    heroTitle: 'Working for the people of Novatlantis.',
    heroSubtitle: 'Official institutional portal of the Digital Republic of Novatlantis. Use the search bar below to open a real-time chat with the State Orchestrator Agent or launch the Citizen Portal and Government Backstage.',
    searchPlaceholder: 'Ask or request a service from the State Orchestrator Agent (e.g., "Issue ICAO passport", "Open company in 45s", "Schedule telemedicine")...',
    searchButton: 'Chat with Agent',
    openChatButton: 'Open Orchestrator Agent Chat',
    architectureTitle: 'Sovereign Architecture Separated into 3 Full-Stack Applications',
    architectureDesc: 'Each portal operates with its own dedicated React Frontend and Node.js + SQLite Backend backed by the 100,000-citizen Users Module.',
    citizenPortalTitle: 'Citizen Portal (360° Self-Service)',
    citizenPortalDesc: 'Dedicated citizen application: NID Credential with NIST biometrics, Family Graph, address updates, HL7 Health & Telemedicine, Student Grades, 311/911 Requests, and ICAO Passport.',
    backstagePortalTitle: 'Government Backstage & Identity 360',
    backstagePortalDesc: 'Dedicated public servant & manager application (Prime Minister Jopoco, Secretary-General, Identity 360 Manager, Doctors, and Teachers) with instant RBAC/ABAC revocation.',
    lifeEventsTitle: 'Public Services by Life Events',
    lifeEventsSubtitle: 'Clean, austere, and accountable access to essential State services organized around citizen needs.',
    innovationsTitle: 'AI-First Nation Innovations in the Agentic Era',
    innovationsSubtitle: 'Proactive government services powered by the 100,000-citizen Government Data Fabric (GDF).'
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('pt-BR');
  const [loginInput, setLoginInput] = useState('NID-000-0000-0001-9');
  const [citizenSearchQuery, setCitizenSearchQuery] = useState('');
  const [citizenSearchResults, setCitizenSearchResults] = useState<any[]>([]);
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
      setLoginInput(data.citizen.nid);
      if (data.citizen.native_language && ['pt-BR', 'es-419', 'en-US'].includes(data.citizen.native_language)) {
        setLang(data.citizen.native_language as Language);
      }
      // Initialize greeting in Orchestrator Chat for this citizen
      setChatTurns([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          message:
            `Saudações institucionais, **${data.citizen.full_name}** (\`${data.citizen.nid}\`).\n\n` +
            `Sou o **Agente Orquestrador de Estado de Novatlantis**, conectado em tempo real ao **Government Data Fabric (100.000 cidadãos)**.\n` +
            `Seu perfil atual na aplicação **Identidade 360** é \`${data.citizen.iam_role}\` (${data.citizen.profession} • ${data.citizen.district}).\n\n` +
            `Como posso servir você hoje? Posso **consultar seu prontuário completo**, **emitir seu passaporte ICAO**, **abrir uma empresa em 45 segundos**, **agendar uma teleconsulta médica**, **consultar notas escolares**, **abrir um chamado urbano 311** ou **acionar o despacho 911**.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'STATE_GREETING',
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
      console.error(e);
    }
  };

  const loadHealthStats = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setLakehouseStats(data.lakehouse_counts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUser('NID-000-0000-0001-9');
    loadHealthStats();
  }, []);

  useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatTurns, chatOpen]);

  const handleCitizenDirectorySearch = async (q: string) => {
    setCitizenSearchQuery(q);
    if (q.trim().length < 2) {
      setCitizenSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setCitizenSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessageToOrchestrator = async (rawMessage: string) => {
    const messageText = rawMessage.trim();
    if (!messageText || chatSending) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: messageText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatTurns((prev) => [...prev, userTurn]);
    setChatInput('');
    setSearchBarInput('');
    setChatOpen(true);
    setChatSending(true);

    try {
      const res = await fetch('/api/orchestrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nid: currentUser?.nid || 'NID-000-0000-0001-9',
          message: messageText,
          history: chatTurns.slice(-6).map((turn) => ({ role: turn.role, message: turn.message }))
        })
      });
      const data = await res.json();
      const assistantTurn: ChatTurn = {
        id: data.message_id || `assistant-${Date.now()}`,
        role: 'assistant',
        message: data.reply || 'Solicitação processada pelo Estado de Novatlantis.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        orchestration_steps: data.orchestration_steps || [],
        action_card: data.action_card || null,
        suggested_prompts: data.suggested_prompts || []
      };
      setChatTurns((prev) => [...prev, assistantTurn]);
      loadHealthStats();
    } catch (e) {
      console.error(e);
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
    sendMessageToOrchestrator(searchBarInput);
  };

  const citizenPortalLink = `${CITIZEN_PORTAL_URL}?nid=${encodeURIComponent(currentUser?.nid || 'NID-000-0000-0001-9')}`;
  const backstagePortalLink = `${GOV_BACKSTAGE_URL}?nid=${encodeURIComponent(currentUser?.nid || 'NID-000-0000-0001-9')}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e] flex flex-col">
      {/* TOP BAR SOBERANA (GOV.UK / ESTÔNIA AUSTERE CIVIC BAR) */}
      <div className="bg-[#001530] text-white text-xs border-b border-[#002046]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/flag.jpg"
              alt="Bandeira Oficial de Novatlantis"
              className="h-4 w-6 object-cover border border-white/30"
            />
            <span className="font-mono tracking-wider uppercase font-semibold text-[#b4c5ff]">
              {t.govHeader}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-slate-300">{t.govBanner}</span>
            <div className="flex items-center gap-1 bg-[#002046] px-2 py-0.5 rounded border border-white/15">
              <Globe className="w-3.5 h-3.5 text-[#b4c5ff]" />
              {(['pt-BR', 'es-419', 'en-US'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                    lang === l ? 'bg-[#b4c5ff] text-[#002046] font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l.split('-')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CABEÇALHO INSTITUCIONAL E MÓDULO DE USUÁRIOS (100.000 CIDADÃOS) */}
      <header className="bg-white border-b-2 border-[#002046] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/coat_of_arms.jpg"
              alt="Brasão Oficial de Novatlantis"
              className="h-12 w-12 object-contain rounded border border-slate-200 bg-white p-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-authority text-xl font-bold tracking-tight text-[#002046]">
                  Governo da República de Novatlantis
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-[#dae2ff] text-[#001848] font-semibold rounded">
                  Portal Principal da Nação
                </span>
              </div>
              <p className="text-xs text-[#43474f]">
                Chancelaria Digital • Agente Orquestrador de Estado • Módulo de Usuários GDF (100.000 Cidadãos)
              </p>
            </div>
          </div>

          {/* NAVEGAÇÃO ENTRE AS 3 APLICAÇÕES FULL-STACK SEPARADAS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setChatOpen(true)}
              className="px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 bg-[#00356e] text-white hover:bg-[#002046] transition shadow-sm"
            >
              <Bot className="w-4 h-4 text-[#b4c5ff]" />
              {t.openChatButton}
            </button>
            <a
              href={citizenPortalLink}
              className="px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 bg-[#f2f4f6] text-[#002046] border border-[#002046]/25 hover:bg-[#dae2ff]/60 transition"
            >
              <UserCheck className="w-4 h-4 text-[#002046]" />
              Portal do Cidadão
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={backstagePortalLink}
              className="px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 bg-[#002046] text-white hover:bg-[#00356e] transition"
            >
              <Lock className="w-3.5 h-3.5 text-[#b4c5ff]" />
              Backstage Governamental
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* BARRA DE SESSÃO SOBERANA (MÓDULO DE USUÁRIOS GDF 100.000 CIDADÃOS) */}
        <div className="bg-[#f2f4f6] border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono uppercase text-[11px] text-[#43474f] font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#002046]" />
                Cidadão Autenticado (Base 100k):
              </span>
              <select
                value={currentUser?.nid || ''}
                onChange={(e) => loadUser(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-[#002046] focus:outline-none focus:border-[#002046]"
              >
                {QUICK_PROFILES.map((p) => (
                  <option key={p.nid} value={p.nid}>
                    {p.label} — [{p.roleBadge}]
                  </option>
                ))}
                {currentUser && !QUICK_PROFILES.some((p) => p.nid === currentUser.nid) && (
                  <option value={currentUser.nid}>
                    {currentUser.full_name} ({currentUser.nid}) — [{currentUser.iam_role}]
                  </option>
                )}
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="NID ou E-mail de qualquer dos 100k cidadãos"
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono w-56"
                />
                <button
                  onClick={() => loadUser(loginInput)}
                  className="bg-[#002046] text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-[#00356e]"
                >
                  Autenticar SSO
                </button>
              </div>

              {/* Busca rápida nos 100.000 cidadãos */}
              <div className="relative">
                <input
                  type="text"
                  value={citizenSearchQuery}
                  onChange={(e) => handleCitizenDirectorySearch(e.target.value)}
                  placeholder="Buscar cidadão na base 100k..."
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs w-52"
                />
                {citizenSearchResults.length > 0 && (
                  <div className="absolute left-0 mt-1 w-96 bg-white border border-slate-300 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                    {citizenSearchResults.map((c) => (
                      <button
                        key={c.nid}
                        onClick={() => {
                          loadUser(c.nid);
                          setCitizenSearchResults([]);
                          setCitizenSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#f2f4f6] border-b border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#002046]">{c.full_name}</div>
                          <div className="text-[11px] text-[#43474f] font-mono">
                            {c.nid} • {c.profession}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {c.iam_role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-[#43474f]">
                  Usuário: <strong className="text-[#191c1e]">{currentUser.full_name}</strong>
                </span>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold ${
                    currentUser.backstage_allowed
                      ? 'bg-[#dae2ff] text-[#001848] border border-[#002046]/20'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {currentUser.iam_role}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DO PORTAL DA NAÇÃO */}
      <main className="flex-1">
        {/* HERO INSTITUCIONAL AUSTERO COM BARRA DE BUSCA DO AGENTE ORQUESTRADOR */}
        <section className="bg-[#002046] text-white border-b-4 border-[#b4c5ff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#00356e] border border-[#b4c5ff]/30 rounded text-xs font-mono text-[#b4c5ff]">
                  <Bot className="w-3.5 h-3.5" />
                  ORQUESTRADOR AGÊNTICO NACIONAL • CONECTADO AO DATALAKE DE 100.000 CIDADÃOS
                </div>
                <h1 className="font-serif-authority text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {t.heroTitle}
                </h1>
                <p className="text-slate-200 text-base leading-relaxed max-w-3xl">
                  {t.heroSubtitle}
                </p>

                {/* BARRA DE BUSCA CENTRAL QUE ACIONA O CHAT DO AGENTE ORQUESTRADOR */}
                <form onSubmit={handleHeroSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-3xl">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchBarInput}
                      onChange={(e) => setSearchBarInput(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-10 pr-4 py-3.5 rounded bg-white text-[#191c1e] text-sm border-2 border-transparent focus:border-[#b4c5ff] focus:outline-none shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#b4c5ff] text-[#001848] font-bold px-6 py-3.5 rounded text-sm hover:bg-white transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t.searchButton}
                  </button>
                </form>

                {/* SUGESTÕES RÁPIDAS QUE ABREM O CHAT DO AGENTE ORQUESTRADOR */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[#b4c5ff] font-mono uppercase text-[11px]">Acionar Agente via Chat:</span>
                  {[
                    'Consultar meu prontuário e família no GDF',
                    'Emitir meu Passaporte Digital ICAO',
                    'Abrir empresa em 45s no Distrito Tecnológico',
                    'Agendar teleconsulta médica com IA',
                    'Verificar notas escolares e desempenho',
                    'Abrir chamado 311 na minha rua'
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessageToOrchestrator(prompt)}
                      className="px-2.5 py-1 rounded bg-[#00356e] hover:bg-[#b4c5ff] hover:text-[#001848] text-slate-200 border border-white/15 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* PAINEL DE INDICADORES SOBERANOS EM TEMPO REAL */}
              <div className="lg:col-span-4 bg-[#001530] border border-white/15 rounded p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="font-mono text-xs uppercase text-[#b4c5ff] font-semibold">
                    Balanço Nacional em Tempo Real (GDF)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#002046] p-2.5 rounded border border-white/10">
                    <div className="text-slate-400">População Soberana</div>
                    <div className="font-mono text-lg font-bold text-white">
                      {lakehouseStats ? lakehouseStats.citizens.toLocaleString('pt-BR') : '100.000'}
                    </div>
                    <div className="text-[10px] text-[#b4c5ff] font-mono">Módulo de Usuários Ativo</div>
                  </div>
                  <div className="bg-[#002046] p-2.5 rounded border border-white/10">
                    <div className="text-slate-400">Vínculos Familiares</div>
                    <div className="font-mono text-lg font-bold text-white">
                      {lakehouseStats ? lakehouseStats.family_links.toLocaleString('pt-BR') : '71.425'}
                    </div>
                    <div className="text-[10px] text-[#b4c5ff] font-mono">Grafo Civil Integrado</div>
                  </div>
                  <div className="bg-[#002046] p-2.5 rounded border border-white/10">
                    <div className="text-slate-400">Matrículas Escolares</div>
                    <div className="font-mono text-lg font-bold text-white">
                      {lakehouseStats ? lakehouseStats.edu_enrollments.toLocaleString('pt-BR') : '20.440'}
                    </div>
                    <div className="text-[10px] text-[#b4c5ff] font-mono">6 Escolas Nacionais</div>
                  </div>
                  <div className="bg-[#002046] p-2.5 rounded border border-white/10">
                    <div className="text-slate-400">Passaportes ICAO</div>
                    <div className="font-mono text-lg font-bold text-white">
                      {lakehouseStats ? lakehouseStats.passports.toLocaleString('pt-BR') : '44.088'}
                    </div>
                    <div className="text-[10px] text-[#b4c5ff] font-mono">Fronteira Biométrica</div>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full py-2.5 rounded bg-[#00356e] hover:bg-[#b4c5ff] hover:text-[#001848] text-white font-semibold text-xs border border-[#b4c5ff]/40 transition flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Abrir Console de Chat do Agente Orquestrador
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
          {/* SEPARAÇÃO EM 3 APLICAÇÕES FULL-STACK COMPLETAS E INDEPENDENTES */}
          <section className="space-y-4">
            <div className="border-b-2 border-[#002046] pb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-serif-authority text-2xl font-bold text-[#002046] flex items-center gap-2">
                  <Layers className="w-6 h-6 text-[#002046]" />
                  {t.architectureTitle}
                </h2>
                <p className="text-sm text-[#43474f]">{t.architectureDesc}</p>
              </div>
              <span className="font-mono text-xs text-[#002046] bg-[#dae2ff] px-2.5 py-1 rounded font-semibold">
                SSO Integrado com a Base de 100.000 Cidadãos
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CARD 1: PORTAL DO CIDADÃO (STANDALONE FULL-STACK APP) */}
              <div className="bg-white border-2 border-[#002046] rounded p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-[#dae2ff] text-[#001848] font-bold">
                      APLICAÇÃO FULL-STACK 02 • AUTAtendimento CIDADÃO
                    </span>
                    <span className="font-mono text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cloud Run Ativo
                    </span>
                  </div>
                  <h3 className="font-serif-authority text-2xl font-bold text-[#002046]">
                    {t.citizenPortalTitle}
                  </h3>
                  <p className="text-sm text-[#43474f] leading-relaxed">
                    {t.citizenPortalDesc}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#191c1e]">
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Carteira NID & Grafo Familiar</strong>
                      Validação NIST, árvore genealógica e mudança de endereço.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Saúde HL7 & Educação</strong>
                      Telemedicina com prescrição IA e boletim escolar por matéria.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Zeladoria 311 & SOS 911</strong>
                      Abertura de chamados urbanos e despacho de emergência.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Empresa 45s & Passaporte ICAO</strong>
                      Registro empresarial instantâneo e MRZ ICAO 9303.
                    </div>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[#43474f]">
                    Sessão SSO: <strong>{currentUser?.full_name}</strong> ({currentUser?.nid})
                  </div>
                  <a
                    href={citizenPortalLink}
                    className="bg-[#002046] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#00356e] transition flex items-center gap-2"
                  >
                    Acessar Portal do Cidadão Completo
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* CARD 2: BACKSTAGE GOVERNAMENTAL & IDENTIDADE 360 (STANDALONE FULL-STACK APP) */}
              <div className="bg-white border-2 border-[#002046] rounded p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-[#002046] text-[#b4c5ff] font-bold">
                      APLICAÇÃO FULL-STACK 03 • SERVIDORES & GESTORES PÚBLICOS
                    </span>
                    <span className="font-mono text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RBAC/ABAC Identidade 360
                    </span>
                  </div>
                  <h3 className="font-serif-authority text-2xl font-bold text-[#002046]">
                    {t.backstagePortalTitle}
                  </h3>
                  <p className="text-sm text-[#43474f] leading-relaxed">
                    {t.backstagePortalDesc}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-[#191c1e]">
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Gabinete PM Jopoco & IAM 360</strong>
                      Concessão e revogação imediata de permissões de servidores.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Gestão de Hospitais & Médicos</strong>
                      Unidades de saúde, corpo clínico e atendimento de telemedicina.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Gestão de Escolas & Professores</strong>
                      Lançamento de notas por matéria e aplicação de provas.
                    </div>
                    <div className="bg-[#f8f9fb] p-2.5 rounded border border-slate-200">
                      <strong className="text-[#002046] block">Comando 311/911 & Justiça</strong>
                      Resolução de demandas de cidadãos, fronteiras e Datalake 100k.
                    </div>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[#43474f]">
                    Status RBAC:{' '}
                    <strong className={currentUser?.backstage_allowed ? 'text-emerald-700' : 'text-amber-700'}>
                      {currentUser?.backstage_allowed ? `AUTORIZADO (${currentUser.iam_role})` : 'CIDADÃO COMUM (RESTRITO)'}
                    </strong>
                  </div>
                  <a
                    href={backstagePortalLink}
                    className="bg-[#00356e] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#002046] transition flex items-center gap-2"
                  >
                    Acessar Backstage Governamental
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* MATRIZ DE EVENTOS DA VIDA (GOV.UK / ESTÔNIA STYLE) */}
          <section className="space-y-4">
            <div className="border-b-2 border-[#002046] pb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-serif-authority text-2xl font-bold text-[#002046]">
                  {t.lifeEventsTitle}
                </h2>
                <p className="text-sm text-[#43474f]">{t.lifeEventsSubtitle}</p>
              </div>
              <span className="text-xs font-mono text-[#43474f]">
                Padrão de Austeridade Governamental • Zero-Trust Data Fabric
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Shield,
                  title: 'Identidade Civil, Família e Residência',
                  desc: 'Carteira Nacional NID com dígito verificador Mod-11, biometria NIST, árvore familiar (rel_family_graph) e atualização de domicílio.',
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
                  desc: 'Acompanhamento de matrícula escolar, frequência e desempenho em Matemática, Ciências, IA & Robótica e Idiomas.',
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
                <div
                  key={i}
                  className="bg-white border border-slate-200 hover:border-[#002046] rounded p-5 flex flex-col justify-between transition shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded bg-[#f2f4f6] flex items-center justify-center text-[#002046]">
                        <card.icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        Serviço Oficial
                      </span>
                    </div>
                    <h3 className="font-serif-authority text-lg font-bold text-[#002046]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#43474f] leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={card.href}
                      className="text-xs font-semibold text-[#002046] hover:underline flex items-center gap-1"
                    >
                      {card.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => sendMessageToOrchestrator(card.agentPrompt)}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-[#dae2ff]/60 text-[#001848] hover:bg-[#dae2ff] transition"
                    >
                      Pedir ao Agente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* INOVAÇÕES AGÊNTICAS DA REPÚBLICA DE NOVATLANTIS */}
          <section className="bg-white border border-slate-200 rounded p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif-authority text-xl font-bold text-[#002046] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00356e]" />
                  {t.innovationsTitle}
                </h2>
                <p className="text-xs text-[#43474f]">{t.innovationsSubtitle}</p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="text-xs font-semibold bg-[#002046] text-white px-3.5 py-2 rounded hover:bg-[#00356e] transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#b4c5ff]" />
                Testar no Chat do Agente Orquestrador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200 space-y-1.5">
                <div className="font-mono text-[10px] uppercase text-[#00356e] font-bold">
                  1. Zero-Form Life Events
                </div>
                <div className="font-serif-authority font-bold text-sm text-[#002046]">
                  Estado Proativo Sem Formulários
                </div>
                <p className="text-[#43474f]">
                  Ao registrar um nascimento ou mudança de endereço no GDF, o Agente Orquestrador atualiza automaticamente a unidade escolar, o médico de família e os benefícios fiscais.
                </p>
              </div>
              <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200 space-y-1.5">
                <div className="font-mono text-[10px] uppercase text-[#00356e] font-bold">
                  2. GovBiz 45-Second Incorporation
                </div>
                <div className="font-serif-authority font-bold text-sm text-[#002046]">
                  Abertura de Empresas em 45s
                </div>
                <p className="text-[#43474f]">
                  Constituição societária instantânea vinculada ao NID do cidadão e verificação automática de conformidade fiscal no Tesouro Soberano.
                </p>
              </div>
              <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200 space-y-1.5">
                <div className="font-mono text-[10px] uppercase text-[#00356e] font-bold">
                  3. Sovereign AI Ledger & Audit
                </div>
                <div className="font-serif-authority font-bold text-sm text-[#002046]">
                  Transparência Algorítmica 48h
                </div>
                <p className="text-[#43474f]">
                  Todo acesso de servidor público ou agente de IA ao prontuário do cidadão gera um registro imutável auditável pelo titular no Portal do Cidadão.
                </p>
              </div>
              <div className="p-4 rounded bg-[#f8f9fb] border border-slate-200 space-y-1.5">
                <div className="font-mono text-[10px] uppercase text-[#00356e] font-bold">
                  4. Identidade 360 Dynamic RBAC
                </div>
                <div className="font-serif-authority font-bold text-sm text-[#002046]">
                  Governança de Acesso de Servidores
                </div>
                <p className="text-[#43474f]">
                  Servidores acessam o Backstage com seu próprio NID/e-mail. Quando a permissão é revogada na Identidade 360, voltam imediatamente a ser cidadãos comuns.
                </p>
              </div>
            </div>
          </section>

          {/* MICROSSERVIÇOS VERTICAIS NO CLOUD RUN */}
          <section className="bg-white border border-slate-200 rounded p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-serif-authority text-base font-bold text-[#002046]">
                  Ecossistema Completo de Aplicações Soberanas em Produção (Google Cloud Run • Argolis)
                </h3>
                <p className="text-xs text-[#43474f]">
                  Todas as 3 aplicações principais e os 5 microsserviços setoriais operam de forma integrada no projeto <code className="font-mono">novatlantis</code>.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              <a
                href={citizenPortalLink}
                className="p-2.5 rounded border border-[#002046] bg-[#dae2ff]/40 hover:bg-[#dae2ff] text-[#001848] font-semibold flex items-center justify-between"
              >
                <span>Portal Cidadão</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={backstagePortalLink}
                className="p-2.5 rounded border border-[#002046] bg-[#002046] text-white font-semibold flex items-center justify-between"
              >
                <span>Gov Backstage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SATELLITE_URLS.nid}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded border border-slate-200 hover:border-[#002046] text-[#002046] font-medium flex items-center justify-between"
              >
                <span>Identity NID</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SATELLITE_URLS.s311}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded border border-slate-200 hover:border-[#002046] text-[#002046] font-medium flex items-center justify-between"
              >
                <span>Serviços 311</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SATELLITE_URLS.s911}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded border border-slate-200 hover:border-[#002046] text-[#002046] font-medium flex items-center justify-between"
              >
                <span>Emergência 911</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SATELLITE_URLS.health}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded border border-slate-200 hover:border-[#002046] text-[#002046] font-medium flex items-center justify-between"
              >
                <span>Saúde Telemed</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SATELLITE_URLS.edu}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded border border-slate-200 hover:border-[#002046] text-[#002046] font-medium flex items-center justify-between"
              >
                <span>Educação IA</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* DRAWER / MODAL DE CHAT DO AGENTE ORQUESTRADOR DE ESTADO */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l-4 border-[#002046]">
            {/* Cabeçalho do Chat Orquestrador */}
            <div className="bg-[#002046] text-white px-5 py-4 flex items-center justify-between border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#00356e] border border-[#b4c5ff]/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#b4c5ff]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-authority font-bold text-base text-white">
                      Agente Orquestrador de Estado • Novatlantis
                    </h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      GDF 100K ATIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Cidadão em sessão: <strong>{currentUser?.full_name}</strong> ({currentUser?.nid})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded bg-[#00356e] hover:bg-white/20 text-white transition"
                title="Fechar Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Histórico de Mensagens do Chat */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fb]">
              {chatTurns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded p-4 text-xs leading-relaxed ${
                      turn.role === 'user'
                        ? 'bg-[#002046] text-white'
                        : 'bg-white text-[#191c1e] border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-current/10 font-mono text-[10px] opacity-75">
                      <span>
                        {turn.role === 'user'
                          ? `${currentUser?.full_name || 'Cidadão'} (${currentUser?.nid})`
                          : `AGENTE ORQUESTRADOR DE ESTADO ${turn.intent ? `• [${turn.intent}]` : ''}`}
                      </span>
                      <span>{turn.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-line">{turn.message}</div>

                    {/* Trace de Orquestração Multi-Agente */}
                    {turn.orchestration_steps && turn.orchestration_steps.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 bg-[#f2f4f6] rounded p-2.5 space-y-1">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#002046] flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> Trace de Orquestração Multi-Agente (GDF SQLite)
                        </div>
                        {turn.orchestration_steps.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-[#43474f]">
                            <span>
                              <strong className="text-[#002046]">{s.agent}:</strong> {s.step}
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              {s.status} ({s.latency_ms}ms)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card de Transação Executada no Banco de Dados */}
                    {turn.action_card && (
                      <div className="mt-3 border-2 border-[#002046] rounded bg-[#dae2ff]/25 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#002046] text-white">
                            {turn.action_card.type}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-emerald-800">
                            {turn.action_card.status} • #{turn.action_card.reference_id}
                          </span>
                        </div>
                        <div className="font-serif-authority font-bold text-sm text-[#002046]">
                          {turn.action_card.title}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white p-2 rounded border border-slate-200">
                          {Object.entries(turn.action_card.details).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-500 uppercase font-mono text-[10px]">{k}: </span>
                              <strong className="text-[#191c1e]">{v}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={turn.action_card.target_url}
                            className="inline-flex items-center gap-1.5 bg-[#002046] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#00356e] transition"
                          >
                            Abrir no {turn.action_card.target_portal === 'gov-backstage' ? 'Backstage Governamental' : 'Portal do Cidadão'}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Sugestões de Próximos Passos */}
                    {turn.suggested_prompts && turn.suggested_prompts.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {turn.suggested_prompts.map((sp) => (
                          <button
                            key={sp}
                            onClick={() => sendMessageToOrchestrator(sp)}
                            className="text-[11px] px-2.5 py-1 rounded bg-[#f2f4f6] hover:bg-[#dae2ff] text-[#002046] font-medium border border-slate-300 transition flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3" />
                            {sp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatSending && (
                <div className="text-xs font-mono text-[#002046] bg-white border border-slate-200 rounded p-3 inline-flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin text-[#00356e]" />
                  Orquestrando agentes setoriais e consultando o banco de 100.000 cidadãos...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Rodapé de Entrada de Mensagem no Chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageToOrchestrator(chatInput);
              }}
              className="p-4 bg-white border-t border-slate-200 flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Digite sua solicitação ao Agente Orquestrador (ex: Emitir passaporte, Abrir empresa, Agendar médico)..."
                className="flex-1 border border-slate-300 rounded px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002046]"
              />
              <button
                type="submit"
                disabled={chatSending}
                className="bg-[#002046] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#00356e] transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RODAPÉ INSTITUCIONAL AUSTERO */}
      <footer className="bg-[#001530] text-slate-300 text-xs border-t-4 border-[#002046] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/coat_of_arms.jpg"
              alt="Brasão de Novatlantis"
              className="h-10 w-10 object-contain rounded bg-white p-0.5"
            />
            <div>
              <div className="font-serif-authority font-bold text-white text-sm">
                República Digital de Novatlantis • Chancelaria do Primeiro-Ministro (Jopoco)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Projeto Google Cloud Argolis: novatlantis • Datalake GDF: 100.000 Cidadãos • 3 Aplicações Full-Stack Separadas
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href={citizenPortalLink} className="text-[#b4c5ff] hover:underline">
              Portal do Cidadão
            </a>
            <a href={backstagePortalLink} className="text-[#b4c5ff] hover:underline">
              Backstage Governamental
            </a>
            <button onClick={() => setChatOpen(true)} className="text-[#b4c5ff] hover:underline">
              Chat do Agente Orquestrador
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
