// Ilustração original (SVG gerado por código, sem nenhuma arte de terceiros)
// de uma silhueta genérica que muda de proporção de acordo com as medidas
// corporais mais recentes registradas pela pessoa (ou, no modo "Explorar",
// de acordo com um % de gordura corporal escolhido num slider). É só uma
// representação visual aproximada — não uma imagem real do corpo de ninguém.
//
// Pose em "A" (braços abertos, afastados do tronco), inspirada em referências
// de boneco-manequim usadas por quem faz posagem/medidas 3D — mas desenhada
// do zero aqui, sem copiar nenhum aplicativo ou asset de terceiro: só a ideia
// de pose (braços bem separados do corpo, mãos e pés com uma sugestão de
// forma) e de acabamento (luz lateral + contorno com brilho, sombreado de
// volume) foi usada como inspiração de design — a arte em si (formas,
// gradientes, cores) é original do FitBox, construída em código.
//
// Construída como "fitas" (ribbons) suaves ao longo de uma linha central com
// raio variável em cada ponto (pescoço/ombro/peito/cintura/quadril no tronco;
// quadril/joelho/tornozelo em cada perna; ombro/pulso em cada braço). Isso
// evita o efeito "blocos soltos" — tronco, braços e pernas se conectam em
// curvas contínuas. O acabamento "3D" vem de camadas extras sobre o mesmo
// contorno: um brilho de contorno (glow) atrás da figura, um degradê de
// sombra por cima (mais escuro embaixo/à direita) e um degradê de luz por
// cima (mais claro em cima/à esquerda) — sem precisar desenhar músculo por
// músculo.

import type { ReactNode } from 'react';
import type { BodyMeasurement, MuscleGroup } from '../types';

export type SilhouetteGender = 'feminino' | 'masculino';

/** Vista do mapa muscular — como a figura é abstrata (sem rosto nem detalhes
 * frontais/traseiros), "frente" e "costas" reaproveitam exatamente o mesmo
 * corpo; só muda o conjunto de regiões que pode ser destacado (ver
 * `FRONT_GROUPS`/`BACK_GROUPS` abaixo) e um rótulo na tela. */
export type SilhouetteView = 'frente' | 'costas';

/** Cor de destaque do mapa muscular — reaproveita a mesma laranja já usada
 * nos gráficos do app (chartTheme.ts), não uma cor nova. */
const HIGHLIGHT_COLOR = '#d95926';
/** Cor "neutra" do corpo quando o mapa muscular está ativo (em vez da cor de
 * marca roxa) — só pra fazer a região destacada em laranja se sobressair,
 * como numa ilustração anatômica. */
const NEUTRAL_BODY_COLOR = '#585b70';

/** Em que vista(s) cada grupo muscular tem uma região desenhável. Alguns
 * grupos (ombro, perna) fazem sentido nas duas vistas; peito/bíceps/abdômen
 * só têm região de frente, e costas/tríceps/glúteo só de costas — cardio e
 * "outro" não têm uma região de músculo específica pra destacar. */
const FRONT_GROUPS: MuscleGroup[] = ['peito', 'ombro', 'biceps', 'abdomen', 'perna'];
const BACK_GROUPS: MuscleGroup[] = ['costas', 'ombro', 'triceps', 'perna', 'gluteo'];

const REFERENCE: Record<SilhouetteGender, { chest: number; waist: number; hip: number; arm: number; thigh: number; calf: number }> = {
  masculino: { chest: 100, waist: 85, hip: 96, arm: 32, thigh: 56, calf: 37 },
  feminino: { chest: 90, waist: 72, hip: 98, arm: 27, thigh: 56, calf: 35 },
};

/** Curva de escala (por campo) a partir de um % de gordura corporal, usada no
 * modo "Explorar" — quando não há medidas reais registradas pra guiar o
 * desenho, ou quando a pessoa só quer testar/comparar visualmente. Faixa de
 * entrada pensada igual à de apps do gênero (5% a 45%+), com cada campo
 * crescendo num ritmo levemente diferente (cintura/quadril crescem mais que
 * braço/panturrilha em % de gordura mais alto, o que é anatomicamente mais
 * realista que escalar tudo igual). */
