// Ilustração original (SVG gerado por código, sem nenhuma arte de terceiros)
// de uma silhueta genérica que muda de proporção de acordo com as medidas
// corporais mais recentes registradas pela pessoa. É só uma representação
// visual aproximada — não uma imagem real do corpo de ninguém.

import type { BodyMeasurement } from '../types';

export type SilhouetteGender = 'feminino' | 'masculino';

const REFERENCE: Record<SilhouetteGender, { chest: number; waist: number; hip: number; arm: number; thigh: number; calf: number }> = {
  masculino: { chest: 100, waist: 85, hip: 96, arm: 32, thigh: 56, calf: 37 },
  feminino: { chest: 90, waist: 72, hip: 98, arm: 27, thigh: 56, calf: 35 },
};

function clampScale(v: number): number {
  return Math.min(1.28, Math.max(0.8, v));
}

function scaleFor(value: number | undefined, refValue: number): number {
  if (!value || value <= 0) return 1;
  return clampScale(value / refValue);
}

export function BodySilhouette({ measurement, gender }: { measurement: BodyMeasurement | null; gender: SilhouetteGender }) {
  const ref = REFERENCE[gender];

  const chestScale = scaleFor(measurement?.chestCm, ref.chest);
  const waistScale = scaleFor(measurement?.waistCm, ref.waist);
  const hipScale = scaleFor(measurement?.hipCm, ref.hip);
  const armScale = scaleFor(measurement?.armCm, ref.arm);
  const thighScale = scaleFor(measurement?.thighCm, ref.thigh);
  const calfScale = scaleFor(measurement?.calfCm, ref.calf);

  const isFem = gender === 'feminino';
  const cx = 80;

  const shoulderHalf = isFem ? 33 : 40;
  const chestHalf = (isFem ? 30 : 37) * chestScale;
  const waistHalf = (isFem ? 24 : 29) * waistScale;
  const hipHalf = (isFem ? 37 : 32) * hipScale;
  const armHalf = (isFem ? 7.5 : 9) * armScale;
  const thighHalf = (isFem ? 15 : 15.5) * thighScale;
  const calfHalf = (isFem ? 8.5 : 9.5) * calfScale;

  const yShoulder = 58;
  const yChest = 92;
  const yWaist = 138;
  const yHip = 172;
  const yKnee = 232;
  const yAnkle = 296;

  const torsoPath = `
    M ${cx - shoulderHalf} ${yShoulder}
    C ${cx - chestHalf - 4} ${yShoulder + 14}, ${cx - chestHalf} ${yChest - 10}, ${cx - chestHalf} ${yChest}
    C ${cx - chestHalf} ${yChest + 20}, ${cx - waistHalf} ${yWaist - 16}, ${cx - waistHalf} ${yWaist}
    C ${cx - waistHalf} ${yWaist + 14}, ${cx - hipHalf} ${yHip - 16}, ${cx - hipHalf} ${yHip}
    L ${cx + hipHalf} ${yHip}
    C ${cx + hipHalf} ${yHip - 16}, ${cx + waistHalf} ${yWaist + 14}, ${cx + waistHalf} ${yWaist}
    C ${cx + waistHalf} ${yWaist - 16}, ${cx + chestHalf} ${yChest + 20}, ${cx + chestHalf} ${yChest}
    C ${cx + chestHalf} ${yChest - 10}, ${cx + chestHalf + 4} ${yShoulder + 14}, ${cx + shoulderHalf} ${yShoulder}
    Z
  `;

  function armPath(side: 1 | -1) {
    const shoulderX = cx + side * (shoulderHalf - 6);
    const handX = cx + side * (shoulderHalf + 6);
    return `
      M ${shoulderX} ${yShoulder + 4}
      C ${shoulderX + side * 6} ${yShoulder + 40}, ${handX} ${yChest + 30}, ${handX - side * 2} ${yWaist + 10}
      L ${handX - side * 2 - side * armHalf * 2} ${yWaist + 6}
      C ${handX - side * armHalf * 2} ${yChest + 24}, ${shoulderX - side * armHalf * 2 + side * 4} ${yShoulder + 36}, ${shoulderX - side * armHalf * 2 + side * 6} ${yShoulder + 2}
      Z
    `;
  }

  function legPath(side: 1 | -1) {
    const hipX = cx + side * hipHalf * 0.55;
    return `
      M ${hipX - side * 2} ${yHip - 2}
      C ${hipX + side * thighHalf * 0.3} ${yHip + 20}, ${cx + side * thighHalf} ${yKnee - 30}, ${cx + side * thighHalf} ${yKnee}
      C ${cx + side * thighHalf} ${yKnee + 10}, ${cx + side * calfHalf} ${yKnee + 20}, ${cx + side * calfHalf} ${yAnkle}
      L ${cx + side * calfHalf - side * calfHalf * 2} ${yAnkle}
      C ${cx + side * calfHalf - side * calfHalf * 2} ${yKnee + 20}, ${cx + side * thighHalf - side * thighHalf * 1.6} ${yKnee + 10}, ${cx + side * thighHalf - side * thighHalf * 1.6} ${yKnee}
      C ${cx - side * 2} ${yKnee - 30}, ${hipX - side * thighHalf * 0.5} ${yHip + 20}, ${hipX - side * 6} ${yHip - 2}
      Z
    `;
  }

  return (
    <svg viewBox="0 0 160 320" width="100%" height="100%" style={{ maxWidth: 160, maxHeight: 320 }}>
      <circle cx={cx} cy={30} r={18} fill="var(--text-faint)" opacity={0.9} />
      <path d={legPath(-1)} fill="var(--text-faint)" opacity={0.75} />
      <path d={legPath(1)} fill="var(--text-faint)" opacity={0.75} />
      <path d={armPath(-1)} fill="var(--text-faint)" opacity={0.85} />
      <path d={armPath(1)} fill="var(--text-faint)" opacity={0.85} />
      <path d={torsoPath} fill="var(--brand)" opacity={0.85} />
    </svg>
  );
}
