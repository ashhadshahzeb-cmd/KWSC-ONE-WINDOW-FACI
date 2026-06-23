// Script to list distinct years present in book_section_employees table
// Uses Supabase client with env vars (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? '',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
);

async function main() {
  // Fetch all records with passing_date (you may adjust the column name if needed)
  const { data, error } = await supabase
    .from("book_section_employees")
    .select("passing_date");

  if (error) {
    console.error("Error fetching dates:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No records with passing_date found.");
    return;
  }

  const years = new Set<number>();
  data.forEach((row: any) => {
    const dateStr = row.passing_date as string;
    // Try to parse the date string
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      years.add(date.getFullYear());
    } else {
      // fallback: extract year via regex (e.g., YYYY-MM-DD)
      const match = /^(\d{4})/.exec(dateStr);
      if (match) years.add(parseInt(match[1]));
    }
  });

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  console.log("Distinct years in book_section_employees:");
  console.log(sortedYears.join(", "));
}

main();
