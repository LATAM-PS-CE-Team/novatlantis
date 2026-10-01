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

const healthFacilities = [
  {
    facility_id: 'HOSP-NOV-01',
    name: 'Hospital Universitário Central de Novatlantis',
    district: 'Distrito Tecnológico',
    director: 'Dra. Sofia Mendes Costa',
    occupancy_rate: 76,
    telemed_queue: 4
  },
  {
    facility_id: 'HOSP-NOV-02',
    name: 'Instituto de Telemedicina Avançada & Genômica',
    district: 'Colina da Justiça',
    director: 'Dr. Mateo Vargas Ríos',
    occupancy_rate: 68,
    telemed_queue: 2
  },
  {
    facility_id: 'HOSP-NOV-03',
    name: 'Complexo Hospitalar Atlântico Sul',
    district: 'Distrito Oceânico',
    director: 'Dra. Camila Herrera',
    occupancy_rate: 81,
    telemed_queue: 5
  },
  {
    facility_id: 'HOSP-NOV-04',
    name: 'Clínica Policlínica do Vale da Inovação',
    district: 'Vale da Inovação',
    director: 'Dr. Arthur Pendelton',
    occupancy_rate: 62,
    telemed_queue: 1
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
    status: 'REALIZADA',
    ai_clinical_summary: 'Paciente pediátrico (11 anos) com carteira vacinal completa e sinais vitais normais.'
  },
  {
    consult_id: 'TM-2026-502',
    patient_nid: 'NID-000-0000-0001-9',
    patient_name: 'Jopoco (Primeiro-Ministro da República)',
    doctor_nid: 'NID-000-0000-0005-1',
    doctor_name: 'Dr. Mateo Vargas Ríos',
    facility: 'Instituto de Telemedicina Avançada & Genômica',
    specialty: 'Check-up Executivo & Cardiologia Preventiva',
    status: 'AGENDADA',
    ai_clinical_summary: 'Check-up anual preventivo da Chancelaria. Biomarcadores cardiovasculares em faixa ótima.'
  }
];

const nationalExams = [
  {
    exam_id: 'EXAM-2026-101',
    school_name: 'Liceu Politécnico de Inteligência Artificial',
    subject: 'IA & Robótica',
    title: 'Avaliação Nacional de Arquiteturas Agênticas & Ética',
    grade_level: '6º Ano Fundamental',
    teacher_nid: 'NID-000-0000-0006-0',
    created_at: '2026-09-30T15:00:00Z'
  }
];

const serviceTickets311 = [
  {
    ticket_id: '311-2026-9901',
    citizen_nid: 'NID-000-0000-0010-8',
    citizen_name: 'Pedro Albuquerque Viana',
    category: 'Iluminação Pública Inteligente & Sensores IoT',
    district: 'Distrito Tecnológico',
    description: 'Poste solar autônomo na Quadra 42 apresentando oscilação de telemetria.',
    status: 'EM_ATENDIMENTO',
    resolved_by: null
  },
  {
    ticket_id: '311-2026-9902',
    citizen_nid: 'NID-000-0000-0001-9',
    citizen_name: 'Jopoco (Primeiro-Ministro da República)',
    category: 'Zeladoria Viária & Drenagem Pluvial',
    district: 'Colina da Justiça',
    description: 'Inspeção preventiva de drenagem pluvial em frente ao Palácio da Chancelaria.',
    status: 'ABERTO',
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
    status: 'UNIDADE_NO_LOCAL'
  }
];

