import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Eye, ChevronUp } from 'lucide-react';
import { ExerciseThumbnail, ExerciseGuide } from './ExerciseVisual';
import { Sheet } from './Sheet';
import { useAppData } from '../hooks/useAppData';
import { addCustomExercise } from '../lib/actions';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from '../lib/exercises';
import { exerciseMedia } from '../lib/exerciseMedia';
import type { Exercise, MuscleGroup } from '../types';
type Specialty = 'todos' | 'hyrox' | 'calistenia' | 'mobilidade' | 'antebracos' | 'panturrilhas' | 'posteriores' | 'quadriceps';
const SPECIALTIES: {key: Specialty; label: string}[] = [
  {key:'todos',label:'Todas as modalidades'},
  {key:'hyrox',label:'Funcional / HYROX'},
  {key:'calistenia',label:'Calistenia / Casa'},
  {key:'mobilidade',label:'Mobilidade / Alongamento'},
  {key:'antebracos',label:'Antebraços'},
  {key:'panturrilhas',label:'Panturrilhas'},
  {key:'posteriores',label:'Posterior de coxa'},
  {key:'quadriceps',label:'Quadríceps'},
];

function belongsToSpecialty(ex: Exercise, specialty: Specialty): boolean {
  if (specialty === 'todos') return true;
  const name = ex.name.toLowerCase();
  const equipment = ex.equipment?.toLowerCase() ?? '';
  if (specialty === 'hyrox') return ex.id.startsWith('ex-hyrox-') ||
    /hyrox|sled|trenó|ski|thruster|burpee|wall ball|farmers|caminhada do fazendeiro|batalha naval|battle rope|kettlebell|shuttle run|corda naval|step-up na caixa/.test(name);
  if (specialty === 'calistenia') return /peso corporal|barra fixa|argolas|trx/.test(equipment) ||
    /flexão de braço|flexão arqueiro|flexão diamante|prancha|agachamento livre|afundo reverso|pike push-up|barra fixa|mergulho nas paralelas|burpee|abdominal/.test(name);
  if (specialty === 'mobilidade') return /mobilidade|alongamento|rotação torácica|90\/90|world.s greatest|agachamento profundo sustentado/.test(name);
  if (specialty === 'antebracos') return /punho|antebraço|pronação|supinação|wrist|hand gripper|farmer|pegada/.test(name);
  if (specialty === 'panturrilhas') return /panturrilha|tibial/.test(name);
  if (specialty === 'posteriores') return /stiff|flexora|posterior|romeno|nordic|nórdico|good morning/.test(name);
  return /agachamento|extensora|leg press|passada|afundo|step-up|sissy|wall sit/.test(name);
}


export function ExercisePicker({
  open,
  onClose,
  onSelect,
  title = 'Escolher exercício',
  defaultMuscleGroup,
  excludeExerciseId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
  /** Pré-filtra pra esse grupo muscular (ex: ao trocar um exercício, começa no mesmo grupo). */
  defaultMuscleGroup?: MuscleGroup;
  /** Esconde esse exercício da lista (ex: o que está sendo trocado, pra não "trocar" por ele mesmo). */
  excludeExerciseId?: string;
}) {
  const { exercises } = useAppData();
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | 'todos'>(defaultMuscleGroup ?? 'todos');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('outro');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<Specialty>('todos');
  const [photoFilter, setPhotoFilter] = useState<'todos' | 'com' | 'sem'>('todos');

  useEffect(() => {
    if (open) {
      setGroupFilter(defaultMuscleGroup ?? 'todos');
      setQuery('');
      setCreating(false);
      setPreviewId(null);
      setSpecialty('todos');
      setPhotoFilter('todos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultMuscleGroup]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = exercises.filter(
      (e) =>
        (e.name.toLowerCase().includes(q) || (e.equipment?.toLowerCase().includes(q) ?? false)) &&
        e.id !== excludeExerciseId &&
        (groupFilter === 'todos' || e.muscleGroup === groupFilter) &&
        belongsToSpecialty(e, specialty) &&
        (photoFilter === 'todos' || (photoFilter === 'com' ? !!exerciseMedia(e) : !exerciseMedia(e))),
    );
    const map = new Map<string, Exercise[]>();
    for (const group of MUSCLE_GROUP_ORDER) map.set(group, []);
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, []);
      map.get(ex.muscleGroup)!.push(ex);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [exercises, query, groupFilter, specialty, photoFilter, excludeExerciseId]);

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
          placeholder="Buscar exercício..."
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

      <p className="text-[11px] font-semibold mb-1.5" style={{color:'var(--text-faint)'}}>Especialidades</p>
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
        {SPECIALTIES.map(item=>(
          <button key={item.key} type="button" onClick={() => setSpecialty(item.key)}
            className="shrink-0 px-2.5 py-1.5 text-xs rounded-full font-medium"
            style={{background:specialty===item.key ? 'var(--brand)' : 'var(--surface-2)',
              color:specialty===item.key ? '#fff' : 'var(--text-faint)'}}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Filtrar fotografias de execução">
        {([
          {key:'todos', label:'Todas as execuções'},
          {key:'com', label:'Com fotos'},
          {key:'sem', label:'Sem foto cadastrada'},
        ] as const).map(item=>(
          <button key={item.key} type="button" onClick={()=>setPhotoFilter(item.key)}
            aria-pressed={photoFilter===item.key}
            className="rounded-full px-2.5 py-1.5 text-xs font-medium"
            style={{background:photoFilter===item.key?'var(--brand)':'var(--surface-2)',
              color:photoFilter===item.key?'white':'var(--text-faint)'}}>
            {item.label}
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

      <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>{grouped.reduce((count, [, items]) => count + items.length,0)} exercícios · abra "Ver" para consultar fotos, músculos e instruções</p>
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
                      className="flex-1 text-left min-w-0 py-1">
                      <span className="text-sm font-medium block">{ex.name}</span>
                      <span className="block text-[11px] mt-1" style={{color:'var(--text-faint)'}}>
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]}{ex.equipment ? ` · ${ex.equipment}` : ''}
                      </span>
                      <span className="text-[11px] mt-1 block" style={{color:exerciseMedia(ex)?'var(--brand)':'var(--text-faint)'}}>{exerciseMedia(ex) ? (exerciseMedia(ex)?.second ? '2 fotos disponíveis' : 'Foto disponível') : 'Foto pendente'} · Selecionar</span>
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
