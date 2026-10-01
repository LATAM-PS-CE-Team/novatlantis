import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const DB_PATH = process.env.GDF_DB_PATH || path.join(__dirname, 'gdf_sovereign.db');
const DIST_DIR = path.join(__dirname, 'dist');

console.log(`[Novatlantis Sovereign Server] Conectando ao banco GDF: ${DB_PATH}`);
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
    ministry: 'Acesso Exclusivo ao Portal do Cidadão (Sem Acesso Backstage)',
    backstage_allowed: false,
    modules: []
  }
};

// Inicializa tabelas complementares e operacionais (Identidade 360, Escolas e Operações)
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

CREATE TABLE IF NOT EXISTS ops_school_exams (
  exam_id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  teacher_nid TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  title TEXT NOT NULL,
  average_score REAL NOT NULL,
  applied_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS ops_audit_log (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_nid TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_nid TEXT,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

// Popula iam_identity_360_roles a partir dos perfis iniciais do GDF se estiver vazia
const iamCount = db.prepare('SELECT COUNT(*) AS cnt FROM iam_identity_360_roles').get().cnt;
if (iamCount === 0) {
  const initialAdmins = db.prepare(`
    SELECT nid, iam_role FROM dim_citizens WHERE iam_role != 'CITIZEN_COMMON' LIMIT 50
  `).all();
  const insIam = db.prepare(`
    INSERT OR IGNORE INTO iam_identity_360_roles VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1)
  `);
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

// Popula edu_institutions se vazia
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

// Popula seeds operacionais (311, 911, Telemedicina, Provas, Empresas, Auditoria)
const ticketCount = db.prepare('SELECT COUNT(*) AS cnt FROM ops_311_tickets').get().cnt;
if (ticketCount === 0) {
  const ins311 = db.prepare('INSERT INTO ops_311_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  ins311.run(
    '311-NV-2026-001',
    'NID-000-0000-0006-0',
    'Prof. Lucas Albuquerque Silva',
    'Iluminação Fotovoltaica & Smart Grid',
    'Colina da Justiça',
    'Luminária pública autônoma com falha de telemetria em frente ao Colégio Alan Turing.',
    'IA 311: Anomalia confirmada no nó IoT #CJ-441. Prioridade Alta por proximidade escolar.',
    'Secretaria de Infraestrutura & Energia Limpa',
    6,
    'IN_PROGRESS',
    'NID-000-0000-0008-6',
    'Equipe de manutenção robótica agendada.',
    '2026-10-01T08:15:00Z'
  );
  ins311.run(
    '311-NV-2026-002',
    'NID-000-0000-0007-8',
    'Profa. Valeria Ríos Hernández',
    'Mobilidade Autônoma & Vias',
    'Distrito Tecnológico',
    'Recalibração de faixa de pedestres inteligente no cruzamento da Av. Turing.',
    'IA 311: Sensor LiDAR de travessia requer limpeza óptica.',
    'Agência Nacional de Mobilidade Autônoma',
    4,
    'OPEN',
    null,
    null,
    '2026-10-01T09:05:00Z'
  );
  ins311.run(
    '311-NV-2026-003',
    'NID-000-0000-0004-3',
    'Dra. Sofia Mendes Costa',
    'Saneamento & Qualidade Hídrica',
    'Distrito Oceânico',
    'Solicitação de laudo público de salinidade na estação dessalinizadora Setor 2.',
    'IA 311: Parâmetros normais (99.94% pureza); relatório enviado e chamado concluído.',
    'Companhia Águas de Novatlantis',
    12,
    'RESOLVED',
    'NID-000-0000-0008-6',
    'Laudo de potabilidade publicado no painel transparente.',
    '2026-09-30T17:40:00Z'
  );

  const ins911 = db.prepare('INSERT INTO ops_911_dispatches VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  ins911.run(
    '911-NV-2026-901',
    'NID-000-0000-0010-8',
    'Pedro Albuquerque Viana',
    'Emergência Médica Pediátrica (Alergia Severa)',
    'P1_CRITICAL',
    'Colina da Justiça',
    'O+',
    '["Penicilina"]',
    '["Asma Leve"]',
    'HOSP-NV-01',
    'NID-000-0000-0006-0',
    'Prof. Lucas Albuquerque Silva (Pai)',
    '+550 98100-0006',
    'Ambulância Autônoma UTI-04 + Drone Epinefrina',
    3,
    'DISPATCHED_EN_ROUTE',
    '2026-10-01T09:20:00Z'
  );

  const insTelemed = db.prepare('INSERT INTO ops_telemed_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insTelemed.run(
    'TMED-2026-101',
    'NID-000-0000-0010-8',
    'Pedro Albuquerque Viana',
    'NID-000-0000-0004-3',
    'Dra. Sofia Mendes Costa',
    'HOSP-NV-01',
    'Acompanhamento respiratório sazonal e revisão de plano de ação escolar.',
    'S: Paciente 11 anos acompanhado pelo pai (NID-000-0000-0006-0). O: SpO2 99%, ausculta limpa. A: Quadro estável. P: Manter broncodilatador preventivo; alerta de alergia ativo no GDF.',
    'Budesonida 200mcg Spray Nasal — 1 jato 12/12h por 30 dias',
    'sig_ed25519_novatlantis_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    'COMPLETED_SIGNED',
    '2026-10-01T08:45:00Z'
  );
  insTelemed.run(
    'TMED-2026-102',
    'NID-000-0000-0007-8',
    'Profa. Valeria Ríos Hernández',
    'NID-000-0000-0005-1',
    'Dr. Mateo Vargas Ríos',
    'HOSP-NV-02',
    'Check-up preventivo anual e renovação de perfil metabólico.',
    'S: Cidadã assintomática. O: PA 115/75 mmHg, FC 66 bpm. A: Hígida. P: Solicitação de painel laboratorial preventivo anual.',
    'Vitamina D3 2.000 UI — Uso contínuo 1x/dia',
    'sig_ed25519_novatlantis_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    'WAITING_DOCTOR',
    '2026-10-01T09:30:00Z'
  );

  const insExam = db.prepare('INSERT INTO ops_school_exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insExam.run(
    'EXAM-2026-01',
    'SCH-NV-002',
    'Colégio Soberano Alan Turing (Fundamental & Médio)',
    'NID-000-0000-0006-0',
    'Prof. Lucas Albuquerque Silva',
    'AI & Robotics',
    '6º Ano Fundamental',
    'Avaliação Nacional de Pensamento Computacional & Ética em IA',
    9.2,
    '2026-09-29T10:00:00Z'
  );
  insExam.run(
    'EXAM-2026-02',
    'SCH-NV-001',
    'Escola Básica Libertas Central',
    'NID-000-0000-0007-8',
    'Profa. Valeria Ríos Hernández',
    'Sciences',
    '6º Ano Fundamental',
    'Prova Diagnóstica de Ciências da Natureza & Sustentabilidade Oceânica',
    8.8,
    '2026-09-30T14:00:00Z'
  );

  const insComp = db.prepare('INSERT INTO ops_companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insComp.run(
    'CORP-NV-0001',
    'NID-000-0000-0001-9',
    'Jopoco (Primeiro-Ministro da República)',
    'Fundação Soberana de Computação Pública de Novatlantis',
    'Infraestrutura Pública Digital & IA Soberana',
    'ISENTO_ESTATAL_SOBERANO',
    5000,
    'ACTIVE',
    '2026-01-01T00:00:00Z'
  );

  const insAudit = db.prepare(`
    INSERT INTO ops_audit_log (actor_nid, actor_name, action_type, target_nid, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insAudit.run(
    'NID-000-0000-0001-9',
    'Jopoco (Primeiro-Ministro da República)',
    'DELEGATE_IDENTITY_MANAGER_360',
    'NID-000-0000-0003-5',
    'Outorga constitucional de Gestora de Identidades do Governo (IDENTITY_MANAGER_360) para Helena Viana Oliveira.',
    '2026-01-01T00:05:00Z'
  );
  insAudit.run(
    'NID-000-0000-0003-5',
    'Helena Viana Oliveira (Gestora de Identidades 360)',
    'GRANT_BACKSTAGE_ROLE',
    'NID-000-0000-0004-3',
    'Concessão de perfil DOCTOR_AND_HEALTH_MANAGER mediante validação de credencial médica CRM-NV 1042.',
    '2026-01-02T09:00:00Z'
  );
  insAudit.run(
    'NID-000-0000-0003-5',
    'Helena Viana Oliveira (Gestora de Identidades 360)',
    'GRANT_BACKSTAGE_ROLE',
    'NID-000-0000-0006-0',
    'Concessão de perfil TEACHER_AND_EDU_MANAGER mediante validação de licenciatura docente LIC-NV 3011.',
    '2026-01-02T09:10:00Z'
  );
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

  const iamRole = db.prepare(`
    SELECT * FROM iam_identity_360_roles WHERE citizen_id = ? LIMIT 1
  `).get(nid);

  // Regra estrita da Identidade 360: se is_active = 0 ou não existir, reverte para CITIZEN_COMMON
  let effectiveRoleCode = 'CITIZEN_COMMON';
  if (iamRole && Number(iamRole.is_active) === 1 && ROLE_METADATA[iamRole.role_code]) {
    effectiveRoleCode = iamRole.role_code;
  }

  const roleMeta = ROLE_METADATA[effectiveRoleCode] || ROLE_METADATA.CITIZEN_COMMON;

  // Biometria determinística NIST + Ed25519
  const hashHex = crypto.createHash('sha256').update(`NIST-${nid}`).digest('hex');
  const biometrics = {
    citizen_id: nid,
    biometric_confidence_score: 0.994,
    ed25519_public_key: `ed25519_pk_nv_${hashHex.slice(0, 40)}`,
    nist_face_preview: `FMR20_ISO19794_5_${Buffer.from(hashHex).toString('base64').slice(0, 48)}...`,
    nist_fingerprint_minutiae: [
      { x: 142, y: 218, theta: 45, quality: 98 },
      { x: 188, y: 164, theta: 112, quality: 96 }
    ]
  };

  const residence = {
    address_id: row.address_id,
    street: `Av. Soberana Quadra ${row.address_id.slice(-3)}`,
    number: String(( parseInt(row.address_id.slice(-3), 10) || 10 ) * 4),
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
    SELECT e.*, i.name AS institution_name, i.district AS institution_district, i.director_name
    FROM edu_enrollments e
    LEFT JOIN edu_institutions i ON e.school_id = i.institution_id
    WHERE e.student_nid = ?
  `).get(nid);
  const passportRow = db.prepare(`SELECT * FROM sec_passports WHERE nid = ?`).get(nid);
  const justiceRow = db.prepare(`SELECT * FROM justice_records WHERE citizen_nid = ?`).get(nid);

  const hospitalIdx = (parseInt(nid.slice(-3, -2), 10) % 5) + 1;

  return {
    ...row,
    phone: `+550 98100-${nid.slice(-6, -2)}`,
    ubi_monthly_credits: row.age >= 18 ? 1250.0 : 450.0,
    effective_role_code: effectiveRoleCode,
    role_title: roleMeta.title,
    ministry_label: roleMeta.ministry,
    backstage_allowed: roleMeta.backstage_allowed,
    allowed_modules: roleMeta.modules,
    iam_360_record: iamRole || null,
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
          emergency_contact_nid: familyLinks[0]?.relative_nid || 'NID-000-0000-0001-9',
          vaccination_status: healthRow.vaccination_status
        }
      : null,
    education: enrollmentRow
      ? {
          ...enrollmentRow,
          citizen_id: enrollmentRow.student_nid,
          institution_id: enrollmentRow.school_id,
          performance_index: Number(
            (
              ((enrollmentRow.score_mathematics +
                enrollmentRow.score_sciences +
                enrollmentRow.score_ai_robotics +
                enrollmentRow.score_languages) /
                4) *
              10
            ).toFixed(1)
          )
        }
      : null,
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
              : 'CLEAR',
          security_clearance_level: effectiveRoleCode !== 'CITIZEN_COMMON' ? 'LEVEL_5_SOVEREIGN' : 'LEVEL_1_CIVIC'
        }
      : null
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

    if (pathname === '/api/health') {
      const totalCitizens = db.prepare('SELECT COUNT(*) AS cnt FROM dim_citizens').get().cnt;
      const activeRoles = db.prepare('SELECT COUNT(*) AS cnt FROM iam_identity_360_roles WHERE is_active = 1').get().cnt;
      return sendJson(res, 200, {
        status: 'ok',
        service: 'novatlantis-sovereign-portal-gdf',
        project_id: 'novatlantis',
        citizens_total: totalCitizens,
        active_backstage_roles: activeRoles,
        lakehouse: {
          gcs_bucket: 'gs://novatlantis-gdf-lakehouse',
          bigquery_datasets: ['novatlantis:gdf_bronze', 'novatlantis:gdf_silver', 'novatlantis:gdf_gold']
        }
      });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const profile = getFullCitizenProfile(body.identifier || 'NID-000-0000-0001-9');
      if (!profile) {
        return sendJson(res, 404, {
          error: 'Cidadão não encontrado na base GDF de 100.000 registros. Verifique o NID ou e-mail.'
        });
      }
      return sendJson(res, 200, { citizen: profile });
    }

    if (pathname.startsWith('/api/gdf/citizen/') && req.method === 'GET') {
      const nid = decodeURIComponent(pathname.replace('/api/gdf/citizen/', ''));
      const profile = getFullCitizenProfile(nid);
      if (!profile) return sendJson(res, 404, { error: 'NID não localizado.' });
      return sendJson(res, 200, { citizen: profile });
    }

    if (pathname === '/api/gdf/search' && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim();
      const credential = (url.searchParams.get('credential') || '').trim();
      const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);

      let sql = `
        SELECT c.nid AS citizen_id, c.full_name, c.birth_date, c.age, c.gender, c.native_language,
               c.email, c.iam_role AS role_code, c.profession AS professional_credential,
               c.specialty AS profession_label, c.tax_status, c.district,
               r.role_code AS iam_role_code, r.is_active AS iam_is_active,
               h.blood_type
        FROM dim_citizens c
        LEFT JOIN iam_identity_360_roles r ON c.nid = r.citizen_id
        LEFT JOIN health_records h ON c.nid = h.patient_nid
        WHERE 1=1
      `;
      const params = [];
      if (q) {
        sql += ` AND (c.nid LIKE ? OR c.full_name LIKE ? OR c.email LIKE ? OR c.specialty LIKE ?)`;
        const like = `%${q}%`;
        params.push(like, like, like, like);
      }
      if (credential) {
        sql += ` AND c.profession = ?`;
        params.push(credential);
      }
      sql += ` ORDER BY c.nid ASC LIMIT ?`;
      params.push(limit);

      const rows = db.prepare(sql).all(...params);
      return sendJson(res, 200, { results: rows, count: rows.length });
    }

    if (pathname === '/api/iam360/roles' && req.method === 'GET') {
      const assignedRoles = db.prepare(`
        SELECT r.*, c.full_name, c.email, c.profession AS professional_credential,
               c.specialty AS profession_label, c.age
        FROM iam_identity_360_roles r
        JOIN dim_citizens c ON r.citizen_id = c.nid
        ORDER BY r.is_active DESC, r.citizen_id ASC
      `).all();

      const credentialStats = db.prepare(`
        SELECT profession AS professional_credential, COUNT(*) AS total
        FROM dim_citizens
        GROUP BY profession
        ORDER BY total DESC
      `).all();

      return sendJson(res, 200, {
        assigned_roles: assignedRoles,
        credential_stats: credentialStats,
        role_catalog: ROLE_METADATA
      });
    }

    if (pathname === '/api/iam360/grant' && req.method === 'POST') {
      const body = await readBody(req);
      const { actor_nid, target_nid, role_code, ministry } = body;
      const actor = getFullCitizenProfile(actor_nid);
      if (!actor || !['PRIME_MINISTER_ROOT', 'SECRETARY_GENERAL', 'IDENTITY_MANAGER_360'].includes(actor.effective_role_code)) {
        return sendJson(res, 403, {
          error: 'Acesso negado: Apenas o Primeiro-Ministro, o Secretário-Geral ou o Gestor de Identidades 360 podem conceder acessos administrativos.'
        });
      }
      if (
        ['IDENTITY_MANAGER_360', 'SECRETARY_GENERAL', 'PRIME_MINISTER_ROOT'].includes(role_code) &&
        !['PRIME_MINISTER_ROOT', 'SECRETARY_GENERAL'].includes(actor.effective_role_code)
      ) {
        return sendJson(res, 403, {
          error: 'Restrição Constitucional: Apenas o Primeiro-Ministro (ou Secretário-Geral) pode nomear o Gestor de Identidades 360.'
        });
      }

      const target = db.prepare('SELECT * FROM dim_citizens WHERE nid = ?').get(target_nid);
      if (!target) {
        return sendJson(res, 404, { error: 'Cidadão alvo não encontrado no GDF.' });
      }

      const meta = ROLE_METADATA[role_code] || ROLE_METADATA.CITIZEN_COMMON;
      const now = new Date().toISOString();
      const existing = db.prepare('SELECT * FROM iam_identity_360_roles WHERE citizen_id = ?').get(target_nid);

      if (existing) {
        db.prepare(`
          UPDATE iam_identity_360_roles
          SET role_code = ?, ministry = ?, scopes = ?, granted_by_nid = ?, granted_at = ?, revoked_at = NULL, is_active = 1
          WHERE citizen_id = ?
        `).run(role_code, ministry || meta.ministry, JSON.stringify(meta.modules), actor.citizen_id, now, target_nid);
      } else {
        db.prepare(`
          INSERT INTO iam_identity_360_roles (
            grant_id, citizen_id, role_code, ministry, scopes, granted_by_nid, granted_at, revoked_at, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1)
        `).run(
          `IAM-${Date.now().toString().slice(-6)}`,
          target_nid,
          role_code,
          ministry || meta.ministry,
          JSON.stringify(meta.modules),
          actor.citizen_id,
          now
        );
      }

      db.prepare('UPDATE dim_citizens SET iam_role = ? WHERE nid = ?').run(role_code, target_nid);
      db.prepare(`
        INSERT INTO ops_audit_log (actor_nid, actor_name, action_type, target_nid, details, created_at)
        VALUES (?, ?, 'GRANT_BACKSTAGE_ROLE', ?, ?, ?)
      `).run(
        actor.citizen_id,
        actor.full_name,
        target_nid,
        `Concedido acesso administrativo [${role_code}] (${meta.title}) para ${target.full_name} (Profissão: ${target.profession}).`,
        now
      );

      return sendJson(res, 200, {
        message: `Permissão administrativa ${role_code} concedida com sucesso para ${target.full_name}.`,
        updated_citizen: getFullCitizenProfile(target_nid)
      });
    }

    if (pathname === '/api/iam360/revoke' && req.method === 'POST') {
      const body = await readBody(req);
      const { actor_nid, target_nid } = body;
      const actor = getFullCitizenProfile(actor_nid);
      if (!actor || !['PRIME_MINISTER_ROOT', 'SECRETARY_GENERAL', 'IDENTITY_MANAGER_360'].includes(actor.effective_role_code)) {
        return sendJson(res, 403, {
          error: 'Acesso negado: Apenas o Primeiro-Ministro, Secretário-Geral ou Gestor de Identidades 360 podem revogar permissões.'
        });
      }
      if (target_nid === 'NID-000-0000-0001-9') {
        return sendJson(res, 400, {
          error: 'Inviolabilidade Constitucional: A credencial Root do Primeiro-Ministro não pode ser revogada.'
        });
      }

      const target = db.prepare('SELECT * FROM dim_citizens WHERE nid = ?').get(target_nid);
      if (!target) return sendJson(res, 404, { error: 'Cidadão não encontrado.' });

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE iam_identity_360_roles SET is_active = 0, revoked_at = ? WHERE citizen_id = ?
      `).run(now, target_nid);

      db.prepare(`UPDATE dim_citizens SET iam_role = 'CITIZEN_COMMON' WHERE nid = ?`).run(target_nid);

      db.prepare(`
        INSERT INTO ops_audit_log (actor_nid, actor_name, action_type, target_nid, details, created_at)
        VALUES (?, ?, 'REVOKE_BACKSTAGE_ROLE', ?, ?, ?)
      `).run(
        actor.citizen_id,
        actor.full_name,
        target_nid,
        `Permissão administrativa revogada na Identidade 360. ${target.full_name} voltou ao perfil de Cidadão Comum (CITIZEN_COMMON) sem acesso ao Backstage.`,
        now
      );

      return sendJson(res, 200, {
        message: `Permissão revogada! ${target.full_name} voltou a ser Cidadão Comum e perdeu imediatamente o acesso ao Backstage.`,
        updated_citizen: getFullCitizenProfile(target_nid)
      });
    }

    if (pathname === '/api/backstage/overview' && req.method === 'GET') {
      const counts = {
        dim_citizens: db.prepare('SELECT COUNT(*) AS c FROM dim_citizens').get().c,
        sec_biometrics_nist: 100000,
        rel_family_graph: db.prepare('SELECT COUNT(*) AS c FROM rel_family_graph').get().c,
        dim_addresses: 50000,
        health_records: db.prepare('SELECT COUNT(*) AS c FROM health_records').get().c,
        health_vaccinations: 18326,
        edu_enrollments: db.prepare('SELECT COUNT(*) AS c FROM edu_enrollments').get().c,
        sec_passports: db.prepare('SELECT COUNT(*) AS c FROM sec_passports').get().c,
        justice_records: db.prepare('SELECT COUNT(*) AS c FROM justice_records').get().c,
        iam_active_roles: db.prepare('SELECT COUNT(*) AS c FROM iam_identity_360_roles WHERE is_active = 1').get().c
      };

      const districtBreakdown = db.prepare(`
        SELECT district, COUNT(*) AS total_addresses
        FROM dim_citizens
        GROUP BY district
        ORDER BY total_addresses DESC
      `).all();

      const languageBreakdown = db.prepare(`
        SELECT native_language, COUNT(*) AS total
        FROM dim_citizens
        GROUP BY native_language
      `).all();

      const crossingBorder = db.prepare(`
        SELECT c.nid AS citizen_id, c.full_name, c.tax_status,
               p.passport_number, p.passport_status,
               CASE WHEN j.active_warrants > 0 THEN 'WARRANT_ACTIVE'
                    WHEN j.has_criminal_record > 0 THEN 'UNDER_REVIEW'
                    ELSE 'CLEAR' END AS background_check_status,
               CASE
                 WHEN j.active_warrants > 0 OR j.restricted_travel > 0 OR c.tax_status = 'SUSPENDED' THEN 'DENIED_BORDER_HOLD'
                 WHEN c.tax_status = 'IRREGULAR' THEN 'MANUAL_TREASURY_REVIEW'
                 ELSE 'CLEARED_AUTONOMOUS_EGATE'
               END AS border_decision
        FROM dim_citizens c
        JOIN sec_passports p ON c.nid = p.nid
        JOIN justice_records j ON c.nid = j.citizen_nid
        WHERE j.has_criminal_record > 0 OR c.tax_status != 'COMPLIANT' OR c.nid IN ('NID-000-0000-0001-9', 'NID-000-0000-0004-3', 'NID-000-0000-0006-0')
        ORDER BY j.active_warrants DESC, c.nid ASC
        LIMIT 15
      `).all();

      const crossingTruancy = db.prepare(`
        SELECT e.enrollment_id, e.student_nid, s.full_name AS student_name, s.age AS student_age,
               e.school_id AS institution_id, e.grade_level, e.attendance_rate,
               fg.source_nid AS parent_nid, p.full_name AS parent_name, p.email AS parent_email,
               '+550 98100-' || substr(p.nid, -6, 4) AS parent_phone
        FROM edu_enrollments e
        JOIN dim_citizens s ON e.student_nid = s.nid
        JOIN rel_family_graph fg ON fg.target_nid = e.student_nid AND fg.relation_type = 'BIOLOGICAL_PARENT'
        JOIN dim_citizens p ON fg.source_nid = p.nid
        WHERE e.attendance_rate < 78.0 OR e.student_nid IN ('NID-000-0000-0010-8', 'NID-000-0000-0011-6')
        ORDER BY CASE WHEN e.student_nid IN ('NID-000-0000-0010-8', 'NID-000-0000-0011-6') THEN 0 ELSE 1 END, e.attendance_rate ASC
        LIMIT 15
      `).all();

      const crossingEmergency = db.prepare(`
        SELECT c.nid AS citizen_id, c.full_name, c.age,
               h.blood_type, h.allergies, h.chronic_conditions,
               'HOSP-NV-01' AS assigned_hospital_id,
               fg.source_nid AS emergency_contact_nid,
               ec.full_name AS emergency_contact_name,
               '+550 98100-' || substr(ec.nid, -6, 4) AS emergency_contact_phone
        FROM dim_citizens c
        JOIN health_records h ON c.nid = h.patient_nid
        LEFT JOIN rel_family_graph fg ON fg.target_nid = c.nid
        LEFT JOIN dim_citizens ec ON fg.source_nid = ec.nid
        WHERE c.nid IN ('NID-000-0000-0010-8', 'NID-000-0000-0001-9', 'NID-000-0000-0004-3', 'NID-000-0000-0006-0')
        LIMIT 15
      `).all();

      const auditLogs = db.prepare('SELECT * FROM ops_audit_log ORDER BY audit_id DESC LIMIT 20').all();

      return sendJson(res, 200, {
        counts,
        district_breakdown: districtBreakdown,
        language_breakdown: languageBreakdown,
        crossings: {
          border_passport_clearance: crossingBorder,
          school_truancy_family_alerts: crossingTruancy,
          emergency_911_medical_dispatch: crossingEmergency
        },
        audit_logs: auditLogs
      });
    }

    if (pathname === '/api/backstage/education' && req.method === 'GET') {
      const institutions = db.prepare(`
        SELECT i.*,
               (SELECT COUNT(*) FROM edu_enrollments e WHERE e.school_id = i.institution_id) AS enrolled_students,
               (SELECT ROUND(AVG((score_mathematics + score_sciences + score_ai_robotics + score_languages)/4.0), 1) FROM edu_enrollments e WHERE e.school_id = i.institution_id) AS avg_performance,
               (SELECT ROUND(AVG(attendance_rate), 1) FROM edu_enrollments e WHERE e.school_id = i.institution_id) AS avg_attendance
        FROM edu_institutions i
      `).all();

      const teachers = db.prepare(`
        SELECT c.nid AS citizen_id, c.full_name, c.email, c.iam_role AS role_code, c.specialty AS profession_label
        FROM dim_citizens c
        WHERE c.profession = 'TEACHER'
        ORDER BY c.nid ASC
        LIMIT 25
      `).all();

      const students = db.prepare(`
        SELECT e.enrollment_id, e.student_nid AS citizen_id, e.school_id AS institution_id, e.grade_level,
               e.attendance_rate, e.score_mathematics, e.score_sciences, e.score_ai_robotics, e.score_languages,
               s.full_name AS student_name, s.age AS student_age, s.email AS student_email,
               i.name AS institution_name,
               fg.source_nid AS parent_nid, p.full_name AS parent_name
        FROM edu_enrollments e
        JOIN dim_citizens s ON e.student_nid = s.nid
        LEFT JOIN edu_institutions i ON e.school_id = i.institution_id
        LEFT JOIN rel_family_graph fg ON fg.target_nid = e.student_nid AND fg.relation_type = 'BIOLOGICAL_PARENT'
        LEFT JOIN dim_citizens p ON fg.source_nid = p.nid
        ORDER BY CASE WHEN e.student_nid IN ('NID-000-0000-0010-8', 'NID-000-0000-0011-6') THEN 0 ELSE 1 END, e.enrollment_id ASC
        LIMIT 30
      `).all();

      const exams = db.prepare('SELECT * FROM ops_school_exams ORDER BY applied_at DESC').all();

      return sendJson(res, 200, { institutions, teachers, students, exams });
    }

    if (pathname === '/api/backstage/education/grade' && req.method === 'POST') {
      const body = await readBody(req);
      const {
        teacher_nid,
        student_nid,
        score_mathematics,
        score_sciences,
        score_ai_robotics,
        score_languages,
        attendance_rate
      } = body;

      const math = Number(score_mathematics);
      const sci = Number(score_sciences);
      const ai = Number(score_ai_robotics);
      const lang = Number(score_languages);
      const att = Number(attendance_rate);
      const perf = Number(((math + sci + ai + lang) / 4).toFixed(1));

      db.prepare(`
        UPDATE edu_enrollments
        SET score_mathematics = ?, score_sciences = ?, score_ai_robotics = ?, score_languages = ?,
            attendance_rate = ?
        WHERE student_nid = ?
      `).run(math, sci, ai, lang, att, student_nid);

      db.prepare(`
        INSERT INTO ops_audit_log (actor_nid, actor_name, action_type, target_nid, details, created_at)
        VALUES (?, ?, 'UPDATE_STUDENT_GRADES', ?, ?, ?)
      `).run(
        teacher_nid || 'NID-000-0000-0006-0',
        'Docente / Gestor Educacional',
        student_nid,
        `Notas atualizadas: Mat=${math}, Ciên=${sci}, IA&Rob=${ai}, Líng=${lang} | Média=${perf} | Freq=${att}%`,
        new Date().toISOString()
      );

      return sendJson(res, 200, {
        message: 'Boletim e indicadores de desempenho atualizados no GDF.',
        performance_index: perf,
        ai_tutor_Needs_attention: att < 75.0
      });
    }

    if (pathname === '/api/backstage/education/exam' && req.method === 'POST') {
      const body = await readBody(req);
      const { institution_id, teacher_nid, teacher_name, subject, grade_level, title } = body;
      const inst = db.prepare('SELECT name FROM edu_institutions WHERE institution_id = ?').get(institution_id || 'SCH-NV-002');
      const examId = `EXAM-2026-${Math.floor(100 + Math.random() * 900)}`;
      const avg = Number((8.2 + Math.random() * 1.4).toFixed(1));
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ops_school_exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        examId,
        institution_id || 'SCH-NV-002',
        inst ? inst.name : 'Colégio Soberano Alan Turing',
        teacher_nid || 'NID-000-0000-0006-0',
        teacher_name || 'Prof. Lucas Albuquerque Silva',
        subject || 'AI & Robotics',
        grade_level || '6º Ano Fundamental',
        title || 'Avaliação Unificada Assistida por IA',
        avg,
        now
      );

      return sendJson(res, 200, { message: `Prova ${examId} aplicada e corrigida pelo motor agêntico.`, exam_id: examId });
    }

    if (pathname === '/api/backstage/health' && req.method === 'GET') {
      const hospitals = [
        { hospital_id: 'HOSP-NV-01', name: 'Hospital Universitário Soberano de Novatlantis', district: 'Distrito Tecnológico', beds_total: 420, icu_occupancy_pct: 64, linked_citizens: 24500 },
        { hospital_id: 'HOSP-NV-02', name: 'Centro Médico Oceânico & Telemedicina', district: 'Distrito Oceânico', beds_total: 280, icu_occupancy_pct: 58, linked_citizens: 21200 },
        { hospital_id: 'HOSP-NV-03', name: 'Instituto Cardiopulmonar Colina da Justiça', district: 'Colina da Justiça', beds_total: 190, icu_occupancy_pct: 71, linked_citizens: 18400 },
        { hospital_id: 'HOSP-NV-04', name: 'Hospital Geral Porto Solar', district: 'Porto Solar', beds_total: 310, icu_occupancy_pct: 62, linked_citizens: 19800 },
        { hospital_id: 'HOSP-NV-05', name: 'Clínica Policlínica Vale das Águas', district: 'Vale das Águas', beds_total: 150, icu_occupancy_pct: 49, linked_citizens: 16100 }
      ];

      const doctors = db.prepare(`
        SELECT c.nid AS citizen_id, c.full_name, c.email, c.iam_role AS role_code, c.specialty AS profession_label,
               (SELECT COUNT(*) FROM health_records h WHERE h.assigned_primary_care_physician_nid = c.nid) AS assigned_patients
        FROM dim_citizens c
        WHERE c.profession = 'PHYSICIAN'
        ORDER BY c.nid ASC
        LIMIT 25
      `).all();

      const telemedSessions = db.prepare('SELECT * FROM ops_telemed_sessions ORDER BY created_at DESC').all();

      return sendJson(res, 200, { hospitals, doctors, telemed_sessions: telemedSessions });
    }

    if (pathname === '/api/backstage/health/telemed' && req.method === 'POST') {
      const body = await readBody(req);
      const { patient_nid, doctor_nid, hospital_id, chief_complaint, ai_soap_notes, prescription_medication } = body;
      const patient = getFullCitizenProfile(patient_nid || 'NID-000-0000-0010-8');
      const doctor = getFullCitizenProfile(doctor_nid || 'NID-000-0000-0004-3');
      const sessionId = `TMED-2026-${Math.floor(200 + Math.random() * 799)}`;
      const sig = `sig_ed25519_novatlantis_${Date.now().toString(16)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ops_telemed_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED_SIGNED', ?)
      `).run(
        sessionId,
        patient ? patient.citizen_id : 'NID-000-0000-0010-8',
        patient ? patient.full_name : 'Cidadão Novatlantis',
        doctor ? doctor.citizen_id : 'NID-000-0000-0004-3',
        doctor ? doctor.full_name : 'Dra. Sofia Mendes Costa',
        hospital_id || 'HOSP-NV-01',
        chief_complaint || 'Teleconsulta Clínica Integrada ao Prontuário HL7',
        ai_soap_notes || 'S: Relato clínico validado. O: Sinais vitais estáveis. A: Conduta terapêutica definida. P: Prescrição digital assinada em Ed25519.',
        prescription_medication || 'Dipirona Sódica 500mg — 1 cp se dor ou febre',
        sig,
        now
      );

      return sendJson(res, 200, {
        message: `Teleconsulta ${sessionId} registrada e prescrição assinada com chave Ed25519.`,
        session_id: sessionId,
        ed25519_signature: sig
      });
    }

    if (pathname === '/api/backstage/operations' && req.method === 'GET') {
      const tickets311 = db.prepare('SELECT * FROM ops_311_tickets ORDER BY created_at DESC').all();
      const dispatches911 = db.prepare('SELECT * FROM ops_911_dispatches ORDER BY created_at DESC').all();
      return sendJson(res, 200, { tickets_311: tickets311, dispatches_911: dispatches911 });
    }

    if (pathname === '/api/services/311' && req.method === 'POST') {
      const body = await readBody(req);
      const { citizen_id, category, district, description } = body;
      const citizen = getFullCitizenProfile(citizen_id || 'NID-000-0000-0001-9');
      const ticketId = `311-NV-2026-${Math.floor(100 + Math.random() * 899)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ops_311_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NULL, NULL, ?)
      `).run(
        ticketId,
        citizen ? citizen.citizen_id : 'NID-000-0000-0001-9',
        citizen ? citizen.full_name : 'Cidadão Novatlantis',
        category || 'Zeladoria Urbana & Smart Grid',
        district || 'Distrito Tecnológico',
        description || 'Demanda de manutenção urbana reportada via Portal Cívico.',
        `IA 311: Classificação automática concluída. Ordem de serviço gerada para ${district || 'Distrito Tecnológico'}.`,
        'Secretaria de Zeladoria Urbana & IoT',
        8,
        now
      );

      return sendJson(res, 200, { message: `Chamado ${ticketId} registrado e encaminhado ao Backstage 311.`, ticket_id: ticketId });
    }

    if (pathname === '/api/services/311/resolve' && req.method === 'POST') {
      const body = await readBody(req);
      const { ticket_id, resolver_nid, resolution_notes } = body;
      db.prepare(`
        UPDATE ops_311_tickets
        SET status = 'RESOLVED', resolved_by_nid = ?, resolution_notes = ?
        WHERE ticket_id = ?
      `).run(
        resolver_nid || 'NID-000-0000-0008-6',
        resolution_notes || 'Demanda atendida pela equipe de campo e validada via telemetria.',
        ticket_id
      );
      return sendJson(res, 200, { message: `Chamado ${ticket_id} concluído pelo servidor público.` });
    }

    if (pathname === '/api/services/911' && req.method === 'POST') {
      const body = await readBody(req);
      const { citizen_id, emergency_type, location_district } = body;
      const profile = getFullCitizenProfile(citizen_id || 'NID-000-0000-0010-8');
      const dispatchId = `911-NV-2026-${Math.floor(910 + Math.random() * 89)}`;
      const now = new Date().toISOString();

      const ecLink = profile?.family_links?.[0];

      db.prepare(`
        INSERT INTO ops_911_dispatches VALUES (?, ?, ?, ?, 'P1_CRITICAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 'DISPATCHED_EN_ROUTE', ?)
      `).run(
        dispatchId,
        profile ? profile.citizen_id : 'NID-000-0000-0010-8',
        profile ? profile.full_name : 'Cidadão Novatlantis',
        emergency_type || 'Emergência Médica / Resgate Urbano',
        location_district || profile?.residence?.district || 'Distrito Tecnológico',
        profile?.health?.blood_type || 'O+',
        JSON.stringify(profile?.health?.allergies || []),
        JSON.stringify(profile?.health?.chronic_conditions || []),
        profile?.health?.assigned_hospital_id || 'HOSP-NV-01',
        ecLink?.relative_nid || 'NID-000-0000-0001-9',
        ecLink?.relative_name || 'Familiar Responsável',
        ecLink?.relative_phone || '+550 98100-0001',
        'Unidade de Resgate Autônoma 911 + Alerta Hospitalar HL7',
        now
      );

      return sendJson(res, 200, {
        message: `Despacho 911 (${dispatchId}) acionado com cruzamento GDF: Prontuário HL7 enviado ao hospital e contato familiar notificado!`,
        dispatch_id: dispatchId
      });
    }

    if (pathname === '/api/backstage/justice-treasury' && req.method === 'GET') {
      const companies = db.prepare('SELECT * FROM ops_companies ORDER BY created_at DESC').all();
      const taxSummary = db.prepare(`
        SELECT tax_status, COUNT(*) AS total
        FROM dim_citizens
        GROUP BY tax_status
      `).all();
      const justiceSummary = [
        { background_check_status: 'CLEAR', total: db.prepare('SELECT COUNT(*) AS c FROM justice_records WHERE has_criminal_record = 0').get().c },
        { background_check_status: 'UNDER_REVIEW', total: db.prepare('SELECT COUNT(*) AS c FROM justice_records WHERE has_criminal_record > 0 AND active_warrants = 0').get().c },
        { background_check_status: 'WARRANT_ACTIVE', total: db.prepare('SELECT COUNT(*) AS c FROM justice_records WHERE active_warrants > 0').get().c }
      ];
      return sendJson(res, 200, { companies, tax_summary: taxSummary, justice_summary: justiceSummary });
    }

    if (pathname === '/api/services/company' && req.method === 'POST') {
      const body = await readBody(req);
      const { owner_nid, company_name, sector } = body;
      const owner = getFullCitizenProfile(owner_nid || 'NID-000-0000-0001-9');
      if (owner && owner.tax_status === 'SUSPENDED') {
        return sendJson(res, 400, { error: 'Suspensão Fiscal no GDF impede abertura automática de empresa.' });
      }
      const compId = `CORP-NV-${Math.floor(1000 + Math.random() * 8999)}`;
      db.prepare(`
        INSERT INTO ops_companies VALUES (?, ?, ?, ?, ?, 'SIMPLES_AGENTICO_3PCT', 250, 'ACTIVE', ?)
      `).run(
        compId,
        owner ? owner.citizen_id : 'NID-000-0000-0001-9',
        owner ? owner.full_name : 'Cidadão Empreendedor',
        company_name || 'Nova Tech Agentic Systems Ltd.',
        sector || 'Robótica & Serviços Cognitivos',
        new Date().toISOString()
      );
      return sendJson(res, 200, {
        message: `Empresa ${compId} aberta em 45s com CNPJ Soberano e cota de 250 TFLOPs!`,
        company_id: compId
      });
    }

    if (pathname === '/api/services/passport' && req.method === 'POST') {
      const body = await readBody(req);
      const { citizen_id } = body;
      const profile = getFullCitizenProfile(citizen_id);
      if (!profile) return sendJson(res, 404, { error: 'Cidadão não encontrado.' });

      if (profile.justice?.background_check_status === 'WARRANT_ACTIVE' || profile.tax_status === 'SUSPENDED') {
        return sendJson(res, 403, {
          decision: 'DENIED_BORDER_HOLD',
          error: `Emissão bloqueada pelo Cruzamento GDF #1 (Justiça: ${profile.justice?.background_check_status}, Fiscal: ${profile.tax_status}).`
        });
      }

      const passNum = `NV-P${Math.floor(1000000 + Math.random() * 8999999)}`;
      const existing = db.prepare('SELECT * FROM sec_passports WHERE nid = ?').get(profile.citizen_id);
      if (existing) {
        db.prepare(`UPDATE sec_passports SET passport_status = 'ACTIVE', expiry_date = '2036-10-01' WHERE nid = ?`).run(profile.citizen_id);
      } else {
        db.prepare(`
          INSERT INTO sec_passports VALUES (?, ?, '2026-10-01', '2036-10-01', 'P<NVT', 'NVT2036', 'ACTIVE')
        `).run(passNum, profile.citizen_id);
      }

      return sendJson(res, 200, {
        decision: 'CLEARED_AUTONOMOUS_EGATE',
        message: `Passaporte Digital ICAO validado sem restrições judiciais ou fiscais para ${profile.full_name}.`
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
    console.error('[Server Error]', err);
    sendJson(res, 500, { error: err.message || 'Erro interno no servidor GDF.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Novatlantis Sovereign Server] Escutando na porta ${PORT}`);
});
