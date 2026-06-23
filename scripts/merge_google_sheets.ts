// scripts/merge_google_sheets.ts
/**
 * Merge all sheets from a Google Spreadsheet into a single sheet named 'AllData'.
 * Uses a service account JSON for authentication.
 */
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';

// Load service account credentials – adjust the path as needed.
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../service-account.json');
const credentials = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

// Spreadsheet ID – extract from the URL or set via env.
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8";

async function mergeSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Get all sheet names
  const { data: meta } = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = (meta.sheets || []).map(s => s.properties?.title).filter(Boolean) as string[];

  const allRows: string[][] = [];
  let headerSet = new Set<string>();
  const sheetData: Record<string, string[][]> = {};

  // Fetch each sheet's values
  for (const name of sheetNames) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${name}`,
    });
    const rows = res.data.values || [];
    if (rows.length === 0) continue;
    const [header, ...body] = rows;
    header.forEach(h => headerSet.add(h));
    sheetData[name] = rows; // keep original for later mapping
  }

  const finalHeader = Array.from(headerSet);
  allRows.push(finalHeader);

  // Normalise each sheet's rows to the union header
  for (const name of sheetNames) {
    const rows = sheetData[name];
    if (!rows) continue;
    const [header, ...body] = rows;
    const idxMap = header.reduce((acc, h, i) => {
      acc[h] = i;
      return acc;
    }, {} as Record<string, number>);
    for (const row of body) {
      const normalized = finalHeader.map(col => row[idxMap[col]] ?? "");
      allRows.push(normalized);
    }
  }

  // Write or overwrite the AllData sheet
  // First, check if AllData exists
  const allDataSheet = (meta.sheets || []).find(s => s.properties?.title === 'AllData');
  if (allDataSheet) {
    // Clear existing rows
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AllData',
    });
  } else {
    // Add a new sheet named AllData
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'AllData' } } }],
      },
    });
  }

  // Write the combined data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'AllData!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: allRows,
    },
  });

  console.log(`Merged ${sheetNames.length} sheets into 'AllData' (${allRows.length - 1} data rows).`);
}

mergeSheets().catch(err => {
  console.error('Merge failed:', err);
  process.exit(1);
});
