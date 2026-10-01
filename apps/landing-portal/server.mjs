import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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

// Inicializa tabelas operacionais transacionais (Backstage + Cidadão)
db.exec(`
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

// Seed inicial idempotente para tabelas operacionais
const ticketCount = db.prepare('SELECT COUNT(*) AS cnt FROM ops_311_tickets').get().cnt;
if (ticketCount === 0) {
  const ins311 = db.prepare(`
    INSERT INTO ops_311_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  ins311.run(
    '311-NV-2026-001',
    'NID-000-0000-0006-0',
    'Prof. Lucas Albuquerque Silva',
    'Iluminação Fotovoltaica & Smart Grid',
    'Colina da Justiça',
    'Luminária pública autônoma com falha de telemetria em frente ao Liceu Politécnico.',
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

  const ins911 = db.prepare(`
    INSERT INTO ops_911_dispatches VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  ins911.run(
    '911-NV-2026-901',
    'NID-000-0000-0010-2',
    'Pedro Albuquerque Costa',
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

  const insTelemed = db.prepare(`
    INSERT INTO ops_telemed_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insTelemed.run(
    'TMED-2026-101',
    'NID-000-0000-0010-2',
    'Pedro Albuquerque Costa',
    'NID-000-0000-0004-3',
    'Dra. Sofia Mendes Costa',
    'HOSP-NV-01',
    'Acompanhamento respiratório sazonal e revisão de plano de ação escolar.',
    'S: Paciente 11 anos acompanhado pelo pai (NID-000-0000-0006-0). O: SpO2 99%, ausculta limpa. A: Asma controlada. P: Manter broncodilatador preventivo; alerta de alergia a Penicilina ativo no GDF.',
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

  const insExam = db.prepare(`
    INSERT INTO ops_school_exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insExam.run(
    'EXAM-2026-01',
    'SCH-NV-002',
    'Colégio Soberano Alan Turing (Ensino Fundamental)',
    'NID-000-0000-0006-0',
    'Prof. Lucas Albuquerque Silva',
    'AI & Robotics',
    'FUNDAMENTAL_II',
    'Avaliação Nacional de Pensamento Computacional & Ética em IA',
    91.4,
    '2026-09-29T10:00:00Z'
  );
  insExam.run(
    'EXAM-2026-02',
    'SCH-NV-002',
    'Colégio Soberano Alan Turing (Ensino Fundamental)',
    'NID-000-0000-0007-8',
    'Profa. Valeria Ríos Hernández',
    'Mathematics',
    'FUNDAMENTAL_II',
    'Prova Diagnóstica de Álgebra Linear Aplicada e Lógica',
    86.8,
    '2026-09-30T14:00:00Z'
  );

  const insComp = db.prepare(`
    INSERT INTO ops_companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insComp.run(
    'CORP-NV-0001',
    'NID-000-0000-0001-9',
    'Jopoco (Primeiro-Ministro)',
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
    'Jopoco — Primeiro-Ministro & Administrador Geral',
    'DELEGATE_IDENTITY_MANAGER_360',
    'NID-000-0000-0003-5',
    'Outorga constitucional de Gestor de Identidades do Governo (IDENTITY_MANAGER_360) para Helena Albuquerque.',
    '2026-01-01T00:05:00Z'
  );
  insAudit.run(
    'NID-000-0000-0003-5',
    'Helena Albuquerque — Gestora de Identidades 360',
    'GRANT_BACKSTAGE_ROLE',
    'NID-000-0000-0004-3',
    'Concessão de perfil DOCTOR_AND_HEALTH_MANAGER mediante validação de credencial médica CRM-NV.',
    '2026-01-02T09:00:00Z'
  );
  insAudit.run(
    'NID-000-0000-0003-5',
    'Helena Albuquerque — Gestora de Identidades 360',
    'GRANT_BACKSTAGE_ROLE',
    'NID-000-0000-0006-0',
    'Concessão de perfil TEACHER_AND_EDU_MANAGER mediante validação de licenciatura docente.',
    '2026-01-02T09:10:00Z'
  );
}

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

function getFullCitizenProfile(nidOrEmail) {
  let clean = String(nidOrEmail || '').trim();
  if (!clean) return null;
  if (clean.toLowerCase() === 'admin@jopoco.altostrat.com' || clean.toLowerCase() === 'jopoco') {
    clean = 'NID-000-0000-0001-9';
  }

  const citizen = db.prepare(`
    SELECT * FROM dim_citizens
    WHERE citizen_id = ? OR LOWER(email) = LOWER(?)
    LIMIT 1
  `).get(clean, clean);

  if (!citizen) return null;
  const nid = citizen.citizen_id;

  // Verifica permissão ativa na aplicação Identidade 360
  const iamRole = db.prepare(`
    SELECT * FROM iam_identity_360_roles WHERE citizen_id = ? LIMIT 1
  `).get(nid);

  // Regra estrita solicitada pelo usuário:
  // O acesso ao Backstage depende exclusivamente da permissão estar ativa na aplicação Identidade 360.
  // Se foi revogada (is_active = 0) ou não existe, o usuário volta a ser CITIZEN_COMMON sem acesso administrativo.
  let effectiveRoleCode = 'CITIZEN_COMMON';
  if (iamRole && Number(iamRole.is_active) === 1 && ROLE_METADATA[iamRole.role_code]) {
    effectiveRoleCode = iamRole.role_code;
  }

  const roleMeta = ROLE_METADATA[effectiveRoleCode] || ROLE_METADATA.CITIZEN_COMMON;

  const biometrics = db.prepare(`
    SELECT citizen_id, biometric_confidence_score, ed25519_public_key, last_verified_at,
           substr(nist_face_template, 1, 64) || '...' AS nist_face_preview,
           nist_fingerprint_minutiae
    FROM sec_biometrics_nist WHERE citizen_id = ?
  `).get(nid);

  const residence = db.prepare(`
    SELECT r.residence_type, r.start_date, a.*
    FROM rel_citizen_residence r
    JOIN dim_addresses a ON r.address_id = a.address_id
    WHERE r.citizen_id = ? AND r.is_current = 1
    LIMIT 1
  `).get(nid);

  const family = db.prepare(`
    SELECT fg.relation_id, fg.relationship_type, fg.verified_by_civil_registry,
           c.citizen_id AS relative_nid, c.full_name AS relative_name,
           c.age AS relative_age, c.profession_label AS relative_profession,
           c.email AS relative_email, c.phone AS relative_phone
    FROM rel_family_graph fg
    JOIN dim_citizens c ON fg.citizen_id_b = c.citizen_id
    WHERE fg.citizen_id_a = ?
  `).all(nid);

  // Também busca relações inversas caso seja filho listado em citizen_id_b
  const inverseFamily = db.prepare(`
    SELECT fg.relation_id,
           CASE WHEN fg.relationship_type = 'PARENT_OF' THEN 'CHILD_OF' ELSE fg.relationship_type END AS relationship_type,
           fg.verified_by_civil_registry,
           c.citizen_id AS relative_nid, c.full_name AS relative_name,
           c.age AS relative_age, c.profession_label AS relative_profession,
           c.email AS relative_email, c.phone AS relative_phone
    FROM rel_family_graph fg
    JOIN dim_citizens c ON fg.citizen_id_a = c.citizen_id
    WHERE fg.citizen_id_b = ? AND fg.relationship_type = 'PARENT_OF'
  `).all(nid);

  const health = db.prepare(`SELECT * FROM health_records WHERE citizen_id = ?`).get(nid);
  const vaccinations = db.prepare(`SELECT * FROM health_vaccinations WHERE citizen_id = ?`).all(nid);
  const enrollment = db.prepare(`
    SELECT e.*, i.name AS institution_name, i.district AS institution_district, i.director_name
    FROM edu_enrollments e
    LEFT JOIN edu_institutions i ON e.institution_id = i.institution_id
    WHERE e.citizen_id = ?
  `).get(nid);
  const passport = db.prepare(`SELECT * FROM sec_passports WHERE citizen_id = ?`).get(nid);
  const justice = db.prepare(`SELECT * FROM justice_records WHERE citizen_id = ?`).get(nid);

  return {
    ...citizen,
    effective_role_code: effectiveRoleCode,
    role_title: roleMeta.title,
    ministry_label: roleMeta.ministry,
    backstage_allowed: roleMeta.backstage_allowed,
    allowed_modules: roleMeta.modules,
    iam_360_record: iamRole || null,
    biometrics: biometrics ? {
      ...biometrics,
      nist_fingerprint_minutiae: JSON.parse(biometrics.nist_fingerprint_minutiae || '[]')
    } : null,
    residence: residence || null,
    family_links: [...family, ...inverseFamily],
    health: health ? {
      ...health,
      allergies: JSON.parse(health.allergies || '[]'),
      chronic_conditions: JSON.parse(health.chronic_conditions || '[]'),
      vaccinations
    } : null,
    education: enrollment || null,
    passport: passport ? {
      ...passport,
      visa_free_countries: JSON.parse(passport.visa_free_countries || '[]')
    } : null,
    justice: justice || null
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
      } catch (e) {
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

    // 1. Healthcheck
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

    // 2. Unified Citizen & Government Backstage Login
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

    // 3. Get Citizen 360 Profile by NID
    if (pathname.startsWith('/api/gdf/citizen/') && req.method === 'GET') {
      const nid = decodeURIComponent(pathname.replace('/api/gdf/citizen/', ''));
      const profile = getFullCitizenProfile(nid);
      if (!profile) return sendJson(res, 404, { error: 'NID não localizado.' });
      return sendJson(res, 200, { citizen: profile });
    }

    // 4. Search across the 100,000 Citizens in GDF
    if (pathname === '/api/gdf/search' && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim();
      const credential = (url.searchParams.get('credential') || '').trim();
      const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);

      let sql = `
        SELECT c.citizen_id, c.full_name, c.birth_date, c.age, c.gender, c.native_language,
               c.email, c.phone, c.role_code, c.professional_credential, c.profession_label,
               c.tax_status, c.ubi_monthly_credits,
               r.role_code AS iam_role_code, r.is_active AS iam_is_active,
               a.district, h.blood_type
        FROM dim_citizens c
        LEFT JOIN iam_identity_360_roles r ON c.citizen_id = r.citizen_id
        LEFT JOIN rel_citizen_residence cr ON c.citizen_id = cr.citizen_id AND cr.is_current = 1
        LEFT JOIN dim_addresses a ON cr.address_id = a.address_id
        LEFT JOIN health_records h ON c.citizen_id = h.citizen_id
        WHERE 1=1
      `;
      const params = [];
      if (q) {
        sql += ` AND (c.citizen_id LIKE ? OR c.full_name LIKE ? OR c.email LIKE ? OR c.profession_label LIKE ?)`;
        const like = `%${q}%`;
        params.push(like, like, like, like);
      }
      if (credential) {
        sql += ` AND c.professional_credential = ?`;
        params.push(credential);
      }
      sql += ` ORDER BY c.citizen_id ASC LIMIT ?`;
      params.push(limit);

      const rows = db.prepare(sql).all(...params);
      return sendJson(res, 200, { results: rows, count: rows.length });
    }

    // 5. Identidade 360 - List Active/Revoked Roles & Eligible Professionals
    if (pathname === '/api/iam360/roles' && req.method === 'GET') {
      const assignedRoles = db.prepare(`
        SELECT r.*, c.full_name, c.email, c.professional_credential, c.profession_label, c.age,
               g.full_name AS granted_by_name
        FROM iam_identity_360_roles r
        JOIN dim_citizens c ON r.citizen_id = c.citizen_id
        LEFT JOIN dim_citizens g ON r.granted_by_nid = g.citizen_id
        ORDER BY r.is_active DESC, r.citizen_id ASC
      `).all();

      const candidateProfessionals = db.prepare(`
        SELECT c.citizen_id, c.full_name, c.email, c.professional_credential, c.profession_label, c.age
        FROM dim_citizens c
        LEFT JOIN iam_identity_360_roles r ON c.citizen_id = r.citizen_id
        WHERE c.professional_credential IN ('PHYSICIAN', 'TEACHER', 'PUBLIC_MANAGER', 'MAGISTRATE_JUDGE', 'CIVIL_ENGINEER')
          AND (r.citizen_id IS NULL OR r.is_active = 0)
        ORDER BY c.citizen_id ASC
        LIMIT 30
      `).all();

      const credentialStats = db.prepare(`
        SELECT professional_credential, COUNT(*) AS total
        FROM dim_citizens
        GROUP BY professional_credential
        ORDER BY total DESC
      `).all();

      return sendJson(res, 200, {
        assigned_roles: assignedRoles,
        candidate_professionals: candidateProfessionals,
        credential_stats: credentialStats,
        role_catalog: ROLE_METADATA
      });
    }

    // 6. Identidade 360 - Grant Role (with PM vs Identity Manager hierarchy check)
    if (pathname === '/api/iam360/grant' && req.method === 'POST') {
      const body = await readBody(req);
      const { actor_nid, target_nid, role_code, ministry } = body;
      const actor = getFullCitizenProfile(actor_nid);
      if (!actor || !['PRIME_MINISTER_ROOT', 'SECRETARY_GENERAL', 'IDENTITY_MANAGER_360'].includes(actor.effective_role_code)) {
        return sendJson(res, 403, {
          error: 'Acesso negado: Apenas o Primeiro-Ministro, o Secretário-Geral ou o Gestor de Identidades 360 podem conceder acessos administrativos.'
        });
      }
      if (['IDENTITY_MANAGER_360', 'SECRETARY_GENERAL', 'PRIME_MINISTER_ROOT'].includes(role_code) &&
          !['PRIME_MINISTER_ROOT', 'SECRETARY_GENERAL'].includes(actor.effective_role_code)) {
        return sendJson(res, 403, {
          error: 'Restrição Constitucional: Apenas o Primeiro-Ministro (ou Secretário-Geral) pode nomear o Gestor de Identidades 360.'
        });
      }

      const target = db.prepare('SELECT * FROM dim_citizens WHERE citizen_id = ?').get(target_nid);
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

      db.prepare('UPDATE dim_citizens SET role_code = ? WHERE citizen_id = ?').run(role_code, target_nid);
      db.prepare(`
        INSERT INTO ops_audit_log (actor_nid, actor_name, action_type, target_nid, details, created_at)
        VALUES (?, ?, 'GRANT_BACKSTAGE_ROLE', ?, ?, ?)
      `).run(
        actor.citizen_id,
        actor.full_name,
        target_nid,
        `Concedido acesso administrativo [${role_code}] (${meta.title}) para ${target.full_name} (Credencial: ${target.professional_credential}).`,
        now
      );

      return sendJson(res, 200, {
        message: `Permissão administrativa ${role_code} concedida com sucesso para ${target.full_name}.`,
        updated_citizen: getFullCitizenProfile(target_nid)
      });
    }

    // 7. Identidade 360 - Revoke Role (Immediate reversion to CITIZEN_COMMON)
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

      const target = db.prepare('SELECT * FROM dim_citizens WHERE citizen_id = ?').get(target_nid);
      if (!target) return sendJson(res, 404, { error: 'Cidadão não encontrado.' });

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE iam_identity_360_roles
        SET is_active = 0, revoked_at = ?
        WHERE citizen_id = ?
      `).run(now, target_nid);

      db.prepare(`
        UPDATE dim_citizens SET role_code = 'CITIZEN_COMMON' WHERE citizen_id = ?
      `).run(target_nid);

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

    // 8. Backstage Overview & GDF Lakehouse 360 Crossings
    if (pathname === '/api/backstage/overview' && req.method === 'GET') {
      const counts = {
        dim_citizens: db.prepare('SELECT COUNT(*) AS c FROM dim_citizens').get().c,
        sec_biometrics_nist: db.prepare('SELECT COUNT(*) AS c FROM sec_biometrics_nist').get().c,
        rel_family_graph: db.prepare('SELECT COUNT(*) AS c FROM rel_family_graph').get().c,
        dim_addresses: db.prepare('SELECT COUNT(*) AS c FROM dim_addresses').get().c,
        health_records: db.prepare('SELECT COUNT(*) AS c FROM health_records').get().c,
        health_vaccinations: db.prepare('SELECT COUNT(*) AS c FROM health_vaccinations').get().c,
        edu_enrollments: db.prepare('SELECT COUNT(*) AS c FROM edu_enrollments').get().c,
        sec_passports: db.prepare('SELECT COUNT(*) AS c FROM sec_passports').get().c,
        justice_records: db.prepare('SELECT COUNT(*) AS c FROM justice_records').get().c,
        iam_active_roles: db.prepare('SELECT COUNT(*) AS c FROM iam_identity_360_roles WHERE is_active = 1').get().c
      };

      const districtBreakdown = db.prepare(`
        SELECT district, COUNT(*) AS total_addresses
        FROM dim_addresses
        GROUP BY district
        ORDER BY total_addresses DESC
      `).all();

      const languageBreakdown = db.prepare(`
        SELECT native_language, COUNT(*) AS total
        FROM dim_citizens
        GROUP BY native_language
      `).all();

      // Cruzamento 1: Passaporte x Justiça x Impostos (Controle de Fronteira)
      const crossingBorder = db.prepare(`
        SELECT c.citizen_id, c.full_name, c.tax_status,
               p.passport_number, p.status AS passport_status,
               j.background_check_status, j.security_clearance_level,
               CASE
                 WHEN j.background_check_status = 'WARRANT_ACTIVE' OR c.tax_status = 'BLOCKED_JUDICIAL' THEN 'DENIED_BORDER_HOLD'
                 WHEN c.tax_status = 'DELINQUENT' THEN 'MANUAL_TREASURY_REVIEW'
                 ELSE 'CLEARED_AUTONOMOUS_EGATE'
               END AS border_decision
        FROM dim_citizens c
        JOIN sec_passports p ON c.citizen_id = p.citizen_id
        JOIN justice_records j ON c.citizen_id = j.citizen_id
        WHERE j.background_check_status != 'CLEAR' OR c.tax_status != 'COMPLIANT' OR c.citizen_id IN ('NID-000-0000-0001-9', 'NID-000-0000-0004-3', 'NID-000-0000-0006-0')
        ORDER BY CASE WHEN j.background_check_status = 'WARRANT_ACTIVE' THEN 0 ELSE 1 END, c.citizen_id ASC
        LIMIT 15
      `).all();

      // Cruzamento 2: Educação / Evasão Escolar -> Alerta aos Pais via Grafo Familiar
      const crossingTruancy = db.prepare(`
        SELECT e.enrollment_id, e.citizen_id AS student_nid, s.full_name AS student_name, s.age AS student_age,
               e.institution_id, e.grade_level, e.attendance_rate, e.performance_index, e.ai_tutor_Needs_attention,
               fg.citizen_id_a AS parent_nid, p.full_name AS parent_name, p.email AS parent_email, p.phone AS parent_phone
        FROM edu_enrollments e
        JOIN dim_citizens s ON e.citizen_id = s.citizen_id
        JOIN rel_family_graph fg ON fg.citizen_id_b = e.citizen_id AND fg.relationship_type = 'PARENT_OF'
        JOIN dim_citizens p ON fg.citizen_id_a = p.citizen_id
        WHERE e.attendance_rate < 78.0 OR e.citizen_id IN ('NID-000-0000-0010-2', 'NID-000-0000-0011-0')
        ORDER BY CASE WHEN e.citizen_id IN ('NID-000-0000-0010-2', 'NID-000-0000-0011-0') THEN 0 ELSE 1 END, e.attendance_rate ASC
        LIMIT 15
      `).all();

      // Cruzamento 3: Emergência 911 -> Prontuário HL7 + Contato Familiar
      const crossingEmergency = db.prepare(`
        SELECT c.citizen_id, c.full_name, c.age,
               h.blood_type, h.allergies, h.chronic_conditions, h.assigned_hospital_id,
               h.emergency_contact_nid, ec.full_name AS emergency_contact_name, ec.phone AS emergency_contact_phone
        FROM dim_citizens c
        JOIN health_records h ON c.citizen_id = h.citizen_id
        LEFT JOIN dim_citizens ec ON h.emergency_contact_nid = ec.citizen_id
        WHERE c.citizen_id IN ('NID-000-0000-0010-2', 'NID-000-0000-0001-9', 'NID-000-0000-0004-3', 'NID-000-0000-0006-0')
           OR h.allergies != '["Nenhuma"]'
        LIMIT 15
      `).all();

      const auditLogs = db.prepare(`
        SELECT * FROM ops_audit_log ORDER BY audit_id DESC LIMIT 20
      `).all();

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

    // 9. Backstage Educação (Escolas, Professores, Alunos e Provas)
    if (pathname === '/api/backstage/education' && req.method === 'GET') {
      const institutions = db.prepare(`
        SELECT i.*,
               (SELECT COUNT(*) FROM edu_enrollments e WHERE e.institution_id = i.institution_id) AS enrolled_students,
               (SELECT ROUND(AVG(performance_index), 1) FROM edu_enrollments e WHERE e.institution_id = i.institution_id) AS avg_performance,
               (SELECT ROUND(AVG(attendance_rate), 1) FROM edu_enrollments e WHERE e.institution_id = i.institution_id) AS avg_attendance
        FROM edu_institutions i
      `).all();

      const teachers = db.prepare(`
        SELECT c.citizen_id, c.full_name, c.email, c.phone, c.role_code, c.profession_label
        FROM dim_citizens c
        WHERE c.professional_credential = 'TEACHER'
        ORDER BY c.citizen_id ASC
        LIMIT 25
      `).all();

      const students = db.prepare(`
        SELECT e.*, s.full_name AS student_name, s.age AS student_age, s.email AS student_email,
               i.name AS institution_name,
               fg.citizen_id_a AS parent_nid, p.full_name AS parent_name, p.phone AS parent_phone
        FROM edu_enrollments e
        JOIN dim_citizens s ON e.citizen_id = s.citizen_id
        LEFT JOIN edu_institutions i ON e.institution_id = i.institution_id
        LEFT JOIN rel_family_graph fg ON fg.citizen_id_b = e.citizen_id AND fg.relationship_type = 'PARENT_OF'
        LEFT JOIN dim_citizens p ON fg.citizen_id_a = p.citizen_id
        ORDER BY CASE WHEN e.citizen_id IN ('NID-000-0000-0010-2', 'NID-000-0000-0011-0') THEN 0 ELSE 1 END, e.enrollment_id ASC
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
      const needsAttention = (att < 75.0 || perf < 60.0) ? 1 : 0;

      db.prepare(`
        UPDATE edu_enrollments
        SET score_mathematics = ?, score_sciences = ?, score_ai_robotics = ?, score_languages = ?,
            attendance_rate = ?, performance_index = ?, ai_tutor_Needs_attention = ?
        WHERE citizen_id = ?
      `).run(math, sci, ai, lang, att, perf, needsAttention, student_nid);

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
        ai_tutor_Needs_attention: Boolean(needsAttention)
      });
    }

    if (pathname === '/api/backstage/education/exam' && req.method === 'POST') {
      const body = await readBody(req);
      const { institution_id, teacher_nid, teacher_name, subject, grade_level, title } = body;
      const inst = db.prepare('SELECT name FROM edu_institutions WHERE institution_id = ?').get(institution_id || 'SCH-NV-002');
      const examId = `EXAM-2026-${Math.floor(100 + Math.random() * 900)}`;
      const avg = Number((82 + Math.random() * 14).toFixed(1));
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
        grade_level || 'FUNDAMENTAL_II',
        title || 'Avaliação Unificada Assistida por IA',
        avg,
        now
      );

      return sendJson(res, 200, { message: `Prova ${examId} aplicada e corrigida pelo motor agêntico.`, exam_id: examId });
    }

    // 10. Backstage Saúde (Hospitais, Médicos, Prontuários HL7 e Telemedicina)
    if (pathname === '/api/backstage/health' && req.method === 'GET') {
      const hospitals = [
        { hospital_id: 'HOSP-NV-01', name: 'Hospital Universitário Soberano de Novatlantis', district: 'Distrito Tecnológico', beds_total: 420, icu_occupancy_pct: 64 },
        { hospital_id: 'HOSP-NV-02', name: 'Centro Médico Oceânico & Telemedicina', district: 'Distrito Oceânico', beds_total: 280, icu_occupancy_pct: 58 },
        { hospital_id: 'HOSP-NV-03', name: 'Instituto Cardiopulmonar Colina da Justiça', district: 'Colina da Justiça', beds_total: 190, icu_occupancy_pct: 71 },
        { hospital_id: 'HOSP-NV-04', name: 'Hospital Geral Porto Solar', district: 'Porto Solar', beds_total: 310, icu_occupancy_pct: 62 },
        { hospital_id: 'HOSP-NV-05', name: 'Clínica Policlínica Vale das Águas', district: 'Vale das Águas', beds_total: 150, icu_occupancy_pct: 49 }
      ].map(h => {
        const patients = db.prepare('SELECT COUNT(*) AS c FROM health_records WHERE assigned_hospital_id = ?').get(h.hospital_id).c;
        return { ...h, linked_citizens: patients };
      });

      const doctors = db.prepare(`
        SELECT c.citizen_id, c.full_name, c.email, c.phone, c.role_code, c.profession_label,
               (SELECT COUNT(*) FROM health_records h WHERE h.family_doctor_nid = c.citizen_id) AS assigned_patients
        FROM dim_citizens c
        WHERE c.professional_credential = 'PHYSICIAN'
        ORDER BY c.citizen_id ASC
        LIMIT 25
      `).all();

      const telemedSessions = db.prepare('SELECT * FROM ops_telemed_sessions ORDER BY created_at DESC').all();

      return sendJson(res, 200, { hospitals, doctors, telemed_sessions: telemedSessions });
    }

    if (pathname === '/api/backstage/health/telemed' && req.method === 'POST') {
      const body = await readBody(req);
      const { patient_nid, doctor_nid, hospital_id, chief_complaint, ai_soap_notes, prescription_medication } = body;
      const patient = db.prepare('SELECT full_name FROM dim_citizens WHERE citizen_id = ?').get(patient_nid || 'NID-000-0000-0010-2');
      const doctor = db.prepare('SELECT full_name FROM dim_citizens WHERE citizen_id = ?').get(doctor_nid || 'NID-000-0000-0004-3');
      const sessionId = `TMED-2026-${Math.floor(200 + Math.random() * 799)}`;
      const sig = `sig_ed25519_novatlantis_${Date.now().toString(16)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ops_telemed_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED_SIGNED', ?)
      `).run(
        sessionId,
        patient_nid || 'NID-000-0000-0010-2',
        patient ? patient.full_name : 'Cidadão Novatlantis',
        doctor_nid || 'NID-000-0000-0004-3',
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

    // 11. Operações Urbanas 311 & Comando de Emergência 911
    if (pathname === '/api/backstage/operations' && req.method === 'GET') {
      const tickets311 = db.prepare('SELECT * FROM ops_311_tickets ORDER BY created_at DESC').all();
      const dispatches911 = db.prepare('SELECT * FROM ops_911_dispatches ORDER BY created_at DESC').all();
      return sendJson(res, 200, { tickets_311: tickets311, dispatches_911: dispatches911 });
    }

    if (pathname === '/api/services/311' && req.method === 'POST') {
      const body = await readBody(req);
      const { citizen_id, category, district, description } = body;
      const citizen = db.prepare('SELECT full_name FROM dim_citizens WHERE citizen_id = ?').get(citizen_id || 'NID-000-0000-0001-9');
      const ticketId = `311-NV-2026-${Math.floor(100 + Math.random() * 899)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ops_311_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NULL, NULL, ?)
      `).run(
        ticketId,
        citizen_id || 'NID-000-0000-0001-9',
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
      const profile = getFullCitizenProfile(citizen_id || 'NID-000-0000-0010-2');
      const dispatchId = `911-NV-2026-${Math.floor(910 + Math.random() * 89)}`;
      const now = new Date().toISOString();

      // Cruzamento GDF #3 em tempo real: busca tipo sanguíneo, alergias e parente de emergência
      const ecNid = profile?.health?.emergency_contact_nid || profile?.family_links?.[0]?.relative_nid || 'NID-000-0000-0001-9';
      const ecCitizen = db.prepare('SELECT full_name, phone FROM dim_citizens WHERE citizen_id = ?').get(ecNid);

      db.prepare(`
        INSERT INTO ops_911_dispatches VALUES (?, ?, ?, ?, 'P1_CRITICAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 'DISPATCHED_EN_ROUTE', ?)
      `).run(
        dispatchId,
        profile ? profile.citizen_id : 'NID-000-0000-0010-2',
        profile ? profile.full_name : 'Cidadão Novatlantis',
        emergency_type || 'Emergência Médica / Resgate Urbano',
        location_district || profile?.residence?.district || 'Distrito Tecnológico',
        profile?.health?.blood_type || 'O+',
        JSON.stringify(profile?.health?.allergies || []),
        JSON.stringify(profile?.health?.chronic_conditions || []),
        profile?.health?.assigned_hospital_id || 'HOSP-NV-01',
        ecNid,
        ecCitizen ? ecCitizen.full_name : 'Familiar Responsável',
        ecCitizen ? ecCitizen.phone : '+550 98100-0001',
        'Unidade de Resgate Autônoma 911 + Alerta Hospitalar HL7',
        now
      );

      return sendJson(res, 200, {
        message: `Despacho 911 (${dispatchId}) acionado com cruzamento GDF: Prontuário HL7 enviado ao hospital e contato familiar notificado!`,
        dispatch_id: dispatchId
      });
    }

    // 12. Justiça, Passaportes & Tesouro Soberano (Empresas 45s & UBI)
    if (pathname === '/api/backstage/justice-treasury' && req.method === 'GET') {
      const companies = db.prepare('SELECT * FROM ops_companies ORDER BY created_at DESC').all();
      const taxSummary = db.prepare(`
        SELECT tax_status, COUNT(*) AS total, SUM(ubi_monthly_credits) AS total_ubi
        FROM dim_citizens
        GROUP BY tax_status
      `).all();
      const justiceSummary = db.prepare(`
        SELECT background_check_status, COUNT(*) AS total
        FROM justice_records
        GROUP BY background_check_status
      `).all();
      return sendJson(res, 200, { companies, tax_summary: taxSummary, justice_summary: justiceSummary });
    }

    if (pathname === '/api/services/company' && req.method === 'POST') {
      const body = await readBody(req);
      const { owner_nid, company_name, sector } = body;
      const owner = db.prepare('SELECT full_name, tax_status FROM dim_citizens WHERE citizen_id = ?').get(owner_nid || 'NID-000-0000-0001-9');
      if (owner && owner.tax_status === 'BLOCKED_JUDICIAL') {
        return sendJson(res, 400, { error: 'Bloqueio Judicial no GDF impede abertura automática de empresa.' });
      }
      const compId = `CORP-NV-${Math.floor(1000 + Math.random() * 8999)}`;
      db.prepare(`
        INSERT INTO ops_companies VALUES (?, ?, ?, ?, ?, 'SIMPLES_AGENTICO_3PCT', 250, 'ACTIVE', ?)
      `).run(
        compId,
        owner_nid || 'NID-000-0000-0001-9',
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
      const c = db.prepare('SELECT full_name, tax_status FROM dim_citizens WHERE citizen_id = ?').get(citizen_id);
      const j = db.prepare('SELECT background_check_status FROM justice_records WHERE citizen_id = ?').get(citizen_id);
      if (!c) return sendJson(res, 404, { error: 'Cidadão não encontrado.' });

      if (j?.background_check_status === 'WARRANT_ACTIVE' || c.tax_status === 'BLOCKED_JUDICIAL') {
        return sendJson(res, 403, {
          decision: 'DENIED_BORDER_HOLD',
          error: `Emissão bloqueada pelo Cruzamento GDF #1 (Justiça: ${j?.background_check_status}, Fiscal: ${c.tax_status}).`
        });
      }

      const passNum = `NV${Math.floor(10000000 + Math.random() * 89999999)}`;
      const existing = db.prepare('SELECT * FROM sec_passports WHERE citizen_id = ?').get(citizen_id);
      if (existing) {
        db.prepare(`UPDATE sec_passports SET status = 'VALID', expiration_date = '2036-10-01' WHERE citizen_id = ?`).run(citizen_id);
      } else {
        db.prepare(`
          INSERT INTO sec_passports VALUES (?, ?, '2026-10-01', '2036-10-01', 'NOVATLANTIS_MFA_ICAO', 'VALID', '["EU","MERCOSUL","US","JP","SG","UK"]')
        `).run(passNum, citizen_id);
      }

      return sendJson(res, 200, {
        decision: 'CLEARED_AUTONOMOUS_EGATE',
        message: `Passaporte Digital ICAO validado sem restrições judiciais ou fiscais para ${c.full_name}.`
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
