import psycopg2

conn = psycopg2.connect("dbname=postgres user=postgres password=postgres host=localhost port=5432")
cur = conn.cursor()
cur.execute("""
    SELECT policyname, roles 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND policyname LIKE '%public%' 
      AND (roles::text LIKE '%anon%' OR roles::text LIKE '%public%')
""")
print(cur.fetchall())
