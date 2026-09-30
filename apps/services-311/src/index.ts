import { createNovatlantisAuthMiddleware } from '@novatlantis/auth-client';

export const services311Agent = {
  serviceName: 'services-311',
  model: 'gemini-2.5-flash',
  middleware: createNovatlantisAuthMiddleware({
    jwtSecret: process.env.NOVATLANTIS_JWT_SECRET || 'dev-sovereign-secret',
    serviceName: 'Secretaria de Zeladoria Urbana (311)',
    minimumBiometricScore: 0.85,
  }),
  async triageUrbanIssue(description: string, district: string, lat: number, lng: number) {
    return {
      protocol: `NV-311-${Date.now()}`,
      district,
      coordinates: { lat, lng },
      responsibleDepartment: 'Secretaria de Infraestrutura & Smart Grid',
      estimatedRepairSlaHours: 4,
      summary: description,
    };
  },
};
