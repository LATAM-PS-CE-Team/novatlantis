import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handleCentralAuthAndProfileRoutes } from './authModule.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const DIST_DIR = path.join(__dirname, 'dist');
const DB_PATH = path.join(__dirname, 'gdf_sovereign.db');

const db = new DatabaseSync(DB_PATH);

const IAM_ROLE_MATRIX = {
  PRIME_MINISTER_ROOT: {
    role_code: 'PRIME_MINISTER_ROOT',
    title_pt: 'Primeiro-Ministro da República (Root Admin)',
    department: 'Chancelaria Suprema de Novatlantis',
    clearance_level: 10,
    backstage_allowed: true
  },
  SECRETARY_GENERAL: {
    role_code: 'SECRETARY_GENERAL',
    title_pt: 'Secretário-Geral de Estado',
    department: 'Secretaria-Geral da República',
    clearance_level: 9,
    backstage_allowed: true
  },
  IDENTITY_MANAGER_360: {
    role_code: 'IDENTITY_MANAGER_360',
    title_pt: 'Gestor Governamental de Identidades 360',
    department: 'Autoridade Nacional de Identidade Soberana (IAM 360)',
    clearance_level: 8,
    backstage_allowed: true
  },
  DOCTOR_AND_HEALTH_MANAGER: {
    role_code: 'DOCTOR_AND_HEALTH_MANAGER',
    title_pt: 'Médico & Gestor de Hospitais e Clínicas',
    department: 'Ministério da Saúde & Telemedicina',
    clearance_level: 6,
    backstage_allowed: true
  },
  DOCTOR_TELEMED: {
    role_code: 'DOCTOR_TELEMED',
    title_pt: 'Médico Clínico de Telemedicina',
    department: 'Ministério da Saúde & Telemedicina',
    clearance_level: 5,
    backstage_allowed: true
  },
  TEACHER_AND_EDU_MANAGER: {
    role_code: 'TEACHER_AND_EDU_MANAGER',
    title_pt: 'Professor & Gestor de Escolas e Currículo',
    department: 'Ministério da Educação & IA Pedagógica',
    clearance_level: 6,
    backstage_allowed: true
  },
  TEACHER_EDUCATOR: {
    role_code: 'TEACHER_EDUCATOR',
    title_pt: 'Professor da Rede Pública Nacional',
    department: 'Ministério da Educação & IA Pedagógica',
    clearance_level: 5,
    backstage_allowed: true
  },
  OPERATIONS_311_911_MANAGER: {
    role_code: 'OPERATIONS_311_911_MANAGER',
    title_pt: 'Comandante Operacional 311 & 911',
    department: 'Centro Integrado de Comando Urbano e Emergências',
    clearance_level: 6,
    backstage_allowed: true
  },
  JUSTICE_AND_TREASURY_MANAGER: {
    role_code: 'JUSTICE_AND_TREASURY_MANAGER',
    title_pt: 'Magistrado & Gestor do Tesouro e Fronteiras',
    department: 'Ministério da Justiça, Fronteiras e Tesouro Soberano',
    clearance_level: 7,
    backstage_allowed: true
  },
  CITIZEN_COMMON: {
    role_code: 'CITIZEN_COMMON',
    title_pt: 'Cidadão da República de Novatlantis',
    department: 'Sociedade Civil Soberana',
    clearance_level: 1,
    backstage_allowed: false
  }
};

