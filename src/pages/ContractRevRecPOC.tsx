
import Header from "@/components/layout/Header";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CloudUpload, Download, FileText, Maximize2, PencilLine, RefreshCcw, Save, Sparkles, Undo2, UploadCloud } from "lucide-react";
import { PdfRedlineViewer } from "@/components/pdf/PdfRedlineViewer";
import { TACIT_AGENTS } from "@/data/agents";

export default function ContractRevRecPOC() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null); // e.g. "file-0" or "pasted"
  const [pastedText, setPastedText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [excelResult, setExcelResult] = useState<null | {
    jobId: string;
    excel_filename: string;
    excel_base64: string;
    normalized_contract: any;
  }>(null);
  const [excelUrl, setExcelUrl] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [pdfHighlightQuery, setPdfHighlightQuery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "header" | "terms" | "lines" | "totals">("summary");
  const processingIntervalRef = useRef<number | null>(null);
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const [isLineItemsModalOpen, setIsLineItemsModalOpen] = useState(false);
  const [isLineItemsEditMode, setIsLineItemsEditMode] = useState(false);
  const [lineItemRows, setLineItemRows] = useState<Array<Record<string, string>>>([]);
  const [savedLineItemRows, setSavedLineItemRows] = useState<Array<Record<string, string>>>([]);

  const personaAgent = useMemo(
    () =>
      TACIT_AGENTS.find((a) => a.id === "lexa" || a.id === "clara" || a.name.toLowerCase() === "clara") ?? null,
    [],
  );
  const [personaImageFailed, setPersonaImageFailed] = useState(false);

  useEffect(() => {
    setPersonaImageFailed(false);
  }, [personaAgent?.image]);

  const processSteps = [
    "Extracting document content",
    "Understanding contract structure",
    "Normalizing key details",
    "Generating contract summary",
    "Creating Excel report",
  ];

  function monthAddEndOfMonth(startISO: string, monthsToAdd: number): string | null {
    if (!startISO) return null;
    const d = new Date(startISO + "T00:00:00.000Z");
    if (!Number.isFinite(d.getTime())) return null;
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const firstOfTargetMonthUTC = new Date(Date.UTC(year, month + monthsToAdd, 1));
    const endOfTargetMonthUTC = new Date(firstOfTargetMonthUTC.getTime() - 24 * 60 * 60 * 1000);
    const yyyy = endOfTargetMonthUTC.getUTCFullYear();
    const mm = String(endOfTargetMonthUTC.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(endOfTargetMonthUTC.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function monthAddPreserveDay(startISO: string, monthsToAdd: number): string | null {
    if (!startISO) return null;
    const d = new Date(startISO + "T00:00:00.000Z");
    if (!Number.isFinite(d.getTime())) return null;

    const startYear = d.getUTCFullYear();
    const startMonth = d.getUTCMonth();
    const startDay = d.getUTCDate();
    const lastDayOfTargetMonth = new Date(Date.UTC(startYear, startMonth + monthsToAdd + 1, 0)).getUTCDate();
    const clampedDay = Math.min(startDay, lastDayOfTargetMonth);
    const candidate = new Date(Date.UTC(startYear, startMonth + monthsToAdd, clampedDay));

    if (!Number.isFinite(candidate.getTime())) return null;
    const yyyy = candidate.getUTCFullYear();
    const mm = String(candidate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(candidate.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function extractFirstInt(s: string): number | null {
    const m = (s || "").match(/(\d{1,6})/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }

  function extractPercentDecimal(s: string): number | null {
    const m = (s || "").match(/(\d+(?:\.\d+)?)\s*%/);
    if (m) {
      const n = Number(m[1]);
      return Number.isFinite(n) ? n / 100 : null;
    }
    const m2 = (s || "").match(/(\d+(?:\.\d+)?)/);
    if (m2) {
      const n = Number(m2[1]);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function parseNumberValue(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    if (!cleaned || cleaned === "-" || cleaned === ".") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function formatAmount(value: number | null, currency?: string): string {
    if (value === null) return "-";
    const safeCurrency = (currency || "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(safeCurrency)) {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: safeCurrency,
          maximumFractionDigits: 2,
        }).format(value);
      } catch {
        // fallback to decimal formatting below
      }
    }
    const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
    return safeCurrency ? `${decimal} ${safeCurrency}` : decimal;
  }

  function toExcelCellValue(value: string): string | number | boolean {
    const raw = String(value ?? "");
    const trimmed = raw.trim();
    if (!trimmed) return "";

    if (/^(true|false)$/i.test(trimmed)) {
      return trimmed.toLowerCase() === "true";
    }

    const normalized = trimmed.replace(/,/g, "");
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
      const n = Number(normalized);
      if (Number.isFinite(n)) return n;
    }

    return raw;
  }

  function triggerFileDownload(fileUrl: string, filename: string) {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function buildRevRecDatapoints(normalized: any) {
    const contract_header = normalized?.contract_header ?? {};
    const commercial_terms = normalized?.commercial_terms ?? {};
    const line_items = Array.isArray(normalized?.line_items) ? normalized.line_items : [];
    const totals = Array.isArray(normalized?.totals) ? normalized.totals : [];
    const parsing_metadata = normalized?.parsing_metadata ?? {};

    const totalsPeriodLabels: string[] = Array.from(
      new Set(
        totals
          .map((t: any) => String(t?.period_label ?? "").trim())
          // Preserve string type after filtering
          .filter((v): v is string => Boolean(v)),
      ),
    );

    const pricingPeriodLabels: string[] = Array.from(
      new Set(
        line_items
          .flatMap((li: any) => (Array.isArray(li?.pricing) ? li.pricing : []))
          .map((p: any) => String(p?.period_label ?? "").trim())
          // Preserve string type after filtering
          .filter((v): v is string => Boolean(v)),
      ),
    );

    const selectedPeriodLabels: string[] = totalsPeriodLabels.length ? totalsPeriodLabels : pricingPeriodLabels;
    const period_labels: string[] = selectedPeriodLabels.length ? selectedPeriodLabels : ["Year 1"];

    const periodTotalsMap = new Map<string, number>();
    for (const t of totals) {
      const label = String(t?.period_label ?? "").trim();
      const n = Number(t?.amount);
      if (label && Number.isFinite(n)) {
        periodTotalsMap.set(label, n);
      }
    }

    const pricingTotalsMap = new Map<string, number>();
    for (const li of line_items) {
      const pricing = Array.isArray(li?.pricing) ? li.pricing : [];
      for (const p of pricing) {
        const label = String(p?.period_label ?? "").trim();
        const amount = Number(p?.amount);
        if (!label || !Number.isFinite(amount)) continue;
        const current = pricingTotalsMap.get(label) ?? 0;
        pricingTotalsMap.set(label, current + amount);
      }
    }

    const annualTotalForPeriod = (periodLabel: string): number => {
      const fromTotals = periodTotalsMap.get(periodLabel);
      if (Number.isFinite(fromTotals)) return fromTotals as number;
      const fromLineItems = pricingTotalsMap.get(periodLabel);
      if (Number.isFinite(fromLineItems)) return fromLineItems as number;
      return 0;
    };

    const year_totals = period_labels.map((label) => annualTotalForPeriod(label));

    const subscriptionStart = contract_header?.subscription_start_date ?? "";
    const subscriptionEnd = contract_header?.subscription_end_date ?? "";
    const term_months = Number(contract_header?.term_months);

    let subscription_term_months: number | null =
      Number.isFinite(term_months) && period_labels.length > 0 ? Math.round(term_months / period_labels.length) : null;
    if ((!Number.isFinite(subscription_term_months) || (subscription_term_months ?? 0) <= 0) && period_labels.length > 1) {
      subscription_term_months = 12;
    }

    const currency = String(contract_header?.currency ?? "");

    const opt_out_terms = String(commercial_terms?.opt_out_terms ?? "");
    const cancellationMatch = opt_out_terms.match(/(\d{1,6})\s*days/i);
    const cancellation_days = cancellationMatch ? Number(cancellationMatch[1]) : null;
    const opt_out_flag =
      /opt[-\s]?out/i.test(opt_out_terms) ? (cancellation_days !== null ? "N" : "Y") : "";

    const payment_terms = String(commercial_terms?.payment_terms ?? "");
    const mNet = payment_terms.match(/Net\s*(\d{1,6})/i);
    const payment_days = mNet ? Number(mNet[1]) : extractFirstInt(payment_terms);

    const normalizePoRequired = (value: any): string => {
      const s = String(value ?? "").trim().toLowerCase();
      if (!s) return "";
      if (s === "y" || s === "yes" || s === "true" || s === "1") return "Y";
      if (s === "n" || s === "no" || s === "false" || s === "0") return "N";
      if (s.includes("not required") || s.includes("optional") || s.includes("not needed")) return "N";
      if (s.includes("required") || /\byes\b/.test(s)) return "Y";
      return "";
    };

    const po_number = String(commercial_terms?.po_number ?? "").trim();
    const po_required_flag = normalizePoRequired(commercial_terms?.po_required);
    const po_required = po_required_flag || (po_number ? "Y" : "");

    const invoice_schedule = String(commercial_terms?.invoice_schedule ?? "");
    const invoicing_terms = /upon signing/i.test(invoice_schedule) ? "Annual-On signature" : "";

    const renewal_terms = String(commercial_terms?.renewal_terms ?? "");
    const renewal_pricing = extractPercentDecimal(renewal_terms);
    const auto_renewal =
      /automatically[\s-]*renew\w*/i.test(renewal_terms) ||
      ((/\beach\s+year\b/i.test(renewal_terms) && /\brenew\b/i.test(renewal_terms)));

    const contract_id = String(contract_header?.contract_id ?? "").trim();
    const contract_id_formatted = contract_id ? `Order Form No. ${contract_id}` : "";

    const total_contract_value = year_totals.reduce((acc: number, x: number) => acc + (Number.isFinite(x) ? x : 0), 0);

    const headers = [
      "Contract_ID",
      "Customer_Name",
      "Signature_Date",
      "Contract Start Date",
      "Contract End Date",
      "Start_Date",
      "End_Date",
      "Contract term",
      "Subscription Term",
      "Currency",
      "Total Contract",
      "total annual price",
      "Price",
      "PO_Required",
      "Product type",
      "Product",
      "Milestone",
      "System Location",
      "RevRec_Method",
      "Cancellation_Terms",
      "Termination_for_Convenience",
      "Opt out",
      "Promised future product pricing (Y/N)",
      "Free work (Y/N)",
      "Contract modification (Y/N)",
      "Payment Terms",
      "Invoicing Terms",
      "Renewal Pricing",
      "Auto-renewal",
      "Renewal Term",
    ];

    const priceForPeriod = (li: any, periodLabel: string): number => {
      const found = (Array.isArray(li?.pricing) ? li.pricing : []).find(
        (p: any) => String(p?.period_label ?? "").trim() === periodLabel,
      );
      const n = Number(found?.amount);
      return Number.isFinite(n) ? n : 0;
    };

    const rows = period_labels.flatMap((periodLabel, periodIndex) => {
      const periodAnnualTotal = annualTotalForPeriod(periodLabel);

      const periodStart =
        subscription_term_months && subscriptionStart
          ? (monthAddPreserveDay(subscriptionStart, periodIndex * subscription_term_months) ?? subscriptionStart)
          : subscriptionStart || "";

      const periodEnd =
        subscription_term_months && periodStart
          ? (monthAddEndOfMonth(periodStart, subscription_term_months) ?? "")
          : subscriptionEnd || "";

      return line_items.map((li: any) => {
        const product_type = String(li?.category ?? "");
        const product = String(li?.description ?? "");
        const revrec_method = "";

        return {
          Contract_ID: contract_id_formatted,
          Customer_Name: String(contract_header?.customer_name ?? ""),
          Signature_Date: String(contract_header?.effective_date ?? ""),
          "Contract Start Date": subscriptionStart || "",
          "Contract End Date": subscriptionEnd || "",
          Start_Date: periodStart,
          End_Date: periodEnd,
          "Contract term": Number.isFinite(term_months) ? term_months : "",
          "Subscription Term": subscription_term_months ?? "",
          Currency: currency,
          "Total Contract": total_contract_value || "",
          "total annual price": periodAnnualTotal,
          Price: priceForPeriod(li, periodLabel),
          PO_Required: po_required,
          "Product type": product_type,
          Product: product,
          Milestone: "NA",
          "System Location": "",
          RevRec_Method: revrec_method,
          Cancellation_Terms: cancellation_days ?? "",
          Termination_for_Convenience: "",
          "Opt out": opt_out_flag,
          "Promised future product pricing (Y/N)": "",
          "Free work (Y/N)": "",
          "Contract modification (Y/N)": "",
          "Payment Terms": payment_days ?? "",
          "Invoicing Terms": invoicing_terms,
          "Renewal Pricing": renewal_pricing ?? "",
          "Auto-renewal": auto_renewal,
          "Renewal Term": subscription_term_months ?? "",
        };
      });
    });

    return { headers, rows, parsing_metadata };
  }

  const revRecDatapoints = useMemo(() => {
    if (!excelResult) return null;
    try {
      return buildRevRecDatapoints(excelResult.normalized_contract);
    } catch {
      return null;
    }
  }, [excelResult]);

  const lineItemHeaders = useMemo(() => revRecDatapoints?.headers ?? [], [revRecDatapoints]);

  useEffect(() => {
    const nextRows = (revRecDatapoints?.rows ?? []).map((row: any) => {
      const normalizedRow: Record<string, string> = {};
      for (const header of lineItemHeaders) {
        const value = row?.[header];
        normalizedRow[header] = value === null || value === undefined ? "" : String(value);
      }
      return normalizedRow;
    });

    setLineItemRows(nextRows.map((row) => ({ ...row })));
    setSavedLineItemRows(nextRows.map((row) => ({ ...row })));
    setIsLineItemsEditMode(false);
  }, [revRecDatapoints, lineItemHeaders]);

  const hasUnsavedLineItemEdits = useMemo(
    () => JSON.stringify(lineItemRows) !== JSON.stringify(savedLineItemRows),
    [lineItemRows, savedLineItemRows],
  );

  const lineItemsSummary = useMemo(() => {
    if (!lineItemRows.length) return null;

    const firstRow = lineItemRows[0] ?? {};
    const getFirst = (header: string) => String(firstRow[header] ?? "").trim();

    const currency = getFirst("Currency");
    const products = lineItemRows
      .map((row) => String(row["Product"] ?? "").trim())
      .filter(Boolean);
    const uniqueProducts = Array.from(new Set(products));

    const productTypes = lineItemRows
      .map((row) => String(row["Product type"] ?? "").trim())
      .filter(Boolean);
    const uniqueProductTypes = Array.from(new Set(productTypes));

    const linePrices = lineItemRows
      .map((row) => parseNumberValue(row["Price"]))
      .filter((n): n is number => n !== null);
    const linePriceTotal = linePrices.reduce((sum, n) => sum + n, 0);

    const totalContractValue = parseNumberValue(firstRow["Total Contract"]);
    const year1Total = parseNumberValue(firstRow["total annual price"]);

    const startDate = getFirst("Start_Date");
    const endDate = getFirst("End_Date");
    const coverageWindow = startDate && endDate ? `${startDate} to ${endDate}` : startDate || endDate || "-";

    const productPreview = uniqueProducts.slice(0, 3);
    const previewText = productPreview.length
      ? `${productPreview.join(", ")}${uniqueProducts.length > productPreview.length ? ", ..." : ""}`
      : "-";

    const summaryParts: string[] = [];
    summaryParts.push(`Generated ${lineItemRows.length} line item${lineItemRows.length === 1 ? "" : "s"} across ${lineItemHeaders.length} columns.`);
    if (uniqueProducts.length) {
      summaryParts.push(`Detected ${uniqueProducts.length} distinct product${uniqueProducts.length === 1 ? "" : "s"}.`);
    }
    if (totalContractValue !== null) {
      summaryParts.push(`Total contract value: ${formatAmount(totalContractValue, currency)}.`);
    }
    if (year1Total !== null) {
      summaryParts.push(`Year 1 total: ${formatAmount(year1Total, currency)}.`);
    }
    if (coverageWindow !== "-") {
      summaryParts.push(`Coverage window: ${coverageWindow}.`);
    }

    return {
      summaryText: summaryParts.join(" "),
      stats: [
        { label: "Rows", value: String(lineItemRows.length) },
        { label: "Columns", value: String(lineItemHeaders.length) },
        { label: "Products", value: String(uniqueProducts.length) },
        { label: "Types", value: String(uniqueProductTypes.length) },
      ],
      contractId: getFirst("Contract_ID") || "-",
      customer: getFirst("Customer_Name") || "-",
      coverageWindow,
      contractValue: formatAmount(totalContractValue, currency),
      year1Total: formatAmount(year1Total, currency),
      linePriceTotal: formatAmount(linePrices.length ? linePriceTotal : null, currency),
      paymentTerms: getFirst("Payment Terms") || "-",
      productPreview: previewText,
    };
  }, [lineItemRows, lineItemHeaders]);

  const extractedContractTiles = useMemo(() => {
    if (!excelResult?.normalized_contract) return [];
    const n = excelResult.normalized_contract;
    const contract_header = n.contract_header ?? {};
    const commercial_terms = n.commercial_terms ?? {};
    const parsing_metadata = n.parsing_metadata ?? {};

    const toVal = (v: any) => {
      if (v === null || v === undefined) return "";
      return String(v).trim();
    };

    const pickHighlight = (v: any) => {
      const s = toVal(v);
      if (!s) return null;
      const nInt = extractFirstInt(s);
      if (nInt !== null) return String(nInt);
      const p = extractPercentDecimal(s);
      if (p !== null) return String(p);
      // For names/phrases, pdfjs text items often split per word.
      // Prefer highlighting with the first token for higher match rate.
      if (!/\d/.test(s)) {
        const token = s.split(/\s+/).filter(Boolean)[0];
        if (token) return token;
      }
      return s.length > 120 ? s.slice(0, 120) : s;
    };

    const tiles: Array<{ label: string; value: string; highlight: string | null }> = [
      { label: "Contract ID", value: toVal(contract_header.contract_id), highlight: pickHighlight(contract_header.contract_id) },
      { label: "Contract Type", value: toVal(contract_header.order_form_type), highlight: pickHighlight(contract_header.order_form_type) },
      { label: "Customer", value: toVal(contract_header.customer_name), highlight: pickHighlight(contract_header.customer_name) },
      { label: "Vendor", value: toVal(contract_header.vendor), highlight: pickHighlight(contract_header.vendor) },
      { label: "Effective Date", value: toVal(contract_header.subscription_start_date), highlight: pickHighlight(contract_header.subscription_start_date) },
      { label: "Expiration Date", value: toVal(contract_header.subscription_end_date), highlight: pickHighlight(contract_header.subscription_end_date) },
      { label: "Contract term (months)", value: toVal(contract_header.term_months), highlight: pickHighlight(contract_header.term_months) },
      { label: "Currency", value: toVal(contract_header.currency), highlight: pickHighlight(contract_header.currency) },

      { label: "Billing Frequency", value: toVal(commercial_terms.billing_frequency), highlight: pickHighlight(commercial_terms.billing_frequency) },
      { label: "Payment Terms", value: toVal(commercial_terms.payment_terms), highlight: pickHighlight(commercial_terms.payment_terms) },
      { label: "Invoice Schedule", value: toVal(commercial_terms.invoice_schedule), highlight: pickHighlight(commercial_terms.invoice_schedule) },
      { label: "PO Required", value: toVal(commercial_terms.po_required), highlight: pickHighlight(commercial_terms.po_required) },
      { label: "PO Number", value: toVal(commercial_terms.po_number), highlight: pickHighlight(commercial_terms.po_number) },
      { label: "Renewal Terms", value: toVal(commercial_terms.renewal_terms), highlight: pickHighlight(commercial_terms.renewal_terms) },
      { label: "Opt-out / Termination", value: toVal(commercial_terms.opt_out_terms), highlight: pickHighlight(commercial_terms.opt_out_terms) },

      { label: "Contract Type Guess", value: toVal(parsing_metadata.contract_type_guess), highlight: pickHighlight(parsing_metadata.contract_type_guess) },
    ];

    return tiles.filter((t) => t.value || t.highlight);
  }, [excelResult]);

  const normalizedContract = excelResult?.normalized_contract ?? null;
  const headerTableRows = useMemo(
    () =>
      normalizedContract
        ? Object.entries(normalizedContract.contract_header ?? {}).map(([k, v]) => ({
            key: k,
            value: v === null || v === undefined ? "" : String(v),
          }))
        : [],
    [normalizedContract],
  );

  const commercialTableRows = useMemo(
    () =>
      normalizedContract
        ? Object.entries(normalizedContract.commercial_terms ?? {}).map(([k, v]) => ({
            key: k,
            value: v === null || v === undefined ? "" : String(v),
          }))
        : [],
    [normalizedContract],
  );

  const activeSourceLabel = useMemo(() => {
    if (selectedSourceId?.startsWith("file-")) {
      const index = Number(selectedSourceId.replace("file-", ""));
      const f = Number.isFinite(index) ? files[index] : undefined;
      return f?.name ?? "Selected document";
    }
    if (selectedSourceId === "pasted") {
      return "Pasted order form text";
    }
    return "No document selected";
  }, [selectedSourceId, files]);

  const selectedFile = useMemo(() => {
    if (!selectedSourceId?.startsWith("file-")) return null;
    const index = Number(selectedSourceId.replace("file-", ""));
    if (!Number.isFinite(index)) return null;
    return files[index] ?? null;
  }, [selectedSourceId, files]);

  const isInitialLoadState = files.length === 0 && !pastedText.trim();

  useEffect(() => {
    // Generate a preview URL for PDFs and text-like files
    if (!selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    const isTextLike =
      selectedFile.type.startsWith("text/") ||
      /\.(txt|md|csv)$/i.test(selectedFile.name);

    if (!isPdf && !isTextLike) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!excelResult) return;
    // Create an object URL for download.
    const byteCharacters = atob(excelResult.excel_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    setExcelUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [excelResult]);

  useEffect(() => {
    return () => {
      if (excelUrl) URL.revokeObjectURL(excelUrl);
    };
  }, [excelUrl]);

  async function processContract() {
    if (!selectedFile) {
      toast({ title: "Select a PDF", description: "Choose a PDF order form document on the left." });
      return;
    }
    if (selectedSourceId === "pasted") {
      toast({ title: "PDF required", description: "Excel generation requires a PDF input for this POC." });
      return;
    }

    try {
      setIsProcessing(true);
      setExcelResult(null);
      setExcelUrl(null);
      setPdfHighlightQuery(null);
      setActiveProcessStep(0);

      // Simulate step-wise progress while backend runs
      if (processingIntervalRef.current !== null) {
        window.clearInterval(processingIntervalRef.current);
      }
      let stepIndex = 0;
      processingIntervalRef.current = window.setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, processSteps.length - 1);
        setActiveProcessStep(stepIndex);
      }, 2600);

      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await apiClient.request("/api/contracts/process", { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok || (json as any)?.error) {
        throw new Error((json as any)?.error || `Processing failed (${res.status})`);
      }

      const payload = json as any;
      setExcelResult({
        jobId: payload.jobId,
        excel_filename: payload.excel_filename,
        excel_base64: payload.excel_base64,
        normalized_contract: payload.normalized_contract,
      });

      toast({ title: "Processing complete", description: "Extracted contract fields and Excel export are ready." });
    } catch (e: any) {
      toast({ title: "Processing failed", description: e?.message || "Unable to process contract." });
    } finally {
      if (processingIntervalRef.current !== null) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      // If we got a result, mark all steps as complete; otherwise leave wherever it stopped
      setActiveProcessStep((prev) => (excelResult ? processSteps.length - 1 : prev));
      setIsProcessing(false);
    }
  }

  function updateLineItemCell(rowIndex: number, header: string, value: string) {
    setLineItemRows((prev) => {
      if (!prev[rowIndex]) return prev;
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [header]: value };
      return next;
    });
  }

  function resetLineItemEdits() {
    setLineItemRows(savedLineItemRows.map((row) => ({ ...row })));
  }

  function saveLineItemEdits() {
    setSavedLineItemRows(lineItemRows.map((row) => ({ ...row })));
    setIsLineItemsEditMode(false);
    toast({
      title: "Line items updated",
      description: "Changes are saved and will be included in the next Excel export.",
    });
  }

  function shouldUseTextarea(header: string, value: string) {
    return (
      value.length > 42 ||
      /(terms|schedule|product|milestone|location|modification|pricing|invoicing|payment|cancellation|termination|auto[-_ ]?renewal)/i.test(
        header,
      )
    );
  }

  async function exportExcelWithCurrentEdits() {
    if (!excelResult) {
      toast({ title: "No Excel available", description: "Process a contract first." });
      return;
    }

    if (!lineItemHeaders.length || !lineItemRows.length) {
      if (excelUrl) {
        triggerFileDownload(excelUrl, excelResult.excel_filename);
      }
      return;
    }

    try {
      setIsExportingExcel(true);

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(excelResult.excel_base64, { type: "base64" });
      const targetSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "rev rec datapoints") || "Rev Rec Datapoints";

      const rowData = lineItemRows.map((row) => lineItemHeaders.map((header) => toExcelCellValue(row[header] ?? "")));
      const sheetData = [[], [], lineItemHeaders, ...rowData];
      const updatedSheet = XLSX.utils.aoa_to_sheet(sheetData);
      updatedSheet["!cols"] = lineItemHeaders.map((_, idx) => ({ wch: idx < 12 ? 22 : 26 }));

      workbook.Sheets[targetSheetName] = updatedSheet;
      if (!workbook.SheetNames.includes(targetSheetName)) {
        workbook.SheetNames.push(targetSheetName);
      }

      const outputArrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const outputBlob = new Blob([outputArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const outputUrl = URL.createObjectURL(outputBlob);

      triggerFileDownload(outputUrl, excelResult.excel_filename || "extracted_contract.xlsx");
      window.setTimeout(() => URL.revokeObjectURL(outputUrl), 1500);

      toast({
        title: "Excel exported",
        description: "Export includes your latest table edits.",
      });
    } catch (error: any) {
      if (excelUrl) {
        triggerFileDownload(excelUrl, excelResult.excel_filename || "extracted_contract.xlsx");
      }
      toast({
        title: "Export fallback",
        description: error?.message ? `Exported original workbook. ${error.message}` : "Exported original workbook.",
      });
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header fullWidth />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-4 space-y-5 sm:px-6 lg:max-w-[1480px] lg:py-5 xl:max-w-[1720px] xl:px-8 2xl:max-w-[1880px] 2xl:px-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 mt-0.5 h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-[1.7rem]">Contract Automation Studio</h1>
              <p className="text-sm text-muted-foreground">
                Load executed contracts, run the MetricStream extractor, and review normalized contract data with Excel export.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              className="bg-gradient-primary"
              onClick={() => {
                setExcelResult(null);
                setExcelUrl(null);
                setPdfHighlightQuery(null);
                setIsLineItemsModalOpen(false);
                setIsLineItemsEditMode(false);
                setIsExportingExcel(false);
              }}
              disabled={isProcessing}
            >
              Start Over
            </Button>
          </div>
        </div>

        {/* Two-step studio layout */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6 xl:gap-8 items-start">
          {/* Left: Contract specialist persona (only on initial load) */}
          {isInitialLoadState && (
            <Card className="relative overflow-hidden border-primary/25 bg-card/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_36px_90px_-60px_hsl(var(--primary)/0.8)] xl:sticky xl:top-24">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_0%_0%,hsl(var(--primary)/0.2),transparent_58%),radial-gradient(80%_70%_at_100%_100%,hsl(var(--primary)/0.14),transparent_66%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_74%)]" />

              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {personaAgent?.image && !personaImageFailed ? (
                        <div className="h-32 w-32 rounded-3xl overflow-hidden border border-primary/35 bg-black/25 flex items-center justify-center">
                          <img
                            src={personaAgent.image}
                            alt={personaAgent.name}
                            className="h-full w-full object-cover"
                            onError={() => setPersonaImageFailed(true)}
                          />
                        </div>
                      ) : (
                        <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/40 bg-primary/15 text-2xl">
                          {personaAgent?.icon ?? "📄"}
                        </span>
                      )}
                      <span className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-background/90 text-primary shadow-lg">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div>
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/12 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-primary/90">
                        Contract Copilot
                      </span>
                      <CardTitle className="mt-2 text-lg leading-tight text-foreground">{personaAgent?.name ?? "Clara"}</CardTitle>
                      <CardDescription className="mt-1 max-w-[34ch] text-sm text-primary/90">
                        {personaAgent?.tagline ?? "Contract Intelligence & Revenue Recognition Expert"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="rounded-xl border border-primary/20 bg-background/55 p-4 backdrop-blur-sm">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">Persona</div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{personaAgent?.persona ?? ""}</p>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/35 p-4">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">What she does</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{personaAgent?.description ?? ""}</p>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/35 p-4">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">Specialties</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(personaAgent?.specialties ?? []).slice(0, 6).map((s) => (
                      <span key={s} className="inline-flex rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-foreground/90">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Right: Load Source Documents */}
          <Card className="relative overflow-hidden border-primary/25 bg-card/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]">
            {isInitialLoadState && (
              <CardHeader className="items-start pb-4">
                <CardTitle className="text-lg">Load Source Documents</CardTitle>
              </CardHeader>
            )}
            <CardContent className="space-y-5 transition-all duration-300 w-full">
              {/* Loaded document view – no extra nested card once a document is present */}
              {selectedSourceId === "pasted" && pastedText.trim() ? (
                <div>
                  <div className="text-xs font-medium text-muted-foreground/90 mb-2">Loaded document</div>
                  <div className="rounded-xl border border-border/70 bg-background/60 h-64 overflow-hidden">
                    <pre className="w-full h-full overflow-auto px-3 py-2 text-[0.7rem] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {pastedText}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="text-xs text-muted-foreground truncate">Pasted order form text</div>
                    <label className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer shadow-md hover:shadow-lg transition-smooth">
                      <span>Add more</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const list = Array.from(e.target.files ?? []);
                          setFiles(list);
                          if (list.length) setSelectedSourceId("file-0");
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : selectedFile && previewUrl ? (
                <div>
                  <div className="text-xs font-medium text-muted-foreground/90 mb-2">Loaded document</div>
                  <div className="rounded-xl border border-border/70 bg-background/60 h-[460px] lg:h-[520px] xl:h-[600px] 2xl:h-[700px] overflow-hidden">
                    {selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                      <PdfRedlineViewer fileUrl={previewUrl} query={pdfHighlightQuery} maxPages={12} />
                    ) : (
                      <iframe src={previewUrl} title="Selected document preview" className="h-full w-full border-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="text-xs text-muted-foreground truncate">{selectedFile.name}</div>
                    <label className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer shadow-md hover:shadow-lg transition-smooth">
                      <span>Add more</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const list = Array.from(e.target.files ?? []);
                          setFiles(list);
                          if (list.length) setSelectedSourceId("file-0");
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl border border-dashed border-primary/35 bg-muted/20 px-6 py-10 flex flex-col gap-3 transition-all duration-300 ${
                    isInitialLoadState ? "items-center justify-center text-center" : "items-start text-left"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium text-foreground/95">Drop files here or click to browse</div>
                  <div className="text-xs text-muted-foreground/90">
                    PDF, DOCX, XLSX, CSV, TXT — up to 25MB each (POC limited by browser preview).
                  </div>
                  <div className="mt-4">
                    <label className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer shadow-md hover:shadow-lg transition-smooth">
                      <span>Choose Files</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const list = Array.from(e.target.files ?? []);
                          setFiles(list);
                          if (list.length) {
                            setSelectedSourceId("file-0");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {files.length
                      ? `${files.length} document${files.length > 1 ? "s" : ""} queued.`
                      : "No documents queued yet."}
                  </div>
                </div>
              )}

 {/*          Cloud connectors (static POC buttons) – only show before a document is loaded
              {isInitialLoadState && (
                <>
                  <div className="text-xs font-medium text-muted-foreground/90">Or connect cloud</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" size="sm" className="h-10 justify-start rounded-xl bg-background/40">
                      <span className="h-2 w-2 rounded-full bg-yellow-400 mr-2" />
                      Google Drive
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 justify-start rounded-xl bg-background/40">
                      <span className="h-2 w-2 rounded-full bg-blue-400 mr-2" />
                      OneDrive
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 justify-start rounded-xl bg-background/40">
                      <span className="h-2 w-2 rounded-full bg-sky-500 mr-2" />
                      Box
                    </Button>
                  </div>
                </>
              )}
*/}
              {/* Simple queued list – only show before a document is actively loaded */}
              {!selectedFile && !pastedText && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-medium text-muted-foreground/90">Queued documents</div>
                  <div className="space-y-2">
                    {files.map((file, index) => {
                      const id = `file-${index}`;
                      const isActive = selectedSourceId === id;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setSelectedSourceId(id)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs text-left transition-smooth ${
                            isActive
                              ? "border-primary/70 bg-primary/10"
                              : "border-border/70 bg-background/60 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-pink-500" />
                            <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <span className="text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
                        </button>
                      );
                    })}
                    {pastedText && (
                      <button
                        type="button"
                        onClick={() => setSelectedSourceId("pasted")}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs text-left transition-smooth ${
                          selectedSourceId === "pasted"
                            ? "border-primary/70 bg-primary/10"
                            : "border-border/40 bg-background/40 hover:border-border/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-medium">Pasted order form text</span>
                        </div>
                        <span className="text-muted-foreground">{pastedText.length} chars</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Right: Automation Workspace + results (only after a document is present) */}
          {(files.length > 0 || !!pastedText || !!excelResult) && (
            <Card className="h-fit border-border/70 bg-card/60 xl:sticky xl:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Automation Workspace</span>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Extractor
                    <ChevronRight className="h-3 w-3" />
                    Contract Data
                  </span>
                </CardTitle>
                <CardDescription className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <span>Run the MetricStream contract extractor to structure this order form.</span>
                  <span className="hidden lg:inline-flex rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                    Current document: <span className="ml-1 text-foreground truncate max-w-[180px]">{activeSourceLabel}</span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 xl:max-h-[calc(100vh-10.5rem)] xl:overflow-y-auto xl:pr-1">
                {isProcessing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold">Processing contract</div>
                        <div className="text-xs text-muted-foreground">Running the MetricStream pipeline end-to-end.</div>
                      </div>
                      <RefreshCcw className="h-4 w-4 text-primary animate-spin" />
                    </div>
                    <div className="space-y-2">
                      {processSteps.map((label, index) => {
                        const isDone = index < activeProcessStep;
                        const isActive = index === activeProcessStep;
                        return (
                          <div
                            key={label}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-xs transition-smooth ${
                              isDone
                                ? "border-emerald-500/70 bg-emerald-500/10"
                                : isActive
                                  ? "border-primary/80 bg-primary/10"
                                  : "border-border/60 bg-background/40"
                            }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center text-[0.65rem] font-semibold ${
                                isDone
                                  ? "bg-emerald-500 text-emerald-50"
                                  : isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{label}</div>
                              {isActive && (
                                <div className="text-[0.7rem] text-muted-foreground/90">This step is currently running.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isProcessing && !excelResult && (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-3 opacity-70" />
                    <div className="text-sm text-muted-foreground">Ready when you are.</div>
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={processContract}
                        disabled={!selectedFile || isProcessing}
                        className="bg-gradient-primary"
                      >
                        {isProcessing ? (
                          <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CloudUpload className="h-4 w-4 mr-2" />
                        )}
                        Process Information
                      </Button>
                    </div>
                    {!selectedFile && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Select a PDF on the left to enable processing.
                      </div>
                    )}
                  </div>
                )}

                {excelResult && !isProcessing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold">Extract MetricStream Contract Data</div>
                        <div className="text-xs text-muted-foreground">Complete • {extractedContractTiles.length} fields</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={exportExcelWithCurrentEdits}
                        disabled={!excelResult || isExportingExcel}
                      >
                        {isExportingExcel ? (
                          <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {isExportingExcel ? "Preparing..." : "Export Excel"}
                      </Button>
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-full bg-primary/80" />
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 xl:grid-cols-4">
                        <TabsTrigger value="summary" className="px-2 text-[0.72rem] sm:text-xs md:text-sm">
                          Summary
                        </TabsTrigger>
                        <TabsTrigger value="header" className="px-2 text-[0.72rem] sm:text-xs md:text-sm">
                          Header
                        </TabsTrigger>
                        <TabsTrigger value="terms" className="px-2 text-[0.72rem] sm:text-xs md:text-sm">
                          Terms
                        </TabsTrigger>
                        <TabsTrigger value="lines" className="px-2 text-[0.72rem] sm:text-xs md:text-sm">
                          Line Items
                        </TabsTrigger>
                      </TabsList>

                  <TabsContent value="summary" className="mt-4 space-y-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground/90">Extracted Contract Fields</div>
                      <div className="text-[0.7rem] text-muted-foreground mt-1">
                        Click any field to redline it in the PDF
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {extractedContractTiles.map((t) => {
                        const isActive = pdfHighlightQuery === t.highlight || pdfHighlightQuery === t.value;
                        return (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => setPdfHighlightQuery(t.highlight ?? t.value)}
                            className={`rounded-lg border px-3 py-2 text-left transition-smooth ${
                              isActive
                                ? "border-primary/80 bg-primary/10"
                                : "border-border/70 bg-background/30 hover:border-border/90"
                            }`}
                          >
                            <div className="text-[0.65rem] font-semibold tracking-wide uppercase text-muted-foreground/90">
                              {t.label}
                            </div>
                            <div className="mt-1 text-sm font-medium break-words">
                              {t.value ? t.value : <span className="opacity-60">—</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="header" className="mt-4">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[220px]">Field</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {headerTableRows.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell className="font-medium">{row.key}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <button
                                  type="button"
                                  className="text-left w-full"
                                  onClick={() => setPdfHighlightQuery(row.value)}
                                >
                                  {row.value || <span className="opacity-60">—</span>}
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="terms" className="mt-4">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[220px]">Field</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commercialTableRows.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell className="font-medium">{row.key}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <button
                                  type="button"
                                  className="text-left w-full"
                                  onClick={() => setPdfHighlightQuery(row.value)}
                                >
                                  {row.value || <span className="opacity-60">—</span>}
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="lines" className="mt-4">
                    {lineItemRows.length ? (
                      <div className="space-y-4 rounded-xl border border-border/70 bg-background/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">Line Items Summary</div>
                            <div className="text-xs text-muted-foreground">
                              Review the generated Excel snapshot below, then open the full table for detailed review and edits.
                            </div>
                          </div>
                          <Button type="button" className="bg-gradient-primary" onClick={() => setIsLineItemsModalOpen(true)}>
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Open Full Table
                          </Button>
                        </div>

                        <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2.5">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Generated Excel Summary</div>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{lineItemsSummary?.summaryText || "-"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          {(lineItemsSummary?.stats ?? []).map((item) => (
                            <div key={item.label} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                              <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">{item.label}</div>
                              <div className="mt-1 text-sm font-semibold">{item.value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Contract ID</div>
                            <div className="mt-1 text-sm font-medium break-words">{lineItemsSummary?.contractId || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Customer</div>
                            <div className="mt-1 text-sm font-medium break-words">{lineItemsSummary?.customer || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Coverage Window</div>
                            <div className="mt-1 text-sm font-medium break-words">{lineItemsSummary?.coverageWindow || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Product Snapshot</div>
                            <div className="mt-1 text-sm font-medium break-words">{lineItemsSummary?.productPreview || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Contract Value</div>
                            <div className="mt-1 text-sm font-medium break-words">{lineItemsSummary?.contractValue || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground/90">Year 1 / Line Sum</div>
                            <div className="mt-1 text-sm font-medium break-words">
                              {lineItemsSummary?.year1Total || "-"} / {lineItemsSummary?.linePriceTotal || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No line items extracted.</div>
                    )}
                  </TabsContent>
                </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog
          open={isLineItemsModalOpen}
          onOpenChange={(open) => {
            setIsLineItemsModalOpen(open);
            if (!open) setIsLineItemsEditMode(false);
          }}
        >
          <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-0 overflow-hidden p-0">
            <DialogHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <DialogTitle>Line Items Table</DialogTitle>
                  <DialogDescription>
                    {lineItemRows.length} rows • {lineItemHeaders.length} columns.
                    {isLineItemsEditMode
                      ? " Editing is enabled. Update any cell and click Apply."
                      : " Open edit mode to update values without cramped scrolling."}
                    {" Saved changes are included when you export Excel."}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <Button
                    type="button"
                    variant={isLineItemsEditMode ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setIsLineItemsEditMode((prev) => !prev)}
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    {isLineItemsEditMode ? "Editing" : "Edit Fields"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetLineItemEdits} disabled={!hasUnsavedLineItemEdits}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button type="button" size="sm" onClick={saveLineItemEdits} disabled={!hasUnsavedLineItemEdits}>
                    <Save className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden px-5 py-4 sm:px-6">
              {lineItemRows.length ? (
                <div className="h-full rounded-lg border border-border/70">
                  <div className="h-full overflow-auto">
                    <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-xs sm:text-sm">
                      <thead className="sticky top-0 z-10 bg-background">
                        <tr>
                          <th className="sticky left-0 z-20 border-b border-r border-border/70 bg-background px-3 py-2 text-left font-semibold text-muted-foreground">
                            #
                          </th>
                          {lineItemHeaders.map((header) => (
                            <th
                              key={header}
                              className="whitespace-nowrap border-b border-border/70 bg-background px-3 py-2 text-left font-semibold text-muted-foreground"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineItemRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="odd:bg-background/30 even:bg-background/10">
                            <td className="sticky left-0 z-10 border-b border-r border-border/60 bg-background/95 px-3 py-2 align-top font-medium text-muted-foreground">
                              {rowIndex + 1}
                            </td>
                            {lineItemHeaders.map((header) => {
                              const value = row[header] ?? "";
                              const isHighlightable =
                                header === "Product" ||
                                header === "Price" ||
                                header === "Contract_ID" ||
                                header === "Customer_Name";
                              return (
                                <td key={`${rowIndex}-${header}`} className="min-w-[170px] border-b border-border/60 p-2 align-top">
                                  {isLineItemsEditMode ? (
                                    shouldUseTextarea(header, value) ? (
                                      <Textarea
                                        value={value}
                                        onChange={(e) => updateLineItemCell(rowIndex, header, e.target.value)}
                                        className="min-h-[2.35rem] resize-y border-border/60 bg-background/70 text-xs leading-snug"
                                      />
                                    ) : (
                                      <Input
                                        value={value}
                                        onChange={(e) => updateLineItemCell(rowIndex, header, e.target.value)}
                                        className="h-9 border-border/60 bg-background/70 text-xs"
                                      />
                                    )
                                  ) : (
                                    <button
                                      type="button"
                                      className="w-full text-left text-foreground break-words leading-snug"
                                      onClick={() => {
                                        if (isHighlightable && value) setPdfHighlightQuery(value);
                                      }}
                                    >
                                      {value || <span className="opacity-60">—</span>}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
                  No line items extracted.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
