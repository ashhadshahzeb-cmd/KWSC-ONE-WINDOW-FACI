import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: records, error } = await supabase
    .from('book_section_employees')
    .select('id, fund_amount, sal_amount, pen_amount, lpr_amount, med_amount, gins_amount, disb_amount, sub_category_regular')
    .eq('source_tab', 'DISB-NOV24');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${records.length} records to fix.`);

  const updatesByTab = {};

  for (const r of records) {
    let newTab = 'DISB';
    
    if (r.fund_amount > 0) newTab = 'CP.FUND';
    else if (r.sal_amount > 0) newTab = 'S.SALARY';
    else if (r.pen_amount > 0) newTab = 'PEN';
    else if (r.lpr_amount > 0) newTab = 'L.P.R';
    else if (r.med_amount > 0) newTab = 'MED';
    else if (r.gins_amount > 0) newTab = 'G.I';
    else if (r.sub_category_regular === 'house-building') newTab = 'H.B.L';
    else if (r.sub_category_regular === 'motorcycle-loan') newTab = 'M.M.L';

    if (!updatesByTab[newTab]) updatesByTab[newTab] = [];
    updatesByTab[newTab].push(r.id);
  }

  let totalUpdated = 0;
  for (const [tab, ids] of Object.entries(updatesByTab)) {
    console.log(`Updating ${ids.length} records to tab: ${tab}`);
    // Update in batches of 100 to avoid long URLs in IN clause
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { error: updateErr } = await supabase
        .from('book_section_employees')
        .update({ source_tab: tab })
        .in('id', chunk);
        
      if (updateErr) {
        console.error(`Error updating tab ${tab}:`, updateErr);
      } else {
        totalUpdated += chunk.length;
      }
    }
  }

  console.log(`Updated ${totalUpdated} records successfully.`);
}

fix().catch(console.error);
