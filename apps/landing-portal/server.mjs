import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handleCentralAuthAndProfileRoutes } from './authModule.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const DB_PATH = process.env.GDF_DB_PATH || path.join(__dirname, 'gdf_sovereign.db');
const DIST_DIR = path.join(__dirname, 'dist');

const CITIZEN_PORTAL_URL =
  process.env.CITIZEN_PORTAL_URL || 'https://novatlantis-citizen-portal-wpahcxvhuq-uc.a.run.app';
const GOV_BACKSTAGE_URL =
  process.env.GOV_BACKSTAGE_URL || 'https://novatlantis-gov-backstage-wpahcxvhuq-uc.a.run.app';

console.log(`[Novatlantis National Portal & Orchestrator] Conectando ao banco GDF: ${DB_PATH}`);
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

const ROLE_METADATA = {
  PRIME_MINISTER_ROOT: {
    title: 'Primeiro-Ministro & Root Admin da Nação',
    ministry: 'Gabinete do Primeiro-Ministro (Root Soberano)',
    backstage_allowed: true,
    modules: ['pm_cabinet', 'iam_360', 'health_backstage', 'edu_backstage', 'ops_311_911', 'justice_treasury', 'gdf_lakehouse']
  },
  SECRETARY_GENERAL: {
    title: 'Secretário-Geral de Estado',
    ministry: 'Secretaria-Geral da República',
    backstage_allowed: true,
    modules: ['pm_cabinet', 'iam_360', 'health_backstage', 'edu_backstage', 'ops_311_911', 'justice_treasury', 'gdf_lakehouse']
  },
  IDENTITY_MANAGER_360: {
    title: 'Gestor de Identidades do Governo (Identidade 360)',
    ministry: 'Autoridade Nacional de Identidade 360 & Acesso',
    backstage_allowed: true,
    modules: ['iam_360', 'gdf_lakehouse']
  },
  DOCTOR_AND_HEALTH_MANAGER: {
    title: 'Gestor Público de Saúde & Médico Telemedicina',
    ministry: 'Ministério da Saúde, Hospitais & Telemedicina',
    backstage_allowed: true,
    modules: ['health_backstage', 'gdf_lakehouse']
  },
  DOCTOR_TELEMED: {
    title: 'Médico Credenciado da Rede Nacional de Telemedicina',
    ministry: 'Ministério da Saúde, Hospitais & Telemedicina',
    backstage_allowed: true,
    modules: ['health_backstage']
  },
  TEACHER_AND_EDU_MANAGER: {
    title: 'Gestor Público de Educação & Professor',
    ministry: 'Ministério da Educação, Escolas & Avaliação Nacional',
    backstage_allowed: true,
    modules: ['edu_backstage', 'gdf_lakehouse']
  },
  TEACHER_EDUCATOR: {
    title: 'Professor da Rede Pública Nacional',
    ministry: 'Ministério da Educação, Escolas & Avaliação Nacional',
    backstage_allowed: true,
    modules: ['edu_backstage']
  },
  OPERATIONS_311_911_MANAGER: {
    title: 'Gestor de Operações Urbanas 311 & Despacho 911',
    ministry: 'Centro Integrado de Comando Urbano 311 & Emergência 911',
    backstage_allowed: true,
    modules: ['ops_311_911', 'gdf_lakehouse']
  },
  JUSTICE_AND_TREASURY_MANAGER: {
    title: 'Magistrado & Gestor de Justiça, Fronteiras e Tesouro',
    ministry: 'Suprema Corte Digital, Passaportes & Tesouro Soberano',
    backstage_allowed: true,
    modules: ['justice_treasury', 'gdf_lakehouse']
  },
  CITIZEN_COMMON: {
    title: 'Cidadão Soberano de Novatlantis',
    ministry: 'Acesso ao Portal do Cidadão (Sem Permissão Backstage)',
    backstage_allowed: false,
    modules: []
  }
};