const BODY_FAT_MIN = 5;
const BODY_FAT_MAX = 45;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function bodyFatT(pct: number): number {
  const clamped = Math.min(BODY_FAT_MAX, Math.max(BODY_FAT_MIN, pct));
  return (clamped - BODY_FAT_MIN) / (BODY_FAT_MAX - BODY_FAT_MIN);
}

function scalesFromBodyFat(pct: number): { chest: number; waist: number; hip: number; arm: number; thigh: number; calf: number } {
  const t = bodyFatT(pct);
  return {
    chest: lerp(0.92, 1.22, t),
    waist: lerp(0.8, 1.55, t),
    hip: lerp(0.92, 1.32, t),
    arm: lerp(0.85, 1.3, t),
    thigh: lerp(0.88, 1.35, t),
    calf: lerp(0.92, 1.18, t),
  };
}

/** Rótulo em faixas de 5 pontos (5-9%, 10-14%, ...), igual ao formato comum
 * em apps do gênero — só pra exibição, o valor real usado no desenho é
 * contínuo (fica mais suave arrastando o slider). */
export function bodyFatBandLabel(pct: number): string {
  if (pct >= BODY_FAT_MAX) return `${BODY_FAT_MAX}%+`;
  const bandStart = Math.floor((pct - BODY_FAT_MIN) / 5) * 5 + BODY_FAT_MIN;
  return `${bandStart}-${bandStart + 4}%`;
}

export const BODY_FAT_RANGE = { min: BODY_FAT_MIN, max: BODY_FAT_MAX };