const serviceTickets311 = [
  {
    ticket_id: '311-2026-9901',
    citizen_nid: 'NID-000-0000-0010-8',
    citizen_name: 'Pedro Albuquerque Viana',
    category: 'Iluminação Pública Inteligente & Sensores IoT',
    district: 'Distrito Tecnológico',
    description: 'Poste solar autônomo na Quadra 42 apresentando oscilação de telemetria e baixa luminosidade.',
    ai_triage_priority: 'ALTA',
    assigned_department: 'Secretaria de Infraestrutura & Smart Grid',
    sla_hours: 6,
    status: 'EM_ATENDIMENTO',
    created_at: '2026-09-30T19:15:00Z',
    resolved_by: null
  },
  {
    ticket_id: '311-2026-9902',
    citizen_nid: 'NID-000-0000-0001-9',
    citizen_name: 'Joao Thiago Poço (JT) (Primeiro-Ministro da República)',
    category: 'Zeladoria Viária & Drenagem Pluvial',
    district: 'Colina da Justiça',
    description: 'Inspeção preventiva de drenagem pluvial em frente ao Palácio da Chancelaria.',
    ai_triage_priority: 'MEDIA',
    assigned_department: 'Corpo de Engenharia Civil Urbana',
    sla_hours: 12,
    status: 'ABERTO',
    created_at: '2026-09-30T20:10:00Z',
    resolved_by: null
  }
];

const emergencyDispatches911 = [
  {
    dispatch_id: '911-SOS-701',
    citizen_nid: 'NID-000-0000-0011-6',
    citizen_name: 'Alice Albuquerque Viana',
    emergency_type: 'MÉDICA • Pediatria Respiratória',
    district: 'Distrito Tecnológico',
    ai_protocol: 'Protocolo Vermelho-Ped • Unidade Móvel UTI-04 + Drone Desfibrilador',
    eta_minutes: 3,
    status: 'UNIDADE_NO_LOCAL',
    created_at: '2026-09-30T21:00:00Z'
  }
];

const telemedConsultations = [
  {
    consult_id: 'TM-2026-501',
    patient_nid: 'NID-000-0000-0010-8',
    patient_name: 'Pedro Albuquerque Viana',
    doctor_nid: 'NID-000-0000-0004-3',
    doctor_name: 'Dra. Sofia Mendes Costa',
    facility: 'Hospital Universitário Central de Novatlantis',
    specialty: 'Pediatria & Imunologia',
    scheduled_at: '2026-10-01T14:00:00Z',
    status: 'REALIZADA',
    ai_clinical_summary: 'Paciente pediátrico (11 anos) com carteira vacinal completa e sinais vitais normais. Orientação preventiva de ergonomia visual.',
    prescription_code: 'RX-ICP-NOV-2026-88412'
  },
  {
    consult_id: 'TM-2026-502',
    patient_nid: 'NID-000-0000-0001-9',
    patient_name: 'Joao Thiago Poço (JT) (Primeiro-Ministro da República)',
    doctor_nid: 'NID-000-0000-0005-1',
    doctor_name: 'Dr. Mateo Vargas Ríos',
    facility: 'Instituto de Telemedicina Avançada & Genômica',
    specialty: 'Check-up Executivo & Cardiologia Preventiva',
    scheduled_at: '2026-10-02T09:30:00Z',
    status: 'AGENDADA',
    ai_clinical_summary: 'Check-up anual preventivo da Chancelaria. Biomarcadores cardiovasculares em faixa ótima.',
    prescription_code: 'RX-ICP-NOV-2026-99104'
  }
];

const instantCompanies = [
  {
    company_id: 'EMP-NOV-2026-001',
    owner_nid: 'NID-000-0000-0001-9',
    owner_name: 'Joao Thiago Poço (JT) (Primeiro-Ministro da República)',
    company_name: 'Novatlantis Sovereign AI Labs S.A.',
    sector: 'Infraestrutura de IA Soberana & Computação Quântica',
    tax_regime: 'Zona Franca de Inovação Agêntica (Alíquota 4.5%)',
    incorporation_seconds: 38,
    status: 'ATIVA',
    created_at: '2026-09-30T18:00:00Z'
  }
];

