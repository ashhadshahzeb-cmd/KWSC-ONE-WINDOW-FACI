import fs from 'fs';
import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';

const SPREADSHEET_ID = '11ZtKMEspESmYBWJfE9urfHr1xPaQJCTSWuonu6hPunI';

// All sheet tabs with their GIDs and sub_category mappings
const SHEET_TABS = [
  { name: 'CP.FUND',        gid: '1197204556', subCatRegular: 'cp-fund',        subCatRetired: '',                  category: 'Employed' },
  { name: 'L.P.R',          gid: '632939115',  subCatRegular: '',               subCatRetired: 'lpr',               category: 'Retired'  },
  { name: 'PEN',            gid: '1980853424', subCatRegular: '',               subCatRetired: 'pension-gratuity',  category: 'Retired'  },
  { name: 'F.A',            gid: '1969439045', subCatRegular: '',               subCatRetired: 'financial-assistance', category: 'Retired' },
  { name: 'G.I',            gid: '1807905401', subCatRegular: '',               subCatRetired: 'financial-assistance', category: 'Retired' },
  { name: 'F.C',            gid: '1307696672', subCatRegular: 'funds',          subCatRetired: 'fund',              category: 'Employed' },
  { name: 'S.SALARY',       gid: '693564335',  subCatRegular: 'supp-salary',    subCatRetired: '',                  category: 'Employed' },
  { name: 'C.SALARY',       gid: '424753791',  subCatRegular: 'supp-salary',    subCatRetired: '',                  category: 'Employed' },
  { name: 'T.A.D.A',        gid: '594757827',  subCatRegular: 'tada',           subCatRetired: '',                  category: 'Employed' },
  { name: 'O.T',            gid: '1391634767', subCatRegular: 'overtime',        subCatRetired: '',                  category: 'Employed' },
  { name: 'H.B.L',          gid: '1659637705', subCatRegular: 'house-building', subCatRetired: '',                  category: 'Employed' },
  { name: 'M.M.L',          gid: '2118503822', subCatRegular: '',               subCatRetired: 'financial-assistance', category: 'Retired' },
  { name: 'MED',            gid: '1457363871', subCatRegular: '',               subCatRetired: 'financial-assistance', category: 'Retired' },
  { name: 'HINDO FESTIVAL', gid: '410041721',  subCatRegular: '',               subCatRetired: 'financial-assistance', category: 'Retired' },
];

const SPREADSHEET2_ID = '1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8';

