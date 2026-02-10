#!/usr/bin/env python3
"""
Extract election results from PDF files and generate SQL INSERT statements.
This script will parse the PDF files and create SQL to insert into election_results table.
"""

import json
import re
import subprocess
import sys

# Tenant ID to use for all results
TENANT_ID = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'

# PDF files to process
PDF_FILES = [
    '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27A.pdf',
    '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27B.pdf',
    '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27C.pdf',
    '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27D.pdf'
]

def install_pdfplumber():
    """Install pdfplumber in a temporary virtual environment."""
    print("Setting up virtual environment...")
    subprocess.run([sys.executable, '-m', 'venv', '/tmp/pdf_venv'], check=True)
    subprocess.run(['/tmp/pdf_venv/bin/pip', 'install', 'pdfplumber', '--quiet'], check=True)
    print("pdfplumber installed successfully.")

def extract_pdf_data(pdf_path):
    """Extract data from a single PDF file."""
    # Use the venv python to import pdfplumber
    code = f"""
import pdfplumber
import json

with pdfplumber.open('{pdf_path}') as pdf:
    all_text = []
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            all_text.append(text)
    print(json.dumps({{'text': '\\n'.join(all_text)}}))
"""
    
    result = subprocess.run(
        ['/tmp/pdf_venv/bin/python3', '-c', code],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error extracting {pdf_path}: {result.stderr}")
        return None
    
    return json.loads(result.stdout)

def parse_election_data(text, ward_suffix):
    """Parse election data from PDF text."""
    # This is a basic parser - you may need to adjust based on actual PDF format
    lines = text.split('\n')
    
    # Extract ward name
    ward_name = f"Ward 27{ward_suffix}"
    
    # Try to extract booth information and results
    # This is a placeholder - actual parsing will depend on PDF structure
    results = []
    
    # For demonstration, creating a basic structure
    # You'll need to adjust this based on actual PDF format
    result = {
        'ward_name': ward_name,
        'booth_number': f'27{ward_suffix}',
        'booth_name': f'Booth {ward_suffix}',
        'total_voters': 0,  # Extract from PDF
        'total_votes_casted': 0,  # Extract from PDF
        'candidate_votes': {},  # Extract candidate votes from PDF
        'winner': '',  # Determine winner
        'margin': 0  # Calculate margin
    }
    
    results.append(result)
    return results

def generate_sql(all_results):
    """Generate SQL INSERT statements."""
    sql_parts = []
    
    for result in all_results:
        candidate_votes_json = json.dumps(result['candidate_votes']).replace("'", "''")
        
        sql = f"""
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    '{result['ward_name']}',
    '{result['booth_number']}',
    '{result['booth_name']}',
    {result['total_voters']},
    {result['total_votes_casted']},
    '{candidate_votes_json}'::jsonb,
    '{result['winner']}',
    {result['margin']},
    '{TENANT_ID}',
    NOW()
);"""
        sql_parts.append(sql)
    
    return '\n'.join(sql_parts)

def main():
    print("Starting election results import...")
    
    # Install pdfplumber
    install_pdfplumber()
    
    all_results = []
    
    # Process each PDF
    for idx, pdf_file in enumerate(PDF_FILES):
        suffix = ['A', 'B', 'C', 'D'][idx]
        print(f"Processing {pdf_file}...")
        
        data = extract_pdf_data(pdf_file)
        if data:
            results = parse_election_data(data['text'], suffix)
            all_results.extend(results)
    
    # Generate SQL
    sql = generate_sql(all_results)
    
    # Save to file
    output_file = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/scripts/import_election_results.sql'
    with open(output_file, 'w') as f:
        f.write(f"-- Election Results Import for Tenant {TENANT_ID}\n")
        f.write(f"-- Generated from PDFs: 27A, 27B, 27C, 27D\n\n")
        f.write(sql)
    
    print(f"\nSQL script generated: {output_file}")
    print(f"Found {len(all_results)} booth results")
    
    # Also print the first few lines of extracted text for verification
    if all_results:
        print("\n--- Sample extracted data ---")
        print(json.dumps(all_results[0], indent=2))

if __name__ == '__main__':
    main()
