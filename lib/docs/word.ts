import { readFileSync } from "fs";
import path from "path";
import {
  AlignmentType, BorderStyle, Document, Footer, Header, ImageRun, Packer, PageNumber, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, WidthType, ExternalHyperlink, LevelFormat,
} from "docx";
import type { RootContent, PhrasingContent, Table as MdTable } from "mdast";
import { company } from "@/lib/data/company";
import { parseMarkdown } from "./md";
import { totals, naira, longDate, addDays, DOC_LABEL, type Quote } from "./quote";
import { inWords } from "./words";
import type { DocSettings } from "./settings";

/* The same documents as Word files, so they can be edited before sending. */

const NAVY = "0B1238", RED = "E0262B", GREY = "5B6280", TINT = "F2F4FA", LINE = "D9DCEA";
const FONT = "Calibri";
const LOGO = path.join(process.cwd(), "public", "brand", "mojatech-mark.png");

const run = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
  new TextRun({ text, font: FONT, bold: o.bold, italics: o.italics, size: (o.size || 10) * 2, color: o.color || "1B2142" });

function header() {
  let logo: Buffer | null = null;
  try { logo = readFileSync(LOGO); } catch { /* no logo */ }
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 18, color: NAVY }, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: logo ? [new ImageRun({ type: "png", data: logo, transformation: { width: 84, height: 44 } })] : [] })] }),
          new TableCell({ width: { size: 82, type: WidthType.PERCENTAGE }, children: [
            new Paragraph({ children: [run(company.name, { bold: true, size: 14, color: NAVY })] }),
            new Paragraph({ children: [run(`${company.address.street}, ${company.address.region}  ·  ${company.contact.phoneDisplay}, ${company.contact.phoneAltDisplay}`, { size: 8, color: GREY })] }),
            new Paragraph({ spacing: { after: 120 }, children: [run(`${company.contact.email}  ·  ${company.url.replace("https://", "")}  ·  CAC ${company.registration.number}`, { size: 8, color: GREY })] }),
          ] }),
        ] })],
      }),
    ],
  });
}

const footer = (label: string) => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [run(`${company.short} · ${label} · Page `, { size: 8, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GREY }),
      run(" of ", { size: 8, color: GREY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GREY })],
  })],
});

const pack = (children: (Paragraph | Table)[], label: string) => Packer.toBuffer(new Document({
  creator: company.name, title: label,
  numbering: { config: [{ reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }] }] },
  sections: [{ properties: { page: { margin: { top: 1300, bottom: 1100, left: 1000, right: 1000 } } }, headers: { default: header() }, footers: { default: footer(label) }, children }],
}));

const cell = (text: string, o: { bold?: boolean; fill?: string; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; width?: number } = {}) => new TableCell({
  width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
  shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({ alignment: o.align, children: [run(text, { bold: o.bold, color: o.color, size: 9.5 })] })],
});

const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const tableBorders = { top: thin, bottom: thin, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: thin, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } };

/* ---------------- Quotations, invoices, receipts ---------------- */

export async function quoteDocx(q: Quote, s: DocSettings): Promise<Buffer> {
  const label = DOC_LABEL[q.type];
  const num = q.rev > 1 ? `${q.number} (rev. ${q.rev})` : q.number;
  const t = totals(q);
  const out: (Paragraph | Table)[] = [];

  out.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(label.toUpperCase(), { bold: true, size: 20, color: NAVY })] }));
  out.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(`Number: `, { color: GREY, size: 9 }), run(num, { bold: true, size: 9 })] }));
  out.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(`Date: `, { color: GREY, size: 9 }), run(longDate(q.date), { bold: true, size: 9 })] }));
  if (q.type === "quotation" && q.validityDays) out.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(`Valid until: `, { color: GREY, size: 9 }), run(longDate(addDays(q.date, q.validityDays)), { bold: true, size: 9 })] }));

  out.push(new Paragraph({ spacing: { before: 200 }, children: [run(q.type === "receipt" ? "RECEIVED FROM" : "PREPARED FOR", { bold: true, size: 8, color: RED })] }));
  out.push(new Paragraph({ children: [run(q.client.name, { bold: true, size: 11.5 })] }));
  for (const l of [q.client.address, q.client.phone, q.client.email].filter(Boolean)) out.push(new Paragraph({ children: [run(l!, { size: 9, color: GREY })] }));
  if (q.title) out.push(new Paragraph({ spacing: { before: 240, after: 120 }, children: [run(q.title, { bold: true, size: 11, color: NAVY })] }));

  const head = ["#", "Description", "Qty", "Unit price", "Amount"];
  const widths = [6, 48, 10, 17, 19];
  const right = AlignmentType.RIGHT;
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders,
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h.toUpperCase(), { bold: true, fill: NAVY, color: "FFFFFF", width: widths[i], align: i >= 2 ? right : undefined })) }),
      ...t.lines.map((l, n) => new TableRow({ children: [
        cell(String(n + 1), { color: GREY, fill: n % 2 ? TINT : undefined }),
        cell(l.description, { fill: n % 2 ? TINT : undefined }),
        cell(`${l.qty.toLocaleString("en-NG")}${l.unit ? ` ${l.unit}` : ""}`, { align: right, fill: n % 2 ? TINT : undefined }),
        cell(naira(l.unitPrice), { align: right, fill: n % 2 ? TINT : undefined }),
        cell(naira(l.total), { align: right, bold: true, fill: n % 2 ? TINT : undefined }),
      ] })),
    ],
  }));

  const rows: [string, string, boolean?][] = [["Subtotal", naira(t.subtotal)]];
  if (t.discount) rows.push([q.discount?.type === "percent" ? `Discount (${q.discount.value}%)` : "Discount", `−${naira(t.discount)}`]);
  if (q.vat) rows.push([`VAT (${q.vatRate}%)`, naira(t.vat)]);
  rows.push(["Total", naira(t.total), true]);
  if (q.amountPaid) { rows.push(["Amount paid", naira(q.amountPaid)]); rows.push(["Balance due", naira(t.balance), true]); }
  out.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
  out.push(new Table({
    width: { size: 50, type: WidthType.PERCENTAGE }, alignment: AlignmentType.RIGHT, borders: tableBorders,
    rows: rows.map(([k, v, strong]) => new TableRow({ children: [
      cell(k, { bold: strong, fill: strong ? NAVY : undefined, color: strong ? "FFFFFF" : GREY, width: 50 }),
      cell(v, { bold: true, fill: strong ? NAVY : undefined, color: strong ? "FFFFFF" : undefined, align: right, width: 50 }),
    ] })),
  }));
  out.push(new Paragraph({ spacing: { before: 120, after: 240 }, children: [run(`Amount in words: ${inWords(q.amountPaid && q.type === "receipt" ? q.amountPaid : t.total)}.`, { italics: true, size: 8.5, color: GREY })] }));

  const section = (title: string, body: string) => {
    if (!body.trim()) return;
    if (title) out.push(new Paragraph({ spacing: { before: 160 }, children: [run(title.toUpperCase(), { bold: true, size: 8, color: RED })] }));
    for (const line of body.split("\n")) out.push(new Paragraph({ children: [run(line, { size: 9 })] }));
  };
  section("Notes", q.notes || "");
  if (q.type !== "receipt" && (s.bankName || s.accountNumber)) section("Payment details", `Bank: ${s.bankName}\nAccount name: ${s.accountName}\nAccount number: ${s.accountNumber}`);
  if (q.type !== "receipt") section("Terms", s.terms);
  if (q.type === "receipt") section("", "Thank you for your payment.");

  out.push(new Paragraph({ spacing: { before: 600 }, children: [run("______________________________", { color: GREY })] }));
  if (s.signName) out.push(new Paragraph({ children: [run(s.signName, { bold: true, size: 9 })] }));
  out.push(new Paragraph({ children: [run(s.signTitle, { size: 8.5, color: GREY })] }));

  return pack(out, `${label} ${num}`);
}

