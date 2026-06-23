import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

// 1. Read Supabase config from .env
const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("📖 Reading merged_employees_import.csv...");
  const fileContent = fs.readFileSync('merged_employees_import.csv', 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`📊 Found ${records.length} records to import.`);
  
  // 2. Clear old database records
  console.log("🗑️ Clearing old records from book_section_employees...");
  const { error: deleteError } = await supabase
    .from('book_section_employees')
    .delete()
    .neq('full_name', 'ClearAllRecordsWithThisDummyFilterWhichMatchesEverything');
    
  if (deleteError) {
    console.error("❌ Failed to clear old records:", deleteError.message);
    process.exit(1);
  }
  console.log("✅ Database cleared successfully.");

  // 3. Pre-process records (convert empty strings to null, parse floats)
  const numericFields = [
    'total_amount', 'balance_amount', 'cheque_amount', 'paid_amount', 
    'deduction', 'fund_amount', 'sal_amount', 'pen_amount', 'lpr_amount', 
    'disb_amount', 'med_amount', 'gins_amount', 'other_amount', 'total_disbursement'
  ];

  const dateFields = [
    'appointment_date', 'retired_date', 'disbursed_date', 
    'passing_date', 'entry_date', 'payment_date'
  ];

  const cleanedRecords = records.map(r => {
    const clean = {};
    for (const [key, val] of Object.entries(r)) {
      if (val === '') {
        clean[key] = null;
      } else if (numericFields.includes(key)) {
        clean[key] = parseFloat(val) || 0;
      } else {
        clean[key] = val;
      }
    }
    return clean;
  });

  // 4. Upload in batches of 200 (faster than 50, but safe from size limits)
  console.log("\n🚀 Uploading records to Supabase in batches...");
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 200;

  for (let i = 0; i < cleanedRecords.length; i += batchSize) {
    const batch = cleanedRecords.slice(i, i + batchSize);
    const { error } = await supabase.from('book_section_employees').insert(batch);
    
    if (error) {
      console.error(`\n❌ Error in batch starting at index ${i}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      process.stdout.write(`\r   ✅ Uploaded ${successCount}/${cleanedRecords.length} records...`);
    }
  }

  console.log(`\n\n🎉 Import completed successfully!`);
  console.log(`   ✅ Successfully imported: ${successCount} records`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed records: ${errorCount}`);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
