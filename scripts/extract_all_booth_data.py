import pdfplumber
import json

def extract_complete_booth_data(pdf_path):
    """Extract all booth-by-booth election data from PDF"""
    pdf = pdfplumber.open(pdf_path)
    
    # Candidate names in order
    candidates = [
        "अंबेदकर (कांबळे) दिलीप शंकर",
        "महेश (उर्फ) अमर विलास आवळे",
        "धनंजय विष्णू जाधव",
        "भामरे रविराज बाळासाहेब",
        "विर नंदू काळूराम",
        "वैभवी संजय शिंदे",
        "सुरज सोमनाथ सोनवणे",
        "महेश बलभीम सकट",
        "नेटके गुलाब गंगाराम",
        "NOTA"
    ]
    
    all_booths = {}
    
    for page_num, page in enumerate(pdf.pages):
        print(f"\n=== Processing Page {page_num + 1} ===")
        
        # Extract tables
        tables = page.extract_tables()
        
        if tables:
            for table in tables:
                # Skip header rows
                for row_idx, row in enumerate(table):
                    if not row or len(row) < 3:
                        continue
                    
                    # Find candidate rows (they start with "027-अ")
                    if row[0] and '027-अ' in str(row[0]):
                        # Get candidate name
                        candidate_name = None
                        for cand in candidates:
                            if cand in str(row):
                                candidate_name = cand
                                break
                        
                        if candidate_name:
                            # Extract vote counts (skip first 2 columns which are ward and candidate info)
                            votes = []
                            for cell in row[2:]:  # Start from column 2
                                if cell and cell.strip():
                                    try:
                                        vote_count = int(cell.strip())
                                        votes.append(vote_count)
                                    except ValueError:
                                        pass
                            
                            if votes:
                                print(f"  {candidate_name[:30]}...: {len(votes)} booths, votes = {votes[:5]}...")
                                
                                # Store votes by candidate
                                if candidate_name not in all_booths:
                                    all_booths[candidate_name] = []
                                all_booths[candidate_name].extend(votes)
    
    pdf.close()
    return all_booths, candidates

# Extract data
pdf_path = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27A.pdf'
print("Extracting booth data from PDF...")
booth_data, candidates = extract_complete_booth_data(pdf_path)

# Analyze the data
print("\n\n=== EXTRACTION SUMMARY ===")
for candidate, votes in booth_data.items():
    print(f"{candidate[:40]}: {len(votes)} booth records, Total votes: {sum(votes)}")

# Now generate SQL
print("\n\n=== GENERATING SQL ===")

# Check if all candidates have the same number of booths
booth_counts = [len(votes) for votes in booth_data.values()]
if len(set(booth_counts)) == 1:
    num_booths = booth_counts[0]
    print(f"All candidates have {num_booths} booth records - GOOD!")
    
    # Generate SQL for each booth
    tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
    ward_name = 'Ward 27-A'
    
    sql_file = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/scripts/import_all_booths_ward27a.sql'
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(f"-- Complete Booth-by-Booth Results for Ward 27-A\n")
        f.write(f"-- Total Booths: {num_booths}\n")
        f.write(f"-- Tenant: {tenant_id}\n\n")
        
        f.write(f"-- Delete existing Ward 27-A data first\n")
        f.write(f"DELETE FROM election_results WHERE ward_name = '{ward_name}' AND tenant_id = '{tenant_id}';\n\n")
        
        # Generate INSERT for each booth
        for booth_num in range(num_booths):
            # Get votes for this booth from each candidate
            candidate_votes_dict = {}
            total_votes = 0
            
            for candidate in candidates:
                if candidate in booth_data and booth_num < len(booth_data[candidate]):
                    votes = booth_data[candidate][booth_num]
                    candidate_votes_dict[candidate] = votes
                    total_votes += votes
            
            # Find winner
            winner = max(candidate_votes_dict, key=candidate_votes_dict.get)
            sorted_votes = sorted(candidate_votes_dict.values(), reverse=True)
            margin = sorted_votes[0] - sorted_votes[1] if len(sorted_votes) > 1 else 0
            
            # Generate JSON for candidate_votes
            votes_json = json.dumps(candidate_votes_dict, ensure_ascii=False, indent=2)
            
            f.write(f"-- Booth {booth_num + 1}\n")
            f.write(f"INSERT INTO election_results (\n")
            f.write(f"    ward_name, booth_number, booth_name, \n")
            f.write(f"    total_voters, total_votes_casted, candidate_votes, \n")
            f.write(f"    winner, margin, tenant_id, created_at\n")
            f.write(f") VALUES (\n")
            f.write(f"    '{ward_name}',\n")
            f.write(f"    '{booth_num + 1}',\n")
            f.write(f"    'मतदान केंद्र {booth_num + 1}',\n")
            f.write(f"    0,\n")
            f.write(f"    {total_votes},\n")
            f.write(f"    '{votes_json}'::jsonb,\n")
            f.write(f"    '{winner}',\n")
            f.write(f"    {margin},\n")
            f.write(f"    '{tenant_id}',\n")
            f.write(f"    NOW()\n")
            f.write(f");\n\n")
        
        f.write(f"\n-- Verify import\n")
        f.write(f"SELECT COUNT(*) as total_booths, SUM(total_votes_casted) as total_votes\n")
        f.write(f"FROM election_results\n")
        f.write(f"WHERE ward_name = '{ward_name}' AND tenant_id = '{tenant_id}';\n")
    
    print(f"\n✅ SQL file created: {sql_file}")
    print(f"   Total booths: {num_booths}")
    print(f"   Ready to import into database!")
    
else:
    print(f"ERROR: Inconsistent booth counts across candidates: {booth_counts}")
    print("PDF parsing may have failed. Manual verification needed.")
