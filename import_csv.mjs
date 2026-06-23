// import_csv.mjs – download all tabs from the Google Sheet and import into Supabase
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers ---------------------------------------------------
const cleanNumber = (str) => {
  if (!str) return 0;
  const cleaned = str.toString().replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// The sheet ID (publicly shared)
const SHEET_ID = '1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
// Fetch sheet metadata to get all tabs (gid and title)
// Use hardcoded tabs since fetching them dynamically from Google Sheets HTML without API key is flaky
async function getTabInfo() {
  return [
    { title: 'CP.FUND', gid: '822396113' },
    { title: 'SUPP.SALARY', gid: '556102146' },
    { title: 'PEN', gid: '1097886470' },
    { title: 'LPR', gid: '870420719' },
    { title: 'DISB', gid: '1414441011' },
    { title: 'MED', gid: '597792612' },
    { title: 'G.INS', gid: '1074121510' }
  ];
}
// Parse a CSV string into rows
// Parse a CSV string into rows with trimmed header names
function parseCsv(csvData) {
  return parse(csvData, {
    columns: (header) => header.map((h) => h.trim().replace(/\s+/g, ' ')),
    skip_empty_lines: true,
    relax_quotes: true,
  });
}

async function main() {
  const tabs = await getTabInfo();
  if (tabs.length === 0) {
    console.error('No tabs found in the sheet.');
    return;
  }
  console.log(`Found ${tabs.length} tabs. Starting import...`);

  const rowsToInsert = [];

  for (const { gid, title } of tabs) {
    const csvUrl = `${SHEET_URL}/gviz/tq?tqx=out:csv&gid=${gid}`;
    console.log(`Downloading CSV for tab "${title}" (gid=${gid})`);
    const csvText = await fetch(csvUrl, { redirect: 'follow' }).then((r) => r.text());
    const records = parseCsv(csvText);
    console.log(`  Parsed ${records.length} records from ${title}.`);
    for (const row of records) {
      // Basic validation – skip rows without employee number/name
      if (!row['EMP NO'] && !row['EMPLOYEE NAME']) continue;

      // Map subcategory from CAT column (lower‑case, normalise some shortcuts)
      let subCat = (row['CAT'] || '').toString().toLowerCase();
      if (subCat === 'sal') subCat = 'supp-salary';
      if (subCat === 'pen') subCat = 'pension-gratuity';
      if (subCat === 'grat') subCat = 'pension-gratuity';
      if (subCat === 'medi') subCat = 'med';

      // Date parsing – the sheet uses day numbers like "7th" or full dates "20.08.2020"
      let dateVal = null;
      if (row['PASSING DATE']) {
        const parts = row['PASSING DATE'].split('.');
        if (parts.length === 3) {
            dateVal = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD.MM.YYYY to YYYY-MM-DD
        } else {
            const match = row['PASSING DATE'].match(/\d+/);
            if (match) dateVal = `2024-11-${match[0].padStart(2, '0')}`;
        }
      }

      rowsToInsert.push({
        employee_no: row['EMP NO'] || null,
        full_name: row['EMPLOYEE NAME'] || 'UNKNOWN',
        cheque_no: row['CHEQUE NO'] || null,
        source_tab: title, // keep the original tab name for later categorisation
        passing_date: dateVal,
        payment_date: dateVal,
        bank_status: row['BANK STATUS'] || 'PENDING',
        ref_care_of: row['Ref/ Care of'] || null,
        fund_amount: cleanNumber(row['FUND']),
        sal_amount: cleanNumber(row['SAL']),
        pen_amount: cleanNumber(row['PEN']), // Changed GRAT to PEN based on actual headers
        lpr_amount: cleanNumber(row['LPR']),
        disb_amount: cleanNumber(row['DISB']),
        med_amount: cleanNumber(row['MED']),
        gins_amount: cleanNumber(row['G INS']),
        total_amount: cleanNumber(row['TOTAL']),
        cheque_amount: cleanNumber(row['TOTAL']),
        sub_category_regular: subCat,
        category: row['EMP NO'] ? 'Employed' : 'Retired',
        status: 'active',
      });
    }
  }

  console.log(`Total rows to insert: ${rowsToInsert.length}`);
  // Insert in batches of 100 (Supabase limit)
  let successCount = 0;
  for (let i = 0; i < rowsToInsert.length; i += 100) {
    const chunk = rowsToInsert.slice(i, i + 100);
    const { data, error } = await supabase.from('book_section_employees').insert(chunk);
    if (error) {
      console.error('Error inserting chunk:', error);
    } else {
      successCount += chunk.length;
      console.log(`Inserted ${chunk.length} rows (total inserted: ${successCount})`);
    }
  }
  console.log(`Import completed – ${successCount} rows inserted successfully.`);
}

main().catch(console.error);
