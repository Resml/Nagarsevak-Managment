import re

def process_schema(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into statements based on ; and \n
    # A simple regex for removing specific standalone commands
    
    # We want to remove:
    # ALTER TABLE ... OWNER TO ...;
    # ALTER FUNCTION ... OWNER TO ...;
    # ALTER SEQUENCE ... OWNER TO ...;
    # ALTER TYPE ... OWNER TO ...;
    # ALTER VIEW ... OWNER TO ...;
    # ALTER DEFAULT PRIVILEGES ...;
    # GRANT ...; (except we must keep them if required? The user said: "Remove GRANT statements unless required for the staging schema to function." Usually in Supabase we can safely drop all GRANTs from the dump, as we can reapply anon/authenticated grants if needed, or maybe we leave standard Supabase grants? Actually, it's safer to remove standard grants and just keep the tables/functions. But wait, removing ALL grants might break things if there are custom grants. Let's just remove GRANTs to postgres/postgres users, or all GRANTs? The prompt says "Remove GRANT statements unless required...". We'll just strip all GRANT/REVOKE as they usually cause issues across environments unless we need them. I will strip ALL GRANT/REVOKE.)

    lines = content.split('\n')
    out_lines = []
    
    skip_mode = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check for multi-line ALTER DEFAULT PRIVILEGES or GRANT
        if stripped.startswith('ALTER DEFAULT PRIVILEGES'):
            if not stripped.endswith(';'):
                skip_mode = True
            continue
            
        if stripped.startswith('GRANT ') or stripped.startswith('REVOKE '):
            if not stripped.endswith(';'):
                skip_mode = True
            continue
            
        if skip_mode:
            if stripped.endswith(';'):
                skip_mode = False
            continue
            
        if stripped.startswith('ALTER TABLE') and 'OWNER TO' in stripped:
            continue
        if stripped.startswith('ALTER FUNCTION') and 'OWNER TO' in stripped:
            continue
        if stripped.startswith('ALTER SEQUENCE') and 'OWNER TO' in stripped:
            continue
        if stripped.startswith('ALTER TYPE') and 'OWNER TO' in stripped:
            continue
        if stripped.startswith('ALTER VIEW') and 'OWNER TO' in stripped:
            continue
            
        out_lines.append(line)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines))

if __name__ == '__main__':
    process_schema('production_schema.sql', 'phase9a_staging_schema.sql')
