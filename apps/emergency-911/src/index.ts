import { createNovatlantisAuthMiddleware } from '@novatlantis/auth-client';

export const emergency911Service = {
  serviceName: 'emergency-911',
  model: 'gemini-2.5-flash-live-voice',
  middleware: createNovatlantisAuthMiddleware({
    jwtSecret: process.env.NOVATLANTIS_JWT_SECRET || 'dev-sovereign-secret',
    serviceName: 'Comando Tático de Emergências (911)',
    minimumBiometricScore: 0.80,
  }),
  async dispatchEmergencyUnit(citizenNid: string, transcript: string, lat: number, lng: number) {
    return {
      incidentId: `SOS-911-${Date.now()}`,
      citizenNid,
      triageCategory: 'MEDICAL_OR_TACTICAL_PRIORITY_1',
      dispatchedUnits: ['AMB-NV-01', 'DRONE-MED-02'],
      coordinates: { lat, lng },
      transcript,
    };
  },
};
