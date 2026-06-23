import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lhnogjmeyqbuoiruykpw.supabase.co',
  'sb_publishable_t4svZ8krxb9VqkPA0epoDQ_s-av_vnE'
);

async function verify() {
  console.log('\n📊 Checking exact total count in database...\n');

  // Use count only — no row limit
  const { count, error } = await supabase
    .from('book_section_employees')
    .select('*', { count: 'exact', head: true });

  if (error) { console.error('Error:', error.message); return; }
  console.log(`📦 TOTAL ROWS IN DATABASE: ${count}`);

  if (count < 10000) {
    console.log('\n⚠️  WARNING: Expected ~54,864 records but found only', count);
    console.log('   → The CSV import was likely incomplete or truncated.');
    console.log('   → Need to re-import the CSV file to Supabase.');
  } else {
    console.log('\n✅ Record count looks good!');
  }

  // Get unique source_tab counts using range-based pagination
  console.log('\n📅 Fetching all unique source_tabs...');
  const tabCounts = {};
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error: err } = await supabase
      .from('book_section_employees')
      .select('source_tab')
      .range(from, from + pageSize - 1);

    if (err) { console.error(err.message); break; }
    if (!data || data.length === 0) break;

    for (const r of data) {
      const tab = r.source_tab || 'NULL';
      tabCounts[tab] = (tabCounts[tab] || 0) + 1;
    }

    from += pageSize;
    if (data.length < pageSize) break;
    process.stdout.write(`  Scanned ${from} rows...\r`);
  }

  console.log('\n');
  const allTabs = Object.entries(tabCounts).sort(([a],[b]) => a.localeCompare(b));
  const disbTabs = allTabs.filter(([k]) => k.startsWith('DISB-'));
  const otherTabs = allTabs.filter(([k]) => !k.startsWith('DISB-'));

  console.log('='.repeat(50));
  console.log('📁 SHEET 1 TABS:');
  for (const [tab, cnt] of otherTabs) console.log(`  ${tab.padEnd(28)} : ${cnt}`);
  
  console.log('\n📅 DISBURSEMENT MONTHS (' + disbTabs.length + '):');
  for (const [tab, cnt] of disbTabs) console.log(`  ${tab.padEnd(32)} : ${cnt}`);
  console.log('='.repeat(50));
  console.log(`TOTAL RECORDS SCANNED: ${Object.values(tabCounts).reduce((a,b)=>a+b,0)}`);
}

verify().catch(console.error);
