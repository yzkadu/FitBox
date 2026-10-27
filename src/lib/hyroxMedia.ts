/**
 * Imagens técnicas ORIGINAIS para movimentos HYROX sem fotografia exata
 * licenciada disponível. Cada estação tem duas poses com equipamentos
 * específicos; não são fotos nem animações e não substituem orientação.
 *
 * SkiErg usa quadros CC BY-SA 4.0 de Bryl Lim; remo, trenó empurrado e
 * farmer carry bilateral têm fotografias da biblioteca livre já instalada.
 */
export type ExerciseVisualKind = 'foto' | 'ilustracao';
export interface HyroxMedia {
  first: string;
  second: string;
  sourceId: string;
  kind: ExerciseVisualKind;
  credit: string;
}

const GUIDE_URL = 'https://raw.githubusercontent.com/bryllim/workout-guide/main/packages/workout-guide/assets';
const white = '#E9E3F1';
const purple = '#A871FF';
const muted = '#7B738B';
const sand = '#DDAD65';

function path(d: string, stroke = white, width = 13) {
  return '<path d="' + d + '" fill="none" stroke="' + stroke +
    '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"/>';
}
function dot(cx:number, cy:number, radius = 18, color = white) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + color + '"/>';
}
function figure(parts: string, head: [number, number]) {
  return '<g>'+dot(head[0],head[1])+parts+'</g>';
}
const ground = path('M22 294 H398',muted,3);
function sled(x=34) {
  return '<rect x="'+x+'" y="245" width="86" height="31" rx="4" fill="#443353" stroke="'+purple+'" stroke-width="4"/>'+
    '<rect x="'+(x+18)+'" y="220" width="48" height="25" rx="2" fill="#80669D"/>'+
    path('M'+(x+6)+' 278 h76',purple,6);
}
const bag=(x:number,y:number)=>'<rect x="'+x+'" y="'+y+'" width="100" height="31" rx="14" fill="'+sand+'" stroke="#FFE3A3" stroke-width="3"/>';
const kb=(x:number,y:number)=>'<g stroke="'+purple+'" stroke-width="5" fill="#6D4299">'+
  '<path d="M'+(x+10)+' '+(y+9)+' v-11 q0 -15 13 -15 q13 0 13 15 v11" fill="none"/>'+
  '<rect x="'+x+'" y="'+y+'" width="46" height="61" rx="16"/></g>';

