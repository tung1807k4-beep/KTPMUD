import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rditehgedjrkupsreism.supabase.co';
const supabaseKey = 'sb_publishable_BJ1Vg3TIHa0fAIYtIT2kVw_DkmPpnGa';

export const supabase = createClient(supabaseUrl, supabaseKey);
