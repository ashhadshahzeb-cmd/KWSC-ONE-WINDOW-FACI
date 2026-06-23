import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUniqueTabs() {
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("Fetching all records in batches of 1,000 to count source tabs...");
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('book_section_employees')
      .select('source_tab')
      .range(from, to);

    if (error) {
      console.error('Error fetching:', error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data);
      page++;
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  const uniqueTabs = [...new Set(allData.map(d => d.source_tab))];
  console.log('\nUnique source_tab values in database:', uniqueTabs);

  const counts = {};
  allData.forEach(d => {
    counts[d.source_tab] = (counts[d.source_tab] || 0) + 1;
  });
  console.log('Record counts per tab in database:', counts);
  console.log('Total records loaded in this check:', allData.length);
}

checkUniqueTabs().catch(console.error);
