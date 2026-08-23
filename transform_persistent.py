import re

with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_rbac_verify.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace temp table creation
content = content.replace("CREATE TEMP TABLE IF NOT EXISTS temp_test_results", 
"""CREATE TABLE IF NOT EXISTS public.phase5b_verify_results (
    test_number INT,
    status TEXT,
    message TEXT,
    run_time TIMESTAMP DEFAULT NOW()
);
-- We use a persistent table so results survive the final exception block in Supabase UI
-- (Assuming Supabase auto-commits between statements)
""")

# Remove the old column definition block
content = re.sub(r"\(\n    test_number INT,\n    status TEXT,\n    message TEXT\n\);", "", content)

# Replace all temp_test_results with public.phase5b_verify_results
content = content.replace("temp_test_results", "public.phase5b_verify_results")

with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_rbac_verify.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated phase5b_rbac_verify.sql to use persistent table.")
