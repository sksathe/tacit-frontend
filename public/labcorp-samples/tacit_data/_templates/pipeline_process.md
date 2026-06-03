# Medical Device Manual Pipeline

## Overview

This pipeline converts tacit source documents (created over months of product development)
into structured data and multilingual user manuals.

```
tacit_data/
  <PRODUCT_FOLDER>/
    01_Product_Requirements_Document.txt   ← Intended use, design inputs, regulatory strategy
    02_Regulatory_*_Notes.txt              ← Country-specific approvals, submission details
    03_Engineering_*_Specification.txt     ← Technical specs, materials, connectivity
    04_Risk_Assessment_FMEA.csv            ← Risk table: failure modes, severity, controls
    05_Verification_*_Report.txt           ← V&V results: precision, accuracy, linearity
    06_Design_Review_*_Notes.txt           ← Meeting minutes, design decisions, open actions
    07_Labeling_Review_Checklist.txt       ← Per-language labeling compliance status
  _templates/
    extraction_template.json              ← Schema for structured data extraction
    pipeline_process.md                   ← This file
```

---

## Step 1 — Collect Source Documents

For a given product (e.g. `HCP-5000`), collect all files from its folder:

```python
import os, glob

product_folder = "tacit_data/HCP-5000_HemaCount_Pro"
sources = {
    "text": glob.glob(f"{product_folder}/*.txt"),
    "csv":  glob.glob(f"{product_folder}/*.csv"),
    "pdf":  glob.glob(f"{product_folder}/*.pdf"),   # if scanned docs added later
}
```

**Document roles by file pattern:**
| File Pattern | Content Type | Key Fields |
|---|---|---|
| `*Requirements*` | Product requirements, intended use, design inputs | intended_use, performance_requirements, regulatory_strategy |
| `*Regulatory*` | Country approvals, submission numbers | regulatory_approvals[], approval_number, approval_date |
| `*Engineering*` | Technical specs, materials | technical_specifications{} |
| `*FMEA.csv` | Risk table | risk_summary{} |
| `*Verification*` | V&V performance data | performance_data{} |
| `*Design_Review*` | Meeting decisions, open actions | safety_warnings[], design decisions |
| `*Labeling*` | Translation status, label elements | ifu_languages{}, translation_status{} |

---

## Step 2 — Extract into Template JSON

Use the `extraction_template.json` as the target schema. Extract fields using one of:

### Option A — LLM-based extraction (recommended for unstructured text)

```python
import anthropic, json

client = anthropic.Anthropic()

with open("_templates/extraction_template.json") as f:
    template = f.read()

def extract_from_document(doc_text: str, product_name: str) -> dict:
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": f"""
You are extracting structured data from a medical device source document.
Product: {product_name}

SOURCE DOCUMENT:
{doc_text}

Extract all relevant fields into this JSON template. Use null for missing fields.
Return ONLY valid JSON matching the template structure.

TEMPLATE:
{template}
"""
        }]
    )
    return json.loads(response.content[0].text)
```

### Option B — Rule-based extraction (for CSV FMEA files)

```python
import csv

def extract_fmea(csv_path: str) -> list:
    risks = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if int(row.get("Residual RPN", 99)) <= 10:
                priority = "high"
            elif int(row.get("Residual RPN", 99)) <= 20:
                priority = "medium"
            else:
                priority = "low"
            risks.append({
                "failure_mode": row["Potential Failure Mode"],
                "effect": row["Potential Effect of Failure"],
                "mitigation": row["Recommended Action"],
                "residual_rpn": row["Residual RPN"],
                "priority": priority
            })
    return risks
```

### Merge Extractions

```python
def merge_extractions(extractions: list[dict]) -> dict:
    merged = json.load(open("_templates/extraction_template.json"))
    for doc_data in extractions:
        for key, value in doc_data.items():
            if value is not None and merged.get(key) is None:
                merged[key] = value
            elif isinstance(value, list) and isinstance(merged.get(key), list):
                merged[key].extend(v for v in value if v not in merged[key])
    return merged
```

---

## Step 3 — Generate Multilingual Manuals

With a fully populated JSON, generate the manual for each target language/country:

```python
from generate_manuals import build_manual   # existing PDF generator

LANGUAGE_COUNTRY_MAP = {
    "en": ["USA", "Australia", "Canada", "UK"],
    "fr": ["Canada", "EU"],
    "de": ["EU"],
    "es": ["EU"],
    "it": ["EU"],
    "pl": ["EU"],
    "ar": ["Saudi Arabia"],
    "hi": ["India"],
    "zh": ["China"],
    "ja": ["Japan"],
    "pt": ["Brazil"],
}

def generate_all_manuals(product_data: dict, output_dir: str):
    active_countries = [
        ap["country"] for ap in product_data.get("regulatory_approvals", [])
        if ap.get("distribution_status") == "Active"
    ]
    languages_needed = set()
    for lang, countries in LANGUAGE_COUNTRY_MAP.items():
        if any(c in active_countries for c in countries):
            languages_needed.add(lang)

    for lang in languages_needed:
        out_path = f"{output_dir}/{product_data['product_code']}_{lang.upper()}_Manual.pdf"
        build_manual(product_data, out_path, language=lang)
        print(f"  Generated: {out_path}")
```

---

## Folder Conventions

- One folder per product, named `<MODEL-CODE>_<ProductName>`
- All source documents prefixed with `NN_` for ordering
- FMEA always as `.csv` for programmatic extraction
- All other tacit docs as `.txt` (UTF-8)
- Place scanned PDFs (if any) in a `scanned/` subfolder

---

## Adding a New Product

1. Create folder: `tacit_data/<MODEL-CODE>_<ProductName>/`
2. Copy and fill in the document templates from `_templates/`
3. Run extraction pipeline → produces populated JSON
4. Run `generate_manuals.py` → produces PDFs per language
