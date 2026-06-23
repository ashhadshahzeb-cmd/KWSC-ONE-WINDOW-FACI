import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://lhnogjmeyqbuoiruykpw.supabase.co'
const supabaseKey = 'sb_publishable_t4svZ8krxb9VqkPA0epoDQ_s-av_vnE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEntries() {
  const { data, error, count } = await supabase
    .from('file_tracking_records')
    .select('*', { count: 'exact' })
  
  if (error) {
    console.error('Error fetching:', error)
  } else {
    // Count total forwards
    let totalForwards = 0;
    data.forEach(row => {
      if (row.history && Array.isArray(row.history)) {
        totalForwards += row.history.length;
      }
    });

    console.log(`\n=========================================`);
    console.log(`Total Unique Files Registered: ${count}`);
    console.log(`Total Forwarding Steps (History): ${totalForwards}`);
    console.log(`Total Tracking Events combined: ${count + totalForwards}`);
    console.log(`=========================================\n`);
    
  }
}

checkEntries()
