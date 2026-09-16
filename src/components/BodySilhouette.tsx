// Ilustração original (SVG gerado por código, sem nenhuma arte de terceiros)
// de uma silhueta genérica que muda de proporção de acordo com as medidas
// corporais mais recentes registradas pela pessoa. É só uma representação
// visual aproximada — não uma imagem real do corpo de ninguém.
//
// Pose em "A" (braços abertos, afastados do tronco), inspirada em referências
// de boneco-manequim usadas por quem faz posagem/medidas 3D — mas desenhada
// do zero aqui, sem copiar nenhum aplicativo ou asset de terceiro: só a ideia
// de pose (braços bem separados do corpo, mãos e pés com uma sugestão de
// forma) foi usada como inspiração de design.
//
// Construída como "fitas" (ribbons) suaves ao longo de uma linha central com
// raio variável em cada ponto (pescoço/ombro/peito/cintura/quadril no tronco;
// quadril/joelho/tornozelo em cada perna; ombro/pulso em cada braço). Isso
// evita o efeito "blocos soltos" — tronco, braços e pernas se conectam em
// curvas contínuas, com uma única cor sólida, em vez de peças coloridas
// separadas com juntas retas.

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

interface RibbonPoint {
  x: number;
  y: number;
  r: number;
}

/** Caminho suave ao longo de uma linha central VERTICAL (x fixo por ponto),
 * cada ponto com sua própria largura (r) — usado pro tronco e pras pernas,
 * que são retos de cima a baixo. */
function ribbonPath(points: RibbonPoint[]): string {
  const left = points.map((p) => ({ x: p.x - p.r, y: p.y }));
  const right = points.map((p) => ({ x: p.x + p.r, y: p.y }));

  let d = `M ${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)} `;
  for (let i = 1; i < left.length; i++) {
    const p0 = left[i - 1];
    const p1 = left[i];
    const midY = ((p0.y + p1.y) / 2).toFixed(1);
    d += `C ${p0.x.toFixed(1)} ${midY}, ${p1.x.toFixed(1)} ${midY}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} `;
  }
  const lastRight = right[right.length - 1];
  d += `L ${lastRight.x.toFixed(1)} ${lastRight.y.toFixed(1)} `;
  for (let i = right.length - 2; i >= 0; i--) {
    const p0 = right[i + 1];
    const p1 = right[i];
    const midY = ((p0.y + p1.y) / 2).toFixed(1);
    d += `C ${p0.x.toFixed(1)} ${midY}, ${p1.x.toFixed(1)} ${midY}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} `;
  }
  d += 'Z';
  return d;
}

/** Caminho suave ao longo de uma linha central DIAGONAL (o braço, na pose em
 * "A") — a largura é aplicada perpendicular à direção do segmento, não só no
 * eixo x, senão o "tubo" do braço fica com cara de cunha em vez de membro. */
