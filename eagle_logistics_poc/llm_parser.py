from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from openai import OpenAI

SCHEMA_HINT: Dict[str, Any] = {
  "documentType": "bill_of_lading | packing_list | freight_quotation | unknown",
  "documentTypeLabel": "",
  "confidence": 0.0,
  "summary": {"title": "", "bullets": []},
  "fieldGroups": [
    {
      "id": "references",
      "label": "References & dates",
      "fields": [{"key": "documentNumber", "label": "Document #", "value": ""}],
    }
  ],
  "entityGroups": [{"label": "Parties", "entities": [{"name": "", "role": "Shipper", "details": {}}]}],
  "tables": [{"id": "line_items", "title": "Line items", "columns": [], "rows": []}],
  "warnings": [{"severity": "info", "code": "", "message": ""}],
}


def _summarize_tables(tables: List[Dict[str, Any]], max_tables: int = 25, max_rows: int = 12) -> List[Dict[str, Any]]:
  out: List[Dict[str, Any]] = []
  for t in tables[:max_tables]:
    rows = t.get("rows") or []
    out.append({"page_number": t.get("page_number"), "table_index": t.get("table_index"), "rows": rows[:max_rows]})
  return out


def _truncate_text(text: str, max_chars: int) -> str:
  if len(text) <= max_chars:
    return text
  return text[:max_chars] + "\n\n...[truncated]\n"


def _build_user_content(
  *,
  extracted_text: str,
  tables: List[Dict[str, Any]],
  vision_data_urls: List[str],
  extra_instructions: Optional[str],
) -> List[Dict[str, Any]]:
  tables_hint = _summarize_tables(tables)
  extra = f"\nAdditional instructions:\n{extra_instructions}\n" if extra_instructions else ""

  text_block = (
    "You are a logistics document extraction engine.\n"
    "Identify whether the source is a Bill of Lading, Packing List, Freight Quotation / Rate Sheet, or unknown.\n"
    "Output STRICT JSON only (no markdown). Keys must match the schema exactly (camelCase).\n"
    "Use empty string '' for unknown text fields; use empty arrays where appropriate.\n"
    "Do not invent parties or totals; if unclear, add a warning.\n"
    "Populate fieldGroups with logical sections: References & dates, Routing, Parties summary, Cargo & weights, "
    "Charges & totals, Container & seal, Instructions, Compliance.\n"
    "Include line items / charges / commodities in tables[] with clear column headers.\n"
    f"{extra}\n"
    "Target schema (structure and key names):\n"
    f"{json.dumps(SCHEMA_HINT, ensure_ascii=False, indent=2)}\n\n"
    "Extracted text:\n"
    f"{_truncate_text(extracted_text, 24000)}\n\n"
    "Tables (truncated):\n"
    f"{json.dumps(tables_hint, ensure_ascii=False, indent=2)}\n"
  )

  content: List[Dict[str, Any]] = [{"type": "text", "text": text_block}]
  max_images = 8
  for url in vision_data_urls[:max_images]:
    content.append({"type": "image_url", "image_url": {"url": url, "detail": "high"}})
  return content


def parse_logistics_with_openai(
  *,
  extracted_text: str,
  tables: List[Dict[str, Any]],
  vision_data_urls: List[str],
  openai_api_key: str,
  model: str,
  debug_dir: Optional[Path] = None,
  max_retries: int = 3,
  extra_instructions: Optional[str] = None,
) -> Dict[str, Any]:
  client = OpenAI(api_key=openai_api_key)
  user_content = _build_user_content(
    extracted_text=extracted_text,
    tables=tables,
    vision_data_urls=vision_data_urls,
    extra_instructions=extra_instructions,
  )

  last_err: Optional[str] = None
  for attempt in range(max_retries):
    try:
      resp = client.chat.completions.create(
        model=model,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
          {
            "role": "system",
            "content": "You output only valid JSON for logistics document extraction. Never use markdown fences.",
          },
          {"role": "user", "content": user_content},
        ],
      )
      raw = (resp.choices[0].message.content or "").strip()
      data = json.loads(raw)
      if debug_dir:
        debug_dir.mkdir(parents=True, exist_ok=True)
        (debug_dir / f"llm_logistics_attempt_{attempt + 1}.json").write_text(
          json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
      return data
    except Exception as e:
      last_err = str(e)
      if attempt == max_retries - 1:
        raise RuntimeError(last_err) from e
  raise RuntimeError(last_err or "LLM failed")


def repair_logistics_json_with_openai(
  *,
  invalid_json: str,
  validation_error: str,
  extracted_text: str,
  tables: List[Dict[str, Any]],
  vision_data_urls: List[str],
  openai_api_key: str,
  model: str,
  debug_dir: Optional[Path] = None,
  max_retries: int = 2,
) -> Dict[str, Any]:
  client = OpenAI(api_key=openai_api_key)
  tables_hint = _summarize_tables(tables)
  prompt = (
    "Fix the JSON below to satisfy the logistics extraction schema. Output STRICT JSON only.\n"
    f"Validation error:\n{validation_error}\n\n"
    "Invalid JSON:\n"
    f"{invalid_json[:12000]}\n\n"
    "Context text:\n"
    f"{_truncate_text(extracted_text, 12000)}\n\n"
    "Tables:\n"
    f"{json.dumps(tables_hint, ensure_ascii=False)[:8000]}\n"
  )
  user_content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
  for url in vision_data_urls[:4]:
    user_content.append({"type": "image_url", "image_url": {"url": url, "detail": "low"}})

  last_err: Optional[str] = None
  for attempt in range(max_retries):
    try:
      resp = client.chat.completions.create(
        model=model,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
          {"role": "system", "content": "You repair JSON only. No markdown."},
          {"role": "user", "content": user_content},
        ],
      )
      raw = (resp.choices[0].message.content or "").strip()
      data = json.loads(raw)
      if debug_dir:
        debug_dir.mkdir(parents=True, exist_ok=True)
        (debug_dir / f"llm_logistics_repair_{attempt + 1}.json").write_text(
          json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
      return data
    except Exception as e:
      last_err = str(e)
  raise RuntimeError(last_err or "Repair failed")