async function fetchCSV(url) {
  const response = await fetch(url);
  return await response.text();
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/"/g, '').trim()) || 0;
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return '';
  let cleaned = dateStr.replace(/\.\./g, '.').trim();
  const separators = ['.', '-', '/'];
  let parts = null;
  for (const sep of separators) {
    const p = cleaned.split(sep);
    if (p.length === 3) { parts = p; break; }
  }
  if (!parts || parts.length !== 3) return '';
  let day = parseInt(parts[0]);
  let month = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  if (year < 100) year += 2000;
  if (month > 12 && day <= 12) { [day, month] = [month, day]; }
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function findColumn(headers, ...possibleNames) {
  for (const name of possibleNames) {
    const found = headers.find(h => h && h.trim().toUpperCase().includes(name.toUpperCase()));
    if (found) return found;
  }
  return null;
}

function safeVal(row, col) {
  if (!col || !row[col]) return '';
  return row[col].trim();
}

// ===================== PROCESS SHEET 1 TABS =====================
async function processSheet(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${tab.gid}`;
  console.log(`  📥 Downloading ${tab.name} (gid=${tab.gid})...`);

  let csvText = await fetchCSV(url);

  // Find the header row (skip title rows)
  const lines = csvText.split('\n');
  let headerLineIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].toUpperCase().includes('EMPLOYEE') || lines[i].toUpperCase().includes('EMP')) {
      headerLineIdx = i;
      break;
    }
  }
  if (headerLineIdx > 0) {
    csvText = lines.slice(headerLineIdx).join('\n');
  }

  let records;
  try {
    records = parse(csvText, { columns: true, skip_empty_lines: true, relax_column_count: true });
  } catch (e) {
    console.log(`  ⚠️  Could not parse ${tab.name}: ${e.message}`);
    return [];
  }

  if (records.length === 0) {
    console.log(`  ⚠️  No records in ${tab.name}`);
    return [];
  }

  const headers = Object.keys(records[0]);
  const colEmpNo     = findColumn(headers, 'EMPLOYEE NUMBER', 'EMP NO', 'EMP.NO', 'EMPLOYEE NO');
  const colEmpName   = findColumn(headers, 'EMPLOYEE NAME', 'EMP NAME', 'NAME');
  const colGross     = findColumn(headers, 'GROSS');
  const colNet       = findColumn(headers, 'NET');
  const colDeduction = findColumn(headers, 'DEDUCTION');
  const colChequeAmt = findColumn(headers, 'CHEQUE AMOUNT');
  const colBalance   = findColumn(headers, 'BALANCE');
  const colPassDate  = findColumn(headers, 'PASSING DATE', 'PD', 'PASSING');
  const colEntDate   = findColumn(headers, 'ENTERY DATE', 'ENTRY DATE', 'ENT DATE');
  const colPayDate   = findColumn(headers, 'PAYMENT DATE', 'PAYMENT');
  const colBankAc    = findColumn(headers, 'BANK AC', 'BANK');
  const colSerialNo  = findColumn(headers, 'S.NO', 'SR', 'SERIAL');
  const colChequeNo  = findColumn(headers, 'CHEQUE NO');
  const colNature    = findColumn(headers, 'NATURE OF BILL', 'NATURE');
  const colPmrNo     = findColumn(headers, 'PMR NO', 'PMR');
  const colChequeDate= findColumn(headers, 'CHEQUE DATE');
  const colChequeBreak = findColumn(headers, 'CHEQUE BREAK');
  const colPaidAmt   = findColumn(headers, 'PAID AMOUNT', 'PAID');
  const colStatus    = findColumn(headers, 'STATUS');
  const colPensionNo = findColumn(headers, 'P.NO', 'PENSION NO');
  const colPmrDate   = findColumn(headers, 'P.M.R DATE', 'PMR DATE');

  const rows = [];
  for (const row of records) {
    const empName = row[colEmpName]?.trim();
    if (!empName || empName === '' || empName.toUpperCase() === 'TOTAL') continue;

    const gross = colGross ? parseAmount(row[colGross]) : 0;
    const net = colNet ? parseAmount(row[colNet]) : 0;
    const chequeAmt = colChequeAmt ? parseAmount(row[colChequeAmt]) : 0;
    const balanceAmt = colBalance ? parseAmount(row[colBalance]) : 0;
    const paidAmt = colPaidAmt ? parseAmount(row[colPaidAmt]) : 0;
    const deductionAmt = colDeduction ? parseAmount(row[colDeduction]) : 0;

    const totalAmount = gross || net || chequeAmt;
    // Skip rows that are just names with no amounts (liability-only entries still included if they have a name)

    rows.push({
      employee_no:          colEmpNo ? safeVal(row, colEmpNo) : '',
      pension_no:           colPensionNo ? safeVal(row, colPensionNo) : '',
      full_name:            empName,
      cnic_no:              '',
      nominees:             '',
      appointment_date:     '',
      retired_date:         '',
      disbursed_date:       '',
      sub_category_regular: tab.subCatRegular,
      sub_category_retired: tab.subCatRetired,
      status:               colStatus ? safeVal(row, colStatus) : 'active',
      bank_details:         colBankAc ? safeVal(row, colBankAc) : '',
      total_amount:         gross || totalAmount,
      balance_amount:       balanceAmt,
      cheque_amount:        net || chequeAmt || totalAmount,
      amount_in_words:      '',
      category:             tab.category,
      serial_no:            colSerialNo ? safeVal(row, colSerialNo) : '',
      // New columns
      nature_of_bill:       colNature ? safeVal(row, colNature) : '',
      pmr_no:               colPmrNo ? safeVal(row, colPmrNo) : '',
      cheque_date:          colChequeDate ? safeVal(row, colChequeDate) : '',
      cheque_break_up:      colChequeBreak ? safeVal(row, colChequeBreak) : '',
      cheque_no:            colChequeNo ? safeVal(row, colChequeNo) : '',
      paid_amount:          paidAmt,
      deduction:            deductionAmt,
      passing_date:         colPassDate ? parseDate(row[colPassDate]) : '',
      entry_date:           colEntDate ? parseDate(row[colEntDate]) : '',
      payment_date:         colPayDate ? parseDate(row[colPayDate]) : '',
      ref_care_of:          '',
      fund_amount:          0,
      sal_amount:           0,
      pen_amount:           0,
      lpr_amount:           0,
      disb_amount:          0,
      med_amount:           0,
      gins_amount:          0,
      other_amount:         0,
      total_disbursement:   0,
      bank_status:          '',
      pmr_date:             colPmrDate ? safeVal(row, colPmrDate) : '',
      source_tab:           tab.name,
    });
  }

  console.log(`  ✅ ${tab.name}: ${rows.length} records`);
  return rows;
}

// ===================== PROCESS SHEET 2 (Disbursements) =====================
async function processSheet2() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET2_ID}/export?format=xlsx`;
  console.log(`  📥 Downloading Disbursements Sheet 2 as XLSX...`);

  let buffer;
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (e) {
    console.log(`  ⚠️  Failed to fetch XLSX: ${e.message}`);
    return [];
  }

  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch (e) {
    console.log(`  ⚠️  Could not parse Sheet 2 as XLSX: ${e.message}`);
    return [];
  }

  const rows = [];
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`  🔄 Processing tab: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    // Start reading from row 1, headers on first row
    const records = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    for (const row of records) {
      // Normalize row keys
      const r = {};
      for (const k of Object.keys(row)) {
        r[k.trim().toUpperCase()] = row[k];
      }

      const empName = String(r['EMPLOYEE NAME'] || r['EMP NAME'] || '').trim();
      if (!empName || empName === '' || empName === 'TOTAL') continue;

      const empNo       = String(r['EMP NO'] || r['EMPLOYEE NUMBER'] || '').trim();
      const chequeNo    = String(r['CHEQUE NO'] || r['CH NO'] || '').trim();
      const passingDate = parseDate(String(r['PASSING DATE'] || r['DATE'] || ''));
      const refCareOf   = String(r['REF/ CARE OF'] || r['REF'] || '').trim();
      const bankStatus  = String(r['BANK STATUS'] || r['STATUS'] || '').trim();

      const fundAmt  = parseAmount(String(r['FUND'] || ''));
      const salAmt   = parseAmount(String(r['SAL'] || ''));
      const penAmt   = parseAmount(String(r['PEN'] || r['GRAT'] || ''));
      const lprAmt   = parseAmount(String(r['LPR'] || ''));
      const disbAmt  = parseAmount(String(r['DISB'] || ''));
      const medAmt   = parseAmount(String(r['MED'] || ''));
      const ginsAmt  = parseAmount(String(r['G INS'] || ''));
      const otherAmt = parseAmount(String(r['OTHER'] || ''));
      const totalAmt = parseAmount(String(r['TOTAL'] || ''));

      if (totalAmt === 0 && fundAmt === 0 && salAmt === 0 && penAmt === 0 && lprAmt === 0 && disbAmt === 0 && medAmt === 0 && ginsAmt === 0 && otherAmt === 0) continue;

      let subCatRegular = '', subCatRetired = '', category = 'Employed';
      if (fundAmt > 0) { subCatRegular = 'funds'; }
      else if (salAmt > 0) { subCatRegular = 'supp-salary'; }
      else if (penAmt > 0) { subCatRetired = 'pension-gratuity'; category = 'Retired'; }
      else if (lprAmt > 0) { subCatRetired = 'lpr'; category = 'Retired'; }
      else if (disbAmt > 0 || medAmt > 0 || ginsAmt > 0 || otherAmt > 0) { subCatRetired = 'financial-assistance'; category = 'Retired'; }

      rows.push({
        employee_no:          empNo,
        pension_no:           '',
        full_name:            empName,
        cnic_no:              '',
        nominees:             '',
        appointment_date:     '',
        retired_date:         '',
        disbursed_date:       passingDate,
        sub_category_regular: subCatRegular,
        sub_category_retired: subCatRetired,
        status:               bankStatus || 'close',
        bank_details:         chequeNo ? `Cheque: ${chequeNo}` : '',
        total_amount:         totalAmt,
        balance_amount:       0,
        cheque_amount:        totalAmt,
        amount_in_words:      '',
        category:             category,
        serial_no:            '',
        nature_of_bill:       '',
        pmr_no:               '',
        cheque_date:          '',
        cheque_break_up:      '',
        cheque_no:            chequeNo,
        paid_amount:          0,
        deduction:            0,
        passing_date:         passingDate,
        entry_date:           '',
        payment_date:         '',
        ref_care_of:          refCareOf,
        fund_amount:          fundAmt,
        sal_amount:           salAmt,
        pen_amount:           penAmt,
        lpr_amount:           lprAmt,
        disb_amount:          disbAmt,
        med_amount:           medAmt,
        gins_amount:          ginsAmt,
        other_amount:         otherAmt,
        total_disbursement:   totalAmt,
        bank_status:          bankStatus,
        pmr_date:             '',
        source_tab:           `DISB-${sheetName.toUpperCase()}`,
      });
    }
  }

  console.log(`  ✅ Disbursements: ${rows.length} records`);
  return rows;
}

// ===================== MAIN =====================
async function main() {
  // All CSV headers (matching database columns)
  const headers = [
    'employee_no', 'pension_no', 'full_name', 'cnic_no', 'nominees',
    'appointment_date', 'retired_date', 'disbursed_date',
    'sub_category_regular', 'sub_category_retired',
    'status', 'bank_details', 'total_amount', 'balance_amount',
    'cheque_amount', 'amount_in_words', 'category', 'serial_no',
    // New columns
    'nature_of_bill', 'pmr_no', 'cheque_date', 'cheque_break_up',
    'cheque_no', 'paid_amount', 'deduction',
    'passing_date', 'entry_date', 'payment_date',
    'ref_care_of', 'fund_amount', 'sal_amount', 'pen_amount',
    'lpr_amount', 'disb_amount', 'med_amount', 'gins_amount',
    'other_amount', 'total_disbursement', 'bank_status',
    'pmr_date', 'source_tab'
  ];

  let allRows = [];

  // Process all tabs from Sheet 1
  console.log("\n🔄 Processing Sheet 1 (EMPLOYEE-LIABILITY) — All 14 Tabs:");
  for (const tab of SHEET_TABS) {
    const rows = await processSheet(tab);
    allRows = allRows.concat(rows);
  }

  // Process Sheet 2 (Disbursements)
  console.log("\n🔄 Processing Sheet 2 (Disbursements):");
  const sheet2Rows = await processSheet2();
  allRows = allRows.concat(sheet2Rows);

  // Auto-resolve missing Employee/Pension Numbers by matching exact names
  console.log("\n🔍 Resolving missing Employee / Pension numbers via Name Match...");
  const nameToEmpNo = new Map();
  const nameToPensionNo = new Map();

  allRows.forEach(row => {
    const nameKey = row.full_name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (row.employee_no && row.employee_no.trim() !== '') {
      nameToEmpNo.set(nameKey, row.employee_no.trim());
    }
    if (row.pension_no && row.pension_no.trim() !== '') {
      nameToPensionNo.set(nameKey, row.pension_no.trim());
    }
  });

  let resolvedEmpCount = 0;
  let resolvedPensionCount = 0;
  allRows.forEach(row => {
    const nameKey = row.full_name.trim().toLowerCase().replace(/\s+/g, ' ');
    if ((!row.employee_no || row.employee_no.trim() === '') && nameToEmpNo.has(nameKey)) {
      row.employee_no = nameToEmpNo.get(nameKey);
      resolvedEmpCount++;
    }
    if ((!row.pension_no || row.pension_no.trim() === '') && nameToPensionNo.has(nameKey)) {
      row.pension_no = nameToPensionNo.get(nameKey);
      resolvedPensionCount++;
    }
  });
  console.log(`  💡 Successfully resolved ${resolvedEmpCount} missing Employee Nos and ${resolvedPensionCount} missing Pension Nos using names.`);

  // Summary per tab
  console.log(`\n${'='.repeat(60)}`);
  const tabCounts = {};
  allRows.forEach(r => { tabCounts[r.source_tab] = (tabCounts[r.source_tab] || 0) + 1; });
  for (const [tab, count] of Object.entries(tabCounts)) {
    console.log(`  ${tab.padEnd(20)} : ${count} records`);
  }
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 TOTAL MERGED RECORDS: ${allRows.length}`);
  console.log(`${'='.repeat(60)}`);

  // Generate CSV
  let csvContent = headers.join(',') + '\n';
  for (const row of allRows) {
    const line = headers.map(h => escapeCSV(row[h])).join(',');
    csvContent += line + '\n';
  }

  const outputPath = 'merged_employees_import.csv';
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n🎉 CSV file saved: ${outputPath}`);
  console.log(`📁 Path: ${process.cwd()}\\${outputPath}`);
  console.log(`\n👉 Steps:`);
  console.log(`   1. Run ALTER TABLE SQL in Supabase SQL Editor (to add new columns)`);
  console.log(`   2. DELETE old records: DELETE FROM public.book_section_employees;`);
  console.log(`   3. Import this CSV via Table Editor → Import Data`);
}

main().catch(console.error);
