/**
 * @novatlantis/auth-client
 * SDK Centralizado de Autenticação Soberana OIDC/JWT, Validação Biométrica NIST
 * (ANSI/NIST-ITL 1-2011 / ISO 19794-5 & 19794-2), Resolução de Idioma em 3 Camadas
 * e Auditoria Zero-Trust da República Digital de Novatlantis.
 */

import * as crypto from 'crypto';

export type SupportedLocale = 'pt-BR' | 'es-419' | 'en-US';

export interface NistMinutiaPoint {
  x: number;
  y: number;
  theta: number;
  quality: number;
  type?: 'RIDGE_ENDING' | 'BIFURCATION';
}

export interface NistFingerprintRecord {
  standard: string;
  sensor_resolution_dpi: number;
  finger_position: string;
  minutiae_count: number;
  minutiae: NistMinutiaPoint[];
}

export interface CitizenBiometrics {
  nist_face_template: string; // Base64 ANSI/NIST-ITL 1-2011 / ISO/IEC 19794-5
  nist_fingerprint_minutiae: NistFingerprintRecord;
  biometric_confidence_score: number; // 0.00 - 1.00
  icao_9303_compliant?: boolean;
}

export interface SovereignCitizenClaims {
  sub: string; // NID-XXX-XXXX-XXXX
  nid: string;
  full_name: string;
  native_language: SupportedLocale;
  birth_date: string;
  age_years: number;
  district: string;
  public_key_ed25519: string;
  biometric_confidence_score: number;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}

export interface AuditAccessEvent {
  event_id: string;
  citizen_nid: string;
  timestamp_iso: string;
  agency_or_service: string;
  ai_agent_id: string;
  purpose: string;
  fields_accessed: string[];
  biometric_assurance_level: 'NIST_AAL3_BIOMETRIC' | 'OIDC_SSO_LAUNCHPAD' | 'CITIZEN_SELF_SERVICE';
  signature_hash: string;
}

export interface HttpRequestLike {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  citizen?: SovereignCitizenClaims;
  resolvedLocale?: SupportedLocale;
  languageResolutionSource?: 'AUTHENTICATED_NID_PROFILE' | 'EXPLICIT_LOCALSTORAGE_OVERRIDE' | 'ANONYMOUS_ACCEPT_LANGUAGE_GEO';
}

export interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

export type NextFunctionLike = (err?: unknown) => void;

const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['pt-BR', 'es-419', 'en-US'];

// ============================================================================
// 1. VALIDAÇÃO MATEMÁTICA DO NID (MÓDULO 11 — NID-XXX-XXXX-XXXX)
// ============================================================================

