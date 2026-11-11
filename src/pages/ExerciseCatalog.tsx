import {useMemo,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, Search, SlidersHorizontal, Eye, ChevronDown, Plus} from 'lucide-react';
import {useAppData} from '../hooks/useAppData';
import {MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER} from '../lib/exercises';
import {EQUIPMENT_ORDER,EQUIPMENT_LABELS,equipmentMatches,type EquipmentCategory} from '../lib/equipmentCategories';
import {ExerciseGuide,ExerciseThumbnail} from '../components/ExerciseVisual';
import type {Exercise,MuscleGroup} from '../types';

/** Catálogo completo somente leitura. Selecionar aqui nunca altera fichas ou histórico. */
export function ExerciseCatalog() {
  const navigate=useNavigate();
  const {exercises}=useAppData();
  const [query,setQuery]=useState('');
  const [group,setGroup]=useState<MuscleGroup|'todos'>('todos');
  const [equipment,setEquipment]=useState<EquipmentCategory[]>([]);
  const [advanced,setAdvanced]=useState(false);
  const [expandedId,setExpandedId]=useState<string|null>(null);
  const matches=useMemo(()=>{
    const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const q=normalized(query.trim());
    return exercises.filter(ex=>
      (normalized(ex.name).includes(q)||normalized(ex.equipment??'').includes(q)||
      normalized(MUSCLE_GROUP_LABELS[ex.muscleGroup]??'').includes(q)) &&
      (group==='todos'||ex.muscleGroup===group) && equipmentMatches(ex,equipment))
      .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  },[exercises,query,group,equipment]);
  const grouped=useMemo(()=>{
    const map=new Map<MuscleGroup,Exercise[]>();
    for(const ex of matches)map.set(ex.muscleGroup,[...(map.get(ex.muscleGroup)??[]),ex]);
    return [...map.entries()].sort((a,b)=>MUSCLE_GROUP_ORDER.indexOf(a[0])-MUSCLE_GROUP_ORDER.indexOf(b[0]));
  },[matches]);
  return <div className="px-4 pb-24">
    <div className="flex items-center gap-3 pt-5 mb-2">
      <button type="button" onClick={()=>navigate('/treinos')} aria-label="Voltar aos treinos"><ArrowLeft size={20}/></button>
      <div className="flex-1"><h1 className="text-xl font-semibold">Biblioteca de exercícios</h1>
        <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>{exercises.length} exercícios no seu catálogo · consulte execução e músculos</p></div>
    </div>
    <div className="relative mt-5 mb-3"><Search size={17} className="absolute left-3 top-3" style={{color:'var(--text-faint)'}}/>
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
        placeholder="Buscar exercício, aparelho ou músculo..." aria-label="Buscar na biblioteca de exercícios"
        className="w-full rounded-xl pl-10 pr-3 py-3 text-sm" style={{background:'var(--surface-2)'}}/></div>
    <div className="flex gap-2 overflow-x-auto pb-2 mb-2" aria-label="Filtrar por grupo muscular">
      <button type="button" onClick={()=>setGroup('todos')} aria-pressed={group==='todos'}
        className="shrink-0 rounded-full px-3 py-2 text-xs"
        style={{background:group==='todos'?'var(--brand)':'var(--surface-2)',color:group==='todos'?'white':'var(--text)'}}>Todos</button>
      {MUSCLE_GROUP_ORDER.map(g=><button key={g} type="button" onClick={()=>setGroup(g)} aria-pressed={group===g}
        className="shrink-0 rounded-full px-3 py-2 text-xs"
        style={{background:group===g?'var(--brand)':'var(--surface-2)',color:group===g?'white':'var(--text)'}}>{MUSCLE_GROUP_LABELS[g]}</button>)}
    </div>
    <button type="button" onClick={()=>setAdvanced(v=>!v)} aria-expanded={advanced}
      className="flex items-center gap-2 text-xs py-2 mb-2" style={{color:'var(--brand)'}}>
      <SlidersHorizontal size={15}/> Filtrar por equipamento <ChevronDown size={13}/>
    </button>
    {advanced&&<div className="flex flex-wrap gap-2 mb-4">
      <button type="button" onClick={()=>setEquipment([])} className="rounded-full px-3 py-1.5 text-xs" aria-pressed={!equipment.length}
        style={{background:!equipment.length?'var(--brand)':'var(--surface-2)',color:!equipment.length?'white':'var(--text)'}}>Todos os equipamentos</button>
      {EQUIPMENT_ORDER.map(item=><button key={item} type="button" aria-pressed={equipment.includes(item)}
        onClick={()=>setEquipment(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item])}
        className="rounded-full px-3 py-1.5 text-xs" style={{background:equipment.includes(item)?'var(--brand)':'var(--surface-2)',color:equipment.includes(item)?'white':'var(--text)'}}>{EQUIPMENT_LABELS[item]}</button>)}
    </div>}
    <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>{matches.length} resultado(s) · toque em “Ver execução” para detalhes e anatomia</p>
    <div className="flex flex-col gap-4">
      {grouped.map(([g,list])=><section key={g}>
        <h2 className="text-xs uppercase font-semibold tracking-wide mb-2" style={{color:'var(--text-faint)'}}>{MUSCLE_GROUP_LABELS[g]} · {list.length}</h2>
        <div className="flex flex-col gap-2">
          {list.map(ex=><div key={ex.id} className="rounded-xl overflow-hidden" style={{background:'var(--surface-2)'}}>
            <div className="flex gap-3 items-center p-3">
              <ExerciseThumbnail exercise={ex} size={57}/>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{ex.name}</p>
                <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>{ex.equipment||MUSCLE_GROUP_LABELS[g]}</p></div>
              <button type="button" onClick={()=>setExpandedId(v=>v===ex.id?null:ex.id)} aria-expanded={expandedId===ex.id}
                aria-label={'Ver execução de '+ex.name} className="rounded-lg p-2 text-xs flex items-center gap-1"
                style={{color:'var(--brand)'}}><Eye size={16}/> Ver</button>
            </div>
            {expandedId===ex.id&&<div className="p-3 pt-0"><ExerciseGuide exercise={ex}/></div>}
          </div>)}
        </div>
      </section>)}
      {!matches.length&&<p className="text-center text-sm py-8" style={{color:'var(--text-dim)'}}>Nada encontrado. Experimente outro músculo ou retire os filtros.</p>}
    </div>
    <button type="button" onClick={()=>navigate('/treinos')} className="w-full mt-6 rounded-xl py-3 text-sm font-medium"
      style={{background:'var(--brand-dim)',color:'var(--brand)'}}> <Plus size={15} className="inline mr-2"/>Criar treino com estes exercícios</button>
  </div>;
}