const stmtCitizenByNid = db.prepare('SELECT * FROM dim_citizens WHERE nid = ?');
const stmtCitizenByEmail = db.prepare('SELECT * FROM dim_citizens WHERE lower(email) = lower(?)');
const stmtUpdateRole = db.prepare('UPDATE dim_citizens SET iam_role = ? WHERE nid = ?');
const stmtPrivilegedServants = db.prepare(`
  SELECT nid, full_name, email, age, profession, specialty, iam_role, district
  FROM dim_citizens
  WHERE iam_role != 'CITIZEN_COMMON'
  ORDER BY nid ASC
  LIMIT 40
`);
const stmtSearchCitizens = db.prepare(`
  SELECT nid, full_name, email, age, gender, native_language, profession, specialty, iam_role, district, tax_status
  FROM dim_citizens
  WHERE nid LIKE ? OR full_name LIKE ? OR email LIKE ? OR profession LIKE ?
  LIMIT ?
`);
const stmtTopStudents = db.prepare(`
  SELECT e.*, c.full_name as student_name, t.full_name as teacher_name
  FROM edu_enrollments e
  LEFT JOIN dim_citizens c ON c.nid = e.student_nid
  LEFT JOIN dim_citizens t ON t.nid = e.teacher_nid
  ORDER BY e.student_nid ASC
  LIMIT 25
`);
const stmtUpdateStudentGrade = db.prepare(`
  UPDATE edu_enrollments
  SET score_mathematics = ?, score_sciences = ?, score_ai_robotics = ?, score_languages = ?, attendance_rate = ?
  WHERE student_nid = ?
`);