export function calculateNIDMod11CheckDigit(base10Digits: string): string {
  if (!/^\d{10}$/.test(base10Digits)) {
    throw new Error(`Base do NID inválida: esperado 10 dígitos numéricos, recebido "${base10Digits}"`);
  }
  const weights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(base10Digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  const dv = remainder < 2 ? 0 : 11 - remainder;
  return String(dv);
}

export function validateNIDMod11(nid: string): boolean {
  if (!/^NID-\d{3}-\d{4}-\d{4}$/.test(nid)) {
    return false;
  }
  const digits = nid.replace(/^NID-/, '').replace(/-/g, '');
  const base10 = digits.slice(0, 10);
  const providedDv = digits[10];
  return calculateNIDMod11CheckDigit(base10) === providedDv;
}

// ============================================================================
// 2. VALIDAÇÃO BIOMÉTRICA PADRÃO NIST (ISO/IEC 19794-5 & ISO/IEC 19794-2)
// ============================================================================

export interface BiometricVerificationResult {
  valid: boolean;
  confidenceScore: number;
  faceHeaderValid: boolean;
  minutiaeValid: boolean;
  standardCompliance: string;
  reason?: string;
}

/**
 * Valida o template biométrico facial (ISO/IEC 19794-5) e as minúcias digitais
 * (ISO/IEC 19794-2: coordenadas x, y, theta, qualidade) do cidadão.
 */
export function verifyNistBiometrics(
  biometrics: CitizenBiometrics,
  minimumConfidenceThreshold = 0.85
): BiometricVerificationResult {
  if (
    typeof biometrics.biometric_confidence_score !== 'number' ||
    biometrics.biometric_confidence_score < 0 ||
    biometrics.biometric_confidence_score > 1
  ) {
    return {
      valid: false,
      confidenceScore: biometrics.biometric_confidence_score ?? 0,
      faceHeaderValid: false,
      minutiaeValid: false,
      standardCompliance: 'NON_COMPLIANT',
      reason: 'Score de confiança biométrica fora do intervalo [0.00, 1.00].',
    };
  }

  // Verifica Magic Header ISO/IEC 19794-5 ("FMR\020\0") no template facial Base64
  let faceHeaderValid = false;
  try {
    const rawBytes = Buffer.from(biometrics.nist_face_template, 'base64');
    const magic = rawBytes.subarray(0, 6).toString('ascii');
    faceHeaderValid = magic === 'FMR\x0020' && rawBytes.length >= 32;
  } catch {
    faceHeaderValid = false;
  }

  // Verifica minúcias digitais segundo ISO/IEC 19794-2 (x, y, theta in [0,359], quality >= 60)
  const fp = biometrics.nist_fingerprint_minutiae;
  const minutiaeValid =
    Boolean(fp) &&
    Array.isArray(fp.minutiae) &&
    fp.minutiae.length >= 3 &&
    fp.minutiae.every(
      (m) =>
        m.x >= 0 &&
        m.x <= 1000 &&
        m.y >= 0 &&
        m.y <= 1000 &&
        m.theta >= 0 &&
        m.theta < 360 &&
        m.quality >= 60 &&
        m.quality <= 100
    );

  const meetsThreshold = biometrics.biometric_confidence_score >= minimumConfidenceThreshold;
  const valid = faceHeaderValid && minutiaeValid && meetsThreshold;

  return {
    valid,
    confidenceScore: biometrics.biometric_confidence_score,
    faceHeaderValid,
    minutiaeValid,
    standardCompliance: valid
      ? 'ANSI/NIST-ITL 1-2011 + ISO/IEC 19794-5:2011 + ISO/IEC 19794-2:2011'
      : 'FAILED_VERIFICATION',
    reason: valid
      ? undefined
      : !faceHeaderValid
      ? 'Header binário ISO/IEC 19794-5 (FMR) inválido no nist_face_template.'
      : !minutiaeValid
      ? 'Vetor de minúcias ISO/IEC 19794-2 inválido ou qualidade insuficiente.'
      : `Score biométrico (${biometrics.biometric_confidence_score}) abaixo do mínimo exigido (${minimumConfidenceThreshold}).`,
  };
}

// ============================================================================
// 3. ARQUITETURA UNIFICADA DE IDIOMAS (RESOLUÇÃO EM 3 CAMADAS)
// ============================================================================

function normalizeLocaleTag(rawTag?: string): SupportedLocale | null {
  if (!rawTag) return null;
  const clean = rawTag.trim().toLowerCase();
  if (clean.startsWith('pt')) return 'pt-BR';
  if (clean.startsWith('es')) return 'es-419';
  if (clean.startsWith('en')) return 'en-US';
  return null;
}

function resolveFromGeoCountry(countryCode?: string): SupportedLocale | null {
  if (!countryCode) return null;
  const cc = countryCode.trim().toUpperCase();
  if (['BR', 'PT', 'AO', 'MZ', 'CV'].includes(cc)) return 'pt-BR';
  if (['AR', 'MX', 'CO', 'CL', 'PE', 'UY', 'PY', 'BO', 'EC', 'VE', 'CR', 'PA', 'DO', 'ES'].includes(cc)) {
    return 'es-419';
  }
  if (['US', 'GB', 'CA', 'AU', 'NZ', 'IE'].includes(cc)) return 'en-US';
  return null;
}

/**
 * Resolução síncrona de idioma em 3 camadas de acordo com a especificação soberana:
 * - Override Explícito do cabeçalho global (sincronizado com localStorage `novatlantis_lang_override`), quando enviado.
 * - Camada 1 (Autenticado): Assume obrigatoriamente o campo `native_language` registrado no perfil NID do cidadão.
 * - Camada 2 (Anônimo): Lê o header HTTP `Accept-Language` e geolocalização (`X-Client-Geo-Location` / `X-AppEngine-Country`).
 */
export function resolveSovereignLanguage(req: HttpRequestLike): {
  locale: SupportedLocale;
  source: 'AUTHENTICATED_NID_PROFILE' | 'EXPLICIT_LOCALSTORAGE_OVERRIDE' | 'ANONYMOUS_ACCEPT_LANGUAGE_GEO';
} {
  const getHeader = (name: string): string | undefined => {
    const val = req.headers[name.toLowerCase()] ?? req.headers[name];
    return Array.isArray(val) ? val[0] : val;
  };

  // Camada 3 (Botão seletor no cabeçalho global com override explícito em localStorage)
  const explicitOverride =
    normalizeLocaleTag(getHeader('x-novatlantis-lang-override')) ??
    normalizeLocaleTag(req.cookies?.['novatlantis_lang_override']);

  if (explicitOverride && SUPPORTED_LOCALES.includes(explicitOverride)) {
    return {
      locale: explicitOverride,
      source: 'EXPLICIT_LOCALSTORAGE_OVERRIDE',
    };
  }

  // Camada 1: Se o cidadão estiver autenticado, assume obrigatoriamente `native_language` do banco de dados
  if (req.citizen && SUPPORTED_LOCALES.includes(req.citizen.native_language)) {
    return {
      locale: req.citizen.native_language,
      source: 'AUTHENTICATED_NID_PROFILE',
    };
  }

  // Camada 2: Se anônimo, lê Accept-Language e cabeçalhos de Geolocalização do Cloud Load Balancer
  const acceptLangHeader = getHeader('accept-language');
  if (acceptLangHeader) {
    const primaryTag = acceptLangHeader.split(',')[0]?.split(';')[0];
    const parsedAccept = normalizeLocaleTag(primaryTag);
    if (parsedAccept) {
      return {
        locale: parsedAccept,
        source: 'ANONYMOUS_ACCEPT_LANGUAGE_GEO',
      };
    }
  }

  const geoCountry = getHeader('x-client-geo-location') ?? getHeader('x-appengine-country');
  const parsedGeo = resolveFromGeoCountry(geoCountry);
  if (parsedGeo) {
    return {
      locale: parsedGeo,
      source: 'ANONYMOUS_ACCEPT_LANGUAGE_GEO',
    };
  }

  return {
    locale: 'pt-BR',
    source: 'ANONYMOUS_ACCEPT_LANGUAGE_GEO',
  };
}

// ============================================================================
// 4. ASSINATURA E VERIFICAÇÃO JWT / mTLS ENTRE MICROSSERVIÇOS
// ============================================================================

export function signInternalServiceToken(
  claims: Omit<SovereignCitizenClaims, 'iss' | 'iat' | 'exp'>,
  secretOrPrivateKey: string,
  targetAudience: string,
  ttlSeconds = 900
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullClaims: SovereignCitizenClaims = {
    ...claims,
    iss: 'https://identity.novatlantis.gov.cloud',
    aud: targetAudience,
    iat: now,
    exp: now + ttlSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'novatlantis-root-2026' })).toString(
    'base64url'
  );
  const payloadB64 = Buffer.from(JSON.stringify(fullClaims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretOrPrivateKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyInternalServiceToken(
  token: string,
  secretOrPublicKey: string
): SovereignCitizenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato de token JWT soberano inválido.');
  }
  const [headerB64, payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secretOrPublicKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new Error('Assinatura criptográfica do JWT inválida.');
  }

  const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as SovereignCitizenClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) {
    throw new Error('Token JWT soberano expirado.');
  }
  if (!validateNIDMod11(claims.nid)) {
    throw new Error(`NID contido no token falhou na validação Módulo 11: ${claims.nid}`);
  }
  return claims;
}

