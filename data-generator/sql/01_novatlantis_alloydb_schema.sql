-- =============================================================================
-- REPÚBLICA DIGITAL DE NOVATLANTIS
-- ESQUEMA OFICIAL ALLOYDB FOR POSTGRESQL 15 (OLTP + HTAP COLUMNAR + AI VECTOR)
-- Cluster: projects/novatlantis/locations/us-central1/clusters/novatlantis-sovereign-cluster
-- Instância Primária: novatlantis-primary-01
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Extensões nativas do Google Cloud AlloyDB AI & ScaNN Vector Search
-- CREATE EXTENSION IF NOT EXISTS "vector";
-- CREATE EXTENSION IF NOT EXISTS "alloydb_scann";
-- CREATE EXTENSION IF NOT EXISTS "google_ml_integration";
-- CREATE EXTENSION IF NOT EXISTS "google_columnar_engine";

-- 1. TABELA MESTRA DE CIDADÃOS (100.000 REGISTROS SOBERANOS)
CREATE TABLE IF NOT EXISTS dim_citizens (
    nid VARCHAR(25) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    age_years INTEGER NOT NULL,
    age_months INTEGER NOT NULL,
    age_group VARCHAR(60) NOT NULL,
    native_language VARCHAR(12) NOT NULL DEFAULT 'pt-BR',
    mother_name VARCHAR(255),
    father_name VARCHAR(255),
    spouse_nid VARCHAR(25),
    household_id VARCHAR(32),
    district VARCHAR(120) NOT NULL,
    street_address TEXT NOT NULL,
    postal_code VARCHAR(32) NOT NULL,
    avatar_url TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profession VARCHAR(120) NOT NULL,
    iam_role VARCHAR(64) NOT NULL DEFAULT 'CITIZEN_COMMON',
    education_level VARCHAR(120),
    blood_type VARCHAR(8),
    triage_risk_level VARCHAR(32),
    biometric_confidence_score NUMERIC(5,4) NOT NULL,
    nist_face_template TEXT NOT NULL,
    nist_fingerprint_minutiae JSONB NOT NULL,
    ed25519_public_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alloydb_citizens_district ON dim_citizens(district);
CREATE INDEX IF NOT EXISTS idx_alloydb_citizens_role ON dim_citizens(iam_role);
CREATE INDEX IF NOT EXISTS idx_alloydb_citizens_household ON dim_citizens(household_id);
CREATE INDEX IF NOT EXISTS idx_alloydb_citizens_email ON dim_citizens(email);

-- 2. CREDENCIAIS E SEGURANÇA ZERO-TRUST (ARGON2ID)
CREATE TABLE IF NOT EXISTS user_credentials (
    citizen_id VARCHAR(25) PRIMARY KEY REFERENCES dim_citizens(nid) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'FIRST_LOGIN_REQUIRED',
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. TOKENS DE VERIFICAÇÃO OTP DE 6 DÍGITOS (10 MINUTOS)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token_id VARCHAR(64) PRIMARY KEY,
    citizen_id VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid) ON DELETE CASCADE,
    email_target VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alloydb_otp_lookup ON email_verification_tokens(citizen_id, verification_code);

-- 4. PERFIL SOCIAL E AVATAR CUSTOMIZADO DO CIDADÃO
CREATE TABLE IF NOT EXISTS citizen_profiles (
    citizen_id VARCHAR(25) PRIMARY KEY REFERENCES dim_citizens(nid) ON DELETE CASCADE,
    avatar_url VARCHAR(512) NULL,
    preferred_name VARCHAR(150) NULL,
    phone_number VARCHAR(30) NULL,
    preferred_language VARCHAR(10) DEFAULT 'pt-BR',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. LOTE POSTAL DE SENHA INICIAL (SEEDING 100K)
CREATE TABLE IF NOT EXISTS postal_initial_dispatch (
    citizen_id VARCHAR(25) PRIMARY KEY REFERENCES dim_citizens(nid) ON DELETE CASCADE,
    initial_password_cleartext VARCHAR(64) NOT NULL,
    dispatched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. ZELADORIA URBANA 311
CREATE TABLE IF NOT EXISTS fact_311_requests (
    ticket_id VARCHAR(32) PRIMARY KEY,
    citizen_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    category VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    district VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL,
    assigned_department VARCHAR(160) NOT NULL,
    ai_triage_summary TEXT,
    estimated_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. DESPACHO DE EMERGÊNCIAS 911
CREATE TABLE IF NOT EXISTS fact_911_dispatches (
    dispatch_id VARCHAR(32) PRIMARY KEY,
    citizen_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    emergency_type VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    district VARCHAR(120) NOT NULL,
    unit_dispatched VARCHAR(120) NOT NULL,
    eta_minutes INTEGER NOT NULL,
    ai_voice_transcript TEXT,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRONTUÁRIO E TELEMEDICINA AGÊNTICA (HL7 FHIR)
CREATE TABLE IF NOT EXISTS fact_telemed_sessions (
    consult_id VARCHAR(32) PRIMARY KEY,
    patient_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    doctor_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    specialty VARCHAR(120) NOT NULL,
    clinical_summary TEXT NOT NULL,
    icd10_code VARCHAR(16) NOT NULL,
    prescription_code VARCHAR(64) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. AVALIAÇÕES E DESEMPENHO ESCOLAR (INTEGRAÇÃO GDP / MOODLE)
CREATE TABLE IF NOT EXISTS fact_edu_assessments (
    assessment_id VARCHAR(32) PRIMARY KEY,
    student_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    teacher_nid VARCHAR(25) NOT NULL REFERENCES dim_citizens(nid),
    school_name VARCHAR(180) NOT NULL,
    grade_level VARCHAR(80) NOT NULL,
    score_mathematics NUMERIC(5,2) NOT NULL,
    score_sciences NUMERIC(5,2) NOT NULL,
    score_ai_robotics NUMERIC(5,2) NOT NULL,
    score_languages NUMERIC(5,2) NOT NULL,
    attendance_rate NUMERIC(5,2) NOT NULL,
    ai_tutor_recommendation TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. GOVERNANÇA IDENTIDADE 360 (RBAC/ABAC)
CREATE TABLE IF NOT EXISTS gov_iam_roles (
    nid VARCHAR(25) PRIMARY KEY REFERENCES dim_citizens(nid),
    iam_role VARCHAR(64) NOT NULL,
    granted_by_nid VARCHAR(25) NOT NULL,
    profession_context VARCHAR(120),
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. TRILHA DE AUDITORIA IMUTÁVEL
CREATE TABLE IF NOT EXISTS fact_audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    actor_nid VARCHAR(25) NOT NULL,
    target_nid VARCHAR(25) NOT NULL,
    agency VARCHAR(160) NOT NULL,
    action VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
