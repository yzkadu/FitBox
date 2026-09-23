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
/** EXPERIMENTO: tom "anatômico" (terracota/vermelho muscular) em vez do
 * cinza neutro anterior — convenção de cor amplamente usada em ilustrações
 * de anatomia (tom de músculo), não uma cor copiada de nenhuma referência
 * específica. */
const NEUTRAL_BODY_COLOR = '#b5604a';

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

  /** Mão: uma "luva" alongada e ROTACIONADA pra acompanhar o ângulo real do
   * antebraço (antes era uma elipse sempre na vertical, destoando da
   * diagonal do braço — um dos motivos do visual "boneco de blocos") + 3
   * dedos como traços curtos, apontando na continuação natural do braço. */
  function hand(side: 1 | -1) {
    const p = armWrist(side);
    const shoulderPt = { x: cx + side * (shoulderHalf - 15), y: yShoulder + 12 };
    const angleDeg = (Math.atan2(p.y - shoulderPt.y, p.x - shoulderPt.x) * 180) / Math.PI;
    const baseAngle = angleDeg;
    const fingers = [-1, 0, 1].map((i) => {
      const angle = ((baseAngle + i * 16) * Math.PI) / 180;
      return {
        x2: p.x + Math.cos(angle) * p.r * 2.2,
        y2: p.y + Math.sin(angle) * p.r * 2.2,
      };
    });
    return { p, angleDeg, fingers };
  }

  /** Pé: elipse alongada, virada levemente pra fora (ângulo natural de um
   * pé parado), com um pequeno bico de dedos na ponta — em vez de um óvalo
   * reto e simétrico, que lia como um "sapato de boneco de bloco". */
  function foot(side: 1 | -1) {
    const x = cx + side * legX;
    const rotate = side * 14;
    const cxF = x + side * 6;
    const cyF = yAnkle + 9;
    const rx = calfHalf * 1.55;
    const ry = 6.5;
    const rad = (rotate * Math.PI) / 180;
    const toe = { x: cxF + Math.cos(rad) * rx * 0.92, y: cyF + Math.sin(rad) * rx * 0.92 };
    return { cx: cxF, cy: cyF, rx, ry, rotate, toe };
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

  /** EXPERIMENTO: conjunto de linhas paralelas entre dois pontos (offset
   * perpendicular ao segmento) — usado pra sugerir a direção das fibras
   * musculares em músculos "em feixe" (peitoral, dorsal, tríceps, posterior
   * de coxa etc.), técnica comum em ilustração anatômica pra dar textura sem
   * desenhar cada fibra individualmente. */
  function parallelLines(x1: number, y1: number, x2: number, y2: number, count: number, spacing: number, keyPrefix: string): { key: string; d: string }[] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const start = -(count - 1) / 2;
    const lines: { key: string; d: string }[] = [];
    for (let i = 0; i < count; i++) {
      const off = (start + i) * spacing;
      lines.push({
        key: `${keyPrefix}-${i}`,
        d: `M ${(x1 + nx * off).toFixed(1)} ${(y1 + ny * off).toFixed(1)} L ${(x2 + nx * off).toFixed(1)} ${(y2 + ny * off).toFixed(1)}`,
      });
    }
    return lines;
  }

  /** EXPERIMENTO: leque de linhas radiando de um ponto — usado pra sugerir a
   * direção das fibras em músculos "em leque" (deltoide, trapézio, glúteo),
   * que na anatomia real convergem/irradiam de um ponto em vez de correr
   * paralelas. */
  function fanLines(cx0: number, cy0: number, angleDeg: number, count: number, length: number, spreadDeg: number, keyPrefix: string): { key: string; d: string }[] {
    const startAngle = angleDeg - spreadDeg / 2;
    const step = count > 1 ? spreadDeg / (count - 1) : 0;
    const lines: { key: string; d: string }[] = [];
    for (let i = 0; i < count; i++) {
      const a = ((startAngle + i * step) * Math.PI) / 180;
      lines.push({
        key: `${keyPrefix}-${i}`,
        d: `M ${cx0.toFixed(1)} ${cy0.toFixed(1)} L ${(cx0 + Math.cos(a) * length).toFixed(1)} ${(cy0 + Math.sin(a) * length).toFixed(1)}`,
      });
    }
    return lines;
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

        // EXPERIMENTO: fibras — peitoral (feixe convergindo do esterno pro
        // ombro), deltoide (leque irradiando do topo do ombro), bíceps
        // (feixe ao longo do braço), oblíquo (feixe diagonal).
        lines.push(...parallelLines(cx + side * 6, yChest + 6, cx + side * chestHalf * 0.78, yChest - 22, 3, 6, `pec-fiber-${label}`));
        lines.push(...fanLines(d.x, d.y - armHalf * 0.2, side === 1 ? 95 : 85, 4, armHalf * 1.5, 80, `delt-fiber-${label}`));
        lines.push(...parallelLines(bStart.x, bStart.y, bEnd.x, bEnd.y, 2, 4.5, `biceps-fiber-${label}`));
        lines.push(...parallelLines(cx + side * waistHalf * 0.85, yWaist - 18, cx + side * hipHalf * 0.55, yHip - 8, 2, 5, `obliquo-fiber-${label}`));
        lines.push(...parallelLines(legCx - thighHalf * 0.05, yHip + 8, legCx - thighHalf * 0.02, yKnee - 8, 2, 8, `quad-fiber-${label}`));
      });
      lines.push({ key: 'esterno', d: `M ${cx.toFixed(1)} ${(yShoulder + 16).toFixed(1)} L ${cx.toFixed(1)} ${(yWaist - 12).toFixed(1)}` });
      // Os "gomos" do abdômen agora são blocos de verdade (ver
      // regionShapes('abdomen')), renderizados sempre que o mapa muscular
      // está ativo — não precisam mais de linhas horizontais separadas aqui.
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

        // EXPERIMENTO: fibras — trapézio (leque do pescoço), dorsal (feixe
        // diagonal em leque), tríceps (feixe ao longo do braço), glúteo
        // (leque irradiando do quadril), posterior de coxa (feixe vertical).
        lines.push(...fanLines(cx, yNeck + 8, side === 1 ? 65 : 115, 3, shoulderHalf * 0.55, 40, `trap-fiber-${label}`));
        lines.push(...parallelLines(cx + side * shoulderHalf * 0.7, yShoulder + 22, cx + side * waistHalf * 0.3, yWaist + 2, 3, 6, `lat-fiber-${label}`));
        lines.push(...parallelLines(tStart.x, tStart.y, tEnd.x, tEnd.y, 2, 4.5, `triceps-fiber-${label}`));
        lines.push(...fanLines(cx + side * 4, yHip - 2, side === 1 ? 65 : 115, 3, hipHalf * 0.65, 45, `gluteo-fiber-${label}`));
        lines.push(...parallelLines(legCx - thighHalf * 0.05, yHip + 10, legCx - thighHalf * 0.02, yKnee - 8, 2, 8, `posterior-fiber-${label}`));
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
      case 'abdomen': {
        // "Gomos" do abdômen como uma grade de blocos (3 linhas x 2 colunas,
        // com um pequeno respiro entre eles) em vez de um retângulo único —
        // dá a leitura de abdômen segmentado (six-pack) tanto destacado
        // quanto na camada neutra sempre visível, geometria 100% calculada a
        // partir das mesmas variáveis de layout do resto da figura.
        const abTop = yChest + 16;
        const abBottom = yWaist - 12;
        const abWidth = waistHalf * 1.18;
        const rows = 3;
        const gapY = 4;
        const gapX = 5;
        const rowH = (abBottom - abTop - gapY * (rows - 1)) / rows;
        const colW = (abWidth - gapX) / 2;
        const shapes: { shape: ReactNode; key: string }[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < 2; c++) {
            // Elipse em vez de retângulo — "bolha" de músculo arredondada,
            // sem cara de bloco/pixel.
            const ex = cx - abWidth / 2 + c * (colW + gapX) + colW / 2;
            const ey = abTop + r * (rowH + gapY) + rowH / 2;
            shapes.push({
              key: `abdomen-${r}-${c}`,
              shape: <ellipse cx={ex} cy={ey} rx={colW / 2} ry={rowH / 2} />,
            });
          }
        }
        return shapes;
      }
      case 'costas':
        // Dorsais como duas "asas" diagonais (afuniladas em direção à
        // cintura), em vez de um bloco retangular único — mais perto da
        // forma real do latíssimo do dorso, ainda 100% original.
        return ([-1, 1] as const).map((side) => {
          const wingCx = cx + side * shoulderHalf * 0.46;
          const wingCy = (yShoulder + yWaist) / 2 + 6;
          const rx = shoulderHalf * 0.4;
          const ry = (yWaist - yShoulder) * 0.46;
          return {
            key: `costas-${side}`,
            shape: (
              <ellipse
                cx={wingCx}
                cy={wingCy}
                rx={rx}
                ry={ry}
                transform={`rotate(${side * 16} ${wingCx.toFixed(1)} ${wingCy.toFixed(1)})`}
              />
            ),
          };
        });
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

  // Camada "neutra": as formas de TODOS os grupos musculares da vista atual
  // (não só o destacado), sempre visíveis enquanto o mapa muscular está
  // ativo — é o que dá a leitura de corpo inteiro sempre segmentado por
  // músculo (peito, abdômen em gomos, dorsais, glúteos, coxas etc.), igual à
  // convenção de carta anatômica que a usuária pediu, com tom bem sutil pra
  // não competir com a cor de destaque quando um grupo é selecionado.
  const neutralRegionShapes = isMapMode ? availableGroups.flatMap((g) => regionShapes(g)) : [];

  // Um só grupo de "figuras" (cabeça + pernas + pés + tronco + braços + mãos)
  // reaproveitado três vezes: uma vez borrado por trás como brilho de
  // contorno, uma vez sólido como base, e mais duas vezes com gradientes de
  // sombra/luz por cima — é isso que dá o acabamento "3D" sem desenhar
  // músculo por músculo.
  // EXPERIMENTO: sem cabelo — convenção comum em ilustrações de anatomia
  // (cabeça careca, pra não distrair da segmentação muscular do pescoço).

  const figure = (
    <>
      <ellipse cx={cx} cy={33} rx={16} ry={18} />
      <path d={leftLeg} />
      <path d={rightLeg} />
      {[leftFoot, rightFoot].map((f, i) => (
        <g key={i}>
          <ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} transform={`rotate(${f.rotate} ${f.cx.toFixed(1)} ${f.cy.toFixed(1)})`} />
          <circle cx={f.toe.x} cy={f.toe.y} r={f.ry * 0.62} />
        </g>
      ))}
      <path d={torso} />
      <path d={leftArm} />
      <path d={rightArm} />
      {[leftHand, rightHand].map((h, i) => (
        <g key={i}>
          <ellipse
            cx={h.p.x}
            cy={h.p.y}
            rx={h.p.r * 1.35}
            ry={h.p.r * 1.02}
            transform={`rotate(${h.angleDeg.toFixed(1)} ${h.p.x.toFixed(1)} ${h.p.y.toFixed(1)})`}
          />
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
        {/* Gradiente reaproveitado em CADA forma de músculo (não uma vez pro
            corpo todo): como o SVG resolve um gradiente radial relativo à
            caixa delimitadora de cada elemento que o usa, toda elipse/forma
            de músculo ganha seu próprio "brilho" individual (mais claro no
            canto superior-esquerdo, mais escuro na borda) — é isso que dá
            volume/relevo a cada músculo em vez do visual "bloco liso" de
            antes. */}
        <radialGradient id="muscle-bump" cx="32%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.32} />
          <stop offset="48%" stopColor="#ffffff" stopOpacity={0.06} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.24} />
        </radialGradient>
        {/* Desfoque leve aplicado às formas de músculo "sempre visíveis": sem
            isso, cada forma fica com borda dura e lê como um adesivo colado
            em cima do corpo (o efeito "boneco de blocos" que a usuária
            reclamou) — borrando a borda, o relevo se funde na silhueta como
            volume de músculo de verdade, não como uma peça separada. */}
        <filter id="muscle-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.3" />
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

      {/* Formas de cada músculo da vista atual, sempre visíveis (não só a
          destacada) — cada uma com seu próprio relevo (gradiente radial),
          não um tom chapado, pra parecer músculo esculpido em vez de bloco
          liso. Renderizada ANTES das linhas de anatomia, pra elas ficarem
          por cima marcando as bordas/divisões finas (clavícula, esterno,
          coluna etc.) que não têm uma "forma" própria. */}
      {isMapMode && neutralRegionShapes.length > 0 && (
        <g fill="url(#muscle-bump)" filter="url(#muscle-soft)">
          {neutralRegionShapes.map(({ shape, key }) => (
            <g key={key}>{shape}</g>
          ))}
        </g>
      )}

      {isMapMode && outlineLines.length > 0 && (
        <g fill="none" stroke="#ffffff" strokeOpacity={0.26} strokeWidth={0.9} strokeLinecap="round">
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
          {/* Relevo por cima da cor de destaque — mesmo gradiente usado na
              camada neutra, pra o músculo destacado também parecer esculpido
              (não uma chapa lisa laranja). */}
          <g fill="url(#muscle-bump)">
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
