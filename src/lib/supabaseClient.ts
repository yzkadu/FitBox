import { createClient } from '@supabase/supabase-js';

// Essas chaves são públicas por design (a "publishable key" do Supabase é segura
// para expor no navegador — o acesso aos dados é controlado pelas políticas de
// Row Level Security no banco, não pelo sigilo desta chave).
const SUPABASE_URL = 'https://jeeqklhckuwcgqygadpu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vc9GJoZnx8Em3Ou_8k-1Rg_V63uIt8F';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
