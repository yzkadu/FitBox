/**
 * Fotos REAIS, individuais e com licença identificada.
 * Ausência de correspondência exata = sem foto, nunca imagem improvisada.
 * Fotografias com uma posição NÃO são falsamente anunciadas como duas fases.
 * Os arquivos são servidos por Wikimedia Commons, preservando metadados.
 */
export interface HyroxMedia {
  first: string;
  second?: string;
  sourceId: string;
  kind: 'foto';
  credit: string;
  sourceUrl?: string;
}
const commons = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
function photo(filename:string, credit:string, sourceId:string): HyroxMedia {
  return {
    first: commons + encodeURIComponent(filename.replaceAll(' ','_')),
    sourceId,
    kind: 'foto',
    credit,
    sourceUrl:'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(filename.replaceAll(' ','_')),
  };
}
const skierg = photo(
  'CrossFit workout on SkiErg DSC1807.jpg',
  'Foto: Kiet Le, CC BY 2.0 — Wikimedia Commons. Atleta usando SkiErg.',
  'wikimedia-crossfit-skierg',
);
const burpee = photo(
  'Lauren at 2021 WC burpee broad jump.png',
  'Foto: HybridFitty, CC BY 4.0 — Wikimedia Commons. Burpee broad jump em competição HYROX.',
  'wikimedia-hyrox-burpee-broad',
);
const wallball = photo(
  'Lauren at EU Championships 2023 Wall Balls.png',
  'Foto: HybridFitty, CC BY 4.0 — Wikimedia Commons. Wall balls em competição HYROX.',
  'wikimedia-hyrox-wall-balls',
);
const sandbag = photo(
  'Sandbag competition.jpg',
  'Foto: U.S. Navy/USMC, domínio público nos EUA — Wikimedia Commons. Afundo carregando sandbag.',
  'wikimedia-sandbag-lunges',
);
export const HYROX_MEDIA: Record<string, HyroxMedia> = {
  'ex-hyrox-ski': skierg,
  'ex-new-skiergintervalado': skierg,
  'ex-hyrox-burpee': burpee,
  'ex-new-burpeebroadjump': burpee,
  'ex-hyrox-wall-ball': wallball,
  'ex-hyrox-sandbag': sandbag,
};
export const HYROX_EXPECTED_EXERCISES = [
  'ex-hyrox-ski','ex-hyrox-sled-push','ex-hyrox-sled-pull',
  'ex-hyrox-burpee','ex-remo-ergometrico','ex-hyrox-farmers',
  'ex-hyrox-sandbag','ex-hyrox-wall-ball',
  'ex-new-skiergintervalado','ex-new-remoergometricointervalado',
  'ex-new-sledpushtecnico','ex-new-burpeebroadjump',
  'ex-new-farmercarryunilateral',
] as const;
