import {
  validateNIDMod11,
  verifyNistBiometrics,
  signInternalServiceToken,
  createNovatlantisAuthMiddleware,
} from '@novatlantis/auth-client';

export const identityNidService = {
  serviceName: 'identity-nid',
  validateNIDMod11,
  verifyNistBiometrics,
  signInternalServiceToken,
  middleware: createNovatlantisAuthMiddleware({
    jwtSecret: process.env.NOVATLANTIS_JWT_SECRET || 'dev-sovereign-secret',
    serviceName: 'Secretaria de Identidade Soberana (NID)',
    minimumBiometricScore: 0.90,
  }),
};
