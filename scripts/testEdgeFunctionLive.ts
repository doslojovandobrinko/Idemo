import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testEdgeFunction() {
  console.log('Testing Edge Function at:', `${supabaseUrl}/functions/v1/editorial_workflow_engine/health`);

  const res = await fetch(`${supabaseUrl}/functions/v1/editorial_workflow_engine/health`, {
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
  });

  console.log('Edge Function health response status:', res.status);
  const text = await res.text();
  console.log('Response body:', text);
}

testEdgeFunction().catch(console.error);