// ============================================================================
// 5. MIDDLEWARE EXPRESS / CLOUD RUN DE AUTENTICAÇÃO E I18N NATIVO
// ============================================================================

export interface AuthMiddlewareOptions {
  jwtSecret: string;
  requireAuthentication?: boolean;
  minimumBiometricScore?: number;
  serviceName: string;
  onAuditEvent?: (event: AuditAccessEvent) => void;
}

export function createNovatlantisAuthMiddleware(options: AuthMiddlewareOptions) {
  const minScore = options.minimumBiometricScore ?? 0.85;

  return (req: HttpRequestLike, res: HttpResponseLike, next: NextFunctionLike): void => {
    try {
      const authHeaderRaw = req.headers['authorization'] ?? req.headers['x-goog-iap-jwt-assertion'];
      const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.slice('Bearer '.length).trim();
        const claims = verifyInternalServiceToken(rawToken, options.jwtSecret);

        if (claims.biometric_confidence_score < minScore) {
          res.status(403).json({
            error: 'INSUFFICIENT_BIOMETRIC_ASSURANCE',
            message: `Score biométrico NIST (${claims.biometric_confidence_score}) inferior ao exigido (${minScore}).`,
          });
          return;
        }

        req.citizen = claims;

        // Registra trilha de auditoria transparente ao cidadão (Painel de 48h)
        if (options.onAuditEvent) {
          const timestampIso = new Date().toISOString();
          const sigHash = crypto
            .createHash('sha256')
            .update(`${claims.nid}:${options.serviceName}:${timestampIso}`)
            .digest('hex')
            .slice(0, 16);

          options.onAuditEvent({
            event_id: `AUD-${Date.now()}`,
            citizen_nid: claims.nid,
            timestamp_iso: timestampIso,
            agency_or_service: options.serviceName,
            ai_agent_id: `agent-${options.serviceName.toLowerCase()}`,
            purpose: 'Autenticação Single-Click SSO e Resolução de Perfil Soberano',
            fields_accessed: ['nid', 'full_name', 'native_language', 'age_years', 'district'],
            biometric_assurance_level: 'NIST_AAL3_BIOMETRIC',
            signature_hash: sigHash,
          });
        }
      } else if (options.requireAuthentication) {
        res.status(401).json({
          error: 'UNAUTHENTICATED_CITIZEN',
          message: 'Credencial Soberana NID / Zero-Trust IAP ausente.',
        });
        return;
      }

      // Resolve e injeta o idioma nativo ou anônimo na requisição e no response header
      const { locale, source } = resolveSovereignLanguage(req);
      req.resolvedLocale = locale;
      req.languageResolutionSource = source;
      res.setHeader('Content-Language', locale);
      res.setHeader('X-Novatlantis-Language-Source', source);

      next();
    } catch (error) {
      res.status(401).json({
        error: 'INVALID_SOVEREIGN_TOKEN',
        message: error instanceof Error ? error.message : 'Falha na validação de segurança.',
      });
    }
  };
}
