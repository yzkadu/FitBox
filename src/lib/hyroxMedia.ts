/** 
 * HYROX media review.
 * No synthetic stick figures or ambiguous illustrations are allowed.
 * Images are shown only when an EXACT photographic match is reviewed.
 * The photographed matches remain in VERIFIED_MEDIA_IDS (exerciseMedia.ts).
 * Uncovered moves show instructions and honest pending-photo status.
 *
 * Never silently add similar exercises, mockups or generated poses.
 */
export interface HyroxMedia {
  first: string;
  second: string;
  sourceId: string;
  kind: 'foto';
  credit: string;
}
export const HYROX_MEDIA: Record<string, HyroxMedia> = {};
export const HYROX_EXPECTED_EXERCISES = [
  'ex-hyrox-ski','ex-hyrox-sled-push','ex-hyrox-sled-pull',
  'ex-hyrox-burpee','ex-remo-ergometrico','ex-hyrox-farmers',
  'ex-hyrox-sandbag','ex-hyrox-wall-ball',
  'ex-new-skiergintervalado','ex-new-remoergometricointervalado',
  'ex-new-sledpushtecnico','ex-new-burpeebroadjump',
  'ex-new-farmercarryunilateral',
] as const;