function scene(station: string, phase: 0 | 1) {
  let drawing = '';
  let focus = '';
  switch(station) {
    case 'sled-pull':
      focus = phase===0?'SEGURE A CORDA':'PUXE E RECUPE';
      drawing = sled(25) + path('M115 251 L268 177',purple,5) +
        (phase===0
          ? figure(
              path('M304 135 L270 196 L295 242 L275 290')+
              path('M270 196 L336 232 L349 290')+
              path('M294 151 L269 183 L255 178')+
              path('M296 153 L283 183 L267 178'),[303,116])
          : figure(
              path('M325 128 L296 193 L282 244 L270 290')+
              path('M296 193 L345 238 L365 290')+
              path('M315 151 L284 161 L266 155')+
              path('M315 149 L286 174 L260 173'),[326,108]));
      break;
    case 'burpee-broad':
      focus = phase===0?'BURPEE NO SOLO':'SALTO À FRENTE';
      drawing = phase===0
        ? figure(path('M100 238 L183 221 L271 235 L351 251')+
          path('M182 221 L154 260 L135 288')+
          path('M183 221 L194 266 L196 290')+
          path('M270 235 L320 260 L351 264'),[83,232])
        : figure(path('M228 101 L220 173 L259 214 L306 266')+
          path('M220 173 L190 219 L164 269')+
          path('M217 123 L164 147 L129 181')+
          path('M234 124 L287 154 L324 169'),[225,76])+
          '<path d="M75 283 Q194 318 348 278" stroke="'+purple+'" stroke-width="5" stroke-dasharray="10 14" fill="none"/>';
      break;
    case 'sandbag-lunge':
      focus = phase===0?'SACO NOS OMBROS':'AFUNDO CONTROLADO';
      drawing = bag(164,89)+(phase===0
        ? figure(
          path('M216 131 L213 216 L200 258 L197 292')+
          path('M213 216 L256 257 L258 291')+
          path('M211 142 L176 136 L167 110')+
          path('M228 144 L258 136 L266 110'),[214,113])
        : figure(
          path('M215 130 L220 194 L280 229 L326 247')+
          path('M220 194 L165 236 L156 288')+
          path('M225 143 L186 133 L177 112')+
          path('M225 143 L253 133 L261 112'),[216,112]));
      break;
    case 'wall-ball':
      focus = phase===0?'AGACHE COM A BOLA':'ESTENDA E ARREMESSE';
      drawing = '<rect x="344" y="24" width="12" height="230" fill="#494057"/>'+
        '<rect x="308" y="44" width="72" height="36" rx="6" fill="#6E3F96" stroke="'+purple+'" stroke-width="3"/>'+
        (phase===0
        ? figure(path('M185 132 L209 201 L160 237 L142 288')+
          path('M209 201 L268 239 L276 288')+
          path('M192 144 L240 146 L251 171')+
          path('M185 142 L170 179 L195 183'),[182,108])+dot(229,174,19,sand)
        : figure(path('M214 94 L209 198 L193 261 L188 293')+
          path('M209 198 L236 266 L246 293')+
          path('M210 112 L248 66 L285 60')+
          path('M202 113 L177 66 L177 43'),[213,73])+dot(317,55,19,sand));
      break;
    case 'single-farmer':
      focus = phase===0?'PEGADA UNILATERAL':'ANDE SEM INCLINAR';
      drawing=kb(258,220)+(phase===0
        ? figure(path('M195 100 L201 188 L174 244 L163 292')+
          path('M201 188 L223 246 L227 292')+
          path('M188 122 L168 178 L163 218')+
          path('M209 119 L249 168 L275 225'),[194,75])
        : figure(path('M200 100 L207 184 L255 223 L282 282')+
          path('M207 184 L168 249 L151 287')+
          path('M192 122 L172 175 L155 207')+
          path('M213 122 L247 175 L275 220'),[201,75]));
      break;
    default:
      return '';
  }

  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" role="img">'+
    '<rect width="420" height="340" rx="15" fill="#16131C"/>'+
    '<rect x="11" y="11" width="398" height="318" rx="12" fill="none" stroke="#503668" stroke-width="2"/>'+
    ground+drawing+
    '<rect x="12" y="308" width="396" height="21" rx="6" fill="#251B30"/>'+
    '<text x="210" y="323" text-anchor="middle" fill="'+purple+
    '" font-size="13" font-weight="bold" font-family="Arial,sans-serif">'+focus+'</text></svg>';
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

const picture = (station:string): HyroxMedia => ({
  first: scene(station,0),
  second: scene(station,1),
  sourceId: 'fitbox-hyrox-'+station,
  kind: 'ilustracao',
  credit: 'Ilustração técnica original FitBox; poses orientativas, não fotografia.',
});

const ski: HyroxMedia = {
  first: GUIDE_URL+'/skierg/frame-1.png',
  second: GUIDE_URL+'/skierg/frame-3.png',
  sourceId:'workout-guide/skierg',
  kind:'ilustracao',
  credit:'Bryl Lim / workout-guide (ilustrações sob CC BY-SA 4.0).',
};

export const HYROX_MEDIA: Record<string, HyroxMedia> = {
  'ex-hyrox-ski': ski,
  'ex-new-skiergintervalado': ski,
  'ex-hyrox-sled-pull': picture('sled-pull'),
  'ex-hyrox-burpee': picture('burpee-broad'),
  'ex-new-burpeebroadjump': picture('burpee-broad'),
  'ex-hyrox-sandbag': picture('sandbag-lunge'),
  'ex-hyrox-wall-ball': picture('wall-ball'),
  'ex-new-farmercarryunilateral': picture('single-farmer'),
};

/** Algumas estações usam fotografias exatas existentes no catálogo base.
 * Os IDs abaixo precisam ser cobertos em exerciseMedia.ts.
 */
export const HYROX_EXPECTED_EXERCISES = [
  'ex-hyrox-ski','ex-hyrox-sled-push','ex-hyrox-sled-pull',
  'ex-hyrox-burpee','ex-remo-ergometrico','ex-hyrox-farmers',
  'ex-hyrox-sandbag','ex-hyrox-wall-ball',
  'ex-new-skiergintervalado','ex-new-remoergometricointervalado',
  'ex-new-sledpushtecnico','ex-new-burpeebroadjump',
  'ex-new-farmercarryunilateral',
] as const;
