import { useNavigate } from 'react-router-dom';
import { Apple, ArrowRight } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { Card } from './ui';

export function NutritionQuickCard({compact=false}:{compact?:boolean}) {
  const navigate=useNavigate();
  const {nutritionEntries,nutritionGoal}=useAppData();
  const d=new Date();
  const today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const consumed=nutritionEntries.filter(x=>x.date===today).reduce((sum,x)=>sum+x.proteinG,0);
  const cals=nutritionEntries.filter(x=>x.date===today).reduce((sum,x)=>sum+x.caloriesKcal,0);
  const target=nutritionGoal?.proteinG??0;
  const pct=target>0?Math.min(100,Math.round(consumed/target*100)):0;
  return (
    <Card className="mb-4">
      <button type="button" onClick={()=>navigate('/nutricao')} className="flex items-center gap-3 w-full text-left">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{background:'var(--brand-dim)',color:'var(--brand)'}}><Apple size={20}/></span>
        <span className="flex-1 min-w-0">
          <span className="font-semibold text-sm block">Nutrição e metas</span>
          <span className="text-xs mt-1 block" style={{color:'var(--text-dim)'}}>
            {nutritionGoal
              ? `Proteína: ${Number(consumed.toFixed(1))} / ${nutritionGoal.proteinG} g · ${Math.round(cals)} kcal registradas hoje`
              : 'Defina proteínas, carboidratos, gorduras e calorias para o seu objetivo'}
          </span>
        </span>
        <ArrowRight size={17} style={{color:'var(--brand)'}}/>
      </button>
      {!compact && target>0 && (
        <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{background:'var(--surface-3)'}}>
          <div className="h-full rounded-full" style={{width:pct+'%',background:'var(--brand)'}}/>
        </div>
      )}
    </Card>
  );
}