function enrichCitizenWithIam(citizen) {
  if (!citizen) return null;
  const roleInfo = IAM_ROLE_MATRIX[citizen.iam_role] || IAM_ROLE_MATRIX.CITIZEN_COMMON;
  return {
    ...citizen,
    role_info: roleInfo,
    backstage_allowed: roleInfo.backstage_allowed
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

  if (pathname.startsWith('/api/v1/auth/') || pathname.startsWith('/api/v1/profile/')) {
    const handled = await handleCentralAuthAndProfileRoutes(req, res, db, pathname, parsedUrl, readJsonBody, sendJson);
    if (handled !== false) return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    const totalCitizens = db.prepare('SELECT COUNT(*) as c FROM dim_citizens').get().c;
    return sendJson(res, 200, {
      status: 'ok',
      service: 'novatlantis-gov-backstage',
      role: 'Backstage Governamental & Identidade 360 (Full-Stack Standalone Application)',
      project_id: 'novatlantis',
      users_module_total_citizens: totalCitizens,
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const identifier = String(body.identifier || '').trim();
    let rawCitizen = null;

    if (
      identifier.toLowerCase() === 'admin@jopoco.altostrat.com' ||
      identifier.toLowerCase() === 'jopoco' ||
      identifier.toLowerCase() === 'jopoco@novatlantis.gov.cloud'
    ) {
      rawCitizen = stmtCitizenByNid.get('NID-000-0000-0001-9');
    } else if (identifier.toUpperCase().startsWith('NID-')) {
      rawCitizen = stmtCitizenByNid.get(identifier.toUpperCase());
    } else {
      rawCitizen = stmtCitizenByEmail.get(identifier);
    }

    if (!rawCitizen) {
      return sendJson(res, 404, { error: 'Cidadão/Servidor não encontrado na base de 100.000 cidadãos.' });
    }

    return sendJson(res, 200, {
      authenticated: true,
      citizen: enrichCitizenWithIam(rawCitizen)
    });
  }

  if (pathname === '/api/iam360/roles' && req.method === 'GET') {
    const servants = stmtPrivilegedServants.all().map(enrichCitizenWithIam);
    return sendJson(res, 200, {
      role_matrix: IAM_ROLE_MATRIX,
      privileged_servants: servants
    });
  }

  if (pathname === '/api/iam360/grant' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const targetNid = String(body.target_nid || '').trim();
    const newRole = String(body.new_role || 'DOCTOR_TELEMED').trim();
    const target = stmtCitizenByNid.get(targetNid);
    if (!target) {
      return sendJson(res, 404, { error: `Cidadão ${targetNid} não encontrado na base de 100.000 cidadãos.` });
    }
    stmtUpdateRole.run(newRole, targetNid);
    const updated = enrichCitizenWithIam(stmtCitizenByNid.get(targetNid));
    return sendJson(res, 200, {
      updated: true,
      target_citizen: updated
    });
  }

  if (pathname === '/api/iam360/revoke' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const targetNid = String(body.target_nid || '').trim();
    if (targetNid === 'NID-000-0000-0001-9') {
      return sendJson(res, 403, { error: 'O Primeiro-Ministro (Root Admin) não pode ter sua permissão revogada.' });
    }
    const target = stmtCitizenByNid.get(targetNid);
    if (!target) {
      return sendJson(res, 404, { error: `Cidadão ${targetNid} não encontrado.` });
    }
    stmtUpdateRole.run('CITIZEN_COMMON', targetNid);
    const updated = enrichCitizenWithIam(stmtCitizenByNid.get(targetNid));
    return sendJson(res, 200, {
      revoked: true,
      target_citizen: updated
    });
  }

  if (pathname === '/api/backstage/overview' && req.method === 'GET') {
    const totalCitizens = db.prepare('SELECT COUNT(*) as c FROM dim_citizens').get().c;
    const totalFamilyLinks = db.prepare('SELECT COUNT(*) as c FROM rel_family_graph').get().c;
    const totalDoctors = db.prepare("SELECT COUNT(*) as c FROM dim_citizens WHERE profession = 'DOCTOR'").get().c;
    const totalTeachers = db.prepare("SELECT COUNT(*) as c FROM dim_citizens WHERE profession = 'TEACHER'").get().c;
    return sendJson(res, 200, {
      kpis: {
        total_citizens: totalCitizens,
        total_family_links: totalFamilyLinks,
        total_doctors: totalDoctors,
        total_teachers: totalTeachers
      }
    });
  }

  if (pathname === '/api/backstage/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      facilities: healthFacilities,
      telemed_consultations: telemedConsultations
    });
  }

  if (pathname === '/api/backstage/education' && req.method === 'GET') {
    return sendJson(res, 200, {
      student_enrollments: stmtTopStudents.all(),
      exams: nationalExams
    });
  }

  if (pathname === '/api/backstage/education/grade' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const studentNid = String(body.student_nid || 'NID-000-0000-0010-8');
    stmtUpdateStudentGrade.run(
      Number(body.score_mathematics || 95),
      Number(body.score_sciences || 92),
      Number(body.score_ai_robotics || 99),
      Number(body.score_languages || 91),
      Number(body.attendance_rate || 98.5),
      studentNid
    );
    return sendJson(res, 200, { updated: true, student_nid: studentNid });
  }

  if (pathname === '/api/backstage/education/exam' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const newExam = {
      exam_id: `EXAM-2026-${Math.floor(100 + Math.random() * 900)}`,
      school_name: String(body.school_name || 'Liceu Politécnico de IA'),
      subject: String(body.subject || 'IA & Robótica'),
      title: String(body.title || 'Avaliação Nacional Semestral'),
      grade_level: String(body.grade_level || '6º Ano Fundamental'),
      teacher_nid: String(body.teacher_nid || 'NID-000-0000-0006-0'),
      created_at: new Date().toISOString()
    };
    nationalExams.unshift(newExam);
    return sendJson(res, 201, { created: true, exam: newExam });
  }

  if (pathname === '/api/backstage/operations' && req.method === 'GET') {
    return sendJson(res, 200, {
      tickets_311: serviceTickets311,
      dispatches_911: emergencyDispatches911
    });
  }

  if (pathname === '/api/services/311/resolve' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const ticket = serviceTickets311.find((t) => t.ticket_id === body.ticket_id);
    if (ticket) {
      ticket.status = 'CONCLUIDO';
      ticket.resolved_by = body.actor_nid || 'NID-000-0000-0008-6';
    }
    return sendJson(res, 200, { resolved: true, ticket });
  }

  if (pathname === '/api/backstage/justice-treasury' && req.method === 'GET') {
    return sendJson(res, 200, {
      passports_active: db.prepare('SELECT COUNT(*) as c FROM sec_passports').get().c,
      justice_records: db.prepare('SELECT COUNT(*) as c FROM justice_records').get().c
    });
  }

  if ((pathname === '/api/gdf/search' || pathname === '/api/users/search') && req.method === 'GET') {
    const q = String(parsedUrl.searchParams.get('q') || '').trim();
    const limit = Math.min(Number(parsedUrl.searchParams.get('limit') || 25), 50);
    const pattern = `%${q || 'NID-000'}%`;
    const rows = stmtSearchCitizens.all(pattern, pattern, pattern, pattern, limit);
    return sendJson(res, 200, {
      query: q,
      count: rows.length,
      results: rows.map(enrichCitizenWithIam)
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
  console.log(`[Novatlantis Gov Backstage Full-Stack] Listening on port ${PORT}`);
});
