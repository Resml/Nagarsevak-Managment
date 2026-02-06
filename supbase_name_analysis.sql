-- Function to get unique surnames with voter count
-- Assuming Surname is the first word of the name
CREATE OR REPLACE FUNCTION get_unique_surnames()
RETURNS TABLE (name text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') as name,
    COUNT(*) as count
  FROM voters
  WHERE COALESCE(name_marathi, name) IS NOT NULL AND COALESCE(name_marathi, name) != ''
  GROUP BY 1
  HAVING NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') IS NOT NULL
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get unique first names with voter count
-- Assuming First Name is the second word of the name
CREATE OR REPLACE FUNCTION get_unique_firstnames()
RETURNS TABLE (name text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') as name,
    COUNT(*) as count
  FROM voters
  WHERE COALESCE(name_marathi, name) IS NOT NULL AND COALESCE(name_marathi, name) != ''
  GROUP BY 1
  HAVING NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') IS NOT NULL
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk allocate caste based on Surname or First Name
CREATE OR REPLACE FUNCTION bulk_allocate_caste(
  p_names text[],
  p_name_type text, -- 'surname' or 'firstname'
  p_new_caste text
)
RETURNS void AS $$
BEGIN
  IF p_name_type = 'surname' THEN
    UPDATE voters
    SET caste = p_new_caste
    WHERE NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') = ANY(p_names);
  ELSIF p_name_type = 'firstname' THEN
    UPDATE voters
    SET caste = p_new_caste
    WHERE NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') = ANY(p_names);
  END IF;
END;
$$ LANGUAGE plpgsql;
