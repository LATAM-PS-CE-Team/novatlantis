import React, { useEffect, useState } from 'react';

type Locale = 'pt-BR' | 'es-419' | 'en-US';
type WorkspaceView = 'PUBLIC_PORTAL' | 'CITIZEN_HUB' | 'GOVERNMENT_BACKSTAGE';
type BackstageTab =
  | 'pm_cabinet'
  | 'iam_360'
  | 'health_backstage'
  | 'edu_backstage'
  | 'ops_311_911'
  | 'justice_treasury'
  | 'gdf_lakehouse';

const QUICK_PROFILES = [
  {
    nid: 'NID-000-0000-0001-9',
    label: 'Primeiro-Ministro (jopoco — Root)',
    roleHint: 'PRIME_MINISTER_ROOT',
    email: 'jopoco@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0002-7',
    label: 'Secretário-Geral (Alexandre Vance)',
    roleHint: 'SECRETARY_GENERAL',
    email: 'secretario.geral@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0003-5',
    label: 'Gestora Identidade 360 (Helena)',
    roleHint: 'IDENTITY_MANAGER_360',
    email: 'gestor.identidade@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0004-3',
    label: 'Médica / Gestora Saúde (Dra. Sofia)',
    roleHint: 'DOCTOR_AND_HEALTH_MANAGER',
    email: 'dra.sofia.mendes@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0006-0',
    label: 'Professor / Gestor Educação (Prof. Lucas)',
    roleHint: 'TEACHER_AND_EDU_MANAGER',
    email: 'prof.lucas.silva@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0008-6',
    label: 'Gestor 311 & 911 (Com. Rafael)',
    roleHint: 'OPERATIONS_311_911_MANAGER',
    email: 'comandante.rafael@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0009-4',
    label: 'Magistrada & Fronteiras (Juíza Clara)',
    roleHint: 'JUSTICE_AND_TREASURY_MANAGER',
    email: 'juiza.clara.sterling@novatlantis.gov.cloud'
  },
  {
    nid: 'NID-000-0000-0010-2',
    label: 'Cidadão / Estudante (Pedro — 11 anos)',
    roleHint: 'CITIZEN_COMMON',
    email: 'pedro.albuquerque@cidadania.novatlantis.gov'
  }
];

const SATELLITE_URLS = {
  nid: 'https://novatlantis-identity-nid-wpahcxvhuq-uc.a.run.app',
  s311: 'https://novatlantis-services-311-wpahcxvhuq-uc.a.run.app',
  s911: 'https://novatlantis-emergency-911-wpahcxvhuq-uc.a.run.app',
  health: 'https://novatlantis-health-telemed-wpahcxvhuq-uc.a.run.app',
  edu: 'https://novatlantis-education-learn-wpahcxvhuq-uc.a.run.app'
};