const auditTrailLog = [
  {
    id: 'AUD-9001',
    timestamp: new Date(Date.now() - 1800_000).toISOString(),
    actor_nid: 'NID-000-0000-0001-9',
    actor_name: 'Joao Thiago Poço (JT) (Primeiro-Ministro da República)',
    action: 'PORTAL_CIDADAO_SSO_LOGIN',
    target_nid: 'NID-000-0000-0001-9',
    details: 'Sessão soberana autenticada no Portal do Cidadão via chave pública Ed25519 e validação biométrica NIST.'
  },
  {
    id: 'AUD-9002',
    timestamp: new Date(Date.now() - 900_000).toISOString(),
    actor_nid: 'NID-000-0000-0004-3',
    actor_name: 'Dra. Sofia Mendes Costa',
    action: 'HL7_CLINICAL_RECORD_VERIFIED',
    target_nid: 'NID-000-0000-0010-8',
    details: 'Prontuário eletrônico HL7 FHIR verificado para acompanhamento pediátrico e imunização.'
  }
];

const stmtCitizenByNid = db.prepare('SELECT * FROM dim_citizens WHERE nid = ?');
const stmtCitizenByEmail = db.prepare('SELECT * FROM dim_citizens WHERE lower(email) = lower(?)');
const stmtSearchCitizens = db.prepare(`
  SELECT nid, full_name, email, age, gender, native_language, profession, specialty, iam_role, district, tax_status, address_id
  FROM dim_citizens
  WHERE nid LIKE ? OR full_name LIKE ? OR email LIKE ? OR profession LIKE ?
  LIMIT ?
`);
const stmtUpdateAddress = db.prepare('UPDATE dim_citizens SET address_id = ?, district = ? WHERE nid = ?');
const stmtFamilyFrom = db.prepare(`
  SELECT r.*, c.full_name as target_name, c.age as target_age, c.profession as target_profession, c.email as target_email
  FROM rel_family_graph r
  LEFT JOIN dim_citizens c ON c.nid = r.target_nid
  WHERE r.source_nid = ?
`);
const stmtFamilyTo = db.prepare(`
  SELECT r.*, c.full_name as source_name, c.age as source_age, c.profession as source_profession, c.email as source_email
  FROM rel_family_graph r
  LEFT JOIN dim_citizens c ON c.nid = r.source_nid
  WHERE r.target_nid = ?
`);
const stmtHealthByNid = db.prepare(`
  SELECT h.*, d.full_name as doctor_name, d.specialty as doctor_specialty, d.email as doctor_email
  FROM health_records h
  LEFT JOIN dim_citizens d ON d.nid = h.assigned_primary_care_physician_nid
  WHERE h.patient_nid = ?
`);
const stmtEduByStudent = db.prepare(`
  SELECT e.*, t.full_name as teacher_name, t.email as teacher_email
  FROM edu_enrollments e
  LEFT JOIN dim_citizens t ON t.nid = e.teacher_nid
  WHERE e.student_nid = ?
`);
const stmtPassportByNid = db.prepare('SELECT * FROM sec_passports WHERE nid = ?');
const stmtUpsertPassport = db.prepare(`
  INSERT INTO sec_passports (passport_number, nid, issue_date, expiry_date, icao_mrz_line1, icao_mrz_line2, passport_status)
  VALUES (?, ?, ?, ?, ?, ?, 'VALID')
  ON CONFLICT(passport_number) DO UPDATE SET
    issue_date = excluded.issue_date,
    expiry_date = excluded.expiry_date,
    passport_status = 'VALID'
`);
const stmtJusticeByNid = db.prepare('SELECT * FROM justice_records WHERE citizen_nid = ?');

function enrichCitizenWithIam(citizen) {
  if (!citizen) return null;
  const roleInfo = IAM_ROLE_MATRIX[citizen.iam_role] || IAM_ROLE_MATRIX.CITIZEN_COMMON;
  let customProfile = null;
  try {
    customProfile = db.prepare('SELECT * FROM citizen_profiles WHERE nid = ?').get(citizen.nid);
  } catch {
    customProfile = null;
  }
  return {
    ...citizen,
    social_name: customProfile?.social_name || citizen.full_name,
    avatar_url: customProfile?.avatar_url || '/assets/coat_of_arms.jpg',
    avatarUrl: customProfile?.avatar_url || '/assets/coat_of_arms.jpg',
    phone_number: customProfile?.phone_number || `+550 98100-${citizen.nid.slice(-6, -2)}`,
    bio: customProfile?.bio || `Cidadão soberano residente em ${citizen.district}.`,
    role_info: roleInfo,
    backstage_allowed: roleInfo.backstage_allowed,
    nist_biometrics: {
      standard: 'ANSI/NIST-ITL 1-2011 & ISO/IEC 19794-5',
      face_confidence: 0.994,
      minutiae_points: 68,
      ed25519_key_fingerprint: `ED25519-NOV-${citizen.nid.slice(-6)}`,
      status: 'ICAO_COMPLIANT'
    }
  };
}

