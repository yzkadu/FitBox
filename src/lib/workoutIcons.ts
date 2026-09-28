// Sistema de ícones pro app — substitui o uso de emoji (pedido explícito da
// usuária: "vamos parar de usar emoji e comecar a usar icones, emojis ficam
// paia"). Usado tanto pro ícone de um treino (`Workout.emoji`) quanto pro
// avatar da conta (`Profile.emoji`) — os dois campos continuam se chamando
// "emoji" no banco (nenhuma migração necessária), só que agora guardam uma
// destas 8 chaves de ícone em vez de um caractere de emoji.
//
// Dados antigos (contas/treinos criados antes dessa mudança) ainda têm um
// emoji de verdade guardado — `resolveIconKey` reconhece os emojis usados
// historicamente no app e mapeia pro ícone mais parecido, então nada quebra
// visualmente pra quem já tinha treinos/perfil criados.

import {
  Dumbbell,
  Flame,
  Target,
  Footprints,
  Zap,
  Activity,
  Crown,
  Shield,
  Trophy,
  Medal,
  Star,
  Rocket,
  Heart,
  HeartPulse,
  Timer,
  Swords,
  Mountain,
  TrendingUp,
  Award,
  Gem,
  Anchor,
  Compass,
  Sun,
  Moon,
  Bike,
  Waves,
  Feather,
  Sparkles,
  Gauge,
  Flag,
  Snowflake,
  Infinity as InfinityIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Pedido explícito da usuária: "muitas opções de ícones além dos que já tem
// pra escolher na hora de montar o perfil" — expandido de 8 pra 32 ícones.
// Todos continuam abstratos/sem gênero (ver decisão anterior: emoji -> ícone).
export const ICON_KEYS = [
  'dumbbell',
  'flame',
  'target',
  'footprints',
  'zap',
  'activity',
  'crown',
  'shield',
  'trophy',
  'medal',
  'star',
  'rocket',
  'heart',
  'heartPulse',
  'timer',
  'swords',
  'mountain',
  'trendingUp',
  'award',
  'gem',
  'anchor',
  'compass',
  'sun',
  'moon',
  'bike',
  'waves',
  'feather',
  'sparkles',
  'gauge',
  'flag',
  'snowflake',
  'infinity',
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_COMPONENTS: Record<IconKey, LucideIcon> = {
  dumbbell: Dumbbell,
  flame: Flame,
  target: Target,
  footprints: Footprints,
  zap: Zap,
  activity: Activity,
  crown: Crown,
  shield: Shield,
  trophy: Trophy,
  medal: Medal,
  star: Star,
  rocket: Rocket,
  heart: Heart,
  heartPulse: HeartPulse,
  timer: Timer,
  swords: Swords,
  mountain: Mountain,
  trendingUp: TrendingUp,
  award: Award,
  gem: Gem,
  anchor: Anchor,
  compass: Compass,
  sun: Sun,
  moon: Moon,
  bike: Bike,
  waves: Waves,
  feather: Feather,
  sparkles: Sparkles,
  gauge: Gauge,
  flag: Flag,
  snowflake: Snowflake,
  infinity: InfinityIcon,
};

const LEGACY_EMOJI_TO_ICON: Record<string, IconKey> = {
  '💪': 'dumbbell',
  '🏋️': 'dumbbell',
  '🏋': 'dumbbell',
  '🔥': 'flame',
  '🎯': 'target',
  '🦵': 'footprints',
  '🏃': 'footprints',
  '🚴': 'activity',
  '🫁': 'activity',
  '⚡': 'zap',
  '👑': 'crown',
  '🧱': 'shield',
};

function isIconKey(value: string): value is IconKey {
  return (ICON_KEYS as readonly string[]).includes(value);
}

/** Resolve um valor guardado (icon key nova, emoji antigo, ou vazio) pra uma
 * IconKey válida — nunca retorna nada inválido, sempre cai em 'dumbbell'. */
export function resolveIconKey(value?: string | null): IconKey {
  if (!value) return 'dumbbell';
  if (isIconKey(value)) return value;
  return LEGACY_EMOJI_TO_ICON[value] ?? 'dumbbell';
}
