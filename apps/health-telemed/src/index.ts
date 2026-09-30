import * as crypto from 'crypto';
import { createNovatlantisAuthMiddleware } from '@novatlantis/auth-client';

export const healthTelemedService = {
  serviceName: 'health-telemed',
  model: 'gemini-2.5-pro-clinical',
  middleware: createNovatlantisAuthMiddleware({
    jwtSecret: process.env.NOVATLANTIS_JWT_SECRET || 'dev-sovereign-secret',
    serviceName: 'Ministério da Saúde Digital (Telemedicina)',
    minimumBiometricScore: 0.92,
  }),
  issueSignedPrescription(citizenNid: string, medicationPlan: string, doctorPublicKeyEd25519: string) {
    const payload = `${citizenNid}:${medicationPlan}:${Date.now()}`;
    const signature = crypto.createHash('sha256').update(payload + doctorPublicKeyEd25519).digest('base64');
    return {
      prescriptionId: `RX-NV-${Date.now()}`,
      citizenNid,
      medicationPlan,
      ed25519Signature: signature,
    };
  },
};
