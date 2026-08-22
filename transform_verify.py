import re

with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_rbac_verify.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to prepend the TEMP TABLE creation before the DO $$
header_insert = """
-- =============================================================================
-- TEST RESULTS TABLE SETUP
-- =============================================================================
CREATE TEMP TABLE IF NOT EXISTS temp_test_results (
    test_number INT,
    status TEXT,
    message TEXT
);
TRUNCATE temp_test_results;

"""

content = content.replace("DO $$\nDECLARE", header_insert + "DO $$\nDECLARE")

# Replace RAISE EXCEPTION 'TEST X FAIL: message', var;
def replace_exception(match):
    test_num = match.group(1)
    msg = match.group(2)
    var = match.group(3).strip()
    
    # If there's a variable after the string, we need to handle format strings
    if var and var.startswith(','):
        # Convert % to ' || var || '
        var_name = var[1:].strip()
        msg_sql = f"REPLACE('{msg}', '%', ({var_name})::text)"
        return f"INSERT INTO temp_test_results (test_number, status, message) VALUES ({test_num}, 'FAIL', {msg_sql});"
    else:
        return f"INSERT INTO temp_test_results (test_number, status, message) VALUES ({test_num}, 'FAIL', '{msg}');"

content = re.sub(r"RAISE EXCEPTION 'TEST (\d+)\s+FAIL:\s+(.*?)'(.*?);", replace_exception, content)

# Replace RAISE NOTICE 'TEST X PASS: message';
def replace_notice(match):
    test_num = match.group(1)
    msg = match.group(2)
    return f"INSERT INTO temp_test_results (test_number, status, message) VALUES ({test_num}, 'PASS', '{msg}');"

content = re.sub(r"RAISE NOTICE 'TEST (\d+)\s+PASS:\s+(.*?)';", replace_notice, content)

# Remove any stray END IFs that might have been part of RAISE EXCEPTION blocks? No, we just replaced the statement inside the IF.
# BUT wait! If we don't RAISE EXCEPTION, the DO block CONTINUES!
# That's exactly what we want! We want it to collect all results.

# Add the final SELECT and the final exception block at the very end of the file.
footer = """

-- =============================================================================
-- TEST RESULTS OUTPUT
-- =============================================================================
SELECT test_number, status, message 
FROM temp_test_results 
ORDER BY test_number;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM temp_test_results WHERE status = 'FAIL') THEN
        RAISE EXCEPTION 'PHASE 5B VERIFICATION FAILED: One or more tests failed. Check the results table above.';
    END IF;
    RAISE NOTICE 'PHASE 5B VERIFICATION PASSED COMPLETELY.';
END $$;
"""

content += footer

with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_rbac_verify_updated.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created phase5b_rbac_verify_updated.sql")
