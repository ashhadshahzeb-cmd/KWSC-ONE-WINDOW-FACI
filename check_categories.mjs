import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhnogjmeyqbuoiruykpw.supabase.co';
const supabaseKey = 'sb_publishable_t4svZ8krxb9VqkPA0epoDQ_s-av_vnE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('file_tracking_records')
    .select('main_category, sub_category');

  if (error) {
    console.error('Error fetching records:', error);
    return;
  }

  const counts = {};
  data.forEach(r => {
    const key = `${r.main_category} | ${r.sub_category}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  console.log('\nCategory Combinations in Database:');
  console.log(JSON.stringify(counts, null, 2));
}

run().catch(console.error);
