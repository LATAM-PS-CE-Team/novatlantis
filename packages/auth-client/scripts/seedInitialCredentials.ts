// scripts/seedInitialCredentials.ts
import crypto from 'crypto';
import argon2 from 'argon2';
import { db } from '../src/database';

export function generateSecureRandomPassword(length = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

export async function migrateCitizensToAuth() {
  const citizens = await db.query(
    'SELECT nid FROM citizens WHERE nid NOT IN (SELECT nid FROM user_credentials)'
  );

  console.log(`Iniciando migração de ${citizens.rows.length} cidadãos...`);

  for (const citizen of citizens.rows) {
    const rawTempPassword = generateSecureRandomPassword(12);
    const passwordHash = await argon2.hash(rawTempPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });

    await db.query(
      `INSERT INTO user_credentials 
       (nid, password_hash, status, must_change_password, email_verified)
       VALUES ($1, $2, 'FIRST_LOGIN_REQUIRED', true, false)`,
      [citizen.nid, passwordHash]
    );

    // NOTA: Em produção, o segredo temporário pode ser gerado no balcão de atendimento
    // ou exportado criptografado para o canal postal oficial de cidadania.
  }

  console.log('Migração concluída com sucesso.');
}
