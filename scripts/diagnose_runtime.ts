import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('SUPABASE_URL:', supabaseUrl);
console.log('ANON_KEY present:', !!anonKey);

async function run() {
  const supabase = createClient(supabaseUrl, anonKey);

  // 1. Get recent inquiries
  const { data: inquiries, error: inqErr } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n--- RECENT INQUIRIES ---');
  if (inqErr) console.error('Inquiries error:', inqErr);
  else console.log(JSON.stringify(inquiries, null, 2));

  if (inquiries && inquiries.length > 0) {
    const inqIds = inquiries.map(i => i.id);

    // 2. Get inquiry matches for these inquiries
    const { data: matches, error: matchErr } = await supabase
      .from('inquiry_matches')
      .select('*')
      .in('inquiry_id', inqIds);

    console.log('\n--- INQUIRY MATCHES ---');
    if (matchErr) console.error('Matches error:', matchErr);
    else console.log(JSON.stringify(matches, null, 2));

    // 3. Get partner responses for these matches
    if (matches && matches.length > 0) {
      const matchIds = matches.map(m => m.id);
      const { data: responses, error: respErr } = await supabase
        .from('partner_responses')
        .select('*')
        .in('match_id', matchIds);

      console.log('\n--- PARTNER RESPONSES ---');
      if (respErr) console.error('Responses error:', respErr);
      else console.log(JSON.stringify(responses, null, 2));
    }

    // 4. Get recovery tokens from inquiry_tokens if readable (or test endpoints)
    const { data: tokens, error: tokenErr } = await supabase
      .from('inquiry_tokens')
      .select('*')
      .in('inquiry_id', inqIds);

    console.log('\n--- INQUIRY TOKENS ---');
    if (tokenErr) console.error('Tokens error:', tokenErr);
    else console.log(JSON.stringify(tokens, null, 2));
  }
}

run();
