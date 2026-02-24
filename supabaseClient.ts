
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgetrcaslkevjkiheuum.supabase.co';
const supabaseKey = 'sb_publishable_EpvFwaMTzutsKHfdvqrcJA__0Ob1FdQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
