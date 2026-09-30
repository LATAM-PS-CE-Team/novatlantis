/**
 * @novatlantis/shared-ui
 * Sistema de Identidade Visual Oficial da República Digital de Novatlantis
 * Lema Constitucional: "NOVATLANTIS • LIBERTAS IN DIGITALI"
 * Arquitetura Visual: Nação AI-First da Era Agêntica (Heraldry + Neural Constellation)
 */

export const NOVATLANTIS_HERALDRY = {
  motto: 'NOVATLANTIS • LIBERTAS IN DIGITALI',
  mottoTranslations: {
    'pt-BR': 'Novatlantis • Liberdade na Era Digital',
    'es-419': 'Novatlantis • Libertad en la Era Digital',
    'en-US': 'Novatlantis • Liberty in the Digital Age',
  },
  flagAssetPath: '/assets/flag-novatlantis.jpg',
  coatOfArmsAssetPath: '/assets/coat-of-arms-novatlantis.jpg',
  symbolism: {
    neuralConstellation:
      '9 Nós Neurais Dourados interconectados em malha completa (8 Agentes Ministeriais Autônomos orbitando o Cidadão Soberano no centro), envoltos pela Coroa de Louros Prateada da Democracia Cívica.',
    sovereignEagle:
      'Águia Dourada e Azul-Atlântico sob o Sol Nascente da IA, empunhando a Chave Criptográfica Ed25519 (Soberania de Dados) e a Onda Oceânica (Sustentabilidade Azul).',
    shieldDexter:
      'Campo Azul-Cobalto com Caduceu Prateado e Balança Dourada (Saúde Digital, Equidade e Justiça Algorítmica).',
    shieldSinister:
      'Campo Verde-Esmeralda com a Árvore Cibernética da Vida enraizada na terra e ascendendo às Nuvens Soberanas do Google Cloud.',
  },
} as const;

export const NOVATLANTIS_DESIGN_TOKENS = {
  colors: {
    // Extraídos diretamente da Bandeira e do Brasão Oficial de Novatlantis
    royalCobaltFlag: '#082F72',
    sovereignDeepNavy: '#051533',
    oceanicCyanHoist: '#009EE0',
    neuralGoldNode: '#FBBF24',
    heraldicAmberGold: '#D97706',
    cyberTreeEmerald: '#046A38',
    cyberCircuitTeal: '#0D9488',
    laurelSilver: '#CBD5E1',
    surfaceLight: '#F8FAFC',
    emergencyHighContrastRed: '#DC2626',
    emergencyHighContrastBg: '#09090B',
  },
  typography: {
    headingFont: '"Space Grotesk", "Public Sans", "Inter", system-ui, sans-serif',
    serifMottoFont: '"Cinzel", "Playfair Display", Georgia, serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    monoFont: '"JetBrains Mono", monospace',
  },
  districts: [
    'Distrito Tecnológico',
    'Distrito Oceânico',
    'Colina da Justiça',
    'Porto Solar',
    'Vale da Inovação',
    'Bosque Esmeralda',
  ] as const,
};
