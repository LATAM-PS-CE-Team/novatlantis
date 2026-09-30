import { createNovatlantisAuthMiddleware } from '@novatlantis/auth-client';

export const educationLearnService = {
  serviceName: 'education-learn',
  model: 'gemini-2.5-pro-tutor',
  middleware: createNovatlantisAuthMiddleware({
    jwtSecret: process.env.NOVATLANTIS_JWT_SECRET || 'dev-sovereign-secret',
    serviceName: 'Ministério da Educação e Tutoria Adaptativa',
    minimumBiometricScore: 0.85,
  }),
  buildAgeAdaptiveCurriculum(ageYears: number, locale: 'pt-BR' | 'es-419' | 'en-US') {
    if (ageYears <= 8) {
      return { level: 'EARLY_LITERACY_GAMIFIED', locale, ageYears };
    }
    if (ageYears <= 17) {
      return { level: 'K12_STEM_AND_ROBOTICS', locale, ageYears };
    }
    return { level: 'UNIVERSITY_AND_QUANTUM_AI_RESEARCH', locale, ageYears };
  },
};