db.exec(`
CREATE TABLE IF NOT EXISTS iam_identity_360_roles (
  grant_id TEXT PRIMARY KEY,
  citizen_id TEXT NOT NULL UNIQUE,
  role_code TEXT NOT NULL,
  ministry TEXT NOT NULL,
  scopes TEXT NOT NULL,
  granted_by_nid TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  is_active INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS edu_institutions (
  institution_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  district TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  director_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_311_tickets (
  ticket_id TEXT PRIMARY KEY,
  citizen_id TEXT NOT NULL,
  citizen_name TEXT NOT NULL,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  description TEXT NOT NULL,
  ai_triage_summary TEXT NOT NULL,
  assigned_department TEXT NOT NULL,
  sla_hours INTEGER NOT NULL,
  status TEXT NOT NULL,
  resolved_by_nid TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_911_dispatches (
  dispatch_id TEXT PRIMARY KEY,
  citizen_id TEXT NOT NULL,
  citizen_name TEXT NOT NULL,
  emergency_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  location_district TEXT NOT NULL,
  blood_type TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  assigned_hospital_id TEXT,
  emergency_contact_nid TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  unit_dispatched TEXT NOT NULL,
  eta_minutes INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_telemed_sessions (
  session_id TEXT PRIMARY KEY,
  patient_nid TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_nid TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  hospital_id TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  ai_soap_notes TEXT NOT NULL,
  prescription_medication TEXT NOT NULL,
  ed25519_signature TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_companies (
  company_id TEXT PRIMARY KEY,
  owner_nid TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  tax_regime TEXT NOT NULL,
  initial_compute_quota_tflops INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_orchestrator_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id TEXT NOT NULL,
  citizen_name TEXT NOT NULL,
  user_message TEXT NOT NULL,
  delegated_agent TEXT NOT NULL,
  action_executed TEXT,
  agent_reply TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

// Seed inicial idempotente
const iamCount = db.prepare('SELECT COUNT(*) AS cnt FROM iam_identity_360_roles').get().cnt;
if (iamCount === 0) {
  const initialAdmins = db.prepare(`
    SELECT nid, iam_role FROM dim_citizens WHERE iam_role != 'CITIZEN_COMMON' LIMIT 50
  `).all();
  const insIam = db.prepare(`INSERT OR IGNORE INTO iam_identity_360_roles VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1)`);
  initialAdmins.forEach((row, idx) => {
    const meta = ROLE_METADATA[row.iam_role] || ROLE_METADATA.CITIZEN_COMMON;
    const grantor =
      row.nid === 'NID-000-0000-0001-9' || row.nid === 'NID-000-0000-0002-7' || row.nid === 'NID-000-0000-0003-5'
        ? 'NID-000-0000-0001-9'
        : 'NID-000-0000-0003-5';
    insIam.run(
      `IAM-360-${String(idx + 1).padStart(4, '0')}`,
      row.nid,
      row.iam_role,
      meta.ministry,
      JSON.stringify(meta.modules),
      grantor,
      '2026-01-01T00:00:00Z'
    );
  });
}

const schCount = db.prepare('SELECT COUNT(*) AS cnt FROM edu_institutions').get().cnt;
if (schCount === 0) {
  const insSch = db.prepare('INSERT INTO edu_institutions VALUES (?, ?, ?, ?, ?, ?)');
  [
    ['SCH-NV-001', 'Escola Básica Libertas Central (Infantil & Fundamental)', 'PRIMARY', 'Distrito Tecnológico', 2500, 'Profa. Valeria Ríos Hernández'],
    ['SCH-NV-002', 'Colégio Soberano Alan Turing (Fundamental & Médio)', 'SECONDARY', 'Colina da Justiça', 3200, 'Prof. Lucas Albuquerque Silva'],
    ['SCH-NV-003', 'Liceu Politécnico de IA & Oceanografia', 'SECONDARY', 'Distrito Oceânico', 2800, 'Dr. Henrique Castro'],
    ['SCH-NV-004', 'Escola Cívica Porto Solar', 'PRIMARY', 'Porto Solar', 2100, 'Profa. Elena Martínez'],
    ['SCH-NV-005', 'Colégio Estadual Vale das Águas', 'SECONDARY', 'Vale das Águas', 2400, 'Prof. Carlos Mendoza'],
    ['SCH-NV-006', 'Universidade Soberana de Novatlantis (USN)', 'HIGHER', 'Distrito Tecnológico', 8500, 'Reitor Dr. Arthur Pendelton']
  ].forEach(s => insSch.run(...s));
}

function getFullCitizenProfile(nidOrEmail) {
  let clean = String(nidOrEmail || '').trim();
  if (!clean) return null;
  const aliases = {
    'admin@jopoco.altostrat.com': 'NID-000-0000-0001-9',
    'jopoco': 'NID-000-0000-0001-9',
    'nid-000-0000-0010-2': 'NID-000-0000-0010-8',
    'nid-000-0000-0011-0': 'NID-000-0000-0011-6',
    'dra.sofia.mendes@novatlantis.gov.cloud': 'NID-000-0000-0004-3',
    'prof.lucas.silva@novatlantis.gov.cloud': 'NID-000-0000-0006-0',
    'comandante.rafael@novatlantis.gov.cloud': 'NID-000-0000-0008-6',
    'juiza.clara.sterling@novatlantis.gov.cloud': 'NID-000-0000-0009-4'
  };
  if (aliases[clean.toLowerCase()]) {
    clean = aliases[clean.toLowerCase()];
  }

  const row = db.prepare(`
    SELECT nid AS citizen_id, full_name, email, birth_date, age, gender, civil_status,
           native_language, citizenship_status, profession AS professional_credential,
           specialty AS profession_label, iam_role AS role_code, address_id, district, tax_status
    FROM dim_citizens
    WHERE nid = ? OR LOWER(email) = LOWER(?)
    LIMIT 1
  `).get(clean, clean);

  if (!row) return null;
  const nid = row.citizen_id;

  const iamRole = db.prepare(`SELECT * FROM iam_identity_360_roles WHERE citizen_id = ? LIMIT 1`).get(nid);
  let effectiveRoleCode = 'CITIZEN_COMMON';
  if (iamRole && Number(iamRole.is_active) === 1 && ROLE_METADATA[iamRole.role_code]) {
    effectiveRoleCode = iamRole.role_code;
  }
  const roleMeta = ROLE_METADATA[effectiveRoleCode] || ROLE_METADATA.CITIZEN_COMMON;

  const hashHex = crypto.createHash('sha256').update(`NIST-${nid}`).digest('hex');
  const biometrics = {
    citizen_id: nid,
    biometric_confidence_score: 0.994,
    ed25519_public_key: `ed25519_pk_nv_${hashHex.slice(0, 40)}`,
    nist_face_preview: `FMR20_ISO19794_5_${Buffer.from(hashHex).toString('base64').slice(0, 48)}...`
  };

  const residence = {
    address_id: row.address_id,
    street: `Av. Soberana Quadra ${row.address_id.slice(-3)}`,
    number: String((parseInt(row.address_id.slice(-3), 10) || 10) * 4),
    district: row.district,
    postal_code: `NV-${row.address_id.slice(-4)}`
  };

  const familyForward = db.prepare(`
    SELECT fg.relation_id, fg.relation_type AS relationship_type,
           c.nid AS relative_nid, c.full_name AS relative_name,
           c.age AS relative_age, c.specialty AS relative_profession,
           c.email AS relative_email
    FROM rel_family_graph fg
    JOIN dim_citizens c ON fg.target_nid = c.nid
    WHERE fg.source_nid = ?
  `).all(nid);

  const familyInverse = db.prepare(`
    SELECT fg.relation_id,
           CASE WHEN fg.relation_type = 'BIOLOGICAL_PARENT' THEN 'CHILD_OF' ELSE fg.relation_type END AS relationship_type,
           c.nid AS relative_nid, c.full_name AS relative_name,
           c.age AS relative_age, c.specialty AS relative_profession,
           c.email AS relative_email
    FROM rel_family_graph fg
    JOIN dim_citizens c ON fg.source_nid = c.nid
    WHERE fg.target_nid = ? AND fg.relation_type = 'BIOLOGICAL_PARENT'
  `).all(nid);

  const familyLinks = [...familyForward, ...familyInverse].map(f => ({
    ...f,
    relative_phone: `+550 98100-${f.relative_nid.slice(-6, -2)}`
  }));

  const healthRow = db.prepare(`SELECT * FROM health_records WHERE patient_nid = ?`).get(nid);
  const enrollmentRow = db.prepare(`
    SELECT e.*, i.name AS institution_name
    FROM edu_enrollments e
    LEFT JOIN edu_institutions i ON e.school_id = i.institution_id
    WHERE e.student_nid = ?
  `).get(nid);
  const passportRow = db.prepare(`SELECT * FROM sec_passports WHERE nid = ?`).get(nid);
  const justiceRow = db.prepare(`SELECT * FROM justice_records WHERE citizen_nid = ?`).get(nid);

  const hospitalIdx = (parseInt(nid.slice(-3, -2), 10) % 5) + 1;

  return {
    ...row,
    nid: row.citizen_id,
    iam_role: effectiveRoleCode,
    profession: row.professional_credential,
    specialty: row.profession_label,
    phone: `+550 98100-${nid.slice(-6, -2)}`,
    ubi_monthly_credits: row.age >= 18 ? 1250.0 : 450.0,
    effective_role_code: effectiveRoleCode,
    role_title: roleMeta.title,
    ministry_label: roleMeta.ministry,
    backstage_allowed: roleMeta.backstage_allowed,
    allowed_modules: roleMeta.modules,
    biometrics,
    residence,
    family_links: familyLinks,
    health: healthRow
      ? {
          citizen_id: nid,
          blood_type: healthRow.blood_type,
          allergies: healthRow.allergies === 'NONE' ? ['Nenhuma'] : healthRow.allergies.split(','),
          chronic_conditions:
            healthRow.chronic_conditions === 'NONE' ? ['Nenhuma (Hígido)'] : healthRow.chronic_conditions.split(','),
          assigned_hospital_id: `HOSP-NV-0${hospitalIdx}`,
          family_doctor_nid: healthRow.assigned_primary_care_physician_nid,
          vaccination_status: healthRow.vaccination_status
        }
      : null,
    education: enrollmentRow || null,
    passport: passportRow
      ? {
          passport_number: passportRow.passport_number,
          status: passportRow.passport_status,
          issue_date: passportRow.issue_date,
          expiration_date: passportRow.expiry_date
        }
      : null,
    justice: justiceRow
      ? {
          background_check_status:
            Number(justiceRow.active_warrants) > 0
              ? 'WARRANT_ACTIVE'
              : Number(justiceRow.has_criminal_record) > 0
              ? 'UNDER_REVIEW'
              : 'CLEAR'
        }
      : null
  };
}

// ============================================================================
// MOTOR DO AGENTE ORQUESTRADOR SOBERANO (america.gov AI Concierge)
// Suporta visitantes anônimos (profile === null) para perguntas abertas e
// exige login apenas no momento de solicitar/executar um serviço transacional.
// ============================================================================
function runSovereignOrchestrator(profile, userMessage) {
  const msg = String(userMessage || '').trim();
  const lower = msg.toLowerCase();
  const now = new Date().toISOString();
  const isAuthenticated = Boolean(profile && profile.citizen_id);

  let delegatedAgent = 'agent-orchestrator-novatlantis-core (Chancelaria Digital)';
  let executedAction = null;
  let reply = '';
  let citations = [];
  let serviceRequestAction = null;

  const suggestedLinks = isAuthenticated
    ? [
        {
          label: 'Abrir Meu Portal do Cidadão',
          url: `${CITIZEN_PORTAL_URL}?nid=${encodeURIComponent(profile.citizen_id)}`
        }
      ]
    : [];

  if (isAuthenticated && profile.backstage_allowed) {
    suggestedLinks.push({
      label: `Abrir Backstage Governamental (${profile.effective_role_code})`,
      url: `${GOV_BACKSTAGE_URL}?nid=${encodeURIComponent(profile.citizen_id)}`
    });
  }

  // 1. Intenção: Abertura de Empresa em 45s / UBI / Impostos / Economia
  if (
    lower.includes('empresa') ||
    lower.includes('cnpj') ||
    lower.includes('negócio') ||
    lower.includes('negocio') ||
    lower.includes('ubi') ||
    lower.includes('imposto') ||
    lower.includes('tributo') ||
    lower.includes('computação') ||
    lower.includes('computacao')
  ) {
    delegatedAgent = 'agent-treasury-autonomous-incorporator-v4 (Ministério do Tesouro & Economia)';
    citations = [
      {
        id: 1,
        agency: 'Ministério do Tesouro & Economia Soberana',
        title: 'Código de Incorporação Autônoma em 45 Segundos (Simples Agêntico 3%)',
        url: `${CITIZEN_PORTAL_URL}?tab=treasury`
      },
      {
        id: 2,
        agency: 'Fundo Soberano de Computação (UBI)',
        title: 'Regulamento do Dividendo Universal de Computação (250 TFLOPs iniciais)',
        url: `${CITIZEN_PORTAL_URL}?tab=treasury`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'INCORPORATE_COMPANY_45S',
      service_title: 'Solicitar Abertura de Empresa Autônoma em 45s',
      service_description: 'Constitui pessoa jurídica digital no AlloyDB com cota inicial de 250 TFLOPs e Simples Agêntico (3%).',
      service_prompt: 'Abrir empresa autônoma agora no Ministério do Tesouro',
      target_portal: 'citizen-portal',
      target_tab: 'treasury'
    };

    if (!isAuthenticated) {
      reply =
        `**Como abrir uma empresa ou consultar seu Dividendo UBI em Novatlantis [1][2]:**\n\n` +
        `Na República Digital de Novatlantis, qualquer cidadão com regularidade fiscal ativa pode constituir uma **Empresa Autônoma em 45 segundos** sem burocracia cartorial:\n` +
        `• **Regime Tributário:** Simples Agêntico (alíquota única de **3%** sobre inferência líquida) [1].\n` +
        `• **Subsídio Computacional:** Concessão imediata de **250 TFLOPs/mês** de capacidade em nuvem soberana para novas empresas [2].\n` +
        `• **Renda Básica Universal (UBI):** Cidadãos maiores de 18 anos recebem **N$ 1.250,00/mês** (e dependentes recebem **N$ 450,00/mês**).\n\n` +
        `Você pode continuar tirando dúvidas livremente aqui no chat. Para **solicitar a abertura da sua empresa agora** ou consultar seu saldo UBI nominal, clique em **"Solicitar Serviço (Requer Login NID)"** abaixo.`;
    } else if (lower.includes('abrir') || lower.includes('criar') || lower.includes('registrar') || lower.includes('solicitar')) {
      const compId = `CORP-NV-${Math.floor(1000 + Math.random() * 8999)}`;
      const compName = `${profile.full_name.split(' ')[0]} Autonomous Ventures NV`;
      db.prepare(`
        INSERT INTO ops_companies VALUES (?, ?, ?, ?, 'IA Soberana & Serviços Cognitivos', 'SIMPLES_AGENTICO_3PCT', 250, 'ACTIVE', ?)
      `).run(compId, profile.citizen_id, profile.full_name, compName, now);

      executedAction = {
        type: 'AUTONOMOUS_COMPANY_INCORPORATED',
        protocol: compId,
        summary: `Empresa "${compName}" aberta com cota inicial de 250 TFLOPs.`
      };
      reply =
        `✅ **Serviço Executado pelo Agente do Tesouro Soberano [1][2]:**\n\n` +
        `Verifiquei sua situação fiscal no AlloyDB (**${profile.tax_status}**) e constituí imediatamente sua empresa digital:\n` +
        `• **Registro Soberano:** \`${compId}\` — *${compName}*\n` +
        `• **Titular:** ${profile.full_name} (\`${profile.citizen_id}\`)\n` +
        `• **Regime Tributário:** Simples Agêntico (3% sobre inferência líquida)\n` +
        `• **Cota Computacional Alocada:** **250 TFLOPs/mês** + Dividendo UBI ativo de **N$ ${profile.ubi_monthly_credits.toFixed(2)}/mês**.`;
    } else {
      reply =
        `📊 **Auditoria Fiscal & Dividendo UBI (${profile.full_name}) [1][2]:**\n\n` +
        `• **Status Tributário no GDF:** \`${profile.tax_status}\`\n` +
        `• **Dividendo Universal de Computação (UBI):** **N$ ${profile.ubi_monthly_credits.toFixed(2)}/mês** creditados diretamente na sua carteira soberana.\n` +
        `• **Alíquota Efetiva sobre Operações Automatizadas:** 0.42% (Austeridade Constitucional).\n\n` +
        `Para abrir sua **Empresa Autônoma em 45 segundos** agora mesmo, clique no botão de solicitação abaixo.`;
    }
  }
  // 2. Intenção: Passaporte ICAO / Fronteira / Viagem / Justiça
  else if (
    lower.includes('passaporte') ||
    lower.includes('viagem') ||
    lower.includes('fronteira') ||
    lower.includes('visto') ||
    lower.includes('icao') ||
    lower.includes('justiça') ||
    lower.includes('justica') ||
    lower.includes('certidão') ||
    lower.includes('certidao')
  ) {
    delegatedAgent = 'agent-border-justice-icao-v4 (Suprema Corte Digital & Chancelaria)';
    citations = [
      {
        id: 1,
        agency: 'Chancelaria Soberana & Controle de Fronteiras',
        title: 'Padrão ICAO Doc 9303 — Passaporte Diplomático e Civil Biométrico',
        url: `${CITIZEN_PORTAL_URL}?tab=treasury`
      },
      {
        id: 2,
        agency: 'Suprema Corte Digital de Novatlantis',
        title: 'Protocolo de Cruzamento Automático (Passaporte × Justiça × Regularidade Fiscal)',
        url: `${CITIZEN_PORTAL_URL}?tab=treasury`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'ISSUE_ICAO_PASSPORT',
      service_title: 'Solicitar Emissão / Renovação de Passaporte Digital ICAO',
      service_description: 'Executa o cruzamento automático entre Registro Civil, Suprema Corte e Receita para liberar o e-Gate.',
      service_prompt: 'Emitir e validar meu Passaporte Digital ICAO agora',
      target_portal: 'citizen-portal',
      target_tab: 'treasury'
    };

    if (!isAuthenticated) {
      reply =
        `**Emissão e Renovação de Passaporte Digital ICAO e Certidão Judicial [1][2]:**\n\n` +
        `O Passaporte Soberano de Novatlantis segue o padrão **ICAO Doc 9303** com assinatura criptográfica **Ed25519** e garante trânsito rápido (e-Gate) em **174 países** [1]:\n` +
        `• **Requisitos Automáticos:** Ausência de mandados judiciais ativos na Suprema Corte Digital e situação fiscal regular (\`REGULAR\` ou \`EXEMPT\`) [2].\n` +
        `• **Prazo de Emissão:** Instantâneo (validação em tempo real na base AlloyDB com validade de 10 anos).\n\n` +
        `Para **emitir ou renovar seu passaporte** ou baixar sua certidão negativa agora, faça login clicando no botão de solicitação do serviço abaixo.`;
    } else {
      const bg = profile.justice?.background_check_status || 'CLEAR';
      if (bg === 'WARRANT_ACTIVE' || profile.tax_status === 'SUSPENDED') {
        reply =
          `⚠️ **Alerta do Cruzamento GDF #1 (Passaporte × Justiça × Fisco) [1][2]:**\n\n` +
          `Identifiquei uma restrição ativa no seu prontuário (Justiça: \`${bg}\`, Fiscal: \`${profile.tax_status}\`). ` +
          `A emissão automática via e-Gate foi retida para revisão de um Magistrado no Backstage.`;
      } else {
        const passNum = profile.passport?.passport_number || `NV-P${Math.floor(1000000 + Math.random() * 8999999)}`;
        if (!profile.passport) {
          db.prepare(`INSERT INTO sec_passports VALUES (?, ?, '2026-10-01', '2036-10-01', 'P<NVT', 'NVT2036', 'ACTIVE')`).run(
            passNum,
            profile.citizen_id
          );
        } else {
          db.prepare(`UPDATE sec_passports SET passport_status = 'ACTIVE', expiry_date = '2036-10-01' WHERE nid = ?`).run(
            profile.citizen_id
          );
        }
        executedAction = {
          type: 'PASSPORT_ICAO_VALIDATED',
          protocol: passNum,
          summary: `Passaporte Digital ICAO ${passNum} validado com decisão CLEARED_AUTONOMOUS_EGATE.`
        };
        reply =
          `🛂 **Serviço Concluído — Passaporte ICAO Validado [1][2]:**\n\n` +
          `• **Cidadão:** ${profile.full_name} (\`${profile.citizen_id}\`)\n` +
          `• **Antecedentes Judiciais:** \`${bg}\` (Nada Consta)\n` +
          `• **Regularidade Fiscal:** \`${profile.tax_status}\`\n` +
          `• **Passaporte Digital ICAO:** \`${passNum}\` — Status: **ACTIVE (Validade: 2036-10-01)**\n` +
          `• **Decisão de Fronteira:** \`CLEARED_AUTONOMOUS_EGATE\` (Isenção de visto ativa em 174 países).`;
      }
    }
  }
  // 3. Intenção: Saúde / Telemedicina / Médico / Vacinas / Sangue / Alergia
  else if (
    lower.includes('saúde') ||
    lower.includes('saude') ||
    lower.includes('médico') ||
    lower.includes('medico') ||
    lower.includes('telemedicina') ||
    lower.includes('consulta') ||
    lower.includes('vacina') ||
    lower.includes('sangue') ||
    lower.includes('alergia') ||
    lower.includes('hospital')
  ) {
    delegatedAgent = 'agent-health-hl7-telemed-v4 (Ministério da Saúde & Hospitais)';
    citations = [
      {
        id: 1,
        agency: 'Ministério da Saúde, Hospitais & Telemedicina',
        title: 'Rede Nacional de Prontuário Único HL7 FHIR & Telemedicina Agêntica 24/7',
        url: `${CITIZEN_PORTAL_URL}?tab=health`
      },
      {
        id: 2,
        agency: 'Conselho Médico Soberano de Novatlantis',
        title: 'Protocolo de Prescrição Digital Assinada com Chave Ed25519',
        url: `${CITIZEN_PORTAL_URL}?tab=health`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'BOOK_TELEMEDICINE_SESSION',
      service_title: 'Solicitar Teleconsulta Médica & Prontuário HL7 FHIR',
      service_description: 'Abre sala de telemedicina com triagem IA (SOAP) e vincula seu hospital de referência.',
      service_prompt: 'Agendar teleconsulta médica agora com resumo clínico HL7',
      target_portal: 'citizen-portal',
      target_tab: 'health'
    };

    if (!isAuthenticated) {
      reply =
        `**Atendimento Médico, Prontuário HL7 FHIR e Telemedicina em Novatlantis [1][2]:**\n\n` +
        `O Sistema Público de Saúde de Novatlantis opera 5 hospitais de alta complexidade integrados ao **Serviço Nacional de Telemedicina Agêntica 24/7** [1]:\n` +
        `• **Triagem Clínica Assistida por IA:** Antes de entrar na sala com o médico, o agente consolida automaticamente seu tipo sanguíneo, alergias e histórico vacinal no padrão **HL7 FHIR**.\n` +
        `• **Receituário Digital Soberano:** Todas as prescrições médicas são assinadas eletronicamente via **Ed25519** com dispensação direta nas farmácias distritais [2].\n\n` +
        `Para **agendar uma teleconsulta médica agora** ou visualizar seu prontuário HL7 pessoal, autentique-se clicando no botão de solicitação abaixo.`;
    } else {
      const sessionId = `TMED-2026-${Math.floor(200 + Math.random() * 799)}`;
      const sig = `sig_ed25519_nv_${Date.now().toString(16)}`;
      db.prepare(`
        INSERT INTO ops_telemed_sessions VALUES (?, ?, ?, 'NID-000-0000-0004-3', 'Dra. Sofia Mendes Costa', ?, ?, ?, ?, ?, 'WAITING_DOCTOR', ?)
      `).run(
        sessionId,
        profile.citizen_id,
        profile.full_name,
        profile.health?.assigned_hospital_id || 'HOSP-NV-01',
        `Triagem via Agente Orquestrador: "${msg}"`,
        `S: Demanda acolhida pelo Agente Orquestrador. O: Tipo Sanguíneo ${profile.health?.blood_type}, Alergias: ${profile.health?.allergies?.join(', ')}. A: Encaminhado à Dra. Sofia Mendes Costa.`,
        'Avaliação clínica em andamento na Sala de Telemedicina',
        sig,
        now
      );
      executedAction = {
        type: 'TELEMEDICINE_TRIAGE_CREATED',
        protocol: sessionId,
        summary: `Sala de Telemedicina ${sessionId} aberta no ${profile.health?.assigned_hospital_id} com Dra. Sofia Mendes Costa.`
      };
      reply =
        `🏥 **Teleconsulta Agendada & Prontuário HL7 FHIR Carregado [1][2]:**\n\n` +
        `• **Paciente:** ${profile.full_name} (\`${profile.citizen_id}\`)\n` +
        `• **Tipo Sanguíneo:** \`${profile.health?.blood_type}\` | **Alergias:** ${profile.health?.allergies?.join(', ')}\n` +
        `• **Condições Crônicas:** ${profile.health?.chronic_conditions?.join(', ')}\n` +
        `• **Hospital de Referência:** \`${profile.health?.assigned_hospital_id}\` | **Status Vacinal:** \`${profile.health?.vaccination_status}\`\n` +
        `• **Protocolo de Teleconsulta Aberto:** \`${sessionId}\` com **Dra. Sofia Mendes Costa** (\`NID-000-0000-0004-3\`).`;
    }
  }
  // 4. Intenção: Educação / Escola / Notas / Boletim / Aluno / Professor
  else if (
    lower.includes('escola') ||
    lower.includes('educação') ||
    lower.includes('educacao') ||
    lower.includes('nota') ||
    lower.includes('boletim') ||
    lower.includes('prova') ||
    lower.includes('aluno') ||
    lower.includes('estudante') ||
    lower.includes('filho') ||
    lower.includes('universidade')
  ) {
    delegatedAgent = 'agent-education-adaptive-tutor-v4 (Ministério da Educação & Escolas)';
    citations = [
      {
        id: 1,
        agency: 'Ministério da Educação, Escolas & Avaliação Nacional',
        title: 'Currículo Nacional AI-First (Matemática, Ciências, IA & Robótica e Idiomas)',
        url: `${CITIZEN_PORTAL_URL}?tab=education`
      },
      {
        id: 2,
        agency: 'Government Data Platform (GDP — Education Data Platform)',
        title: 'Sistema de Alerta Precoce de Frequência Escolar Integrado ao Grafo Familiar',
        url: `${CITIZEN_PORTAL_URL}?tab=education`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'ACCESS_EDUCATION_RECORDS',
      service_title: 'Solicitar Boletim Escolar & Tutoria Adaptativa IA',
      service_description: 'Consulta notas por disciplina, frequência escolar e plano de estudo personalizado para você ou seus filhos.',
      service_prompt: 'Consultar boletim escolar e frequência no Ministério da Educação',
      target_portal: 'citizen-portal',
      target_tab: 'education'
    };

    if (!isAuthenticated) {
      reply =
        `**Rede Pública de Educação e Tutoria Adaptativa por IA em Novatlantis [1][2]:**\n\n` +
        `O Ministério da Educação administra **6 instituições soberanas** (da Educação Infantil à Universidade Soberana de Novatlantis — USN), atendendo **17.993 estudantes** com currículo bilíngue/trilíngue e foco em **IA & Robótica** [1]:\n` +
        `• **Tutoria Adaptativa:** Cada estudante recebe trilhas de estudo personalizadas conforme sua idade e desempenho por disciplina.\n` +
        `• **Acompanhamento Familiar (GDP):** Pais e responsáveis acompanham notas e frequência em tempo real com alertas automáticos se a presença ficar abaixo de 75% [2].\n\n` +
        `Para **consultar o boletim escolar nominal** (seu ou de seus dependentes) ou solicitar tutoria IA, clique no botão abaixo para fazer login.`;
    } else {
      let targetEdu = profile.education;
      let studentLabel = `${profile.full_name} (${profile.citizen_id})`;

      if (!targetEdu) {
        const childLink = profile.family_links?.find((f) => f.relative_age <= 22);
        const fallbackNid = childLink ? childLink.relative_nid : 'NID-000-0000-0010-8';
        const childProf = getFullCitizenProfile(fallbackNid);
        if (childProf?.education) {
          targetEdu = childProf.education;
          studentLabel = `${childProf.full_name} (${childProf.citizen_id} — Dependente/Estudante)`;
        }
      }

      if (targetEdu) {
        executedAction = {
          type: 'EDUCATION_TRANSCRIPT_ISSUED',
          protocol: `EDU-${targetEdu.school_id}-2026`,
          summary: `Boletim escolar oficial consultado para ${studentLabel}.`
        };
        reply =
          `🎓 **Relatório Escolar GDF & Desempenho por Disciplina [1][2]:**\n\n` +
          `• **Estudante:** ${studentLabel}\n` +
          `• **Instituição:** ${targetEdu.institution_name} (\`${targetEdu.school_id}\` — ${targetEdu.grade_level})\n` +
          `• **Frequência Escolar:** **${targetEdu.attendance_rate}%** ${
            targetEdu.attendance_rate < 75
              ? '⚠️ *(Alerta Precoce de Evasão enviado aos pais via Grafo Familiar)*'
              : '✅ *(Regular)*'
          }\n` +
          `• **Notas por Matéria:**\n` +
          `  - Matemática & Lógica: **${targetEdu.score_mathematics}**\n` +
          `  - Ciências da Natureza: **${targetEdu.score_sciences}**\n` +
          `  - IA & Robótica: **${targetEdu.score_ai_robotics}**\n` +
          `  - Linguagens (PT/ES/EN): **${targetEdu.score_languages}**`;
      } else {
        reply = `Consultei a rede nacional de ensino (17.993 alunos matriculados nas 6 instituições soberanas). Você pode acessar o Portal do Cidadão para tutoria adaptativa ou o Backstage Educacional para lançar notas e provas.`;
      }
    }
  }
  // 5. Intenção: Emergência 911 / Socorro / Ambulância
  else if (
    lower.includes('911') ||
    lower.includes('emergência') ||
    lower.includes('emergencia') ||
    lower.includes('socorro') ||
    lower.includes('ambulância') ||
    lower.includes('ambulancia') ||
    lower.includes('resgate')
  ) {
    delegatedAgent = 'agent-emergency-911-tactical-dispatch-v4 (Comando Nacional 911)';
    citations = [
      {
        id: 1,
        agency: 'Centro Integrado de Comando de Emergência 911',
        title: 'Protocolo de Despacho Tático com Cruzamento HL7 FHIR e Grafo Familiar (ETA 3 min)',
        url: `${CITIZEN_PORTAL_URL}?tab=urban`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'DISPATCH_911_EMERGENCY',
      service_title: 'Solicitar Despacho de Emergência 911 com Prontuário HL7',
      service_description: 'Envia viatura/UTI móvel ao seu endereço registrado com seu tipo sanguíneo, alergias e aviso aos familiares.',
      service_prompt: 'Acionar emergência 911 com meu prontuário HL7 agora',
      target_portal: 'citizen-portal',
      target_tab: 'urban'
    };

    if (!isAuthenticated) {
      reply =
        `**Como funciona o Despacho Tático de Emergência 911 em Novatlantis [1]:**\n\n` +
        `O Comando Nacional 911 utiliza o **Cruzamento Soberano GDF #3** para salvar vidas com tempo médio de resposta (ETA) de **3 minutos**:\n` +
        `• Ao acionar o 911 autenticado, a ambulância recebe instantaneamente seu **endereço georreferenciado**, **tipo sanguíneo**, **alergias medicamentosas** e **condições crônicas**.\n` +
        `• O hospital distrital mais próximo prepara o leito e seu **contato de emergência familiar** é notificado automaticamente.\n\n` +
        `Para **solicitar o despacho 911 vinculado ao seu prontuário e endereço**, autentique-se clicando no botão abaixo.`;
    } else {
      const dispatchId = `911-NV-2026-${Math.floor(910 + Math.random() * 89)}`;
      const ecLink = profile.family_links?.[0];
      db.prepare(`
        INSERT INTO ops_911_dispatches VALUES (?, ?, ?, ?, 'P1_CRITICAL', ?, ?, ?, ?, ?, ?, ?, ?, 'Unidade UTI Autônoma + Alerta HL7', 3, 'DISPATCHED_EN_ROUTE', ?)
      `).run(
        dispatchId,
        profile.citizen_id,
        profile.full_name,
        `Acionamento 911 via Agente Orquestrador: "${msg}"`,
        profile.residence?.district || 'Distrito Tecnológico',
        profile.health?.blood_type || 'O+',
        JSON.stringify(profile.health?.allergies || []),
        JSON.stringify(profile.health?.chronic_conditions || []),
        profile.health?.assigned_hospital_id || 'HOSP-NV-01',
        ecLink?.relative_nid || 'NID-000-0000-0001-9',
        ecLink?.relative_name || 'Familiar Responsável',
        ecLink?.relative_phone || '+550 98100-0001',
        now
      );
      executedAction = {
        type: 'EMERGENCY_911_DISPATCHED',
        protocol: dispatchId,
        summary: `Resgate 911 (${dispatchId}) despachado com ETA de 3 min + Cruzamento GDF #3 (HL7 + Família).`
      };
      reply =
        `🚨 **DESPACHO IMEDIATO 911 ATIVADO — PROTOCOLO \`${dispatchId}\` [1]:**\n\n` +
        `Executei o **Cruzamento GDF #3 (Emergência × Prontuário HL7 × Grafo Familiar)**:\n` +
        `• **Localização:** ${profile.residence?.street}, ${profile.residence?.number} (${profile.residence?.district})\n` +
        `• **Dados Vitais Enviados à Ambulância:** Tipo Sanguíneo **${profile.health?.blood_type}**, Alergias: **${profile.health?.allergies?.join(', ')}**\n` +
        `• **Hospital Preparado:** \`${profile.health?.assigned_hospital_id}\` (ETA: 3 minutos)\n` +
        `• **Contato Familiar Notificado Automaticamente:** **${ecLink?.relative_name || 'Familiar GDF'}** (\`${ecLink?.relative_nid || 'NID-000-0000-0001-9'}\` • Tel: ${ecLink?.relative_phone || '+550 98100-0001'}).`;
    }
  }
  // 6. Intenção: Zeladoria Urbana 311 / Iluminação / Vias / Saneamento
  else if (
    lower.includes('311') ||
    lower.includes('zeladoria') ||
    lower.includes('iluminação') ||
    lower.includes('iluminacao') ||
    lower.includes('buraco') ||
    lower.includes('rua') ||
    lower.includes('água') ||
    lower.includes('agua') ||
    lower.includes('saneamento') ||
    lower.includes('chamado') ||
    lower.includes('demanda')
  ) {
    delegatedAgent = 'agent-urban-311-dispatcher-v4 (Secretaria de Zeladoria Urbana 311)';
    citations = [
      {
        id: 1,
        agency: 'Secretaria de Infraestrutura, Zeladoria 311 & Smart Grid IoT',
        title: 'Carta de Serviços Urbanos 311 — SLA Médio de 6 Horas por Distrito',
        url: `${CITIZEN_PORTAL_URL}?tab=urban`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'OPEN_311_URBAN_TICKET',
      service_title: 'Solicitar Abertura de Chamado Urbano 311',
      service_description: 'Registra ordem de serviço georreferenciada no seu distrito e envia para a fila do Backstage Governamental.',
      service_prompt: `Abrir chamado 311 para: ${msg}`,
      target_portal: 'citizen-portal',
      target_tab: 'urban'
    };

    if (!isAuthenticated) {
      reply =
        `**Atendimento de Zeladoria Urbana 311 e Smart Grid em Novatlantis [1]:**\n\n` +
        `A central **311** recebe solicitações de manutenção de vias, iluminação pública LED/IoT, coleta seletiva e saneamento nos 5 distritos da nação (**Distrito Tecnológico**, **Distrito Oceânico**, **Colina da Justiça**, **Porto Solar** e **Vale das Águas**) [1]:\n` +
        `• **Triagem por IA:** O Agente 311 classifica a severidade e encaminha diretamente à equipe de engenharia no **Backstage Governamental** com **SLA médio de 6 horas**.\n\n` +
        `Para **abrir oficialmente este chamado 311** em seu nome e acompanhar o protocolo, clique no botão de solicitação abaixo para fazer login.`;
    } else {
      const ticketId = `311-NV-2026-${Math.floor(100 + Math.random() * 899)}`;
      db.prepare(`
        INSERT INTO ops_311_tickets VALUES (?, ?, ?, 'Zeladoria Urbana & Smart Grid (Via Orquestrador)', ?, ?, ?, 'Secretaria de Infraestrutura & IoT', 6, 'OPEN', NULL, NULL, ?)
      `).run(
        ticketId,
        profile.citizen_id,
        profile.full_name,
        profile.residence?.district || 'Distrito Tecnológico',
        msg,
        `IA Orquestradora 311: Demanda geolocalizada no imóvel ${profile.residence?.address_id} (${profile.residence?.district}). Encaminhada ao Backstage.`,
        now
      );
      executedAction = {
        type: 'URBAN_311_TICKET_OPENED',
        protocol: ticketId,
        summary: `Chamado urbano ${ticketId} aberto e enviado à fila dos servidores públicos no Backstage.`
      };
      reply =
        `🏙️ **Ordem de Serviço Urbana 311 Registrada (\`${ticketId}\`) [1]:**\n\n` +
        `• **Solicitante:** ${profile.full_name} (\`${profile.citizen_id}\`)\n` +
        `• **Imóvel Georreferenciado:** \`${profile.residence?.address_id}\` — ${profile.residence?.district}\n` +
        `• **SLA Estimado pela IA:** 6 horas\n` +
        `• **Encaminhamento:** Já disponível na fila do **Backstage Governamental 311** para execução pelos servidores públicos.`;
    }
  }
  // 7. Intenção: Identidade 360 / NID / Biometria / Família / Permissões Backstage
  else if (
    lower.includes('identidade') ||
    lower.includes('nid') ||
    lower.includes('biometria') ||
    lower.includes('família') ||
    lower.includes('familia') ||
    lower.includes('permissão') ||
    lower.includes('permissao') ||
    lower.includes('backstage') ||
    lower.includes('360') ||
    lower.includes('perfil')
  ) {
    delegatedAgent = 'agent-identity-360-governor-v4 (Autoridade Nacional de Identidade 360)';
    citations = [
      {
        id: 1,
        agency: 'Autoridade Nacional de Identidade Soberana (NID & NIST Biometrics)',
        title: 'Padrão ANSI/NIST-ITL 1-2011 / ISO/IEC 19794-5 & Chave Pública Ed25519',
        url: `${CITIZEN_PORTAL_URL}?tab=identity`
      },
      {
        id: 2,
        agency: 'Governança de Acesso Identidade 360 (RBAC Governamental)',
        title: 'Regulamento de Concessão e Revogação de Acesso ao Backstage Governamental',
        url: `${GOV_BACKSTAGE_URL}`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'ACCESS_IDENTITY_360_WALLET',
      service_title: 'Acessar Carteira Digital NID, Biometria NIST & Árvore Familiar',
      service_description: 'Exibe sua credencial soberana NID, chave pública Ed25519, vínculos familiares e permissões Identidade 360.',
      service_prompt: 'Consultar minha Carteira Digital NID e vínculos familiares',
      target_portal: 'citizen-portal',
      target_tab: 'identity'
    };

    if (!isAuthenticated) {
      reply =
        `**Identidade Nacional Soberana (NID), Biometria NIST e Governança 360 [1][2]:**\n\n` +
        `Todo cidadão de Novatlantis possui um **NID (Novatlantis Identity ID)** no padrão \`NID-XXX-XXXX-XXXX\` com dígito verificador Módulo 11, biometria facial/digital **ISO/IEC 19794** e par de chaves **Ed25519** [1]:\n` +
        `• **Acesso Único (SSO):** O mesmo NID/e-mail autentica o cidadão nos serviços públicos e, caso possua nomeação ativa na **Identidade 360** (como Médico, Professor, Gestor 311/911 ou Primeiro-Ministro), libera automaticamente os módulos correspondentes no **Backstage Governamental** [2].\n\n` +
        `Para **acessar sua Carteira NID, atualizar sua foto/perfil ou consultar sua Árvore Familiar**, clique no botão abaixo para entrar com seu NID.`;
    } else {
      const famList =
        profile.family_links?.map((f) => `${f.relationship_type}: ${f.relative_name} (${f.relative_nid})`).join(' • ') ||
        'Sem vínculos diretos';
      executedAction = {
        type: 'IDENTITY_360_VERIFIED',
        protocol: profile.citizen_id,
        summary: `Credencial NID ${profile.citizen_id} e grafo familiar verificados no AlloyDB.`
      };
      reply =
        `🪪 **Credencial Soberana NID & Governança Identidade 360 [1][2]:**\n\n` +
        `• **Titular:** ${profile.full_name} (\`${profile.citizen_id}\`)\n` +
        `• **Credencial Profissional:** \`${profile.professional_credential}\` (${profile.profession_label})\n` +
        `• **Papel Ativo na Identidade 360:** \`${profile.effective_role_code}\` (${profile.role_title})\n` +
        `• **Acesso ao Backstage Governamental:** **${profile.backstage_allowed ? 'AUTORIZADO (ATIVO)' : 'BLOQUEADO (CIDADÃO COMUM)'}**\n` +
        `• **Grafo Familiar (\`rel_family_graph\`):** ${famList}`;
    }
  }
  // 8. Resposta Geral Orquestrada para qualquer outra consulta
  else {
    delegatedAgent = 'agent-orchestrator-novatlantis-core (Concierge Digital da Nação)';
    citations = [
      {
        id: 1,
        agency: 'Chancelaria Digital da República de Novatlantis',
        title: 'Guia Oficial de Serviços Públicos Digitais & Estado AI-First',
        url: `${CITIZEN_PORTAL_URL}`
      },
      {
        id: 2,
        agency: 'Government Data Platform (AlloyDB + BigQuery Lakehouse)',
        title: 'Arquitetura Soberana de Dados Cívicos (100.000 Cidadãos)',
        url: `${GOV_BACKSTAGE_URL}`
      }
    ];
    serviceRequestAction = {
      requires_auth: !isAuthenticated,
      service_id: 'OPEN_CITIZEN_PORTAL_SERVICES',
      service_title: 'Solicitar Serviço Público no Portal do Cidadão',
      service_description: 'Acesse todos os serviços digitais (NID, Saúde, Educação, Empresas em 45s, Passaporte ICAO e Zeladoria 311).',
      service_prompt: 'Consultar meu prontuário completo e serviços disponíveis no GDF',
      target_portal: 'citizen-portal',
      target_tab: 'identity'
    };

    if (!isAuthenticated) {
      reply =
        `**Bem-vindo ao Concierge Digital da República de Novatlantis [1][2]:**\n\n` +
        `Você pode fazer qualquer pergunta sobre leis, documentos, saúde, educação, impostos ou serviços urbanos **sem precisar estar logado**.\n\n` +
        `Principais áreas de atendimento imediato:\n` +
        `1. **Identidade Soberana (NID) & Família:** Emissão de credencial, biometria padrão NIST e consulta ao núcleo familiar.\n` +
        `2. **Saúde & Telemedicina 24/7:** Prontuário único HL7 FHIR, histórico vacinal e teleconsultas médicas.\n` +
        `3. **Educação & Tutoria IA:** Boletim por matéria, frequência escolar e trilhas adaptativas.\n` +
        `4. **Economia & Tesouro:** Abertura de empresa autônoma em 45 segundos e Dividendo UBI.\n` +
        `5. **Passaporte Digital ICAO & Justiça:** Validação automática de fronteira (e-Gate em 174 países).\n` +
        `6. **Zeladoria 311 & Emergência 911:** Abertura de chamados urbanos e resgate tático.\n\n` +
        `Faça sua pergunta acima ou, se desejar **solicitar um serviço oficial agora**, clique no botão abaixo para autenticar seu NID.`;
    } else {
      reply =
        `🏛️ **Concierge Digital da República de Novatlantis [1][2]:**\n\n` +
        `Olá, **${profile.full_name}** (\`${profile.citizen_id}\`). Sua sessão está autenticada no AlloyDB (Distrito: *${profile.residence?.district}*, Papel 360: \`${profile.effective_role_code}\`).\n\n` +
        `Escolha ou digite o serviço que deseja executar agora:\n` +
        `• *"Abrir empresa autônoma agora"* (Tesouro & UBI)\n` +
        `• *"Emitir ou renovar meu passaporte digital ICAO"* (Chancelaria & Fronteiras)\n` +
        `• *"Agendar teleconsulta médica"* (Saúde HL7 FHIR)\n` +
        `• *"Consultar boletim escolar"* (Educação)\n` +
        `• *"Abrir chamado 311 de iluminação"* (Zeladoria Urbana)`;
    }
  }

  const orchestrationTrace = [
    {
      step: 1,
      node: 'Contexto de Sessão (Zero-Trust)',
      detail: isAuthenticated
        ? `Cidadão Autenticado: ${profile.citizen_id} (${profile.full_name}) • Role 360: ${profile.effective_role_code}`
        : 'Visitante Anônimo (Consulta Pública Habilitada • Login exigido apenas na solicitação de serviço)'
    },
    {
      step: 2,
      node: 'Roteamento Semântico pelo Concierge Nacional',
      detail: `Agente Especialista: ${delegatedAgent}`
    },
    {
      step: 3,
      node: 'Execução / Orientação Oficial',
      detail: executedAction
        ? `${executedAction.type} -> Protocolo ${executedAction.protocol}`
        : isAuthenticated
        ? 'Consulta nominal concluída no AlloyDB'
        : 'Orientação pública com citações oficiais entregue; aguardando autenticação para transação'
    }
  ];

  db.prepare(`
    INSERT INTO ops_orchestrator_logs (citizen_id, citizen_name, user_message, delegated_agent, action_executed, agent_reply, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    isAuthenticated ? profile.citizen_id : 'ANONYMOUS_VISITOR',
    isAuthenticated ? profile.full_name : 'Visitante Não Autenticado',
    msg,
    delegatedAgent,
    executedAction ? JSON.stringify(executedAction) : null,
    reply,
    now
  );

  const orchestrationSteps = orchestrationTrace.map((t, idx) => ({
    agent: idx === 0 ? 'IAM-360-Session' : idx === 1 ? delegatedAgent.split(' ')[0] : 'AlloyDB-Gov-Engine',
    step: `${t.node}: ${t.detail}`,
    status: 'OK',
    latency_ms: 11 + idx * 14
  }));

  const actionCard = executedAction
    ? {
        type: executedAction.type,
        title: executedAction.summary,
        reference_id: executedAction.protocol,
        status: 'EXECUTADO NO ALLOYDB',
        target_portal: 'citizen-portal',
        target_url:
          suggestedLinks[0]?.url ||
          `${CITIZEN_PORTAL_URL}?nid=${encodeURIComponent(profile.citizen_id)}&tab=${serviceRequestAction?.target_tab || 'identity'}`,
        details: {
          Titular: `${profile.full_name} (${profile.citizen_id})`,
          Agente: delegatedAgent,
          Distrito: profile.residence?.district || 'Distrito Tecnológico',
          Protocolo: executedAction.protocol
        }
      }
    : null;

  return {
    message_id: `MSG-NOV-${Date.now()}`,
    intent: executedAction ? executedAction.type : 'STATE_ORCHESTRATION',
    authenticated: isAuthenticated,
    citizen_id: isAuthenticated ? profile.citizen_id : null,
    citizen_name: isAuthenticated ? profile.full_name : null,
    delegated_agent: delegatedAgent,
    executed_action: executedAction,
    action_card: actionCard,
    service_request_action: serviceRequestAction,
    citations,
    orchestration_trace: orchestrationTrace,
    orchestration_steps: orchestrationSteps,
    reply,
    suggested_links: suggestedLinks,
    suggested_prompts: [
      'Como emitir ou renovar meu Passaporte Digital ICAO?',
      'Como abrir uma empresa autônoma em 45 segundos?',
      'Como agendar uma teleconsulta médica 24/7?',
      'Como consultar o boletim escolar e frequência dos meus filhos?',
      'Como abrir um chamado urbano 311 no meu distrito?',
      'Como funciona a Identidade Soberana NID e o acesso ao Backstage?'
    ],
    timestamp: now
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      return sendJson(res, 200, { ok: true });
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/v1/')) {
      const handled = await handleCentralAuthAndProfileRoutes(req, res, db, pathname, url, readBody, sendJson);
      if (handled !== false) return;
    }

    if (pathname === '/api/health') {
      const totalCitizens = db.prepare('SELECT COUNT(*) AS cnt FROM dim_citizens').get().cnt;
      const totalFamily = db.prepare('SELECT COUNT(*) AS cnt FROM rel_family_graph').get().cnt;
      const totalEdu = db.prepare('SELECT COUNT(*) AS cnt FROM edu_enrollments').get().cnt;
      const totalPassports = db.prepare('SELECT COUNT(*) AS cnt FROM sec_passports').get().cnt;
      const activeRoles = db.prepare('SELECT COUNT(*) AS cnt FROM iam_identity_360_roles WHERE is_active = 1').get().cnt;
      return sendJson(res, 200, {
        status: 'ok',
        service: 'novatlantis-landing-portal-orchestrator',
        project_id: 'novatlantis',
        database_engine: 'Google Cloud AlloyDB for PostgreSQL 15 (novatlantis-sovereign-cluster / novatlantis-primary-01)',
        government_data_platform: 'Google Cloud Government Data Platform (GDP) — Baseado em education-data-platform',
        citizens_total: totalCitizens,
        active_backstage_roles: activeRoles,
        lakehouse_counts: {
          citizens: totalCitizens,
          family_links: totalFamily,
          edu_enrollments: totalEdu,
          passports: totalPassports
        },
        connected_applications: {
          landing_portal: 'https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app',
          citizen_portal: CITIZEN_PORTAL_URL,
          gov_backstage: GOV_BACKSTAGE_URL
        },
        lakehouse: {
          alloydb_cluster: 'projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster',
          alloydb_primary_ip: '10.223.28.2',
          gcs_buckets: [
            'gs://novatlantis-gdp-drp-cs-0',
            'gs://novatlantis-gdp-load-cs-0',
            'gs://novatlantis-gdp-trf-cs-0',
            'gs://novatlantis-gdp-dwh-lnd-cs-0',
            'gs://novatlantis-gdp-dwh-cur-cs-0',
            'gs://novatlantis-gdp-dwh-conf-cs-0',
            'gs://novatlantis-gdp-dwh-plg-cs-0'
          ],
          bigquery_datasets: [
            'novatlantis:novatlantis_gdp_drp_bq_0',
            'novatlantis:novatlantis_gdp_dwh_lnd_bq_0',
            'novatlantis:novatlantis_gdp_dwh_cur_bq_0',
            'novatlantis:novatlantis_gdp_dwh_conf_bq_0',
            'novatlantis:novatlantis_gdp_dwh_plg_bq_0'
          ]
        }
      });
    }

    if ((pathname === '/api/users/search' || pathname === '/api/gdf/search') && req.method === 'GET') {
      const q = String(url.searchParams.get('q') || '').trim();
      const limit = Math.min(Number(url.searchParams.get('limit') || 15), 50);
      const pattern = `%${q || 'NID-000'}%`;
      const rows = db
        .prepare(`
          SELECT nid, full_name, email, age, gender, native_language, profession, specialty, iam_role, district, tax_status
          FROM dim_citizens
          WHERE nid LIKE ? OR full_name LIKE ? OR email LIKE ? OR profession LIKE ?
          LIMIT ?
        `)
        .all(pattern, pattern, pattern, pattern, limit);
      return sendJson(res, 200, { query: q, count: rows.length, results: rows });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const identifier = String(body.identifier || '').trim();
      if (!identifier) {
        return sendJson(res, 400, { error: 'Informe um NID ou e-mail válido.' });
      }
      const profile = getFullCitizenProfile(identifier);
      if (!profile) {
        return sendJson(res, 404, {
          error: 'Cidadão não encontrado na base GDF de 100.000 registros. Verifique o NID ou e-mail.'
        });
      }
      return sendJson(res, 200, { citizen: profile });
    }

    // Endpoint Principal do Agente Orquestrador de Estado (Chat Interativo)
    // Suporta perguntas anônimas (nid = null) e execução autenticada (nid = NID válido)
    if (pathname === '/api/orchestrator/chat' && req.method === 'POST') {
      const body = await readBody(req);
      const targetNid = String(body.nid || body.citizen_id || '').trim();
      const profile = targetNid ? getFullCitizenProfile(targetNid) : null;
      const result = runSovereignOrchestrator(profile, body.message || '');
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/orchestrator/history' && req.method === 'GET') {
      const cid = String(url.searchParams.get('citizen_id') || '').trim();
      if (!cid) {
        return sendJson(res, 200, { logs: [] });
      }
      const logs = db
        .prepare('SELECT * FROM ops_orchestrator_logs WHERE citizen_id = ? ORDER BY log_id DESC LIMIT 15')
        .all(cid);
      return sendJson(res, 200, { logs });
    }

    if (pathname === '/api/national/summary' && req.method === 'GET') {
      const counts = {
        dim_citizens: db.prepare('SELECT COUNT(*) AS c FROM dim_citizens').get().c,
        rel_family_graph: db.prepare('SELECT COUNT(*) AS c FROM rel_family_graph').get().c,
        edu_enrollments: db.prepare('SELECT COUNT(*) AS c FROM edu_enrollments').get().c,
        sec_passports: db.prepare('SELECT COUNT(*) AS c FROM sec_passports').get().c,
        iam_active_roles: db.prepare('SELECT COUNT(*) AS c FROM iam_identity_360_roles WHERE is_active = 1').get().c
      };
      return sendJson(res, 200, {
        counts,
        urls: {
          citizen_portal: CITIZEN_PORTAL_URL,
          gov_backstage: GOV_BACKSTAGE_URL
        }
      });
    }

    // Static files serving from dist/
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    console.error('[National Portal Server Error]', err);
    sendJson(res, 500, { error: err.message || 'Erro interno no Portal da Nação.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Novatlantis National Portal & Orchestrator] Escutando na porta ${PORT}`);
});