function clampScale(v: number): number {
  return Math.min(1.6, Math.max(0.78, v));
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

export function BodySilhouette({
  measurement,
  gender,
  bodyFatOverridePct,
  view = 'frente',
  highlightGroups,
}: {
  measurement: BodyMeasurement | null;
  gender: SilhouetteGender;
  /** Quando informado, ignora a medição real e desenha a partir desse % de
   * gordura corporal (modo "Explorar" / prévia ao vivo). */
  bodyFatOverridePct?: number;
  /** Vista frente/costas do mapa muscular. Não afeta o corpo em si (que é
   * abstrato, sem rosto) — só qual conjunto de regiões pode ser destacado. */
  view?: SilhouetteView;
  /** Quando informado (e não vazio), ativa o "modo mapa muscular": o corpo
   * fica numa cor neutra e os grupos musculares desta lista aparecem
   * destacados em laranja, na vista atual. */
  highlightGroups?: MuscleGroup[];
}) {
  const ref = REFERENCE[gender];

  const overrideScales = bodyFatOverridePct != null ? scalesFromBodyFat(bodyFatOverridePct) : null;

  const chestScale = overrideScales ? overrideScales.chest : scaleFor(measurement?.chestCm, ref.chest);
  const waistScale = overrideScales ? overrideScales.waist : scaleFor(measurement?.waistCm, ref.waist);
  const hipScale = overrideScales ? overrideScales.hip : scaleFor(measurement?.hipCm, ref.hip);
  const armScale = overrideScales ? overrideScales.arm : scaleFor(measurement?.armCm, ref.arm);
  const thighScale = overrideScales ? overrideScales.thigh : scaleFor(measurement?.thighCm, ref.thigh);
  const calfScale = overrideScales ? overrideScales.calf : scaleFor(measurement?.calfCm, ref.calf);

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
  const leftLeg = leg(-1);
  const rightLeg = leg(1);
  const leftArm = arm(-1);
  const rightArm = arm(1);

  // `isMapMode` liga o visual de "mapa muscular" (corpo neutro + linhas de
  // anatomia sempre visíveis) sempre que a tela que usa o componente passou
  // o prop `highlightGroups` (mesmo que a lista esteja vazia nesse momento —
  // ex: nenhum treino agendado hoje). `isHighlightMode` (só os grupos com
  // pelo menos 1 item) controla só a camada de destaque laranja por cima.
  const isMapMode = highlightGroups !== undefined;
  const activeGroups = new Set(highlightGroups ?? []);
  const isHighlightMode = activeGroups.size > 0;
  const availableGroups = view === 'frente' ? FRONT_GROUPS : BACK_GROUPS;

  /** Curva suave entre dois pontos, com um "arco" (bow) perpendicular ao
   * segmento — usado pra desenhar as linhas de anatomia (clavícula, contorno
   * do peitoral, oblíquos, dorsais etc.) sem precisar de pontos de controle
   * manuais em cada uma. */
  function curve(x1: number, y1: number, x2: number, y2: number, bow: number): string {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrlX = mx + nx * bow;
    const ctrlY = my + ny * bow;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  /** Linhas de anatomia (traço fino, sem preenchimento) sobre o corpo neutro
   * do modo mapa muscular — deixa a figura inteira com cara de "carta
   * anatômica" segmentada por grupo muscular (peito dividido, abdômen em
   * gomos, dorsais, glúteos, coxas, panturrilhas etc.), sempre visível nessa
   * vista, não só nos grupos destacados. Geometria 100% original, calculada
   * a partir das mesmas variáveis de escala/layout do resto da figura — só a
   * CONVENÇÃO visual (corpo neutro + linhas claras segmentando cada músculo)
   * é inspirada em cartas anatômicas genéricas do gênero; nenhuma curva foi
   * copiada de nenhuma referência específica. */
  function anatomyLines(): { key: string; d: string }[] {
    const lines: { key: string; d: string }[] = [];
    const deltoid = (side: 1 | -1) => ({ x: cx + side * (shoulderHalf - 15), y: yShoulder + 12 });

    if (view === 'frente') {
      (['left', 'right'] as const).forEach((label, i) => {
        const side = (i === 0 ? -1 : 1) as 1 | -1;
        lines.push({ key: `clavicula-${label}`, d: curve(cx, yNeck + 14, cx + side * shoulderHalf * 0.65, yShoulder + 4, side * -6) });
        lines.push({ key: `peitoral-${label}`, d: curve(cx + side * 8, yChest - 22, cx + side * chestHalf * 0.8, yChest + 10, side * 14) });
        lines.push({ key: `obliquo-${label}`, d: curve(cx + side * waistHalf * 0.85, yWaist - 18, cx + side * hipHalf * 0.55, yHip - 8, side * 6) });
        const d = deltoid(side);
        lines.push({
          key: `deltoide-${label}`,
          d: `M ${(d.x - armHalf * 1.2).toFixed(1)} ${d.y.toFixed(1)} A ${(armHalf * 1.3).toFixed(1)} ${(armHalf * 1.1).toFixed(1)} 0 0 1 ${(d.x + armHalf * 1.2).toFixed(1)} ${d.y.toFixed(1)}`,
        });
        const bStart = armMidPoint(side, 0.15);
        const bEnd = armMidPoint(side, 0.7);
        lines.push({ key: `biceps-${label}`, d: curve(bStart.x, bStart.y, bEnd.x, bEnd.y, side * -8) });
        const legCx = cx + side * legX;
        lines.push({ key: `quad-in-${label}`, d: `M ${(legCx - thighHalf * 0.32).toFixed(1)} ${(yHip + 10).toFixed(1)} L ${(legCx - thighHalf * 0.18).toFixed(1)} ${(yKnee - 10).toFixed(1)}` });
        lines.push({ key: `quad-out-${label}`, d: `M ${(legCx + thighHalf * 0.32).toFixed(1)} ${(yHip + 10).toFixed(1)} L ${(legCx + thighHalf * 0.18).toFixed(1)} ${(yKnee - 10).toFixed(1)}` });
      });
      lines.push({ key: 'esterno', d: `M ${cx.toFixed(1)} ${(yShoulder + 16).toFixed(1)} L ${cx.toFixed(1)} ${(yWaist - 12).toFixed(1)}` });
      lines.push({ key: 'abdomen-centro', d: `M ${cx.toFixed(1)} ${(yChest + 18).toFixed(1)} L ${cx.toFixed(1)} ${(yWaist - 14).toFixed(1)}` });
      for (let i = 1; i <= 3; i++) {
        const y = yChest + 20 + (i * (yWaist - 14 - (yChest + 20))) / 4;
        lines.push({ key: `abdomen-gomo-${i}`, d: `M ${(cx - waistHalf * 0.42).toFixed(1)} ${y.toFixed(1)} L ${(cx + waistHalf * 0.42).toFixed(1)} ${y.toFixed(1)}` });
      }
    } else {
      (['left', 'right'] as const).forEach((label, i) => {
        const side = (i === 0 ? -1 : 1) as 1 | -1;
        lines.push({ key: `trapezio-${label}`, d: `M ${cx.toFixed(1)} ${(yNeck + 8).toFixed(1)} L ${(cx + side * shoulderHalf * 0.55).toFixed(1)} ${(yShoulder + 6).toFixed(1)}` });
        lines.push({ key: `dorsal-${label}`, d: curve(cx + side * shoulderHalf * 0.7, yShoulder + 22, cx + side * waistHalf * 0.3, yWaist + 2, side * 10) });
        lines.push({ key: `gluteo-${label}`, d: curve(cx + side * 4, yHip - 4, cx + side * hipHalf * 0.75, yHip + 20, side * 10) });
        const tStart = armMidPoint(side, 0.15);
        const tEnd = armMidPoint(side, 0.75);
        lines.push({ key: `triceps-${label}`, d: curve(tStart.x, tStart.y, tEnd.x, tEnd.y, side * 10) });
        const legCx = cx + side * legX;
        lines.push({ key: `posterior-in-${label}`, d: `M ${(legCx - thighHalf * 0.3).toFixed(1)} ${(yHip + 10).toFixed(1)} L ${(legCx - thighHalf * 0.16).toFixed(1)} ${(yKnee - 10).toFixed(1)}` });
        lines.push({ key: `posterior-out-${label}`, d: `M ${(legCx + thighHalf * 0.3).toFixed(1)} ${(yHip + 10).toFixed(1)} L ${(legCx + thighHalf * 0.16).toFixed(1)} ${(yKnee - 10).toFixed(1)}` });
        lines.push({ key: `panturrilha-${label}`, d: `M ${legCx.toFixed(1)} ${(yKnee + 14).toFixed(1)} L ${legCx.toFixed(1)} ${(yAnkle - 10).toFixed(1)}` });
        lines.push({ key: `gemeos-${label}`, d: curve(legCx - calfHalf * 0.6, yKnee + 20, legCx + calfHalf * 0.6, yKnee + 20, -14) });
      });
      lines.push({ key: 'coluna', d: `M ${cx.toFixed(1)} ${(yNeck + 14).toFixed(1)} L ${cx.toFixed(1)} ${(yHip - 16).toFixed(1)}` });
      lines.push({
        key: 'lombar',
        d: `M ${cx.toFixed(1)} ${(yWaist - 6).toFixed(1)} L ${(cx + 10).toFixed(1)} ${(yWaist + 14).toFixed(1)} L ${cx.toFixed(1)} ${(yHip - 16).toFixed(1)} L ${(cx - 10).toFixed(1)} ${(yWaist + 14).toFixed(1)} Z`,
      });
    }
    return lines;
  }

  const outlineLines = isMapMode ? anatomyLines() : [];

  /** Ponto no meio do "tubo" do braço (entre ombro e pulso), com o ângulo do
   * segmento — usado pra desenhar a região de bíceps/tríceps já alinhada
   * com a diagonal do braço, em vez de uma elipse "reta" destoando da pose. */
  function armMidPoint(side: 1 | -1, t: number) {
    const shoulderPt = { x: cx + side * (shoulderHalf - 15), y: yShoulder + 12 };
    const wrist = armWrist(side);
    const angleDeg = (Math.atan2(wrist.y - shoulderPt.y, wrist.x - shoulderPt.x) * 180) / Math.PI;
    return {
      x: shoulderPt.x + (wrist.x - shoulderPt.x) * t,
      y: shoulderPt.y + (wrist.y - shoulderPt.y) * t,
      angleDeg,
    };
  }

  /** Formas de cada grupo muscular (só as visíveis na vista atual), a partir
   * das mesmas variáveis de layout/escala do resto da figura — por isso as
   * regiões acompanham o corpo ao crescer/encolher junto com as medidas ou
   * o % de gordura do modo Explorar. */
  function regionShapes(group: MuscleGroup): { shape: ReactNode; key: string }[] {
    switch (group) {
      case 'peito':
        return ([-1, 1] as const).map((side) => ({
          key: `peito-${side}`,
          shape: (
            <ellipse
              cx={cx + side * chestHalf * 0.42}
              cy={yChest - 14}
              rx={chestHalf * 0.44}
              ry={18}
            />
          ),
        }));
      case 'ombro':
        return ([-1, 1] as const).map((side) => ({
          key: `ombro-${side}`,
          shape: <circle cx={cx + side * (shoulderHalf - 15)} cy={yShoulder + 12} r={armHalf * 1.35} />,
        }));
      case 'biceps':
      case 'triceps':
        return ([-1, 1] as const).map((side) => {
          const p = armMidPoint(side, 0.42);
          return {
            key: `${group}-${side}`,
            shape: (
              <ellipse
                cx={p.x}
                cy={p.y}
                rx={armHalf * 1.5}
                ry={armHalf * 0.85}
                transform={`rotate(${p.angleDeg} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
              />
            ),
          };
        });
      case 'abdomen':
        return [
          {
            key: 'abdomen',
            shape: (
              <rect
                x={cx - waistHalf * 0.62}
                y={yChest + 12}
                width={waistHalf * 1.24}
                height={yWaist - yChest - 6}
                rx={10}
              />
            ),
          },
        ];
      case 'costas':
        return [
          {
            key: 'costas',
            shape: (
              <rect
                x={cx - shoulderHalf * 0.72}
                y={yShoulder + 4}
                width={shoulderHalf * 1.44}
                height={yWaist - yShoulder - 14}
                rx={16}
              />
            ),
          },
        ];
      case 'gluteo':
        return ([-1, 1] as const).map((side) => ({
          key: `gluteo-${side}`,
          shape: <ellipse cx={cx + side * legX} cy={yHip + 12} rx={hipHalf * 0.42} ry={22} />,
        }));
      case 'perna':
        return ([-1, 1] as const).map((side) => ({
          key: `perna-${side}`,
          shape: (
            <ellipse
              cx={cx + side * legX}
              cy={(yHip + yKnee) / 2 + 4}
              rx={thighHalf * 0.9}
              ry={(yKnee - yHip) * 0.32}
            />
          ),
        }));
      default:
        return [];
    }
  }

  const highlightShapes = availableGroups
    .filter((g) => activeGroups.has(g))
    .flatMap((g) => regionShapes(g));

  // Um só grupo de "figuras" (cabeça + pernas + pés + tronco + braços + mãos)
  // reaproveitado três vezes: uma vez borrado por trás como brilho de
  // contorno, uma vez sólido como base, e mais duas vezes com gradientes de
  // sombra/luz por cima — é isso que dá o acabamento "3D" sem desenhar
  // músculo por músculo.
  // Cabelo: uma "touca" simples e original cobrindo o topo da cabeça — não
  // copia nenhum penteado de referência, é só o suficiente pra ficar menos
  // careca/abstrata sem desenhar um rosto (a figura continua sem feições).
  const hair = `M ${(cx - 15).toFixed(1)} 28 A 15 21 0 0 1 ${(cx + 15).toFixed(1)} 28 Q ${(cx + 9).toFixed(1)} 18 ${cx.toFixed(1)} 20 Q ${(cx - 9).toFixed(1)} 18 ${(cx - 15).toFixed(1)} 28 Z`;

  const figure = (
    <>
      <ellipse cx={cx} cy={33} rx={16} ry={18} />
      <path d={hair} />
      <path d={leftLeg} />
      <path d={rightLeg} />
      <ellipse cx={leftFoot.cx} cy={leftFoot.cy} rx={leftFoot.rx} ry={leftFoot.ry} />
      <ellipse cx={rightFoot.cx} cy={rightFoot.cy} rx={rightFoot.rx} ry={rightFoot.ry} />
      <path d={torso} />
      <path d={leftArm} />
      <path d={rightArm} />
      {[leftHand, rightHand].map((h, i) => (
        <g key={i}>
          <ellipse cx={h.p.x} cy={h.p.y} rx={h.p.r * 1.1} ry={h.p.r * 1.3} />
        </g>
      ))}
    </>
  );

  return (
    <svg viewBox="0 0 220 340" width="100%" height="100%" style={{ maxWidth: 190, maxHeight: 340 }}>
      <defs>
        <radialGradient id="silhouette-backdrop" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.16} />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="silhouette-light" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="silhouette-shade" x1="20%" y1="10%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0} />
          <stop offset="55%" stopColor="#000000" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.34} />
        </linearGradient>
        <filter id="silhouette-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <ellipse cx={110} cy={120} rx={100} ry={140} fill="url(#silhouette-backdrop)" />

      {/* Brilho de contorno (glow) — mesma silhueta, só o traço, borrada e por trás de tudo.
          Na cor de marca (modo normal) ou numa cor neutra (modo mapa muscular, pra não
          competir com o laranja das regiões destacadas). */}
      <g fill="none" stroke={isMapMode ? NEUTRAL_BODY_COLOR : 'var(--brand)'} strokeWidth={5} strokeOpacity={0.55} filter="url(#silhouette-glow)">
        {figure}
      </g>

      {/* Corpo sólido */}
      <g fill={isMapMode ? NEUTRAL_BODY_COLOR : 'var(--brand)'} opacity={0.94}>
        {figure}
      </g>

      {/* Volume: sombra por cima (baixo/direita mais escuro) */}
      <g fill="url(#silhouette-shade)">{figure}</g>

      {/* Volume: luz por cima (cima/esquerda mais claro, simulando luz lateral) */}
      <g fill="url(#silhouette-light)">{figure}</g>

      {/* Linhas de anatomia: segmentação de cada músculo (peito, abdômen,
          dorsais, glúteos, coxas, panturrilhas etc.), sempre visíveis no modo
          mapa muscular — não só nos grupos destacados — pra dar a leitura de
          "carta anatômica" completa. Traço claro fino, sem preenchimento. */}
      {isMapMode && outlineLines.length > 0 && (
        <g fill="none" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={1.1} strokeLinecap="round">
          {outlineLines.map(({ key, d }) => (
            <path key={key} d={d} />
          ))}
        </g>
      )}

      {/* Mapa muscular: regiões destacadas em laranja por cima do corpo neutro,
          com um leve brilho próprio pra "saltar" da figura — só aparece quando
          `highlightGroups` foi passado. */}
      {isHighlightMode && highlightShapes.length > 0 && (
        <>
          <g fill={HIGHLIGHT_COLOR} opacity={0.5} filter="url(#silhouette-glow)">
            {highlightShapes.map(({ shape, key }) => (
              <g key={key}>{shape}</g>
            ))}
          </g>
          <g fill={HIGHLIGHT_COLOR} fillOpacity={0.88} stroke={HIGHLIGHT_COLOR} strokeOpacity={0.9} strokeWidth={1}>
            {highlightShapes.map(({ shape, key }) => (
              <g key={key}>{shape}</g>
            ))}
          </g>
        </>
      )}

      {/* Dedos das mãos, por cima de tudo pra ficarem nítidos */}
      <g stroke={isMapMode ? NEUTRAL_BODY_COLOR : 'var(--brand)'} opacity={0.94}>
        {[leftHand, rightHand].map((h, i) => (
          <g key={i}>
            {h.fingers.map((f, fi) => (
              <line
                key={fi}
                x1={h.p.x}
                y1={h.p.y}
                x2={f.x2}
                y2={f.y2}
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
