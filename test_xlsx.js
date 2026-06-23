const fs = require('fs');
const xlsx = require('xlsx');

async function test() {
  console.log("Downloading...");
  const res = await fetch('https://docs.google.com/spreadsheets/d/1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8/export?format=xlsx');
  const buffer = await res.arrayBuffer();
  console.log("Parsing...");
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  console.log("Sheets:", workbook.SheetNames);
}
test().catch(console.error);
