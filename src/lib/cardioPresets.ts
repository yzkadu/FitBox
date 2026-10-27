export interface CardioSegment {
  startMin: number;
  endMin: number;
  inclineSetting: number;
  speedKmh: number;
  instruction: string;
}
export interface CardioPreset {
  id: string;
  title: string;
  subtitle: string;
  durationMin: number;
  segments: readonly CardioSegment[];
}

/** Treino salvo da referência enviada. Inclinação = número mostrado no vídeo;
 * a unidade (% ou nível) depende do painel da esteira utilizada.
 */
export const CARDIO_PRESETS: readonly CardioPreset[] = [
  {
    id: 'esteira-inclinada-20-pos-treino',
    title: 'Esteira inclinada · 20 minutos',
    subtitle: 'Caminhada progressiva pós-musculação (ou cardio independente)',
    durationMin: 20,
    segments: [
      { startMin: 0, endMin: 4, inclineSetting: 6, speedKmh: 4.5,
        instruction: 'Encontre um ritmo confortável; reduza caso tenha terminado um treino exigente.' },
      { startMin: 4, endMin: 8, inclineSetting: 8, speedKmh: 4.8,
        instruction: 'Suba a inclinação gradualmente e mantenha as passadas estáveis.' },
      { startMin: 8, endMin: 12, inclineSetting: 10, speedKmh: 4.5,
        instruction: 'Continue caminhando sem se apoiar continuamente nas barras.' },
      { startMin: 12, endMin: 16, inclineSetting: 12, speedKmh: 4.2,
        instruction: 'Trecho mais exigente: diminua a inclinação se perder o controle da respiração.' },
      { startMin: 16, endMin: 20, inclineSetting: 6, speedKmh: 4.5,
        instruction: 'Reduza o esforço progressivamente; se necessário, finalize com caminhada mais leve.' },
    ],
  },
] as const;

export function cardioPresetLogNotes(preset: CardioPreset): string {
  const sections = preset.segments.map(s => {
    const speed = s.speedKmh.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return String(s.startMin) + '–' + String(s.endMin) + ' min: inclinação ' +
      String(s.inclineSetting) + ' · ' + speed + ' km/h';
  });
  return 'Treino pronto: ' + preset.title + '. ' + sections.join(' | ') +
    '. Inclinação conforme escala da esteira; velocidades em km/h.';
}
