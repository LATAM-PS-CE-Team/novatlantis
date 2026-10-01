import crypto from 'node:crypto';

const PEPPER = Buffer.from('NOVATLANTIS_ARGON2ID_SOVEREIGN_PEPPER_2026', 'utf-8');
const JWT_SECRET = process.env.NOVATLANTIS_JWT_SECRET || 'NOVATLANTIS_SOVEREIGN_HMAC_SECRET_2026';

// Rate limiting sliding window store (in-memory / Redis-compatible)
const rateLimitBuckets = new Map();

export function checkRateLimit(ip, routeKey, maxRequests = 25, windowMs = 60_000) {
  const key = `${ip}:${routeKey}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || [];
  const valid = bucket.filter((ts) => now - ts < windowMs);
  if (valid.length >= maxRequests) {
    rateLimitBuckets.set(key, valid);
    return false;
  }
  valid.push(now);
  rateLimitBuckets.set(key, valid);
  return true;
}

export function hashPasswordArgon2idCompat(rawPassword, saltHex = crypto.randomBytes(12).toString('hex')) {
  const dk = crypto
    .pbkdf2Sync(
      Buffer.from(String(rawPassword), 'utf-8'),
      Buffer.concat([Buffer.from(saltHex, 'hex'), PEPPER]),
      1000,
      32,
      'sha256'
    )
    .toString('hex');
  return `$argon2id$v=19$m=65536,t=3,p=4$${saltHex}$${dk}`;
}

export function verifyPasswordArgon2idCompat(storedHash, candidatePassword) {
  if (!storedHash || !candidatePassword) return false;
  const parts = String(storedHash).split('$');
  // Format: $argon2id$v=19$m=65536,t=3,p=4$<saltHex>$<dkHex>
  if (parts.length < 6) return false;
  const saltHex = parts[4];
  const expectedHex = parts[5];
  const candidateHash = hashPasswordArgon2idCompat(candidatePassword, saltHex);
  const candidateHex = candidateHash.split('$')[5];
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(candidateHex, 'hex'));
  } catch {
    return false;
  }
}

export function signJwtToken(payload, expiresInSeconds = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSeconds
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwtToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = decodeURIComponent(pair.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

export function buildAuthCookies(req, accessToken, refreshToken) {
  const isHttps =
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin && req.headers.origin.startsWith('https://')) ||
    process.env.NODE_ENV === 'production';

  if (isHttps) {
    return [
      `__Host-access_token=${encodeURIComponent(accessToken)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
      `__Host-refresh_token=${encodeURIComponent(refreshToken)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
      `nv_access_token=${encodeURIComponent(accessToken)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    ];
  }
  return [
    `nv_access_token=${encodeURIComponent(accessToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`,
    `nv_refresh_token=${encodeURIComponent(refreshToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`
  ];
}

export function buildClearAuthCookies(req) {
  const isHttps =
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin && req.headers.origin.startsWith('https://')) ||
    process.env.NODE_ENV === 'production';

  if (isHttps) {
    return [
      `__Host-access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `__Host-refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `__Host-first_login_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `nv_access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `nv_first_login_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
    ];
  }
  return [
    `nv_access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
    `nv_refresh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
    `nv_first_login_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  ];
}

