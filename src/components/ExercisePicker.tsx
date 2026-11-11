import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Eye, ChevronUp } from 'lucide-react';
import { ExerciseThumbnail, ExerciseGuide } from './ExerciseVisual';
import { Sheet } from './Sheet';
import { useAppData } from '../hooks/useAppData';
import { addCustomExercise } from '../lib/actions';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from '../lib/exercises';
import { EQUIPMENT_LABELS, EQUIPMENT_ORDER, equipmentMatches, type EquipmentCategory } from '../lib/equipmentCategories';
import type { Exercise, MuscleGroup } from '../types';
export function ExercisePicker({
  open,
  onClose,
  onSelect,
  title = 'Escolher exercício',
  defaultMuscleGroup,
  excludeExerciseId,
  selectedExerciseIds = [],
  multiSelect = false,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
  /** Pré-filtra pra esse grupo muscular (ex: ao trocar um exercício, começa no mesmo grupo). */
  defaultMuscleGroup?: MuscleGroup;
  /** Esconde esse exercício da lista (ex: o que está sendo trocado, pra não "trocar" por ele mesmo). */
  excludeExerciseId?: string;
  /** Quando selecionado, permite montar várias estações sem fechar a lista. */
  multiSelect?: boolean;
  selectedExerciseIds?: string[];
}) {
  const { exercises } = useAppData();
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | 'todos'>(defaultMuscleGroup ?? 'todos');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('outro');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentCategory[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setGroupFilter(defaultMuscleGroup ?? 'todos');
      setQuery('');
      setCreating(false);
      setPreviewId(null);
      setEquipmentFilter([]);
      setAdvancedOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultMuscleGroup]);

  const grouped = useMemo(() => {
    const normalize = (value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const q = normalize(query.trim());
    const filtered = exercises.filter(
      (e) =>
        (normalize(e.name).includes(q) || normalize(e.equipment ?? '').includes(q) ||
         normalize(MUSCLE_GROUP_LABELS[e.muscleGroup]).includes(q)) &&
        e.id !== excludeExerciseId &&
        (groupFilter === 'todos' || e.muscleGroup === groupFilter) &&
        equipmentMatches(e, equipmentFilter),
    );
    const map = new Map<string, Exercise[]>();
    for (const group of MUSCLE_GROUP_ORDER) map.set(group, []);
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, []);
      map.get(ex.muscleGroup)!.push(ex);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [exercises, query, groupFilter, equipmentFilter, excludeExerciseId]);

  function handleCreate() {
    if (!newName.trim()) return;
    const ex = addCustomExercise(newName.trim(), newGroup);
    onSelect(ex);
    setNewName('');
    setCreating(false);
    setQuery('');
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício, músculo ou aparelho..."
          className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setGroupFilter('todos')}
          className="shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium"
          style={{
            background: groupFilter === 'todos' ? 'var(--brand)' : 'var(--surface-2)',
            color: groupFilter === 'todos' ? 'white' : 'var(--text-faint)',
          }}
        >
          Todos
        </button>
        {MUSCLE_GROUP_ORDER.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g as MuscleGroup)}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium"
            style={{
              background: groupFilter === g ? 'var(--brand)' : 'var(--surface-2)',
              color: groupFilter === g ? 'white' : 'var(--text-faint)',
            }}
          >
            {MUSCLE_GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      {multiSelect && <div className="rounded-xl mb-3 p-3 flex items-center gap-2" style={{background:'var(--brand-dim)'}}>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{color:'var(--brand)'}}>{selectedExerciseIds.length} exercício(s) na ficha</p>
          <p className="text-[11px] mt-1" style={{color:'var(--text-dim)'}}>Toque para adicionar. Você ajusta séries e repetições depois.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-semibold"
          style={{background:'var(--brand)',color:'white'}}>Concluir</button>
      </div>}
      <button type="button" onClick={()=>setAdvancedOpen(v=>!v)} aria-expanded={advancedOpen}
        className="flex items-center gap-2 text-xs py-2 mb-2" style={{color:'var(--brand)'}}>
        {advancedOpen ? <ChevronUp size={15}/> : <Eye size={15}/>} Mais filtros e exercício personalizado
      </button>
      {advancedOpen && <>
      <p className="text-[11px] font-semibold mb-1.5" style={{color:'var(--text-faint)'}}>
        Equipamentos disponíveis
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Filtrar por equipamento">
        <button type="button" onClick={()=>setEquipmentFilter([])}
          aria-pressed={equipmentFilter.length===0}
          className="px-2.5 py-1.5 text-xs rounded-full font-medium"
          style={{background:equipmentFilter.length===0?'var(--brand)':'var(--surface-2)',
            color:equipmentFilter.length===0?'white':'var(--text-faint)'}}>Todos</button>
        {EQUIPMENT_ORDER.map(item=>(
          <button key={item} type="button"
            aria-pressed={equipmentFilter.includes(item)}
            onClick={()=>setEquipmentFilter(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item])}
            className="px-2.5 py-1.5 text-xs rounded-full font-medium"
            style={{background:equipmentFilter.includes(item)?'var(--brand)':'var(--surface-2)',
              color:equipmentFilter.includes(item)?'white':'var(--text-faint)'}}>
            {EQUIPMENT_LABELS[item]}
          </button>
        ))}
      </div>

      {!creating ? (
        <button
          onClick={() => {
            setCreating(true);
            setNewName(query);
          }}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 text-sm font-medium"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
        >
          <Plus size={16} /> Criar exercício personalizado
        </button>
      ) : (
        <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: 'var(--surface-2)' }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do exercício"
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            {MUSCLE_GROUP_ORDER.map((g) => (
              <option key={g} value={g}>
                {MUSCLE_GROUP_LABELS[g]}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg py-2 text-sm"
              style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
              style={{ background: 'var(--brand)' }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      </>}
      <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>
        {grouped.reduce((count, [, items]) => count + items.length,0)} exercícios disponíveis · escolha um ou abra a demonstração
      </p>
      <div className="flex flex-col gap-4">
        {grouped.map(([group, list]) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-faint)' }}>
              {MUSCLE_GROUP_LABELS[group]}
            </p>
            <div className="flex flex-col gap-1">
              {list.map((ex) => (
                <div key={ex.id} className="rounded-xl overflow-hidden" style={{background:'var(--surface-2)'}}>
                  <div className="flex items-center gap-2 p-2">
                    <button type="button" aria-label={`Ver execução de ${ex.name}`}
                      onClick={() => setPreviewId(previewId === ex.id ? null : ex.id)}>
                      <ExerciseThumbnail exercise={ex} size={58}/>
                    </button>
                    <button type="button" onClick={() => onSelect(ex)}
                      disabled={multiSelect && selectedExerciseIds.includes(ex.id)}
                      className="flex-1 text-left min-w-0 py-1 disabled:opacity-60">
                      <span className="text-sm font-medium block">{ex.name}</span>
                      <span className="block text-[11px] mt-1" style={{color:'var(--text-faint)'}}>
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]}{ex.equipment ? ` · ${ex.equipment}` : ''}
                      </span>
                      <span className="text-[11px] mt-1 block" style={{color:'var(--brand)'}}>
                        {multiSelect && selectedExerciseIds.includes(ex.id) ? '✓ Adicionado ao treino' : '+ Adicionar ao treino'}
                      </span>
                    </button>
                    <button type="button" aria-label="Expandir execução" onClick={() => setPreviewId(previewId === ex.id ? null : ex.id)}
                      className="p-2" style={{color:'var(--text-faint)'}}>
                      {previewId === ex.id ? <ChevronUp size={17}/> : <Eye size={17}/>}
                    </button>
                  </div>
                  {previewId === ex.id && (
                    <div className="p-2 pt-0"><ExerciseGuide exercise={ex}/></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-faint)' }}>
            Nenhum exercício encontrado.
          </p>
        )}
      </div>
    </Sheet>
  );
}
