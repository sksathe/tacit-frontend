import {
  MANU_DEMO_BUNDLES,
  type ManuDemoBundleKey,
} from "@/data/manuLabcorp";
import type { ManuExtractionStatus, ManuUploadedDocument } from "@/types/manu";
import { inferDocumentCategory } from "@/lib/manuSimulator";

const SAMPLE_BASE = `${import.meta.env.BASE_URL}labcorp-samples/tacit_data`;

function mapParseStatus(status: string): ManuExtractionStatus {
  if (status === "partial") return "partial";
  if (status === "simulated") return "simulated";
  return "complete";
}

async function fetchSampleText(folder: string, fileName: string): Promise<string> {
  const url = `${SAMPLE_BASE}/${folder}/${encodeURIComponent(fileName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return `[Sample content for ${fileName} � file not found at ${url}. Upload manually from labcorp/Sample Test Data.]`;
    }
    const text = await res.text();
    return text.length > 4000 ? text.slice(0, 4000) + "\n�[truncated]" : text;
  } catch {
    return `[Could not load ${fileName} from sample library.]`;
  }
}

export async function loadLabCorpDemoBundle(
  bundleKey: ManuDemoBundleKey,
): Promise<ManuUploadedDocument[]> {
  const bundle = MANU_DEMO_BUNDLES[bundleKey];
  const docs = await Promise.all(
    bundle.documents.map(async (d) => {
      const extractedText = await fetchSampleText(bundle.folder, d.fileName);
      return {
        id: `doc-${crypto.randomUUID()}`,
        fileName: d.fileName,
        fileType: d.fileName.split(".").pop()?.toLowerCase() || "txt",
        category: d.category,
        uploadedAt: new Date().toISOString(),
        extractedText,
        extractionStatus: mapParseStatus(d.parseStatus),
        parsingConfidence: d.confidence / 100,
        notes: "",
      } satisfies ManuUploadedDocument;
    }),
  );
  return docs;
}

export async function buildUploadedDocumentFromFile(
  file: File,
  category?: ManuUploadedDocument["category"],
): Promise<ManuUploadedDocument> {
  const cat = category ?? inferDocumentCategory(file.name);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let extractedText = `[Simulated extraction] Content parsed from ${file.name}.`;
  let extractionStatus: ManuExtractionStatus = "simulated";
  let parsingConfidence = 0.75;

  try {
    if (file.type.startsWith("text/") || ["txt", "csv", "md", "json"].includes(ext)) {
      extractedText = await file.text();
      if (extractedText.length > 4000) extractedText = extractedText.slice(0, 4000) + "\n�[truncated]";
      extractionStatus = ext === "csv" ? "complete" : "complete";
      parsingConfidence = ext === "csv" ? 0.92 : 0.88;
    }
  } catch {
    /* keep simulated */
  }

  return {
    id: `doc-${crypto.randomUUID()}`,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    category: cat,
    uploadedAt: new Date().toISOString(),
    extractedText,
    extractionStatus,
    parsingConfidence,
    notes: "",
  };
}
