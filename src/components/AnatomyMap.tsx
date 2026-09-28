import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  ANATOMY_GROUP_LABELS,
  ANATOMY_GROUP_ORDER,
  ANATOMY_VIEWBOX,
  MUSCLE_ENTITY_LABELS,
  REGION_GROUP,
  genderToModel,
  parseMuscleWeights,
  regionKey,
} from '../lib/anatomy';
import type { AnatomyGender, AnatomyGroup, AnatomyModel, AnatomyView } from '../lib/anatomy';

import maleFrontRegions from '../assets/anatomy/male-front.regions.svg?raw';
import maleBackRegions from '../assets/anatomy/male-back.regions.svg?raw';
import femaleFrontRegions from '../assets/anatomy/female-front.regions.svg?raw';
import femaleBackRegions from '../assets/anatomy/female-back.regions.svg?raw';

type PoseKey = `${AnatomyModel}-${AnatomyView}`;

const REGIONS_MARKUP: Record<PoseKey, string> = {
  'male-front': maleFrontRegions,
  'male-back': maleBackRegions,
  'female-front': femaleFrontRegions,
  'female-back': femaleBackRegions,
};

const IMAGE_SRC: Record<PoseKey, string> = {
  'male-front': '/anatomy/male-front.png',
  'male-back': '/anatomy/male-back.png',
  'female-front': '/anatomy/female-front.png',
  'female-back': '/anatomy/female-back.png',
};

const POSES: Array<{ model: AnatomyModel; view: AnatomyView; label: string }> = [
  { model: 'male', view: 'front', label: 'Frente' },
  { model: 'male', view: 'back', label: 'Costas' },
  { model: 'female', view: 'front', label: 'Frente' },
  { model: 'female', view: 'back', label: 'Costas' },
];

const GENDER_STORAGE_KEY = 'fitbox-anatomy-gender';

function loadStoredGender(): AnatomyGender {
  try {
    const saved = localStorage.getItem(GENDER_STORAGE_KEY);
    if (saved === 'masculino' || saved === 'feminino') return saved;
  } catch {
    // localStorage indisponível — segue no padrão
  }
  return 'masculino';
}

/** Todas as regionKeys que pertencem a um grupo (usado tanto pra pré-selecionar
 * os grupos do treino de hoje quanto pro toggle de um chip de filtro). */
function keysForGroup(group: AnatomyGroup): string[] {
  return Object.entries(REGION_GROUP)
    .filter(([, g]) => g === group)
    .map(([key]) => key);
}

interface HoveredInfo {
  id: string;
  group: AnatomyGroup | null;
  side: string;
  muscles: Array<{ entity: string; weight: number }>;
}

export interface AnatomyMapProps {
  /** 'full': boneco + chips de filtro + painel de inspeção/seleção (tela /musculos).
   * 'compact': só o boneco + toggle de gênero, pensado pra caber num card menor. */
  variant?: 'full' | 'compact';
  initialGender?: AnatomyGender;
  /** Pré-seleciona todas as regiões desses grupos ao montar (ex: grupos do
   * treino do dia). Só lido na primeira renderização. */
  initialSelectedGroups?: AnatomyGroup[];
  /** Chamado sempre que a seleção muda, com a lista de grupos que têm pelo
   * menos uma região selecionada — usado pra filtrar a lista de exercícios. */
  onActiveGroupsChange?: (groups: AnatomyGroup[]) => void;
  className?: string;
}

