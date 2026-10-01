// src/services/emailAuthService.ts
import crypto from 'crypto';
import argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { db } from '../database';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailAuthService {
  /**
   * Gera código seguro de 6 dígitos, salva hash e despacha via SMTP
   */
  static async sendVerificationCode(nid: string, email: string): Promise<void> {
    // 1. Gera código numérico seguro de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Invalida códigos anteriores pendentes
    await db.query('DELETE FROM email_verification_tokens WHERE nid = $1', [nid]);

    // Armazena novo token
    await db.query(
      `INSERT INTO email_verification_tokens (nid, email, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [nid, email, tokenHash, expiresAt]
    );

    // 2. Dispara e-mail
    await transporter.sendMail({
      from: '"Portal do Cidadão" <no-reply@gov.portal.org>',
      to: email,
      subject: `Seu código de validação de acesso: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Validação de E-mail Institucional</h2>
          <p style="color: #475569;">Você está configurando o primeiro acesso ao Portal do Cidadão para o NID: <strong>${nid}</strong>.</p>
          <p style="color: #475569;">Utilize o código de verificação abaixo para confirmar sua identidade:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #1e40af; background: #eff6ff; padding: 16px; border-radius: 6px; margin: 24px 0;">
            ${code}
          </div>
          <p style="color: #94a3b8; font-size: 13px;">O código é válido por 10 minutos. Nunca compartilhe este código com terceiros.</p>
        </div>
      `,
    });
  }

  /**
   * Valida código informado pelo usuário no front-end
   */
  static async verifyCode(nid: string, email: string, candidateCode: string): Promise<boolean> {
    const res = await db.query(
      `SELECT id, token_hash, attempts_count, expires_at 
       FROM email_verification_tokens 
       WHERE nid = $1 AND email = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [nid, email]
    );

    if (res.rowCount === 0) {
      throw new Error('Código inexistente ou expirado.');
    }

    const tokenRecord = res.rows[0];

    // Valida expiração
    if (new Date() > new Date(tokenRecord.expires_at)) {
      await db.query('DELETE FROM email_verification_tokens WHERE id = $1', [tokenRecord.id]);
      throw new Error('Código expirado. Solicite um novo código.');
    }

    // Valida número de tentativas (máximo 3)
    if (tokenRecord.attempts_count >= 3) {
      await db.query('DELETE FROM email_verification_tokens WHERE id = $1', [tokenRecord.id]);
      throw new Error('Número de tentativas excedido. Solicite um novo código.');
    }

    const isValid = await argon2.verify(tokenRecord.token_hash, candidateCode);

    if (!isValid) {
      await db.query(
        'UPDATE email_verification_tokens SET attempts_count = attempts_count + 1 WHERE id = $1',
        [tokenRecord.id]
      );
      return false;
    }

    // Sucesso: atualiza credenciais do cidadão
    await db.query(
      `UPDATE user_credentials 
       SET email = $1, email_verified = true, must_change_password = false, status = 'ACTIVE', updated_at = NOW() 
       WHERE nid = $2`,
      [email, nid]
    );

    // Remove token já utilizado
    await db.query('DELETE FROM email_verification_tokens WHERE id = $1', [tokenRecord.id]);

    return true;
  }
}
