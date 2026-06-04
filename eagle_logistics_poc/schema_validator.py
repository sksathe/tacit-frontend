from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class LogisticsField(BaseModel):
  key: str
  label: str
  value: Optional[Any] = None
  highlight: Optional[bool] = None


class LogisticsFieldGroup(BaseModel):
  id: str
  label: str
  fields: List[LogisticsField]


class LogisticsEntity(BaseModel):
  name: str
  role: Optional[str] = None
  details: Dict[str, Any] = Field(default_factory=dict)


class LogisticsEntityGroup(BaseModel):
  label: str
  entities: List[LogisticsEntity]


class LogisticsTable(BaseModel):
  id: str
  title: str
  columns: List[str]
  rows: List[Dict[str, Any]]


class LogisticsWarning(BaseModel):
  severity: str
  code: Optional[str] = None
  message: str


class LogisticsSummary(BaseModel):
  title: Optional[str] = None
  bullets: Optional[List[str]] = None


class LogisticsExtractionResult(BaseModel):
  documentType: str
  documentTypeLabel: Optional[str] = None
  confidence: Optional[float] = None
  summary: LogisticsSummary
  fieldGroups: List[LogisticsFieldGroup]
  entityGroups: Optional[List[LogisticsEntityGroup]] = None
  tables: List[LogisticsTable]
  warnings: List[LogisticsWarning]

  def to_api_dict(self) -> Dict[str, Any]:
    return self.model_dump(mode="json", by_alias=False)


def validate_logistics(obj: Any) -> LogisticsExtractionResult:
  return LogisticsExtractionResult.model_validate(obj)


def empty_shell() -> Dict[str, Any]:
  return {
    "documentType": "unknown",
    "documentTypeLabel": "",
    "confidence": None,
    "summary": {"title": "", "bullets": []},
    "fieldGroups": [],
    "entityGroups": [],
    "tables": [],
    "warnings": [{"severity": "warning", "code": "EMPTY", "message": "No extraction produced."}],
  }
