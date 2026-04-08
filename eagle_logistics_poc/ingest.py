from __future__ import annotations

import base64
from pathlib import Path
from typing import Any, Dict, List, Tuple

from pdf_extractor import extract_document, pdf_pages_as_png_bytes


TEXT_MIN_CHARS = 180


def _is_image_suffix(name: str) -> bool:
  n = name.lower()
  return n.endswith(".png") or n.endswith(".jpg") or n.endswith(".jpeg")


def prepare_document_input(input_path: str) -> Tuple[str, List[Dict[str, Any]], List[str], Dict[str, Any]]:
  """
  Returns (extracted_text, tables, vision_png_base64_list, debug_meta).
  When vision_png_base64_list is non-empty, the LLM should prioritize vision over sparse text.
  """
  path = Path(input_path)
  name = path.name.lower()

  if _is_image_suffix(name):
    raw = path.read_bytes()
    b64 = base64.standard_b64encode(raw).decode("ascii")
    mime = "image/png" if name.endswith(".png") else "image/jpeg"
    return (
      "",
      [],
      [f"data:{mime};base64,{b64}"],
      {"mode": "image", "file_name": path.name},
    )

  if name.endswith(".pdf"):
    extracted = extract_document(str(path))
    text = extracted.raw_text or ""
    tables = extracted.tables
    meta = {**extracted.metadata, "mode": "pdf_text"}

    dense = len(text.replace("\n", " ").strip()) >= TEXT_MIN_CHARS
    if dense:
      return text, tables, [], meta

    pngs = pdf_pages_as_png_bytes(str(path), max_pages=8, scale=2.0)
    vision_urls = [f"data:image/png;base64,{base64.standard_b64encode(b).decode('ascii')}" for b in pngs]
    meta["mode"] = "pdf_vision"
    meta["vision_pages"] = len(vision_urls)
    # Keep any partial text as supplemental context
    return text, tables, vision_urls, meta

  raise ValueError(f"Unsupported file type: {path.name}")
