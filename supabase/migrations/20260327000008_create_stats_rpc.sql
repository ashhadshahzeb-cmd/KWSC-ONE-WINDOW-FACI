-- Create a function to fetch aggregated statistics for the book_section_employees table
CREATE OR REPLACE FUNCTION public.get_book_section_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_count', COUNT(*),
    'total_amount', SUM(COALESCE(total_amount, 0)),
    'regular_count', COUNT(*) FILTER (WHERE category = 'Employed'),
    'retired_count', COUNT(*) FILTER (WHERE category = 'Retired')
  ) INTO result
  FROM public.book_section_employees;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_book_section_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_book_section_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_book_section_stats() TO service_role;
