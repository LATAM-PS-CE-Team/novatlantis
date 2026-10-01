-- =============================================================================
-- REPÚBLICA DIGITAL DE NOVATLANTIS — MÓDULO CENTRAL DE AUTENTICAÇÃO E PERFIL
-- Especificação Técnica: Seção 2.1 (Extensões de Schema PostgreSQL / Relacional)
-- =============================================================================

-- Extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de credenciais e segurança de acesso
CREATE TABLE IF NOT EXISTS user_credentials (
    nid VARCHAR(20) PRIMARY KEY, -- Ex: NID-000-0000-0001-9
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'FIRST_LOGIN_REQUIRED', -- ACTIVE, LOCKED, FIRST_LOGIN_REQUIRED
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    email VARCHAR(255) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nid) REFERENCES dim_citizens(nid) ON DELETE CASCADE
);

-- Tabela para verificação de OTP de e-mail e recuperação
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nid VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL, -- Código de 6 dígitos hasheado (Argon2id)
    attempts_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nid) REFERENCES dim_citizens(nid) ON DELETE CASCADE
);

-- Tabela de perfil complementar e mídia
CREATE TABLE IF NOT EXISTS citizen_profiles (
    nid VARCHAR(20) PRIMARY KEY,
    avatar_url VARCHAR(500) NULL,
    phone_number VARCHAR(25) NULL,
    social_name VARCHAR(120) NULL,
    bio TEXT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nid) REFERENCES dim_citizens(nid) ON DELETE CASCADE
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_nid ON email_verification_tokens(nid, expires_at);
