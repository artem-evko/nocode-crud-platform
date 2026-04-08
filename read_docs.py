import pypdf
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_pdf_text(path):
    reader = pypdf.PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

print("--- PDF CONTENT ---")
text = extract_pdf_text(r"C:\Users\ASUS\OneDrive\Документы\файл для гравити\Metodicheskie_ukazania_po_podgotovke_i_napisaniyu_VKR_s_II (1).pdf")

# We are looking for something related to "item 3" (Пункт 3)
import re
lines = text.split('\n')
for i, line in enumerate(lines):
    if '3' in line or 'III' in line or 'Третий' in line or 'трет' in line:
        pass # We might just want to print it all and format it, but the text might be large.
        
# Let's print out the content to a file so we can view it nicely, or view the first 10000 chars.
with open('extracted_guidelines.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print("Saved extracted guidelines to extracted_guidelines.txt")
