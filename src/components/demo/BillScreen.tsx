"use client";

import { useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Copy,
  FileImage,
  Loader2,
  MessageCircleQuestion,
  OctagonAlert,
  Plus,
  ReceiptText,
  ScanText,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import sampleBill from "@/data/sampleBill.json";
import { auditBill, parseBillText, type AuditAlert, type AuditResult, type BillItem } from "@/lib/auditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatINR } from "@/lib/utils";
import { ScreenIntro } from "./ScreenIntro";

type Source = "sample" | "upload";

type Row = BillItem & { id: number };

let rowId = 0;
const toRows = (items: BillItem[]): Row[] => items.map((i) => ({ ...i, id: ++rowId }));

export function BillScreen() {
  const [source, setSource] = useState<Source | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [ocr, setOcr] = useState<{ status: string; progress: number } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function loadSample() {
    setSource("sample");
    setImageUrl("/sample-bill.png");
    setRows(toRows(sampleBill.items));
    setResult(null);
    setOcr(null);
    setOcrError(null);
    setRawText(null);
  }

  async function onFile(file: File) {
    setSource("upload");
    setResult(null);
    setRows([]);
    setRawText(null);
    setOcrError(null);
    setImageUrl((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setOcr({ status: "Starting the on-device reader", progress: 0 });
    try {
      const { createWorker, OEM } = await import("tesseract.js");
      // All three asset paths are self-hosted so OCR works with no network.
      const worker = await createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/core",
        langPath: "/tesseract/lang",
        workerBlobURL: false,
        logger: (m: { status: string; progress: number }) =>
          setOcr({ status: m.status.charAt(0).toUpperCase() + m.status.slice(1), progress: m.progress }),
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setRawText(data.text);
      const parsed = parseBillText(data.text);
      setRows(toRows(parsed.length ? parsed : [{ name: "", quantity: 1, unitPrice: 0, amount: 0 }]));
      setOcr(null);
    } catch {
      setOcr(null);
      setOcrError("We could not read this image. You can type the items in the table below, or use the sample bill.");
      setRows(toRows([{ name: "", quantity: 1, unitPrice: 0, amount: 0 }]));
    }
  }

  function updateRow(id: number, patch: Partial<BillItem>) {
    setResult(null);
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if ("quantity" in patch || "unitPrice" in patch) next.amount = Math.round(next.quantity * next.unitPrice * 100) / 100;
        return next;
      }),
    );
  }

  function runAudit() {
    const items: BillItem[] = rows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name, quantity: r.quantity, unitPrice: r.unitPrice, amount: r.amount }));
    setResult(auditBill(items));
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Phase 3 · After the hospital"
        title="Printed invoice and drug auditor"
        text="Scan a printed pharmacy bill. VigilCare decodes every medicine, spots the same drug sold under two brand names, and compares prices with a reference. Everything runs on this device."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={loadSample}
          className={cn(
            "group flex min-h-28 cursor-pointer items-start gap-4 rounded-2xl border-2 bg-surface p-5 text-left shadow-soft transition-colors hover:border-primary",
            source === "sample" ? "border-primary" : "border-line",
          )}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-white">
            <ReceiptText className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-lg font-bold text-ink">Use sample bill</span>
            <span className="mt-1 block text-[15px] text-muted">
              A seeded printed bill from a fictional hospital, with its known line items. Always works.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "group flex min-h-28 cursor-pointer items-start gap-4 rounded-2xl border-2 bg-surface p-5 text-left shadow-soft transition-colors hover:border-primary",
            source === "upload" ? "border-primary" : "border-line",
          )}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <Upload className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-lg font-bold text-ink">Upload a printed bill</span>
            <span className="mt-1 block text-[15px] text-muted">
              Reads a photo of a printed bill on the device (OCR). You can correct any misreads before checking.
            </span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload a photo of a printed bill"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="-mt-2 text-sm text-muted">
        Handwritten notes are not supported on purpose: misreading handwriting about medicines is dangerous. Want to try OCR?{" "}
        <a href="/sample-bill.png" download className="font-semibold text-primary-ink underline underline-offset-2">
          Download the sample bill image
        </a>{" "}
        and upload it.
      </p>

      {source && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="size-5 text-primary" aria-hidden /> {source === "sample" ? "Sample bill (fictional)" : "Your bill"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local file or blob URL; no optimisation needed
                <img
                  src={imageUrl}
                  alt={source === "sample" ? "Printed pharmacy bill from Sunrise Demo Hospital, a fictional hospital" : "Uploaded bill"}
                  className="max-h-[520px] w-full rounded-xl border border-line object-contain object-top"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanText className="size-5 text-primary" aria-hidden /> Line items
              </CardTitle>
              <CardDescription>
                {source === "sample"
                  ? "Known line items for the sample bill. You can edit them."
                  : "Read on this device. Check each number against the paper bill and fix any misreads."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ocr && (
                <div role="status" className="rounded-xl border border-line bg-page p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> {ocr.status}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(ocr.progress * 100)}%` }} />
                  </div>
                </div>
              )}
              {ocrError && (
                <p role="alert" className="rounded-xl border border-line-strong bg-page p-3 text-sm text-ink">
                  {ocrError}
                </p>
              )}

              {!ocr && rows.length > 0 && (
                <>
                  <ItemsEditor rows={rows} onChange={updateRow} onRemove={(id) => setRows((rs) => rs.filter((r) => r.id !== id))} />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRows((rs) => [...rs, ...toRows([{ name: "", quantity: 1, unitPrice: 0, amount: 0 }])])}
                    >
                      <Plus aria-hidden /> Add a line
                    </Button>
                    <Button size="lg" onClick={runAudit} disabled={!rows.some((r) => r.name.trim())}>
                      <CircleCheck aria-hidden /> Check this bill
                    </Button>
                  </div>
                  {rawText && (
                    <details className="rounded-xl border border-line bg-page p-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-muted">Show the raw text read from the image</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink">{rawText}</pre>
                    </details>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div ref={resultRef} className="scroll-mt-40">
        {result && <AuditResults result={result} />}
      </div>
    </div>
  );
}

function ItemsEditor({
  rows,
  onChange,
  onRemove,
}: {
  rows: Row[];
  onChange: (id: number, patch: Partial<BillItem>) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div aria-hidden className="grid grid-cols-[1fr_1fr_1fr_2.75rem] gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted sm:hidden">
        <span>Qty</span>
        <span>Rate ₹</span>
        <span>Amount ₹</span>
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_5.5rem_2.75rem] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
        <span>Item</span>
        <span>Qty</span>
        <span>Rate ₹</span>
        <span>Amount ₹</span>
        <span className="sr-only">Remove</span>
      </div>
      {rows.map((r, idx) => (
        <div
          key={r.id}
          className="grid grid-cols-[1fr_1fr_1fr_2.75rem] gap-2 rounded-xl border border-line p-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_5.5rem_2.75rem] sm:border-0 sm:p-0"
        >
          <Input
            aria-label={`Item ${idx + 1} name`}
            value={r.name}
            placeholder="Item name"
            onChange={(e) => onChange(r.id, { name: e.target.value })}
            className="col-span-4 sm:col-span-1"
          />
          <Input
            aria-label={`Item ${idx + 1} quantity`}
            type="number"
            inputMode="decimal"
            min={0}
            value={r.quantity}
            onChange={(e) => onChange(r.id, { quantity: Number(e.target.value) || 0 })}
            className="px-2 tabular-nums"
          />
          <Input
            aria-label={`Item ${idx + 1} rate in rupees`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={r.unitPrice}
            onChange={(e) => onChange(r.id, { unitPrice: Number(e.target.value) || 0 })}
            className="px-2 tabular-nums"
          />
          <Input
              aria-label={`Item ${idx + 1} amount in rupees`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={r.amount}
              onChange={(e) => onChange(r.id, { amount: Number(e.target.value) || 0 })}
              className="px-2 tabular-nums"
            />
          <Button variant="ghost" size="icon" onClick={() => onRemove(r.id)} aria-label={`Remove item ${idx + 1}`}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
    </div>
  );
}

function AuditResults({ result }: { result: AuditResult }) {
  return (
    <section aria-labelledby="audit-summary" className="space-y-5">
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink p-5 text-white shadow-lift sm:flex-row sm:items-center sm:p-6"
      >
        {result.issueCount > 0 ? (
          <CircleAlert className="size-8 shrink-0" aria-hidden />
        ) : (
          <CircleCheck className="size-8 shrink-0" aria-hidden />
        )}
        <div>
          <h3 id="audit-summary" className="text-xl font-extrabold sm:text-2xl">
            {result.summary}
          </h3>
          <p className="mt-1 text-sm text-white/80">Checked on this device. Nothing was uploaded.</p>
        </div>
      </div>

      {result.alerts.map((a) => (
        <AlertCard key={a.id} alert={a} />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>What each item is for</CardTitle>
          <CardDescription>Plain-language purpose for every line, from our offline medicine list.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 sm:hidden">
            {result.items.map((i, n) => (
              <li key={n} className="rounded-xl border border-line p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-ink">{i.name}</span>
                  <span className="tabular-nums text-ink">{formatINR(i.amount)}</span>
                </div>
                {i.activeIngredient && (
                  <p className="text-sm text-muted">
                    <span className="capitalize">{i.activeIngredient}</span> · {i.drugClass}
                  </p>
                )}
                <p className="mt-1 text-[15px] text-ink">{i.purpose}</p>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Item</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Active ingredient</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">What it is for</th>
                  <th scope="col" className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((i, n) => (
                  <tr key={n} className="border-b border-line/70 align-top last:border-0">
                    <td className="py-3 pr-3 font-semibold text-ink">
                      {i.name}
                      <span className="block text-xs font-normal text-muted tabular-nums">
                        {i.quantity} × {formatINR(i.unitPrice)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-ink">
                      {i.activeIngredient ? <span className="capitalize">{i.activeIngredient}</span> : <span className="text-muted">n/a</span>}
                      {i.drugClass && <span className="block text-xs text-muted">{i.drugClass}</span>}
                    </td>
                    <td className="py-3 pr-3 text-ink">{i.purpose}</td>
                    <td className="py-3 text-right tabular-nums text-ink">{formatINR(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function AlertCard({ alert }: { alert: AuditAlert }) {
  const red = alert.severity === "red";
  const [copied, setCopied] = useState(false);
  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-surface p-5 shadow-soft sm:p-6",
        red ? "border-danger-line" : "border-warn-line",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={red ? "danger" : "warn"} className="py-1 text-sm">
          {red ? <OctagonAlert aria-hidden /> : <TriangleAlert aria-hidden className="text-warn-icon" />}
          {red ? "Alert" : "Check"}
        </Badge>
        <h4 className="text-lg font-bold text-ink">{alert.title}</h4>
      </div>
      <p className="mt-3 text-[16px] leading-relaxed text-ink">{alert.detail}</p>

      {alert.dose && alert.dose.limitMg && (
        <DoseBar combined={alert.dose.combinedDailyMg} limit={alert.dose.limitMg} />
      )}

      {alert.price && (
        <div className="mt-4 space-y-3">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-warn-soft p-3">
              <dt className="text-xs font-semibold text-warn">Billed</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink">{formatINR(alert.price.billedTotal)}</dd>
            </div>
            <div className="rounded-xl bg-page p-3">
              <dt className="text-xs font-semibold text-muted">Reference</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink">{formatINR(alert.price.referenceTotal)}</dd>
            </div>
            <div className="rounded-xl bg-page p-3">
              <dt className="text-xs font-semibold text-muted">Difference</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink">{formatINR(alert.price.difference)}</dd>
            </div>
          </dl>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              Reference basis: <strong className="text-ink">{alert.price.basis}</strong>, {formatINR(alert.price.referenceUnit)} per{" "}
              {alert.price.unit} · as of {alert.price.asOf} · source: {alert.price.source}
            </span>
            {!alert.price.verified && <Badge variant="outline">Placeholder figure, not verified</Badge>}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-primary-soft p-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="flex gap-2 text-[15px] text-primary-ink">
          <MessageCircleQuestion className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">A polite question to ask:</span> &ldquo;{alert.question}&rdquo;
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            navigator.clipboard?.writeText(alert.question).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => undefined,
            );
          }}
        >
          <Copy aria-hidden /> {copied ? "Copied" : "Copy question"}
        </Button>
      </div>
    </article>
  );
}

function DoseBar({ combined, limit }: { combined: number; limit: number }) {
  const max = Math.max(combined, limit) * 1.1;
  const limitPct = (limit / max) * 100;
  return (
    <div className="mt-4" aria-hidden="true">
      <div className="relative mb-1 h-5 text-xs font-semibold tabular-nums text-ink">
        <span className="absolute -translate-x-full whitespace-nowrap pr-1" style={{ left: `${limitPct}%` }}>
          {limit / 1000} g adult limit
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-page">
        <div className="h-full rounded-full bg-danger" style={{ width: `${(combined / max) * 100}%` }} />
        <div className="absolute -top-2 h-8 w-0.5 bg-ink" style={{ left: `${limitPct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs font-semibold tabular-nums text-danger">{(combined / 1000).toFixed(1)} g combined per day</p>
    </div>
  );
}