/* ---------------- Any reply as a document ---------------- */

function runs(nodes: PhrasingContent[], st: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = [];
  for (const n of nodes) {
    if (n.type === "text") out.push(run(n.value, st));
    else if (n.type === "strong") out.push(...runs(n.children, { ...st, bold: true }));
    else if (n.type === "emphasis") out.push(...runs(n.children, { ...st, italics: true }));
    else if (n.type === "delete") out.push(...runs(n.children, st));
    else if (n.type === "inlineCode") out.push(new TextRun({ text: n.value, font: "Consolas", size: (st.size || 10) * 2 }));
    else if (n.type === "link") out.push(new ExternalHyperlink({ link: n.url, children: runs(n.children, { ...st, color: "2A3291" }) as TextRun[] }));
    else if (n.type === "break") out.push(new TextRun({ break: 1 }));
  }
  return out;
}

const plain = (nodes: PhrasingContent[]): string => nodes.map((n) => ("value" in n ? n.value : "children" in n ? plain(n.children as PhrasingContent[]) : "")).join("");

function mdTable(t: MdTable) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders,
    rows: t.children.map((r, i) => new TableRow({ tableHeader: i === 0, children: r.children.map((c) => cell(plain(c.children), i === 0 ? { bold: true, fill: NAVY, color: "FFFFFF" } : { fill: i % 2 === 0 ? TINT : undefined })) })),
  });
}

function blocks(nodes: RootContent[], out: (Paragraph | Table)[], level = 0) {
  for (const n of nodes) {
    switch (n.type) {
      case "heading": out.push(new Paragraph({ spacing: { before: 240, after: 100 }, children: runs(n.children, { bold: true, size: n.depth === 1 ? 17 : n.depth === 2 ? 13.5 : 11.5, color: "0B1238" }) })); break;
      case "paragraph": out.push(new Paragraph({ spacing: { after: 120 }, children: runs(n.children) })); break;
      case "list":
        for (const item of n.children) {
          item.children.forEach((c, i) => {
            if (c.type === "paragraph") out.push(new Paragraph({ ...(n.ordered && i === 0 ? { numbering: { reference: "num", level: 0 } } : i === 0 ? { bullet: { level: Math.min(level, 8) } } : { indent: { left: 720 } }), spacing: { after: 60 }, children: runs(c.children) }));
            else blocks([c], out, level + 1);
          });
        }
        break;
      case "table": out.push(mdTable(n)); out.push(new Paragraph({ children: [] })); break;
      case "blockquote": blocks(n.children, out, level); break;
      case "code": for (const l of n.value.split("\n")) out.push(new Paragraph({ children: [new TextRun({ text: l, font: "Consolas", size: 18 })] })); break;
      case "thematicBreak": out.push(new Paragraph({ border: { bottom: thin }, children: [] })); break;
      default: if ("children" in n) blocks(n.children as RootContent[], out, level);
    }
  }
}

export async function markdownDocx(title: string, markdown: string): Promise<Buffer> {
  const out: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 200 }, children: [run(new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date()), { size: 9, color: GREY })] }),
  ];
  blocks(parseMarkdown(markdown).children, out);
  return pack(out, title);
}