function getFullCitizenDossier(nid) {
  const rawCitizen = stmtCitizenByNid.get(nid);
  if (!rawCitizen) return null;
  const citizen = enrichCitizenWithIam(rawCitizen);
  const familyOutgoing = stmtFamilyFrom.all(nid);
  const familyIncoming = stmtFamilyTo.all(nid);
  const health = stmtHealthByNid.get(nid) || null;
  const education = stmtEduByStudent.get(nid) || null;
  const passport = stmtPassportByNid.get(nid) || null;
  const justice = stmtJusticeByNid.get(nid) || null;

  const monthlyUbiAmount = citizen.age >= 18 ? 1450.0 : 650.0;
  const sovereignTreasury = {
    currency: 'NVD (Novatlantis Sovereign Digital Dollar)',
    monthly_ubi_dividend: monthlyUbiAmount,
    next_payout_date: '2026-10-05',
    carbon_cashback_balance: 320.5,
    tax_status: citizen.tax_status
  };

  return {
    citizen,
    family: {
      outgoing: familyOutgoing,
      incoming: familyIncoming
    },
    health,
    education,
    passport,
    justice,
    sovereign_treasury: sovereignTreasury
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/v1/')) {
    const handled = await handleCentralAuthAndProfileRoutes(req, res, db, pathname, parsedUrl, readJsonBody, sendJson);
    if (handled !== false) return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    const totalCitizens = db.prepare('SELECT COUNT(*) as c FROM dim_citizens').get().c;
    return sendJson(res, 200, {
      status: 'ok',
      service: 'novatlantis-citizen-portal',
      role: 'Portal do Cidadão (Full-Stack Standalone Application)',
      project_id: 'novatlantis',
      database_engine: 'Google Cloud AlloyDB for PostgreSQL 15 (novatlantis-sovereign-cluster / novatlantis-primary-01)',
      government_data_platform: 'Google Cloud Government Data Platform (GDP) — Baseado em education-data-platform',
      users_module_total_citizens: totalCitizens,
      timestamp: new Date().toISOString()
    });
  }

  if ((pathname === '/api/auth/login' || pathname === '/api/users/login') && req.method === 'POST') {
    const body = await readJsonBody(req);
    const identifier = String(body.identifier || '').trim();
    let rawCitizen = null;

    if (
      identifier.toLowerCase() === 'jt@novatlantis.gov.cloud' ||
      identifier.toLowerCase() === 'jt' ||
      identifier.toLowerCase() === 'jt@novatlantis.gov.cloud'
    ) {
      rawCitizen = stmtCitizenByNid.get('NID-000-0000-0001-9');
    } else if (identifier.toUpperCase().startsWith('NID-')) {
      rawCitizen = stmtCitizenByNid.get(identifier.toUpperCase());
    } else {
      rawCitizen = stmtCitizenByEmail.get(identifier);
    }

    if (!rawCitizen) {
      return sendJson(res, 404, {
        error: 'Cidadão não encontrado na base nacional de 100.000 cidadãos.',
        hint: 'Use NID-000-0000-0001-9 (Joao Thiago Poço - JT) ou NID-000-0000-0010-8 (Pedro Albuquerque)'
      });
    }

    const dossier = getFullCitizenDossier(rawCitizen.nid);
    return sendJson(res, 200, {
      authenticated: true,
      ...dossier
    });
  }

  if ((pathname === '/api/users/search' || pathname === '/api/gdf/search') && req.method === 'GET') {
    const q = String(parsedUrl.searchParams.get('q') || '').trim();
    const limit = Math.min(Number(parsedUrl.searchParams.get('limit') || 20), 50);
    const pattern = `%${q || 'NID-000'}%`;
    const rows = stmtSearchCitizens.all(pattern, pattern, pattern, pattern, limit);
    return sendJson(res, 200, {
      query: q,
      count: rows.length,
      results: rows.map(enrichCitizenWithIam)
    });
  }

  if ((pathname.startsWith('/api/users/') || pathname.startsWith('/api/gdf/citizen/')) && req.method === 'GET') {
    const parts = pathname.split('/');
    const nid = decodeURIComponent(parts[parts.length - 1]);
    const dossier = getFullCitizenDossier(nid);
    if (!dossier) {
      return sendJson(res, 404, { error: `Cidadão ${nid} não localizado.` });
    }
    return sendJson(res, 200, dossier);
  }

  if (pathname.endsWith('/address') && req.method === 'POST') {
    const body = await readJsonBody(req);
    const nid = String(body.nid || 'NID-000-0000-0001-9');
    const address_id = String(body.address_id || 'ADDR-NOV-2026-001');
    const district = String(body.district || 'Distrito Tecnológico');

    stmtUpdateAddress.run(address_id, district, nid);
    const updated = getFullCitizenDossier(nid);
    auditTrailLog.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actor_nid: nid,
      actor_name: updated?.citizen?.full_name || nid,
      action: 'CITIZEN_ADDRESS_UPDATE',
      target_nid: nid,
      details: `Endereço soberano atualizado para ${address_id} (${district}) com propagação imediata no GDF.`
    });

    return sendJson(res, 200, {
      updated: true,
      dossier: updated
    });
  }

  if (pathname === '/api/citizen/dashboard' && req.method === 'GET') {
    const nid = String(parsedUrl.searchParams.get('nid') || 'NID-000-0000-0001-9');
    return sendJson(res, 200, {
      tickets_311: serviceTickets311.filter((t) => t.citizen_nid === nid || serviceTickets311.length <= 5),
      dispatches_911: emergencyDispatches911,
      telemed_consultations: telemedConsultations.filter((c) => c.patient_nid === nid || telemedConsultations.length <= 5),
      instant_companies: instantCompanies.filter((c) => c.owner_nid === nid || instantCompanies.length <= 5),
      audit_log: auditTrailLog.slice(0, 15)
    });
  }

  if (pathname === '/api/services/311' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const citizen = stmtCitizenByNid.get(String(body.citizen_nid || 'NID-000-0000-0001-9'));
    const newTicket = {
      ticket_id: `311-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      citizen_nid: citizen ? citizen.nid : 'NID-000-0000-0001-9',
      citizen_name: citizen ? citizen.full_name : 'Cidadão Novatlantis',
      category: String(body.category || 'Zeladoria Urbana & Smart Grid'),
      district: String(body.district || (citizen ? citizen.district : 'Distrito Tecnológico')),
      description: String(body.description || 'Solicitação aberta pelo Portal do Cidadão.'),
      ai_triage_priority: 'ALTA',
      assigned_department: 'Secretaria de Infraestrutura & Zeladoria 311',
      sla_hours: 6,
      status: 'ABERTO',
      created_at: new Date().toISOString(),
      resolved_by: null
    };
    serviceTickets311.unshift(newTicket);
    return sendJson(res, 201, { created: true, ticket: newTicket });
  }

  if (pathname === '/api/services/911' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const citizen = stmtCitizenByNid.get(String(body.citizen_nid || 'NID-000-0000-0001-9'));
    const newDispatch = {
      dispatch_id: `911-SOS-${Math.floor(100 + Math.random() * 900)}`,
      citizen_nid: citizen ? citizen.nid : 'NID-000-0000-0001-9',
      citizen_name: citizen ? citizen.full_name : 'Cidadão Novatlantis',
      emergency_type: String(body.emergency_type || 'Emergência Médica & Defesa Civil'),
      district: String(body.district || (citizen ? citizen.district : 'Distrito Tecnológico')),
      ai_protocol: 'Protocolo Prioridade Máxima • Viatura + Drone Autônomo Despachados',
      eta_minutes: 3,
      status: 'DESPACHADO',
      created_at: new Date().toISOString()
    };
    emergencyDispatches911.unshift(newDispatch);
    return sendJson(res, 201, { dispatched: true, dispatch: newDispatch });
  }

  if (pathname === '/api/services/telemed' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const patient = stmtCitizenByNid.get(String(body.patient_nid || 'NID-000-0000-0001-9'));
    const newConsult = {
      consult_id: `TM-2026-${Math.floor(100 + Math.random() * 900)}`,
      patient_nid: patient ? patient.nid : 'NID-000-0000-0001-9',
      patient_name: patient ? patient.full_name : 'Cidadão Novatlantis',
      doctor_nid: 'NID-000-0000-0004-3',
      doctor_name: 'Dra. Sofia Mendes Costa',
      facility: 'Hospital Universitário Central de Novatlantis',
      specialty: String(body.specialty || 'Clínica Médica & Telemedicina IA'),
      scheduled_at: new Date().toISOString(),
      status: 'REALIZADA',
      ai_clinical_summary: String(
        body.symptoms
          ? `Triagem IA para relato "${body.symptoms}": Sinais vitais estáveis, orientação clínica emitida e receita assinada via ICP-Novatlantis.`
          : 'Teleconsulta realizada com sumarização clínica automática e prescrição digital assinada.'
      ),
      prescription_code: `RX-ICP-NOV-2026-${Math.floor(10000 + Math.random() * 89999)}`
    };
    telemedConsultations.unshift(newConsult);
    return sendJson(res, 201, { created: true, consultation: newConsult });
  }

  if (pathname === '/api/services/company' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const owner = stmtCitizenByNid.get(String(body.owner_nid || 'NID-000-0000-0001-9'));
    const newCompany = {
      company_id: `EMP-NOV-2026-${Math.floor(100 + Math.random() * 900)}`,
      owner_nid: owner ? owner.nid : 'NID-000-0000-0001-9',
      owner_name: owner ? owner.full_name : 'Cidadão Novatlantis',
      company_name: String(body.company_name || 'Nova Empresa Soberana S.A.'),
      sector: String(body.sector || 'Tecnologia & Serviços Digitais'),
      tax_regime: 'Zona Franca de Inovação Agêntica (Alíquota 4.5%)',
      incorporation_seconds: 42,
      status: 'ATIVA',
      created_at: new Date().toISOString()
    };
    instantCompanies.unshift(newCompany);
    return sendJson(res, 201, { created: true, company: newCompany });
  }

  if (pathname === '/api/services/passport' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const citizen = stmtCitizenByNid.get(String(body.nid || 'NID-000-0000-0001-9'));
    if (!citizen) {
      return sendJson(res, 404, { error: 'Cidadão não encontrado.' });
    }
    const existing = stmtPassportByNid.get(citizen.nid);
    const passportNum = existing ? existing.passport_number : `P-NOV-${citizen.nid.replace(/[^0-9]/g, '').slice(-7)}`;
    const cleanName = citizen.full_name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z ]/g, '')
      .replace(/\s+/g, '<');
    const mrz1 = `P<NOV${cleanName}<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`.slice(0, 44);
    const mrz2 = `${passportNum}<8NOV${citizen.birth_date.replace(/-/g, '').slice(2)}M3610014<<<<<<<<<<<<<<04`.slice(0, 44);
    stmtUpsertPassport.run(passportNum, citizen.nid, '2026-10-01', '2036-10-01', mrz1, mrz2);
    const updatedDossier = getFullCitizenDossier(citizen.nid);
    return sendJson(res, 200, {
      issued: true,
      passport: updatedDossier.passport
    });
  }

  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`[Novatlantis Citizen Portal Full-Stack] Listening on port ${PORT}`);
});