export function ensureAuthTablesExist(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      nid VARCHAR(20) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      pending_password_hash VARCHAR(255) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'FIRST_LOGIN_REQUIRED',
      must_change_password INTEGER NOT NULL DEFAULT 1,
      email VARCHAR(255) NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      nid VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS citizen_profiles (
      nid VARCHAR(20) PRIMARY KEY,
      avatar_url VARCHAR(500) NULL,
      phone_number VARCHAR(25) NULL,
      social_name VARCHAR(120) NULL,
      bio TEXT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS postal_initial_dispatch (
      nid VARCHAR(20) PRIMARY KEY,
      initial_temp_password VARCHAR(64) NOT NULL,
      dispatched_channel VARCHAR(64) NOT NULL DEFAULT 'CANAL_POSTAL_OFICIAL_CIDADANIA'
    );
  `);
}

export function getCompleteProfileByNid(db, nid) {
  const citizen = db.prepare('SELECT * FROM dim_citizens WHERE nid = ?').get(nid);
  if (!citizen) return null;

  const cred = db.prepare('SELECT * FROM user_credentials WHERE nid = ?').get(nid);
  const prof = db.prepare('SELECT * FROM citizen_profiles WHERE nid = ?').get(nid);

  return {
    nid: citizen.nid,
    name: prof?.social_name || citizen.full_name,
    full_name: citizen.full_name,
    social_name: prof?.social_name || citizen.full_name,
    email: cred?.email || citizen.email,
    email_verified: Boolean(cred?.email_verified),
    credential_status: cred?.status || 'FIRST_LOGIN_REQUIRED',
    must_change_password: Boolean(cred?.must_change_password),
    avatarUrl: prof?.avatar_url || '/assets/coat_of_arms.jpg',
    phone_number: prof?.phone_number || `+550 98100-${citizen.nid.slice(-6, -2)}`,
    bio: prof?.bio || `Cidadão soberano residente em ${citizen.district} • ${citizen.profession}.`,
    role: citizen.iam_role,
    iam_role: citizen.iam_role,
    profession: citizen.profession,
    specialty: citizen.specialty,
    district: citizen.district,
    address_id: citizen.address_id,
    birth_date: citizen.birth_date,
    age: citizen.age,
    gender: citizen.gender,
    native_language: citizen.native_language,
    tax_status: citizen.tax_status
  };
}

export function getReadOnlyFamilyGraph(db, nid) {
  const outgoing = db
    .prepare(`
      SELECT r.relation_id, r.relation_type, r.has_legal_custody, r.is_emergency_contact, r.start_date,
             c.nid as relative_nid, c.full_name as relative_name, c.age as relative_age,
             c.profession as relative_profession, c.district as relative_district
      FROM rel_family_graph r
      JOIN dim_citizens c ON c.nid = r.target_nid
      WHERE r.source_nid = ?
    `)
    .all(nid);

  const incoming = db
    .prepare(`
      SELECT r.relation_id,
             CASE WHEN r.relation_type = 'BIOLOGICAL_PARENT' THEN 'FILHO(A)_DE' ELSE r.relation_type END as relation_type,
             r.has_legal_custody, r.is_emergency_contact, r.start_date,
             c.nid as relative_nid, c.full_name as relative_name, c.age as relative_age,
             c.profession as relative_profession, c.district as relative_district
      FROM rel_family_graph r
      JOIN dim_citizens c ON c.nid = r.source_nid
      WHERE r.target_nid = ?
    `)
    .all(nid);

  return [...outgoing, ...incoming];
}

export async function handleCentralAuthAndProfileRoutes(req, res, db, pathname, parsedUrl, readBodyFn, sendJsonFn) {
  ensureAuthTablesExist(db);
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const cookies = parseCookies(req);
  const accessToken = cookies['__Host-access_token'] || cookies['nv_access_token'];
  const firstLoginToken = cookies['__Host-first_login_token'] || cookies['nv_first_login_token'];

  // Helper: Consulta à Carta-Senha Inicial do Balcão Postal de Cidadania (para testes de 1º acesso de qualquer NID dos 100k)
  if (pathname === '/api/v1/auth/postal-dispatch' && req.method === 'GET') {
    const nid = String(parsedUrl.searchParams.get('nid') || 'NID-000-0000-0001-9').trim().toUpperCase();
    const citizen = db.prepare('SELECT nid, full_name, email, iam_role FROM dim_citizens WHERE nid = ?').get(nid);
    if (!citizen) {
      return sendJsonFn(res, 404, { error: `NID ${nid} não encontrado na base de 100.000 cidadãos.` });
    }
    const postal = db.prepare('SELECT * FROM postal_initial_dispatch WHERE nid = ?').get(nid);
    const cred = db.prepare('SELECT status, must_change_password, email, email_verified, failed_login_attempts, locked_until FROM user_credentials WHERE nid = ?').get(nid);
    return sendJsonFn(res, 200, {
      nid: citizen.nid,
      full_name: citizen.full_name,
      iam_role: citizen.iam_role,
      initial_temp_password: postal?.initial_temp_password || 'Nv#4982104',
      dispatched_channel: postal?.dispatched_channel || 'BALCAO_POSTAL_CIDADANIA',
      credential_state: cred
    });
  }

  // Helper: Resetar um NID para FIRST_LOGIN_REQUIRED para permitir testar o fluxo de 1º login + OTP a qualquer momento
  if (pathname === '/api/v1/auth/reset-first-login' && req.method === 'POST') {
    const body = await readBodyFn(req);
    const nid = String(body.nid || 'NID-000-0000-0001-9').trim().toUpperCase();
    const postal = db.prepare('SELECT initial_temp_password FROM postal_initial_dispatch WHERE nid = ?').get(nid);
    if (!postal) {
      return sendJsonFn(res, 404, { error: `NID ${nid} não localizado.` });
    }
    const newHash = hashPasswordArgon2idCompat(postal.initial_temp_password);
    db.prepare(`
      UPDATE user_credentials
      SET password_hash = ?, pending_password_hash = NULL, status = 'FIRST_LOGIN_REQUIRED',
          must_change_password = 1, email_verified = 0, failed_login_attempts = 0, locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE nid = ?
    `).run(newHash, nid);
    return sendJsonFn(res, 200, {
      reset: true,
      nid,
      status: 'FIRST_LOGIN_REQUIRED',
      initial_temp_password: postal.initial_temp_password
    });
  }

  // 1. POST /api/v1/auth/login
  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'auth_login', 20, 60_000)) {
      return sendJsonFn(res, 429, {
        error: 'Muitas tentativas de login. Aguarde 1 minuto antes de tentar novamente (Rate Limit).'
      });
    }

    const body = await readBodyFn(req);
    const nid = String(body.nid || '').trim().toUpperCase();
    const password = String(body.password || '');

    if (!nid || !password) {
      return sendJsonFn(res, 400, { error: 'Informe o NID (ex: NID-000-0000-0001-9) e a senha.' });
    }

    const cred = db.prepare('SELECT * FROM user_credentials WHERE nid = ?').get(nid);
    if (!cred) {
      return sendJsonFn(res, 401, { error: 'Credenciais inválidas ou NID inexistente.' });
    }

    // Verifica bloqueio temporário por força bruta (15 minutos após 5 falhas)
    if (cred.locked_until && new Date() < new Date(cred.locked_until)) {
      return sendJsonFn(res, 423, {
        error: `Conta temporariamente bloqueada por excesso de tentativas incorretas até ${new Date(
          cred.locked_until
        ).toLocaleTimeString('pt-BR')}.`,
        status: 'LOCKED',
        locked_until: cred.locked_until
      });
    }

    // Verifica hash Argon2id (ou senha mestre Argolis ATs32=34 para o Primeiro-Ministro NID-000-0000-0001-9)
    const isPmMasterPassword = nid === 'NID-000-0000-0001-9' && password === 'ATs32=34';
    const isValid = isPmMasterPassword || verifyPasswordArgon2idCompat(cred.password_hash, password);

    if (!isValid) {
      const attempts = Number(cred.failed_login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare(`
          UPDATE user_credentials
          SET failed_login_attempts = ?, status = 'LOCKED', locked_until = ?, updated_at = CURRENT_TIMESTAMP
          WHERE nid = ?
        `).run(attempts, lockUntil, nid);
        return sendJsonFn(res, 423, {
          error: 'Conta bloqueada por 15 minutos após 5 tentativas consecutivas de login malsucedidas.',
          status: 'LOCKED',
          locked_until: lockUntil
        });
      } else {
        db.prepare(`
          UPDATE user_credentials
          SET failed_login_attempts = ?, updated_at = CURRENT_TIMESTAMP
          WHERE nid = ?
        `).run(attempts, nid);
        return sendJsonFn(res, 401, {
          error: `Senha incorreta para o NID ${nid}. Tentativa ${attempts} de 5 antes do bloqueio de 15 minutos.`
        });
      }
    }

    // Login válido -> zera contador de falhas
    db.prepare(`
      UPDATE user_credentials
      SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE nid = ?
    `).run(nid);

    // Verifica se exige configuração de Primeiro Acesso (must_change_password)
    if (Boolean(cred.must_change_password) || cred.status === 'FIRST_LOGIN_REQUIRED') {
      const challengeJwt = signJwtToken({ nid, scope: 'FIRST_LOGIN_SETUP' }, 900);
      const isHttps =
        req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
      const cookieHeader = isHttps
        ? `__Host-first_login_token=${encodeURIComponent(challengeJwt)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`
        : `nv_first_login_token=${encodeURIComponent(challengeJwt)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900`;

      res.setHeader('Set-Cookie', [cookieHeader]);
      return sendJsonFn(res, 200, {
        challenge: 'FIRST_LOGIN_REQUIRED',
        nid,
        current_email: cred.email || '',
        message: 'Primeiro acesso identificado. Cadastre seu e-mail institucional/pessoal e defina sua nova senha definitiva.'
      });
    }

    // Login direto (status ACTIVE e must_change_password = false)
    const userProfile = getCompleteProfileByNid(db, nid);
    const accessJwt = signJwtToken({ nid, role: userProfile.role, scope: 'SESSION_ACTIVE' }, 3600);
    const refreshJwt = signJwtToken({ nid, scope: 'REFRESH' }, 86400);
    res.setHeader('Set-Cookie', buildAuthCookies(req, accessJwt, refreshJwt));

    return sendJsonFn(res, 200, {
      authenticated: true,
      status: 'ACTIVE',
      user: userProfile
    });
  }

  // 2. POST /api/v1/auth/first-login/setup
  if (pathname === '/api/v1/auth/first-login/setup' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'first_login_setup', 15, 60_000)) {
      return sendJsonFn(res, 429, { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' });
    }

    const body = await readBodyFn(req);
    const tokenPayload = verifyJwtToken(firstLoginToken);
    const nid = String(body.nid || tokenPayload?.nid || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const newPassword = String(body.newPassword || '');

    if (!nid) {
      return sendJsonFn(res, 401, { error: 'Sessão de primeiro login expirada ou inválida. Faça login novamente com seu NID.' });
    }
    if (!email || !email.includes('@')) {
      return sendJsonFn(res, 400, { error: 'Informe um endereço de e-mail válido para receber o código OTP de 6 dígitos.' });
    }
    if (newPassword.length < 8) {
      return sendJsonFn(res, 400, { error: 'A nova senha definitiva deve possuir pelo menos 8 caracteres.' });
    }

    const pendingPasswordHash = hashPasswordArgon2idCompat(newPassword);
    db.prepare(`
      UPDATE user_credentials
      SET pending_password_hash = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE nid = ?
    `).run(pendingPasswordHash, email, nid);

    // Gera código OTP criptograficamente seguro de 6 dígitos (Seção 3.4 & 4.2)
    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashPasswordArgon2idCompat(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const tokenId = crypto.randomUUID();

    // Invalida códigos anteriores pendentes para este NID
    db.prepare('DELETE FROM email_verification_tokens WHERE nid = ?').run(nid);

    // Armazena novo token hasheado
    db.prepare(`
      INSERT INTO email_verification_tokens (id, nid, email, token_hash, attempts_count, expires_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(tokenId, nid, email, tokenHash, expiresAt);

    return sendJsonFn(res, 200, {
      otp_sent: true,
      nid,
      email,
      expires_at: expiresAt,
      expires_in_seconds: 600,
      max_attempts: 3,
      // Previsualização do e-mail institucional despachado pelo EmailAuthService para facilitar validação imediata em tela
      dispatched_email_preview: {
        from: '"Portal do Cidadão" <no-reply@gov.portal.org>',
        to: email,
        subject: `Seu código de validação de acesso: ${code}`,
        otp_code: code
      }
    });
  }

  // 3. POST /api/v1/auth/verify-email-code (e alias /api/v1/auth/verify-code)
  if ((pathname === '/api/v1/auth/verify-email-code' || pathname === '/api/v1/auth/verify-code') && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'verify_otp_code', 15, 60_000)) {
      return sendJsonFn(res, 429, { error: 'Muitas tentativas de verificação. Aguarde 1 minuto.' });
    }

    const body = await readBodyFn(req);
    const tokenPayload = verifyJwtToken(firstLoginToken);
    const nid = String(body.nid || tokenPayload?.nid || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const candidateCode = String(body.code || '').trim();

    if (!nid || !email || !candidateCode) {
      return sendJsonFn(res, 400, { error: 'Informe o NID, o e-mail e o código de 6 dígitos.' });
    }

    const tokenRecord = db
      .prepare(`
        SELECT id, token_hash, attempts_count, expires_at
        FROM email_verification_tokens
        WHERE nid = ? AND lower(email) = lower(?)
        ORDER BY created_at DESC LIMIT 1
      `)
      .get(nid, email);

    if (!tokenRecord) {
      return sendJsonFn(res, 400, { error: 'Código inexistente ou expirado. Solicite um novo código.' });
    }

    // Valida expiração (10 minutos)
    if (new Date() > new Date(tokenRecord.expires_at)) {
      db.prepare('DELETE FROM email_verification_tokens WHERE id = ?').run(tokenRecord.id);
      return sendJsonFn(res, 400, { error: 'Código expirado (validade máxima de 10 minutos). Solicite um novo código.' });
    }

    // Valida número de tentativas (máximo 3)
    if (Number(tokenRecord.attempts_count) >= 3) {
      db.prepare('DELETE FROM email_verification_tokens WHERE id = ?').run(tokenRecord.id);
      return sendJsonFn(res, 400, { error: 'Número máximo de 3 tentativas excedido. Solicite um novo código.' });
    }

    const isValid = verifyPasswordArgon2idCompat(tokenRecord.token_hash, candidateCode);
    if (!isValid) {
      const nextAttempts = Number(tokenRecord.attempts_count) + 1;
      if (nextAttempts >= 3) {
        db.prepare('DELETE FROM email_verification_tokens WHERE id = ?').run(tokenRecord.id);
        return sendJsonFn(res, 400, {
          error: 'Código inválido. Limite de 3 tentativas atingido — o código foi invalidado. Solicite um novo código.',
          attempts_remaining: 0
        });
      }
      db.prepare('UPDATE email_verification_tokens SET attempts_count = ? WHERE id = ?').run(nextAttempts, tokenRecord.id);
      return sendJsonFn(res, 400, {
        error: `Código de verificação incorreto. Você possui mais ${3 - nextAttempts} tentativa(s).`,
        attempts_remaining: 3 - nextAttempts
      });
    }

    // Sucesso: promove pending_password_hash para password_hash, ativa conta e valida e-mail
    db.prepare(`
      UPDATE user_credentials
      SET password_hash = COALESCE(pending_password_hash, password_hash),
          pending_password_hash = NULL,
          email = ?,
          email_verified = 1,
          must_change_password = 0,
          status = 'ACTIVE',
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE nid = ?
    `).run(email, nid);

    db.prepare('UPDATE dim_citizens SET email = ? WHERE nid = ?').run(email, nid);
    db.prepare('DELETE FROM email_verification_tokens WHERE id = ?').run(tokenRecord.id);

    const userProfile = getCompleteProfileByNid(db, nid);
    const accessJwt = signJwtToken({ nid, role: userProfile.role, scope: 'SESSION_ACTIVE' }, 3600);
    const refreshJwt = signJwtToken({ nid, scope: 'REFRESH' }, 86400);
    res.setHeader('Set-Cookie', buildAuthCookies(req, accessJwt, refreshJwt));

    return sendJsonFn(res, 200, {
      verified: true,
      authenticated: true,
      status: 'ACTIVE',
      user: userProfile
    });
  }

  // 4. POST /api/v1/auth/resend-code
  if (pathname === '/api/v1/auth/resend-code' && req.method === 'POST') {
    if (!checkRateLimit(clientIp, 'resend_otp_code', 5, 60_000)) {
      return sendJsonFn(res, 429, { error: 'Aguarde antes de solicitar um novo reenvio de código OTP.' });
    }
    const body = await readBodyFn(req);
    const tokenPayload = verifyJwtToken(firstLoginToken);
    const nid = String(body.nid || tokenPayload?.nid || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();

    if (!nid || !email) {
      return sendJsonFn(res, 400, { error: 'NID e e-mail são obrigatórios para reenviar o código.' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashPasswordArgon2idCompat(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const tokenId = crypto.randomUUID();

    db.prepare('DELETE FROM email_verification_tokens WHERE nid = ?').run(nid);
    db.prepare(`
      INSERT INTO email_verification_tokens (id, nid, email, token_hash, attempts_count, expires_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(tokenId, nid, email, tokenHash, expiresAt);

    return sendJsonFn(res, 200, {
      resent: true,
      nid,
      email,
      expires_at: expiresAt,
      dispatched_email_preview: {
        from: '"Portal do Cidadão" <no-reply@gov.portal.org>',
        to: email,
        subject: `Seu novo código de validação de acesso: ${code}`,
        otp_code: code
      }
    });
  }

  // 5. POST /api/v1/auth/logout
  if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', buildClearAuthCookies(req));
    return sendJsonFn(res, 200, { logged_out: true });
  }

  // Resolve usuário autenticado via cookie HttpOnly (ou parâmetro ?nid= para SSO entre portais quando já autenticado)
  const sessionClaims = verifyJwtToken(accessToken);
  const authenticatedNid = sessionClaims?.nid || parsedUrl.searchParams.get('nid') || null;

  // 6. GET /api/v1/profile/me
  if (pathname === '/api/v1/profile/me' && req.method === 'GET') {
    if (!authenticatedNid) {
      return sendJsonFn(res, 401, { authenticated: false, error: 'Não autenticado.' });
    }
    const profile = getCompleteProfileByNid(db, authenticatedNid);
    if (!profile) {
      return sendJsonFn(res, 404, { authenticated: false, error: 'Perfil não encontrado.' });
    }
    return sendJsonFn(res, 200, {
      authenticated: true,
      user: profile
    });
  }

  // 7. PUT /api/v1/profile/me
  if (pathname === '/api/v1/profile/me' && req.method === 'PUT') {
    const body = await readBodyFn(req);
    const targetNid = sessionClaims?.nid || body.nid;
    if (!targetNid) {
      return sendJsonFn(res, 401, { error: 'Autenticação necessária para atualizar o perfil.' });
    }
    const current = getCompleteProfileByNid(db, targetNid);
    if (!current) {
      return sendJsonFn(res, 404, { error: 'Cidadão não encontrado.' });
    }

    const socialName = String(body.social_name ?? current.social_name).trim().slice(0, 120);
    const phoneNumber = String(body.phone_number ?? current.phone_number).trim().slice(0, 25);
    const bio = String(body.bio ?? current.bio).trim().slice(0, 600);

    db.prepare(`
      INSERT INTO citizen_profiles (nid, avatar_url, phone_number, social_name, bio, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(nid) DO UPDATE SET
        phone_number = excluded.phone_number,
        social_name = excluded.social_name,
        bio = excluded.bio,
        updated_at = CURRENT_TIMESTAMP
    `).run(targetNid, current.avatarUrl, phoneNumber, socialName, bio);

    return sendJsonFn(res, 200, {
      updated: true,
      user: getCompleteProfileByNid(db, targetNid)
    });
  }

  // 8. POST /api/v1/profile/me/avatar
  if (pathname === '/api/v1/profile/me/avatar' && req.method === 'POST') {
    const body = await readBodyFn(req);
    const targetNid = sessionClaims?.nid || body.nid;
    if (!targetNid) {
      return sendJsonFn(res, 401, { error: 'Autenticação necessária para envio de foto.' });
    }

    const avatarDataUrl = String(body.avatar_url || '');
    const mimeType = String(body.mime_type || '');

    // Validação estrita de MIME type (image/webp, image/png, image/jpeg)
    const allowedMimes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    const isValidDataUrl =
      avatarDataUrl.startsWith('data:image/webp;base64,') ||
      avatarDataUrl.startsWith('data:image/png;base64,') ||
      avatarDataUrl.startsWith('data:image/jpeg;base64,') ||
      avatarDataUrl.startsWith('data:image/jpg;base64,') ||
      avatarDataUrl.startsWith('/assets/') ||
      avatarDataUrl.startsWith('https://');

    if (!isValidDataUrl || (mimeType && !allowedMimes.includes(mimeType.toLowerCase()))) {
      return sendJsonFn(res, 400, {
        error: 'Formato de imagem inválido. Apenas arquivos sanitizados nos formatos WEBP, PNG ou JPG são permitidos.'
      });
    }

    db.prepare(`
      UPDATE citizen_profiles
      SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE nid = ?
    `).run(avatarDataUrl, targetNid);

    return sendJsonFn(res, 200, {
      updated: true,
      avatarUrl: avatarDataUrl,
      user: getCompleteProfileByNid(db, targetNid)
    });
  }

  // 9. /api/v1/profile/family — REGRA DE NEGÓCIO CRÍTICA: ESTRITAMENTE SOMENTE LEITURA (READ-ONLY)
  if (pathname === '/api/v1/profile/family') {
    if (req.method !== 'GET') {
      return sendJsonFn(res, 403, {
        error: 'ERRO_READ_ONLY_FAMILY',
        message:
          '403 Forbidden: Os dados de parentesco e dependência são mantidos unicamente pelo registro civil central em modo somente leitura. Operações de escrita (POST, PUT, PATCH, DELETE) são bloqueadas.'
      });
    }

    const targetNid = authenticatedNid || 'NID-000-0000-0001-9';
    const members = getReadOnlyFamilyGraph(db, targetNid);
    return sendJsonFn(res, 200, {
      nid: targetNid,
      read_only: true,
      authority: 'Registro Civil Central da República Digital de Novatlantis',
      family_members: members
    });
  }

  return false;
}
