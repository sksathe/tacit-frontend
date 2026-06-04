from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from pydantic import ValidationError

from excel_writer import write_logistics_workbook
from ingest import prepare_document_input
from llm_parser import parse_logistics_with_openai, repair_logistics_json_with_openai
from schema_validator import validate_logistics


def _stringify_cells(obj: Dict[str, Any]) -> None:
  for g in obj.get("fieldGroups") or []:
    if not isinstance(g, dict):
      continue
    for f in g.get("fields") or []:
      if not isinstance(f, dict):
        continue
      if f.get("value") is not None:
        f["value"] = str(f["value"])
  summ = obj.get("summary")
  if isinstance(summ, dict) and summ.get("bullets"):
    summ["bullets"] = ["" if b is None else str(b) for b in summ.get("bullets") or []]
  for t in obj.get("tables") or []:
    if not isinstance(t, dict):
      continue
    new_rows = []
    for r in t.get("rows") or []:
      if not isinstance(r, dict):
        continue
      new_rows.append({k: "" if v is None else str(v) for k, v in r.items()})
    t["rows"] = new_rows
  for eg in obj.get("entityGroups") or []:
    if not isinstance(eg, dict):
      continue
    for e in eg.get("entities") or []:
      if not isinstance(e, dict):
        continue
      d = e.get("details") or {}
      if isinstance(d, dict):
        e["details"] = {k: "" if v is None else str(v) for k, v in d.items()}


def _write_json(path: Path, data: Any) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
  load_dotenv()
  parser = argparse.ArgumentParser(description="Eagle logistics document -> JSON + Excel")
  parser.add_argument("--input", required=True, help="Path to PDF or image")
  parser.add_argument("--out-dir", default="output", help="Output directory")
  parser.add_argument("--debug-dir", default="debug", help="Debug artifacts")
  parser.add_argument("--llm-model", default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
  parser.add_argument("--max-retries", type=int, default=int(os.getenv("LLM_MAX_RETRIES", "3")))
  args = parser.parse_args()

  out_dir = Path(args.out_dir)
  debug_dir = Path(args.debug_dir)
  out_dir.mkdir(parents=True, exist_ok=True)
  debug_dir.mkdir(parents=True, exist_ok=True)

  api_key = os.getenv("OPENAI_API_KEY", "").strip()
  if not api_key:
    raise RuntimeError("Missing OPENAI_API_KEY")

  text, tables, vision_urls, ingest_meta = prepare_document_input(args.input)
  _write_json(debug_dir / "ingest_meta.json", ingest_meta)

  extra = os.getenv("LLM_EXTRA_INSTRUCTIONS", "").strip() or None

  llm_raw = parse_logistics_with_openai(
    extracted_text=text,
    tables=tables,
    vision_data_urls=vision_urls,
    openai_api_key=api_key,
    model=args.llm_model,
    debug_dir=debug_dir,
    max_retries=args.max_retries,
    extra_instructions=extra,
  )
  _write_json(debug_dir / "llm_raw.json", llm_raw)

  try:
    validated = validate_logistics(llm_raw)
    normalized: Dict[str, Any] = validated.model_dump(mode="json")
  except ValidationError as ve:
    _write_json(debug_dir / "validation_errors.json", {"errors": ve.errors()})
    repaired = repair_logistics_json_with_openai(
      invalid_json=json.dumps(llm_raw, ensure_ascii=False),
      validation_error=str(ve),
      extracted_text=text,
      tables=tables,
      vision_data_urls=vision_urls,
      openai_api_key=api_key,
      model=args.llm_model,
      debug_dir=debug_dir,
    )
    validated = validate_logistics(repaired)
    normalized = validated.model_dump(mode="json")

  # Ensure minimum UI structure
  if not normalized.get("fieldGroups"):
    normalized.setdefault("warnings", []).append(
      {"severity": "info", "code": "SPARSE", "message": "No field groups returned; check source quality."}
    )
  if not normalized.get("tables"):
    normalized.setdefault("tables", [])

  _stringify_cells(normalized)

  out_json = out_dir / "normalized_logistics.json"
  _write_json(out_json, normalized)

  xlsx_path = str(out_dir / "eagle_extraction.xlsx")
  write_logistics_workbook(payload=normalized, output_xlsx_path=xlsx_path)
  print(json.dumps({"ok": True, "out_json": str(out_json), "out_xlsx": xlsx_path}))


if __name__ == "__main__":
  main()
