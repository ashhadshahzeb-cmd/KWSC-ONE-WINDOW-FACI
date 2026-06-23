import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import XLSX from 'xlsx';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const cleanNumber = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const parseTabName = (tabName) => {
    const match = tabName.match(/([A-Za-z]+)\s*(\d{2,4})/);
    if (!match) return null;
    const month = match[1].substring(0,3).toUpperCase();
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthIdx = monthNames.indexOf(month);
    if (monthIdx === -1) return null;
    let year = parseInt(match[2]);
    if (year < 100) year += 2000;
    return { year, month: monthIdx + 1, original: tabName };
};

async function downloadExcel() {
  const url = 'https://docs.google.com/spreadsheets/d/1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8/export?format=xlsx';
  console.log('Downloading Excel file...');
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          https.get(res.headers.location, (res2) => {
               const chunks = [];
               res2.on('data', c => chunks.push(c));
               res2.on('end', () => resolve(Buffer.concat(chunks)));
               res2.on('error', reject);
          });
      } else {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    });
  });
}

async function run() {
  try {
    const buffer = await downloadExcel();
    const workbook = XLSX.read(buffer, {type:'buffer'});
    console.log('Workbook loaded. Sheet Names:', workbook.SheetNames.length);

    const rowsToInsert = [];

    for (const sheetName of workbook.SheetNames) {
      const parsedDate = parseTabName(sheetName);
      if (!parsedDate) {
        console.log(`Skipping non-month tab: ${sheetName}`);
        continue;
      }
      
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      let dataStarted = false;
      
      for (const row of data) {
        // Look for the header row
        if (!dataStarted) {
           if ((row[4] && row[4].toString().includes('EMP NO')) || (row[3] && row[3].toString().includes('CAT'))) {
             dataStarted = true;
           }
           continue;
        }
        
        // Data processing
        const empNo = row[4];
        const empName = row[5];
        if (!empNo && !empName) continue; // Skip empty rows
        
        // Date parsing: e.g., '6th' -> '2024-11-06'
        let dateVal = null;
        if (row[1]) {
           const match = row[1].toString().match(/\d+/);
           if (match) {
              const day = match[0].padStart(2, '0');
              const month = parsedDate.month.toString().padStart(2, '0');
              dateVal = `${parsedDate.year}-${month}-${day}`;
           }
        }
        
        // Sub category mapping from CAT column (index 3)
        let subCat = (row[3] || '').toString().toLowerCase().trim();
        let sourceTab = (row[3] || '').toString().toUpperCase().trim();
        
        if (subCat === 'sal' || subCat === 'supp.salary') subCat = 'supp-salary';
        else if (subCat === 'pen' || subCat === 'pension') subCat = 'pension-gratuity';
        else if (subCat === 'grat') subCat = 'pension-gratuity';
        else if (subCat === 'medi' || subCat === 'med') subCat = 'med';
        else if (subCat === 'fund' || subCat === 'cp fund' || subCat === 'cp.fund') {
           subCat = 'cp-fund';
        }
        else if (subCat === 'hbl' || subCat === 'house building') subCat = 'house-building';
        else if (subCat === 'lpr') subCat = 'lpr';
        else if (subCat === 'g.ins' || subCat === 'g ins' || subCat === 'g.i') subCat = 'g-ins';
        else subCat = subCat || 'disbursement';
        
        if (!sourceTab) sourceTab = subCat.toUpperCase();
        
        // If CAT missing but amounts exist in specific columns, infer subCat
        if (!row[3]) {
           if (cleanNumber(row[7]) > 0) { sourceTab = 'SUPP.SALARY'; subCat = 'supp-salary'; }
           else if (cleanNumber(row[8]) > 0) { sourceTab = 'PEN'; subCat = 'pension-gratuity'; }
           else if (cleanNumber(row[9]) > 0) { sourceTab = 'LPR'; subCat = 'lpr'; }
           else if (cleanNumber(row[11]) > 0) { sourceTab = 'MED'; subCat = 'med'; }
           else if (cleanNumber(row[12]) > 0) { sourceTab = 'G.INS'; subCat = 'g-ins'; }
           else if (cleanNumber(row[6]) > 0) { sourceTab = 'CP.FUND'; subCat = 'cp-fund'; }
        }

        // Generate the expected source_tab for grouping: "DISB-MMM YY"
        const monthAbbr = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parsedDate.month - 1];
        const yearShort = parsedDate.year.toString().slice(-2);
        const groupingTab = `DISB-${monthAbbr} ${yearShort}`;

        rowsToInsert.push({
          employee_no: empNo ? empNo.toString().trim() : null,
          full_name: empName ? empName.toString().trim() : 'UNKNOWN',
          cheque_no: row[6] ? row[6].toString().trim() : null, // Column index 6 is CH NO
          source_tab: groupingTab, // Keep the month grouping
          passing_date: dateVal,
          payment_date: dateVal,
          bank_status: row[15] ? row[15].toString().trim() : 'PENDING',
          ref_care_of: row[2] ? row[2].toString().trim() : null,
          fund_amount: cleanNumber(row[7]),
          sal_amount: cleanNumber(row[8]),
          pen_amount: cleanNumber(row[9]),
          lpr_amount: cleanNumber(row[10]),
          disb_amount: cleanNumber(row[11]),
          med_amount: cleanNumber(row[12]),
          gins_amount: cleanNumber(row[13]),
          total_amount: cleanNumber(row[14]),
          cheque_amount: cleanNumber(row[14]),
          sub_category_regular: subCat,
          category: empNo ? 'Employed' : 'Retired',
          status: 'active',
        });
      }
    }
    
    console.log(`Total records parsed: ${rowsToInsert.length}`);
    if(rowsToInsert.length === 0) return;
    
    console.log('Cleaning old records...');
    const { error: delErr } = await supabase.from('book_section_employees').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (delErr) {
       console.error('Delete error:', delErr);
       return;
    }
    
    console.log('Inserting into Supabase in chunks of 1000...');
    let inserted = 0;
    for (let i = 0; i < rowsToInsert.length; i += 1000) {
      const chunk = rowsToInsert.slice(i, i + 1000);
      const { error } = await supabase.from('book_section_employees').insert(chunk);
      if (error) {
        console.error('Error inserting chunk:', error);
      } else {
        inserted += chunk.length;
        console.log(`Inserted ${inserted} / ${rowsToInsert.length}`);
      }
    }
    console.log('Import completed successfully!');
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