function diagRibbonPath(points: RibbonPoint[]): string {
  const dx = points[points.length - 1].x - points[0].x;
  const dy = points[points.length - 1].y - points[0].y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const left = points.map((p) => ({ x: p.x + nx * p.r, y: p.y + ny * p.r }));
  const right = points.map((p) => ({ x: p.x - nx * p.r, y: p.y - ny * p.r }));

  let d = `M ${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)} `;
  for (let i = 1; i < left.length; i++) {
    const p0 = left[i - 1];
    const p1 = left[i];
    const midX = ((p0.x + p1.x) / 2).toFixed(1);
    const midY = ((p0.y + p1.y) / 2).toFixed(1);
    d += `Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}, ${midX} ${midY} T ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} `;
  }
  for (let i = right.length - 1; i >= 0; i--) {
    d += `L ${right[i].x.toFixed(1)} ${right[i].y.toFixed(1)} `;
  }
  d += 'Z';
  return d;
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
  const cx = 110;

  // Larguras base (metade), antes de aplicar a escala das medidas.
  const neckHalf = 8;
  const shoulderHalf = isFem ? 32 : 41;
  const chestHalf = (isFem ? 28 : 35) * chestScale;
  const waistHalf = (isFem ? 21 : 27) * waistScale;
  const hipHalf = (isFem ? 34 : 30) * hipScale;
  const armHalf = (isFem ? 6.5 : 8) * armScale;
  const thighHalf = (isFem ? 13.5 : 15) * thighScale;
  const calfHalf = (isFem ? 8 : 9.5) * calfScale;

  const yNeck = 56;
  const yShoulder = 66;
  const yChest = 104;
  const yWaist = 150;
  const yHip = 184;
  const yKnee = 246;
  const yAnkle = 306;

  const legX = hipHalf * 0.46;

  const torso = ribbonPath([
    { x: cx, y: yNeck, r: neckHalf },
    { x: cx, y: yShoulder, r: shoulderHalf },
    { x: cx, y: yChest, r: chestHalf },
    { x: cx, y: yWaist, r: waistHalf },
    { x: cx, y: yHip, r: hipHalf },
  ]);

  function leg(side: 1 | -1) {
    const x = cx + side * legX;
    return ribbonPath([
      { x, y: yHip - 6, r: thighHalf },
      { x, y: yKnee, r: (thighHalf + calfHalf) / 2.3 },
      { x, y: yAnkle, r: calfHalf },
    ]);
  }

  // Braço em pose "A": sai do ombro (por dentro do contorno do tronco, pra não
  // deixar emenda visível) e vai reto na diagonal até o pulso, bem afastado do
  // corpo — é essa abertura que faz parecer um manequim de referência, em vez
  // de um bonequinho com os braços colados nas laterais.
  function armWrist(side: 1 | -1) {
    return { x: cx + side * (shoulderHalf + 52), y: yWaist + 8, r: armHalf * 0.78 };
  }

  function arm(side: 1 | -1) {
    const shoulderPt = { x: cx + side * (shoulderHalf - 15), y: yShoulder + 12, r: armHalf * 1.05 };
    return diagRibbonPath([shoulderPt, armWrist(side)]);
  }

  /** Mão simplificada: uma "luva" arredondada + 3 dedos sugeridos como traços
   * curtos, o suficiente pra não parecer um cano terminando em nada. */
  function hand(side: 1 | -1) {
    const p = armWrist(side);
    const baseAngle = side === -1 ? 200 : -20;
    const fingers = [-1, 0, 1].map((i) => {
      const angle = ((baseAngle + i * 18) * Math.PI) / 180;
      return {
        x2: p.x + Math.cos(angle) * p.r * 2.1,
        y2: p.y + Math.sin(angle) * p.r * 2.1,
      };
    });
    return { p, fingers };
  }

  function foot(side: 1 | -1) {
    const x = cx + side * legX;
    return { cx: x + side * 5, cy: yAnkle + 9, rx: calfHalf * 1.3, ry: 7 };
  }

  const leftHand = hand(-1);
  const rightHand = hand(1);
  const leftFoot = foot(-1);
  const rightFoot = foot(1);

  return (
    <svg viewBox="0 0 220 340" width="100%" height="100%" style={{ maxWidth: 190, maxHeight: 340 }}>
      <g fill="var(--brand)" color="var(--brand)" opacity={0.88}>
        <ellipse cx={cx} cy={33} rx={16} ry={18} />
        <path d={leg(-1)} />
        <path d={leg(1)} />
        <ellipse cx={leftFoot.cx} cy={leftFoot.cy} rx={leftFoot.rx} ry={leftFoot.ry} />
        <ellipse cx={rightFoot.cx} cy={rightFoot.cy} rx={rightFoot.rx} ry={rightFoot.ry} />
        <path d={torso} />
        <path d={arm(-1)} />
        <path d={arm(1)} />
        {[leftHand, rightHand].map((h, i) => (
          <g key={i}>
            <ellipse cx={h.p.x} cy={h.p.y} rx={h.p.r * 1.1} ry={h.p.r * 1.3} />
            {h.fingers.map((f, fi) => (
              <line
                key={fi}
                x1={h.p.x}
                y1={h.p.y}
                x2={f.x2}
                y2={f.y2}
                stroke="currentColor"
                strokeWidth={h.p.r * 0.75}
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