export function App() {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [view, setView] = useState<WorkspaceView>('PUBLIC_PORTAL');
  const [backstageTab, setBackstageTab] = useState<BackstageTab>('pm_cabinet');

  const [loginInput, setLoginInput] = useState('NID-000-0000-0001-9');
  const [citizen, setCitizen] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // Command bar on public portal
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentResponse, setAgentResponse] = useState<string | null>(null);

  // Backstage data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [iamData, setIamData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [eduData, setEduData] = useState<any>(null);
  const [opsData, setOpsData] = useState<any>(null);
  const [justiceData, setJusticeData] = useState<any>(null);

  // GDF 100k Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCredential, setSearchCredential] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inspectedCitizen, setInspectedCitizen] = useState<any>(null);

  // Forms for Citizen & Backstage
  const [new311Category, setNew311Category] = useState('Iluminação Fotovoltaica & Smart Grid');
  const [new311District, setNew311District] = useState('Distrito Tecnológico');
  const [new311Desc, setNew311Desc] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companySector, setCompanySector] = useState('IA Soberana & Automação Cognitiva');

  const [grantTargetNid, setGrantTargetNid] = useState('NID-000-0000-0005-1');
  const [grantRoleCode, setGrantRoleCode] = useState('DOCTOR_TELEMED');

  const [telemedPatientNid, setTelemedPatientNid] = useState('NID-000-0000-0010-2');
  const [telemedComplaint, setTelemedComplaint] = useState('Revisão clínica respiratória e renovação de receita preventiva');
  const [telemedMedication, setTelemedMedication] = useState('Budesonida 200mcg — 1 aplicação 12/12h por 30 dias');

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({
    score_mathematics: 88,
    score_sciences: 90,
    score_ai_robotics: 95,
    score_languages: 86,
    attendance_rate: 94
  });
  const [examTitle, setExamTitle] = useState('Exame Nacional de Raciocínio Algorítmico & Robótica');
  const [examSubject, setExamSubject] = useState('AI & Robotics');

  const notify = (type: 'info' | 'success' | 'error', text: string) => {
    setBannerMsg({ type, text });
    setTimeout(() => {
      setBannerMsg(prev => (prev?.text === text ? null : prev));
    }, 7000);
  };

  const authenticateCitizen = async (identifier: string, switchView?: WorkspaceView) => {
    setLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Falha na autenticação GDF.');
        setLoadingAuth(false);
        return;
      }
      setCitizen(data.citizen);
      setLoginInput(data.citizen.citizen_id);
      if (data.citizen.native_language) {
        setLocale(data.citizen.native_language as Locale);
      }
      if (switchView) {
        if (switchView === 'GOVERNMENT_BACKSTAGE' && !data.citizen.backstage_allowed) {
          setView('CITIZEN_HUB');
          notify(
            'error',
            `Acesso Backstage Negado pela Identidade 360: ${data.citizen.full_name} possui perfil de Cidadão Comum (CITIZEN_COMMON). Redirecionado ao Espaço do Cidadão.`
          );
        } else {
          setView(switchView);
        }
      } else if (view === 'GOVERNMENT_BACKSTAGE' && !data.citizen.backstage_allowed) {
        setView('CITIZEN_HUB');
        notify(
          'info',
          `Sessão atualizada: ${data.citizen.full_name} não possui permissão ativa na Identidade 360 e está no modo Cidadão Comum.`
        );
      }
      // Ajusta aba inicial do backstage conforme módulos permitidos
      if (data.citizen.allowed_modules?.length > 0) {
        if (!data.citizen.allowed_modules.includes(backstageTab)) {
          setBackstageTab(data.citizen.allowed_modules[0] as BackstageTab);
        }
      }
    } catch (e: any) {
      notify('error', e.message || 'Erro de conexão com servidor GDF.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadAllBackstageData = async () => {
    try {
      const [ov, iam, hlth, edu, ops, jst] = await Promise.all([
        fetch('/api/backstage/overview').then(r => r.json()),
        fetch('/api/iam360/roles').then(r => r.json()),
        fetch('/api/backstage/health').then(r => r.json()),
        fetch('/api/backstage/education').then(r => r.json()),
        fetch('/api/backstage/operations').then(r => r.json()),
        fetch('/api/backstage/justice-treasury').then(r => r.json())
      ]);
      setOverviewData(ov);
      setIamData(iam);
      setHealthData(hlth);
      setEduData(edu);
      setOpsData(ops);
      setJusticeData(jst);
      if (edu?.students?.length > 0 && !selectedStudent) {
        const st = edu.students[0];
        setSelectedStudent(st);
        setGradeForm({
          score_mathematics: st.score_mathematics,
          score_sciences: st.score_sciences,
          score_ai_robotics: st.score_ai_robotics,
          score_languages: st.score_languages,
          attendance_rate: st.attendance_rate
        });
      }
    } catch (e) {
      console.error('Erro ao carregar dados do Backstage:', e);
    }
  };

  const runCitizenSearch = async (q = searchQuery, cred = searchCredential) => {
    try {
      const res = await fetch(
        `/api/gdf/search?q=${encodeURIComponent(q)}&credential=${encodeURIComponent(cred)}&limit=30`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const inspectCitizenByNid = async (nid: string) => {
    try {
      const res = await fetch(`/api/gdf/citizen/${encodeURIComponent(nid)}`);
      const data = await res.json();
      if (res.ok) setInspectedCitizen(data.citizen);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    authenticateCitizen('NID-000-0000-0001-9');
    loadAllBackstageData();
    runCitizenSearch('', '');
  }, []);

  const handleAgentCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const q = agentPrompt.trim().toLowerCase();
    if (!q) return;
    if (q.includes('empresa') || q.includes('company')) {
      setView('CITIZEN_HUB');
      setAgentResponse(
        'Agente Soberano: Redirecionando para o Módulo de Abertura de Empresa Autônoma em 45s vinculada ao seu NID.'
      );
    } else if (q.includes('saúde') || q.includes('medico') || q.includes('telemed')) {
      setView(citizen?.backstage_allowed ? 'GOVERNMENT_BACKSTAGE' : 'CITIZEN_HUB');
      if (citizen?.backstage_allowed) setBackstageTab('health_backstage');
      setAgentResponse('Agente Soberano: Abrindo Prontuário Único HL7 FHIR e Sala de Telemedicina.');
    } else if (q.includes('escola') || q.includes('aluno') || q.includes('professor') || q.includes('nota')) {
      setView(citizen?.backstage_allowed ? 'GOVERNMENT_BACKSTAGE' : 'CITIZEN_HUB');
      if (citizen?.backstage_allowed) setBackstageTab('edu_backstage');
      setAgentResponse('Agente Soberano: Abrindo Gestão Escolar, Notas por Matéria e Alerta de Frequência GDF.');
    } else if (q.includes('identidade') || q.includes('permiss') || q.includes('360')) {
      if (citizen?.backstage_allowed) {
        setView('GOVERNMENT_BACKSTAGE');
        setBackstageTab('iam_360');
      } else {
        setView('CITIZEN_HUB');
      }
      setAgentResponse('Agente Soberano: Acessando Autoridade de Identidade 360 (RBAC/ABAC Governamental).');
    } else {
      setAgentResponse(
        `Protocolo Agêntico #NV-${Math.floor(1000 + Math.random() * 9000)}: Solicitação "${agentPrompt}" autenticada para ${
          citizen?.full_name || 'Cidadão'
        } (${citizen?.citizen_id || 'NID'}). Você pode concluí-la diretamente no Espaço do Cidadão ou no Backstage.`
      );
    }
  };

  const handleGrantRole = async (targetNid: string, roleCode: string) => {
    if (!citizen) return;
    const res = await fetch('/api/iam360/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_nid: citizen.citizen_id,
        target_nid: targetNid,
        role_code: roleCode
      })
    });
    const data = await res.json();
    if (!res.ok) {
      notify('error', data.error || 'Erro ao conceder permissão.');
      return;
    }
    notify('success', data.message);
    await loadAllBackstageData();
    await runCitizenSearch();
    if (targetNid === citizen.citizen_id) {
      await authenticateCitizen(citizen.citizen_id);
    }
  };

  const handleRevokeRole = async (targetNid: string) => {
    if (!citizen) return;
    const res = await fetch('/api/iam360/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor_nid: citizen.citizen_id,
        target_nid: targetNid
      })
    });
    const data = await res.json();
    if (!res.ok) {
      notify('error', data.error || 'Erro ao revogar permissão.');
      return;
    }
    notify('success', data.message);
    await loadAllBackstageData();
    await runCitizenSearch();
    if (targetNid === citizen.citizen_id) {
      await authenticateCitizen(citizen.citizen_id);
    }
  };

  const handleCreate311 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;
    const res = await fetch('/api/services/311', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizen_id: citizen.citizen_id,
        category: new311Category,
        district: new311District,
        description: new311Desc || 'Solicitação de manutenção preventiva registrada pelo cidadão.'
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      setNew311Desc('');
      loadAllBackstageData();
    }
  };

  const handleResolve311 = async (ticketId: string) => {
    const res = await fetch('/api/services/311/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: ticketId,
        resolver_nid: citizen?.citizen_id,
        resolution_notes: `Concluído e auditado no Backstage por ${citizen?.full_name} (${citizen?.citizen_id}).`
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      loadAllBackstageData();
    }
  };

  const handleTrigger911 = async (emergencyType: string) => {
    if (!citizen) return;
    const res = await fetch('/api/services/911', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizen_id: citizen.citizen_id,
        emergency_type: emergencyType,
        location_district: citizen.residence?.district || 'Distrito Tecnológico'
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      loadAllBackstageData();
    }
  };

  const handleOpenCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;
    const res = await fetch('/api/services/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_nid: citizen.citizen_id,
        company_name: companyName || `${citizen.full_name.split(' ')[0]} Autonomous Ventures NV`,
        sector: companySector
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      setCompanyName('');
      loadAllBackstageData();
    } else {
      notify('error', data.error);
    }
  };

  const handleRequestPassport = async () => {
    if (!citizen) return;
    const res = await fetch('/api/services/passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizen_id: citizen.citizen_id })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      authenticateCitizen(citizen.citizen_id);
      loadAllBackstageData();
    } else {
      notify('error', data.error);
    }
  };

  const handleRecordTelemed = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/backstage/health/telemed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_nid: telemedPatientNid,
        doctor_nid: citizen?.citizen_id || 'NID-000-0000-0004-3',
        hospital_id: 'HOSP-NV-01',
        chief_complaint: telemedComplaint,
        prescription_medication: telemedMedication
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      loadAllBackstageData();
    }
  };

  const handleSaveStudentGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const res = await fetch('/api/backstage/education/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_nid: citizen?.citizen_id,
        student_nid: selectedStudent.citizen_id,
        ...gradeForm
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', `${data.message} Nova média: ${data.performance_index}`);
      loadAllBackstageData();
    }
  };

  const handleApplyExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/backstage/education/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institution_id: 'SCH-NV-002',
        teacher_nid: citizen?.citizen_id || 'NID-000-0000-0006-0',
        teacher_name: citizen?.full_name || 'Prof. Lucas Albuquerque Silva',
        subject: examSubject,
        grade_level: 'FUNDAMENTAL_II',
        title: examTitle
      })
    });
    const data = await res.json();
    if (res.ok) {
      notify('success', data.message);
      loadAllBackstageData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fc] text-[#191c1e]">
      {/* Top Sovereign Status Bar (Austere Institutional Header) */}
      <div className="bg-[#141a32] text-white py-1.5 px-6 text-xs font-label flex flex-wrap justify-between items-center border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#57fbdb]"></span>
          <span className="tracking-wider uppercase font-semibold">
            GOVERNO DA REPÚBLICA DIGITAL DE NOVATLANTIS — INFRAESTRUTURA PÚBLICA DIGITAL
          </span>
          <span className="hidden lg:inline text-slate-400">|</span>
          <span className="hidden lg:inline text-slate-300 font-mono text-[11px]">
            GDF LAKEHOUSE: 100.000 CIDADÃOS ATIVOS (PROJETO GCP: novatlantis)
          </span>
        </div>
        <div className="flex items-center space-x-5">
          <span className="text-slate-300 hidden sm:inline">
            STATUS DO CONSENSO: <strong className="text-[#57fbdb]">ATIVO</strong>
          </span>
          <span className="text-slate-300 hidden md:inline">
            REDE SOBERANA: <strong>NÍVEL 1 (ZERO TRUST IAP)</strong>
          </span>
          <div className="flex items-center space-x-1 border-l border-slate-700 pl-4">
            {(['pt-BR', 'es-419', 'en-US'] as Locale[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`px-2 py-0.5 text-[11px] font-mono uppercase transition-colors ${
                  locale === lang
                    ? 'bg-white text-[#141a32] font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang.split('-')[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Institutional Navigation Header */}
      <header className="bg-white border-b border-[#c6c6ce]/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <img
              src="/assets/coat-of-arms-novatlantis.jpg"
              alt="Brasão Oficial de Novatlantis"
              className="w-11 h-11 object-contain border border-[#c6c6ce] p-0.5 bg-white"
            />
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 font-headline leading-none">
                  REPÚBLICA DE NOVATLANTIS
                </span>
                <img
                  src="/assets/flag-novatlantis.jpg"
                  alt="Bandeira de Novatlantis"
                  className="h-4 w-7 object-cover border border-slate-300"
                />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
                Portal Oficial de Serviços, Identidade 360 e Backstage de Estado
              </span>
            </div>
          </div>

          {/* Primary Workspace Switcher */}
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setView('PUBLIC_PORTAL')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center space-x-1.5 ${
                view === 'PUBLIC_PORTAL'
                  ? 'bg-[#141a32] text-white border-[#141a32]'
                  : 'bg-white text-slate-700 border-[#c6c6ce] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">account_balance</span>
              <span>Portal da Nação</span>
            </button>

            <button
              onClick={() => setView('CITIZEN_HUB')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center space-x-1.5 ${
                view === 'CITIZEN_HUB'
                  ? 'bg-[#141a32] text-white border-[#141a32]'
                  : 'bg-white text-slate-700 border-[#c6c6ce] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              <span>Espaço do Cidadão (NID)</span>
            </button>

            <button
              onClick={() => {
                if (!citizen?.backstage_allowed) {
                  notify(
                    'error',
                    `Acesso Restrito: O cidadão ${citizen?.full_name} (${citizen?.citizen_id}) possui perfil CITIZEN_COMMON sem permissão ativa na aplicação Identidade 360.`
                  );
                  return;
                }
                setView('GOVERNMENT_BACKSTAGE');
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center space-x-1.5 ${
                view === 'GOVERNMENT_BACKSTAGE'
                  ? 'bg-[#0061a5] text-white border-[#0061a5]'
                  : citizen?.backstage_allowed
                  ? 'bg-[#f2f4f7] text-[#0061a5] border-[#0061a5]/40 hover:bg-[#e6e8eb]'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title={
                citizen?.backstage_allowed
                  ? 'Acessar Ambiente Administrativo de Servidores e Gestores Públicos'
                  : 'Requer permissão administrativa ativa na aplicação Identidade 360'
              }
            >
              <span className="material-symbols-outlined text-base">
                {citizen?.backstage_allowed ? 'admin_panel_settings' : 'lock'}
              </span>
              <span>Backstage Governamental</span>
              {citizen?.backstage_allowed && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-[#00957f] text-white font-mono">
                  360 ATIVO
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Unified Single Sign-On Bar (Mesmo ID / E-mail do Cidadão -> Resolução Identidade 360) */}
        <div className="bg-[#f2f4f7] border-t border-[#c6c6ce]/60 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <span className="material-symbols-outlined text-sm mr-1 text-[#0061a5]">verified_user</span>
                Login Único Cidadão / Servidor (NID ou E-mail):
              </span>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  authenticateCitizen(loginInput);
                }}
                className="flex items-center"
              >
                <input
                  type="text"
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="Ex: NID-000-0000-0001-9 ou email"
                  className="px-2.5 py-1 text-xs font-mono bg-white border border-[#c6c6ce] text-slate-900 w-56 focus:outline-none focus:border-[#0061a5]"
                />
                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="bg-[#141a32] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                >
                  {loadingAuth ? '...' : 'Autenticar'}
                </button>
              </form>

              <select
                value={citizen?.citizen_id || 'NID-000-0000-0001-9'}
                onChange={e => authenticateCitizen(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-[#c6c6ce] text-slate-800 font-medium focus:outline-none focus:border-[#0061a5]"
              >
                {QUICK_PROFILES.map(p => (
                  <option key={p.nid} value={p.nid}>
                    Troca Rápida: {p.label} [{p.nid}]
                  </option>
                ))}
              </select>
            </div>

            {citizen && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-2 bg-white px-3 py-1 border border-[#c6c6ce]">
                  <span className="font-mono font-bold text-slate-900">{citizen.citizen_id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-slate-800">{citizen.full_name}</span>
                  <span className="text-slate-500">({citizen.age}a)</span>
                </div>
                <div
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${
                    citizen.backstage_allowed
                      ? 'bg-[#141a32] text-white border-[#141a32]'
                      : 'bg-white text-slate-700 border-[#c6c6ce]'
                  }`}
                >
                  Identidade 360: {citizen.effective_role_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Notification Banner */}
      {bannerMsg && (
        <div
          className={`border-b px-6 py-3 text-xs font-medium ${
            bannerMsg.type === 'error'
              ? 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]'
              : bannerMsg.type === 'success'
              ? 'bg-[#e6f7f4] text-[#005044] border-[#00957f]'
              : 'bg-[#e8f1fa] text-[#00487c] border-[#0061a5]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-base">
                {bannerMsg.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{bannerMsg.text}</span>
            </div>
            <button onClick={() => setBannerMsg(null)} className="text-xs underline font-bold ml-4">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: PORTAL INSTITUCIONAL AUSTERO ("SOVEREIGN CIVIC")
      ===================================================================== */}
      {view === 'PUBLIC_PORTAL' && (
        <main className="flex-grow">
          {/* Hero & Agentic Command Center */}
          <section className="bg-[#f2f4f7] border-b border-[#c6c6ce]/60 py-14 px-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="inline-block px-2.5 py-1 bg-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-widest">
                    Estado Digital Soberano • Era Agêntica
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    Lema Constitucional: NOVATLANTIS • LIBERTAS IN DIGITALI
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4 font-headline">
                  Serviços Públicos e Governança Agêntica ao Alcance do Cidadão.
                </h1>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Bem-vindo ao portal central da República de Novatlantis. Nossa administração opera em regime de
                  transparência algorítmica total, austeridade institucional e eficiência computacional contínua para
                  todos os 100.000 cidadãos.
                </p>
              </div>

              {/* Agentic Command Bar */}
              <div className="bg-white p-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(20,26,50,1)]">
                <form onSubmit={handleAgentCommand} className="flex items-center">
                  <span className="material-symbols-outlined px-4 text-slate-500 text-2xl">terminal</span>
                  <input
                    type="text"
                    value={agentPrompt}
                    onChange={e => setAgentPrompt(e.target.value)}
                    placeholder="Solicite qualquer serviço público ao Agente de Estado (ex: 'Abrir empresa em 45s', 'Agendar telemedicina', 'Ver notas escolares')..."
                    className="w-full py-3.5 px-2 text-slate-900 placeholder-slate-400 focus:outline-none text-base font-body border-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    className="bg-[#141a32] text-white px-7 py-3.5 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shrink-0"
                  >
                    Executar
                  </button>
                </form>
              </div>

              {agentResponse && (
                <div className="mt-4 bg-white border border-[#0061a5] p-4 flex items-center justify-between">
                  <div className="text-xs text-slate-800">
                    <strong className="uppercase text-[#0061a5] mr-2">Despacho do Agente Estatal:</strong>
                    {agentResponse}
                  </div>
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="ml-4 px-3 py-1.5 bg-[#141a32] text-white text-[11px] font-bold uppercase tracking-wider shrink-0"
                  >
                    Ir ao Serviço
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Comandos frequentes:</span>
                <button
                  onClick={() => {
                    setView('CITIZEN_HUB');
                  }}
                  className="bg-white border border-slate-300 px-2.5 py-1 hover:border-slate-600 text-slate-700"
                >
                  "Renovar Identidade Soberana (NID)"
                </button>
                <button
                  onClick={() => {
                    setView('CITIZEN_HUB');
                  }}
                  className="bg-white border border-slate-300 px-2.5 py-1 hover:border-slate-600 text-slate-700"
                >
                  "Auditar Imposto sobre Computação & UBI"
                </button>
                <button
                  onClick={() => {
                    setView('CITIZEN_HUB');
                  }}
                  className="bg-white border border-slate-300 px-2.5 py-1 hover:border-slate-600 text-slate-700"
                >
                  "Requerer Passaporte Digital ICAO"
                </button>
                {citizen?.backstage_allowed && (
                  <button
                    onClick={() => setView('GOVERNMENT_BACKSTAGE')}
                    className="bg-[#141a32] text-white px-2.5 py-1 font-semibold"
                  >
                    "Acessar Backstage Governamental ({citizen.effective_role_code})"
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Key Sovereign Metrics Bar */}
          <section className="bg-white border-b border-[#c6c6ce]/60">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="pt-4 sm:pt-0 sm:px-4 first:pl-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tempo Médio de Resolução
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-headline tabular-nums">1.4 Segundos</p>
                  <p className="text-[11px] text-[#006b5b] font-medium mt-1">
                    99.98% via Agentes Autônomos Auditáveis
                  </p>
                </div>
                <div className="pt-4 sm:pt-0 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    População Registrada (GDF)
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-headline tabular-nums">
                    {overviewData?.counts?.dim_citizens?.toLocaleString('pt-BR') || '100.000'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    100% Biometria NIST + {overviewData?.counts?.rel_family_graph?.toLocaleString('pt-BR') || '58.985'}{' '}
                    Vínculos Familiares
                  </p>
                </div>
                <div className="pt-4 sm:pt-0 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Custo Operacional do Estado
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-headline tabular-nums">0.42% do PIB</p>
                  <p className="text-[11px] text-[#006b5b] font-medium mt-1">
                    Austeridade Máxima • Zero Burocracia Redundante
                  </p>
                </div>
                <div className="pt-4 sm:pt-0 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                     Soberania de Dados (Lakehouse)
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-headline tabular-nums">Nível 5 (Máx)</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    BigQuery Silver/Gold + Criptografia Pós-Quântica
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Grid: Bento Layout of Civic Services */}
          <section className="max-w-7xl mx-auto px-6 py-14">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-slate-300 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
                  Serviços Essenciais ao Cidadão e ao Gestor Público
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Acesso direto aos módulos operacionais da República conectados ao banco de 100.000 cidadãos.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('CITIZEN_HUB')}
                  className="text-[#0061a5] text-xs font-bold uppercase tracking-wider flex items-center hover:underline"
                >
                  Abrir Meu Painel do Cidadão
                  <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Service Card 1 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">badge</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-ID-01 • IDENTIDADE 360
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Identidade Soberana (NID) & Grafo Familiar
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Gestão de credenciais biométricas NIST, chaves públicas Ed25519, árvore familiar civil e controle de
                    permissões administrativas (Identidade 360).
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Emitir / Inspecionar Credencial NID</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button
                    onClick={() => {
                      if (citizen?.backstage_allowed) {
                        setView('GOVERNMENT_BACKSTAGE');
                        setBackstageTab('iam_360');
                      } else {
                        setView('CITIZEN_HUB');
                      }
                    }}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Gerenciar Permissões na Aplicação Identidade 360</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <a
                    href={SATELLITE_URLS.nid}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left text-xs font-mono text-slate-500 hover:text-slate-900 flex justify-between items-center py-1"
                  >
                    <span>Microsserviço Isolado NID (Cloud Run)</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Service Card 2 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">account_balance_wallet</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-ECON-02 • TESOURO
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Tributação Automática, UBI & Empresas em 45s
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Abertura de empresas 100% autônomas em 45 segundos, cota soberana de TFLOPs e recebimento do
                    Dividendo Universal de Computação (UBI).
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Abrir Empresa Digital em 45 Segundos</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Extrato do Dividendo Nacional de IA (UBI)</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Service Card 3 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">gavel</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-JUS-03 • FRONTEIRAS
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Justiça Algorítmica & Passaporte ICAO
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Emissão instantânea de passaporte eletrônico ICAO integrada à verificação criminal e fiscal no GDF
                    e câmaras de mediação civil por IA.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Solicitar / Validar Passaporte Digital ICAO</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button
                    onClick={() => {
                      if (citizen?.backstage_allowed) {
                        setView('GOVERNMENT_BACKSTAGE');
                        setBackstageTab('gdf_lakehouse');
                      } else {
                        setView('CITIZEN_HUB');
                      }
                    }}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Cruzamento Fronteira (Passaporte x Justiça x Fisco)</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Service Card 4 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">medical_services</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-SAU-04 • HL7 FHIR
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Saúde Preventiva, Hospitais & Telemedicina
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Prontuário único HL7 FHIR, carteira vacinal, teleconsultas com transcrição clínica SOAP e console de
                    gestão hospitalar e médica no Backstage.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Acessar Prontuário HL7 & Vacinas do Cidadão</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button
                    onClick={() => {
                      if (citizen?.backstage_allowed) {
                        setView('GOVERNMENT_BACKSTAGE');
                        setBackstageTab('health_backstage');
                      } else {
                        setView('CITIZEN_HUB');
                      }
                    }}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Backstage Médico: Hospitais & Telemedicina</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <a
                    href={SATELLITE_URLS.health}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left text-xs font-mono text-slate-500 hover:text-slate-900 flex justify-between items-center py-1"
                  >
                    <span>Microsserviço Telemedicina (Cloud Run)</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Service Card 5 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">domain</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-URB-05 • 311 & 911
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Zeladoria Urbana 311 & Emergência 911
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Abertura de demandas urbanas 311 e despacho 911 com cruzamento automático de tipo sanguíneo,
                    alergias e notificação imediata de familiares.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Abrir Demanda 311 ou Acionar Resgate 911</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <div className="flex gap-3 pt-1">
                    <a
                      href={SATELLITE_URLS.s311}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-slate-500 hover:text-slate-900 underline"
                    >
                      App 311
                    </a>
                    <a
                      href={SATELLITE_URLS.s911}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-[#ba1a1a] hover:underline font-semibold"
                    >
                      App 911 SOS
                    </a>
                  </div>
                </div>
              </div>

              {/* Service Card 6 */}
              <div className="bg-white border border-[#c6c6ce] p-6 hover:border-slate-900 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#141a32]">school</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
                      MOD-EDU-06 • ENSINO
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                    Educação Contínua, Escolas & Diário Docente
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Trilhas adaptativas por IA para os 17.993 estudantes matriculados, gestão de escolas, aplicação de
                    provas e boletim analítico por matéria.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setView('CITIZEN_HUB')}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Painel do Estudante & Desempenho por Matéria</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button
                    onClick={() => {
                      if (citizen?.backstage_allowed) {
                        setView('GOVERNMENT_BACKSTAGE');
                        setBackstageTab('edu_backstage');
                      } else {
                        setView('CITIZEN_HUB');
                      }
                    }}
                    className="w-full text-left text-xs font-semibold text-[#0061a5] hover:underline flex justify-between items-center py-1"
                  >
                    <span>Backstage Professor: Escolas, Provas & Notas</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <a
                    href={SATELLITE_URLS.edu}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left text-xs font-mono text-slate-500 hover:text-slate-900 flex justify-between items-center py-1"
                  >
                    <span>Microsserviço Educação (Cloud Run)</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* How Our AI-First Nation Works: Institutional Transparency */}
          <section className="bg-[#f2f4f7] border-y border-[#c6c6ce]/60 py-14 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-10">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0061a5] block mb-2">
                  Fundamentos Constitucionais
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-headline">
                  Como Opera a Administração Agêntica de Novatlantis
                </h2>
                <p className="text-slate-600 text-sm mt-2 max-w-3xl">
                  Em Novatlantis, a inteligência artificial não substitui a soberania popular; ela atua como o motor de
                  execução austero das leis votadas pelos cidadãos, garantindo imparcialidade e custo mínimo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 border-t-4 border-[#141a32] shadow-sm">
                  <div className="text-xs font-mono text-slate-400 mb-2">PILAR 01 // EXECUÇÃO</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 font-headline">Burocracia Zero por Padrão</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    O cidadão nunca preenche formulários redundantes. Os agentes estatais solicitam permissão
                    criptográfica única à sua carteira de dados e processam licenças, benefícios e registros em
                    milissegundos.
                  </p>
                  <div className="text-xs font-semibold text-slate-800 flex items-center">
                    <span className="material-symbols-outlined text-base mr-1 text-[#006b5b]">verified</span>
                    Auditado pelo Protocolo Zero-Knowledge
                  </div>
                </div>
                <div className="bg-white p-6 border-t-4 border-[#0061a5] shadow-sm">
                  <div className="text-xs font-mono text-slate-400 mb-2">PILAR 02 // CONTROLE DE ACESSO</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 font-headline">
                    Identidade 360 & Revogação Imediata
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Todo servidor público autentica-se com seu próprio NID de cidadão. O acesso aos ambientes de
                    Backstage é concedido pelo Gestor de Identidades nomeado pelo Primeiro-Ministro e cessa no exato
                    segundo em que a permissão é revogada.
                  </p>
                  <div className="text-xs font-semibold text-slate-800 flex items-center">
                    <span className="material-symbols-outlined text-base mr-1 text-[#0061a5]">security</span>
                    Governança RBAC/ABAC em Tempo Real
                  </div>
                </div>
                <div className="bg-white p-6 border-t-4 border-[#006b5b] shadow-sm">
                  <div className="text-xs font-mono text-slate-400 mb-2">PILAR 03 // DATA LAKEHOUSE</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 font-headline">
                    Arquitetura Medalhão (Bronze, Silver, Gold)
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Os 100.000 cidadãos compõem um grafo civil-familiar íntegro no Google Cloud (Cloud Storage +
                    BigQuery), permitindo cruzamentos vitais em emergências 911, prevenção de evasão escolar e
                    segurança de fronteiras.
                  </p>
                  <div className="text-xs font-semibold text-slate-800 flex items-center">
                    <span className="material-symbols-outlined text-base mr-1 text-[#006b5b]">database</span>
                    GDF Lakehouse Ativo em novatlantis
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =====================================================================
          VIEW 2: ESPAÇO DO CIDADÃO (NID 360°, GRAFO FAMILIAR & SERVIÇOS)
      ===================================================================== */}
      {view === 'CITIZEN_HUB' && citizen && (
        <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
          {/* Citizen Header Summary */}
          <div className="bg-white border border-[#c6c6ce] p-6 flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex items-start space-x-5">
              <div className="w-16 h-16 bg-[#141a32] text-white flex items-center justify-center font-headline font-bold text-2xl shrink-0 border border-slate-800">
                {citizen.full_name
                  .split(' ')
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join('')}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 font-bold">
                    {citizen.citizen_id}
                  </span>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 bg-[#e6f7f4] text-[#005044] border border-[#00957f]">
                    NIST BIOMETRIA: {( (citizen.biometrics?.biometric_confidence_score || 0.994) * 100 ).toFixed(2)}%
                  </span>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 bg-slate-100 text-slate-700">
                    CRED: {citizen.professional_credential}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-2 font-headline">{citizen.full_name}</h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  {citizen.profession_label} • Nasc.: {citizen.birth_date} ({citizen.age} anos) • E-mail:{' '}
                  <span className="font-mono">{citizen.email}</span>
                </p>
                {citizen.residence && (
                  <p className="text-xs text-slate-500 mt-1">
                    Residência Oficial: {citizen.residence.street}, {citizen.residence.number} —{' '}
                    <strong>{citizen.residence.district}</strong> ({citizen.residence.postal_code})
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200">
              <div className="text-left lg:text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  PERFIL DE ACESSO NA IDENTIDADE 360
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">{citizen.role_title}</span>
                <span className="text-xs text-slate-500 block">{citizen.ministry_label}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {citizen.backstage_allowed ? (
                  <button
                    onClick={() => setView('GOVERNMENT_BACKSTAGE')}
                    className="bg-[#0061a5] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#00487c] flex items-center space-x-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    <span>Abrir Meu Ambiente de Backstage</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-600 text-xs font-medium">
                    Acesso exclusivo de Cidadão Comum (Backstage desabilitado na Identidade 360)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grid of Citizen Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Family Graph & NIST Biometrics */}
            <div className="bg-white border border-[#c6c6ce] p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 font-headline flex items-center">
                  <span className="material-symbols-outlined text-lg mr-2 text-[#141a32]">diversity_3</span>
                  Grafo Familiar Civil (rel_family_graph)
                </h2>
                <span className="text-[11px] font-mono text-slate-500">
                  {citizen.family_links?.length || 0} vínculos
                </span>
              </div>

              {citizen.family_links?.length > 0 ? (
                <div className="space-y-2.5">
                  {citizen.family_links.map((rel: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#f7f9fc] border border-slate-200 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[#141a32] text-white mr-2">
                          {rel.relationship_type}
                        </span>
                        <strong className="text-slate-900">{rel.relative_name}</strong> ({rel.relative_age}a)
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {rel.relative_nid} • {rel.relative_profession}
                        </div>
                      </div>
                      <button
                        onClick={() => authenticateCitizen(rel.relative_nid)}
                        className="text-[#0061a5] font-bold hover:underline text-[11px] shrink-0 ml-2"
                      >
                        Logar como
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Nenhum vínculo familiar direto listado para este registro.</p>
              )}

              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Assinatura Biométrica Padrão NIST & Ed25519
                </h3>
                <div className="bg-[#f2f4f7] p-3 font-mono text-[11px] text-slate-700 space-y-1 break-all border border-slate-300">
                  <div>
                    <strong>PK Ed25519:</strong> {citizen.biometrics?.ed25519_public_key}
                  </div>
                  <div>
                    <strong>Template ISO-19794-5:</strong> {citizen.biometrics?.nist_face_preview}
                  </div>
                  <div>
                    <strong>Minúcias (x,y,θ,q):</strong>{' '}
                    {JSON.stringify(citizen.biometrics?.nist_fingerprint_minutiae?.slice(0, 2) || [])}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Health HL7 FHIR + Student / Education Record */}
            <div className="bg-white border border-[#c6c6ce] p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 font-headline flex items-center">
                  <span className="material-symbols-outlined text-lg mr-2 text-[#141a32]">medical_information</span>
                  Prontuário HL7 FHIR & Educação
                </h2>
                <span className="text-xs font-mono font-bold text-[#ba1a1a] bg-red-50 px-2 py-0.5 border border-red-200">
                  Tipo Sanguíneo: {citizen.health?.blood_type || 'O+'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f7f9fc] border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Alergias Registradas</span>
                  <strong className="text-slate-900">
                    {citizen.health?.allergies?.join(', ') || 'Nenhuma'}
                  </strong>
                </div>
                <div className="p-3 bg-[#f7f9fc] border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Condições Crônicas</span>
                  <strong className="text-slate-900">
                    {citizen.health?.chronic_conditions?.join(', ') || 'Hígido'}
                  </strong>
                </div>
                <div className="p-3 bg-[#f7f9fc] border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Hospital de Referência</span>
                  <strong className="text-slate-900 font-mono">{citizen.health?.assigned_hospital_id}</strong>
                </div>
                <div className="p-3 bg-[#f7f9fc] border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Médico da Família</span>
                  <strong className="text-slate-900 font-mono">{citizen.health?.family_doctor_nid}</strong>
                </div>
              </div>

              {citizen.education ? (
                <div className="p-4 bg-[#f2f4f7] border border-slate-300 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-[#141a32]">
                      Matrícula Escolar Ativa ({citizen.education.grade_level})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#006b5b]">
                      Média: {citizen.education.performance_index} | Freq: {citizen.education.attendance_rate}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{citizen.education.institution_name}</p>
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px] font-mono">
                    <div className="bg-white p-1.5 border border-slate-200">
                      <div className="text-slate-400">MAT</div>
                      <div className="font-bold">{citizen.education.score_mathematics}</div>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-200">
                      <div className="text-slate-400">CIÊN</div>
                      <div className="font-bold">{citizen.education.score_sciences}</div>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-200">
                      <div className="text-slate-400">IA/ROB</div>
                      <div className="font-bold">{citizen.education.score_ai_robotics}</div>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-200">
                      <div className="text-slate-400">LÍNG</div>
                      <div className="font-bold">{citizen.education.score_languages}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#f7f9fc] border border-slate-200 text-xs text-slate-600">
                  Cidadão fora da faixa escolar obrigatória (4–22 anos) ou formação superior concluída. Dica: selecione{' '}
                  <button
                    onClick={() => authenticateCitizen('NID-000-0000-0010-2')}
                    className="text-[#0061a5] font-bold underline"
                  >
                    Pedro Albuquerque (11 anos)
                  </button>{' '}
                  para visualizar o boletim estudantil ativo.
                </div>
              )}

              {/* Emergency 911 One-Click Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => handleTrigger911('Emergência Médica Aguda (Acionamento Cidadão)')}
                  className="w-full bg-[#ba1a1a] hover:bg-red-800 text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <span className="material-symbols-outlined text-base">emergency</span>
                  <span>Acionar SOS 911 (Envia HL7 + Alerta Familiar GDF)</span>
                </button>
              </div>
            </div>

            {/* Column 3: Citizen Action Center (311, Company in 45s, ICAO Passport & UBI) */}
            <div className="bg-white border border-[#c6c6ce] p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 font-headline flex items-center">
                  <span className="material-symbols-outlined text-lg mr-2 text-[#141a32]">rocket_launch</span>
                  Serviços Digitais Soberanos
                </h2>
                <span className="text-xs font-mono font-bold text-[#006b5b]">
                  UBI: N$ {citizen.ubi_monthly_credits}/mês
                </span>
              </div>

              {/* Passport & Border Clearance */}
              <div className="p-3.5 bg-[#f7f9fc] border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Passaporte Digital ICAO & Justiça</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-white border border-slate-300">
                    {citizen.passport ? `${citizen.passport.passport_number} (${citizen.passport.status})` : 'NÃO EMITIDO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Status Judicial: <strong>{citizen.justice?.background_check_status}</strong> | Status Fiscal:{' '}
                  <strong>{citizen.tax_status}</strong>
                </p>
                <button
                  onClick={handleRequestPassport}
                  className="w-full bg-[#141a32] text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                >
                  Emitir / Renovar Passaporte Digital (Cruzamento GDF)
                </button>
              </div>

              {/* Open Autonomous Company in 45s */}
              <form onSubmit={handleOpenCompany} className="p-3.5 bg-[#f7f9fc] border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Abertura de Empresa Autônoma em 45s (+250 TFLOPs)
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Razão Social da Empresa AI-First..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300"
                />
                <button
                  type="submit"
                  className="w-full bg-[#0061a5] text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#00487c]"
                >
                  Registrar Empresa no Tesouro Soberano
                </button>
              </form>

              {/* Submit 311 Urban Demand */}
              <form onSubmit={handleCreate311} className="p-3.5 bg-[#f7f9fc] border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Abrir Demanda Urbana 311 (Enviada ao Backstage Público)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={new311Category}
                    onChange={e => setNew311Category(e.target.value)}
                    className="px-2 py-1 text-xs bg-white border border-slate-300"
                  >
                    <option>Iluminação Fotovoltaica & Smart Grid</option>
                    <option>Mobilidade Autônoma & Vias</option>
                    <option>Saneamento & Qualidade Hídrica</option>
                    <option>Segurança de Parques & Drones</option>
                  </select>
                  <select
                    value={new311District}
                    onChange={e => setNew311District(e.target.value)}
                    className="px-2 py-1 text-xs bg-white border border-slate-300"
                  >
                    <option>Distrito Tecnológico</option>
                    <option>Distrito Oceânico</option>
                    <option>Colina da Justiça</option>
                    <option>Porto Solar</option>
                    <option>Vale das Águas</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={new311Desc}
                  onChange={e => setNew311Desc(e.target.value)}
                  placeholder="Descreva a demanda para o servidor público..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                >
                  Protocolar Demanda 311
                </button>
              </form>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 3: BACKSTAGE GOVERNAMENTAL (SERVIDORES & GESTORES PÚBLICOS)
          Protegido dinamicamente pela Aplicação de Identidade 360
      ===================================================================== */}
      {view === 'GOVERNMENT_BACKSTAGE' && citizen && (
        <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
          {/* Backstage Institutional Banner */}
          <div className="bg-[#141a32] text-white p-6 border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#57fbdb] text-[#141a32] text-[10px] font-mono font-bold uppercase">
                  AMBIENTE ADMINISTRATIVO DE BACKSTAGE • CREDENCIAL VERIFICADA
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Operador: {citizen.full_name} ({citizen.citizen_id})
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-2 font-headline">{citizen.role_title}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Lotação: {citizen.ministry_label} • Caso esta permissão seja revogada na aplicação Identidade 360, esta
                sessão reverte automaticamente para Cidadão Comum.
              </p>
            </div>

            {/* Sub-navigation of Backstage Modules */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'pm_cabinet', label: '1. Gabinete Primeiro-Ministro', icon: 'military_tech' },
                { id: 'iam_360', label: '2. Identidade 360 (Permissões)', icon: 'admin_panel_settings' },
                { id: 'health_backstage', label: '3. Gestão Saúde & Telemedicina', icon: 'local_hospital' },
                { id: 'edu_backstage', label: '4. Gestão Educação, Escolas & Provas', icon: 'school' },
                { id: 'ops_311_911', label: '5. Demandas 311 & Comando 911', icon: 'support_agent' },
                { id: 'justice_treasury', label: '6. Justiça, Fronteiras & Tesouro', icon: 'gavel' },
                { id: 'gdf_lakehouse', label: '7. Explorador GDF 100k & Lakehouse', icon: 'database' }
              ].map(tab => {
                const isAllowed =
                  citizen.effective_role_code === 'PRIME_MINISTER_ROOT' ||
                  citizen.effective_role_code === 'SECRETARY_GENERAL' ||
                  citizen.allowed_modules?.includes(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!isAllowed) {
                        notify(
                          'error',
                          `Seu perfil atual (${citizen.effective_role_code}) não possui escopo para o módulo ${tab.label}. Troque para Primeiro-Ministro (jopoco) ou solicite escopo na Identidade 360.`
                        );
                        return;
                      }
                      setBackstageTab(tab.id as BackstageTab);
                    }}
                    className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1 border transition-colors ${
                      backstageTab === tab.id
                        ? 'bg-white text-[#141a32] border-white'
                        : isAllowed
                        ? 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-900/40 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* -----------------------------------------------------------------
              TAB 1: GABINETE DO PRIMEIRO-MINISTRO (jopoco) & SECRETÁRIO-GERAL
          ----------------------------------------------------------------- */}
          {backstageTab === 'pm_cabinet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#c6c6ce] p-5">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Primeiro-Ministro (Root)</span>
                  <p className="text-lg font-bold text-slate-900 mt-1 font-headline">Jopoco (NID-000-0000-0001-9)</p>
                  <p className="text-xs text-[#006b5b] mt-1 font-mono">admin@jopoco.altostrat.com</p>
                </div>
                <div className="bg-white border border-[#c6c6ce] p-5">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Secretário-Geral de Apoio</span>
                  <p className="text-lg font-bold text-slate-900 mt-1 font-headline">Alexandre Vance</p>
                  <p className="text-xs text-slate-600 mt-1 font-mono">NID-000-0000-0002-7</p>
                </div>
                <div className="bg-white border border-[#c6c6ce] p-5">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Gestor de Identidades 360</span>
                  <p className="text-lg font-bold text-slate-900 mt-1 font-headline">Helena Albuquerque</p>
                  <p className="text-xs text-[#0061a5] mt-1 font-mono">NID-000-0000-0003-5 (Outorgada pelo PM)</p>
                </div>
                <div className="bg-white border border-[#c6c6ce] p-5">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Servidores com Acesso Backstage</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1 font-headline">
                    {overviewData?.counts?.iam_active_roles || 25} Ativos
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Revogação instantânea via Identidade 360</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Constitutional Delegation of Identity Manager 360 */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Prerrogativa Exclusiva do Primeiro-Ministro: Nomeação do Gestor de Identidades 360
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Conforme diretriz constitucional de Novatlantis, o <strong>Primeiro-Ministro (jopoco)</strong> —
                    apoiado pelo Secretário-Geral — é o administrador geral da nação e detém a competência exclusiva
                    para habilitar ou substituir o <strong>Gestor de Identidades do Governo (IDENTITY_MANAGER_360)</strong>.
                  </p>
                  <div className="p-4 bg-[#f2f4f7] border border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-[#141a32] text-white px-2 py-0.5">
                        TITULAR ATUAL • NID-000-0000-0003-5
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">Helena Albuquerque</p>
                      <p className="text-xs text-slate-600">Autoridade Nacional de Identidade 360 & Acesso</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGrantRole('NID-000-0000-0003-5', 'IDENTITY_MANAGER_360')}
                        className="px-3 py-1.5 bg-[#006b5b] text-white text-xs font-bold uppercase tracking-wider"
                      >
                        Revalidar Outorga
                      </button>
                      <button
                        onClick={() => handleRevokeRole('NID-000-0000-0003-5')}
                        className="px-3 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold uppercase tracking-wider"
                      >
                        Destituir Gestor
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Audit Trail */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Diário Oficial de Auditoria de Estado (ops_audit_log)
                  </h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {overviewData?.audit_logs?.map((log: any) => (
                      <div key={log.audit_id} className="p-2.5 bg-[#f7f9fc] border border-slate-200 text-xs">
                        <div className="flex justify-between font-mono text-[10px] text-slate-500">
                          <span>
                            {log.action_type} • Por: {log.actor_nid}
                          </span>
                          <span>{log.created_at?.slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <p className="text-slate-800 mt-1">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 2: APLICAÇÃO IDENTIDADE 360 (GESTÃO DE PERMISSÕES RBAC/ABAC)
          ----------------------------------------------------------------- */}
          {backstageTab === 'iam_360' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#c6c6ce] p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-4 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-headline">
                      Aplicação Governamental Identidade 360 — Controle de Acesso por Perfil Profissional
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Conceda ou revogue permissões de Backstage. <strong>Regra de Estado:</strong> Uma vez que a
                      permissão é removida abaixo, o servidor público volta imediatamente a ser <strong>Cidadão Comum</strong> e perde todo acesso ao Backstage.
                    </p>
                  </div>

                  {/* Form to Grant Role by NID */}
                  <div className="flex flex-wrap items-center gap-2 bg-[#f2f4f7] p-3 border border-slate-300">
                    <input
                      type="text"
                      value={grantTargetNid}
                      onChange={e => setGrantTargetNid(e.target.value)}
                      placeholder="NID do Cidadão..."
                      className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 w-44"
                    />
                    <select
                      value={grantRoleCode}
                      onChange={e => setGrantRoleCode(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300"
                    >
                      <option value="DOCTOR_TELEMED">DOCTOR_TELEMED (Médico Telemedicina)</option>
                      <option value="DOCTOR_AND_HEALTH_MANAGER">DOCTOR_AND_HEALTH_MANAGER (Gestor Saúde)</option>
                      <option value="TEACHER_EDUCATOR">TEACHER_EDUCATOR (Professor)</option>
                      <option value="TEACHER_AND_EDU_MANAGER">TEACHER_AND_EDU_MANAGER (Gestor Educação)</option>
                      <option value="OPERATIONS_311_911_MANAGER">OPERATIONS_311_911_MANAGER (Gestor 311/911)</option>
                      <option value="JUSTICE_AND_TREASURY_MANAGER">JUSTICE_AND_TREASURY_MANAGER (Justiça/Tesouro)</option>
                      <option value="IDENTITY_MANAGER_360">IDENTITY_MANAGER_360 (Somente PM/Sec.Geral)</option>
                    </select>
                    <button
                      onClick={() => handleGrantRole(grantTargetNid, grantRoleCode)}
                      className="bg-[#141a32] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                    >
                      Conceder Permissão
                    </button>
                  </div>
                </div>

                {/* Active & Revoked Permissions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f2f4f7] border-y border-slate-300 text-slate-700 uppercase font-mono text-[11px]">
                        <th className="py-2.5 px-3">NID do Cidadão</th>
                        <th className="py-2.5 px-3">Nome Completo</th>
                        <th className="py-2.5 px-3">Credencial Profissional</th>
                        <th className="py-2.5 px-3">Papel Backstage (Role)</th>
                        <th className="py-2.5 px-3">Status 360</th>
                        <th className="py-2.5 px-3">Outorgado Por</th>
                        <th className="py-2.5 px-3 text-right">Ação de Governança</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {iamData?.assigned_roles?.map((r: any) => (
                        <tr key={r.citizen_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.citizen_id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {r.full_name}
                            <div className="text-[11px] text-slate-500 font-normal">{r.email}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{r.professional_credential}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#0061a5]">{r.role_code}</td>
                          <td className="py-2.5 px-3">
                            {Number(r.is_active) === 1 ? (
                              <span className="px-2 py-0.5 bg-[#e6f7f4] text-[#005044] border border-[#00957f] font-mono text-[10px] font-bold">
                                ATIVO NO BACKSTAGE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 text-[#ba1a1a] border border-red-200 font-mono text-[10px] font-bold">
                                REVOGADO (CIDADÃO COMUM)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.granted_by_nid}</td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {Number(r.is_active) === 1 ? (
                              r.citizen_id !== 'NID-000-0000-0001-9' && (
                                <button
                                  onClick={() => handleRevokeRole(r.citizen_id)}
                                  className="px-2.5 py-1 bg-[#ba1a1a] text-white text-[11px] font-bold uppercase hover:bg-red-800"
                                >
                                  Revogar Permissão
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleGrantRole(r.citizen_id, r.role_code)}
                                className="px-2.5 py-1 bg-[#006b5b] text-white text-[11px] font-bold uppercase hover:bg-teal-800"
                              >
                                Restaurar Acesso
                              </button>
                            )}
                            <button
                              onClick={() => authenticateCitizen(r.citizen_id)}
                              className="px-2 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] hover:bg-slate-100"
                            >
                              Testar Login
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

          {/* -----------------------------------------------------------------
              TAB 3: GESTÃO DA SAÚDE, HOSPITAIS, CLÍNICAS E TELEMEDICINA MÉDICA
          ----------------------------------------------------------------- */}
          {backstageTab === 'health_backstage' && (
            <div className="space-y-6">
              {/* Hospitals & Clinics Network */}
              <div className="bg-white border border-[#c6c6ce] p-6">
                <h2 className="text-lg font-bold text-slate-900 font-headline mb-4">
                  Rede Nacional de Hospitais e Clínicas de Novatlantis (100.000 Prontuários HL7 Vinculados)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {healthData?.hospitals?.map((h: any) => (
                    <div key={h.hospital_id} className="p-4 bg-[#f7f9fc] border border-slate-300 space-y-1.5">
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="font-bold text-[#141a32]">{h.hospital_id}</span>
                        <span className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-700">
                          UTI: {h.icu_occupancy_pct}%
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{h.name}</h3>
                      <p className="text-[11px] text-slate-500">{h.district}</p>
                      <p className="text-xs font-mono font-bold text-[#0061a5] pt-1">
                        {h.linked_citizens?.toLocaleString('pt-BR')} cidadãos adscritos
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor Telemedicine Console */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Console Médico de Atendimento via Telemedicina & Prescrição Ed25519
                  </h3>
                  <form onSubmit={handleRecordTelemed} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">NID do Paciente (Base GDF 100k):</label>
                      <input
                        type="text"
                        value={telemedPatientNid}
                        onChange={e => setTelemedPatientNid(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono bg-white border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Queixa Principal / Evolução SOAP IA:</label>
                      <input
                        type="text"
                        value={telemedComplaint}
                        onChange={e => setTelemedComplaint(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Prescrição Digital Assinada:</label>
                      <input
                        type="text"
                        value={telemedMedication}
                        onChange={e => setTelemedMedication(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#141a32] text-white py-2.5 font-bold uppercase tracking-wider hover:bg-slate-800"
                    >
                      Concluir Teleconsulta & Emitir Receita Ed25519
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-bold uppercase text-slate-500">Últimas Teleconsultas Registradas</div>
                    {healthData?.telemed_sessions?.map((s: any) => (
                      <div key={s.session_id} className="p-3 bg-[#f7f9fc] border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="font-bold text-[#0061a5]">
                            {s.session_id} • Paciente: {s.patient_name} ({s.patient_nid})
                          </span>
                          <span className="text-[#006b5b] font-bold">{s.status}</span>
                        </div>
                        <p className="text-slate-700">{s.ai_soap_notes}</p>
                        <p className="font-mono text-[11px] text-slate-900">
                          <strong>Rx:</strong> {s.prescription_medication}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Credentialed Doctors Roster */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Corpo Clínico Nacional (Médicos Credenciados no GDF)
                  </h3>
                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f4f7] border-y border-slate-300 text-[11px] font-mono uppercase">
                          <th className="py-2 px-2.5">NID Médico</th>
                          <th className="py-2 px-2.5">Nome / Especialidade</th>
                          <th className="py-2 px-2.5">Cidadãos Vinculados</th>
                          <th className="py-2 px-2.5">Status 360</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {healthData?.doctors?.map((d: any) => (
                          <tr key={d.citizen_id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-mono font-bold">{d.citizen_id}</td>
                            <td className="py-2 px-2.5">
                              <div className="font-semibold text-slate-900">{d.full_name}</div>
                              <div className="text-[11px] text-slate-500">{d.profession_label}</div>
                            </td>
                            <td className="py-2 px-2.5 font-mono">{d.assigned_patients}</td>
                            <td className="py-2 px-2.5 font-mono text-[10px]">{d.role_code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 4: GESTÃO DA EDUCAÇÃO, ESCOLAS, ALUNOS, PROVAS E PROFESSORES
          ----------------------------------------------------------------- */}
          {backstageTab === 'edu_backstage' && (
            <div className="space-y-6">
              {/* Schools Overview */}
              <div className="bg-white border border-[#c6c6ce] p-6">
                <h2 className="text-lg font-bold text-slate-900 font-headline mb-4">
                  Rede Nacional de Escolas, Liceus e Universidades (17.993 Alunos Matriculados)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {eduData?.institutions?.map((inst: any) => (
                    <div key={inst.institution_id} className="p-4 bg-[#f7f9fc] border border-slate-300 space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="font-bold text-[#141a32]">{inst.institution_id}</span>
                        <span className="text-[#006b5b] font-bold">
                          Média: {inst.avg_performance} | Freq: {inst.avg_attendance}%
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{inst.name}</h3>
                      <p className="text-xs text-slate-600">
                        Distrito: {inst.district} • Direção: {inst.director_name}
                      </p>
                      <p className="text-xs font-mono font-bold text-[#0061a5] pt-1">
                        {inst.enrolled_students?.toLocaleString('pt-BR')} alunos ativos
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Teacher Gradebook per Subject & Exam Creation */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-5">
                  <h3 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Diário Digital do Professor — Avaliação de Desempenho por Matéria
                  </h3>

                  {selectedStudent && (
                    <form onSubmit={handleSaveStudentGrades} className="p-4 bg-[#f2f4f7] border border-slate-300 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-[11px] text-[#0061a5] font-bold">
                            ALUNO SELECIONADO: {selectedStudent.citizen_id}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {selectedStudent.student_name} ({selectedStudent.student_age} anos —{' '}
                            {selectedStudent.grade_level})
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            Responsável no Grafo Familiar: <strong>{selectedStudent.parent_name || 'N/D'}</strong> (
                            {selectedStudent.parent_nid || 'N/D'})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-600">Matemática</label>
                          <input
                            type="number"
                            step="0.5"
                            value={gradeForm.score_mathematics}
                            onChange={e => setGradeForm({ ...gradeForm, score_mathematics: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-600">Ciências</label>
                          <input
                            type="number"
                            step="0.5"
                            value={gradeForm.score_sciences}
                            onChange={e => setGradeForm({ ...gradeForm, score_sciences: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-600">IA & Robótica</label>
                          <input
                            type="number"
                            step="0.5"
                            value={gradeForm.score_ai_robotics}
                            onChange={e => setGradeForm({ ...gradeForm, score_ai_robotics: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-600">Linguagens</label>
                          <input
                            type="number"
                            step="0.5"
                            value={gradeForm.score_languages}
                            onChange={e => setGradeForm({ ...gradeForm, score_languages: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-600">Frequência %</label>
                          <input
                            type="number"
                            step="0.5"
                            value={gradeForm.attendance_rate}
                            onChange={e => setGradeForm({ ...gradeForm, attendance_rate: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#141a32] text-white py-2 font-bold uppercase tracking-wider hover:bg-slate-800"
                      >
                        Salvar Notas no GDF & Recalcular Alerta Pedagógico
                      </button>
                    </form>
                  )}

                  {/* Apply New Exam */}
                  <form onSubmit={handleApplyExam} className="space-y-3 text-xs pt-2 border-t border-slate-200">
                    <div className="font-bold text-slate-800 uppercase">Aplicar Nova Prova Nacional Assistida por IA</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={examTitle}
                        onChange={e => setExamTitle(e.target.value)}
                        className="sm:col-span-2 px-2.5 py-1.5 bg-white border border-slate-300"
                        placeholder="Título da Avaliação..."
                      />
                      <select
                        value={examSubject}
                        onChange={e => setExamSubject(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300"
                      >
                        <option value="AI & Robotics">IA & Robótica</option>
                        <option value="Mathematics">Matemática</option>
                        <option value="Sciences">Ciências Naturais</option>
                        <option value="Languages">Linguagens (PT/ES/EN)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-[#0061a5] text-white px-4 py-2 font-bold uppercase tracking-wider hover:bg-[#00487c]"
                    >
                      Aplicar Prova & Corrigir com Agente Avaliador
                    </button>
                  </form>
                </div>

                {/* Students Table with Subject Scores */}
                <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                    Alunos Matriculados — Clique para Editar Notas por Matéria
                  </h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f2f4f7] border-y border-slate-300 text-[10px] font-mono uppercase">
                          <th className="py-2 px-2">Aluno (NID)</th>
                          <th className="py-2 px-2">Mat</th>
                          <th className="py-2 px-2">Ciên</th>
                          <th className="py-2 px-2">IA</th>
                          <th className="py-2 px-2">Líng</th>
                          <th className="py-2 px-2">Freq%</th>
                          <th className="py-2 px-2">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {eduData?.students?.map((st: any) => (
                          <tr
                            key={st.citizen_id}
                            className={`hover:bg-slate-50 ${
                              selectedStudent?.citizen_id === st.citizen_id ? 'bg-blue-50/60' : ''
                            }`}
                          >
                            <td className="py-2 px-2">
                              <div className="font-bold text-slate-900">{st.student_name}</div>
                              <div className="font-mono text-[10px] text-slate-500">
                                {st.citizen_id} • Pai/Mãe: {st.parent_name || 'GDF'}
                              </div>
                            </td>
                            <td className="py-2 px-2 font-mono">{st.score_mathematics}</td>
                            <td className="py-2 px-2 font-mono">{st.score_sciences}</td>
                            <td className="py-2 px-2 font-mono">{st.score_ai_robotics}</td>
                            <td className="py-2 px-2 font-mono">{st.score_languages}</td>
                            <td
                              className={`py-2 px-2 font-mono font-bold ${
                                st.attendance_rate < 75 ? 'text-[#ba1a1a]' : 'text-[#006b5b]'
                              }`}
                            >
                              {st.attendance_rate}%
                            </td>
                            <td className="py-2 px-2">
                              <button
                                onClick={() => {
                                  setSelectedStudent(st);
                                  setGradeForm({
                                    score_mathematics: st.score_mathematics,
                                    score_sciences: st.score_sciences,
                                    score_ai_robotics: st.score_ai_robotics,
                                    score_languages: st.score_languages,
                                    attendance_rate: st.attendance_rate
                                  });
                                }}
                                className="px-2 py-1 bg-[#141a32] text-white text-[10px] font-bold uppercase"
                              >
                                Avaliar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 5: BACKSTAGE 311 (ZELADORIA URBANA) & COMANDO 911
          ----------------------------------------------------------------- */}
          {backstageTab === 'ops_311_911' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 311 Queue for Public Servants */}
              <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                  Fila de Atendimento do Servidor Público — Demandas Urbanas 311
                </h2>
                <div className="space-y-3">
                  {opsData?.tickets_311?.map((t: any) => (
                    <div key={t.ticket_id} className="p-4 bg-[#f7f9fc] border border-slate-300 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="font-bold text-[#141a32]">
                          {t.ticket_id} • {t.district}
                        </span>
                        <span
                          className={`px-2 py-0.5 font-bold ${
                            t.status === 'RESOLVED'
                              ? 'bg-[#e6f7f4] text-[#005044] border border-[#00957f]'
                              : 'bg-amber-50 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{t.category}</div>
                      <p className="text-slate-700">{t.description}</p>
                      <p className="text-[11px] text-[#0061a5] font-medium">{t.ai_triage_summary}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                        <span>
                          Solicitante: {t.citizen_name} ({t.citizen_id})
                        </span>
                        {t.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve311(t.ticket_id)}
                            className="bg-[#006b5b] text-white px-3 py-1 font-bold uppercase tracking-wider"
                          >
                            Concluir Demanda
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 911 Emergency Dispatch with GDF Crossing #3 */}
              <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                  Central de Despacho 911 — Cruzamento Automático GDF (HL7 + Família)
                </h2>
                <div className="space-y-3">
                  {opsData?.dispatches_911?.map((d: any) => (
                    <div key={d.dispatch_id} className="p-4 bg-red-50/40 border border-[#ba1a1a]/40 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="font-bold text-[#ba1a1a]">
                          {d.dispatch_id} • {d.priority}
                        </span>
                        <span className="px-2 py-0.5 bg-[#ba1a1a] text-white font-bold">
                          ETA: {d.eta_minutes} MIN
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {d.emergency_type} — Paciente: {d.citizen_name} ({d.citizen_id})
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-white p-2.5 border border-slate-200 font-mono text-[11px]">
                        <div>
                          <strong>Tipo Sanguíneo:</strong> <span className="text-[#ba1a1a]">{d.blood_type}</span>
                        </div>
                        <div>
                          <strong>Hospital Destino:</strong> {d.assigned_hospital_id}
                        </div>
                        <div>
                          <strong>Alergias HL7:</strong> {d.allergies}
                        </div>
                        <div>
                          <strong>Condições:</strong> {d.chronic_conditions}
                        </div>
                      </div>
                      <div className="p-2 bg-[#141a32] text-white font-mono text-[11px]">
                        ALERTA FAMILIAR AUTOMÁTICO (rel_family_graph): {d.emergency_contact_name} (
                        {d.emergency_contact_nid}) • Tel: {d.emergency_contact_phone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 6: JUSTIÇA ALGORÍTMICA, FRONTEIRAS & TESOURO SOBERANO
          ----------------------------------------------------------------- */}
          {backstageTab === 'justice_treasury' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                  Tesouro Soberano — Empresas AI-First & Dividendo UBI (100.000 Cidadãos)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {justiceData?.tax_summary?.map((t: any) => (
                    <div key={t.tax_status} className="p-3 bg-[#f7f9fc] border border-slate-200 text-xs">
                      <span className="font-mono text-[10px] text-slate-500 block">{t.tax_status}</span>
                      <strong className="text-lg font-headline text-slate-900">
                        {t.total?.toLocaleString('pt-BR')}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">cidadãos</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold uppercase text-slate-500">Empresas Autônomas Registradas</div>
                  {justiceData?.companies?.map((c: any) => (
                    <div key={c.company_id} className="p-3 bg-[#f7f9fc] border border-slate-200 text-xs flex justify-between">
                      <div>
                        <span className="font-mono font-bold text-[#0061a5] mr-2">{c.company_id}</span>
                        <strong>{c.company_name}</strong>
                        <div className="text-[11px] text-slate-500">
                          Titular: {c.owner_name} ({c.owner_nid}) • Setor: {c.sector}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[#006b5b]">
                        {c.initial_compute_quota_tflops} TFLOPs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#c6c6ce] p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 font-headline border-b border-slate-200 pb-3">
                  Suprema Corte Digital — Antecedentes & Segurança Nacional (justice_records)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {justiceData?.justice_summary?.map((j: any) => (
                    <div key={j.background_check_status} className="p-3 bg-[#f7f9fc] border border-slate-200 text-xs">
                      <span className="font-mono text-[10px] text-slate-500 block">{j.background_check_status}</span>
                      <strong className="text-lg font-headline text-slate-900">
                        {j.total?.toLocaleString('pt-BR')}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">registros</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 7: EXPLORADOR GDF 100.000 CIDADÃOS & DATA LAKEHOUSE (3 CRUZAMENTOS)
          ----------------------------------------------------------------- */}
          {backstageTab === 'gdf_lakehouse' && (
            <div className="space-y-6">
              {/* Lakehouse Architecture Banner */}
              <div className="bg-white border border-[#c6c6ce] p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-[#141a32] text-white px-2 py-0.5">
                      GOVERNMENT DATA FRAMEWORK (GDF) • ARQUITETURA MEDALHÃO
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 font-headline mt-1">
                      Data Lakehouse Nacional — Cloud Storage (gs://novatlantis-gdf-lakehouse) + BigQuery (gdf_silver /
                      gdf_gold)
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-slate-600 bg-[#f2f4f7] px-3 py-2 border border-slate-300">
                    Projeto GCP: <strong>novatlantis</strong> | Cidadãos: <strong>100.000</strong> | Grafo Familiar:{' '}
                    <strong>58.985 arestas</strong>
                  </div>
                </div>

                {/* Search across all 100,000 citizens */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    runCitizenSearch(searchQuery, searchCredential);
                  }}
                  className="flex flex-wrap gap-2 mb-4"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar nos 100.000 cidadãos por NID, Nome, Sobrenome, E-mail ou Profissão..."
                    className="flex-grow px-3 py-2 text-xs bg-white border border-slate-300 font-body"
                  />
                  <select
                    value={searchCredential}
                    onChange={e => {
                      setSearchCredential(e.target.value);
                      runCitizenSearch(searchQuery, e.target.value);
                    }}
                    className="px-3 py-2 text-xs bg-white border border-slate-300"
                  >
                    <option value="">Todas as Credenciais (100.000)</option>
                    <option value="STATE_EXECUTIVE">STATE_EXECUTIVE (Governo)</option>
                    <option value="PHYSICIAN">PHYSICIAN (Médicos)</option>
                    <option value="TEACHER">TEACHER (Professores)</option>
                    <option value="MAGISTRATE_JUDGE">MAGISTRATE_JUDGE (Juízes)</option>
                    <option value="CIVIL_ENGINEER">CIVIL_ENGINEER (Engenheiros)</option>
                    <option value="NONE">Cidadãos Gerais</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#141a32] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider"
                  >
                    Consultar GDF
                  </button>
                </form>

                <div className="overflow-x-auto max-h-80 border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f2f4f7] border-b border-slate-300 text-[10px] font-mono uppercase">
                        <th className="py-2 px-3">NID (Módulo 11)</th>
                        <th className="py-2 px-3">Nome Completo</th>
                        <th className="py-2 px-3">Idade / Idioma</th>
                        <th className="py-2 px-3">Profissão / Credencial</th>
                        <th className="py-2 px-3">Distrito</th>
                        <th className="py-2 px-3">Sangue</th>
                        <th className="py-2 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {searchResults.map(c => (
                        <tr key={c.citizen_id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.citizen_id}</td>
                          <td className="py-2 px-3 font-semibold">{c.full_name}</td>
                          <td className="py-2 px-3 font-mono">
                            {c.age}a • {c.native_language}
                          </td>
                          <td className="py-2 px-3">
                            {c.profession_label}{' '}
                            <span className="font-mono text-[10px] text-slate-500">[{c.professional_credential}]</span>
                          </td>
                          <td className="py-2 px-3">{c.district}</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#ba1a1a]">{c.blood_type}</td>
                          <td className="py-2 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => inspectCitizenByNid(c.citizen_id)}
                              className="px-2 py-0.5 bg-[#0061a5] text-white text-[10px] font-bold uppercase"
                            >
                              Ficha 360°
                            </button>
                            <button
                              onClick={() => authenticateCitizen(c.citizen_id)}
                              className="px-2 py-0.5 border border-slate-300 bg-white text-slate-700 text-[10px] font-bold uppercase"
                            >
                              Assumir Login
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Inspected Citizen Modal/Drawer */}
                {inspectedCitizen && (
                  <div className="mt-4 p-4 bg-[#f2f4f7] border-2 border-[#141a32] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm font-headline text-[#141a32]">
                        Ficha Analítica GDF 360°: {inspectedCitizen.full_name} ({inspectedCitizen.citizen_id})
                      </strong>
                      <button
                        onClick={() => setInspectedCitizen(null)}
                        className="text-xs font-bold uppercase text-[#ba1a1a]"
                      >
                        Fechar [X]
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white p-3 border border-slate-300">
                        <strong>Dados Civis & Fiscal:</strong> Nasc: {inspectedCitizen.birth_date} ({inspectedCitizen.age}
                        a) | Fiscal: {inspectedCitizen.tax_status} | UBI: N$ {inspectedCitizen.ubi_monthly_credits}
                      </div>
                      <div className="bg-white p-3 border border-slate-300">
                        <strong>Saúde HL7 & Passaporte:</strong> Sangue: {inspectedCitizen.health?.blood_type} |
                        Passaporte: {inspectedCitizen.passport?.passport_number || 'N/A'} (
                        {inspectedCitizen.justice?.background_check_status})
                      </div>
                      <div className="bg-white p-3 border border-slate-300">
                        <strong>Vínculos Familiares ({inspectedCitizen.family_links?.length || 0}):</strong>{' '}
                        {inspectedCitizen.family_links
                          ?.map((f: any) => `${f.relationship_type}: ${f.relative_name}`)
                          .join(' | ') || 'Sem vínculos'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* The 3 Official Cross-Domain Analytical Crossings (Camada Gold) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Crossing 1: Border & Passport */}
                <div className="bg-white border border-[#c6c6ce] p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 inline-block">
                    CRUZAMENTO GOLD #1 • SEGURANÇA & FRONTEIRA
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-headline">
                    Emissão de Passaporte (sec_passports × justice_records × tax_status)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overviewData?.crossings?.border_passport_clearance?.map((row: any) => (
                      <div key={row.citizen_id} className="p-2.5 bg-[#f7f9fc] border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-mono">
                          <strong>{row.citizen_id}</strong>
                          <span
                            className={
                              row.border_decision === 'CLEARED_AUTONOMOUS_EGATE'
                                ? 'text-[#006b5b] font-bold'
                                : 'text-[#ba1a1a] font-bold'
                            }
                          >
                            {row.border_decision}
                          </span>
                        </div>
                        <div className="text-slate-800 font-semibold">{row.full_name}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          Justiça: {row.background_check_status} | Fisco: {row.tax_status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crossing 2: Education Truancy -> Parent Alert */}
                <div className="bg-white border border-[#c6c6ce] p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 inline-block">
                    CRUZAMENTO GOLD #2 • EDUCAÇÃO & GRAFO FAMILIAR
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-headline">
                    Prevenção de Evasão (edu_enrollments × rel_family_graph → Pais)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overviewData?.crossings?.school_truancy_family_alerts?.map((row: any, i: number) => (
                      <div key={i} className="p-2.5 bg-[#f7f9fc] border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-mono">
                          <strong>Aluno: {row.student_name}</strong>
                          <span className={row.attendance_rate < 75 ? 'text-[#ba1a1a] font-bold' : 'text-[#006b5b]'}>
                            Freq: {row.attendance_rate}%
                          </span>
                        </div>
                        <div className="text-slate-600 text-[10px] font-mono">
                          Notificar Responsável: <strong>{row.parent_name}</strong> ({row.parent_nid}) •{' '}
                          {row.parent_phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crossing 3: 911 Medical Emergency -> HL7 + Family */}
                <div className="bg-white border border-[#c6c6ce] p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 text-slate-600 inline-block">
                    CRUZAMENTO GOLD #3 • SAÚDE HL7 & EMERGÊNCIA 911
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-headline">
                    Resgate 911 (health_records × rel_family_graph → Hospital & Parente)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {overviewData?.crossings?.emergency_911_medical_dispatch?.map((row: any) => (
                      <div key={row.citizen_id} className="p-2.5 bg-[#f7f9fc] border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-mono">
                          <strong>{row.full_name}</strong>
                          <span className="text-[#ba1a1a] font-bold">Sangue: {row.blood_type}</span>
                        </div>
                        <div className="text-slate-600 text-[10px]">
                          Alergias: {row.allergies} | Hospital: {row.assigned_hospital_id}
                        </div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          Contato Familiar: {row.emergency_contact_name} ({row.emergency_contact_phone})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Austere Institutional Footer */}
      <footer className="bg-white border-t border-slate-300 text-slate-600 py-10 px-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/coat-of-arms-novatlantis.jpg"
              alt="Brasão de Novatlantis"
              className="w-8 h-8 object-contain"
            />
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider">
                Governo da República Digital de Novatlantis — Chancelaria de Infraestrutura Cívica
              </p>
              <p className="text-slate-500">
                Design System Sovereign Civic • GDF 100.000 Cidadãos • Google Cloud Argolis (Project ID: novatlantis)
              </p>
            </div>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Primeiro-Ministro & Root Admin: jopoco (NID-000-0000-0001-9)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
