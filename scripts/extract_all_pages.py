import pdfplumber
import re
import json

def extract_all_pages(pdf_path):
    """Extract all election data from the PDF"""
    pdf = pdfplumber.open(pdf_path)
    all_data = []
    
    for page_num, page in enumerate(pdf.pages):
        text = page.extract_text()
        print(f"\n=== Page {page_num + 1} ===")
        print(text[:1500])
        all_data.append(text)
    
    pdf.close()
    return all_data

# Extract data
pdf_path = '/Users/shreyasjadhav/Desktop/Nagar 2/Nagarsevak-Managment/result/27A.pdf'
pages_data = extract_all_pages(pdf_path)

print(f"\n\nTotal pages extracted: {len(pages_data)}")
