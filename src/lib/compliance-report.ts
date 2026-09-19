import { jsPDF } from "jspdf";
import type { RequestRecord } from "./secp-data";
import { AUTONOMY_LABELS, LAYERS } from "./secp-data";
import type { ApprovalRecord } from "./secp-store";
import { sha256Hex, downloadBlob, timestampSlug } from "./export";

export interface ComplianceReportInput {
  request: RequestRecord;
  approvals: ApprovalRecord[];
  operator: string;
}

export interface ComplianceReportPayload {
  report_kind: "secp_request_compliance";
  generated_at: string;
  operator: string;
  request: {
    id: string;
    title: string;
    origin: string;
    priority: string;
    autonomy: number;
    autonomy_label: string;
    progress: number;
    brief: string;
  };
  stages: {
    stage: string;
    layer: string;
    layer_code: string;
    title: string;
    agent: string;
    status: string;
    reasoning: string;
    artifact: string | null;
  }[];
  validators: { name: string; status: string; detail: string }[];
  approvals: ApprovalRecord[];
  export_verification: {
    algorithm: "sha256";
    format: "content-addressed";
    note: string;
  };
}

function buildPayload({
  request,
  approvals,
  operator,
}: ComplianceReportInput): ComplianceReportPayload {
  return {
    report_kind: "secp_request_compliance",
    generated_at: new Date().toISOString(),
    operator,
    request: {
      id: request.id,
      title: request.title,
      origin: request.origin,
      priority: request.priority,
      autonomy: request.autonomy,
      autonomy_label: AUTONOMY_LABELS[request.autonomy],
      progress: request.progress,
      brief: request.brief,
    },
    stages: request.steps.map((s) => ({
      stage: s.stage,
      layer: s.layer,
      layer_code: LAYERS.find((l) => l.id === s.layer)?.code ?? s.layer,
      title: s.title,
      agent: s.agent,
      status: s.status,
      reasoning: s.reasoning,
      artifact: s.artifact ?? null,
    })),
    validators: request.validators.map((v) => ({
      name: v.name,
      status: v.status,
      detail: v.detail,
    })),
    approvals,
    export_verification: {
      algorithm: "sha256",
      format: "content-addressed",
      note: "Every stage output, validator, and approval above is signed by the SHA-256 hash embedded in this report and duplicated in the .sha256 sidecar.",
    },
  };
}

function wrapText(pdf: jsPDF, text: string, width: number): string[] {
  return pdf.splitTextToSize(text, width) as string[];
}

function renderPdf(payload: ComplianceReportPayload, sha256: string): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const width = pdf.internal.pageSize.getWidth() - marginX * 2;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 56;
  const line = (h = 14) => {
    y += h;
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = 56;
    }
  };
  const writeBlock = (lines: string[], size = 10, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    for (const l of lines) {
      pdf.text(l, marginX, y);
      line(size + 4);
    }
  };
  const section = (label: string) => {
    line(6);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(30, 90, 160);
    pdf.text(label.toUpperCase(), marginX, y);
    pdf.setTextColor(0, 0, 0);
    line(14);
  };
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`Soteria SECP · Compliance Report`, marginX, y);
  line(20);
  writeBlock([`Request ${payload.request.id} — ${payload.request.title}`], 12, true);
  writeBlock([
    `Generated ${payload.generated_at}`,
    `Operator: ${payload.operator}`,
    `Origin: ${payload.request.origin} · Priority ${payload.request.priority} · Autonomy L${payload.request.autonomy} (${payload.request.autonomy_label})`,
    `Progress: ${(payload.request.progress * 100).toFixed(0)}%`,
  ]);
  section("Directive brief");
  writeBlock(wrapText(pdf, payload.request.brief, width));
  section("Stage outputs");
  for (const s of payload.stages) {
    writeBlock([`[${s.layer_code}] ${s.stage.toUpperCase()} · ${s.title} · ${s.status}`], 10, true);
    writeBlock(wrapText(pdf, `Agent: ${s.agent}`, width), 9);
    writeBlock(wrapText(pdf, s.reasoning, width), 9);
    if (s.artifact) writeBlock(wrapText(pdf, `Artifact: ${s.artifact}`, width), 9);
    line(4);
  }
  section("Validator results");
  for (const v of payload.validators) {
    writeBlock([`${v.name} — ${v.status.toUpperCase()}`], 10, true);
    writeBlock(wrapText(pdf, v.detail, width), 9);
  }
  section("Co-approval ledger");
  if (payload.approvals.length === 0) {
    writeBlock(["No co-approvals recorded for this request."], 10);
  } else {
    for (const a of payload.approvals) {
      writeBlock([`${a.ts} · ${a.stage.toUpperCase()}`], 10, true);
      writeBlock(wrapText(pdf, `Approver: ${a.approver} — for requester ${a.requester}`, width), 9);
      if (a.note) writeBlock(wrapText(pdf, `Note: ${a.note}`, width), 9);
    }
  }
  section("Export verification");
  writeBlock([
    `Algorithm: SHA-256`,
    `Report hash: ${sha256}`,
    `Sidecar file: ${payload.request.id}-compliance.json.sha256`,
  ]);
  writeBlock(wrapText(pdf, payload.export_verification.note, width), 9);
  return pdf;
}

export async function downloadComplianceReport(
  input: ComplianceReportInput,
): Promise<{ sha256: string; jsonFile: string; pdfFile: string }> {
  const payload = buildPayload(input);
  const jsonBody = JSON.stringify(payload);
  const bodyHash = await sha256Hex(jsonBody);
  const signed = { ...payload, sha256: bodyHash };
  const signedStr = JSON.stringify(signed, null, 2);
  const finalHash = await sha256Hex(signedStr);
  const stamp = timestampSlug();
  const jsonName = `${payload.request.id}-compliance-${stamp}.json`;
  const pdfName = `${payload.request.id}-compliance-${stamp}.pdf`;
  downloadBlob(jsonName, signedStr, "application/json");
  downloadBlob(
    `${jsonName}.sha256`,
    `${finalHash}  ${jsonName}\n# Soteria SECP compliance report\n# algorithm=sha256\n# generated_at=${payload.generated_at}\n`,
    "text/plain",
  );
  const pdf = renderPdf(payload, finalHash);
  pdf.save(pdfName);
  return { sha256: finalHash, jsonFile: jsonName, pdfFile: pdfName };
}