export function AnatomyMap({
  variant = 'full',
  initialGender,
  initialSelectedGroups,
  onActiveGroupsChange,
  className = '',
}: AnatomyMapProps) {
  const [gender, setGender] = useState<AnatomyGender>(() => initialGender ?? loadStoredGender());
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!initialSelectedGroups || initialSelectedGroups.length === 0) return new Set();
    const groupSet = new Set(initialSelectedGroups);
    const keys = Object.entries(REGION_GROUP)
      .filter(([, group]) => groupSet.has(group))
      .map(([key]) => key);
    return new Set(keys);
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoveredIdRef = useRef<string | null>(null);

  function changeGender(g: AnatomyGender) {
    setGender(g);
    try {
      localStorage.setItem(GENDER_STORAGE_KEY, g);
    } catch {
      // localStorage indisponível — segue só na sessão
    }
  }

  // As 4 poses ficam sempre montadas (só a dupla do gênero ativo fica
  // visível) — assim a seleção nunca "pisca" ao trocar de gênero. Como as
  // regiões são HTML bruto (dangerouslySetInnerHTML), sincronizamos
  // data-selected imperativamente sempre que a seleção muda.
  useEffect(() => {
    const root = viewerRef.current;
    if (!root) return;
    const regions = root.querySelectorAll<SVGGElement>('.semantic-region');
    regions.forEach((el) => {
      const on = selected.has(regionKey(el.id));
      el.dataset.selected = on ? 'true' : 'false';
    });
  }, [selected]);

  useEffect(() => {
    if (!onActiveGroupsChange) return;
    const active = new Set<AnatomyGroup>();
    selected.forEach((key) => {
      const g = REGION_GROUP[key];
      if (g) active.add(g);
    });
    onActiveGroupsChange(Array.from(active));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function toggleRegion(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(group: AnatomyGroup) {
    const keys = keysForGroup(group);
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  function handleClick(e: ReactMouseEvent<HTMLDivElement>) {
    const el = (e.target as Element).closest('.semantic-region');
    if (!el || !el.id) return;
    toggleRegion(regionKey(el.id));
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const el = (e.target as Element).closest('.semantic-region') as SVGGElement | null;
    const id = el?.id ?? null;
    if (id !== hoveredIdRef.current) {
      hoveredIdRef.current = id;
      setHoveredId(id);
    }
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${e.clientX}px`;
      tooltipRef.current.style.top = `${e.clientY}px`;
      tooltipRef.current.style.opacity = id ? '1' : '0';
    }
  }

  function handleMouseLeave() {
    hoveredIdRef.current = null;
    setHoveredId(null);
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
  }

  const hoveredInfo: HoveredInfo | null = useMemo(() => {
    if (!hoveredId || !viewerRef.current) return null;
    const el = viewerRef.current.querySelector(`[id="${hoveredId}"]`) as SVGGElement | null;
    if (!el) return null;
    return {
      id: hoveredId,
      group: (el.dataset.muscleGroup as AnatomyGroup | undefined) ?? null,
      side: el.dataset.side ?? '',
      muscles: parseMuscleWeights(el.dataset.muscles ?? ''),
    };
  }, [hoveredId]);

  const selectionSummary = useMemo(() => {
    return Array.from(selected)
      .sort()
      .map((key) => {
        const group = REGION_GROUP[key] ?? null;
        const niceName = key
          .replace(/^(front|back)-/, '')
          .replace(/-(left|right)$/, '')
          .replace(/-/g, ' ');
        const side = key.endsWith('-left') ? 'Esq' : key.endsWith('-right') ? 'Dir' : '';
        return { key, group, niceName, side };
      });
  }, [selected]);

  const compact = variant === 'compact';

  return (
    <div className={className}>
      {!compact && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ANATOMY_GROUP_ORDER.map((g) => {
            const on = keysForGroup(g).every((k) => selected.has(k));
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGroup(g)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: on ? 'var(--brand)' : 'var(--surface-2)',
                  color: on ? 'white' : 'var(--text-dim)',
                }}
              >
                {ANATOMY_GROUP_LABELS[g]}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center mb-3 gap-2">
        <div className="flex gap-1 rounded-full p-0.5" style={{ background: 'var(--surface-2)' }}>
          {(['masculino', 'feminino'] as AnatomyGender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => changeGender(g)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: gender === g ? 'var(--brand)' : 'transparent',
                color: gender === g ? 'white' : 'var(--text-faint)',
              }}
            >
              {g === 'masculino' ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
        {!compact && selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}
          >
            Limpar seleção
          </button>
        )}
      </div>

      <div className={compact ? '' : 'lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-4 lg:items-start'}>
      <div
        ref={viewerRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex flex-wrap gap-3 justify-center rounded-2xl p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {POSES.map(({ model, view, label }) => {
          const key: PoseKey = `${model}-${view}`;
          const activeModel = genderToModel(gender);
          const visible = model === activeModel;
          return (
            <div
              key={key}
              hidden={!visible}
              className="flex flex-col items-center gap-1"
              style={{ flex: compact ? '1 1 140px' : '1 1 200px', maxWidth: compact ? 180 : 260 }}
            >
              <svg viewBox={ANATOMY_VIEWBOX[key]} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <image
                  href={IMAGE_SRC[key]}
                  x={0}
                  y={0}
                  width={ANATOMY_VIEWBOX[key].split(' ')[2]}
                  height={ANATOMY_VIEWBOX[key].split(' ')[3]}
                  preserveAspectRatio="xMidYMid meet"
                />
                {/* eslint-disable-next-line react/no-danger */}
                <g dangerouslySetInnerHTML={{ __html: REGIONS_MARKUP[key] }} />
              </svg>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: 'var(--text-faint)' }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        ref={tooltipRef}
        className="fixed pointer-events-none text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg z-50"
        style={{
          background: '#000000e8',
          border: '1px solid #ffffff22',
          transform: 'translate(-50%, -130%)',
          opacity: 0,
          transition: 'opacity .1s ease',
          left: 0,
          top: 0,
        }}
      >
        {hoveredInfo?.group ? ANATOMY_GROUP_LABELS[hoveredInfo.group] : ''}
      </div>

      {!compact && (
        <div className="flex flex-col gap-3 mt-4 lg:mt-0">
          <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5"
              style={{ color: 'var(--text-faint)' }}
            >
              Estrutura da região (ao passar o mouse)
            </p>
            {!hoveredInfo ? (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Passe o mouse (ou toque) num músculo pra ver o grupo e o detalhamento por trás dele.
              </p>
            ) : (
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  {hoveredInfo.group ? ANATOMY_GROUP_LABELS[hoveredInfo.group] : hoveredInfo.id}
                  {hoveredInfo.side === 'left' && (
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-faint)' }}>
                      Esquerdo
                    </span>
                  )}
                  {hoveredInfo.side === 'right' && (
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-faint)' }}>
                      Direito
                    </span>
                  )}
                </p>
                <div className="flex flex-col gap-1.5">
                  {hoveredInfo.muscles.map(({ entity, weight }) => (
                    <div key={entity} className="flex items-center gap-2 text-xs">
                      <span className="w-36 shrink-0" style={{ color: weight <= 0.22 ? 'var(--text-faint)' : 'var(--text)' }}>
                        {MUSCLE_ENTITY_LABELS[entity] ?? entity}
                      </span>
                      <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.round(weight * 100)}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand-2))' }}
                        />
                      </span>
                      <span className="font-mono text-[11px] w-9 text-right" style={{ color: 'var(--text-dim)' }}>
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-semibold">{selected.size}</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                músculo(s) selecionado(s)
              </span>
            </div>
            {selectionSummary.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Toque num músculo (ou num chip de grupo) pra selecionar. A seleção persiste ao trocar Masculino/Feminino.
              </p>
            ) : (
              <div className="flex flex-col">
                {selectionSummary.map(({ key, group, niceName, side }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs border-t first:border-t-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span>
                      {(group ? ANATOMY_GROUP_LABELS[group] : '') || key} — {niceName}
                      {side ? ` · ${side}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRegion(key)}
                      style={{ color: 'var(--text-faint)' }}
                      aria-label="Remover da seleção"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
