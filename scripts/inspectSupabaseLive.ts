import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, anonKey);

async function inspectSupabase() {
  console.log('Project URL:', supabaseUrl);

  // Check service areas
  const { data: saData, error: saErr } = await supabase.from('service_areas').select('id, name, country_code').limit(5);
  console.log('service_areas query:', { count: saData?.length, saErr });

  // Check system_settings
  const { data: ssData, error: ssErr } = await supabase.from('system_settings').select('key, value').limit(5);
  console.log('system_settings query:', { data: ssData, ssErr });

  // Check schema migrations table if accessible
  const { data: migData, error: migErr } = await supabase.from('schema_migrations').select('*').limit(5);
  console.log('schema_migrations query:', { migData, migErr });

  // Check _prisma_migrations or supabase_migrations
  const { data: smData, error: smErr } = await supabase.from('supabase_migrations').select('*').limit(5);
  console.log('supabase_migrations query:', { smData, smErr });
}

inspectSupabase().catch(console.error);
