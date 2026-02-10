#!/usr/bin/env python3
"""
Extract complete booth-by-booth election data from all Ward 27 PDFs (A, B, C, D)
and generate comprehensive SQL import script.
"""

import pdfplumber
import json
import os

# Candidate names (same across all wards)
CANDIDATES = [
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

TENANT_ID = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'

def extract_booth_data_from_pdf(pdf_path, ward_suffix):
    """
    Extract all booth data from a single PDF using table extraction.
    Returns list of booth records.
    """
    print(f"\n{'='*60}")
    print(f"Processing: {pdf_path}")
    print(f"Ward: 27-{ward_suffix}")
    print('='*60)
    
    pdf = pdfplumber.open(pdf_path)
    booths = []
    
    for page_num, page in enumerate(pdf.pages, 1):
        print(f"\nPage {page_num}:")
        
        # Extract tables
        tables = page.extract_tables()
        
        if not tables:
            print(f"  No tables found on page {page_num}")
            continue
        
        # Process first table on the page (main election results table)
        table = tables[0]
        
        # Find header row with booth numbers (म.क.क्र.:)
        booth_numbers = []
        header_row_idx = None
        
        for idx, row in enumerate(table):
            if row and any('म.क' in str(cell) for cell in row if cell):
                # This is likely the header row
                # Extract booth numbers
                for cell in row:
                    if cell and 'क्र.:' in str(cell):
                        # Extract numbers after क्र.:
                        import re
                        nums = re.findall(r':\s*(\d+)', str(cell))
                        booth_numbers.extend(nums)
                header_row_idx = idx
                break
        
        if not booth_numbers:
            print(f"  Could not find booth numbers on page {page_num}")
            continue
        
        print(f"  Found {len(booth_numbers)} booths: {booth_numbers}")
        
        # Extract data rows (candidate votes)
        # Rows after header contain candidate votes
        candidate_data = {}
        
        for row_idx in range(header_row_idx + 1, min(header_row_idx + 12, len(table))):
            row = table[row_idx]
            if not row or len(row) < 3:
                continue
            
            # Check if this is a candidate row (contains ward prefix like "027-")
            if row[0] and '027' in str(row[0]):
                # Find which candidate this is
                candidate_name = None
                for cand in CANDIDATES:
                    # Check in first few cells
                    row_text = ' '.join([str(cell) for cell in row[:3] if cell])
                    if any(word in row_text for word in cand.split()[:2]):  # Match first 2 words
                        candidate_name = cand
                        break
                
                if not candidate_name:
                    continue
                
                # Extract vote numbers from cells after column 2
                votes = []
                for cell in row[2:]:
                    if cell and str(cell).strip():
                        try:
                            vote_count = int(str(cell).strip())
                            votes.append(vote_count)
                        except ValueError:
                            pass
                
                # Only keep votes matching number of booths
                votes = votes[:len(booth_numbers)]
                
                if len(votes) == len(booth_numbers):
                    candidate_data[candidate_name] = votes
                    print(f"    {candidate_name[:30]}: {len(votes)} values")
        
        # Organize data by booth
        if len(candidate_data) == len(CANDIDATES):
            for booth_idx, booth_num in enumerate(booth_numbers):
                booth_votes = {}
                total_votes = 0
                
                for candidate in CANDIDATES:
                    if candidate in candidate_data and booth_idx < len(candidate_data[candidate]):
                        votes = candidate_data[candidate][booth_idx]
                        booth_votes[candidate] = votes
                        total_votes += votes
                
                if len(booth_votes) == len(CANDIDATES):
                    # Find winner (excluding NOTA)
                    max_votes = max([v for k, v in booth_votes.items() if k != "NOTA"])
                    winner = [k for k, v in booth_votes.items() if v == max_votes and k != "NOTA"][0]
                    
                    # Calculate margin
                    sorted_votes = sorted([v for k, v in booth_votes.items() if k != "NOTA"], reverse=True)
                    margin = sorted_votes[0] - sorted_votes[1] if len(sorted_votes) > 1 else 0
                    
                    booths.append({
                        'booth_number': booth_num,
                        'total_votes': total_votes,
                        'candidate_votes': booth_votes,
                        'winner': winner,
                        'margin': margin
                    })
        else:
            print(f"  WARNING: Expected {len(CANDIDATES)} candidates, found {len(candidate_data)}")
    
    pdf.close()
    print(f"\n✓ Extracted {len(booths)} booths from Ward 27-{ward_suffix}")
    return booths

def generate_complete_sql(all_ward_data, output_file):
    """Generate complete SQL for all wards"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Complete Booth-by-Booth Election Results for Ward 27 (A, B, C, D)\n")
        f.write(f"-- Tenant: {TENANT_ID}\n")
        f.write(f"-- Generated automatically from PDF data\n\n")
        
        # Delete all existing Ward 27 data
        f.write("-- Delete all existing Ward 27 data\n")
        f.write(f"DELETE FROM election_results WHERE tenant_id = '{TENANT_ID}';\n\n")
        
        total_booths = 0
        
        for ward_suffix, booths in all_ward_data.items():
            ward_name = f"Ward 27-{ward_suffix}"
            
            f.write(f"\n-- {'='*60}\n")
            f.write(f"-- Ward 27-{ward_suffix}: {len(booths)} booths\n")
            f.write(f"-- {'='*60}\n\n")
            
            for booth in booths:
                votes_json = json.dumps(booth['candidate_votes'], ensure_ascii=False)
                
                f.write(f"-- Booth {booth['booth_number']}\n")
                f.write(f"INSERT INTO election_results (\n")
                f.write(f"    ward_name, booth_number, booth_name,\n")
                f.write(f"    total_voters, total_votes_casted, candidate_votes,\n")
                f.write(f"    winner, margin, tenant_id, created_at\n")
                f.write(f") VALUES (\n")
                f.write(f"    '{ward_name}',\n")
                f.write(f"    '{booth['booth_number']}',\n")
                f.write(f"    'मतदान केंद्र {booth['booth_number']}',\n")
                f.write(f"    0,\n")
                f.write(f"    {booth['total_votes']},\n")
                f.write(f"    '{votes_json}'::jsonb,\n")
                f.write(f"    '{booth['winner']}',\n")
                f.write(f"    {booth['margin']},\n")
                f.write(f"    '{TENANT_ID}',\n")
                f.write(f"    NOW()\n")
                f.write(f");\n\n")
                
                total_booths += 1
        
        f.write(f"\n-- Verification Query\n")
        f.write(f"SELECT ward_name, COUNT(*) as booth_count, SUM(total_votes_casted) as total_votes\n")
        f.write(f"FROM election_results\n")
        f.write(f"WHERE tenant_id = '{TENANT_ID}'\n")
        f.write(f"GROUP BY ward_name\n")
        f.write(f"ORDER BY ward_name;\n")
    
    print(f"\n{'='*60}")
    print(f"✅ SQL GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"Output file: {output_file}")
    print(f"Total booths: {total_booths}")
    print(f"Ready to import into database!")

def main():
    base_path = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result'
    output_sql = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/scripts/import_all_wards_complete.sql'
    
    ward_data = {}
    
    for suffix in ['A', 'B', 'C', 'D']:
        pdf_file = os.path.join(base_path, f'27{suffix}.pdf')
        if os.path.exists(pdf_file):
            booths = extract_booth_data_from_pdf(pdf_file, suffix)
            ward_data[suffix] = booths
        else:
            print(f"WARNING: {pdf_file} not found!")
    
    # Generate SQL
    if ward_data:
        generate_complete_sql(ward_data, output_sql)
    else:
        print("ERROR: No data extracted from PDFs!")

if __name__ == '__main__':
    main()
