import { createClient } from '@supabase/supabase-js';

// Supabase connectie
const supabaseUrl = 'https://jczjejgwdfkkshuxgbpf.supabase.co';
const supabaseAnonKey = 'sb_publishable_J3R7ixb_FQJnvaGXiF01Jw_6bP2v3T2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
