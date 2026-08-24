import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('Testing Supabase endpoint:', supabaseUrl);
const supabase = createClient(supabaseUrl, anonKey);

async function testRpc() {
  // Test calling issue_recommendation_media_upload_authorization_secure with anon (should fail with permission or auth)
  const res = await supabase.rpc('issue_recommendation_media_upload_authorization_secure', {
    p_author_id: '00000000-0000-0000-0000-000000000000',
    p_destination_id: '00000000-0000-0000-0000-000000000000',
    p_reserved_recommendation_id: '00000000-0000-0000-0000-000000000000',
    p_mime_type: 'image/jpeg',
    p_file_size_bytes: 1000,
    p_original_filename: 'test image.jpg',
  });
  console.log('Direct RPC test result:', res);
}

testRpc().catch(console.error);
