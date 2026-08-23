import json

def load_data(filename):
    with open(filename, 'r', encoding='utf-16le') as f:
        content = f.read()
        try:
            start_idx = content.index('{')
            end_idx = content.rindex('}') + 1
            json_str = content[start_idx:end_idx]
            data = json.loads(json_str)
            return [r['row_to_json'] for r in data.get('rows', [])]
        except Exception as e:
            print(f"Error parsing {filename}: {e}")
            return []

def format_value(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        v = v.replace("'", "''")
        return f"'{v}'"
    json_val = json.dumps(v).replace("'", "''")
    return f"'{json_val}'::jsonb"

def generate_insert(table, data, conflict_col):
    if not data:
        return f"-- No data for {table}\n"
    
    cols = list(data[0].keys())
    
    sql = f"-- Table: {table}\n"
    sql += f"INSERT INTO public.{table} ({', '.join(cols)})\nVALUES\n"
    
    val_lines = []
    for row in data:
        vals = [format_value(row.get(c)) for c in cols]
        val_lines.append(f"  ({', '.join(vals)})")
    
    sql += ",\n".join(val_lines)
    
    sql += f"\nON CONFLICT ({conflict_col}) DO UPDATE SET\n"
    update_lines = []
    for c in cols:
        if c != conflict_col:
            update_lines.append(f"  {c} = EXCLUDED.{c}")
    
    sql += ",\n".join(update_lines) + ";\n\n"
    return sql

def main():
    plans = load_data('scratch/plans_data.txt')
    features = load_data('scratch/features_data.txt')
    plan_features = load_data('scratch/plan_features_data.txt')
    
    out = "-- Production-to-Staging Configuration Data Migration\n"
    out += "-- Idempotent insert of plans, features, and plan_features\n\n"
    
    out += "BEGIN;\n\n"
    
    out += generate_insert('plans', plans, 'id')
    out += generate_insert('features', features, 'id')
    out += generate_insert('plan_features', plan_features, 'plan_id, feature_id')
    
    out += "COMMIT;\n"
    
    with open('phase9a_staging_config_migration.sql', 'w', encoding='utf-8') as f:
        f.write(out)

if __name__ == '__main__':
    main()
