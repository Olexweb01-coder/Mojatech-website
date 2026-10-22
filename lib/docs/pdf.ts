import path from "path";
import PDFDocument from "pdfkit";
import type { Root, RootContent, PhrasingContent, Table } from "mdast";
import { company } from "@/lib/data/company";
import { parseMarkdown } from "./md";
import { totals, naira, longDate, addDays, DOC_LABEL, type Quote } from "./quote";
import { inWords } from "./words";
import type { DocSettings } from "./settings";

/* MOJATECH documents as PDF: A4, letterhead with the logo, brand colours,
 * page numbers. Noto Sans is embedded so the naira sign (₦) always prints. */

const NAVY = "#0b1238", BLUE = "#2a3291", RED = "#e0262b", INK = "#1b2142", GREY = "#5b6280", LINE = "#d9dcea", TINT = "#f2f4fa";
const FONTS = path.join(process.cwd(), "lib", "docs", "fonts");
const LOGO = path.join(process.cwd(), "public", "brand", "mojatech-mark.png");
const M = 50;                    /* page margin, points */

function newDoc(title: string) {
  const doc = new PDFDocument({
    size: "A4", margins: { top: M, bottom: M + 20, left: M, right: M }, bufferPages: true,
    font: path.join(FONTS, "NotoSans-Regular.ttf"),
    info: { Title: title, Author: company.name, Creator: "MOJATECH Admin" },
  });
  doc.registerFont("R", path.join(FONTS, "NotoSans-Regular.ttf"));
  doc.registerFont("B", path.join(FONTS, "NotoSans-Bold.ttf"));
  doc.registerFont("I", path.join(FONTS, "NotoSans-Italic.ttf"));
  doc.registerFont("BI", path.join(FONTS, "NotoSans-BoldItalic.ttf"));
  return doc;
}

const W = (doc: PDFKit.PDFDocument) => doc.page.width - M * 2;

function letterhead(doc: PDFKit.PDFDocument) {
  const top = M - 10;
  try { doc.image(LOGO, M, top, { width: 78 }); } catch { /* logo missing: text only */ }
  const x = M + 92;
  doc.font("B").fontSize(15).fillColor(NAVY).text(company.name, x, top + 2, { width: W(doc) - 92 });
  doc.font("R").fontSize(8.5).fillColor(GREY)
    .text(`${company.address.street}, ${company.address.region}  ·  ${company.contact.phoneDisplay}, ${company.contact.phoneAltDisplay}`, x, doc.y + 1, { width: W(doc) - 92 })
    .text(`${company.contact.email}  ·  ${company.url.replace("https://", "")}  ·  CAC ${company.registration.number}`, { width: W(doc) - 92 });
  const y = Math.max(doc.y, top + 44) + 10;
  doc.rect(M, y, W(doc), 2.2).fill(NAVY);
  doc.rect(M, y + 2.2, 70, 2.2).fill(RED);
  doc.fillColor(INK);
  doc.y = y + 22;
  doc.x = M;
}

function footers(doc: PDFKit.PDFDocument, label: string) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - M + 4;
    doc.save();
    doc.page.margins.bottom = 0;
    doc.moveTo(M, y - 6).lineTo(doc.page.width - M, y - 6).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font("R").fontSize(7.5).fillColor(GREY)
      .text(`${company.short} · ${company.tagline} · ${label}`, M, y, { width: W(doc) / 1.4, lineBreak: false })
      .text(`Page ${i - range.start + 1} of ${range.count}`, M, y, { width: W(doc), align: "right", lineBreak: false });
    doc.page.margins.bottom = M + 20;
    doc.restore();
  }
}

const toBuffer = (doc: PDFKit.PDFDocument) => new Promise<Buffer>((resolve, reject) => {
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
  doc.end();
});

/* ---------------- Quotations, invoices, receipts ---------------- */

export async function quotePdf(q: Quote, s: DocSettings): Promise<Buffer> {
  const label = DOC_LABEL[q.type];
  const num = q.rev > 1 ? `${q.number} (rev. ${q.rev})` : q.number;
  const doc = newDoc(`${label} ${num}, ${q.client.name}`);
  const t = totals(q);
  letterhead(doc);

  /* Title, number and dates on the right; who it is for on the left. */
  const top = doc.y;
  const right = M + W(doc) * 0.55, rw = W(doc) * 0.45;
  doc.font("B").fontSize(20).fillColor(NAVY).text(label.toUpperCase(), right, top, { width: rw, align: "right" });
  const meta: [string, string][] = [["Number", num], ["Date", longDate(q.date)]];
  if (q.type === "quotation" && q.validityDays) meta.push(["Valid until", longDate(addDays(q.date, q.validityDays))]);
  doc.moveDown(0.2);
  for (const [k, v] of meta) {
    const y = doc.y;
    doc.font("R").fontSize(9).fillColor(GREY).text(k, right, y, { width: rw * 0.42, align: "right" });
    doc.font("B").fontSize(9).fillColor(INK).text(v, right + rw * 0.45, y, { width: rw * 0.55, align: "right" });
  }
  const afterMeta = doc.y;

  doc.font("B").fontSize(8).fillColor(RED).text(q.type === "receipt" ? "RECEIVED FROM" : "PREPARED FOR", M, top + 4, { characterSpacing: 0.8 });
  doc.font("B").fontSize(11.5).fillColor(INK).text(q.client.name, M, doc.y + 2, { width: W(doc) * 0.5 });
  doc.font("R").fontSize(9).fillColor(GREY);
  for (const line of [q.client.address, q.client.phone, q.client.email].filter(Boolean)) doc.text(line!, { width: W(doc) * 0.5 });
  doc.y = Math.max(doc.y, afterMeta) + 16;

  if (q.title) {
    doc.font("B").fontSize(11).fillColor(NAVY).text(q.title, M, doc.y, { width: W(doc) });
    doc.moveDown(0.6);
  }

  /* The table of items. */
  const cols = [
    { h: "#", w: 0.06, a: "left" as const },
    { h: "Description", w: 0.48, a: "left" as const },
    { h: "Qty", w: 0.1, a: "right" as const },
    { h: "Unit price", w: 0.17, a: "right" as const },
    { h: "Amount", w: 0.19, a: "right" as const },
  ];
  const xs = cols.reduce<number[]>((acc, c, i) => [...acc, i ? acc[i - 1] + cols[i - 1].w * W(doc) : M], []);
  const pad = 6;
  const header = () => {
    const y = doc.y;
    doc.rect(M, y, W(doc), 22).fill(NAVY);
    doc.font("B").fontSize(8.5).fillColor("#ffffff");
    cols.forEach((c, i) => doc.text(c.h.toUpperCase(), xs[i] + pad, y + 7, { width: c.w * W(doc) - pad * 2, align: c.a, characterSpacing: 0.4 }));
    doc.y = y + 22;
  };
  header();
  t.lines.forEach((l, n) => {
    const cells = [String(n + 1), l.description, `${l.qty.toLocaleString("en-NG")}${l.unit ? ` ${l.unit}` : ""}`, naira(l.unitPrice), naira(l.total)];
    doc.font("R").fontSize(9.5);
    const h = Math.max(...cells.map((c, i) => doc.heightOfString(c, { width: cols[i].w * W(doc) - pad * 2 }))) + pad * 2;
    if (doc.y + h > doc.page.height - M - 30) { doc.addPage(); doc.y = M; header(); }
    const y = doc.y;
    if (n % 2) doc.rect(M, y, W(doc), h).fill(TINT);
    cells.forEach((c, i) => doc.font(i === 4 ? "B" : "R").fontSize(9.5).fillColor(i === 0 ? GREY : INK).text(c, xs[i] + pad, y + pad, { width: cols[i].w * W(doc) - pad * 2, align: cols[i].a }));
    doc.moveTo(M, y + h).lineTo(M + W(doc), y + h).lineWidth(0.4).strokeColor(LINE).stroke();
    doc.y = y + h;
  });

  /* Totals. */
  const rows: [string, string, boolean?][] = [["Subtotal", naira(t.subtotal)]];
  if (t.discount) rows.push([q.discount?.type === "percent" ? `Discount (${q.discount.value}%)` : "Discount", `−${naira(t.discount)}`]);
  if (q.vat) rows.push([`VAT (${q.vatRate}%)`, naira(t.vat)]);
  rows.push(["Total", naira(t.total), true]);
  if (q.amountPaid) { rows.push(["Amount paid", naira(q.amountPaid)]); rows.push(["Balance due", naira(t.balance), true]); }
  if (doc.y + rows.length * 22 + 60 > doc.page.height - M - 30) { doc.addPage(); doc.y = M; }
  doc.y += 10;
  const tx = M + W(doc) * 0.5, tw = W(doc) * 0.5;
  for (const [k, v, strong] of rows) {
    const y = doc.y;
    if (strong) doc.rect(tx, y, tw, 24).fill(NAVY);
    doc.font(strong ? "B" : "R").fontSize(strong ? 11 : 9.5).fillColor(strong ? "#ffffff" : GREY).text(k, tx + 10, y + (strong ? 6 : 4), { width: tw * 0.5 });
    doc.font("B").fontSize(strong ? 11 : 9.5).fillColor(strong ? "#ffffff" : INK).text(v, tx + tw * 0.4, y + (strong ? 6 : 4), { width: tw * 0.6 - 10, align: "right" });
    doc.y = y + (strong ? 26 : 20);
  }
  doc.font("I").fontSize(8.5).fillColor(GREY).text(`Amount in words: ${inWords(q.amountPaid && q.type === "receipt" ? q.amountPaid : t.total)}.`, M, doc.y + 6, { width: W(doc) });
  doc.moveDown(1);

  /* Notes, payment details, terms, signature. */
  const section = (title: string, body: string) => {
    if (!body.trim()) return;
    if (doc.y > doc.page.height - M - 90) { doc.addPage(); doc.y = M; }
    doc.font("B").fontSize(8).fillColor(RED).text(title.toUpperCase(), M, doc.y, { characterSpacing: 0.8 });
    doc.font("R").fontSize(9).fillColor(INK).text(body, M, doc.y + 3, { width: W(doc) });
    doc.moveDown(0.9);
  };
  section("Notes", q.notes || "");
  if (q.type !== "receipt" && (s.bankName || s.accountNumber)) section("Payment details", [`Bank: ${s.bankName}`, `Account name: ${s.accountName}`, `Account number: ${s.accountNumber}`].join("\n"));
  if (q.type !== "receipt") section("Terms", s.terms);
  if (q.type === "receipt") section("", "Thank you for your payment.");

  if (doc.y > doc.page.height - M - 80) { doc.addPage(); doc.y = M; }
  doc.y += 18;
  doc.moveTo(M, doc.y + 24).lineTo(M + 180, doc.y + 24).lineWidth(0.6).strokeColor(GREY).stroke();
  doc.font("B").fontSize(9).fillColor(INK).text(s.signName || " ", M, doc.y + 28);
  doc.font("R").fontSize(8.5).fillColor(GREY).text(s.signTitle, M, doc.y + 1);

  footers(doc, `${label} ${num}`);
  return toBuffer(doc);
}

/* ---------------- Any reply as a document ---------------- */

function inline(doc: PDFKit.PDFDocument, nodes: PhrasingContent[], size: number, base: { bold?: boolean; italic?: boolean } = {}) {
  const parts: { text: string; bold: boolean; italic: boolean; link?: string; code?: boolean }[] = [];
  const walk = (ns: PhrasingContent[], st: { bold: boolean; italic: boolean; link?: string }) => {
    for (const n of ns) {
      if (n.type === "text") parts.push({ text: n.value, ...st });
      else if (n.type === "strong") walk(n.children, { ...st, bold: true });
      else if (n.type === "emphasis") walk(n.children, { ...st, italic: true });
      else if (n.type === "delete") walk(n.children, st);
      else if (n.type === "inlineCode") parts.push({ text: n.value, ...st, code: true });
      else if (n.type === "link") walk(n.children, { ...st, link: n.url });
      else if (n.type === "break") parts.push({ text: "\n", ...st });
    }
  };
  walk(nodes, { bold: Boolean(base.bold), italic: Boolean(base.italic) });
  if (!parts.length) return;
  parts.forEach((p, i) => {
    const font = p.bold && p.italic ? "BI" : p.bold ? "B" : p.italic ? "I" : "R";
    doc.font(font).fontSize(size).fillColor(p.link ? BLUE : INK)
      .text(p.text, { continued: i < parts.length - 1, link: p.link, underline: Boolean(p.link), width: W(doc) - (doc.x - M) });
  });
}

const plain = (nodes: PhrasingContent[]): string => nodes.map((n) => ("value" in n ? n.value : "children" in n ? plain(n.children as PhrasingContent[]) : "")).join("");

function table(doc: PDFKit.PDFDocument, t: Table) {
  const rows = t.children.map((r) => r.children.map((c) => plain(c.children)));
  const n = Math.max(...rows.map((r) => r.length));
  const cw = W(doc) / n, pad = 5;
  rows.forEach((r, i) => {
    doc.font(i === 0 ? "B" : "R").fontSize(8.8);
    const h = Math.max(...r.map((c) => doc.heightOfString(c, { width: cw - pad * 2 }))) + pad * 2;
    if (doc.y + h > doc.page.height - M - 30) { doc.addPage(); doc.y = M; }
    const y = doc.y;
    if (i === 0) doc.rect(M, y, W(doc), h).fill(NAVY); else if (i % 2 === 0) doc.rect(M, y, W(doc), h).fill(TINT);
    r.forEach((c, j) => doc.font(i === 0 ? "B" : "R").fontSize(8.8).fillColor(i === 0 ? "#ffffff" : INK).text(c, M + j * cw + pad, y + pad, { width: cw - pad * 2 }));
    doc.moveTo(M, y + h).lineTo(M + W(doc), y + h).lineWidth(0.4).strokeColor(LINE).stroke();
    doc.y = y + h;
  });
  doc.x = M;
  doc.moveDown(0.8);
}

function blocks(doc: PDFKit.PDFDocument, nodes: RootContent[], depth = 0) {
  for (const n of nodes) {
    if (doc.y > doc.page.height - M - 50) { doc.addPage(); doc.y = M; }
    doc.x = M + depth * 14;
    switch (n.type) {
      case "heading":
        doc.moveDown(n.depth <= 2 ? 0.6 : 0.3);
        inline(doc, n.children, n.depth === 1 ? 17 : n.depth === 2 ? 13.5 : 11.5, { bold: true });
        doc.fillColor(INK).moveDown(0.35);
        break;
      case "paragraph":
        inline(doc, n.children, 10);
        doc.moveDown(0.6);
        break;
      case "list":
        n.children.forEach((item, i) => {
          const bullet = n.ordered ? `${(n.start || 1) + i}.` : "•";
          const y = doc.y;
          doc.font(n.ordered ? "B" : "R").fontSize(10).fillColor(n.ordered ? NAVY : RED).text(bullet, M + depth * 14, y, { width: 16 });
          doc.y = y; doc.x = M + depth * 14 + 18;
          item.children.forEach((c) => {
            if (c.type === "paragraph") { inline(doc, c.children, 10); doc.moveDown(0.15); }
            else blocks(doc, [c], depth + 1);
          });
          doc.x = M + depth * 14;
        });
        doc.moveDown(0.4);
        break;
      case "table":
        table(doc, n);
        break;
      case "blockquote": {
        const y = doc.y;
        doc.x = M + 14;
        blocks(doc, n.children, depth + 1);
        doc.rect(M + depth * 14, y, 3, doc.y - y - 6).fill(LINE);
        break;
      }
      case "code": {
        doc.font("R").fontSize(8.5);
        const h = doc.heightOfString(n.value, { width: W(doc) - 20 }) + 16;
        const y = doc.y;
        doc.rect(M, y, W(doc), h).fill(TINT);
        doc.fillColor(INK).text(n.value, M + 10, y + 8, { width: W(doc) - 20 });
        doc.y = y + h + 8;
        break;
      }
      case "thematicBreak":
        doc.moveTo(M, doc.y + 4).lineTo(M + W(doc), doc.y + 4).lineWidth(0.5).strokeColor(LINE).stroke();
        doc.moveDown(1);
        break;
      default:
        if ("children" in n) blocks(doc, n.children as RootContent[], depth);
    }
  }
}

export async function markdownPdf(title: string, markdown: string): Promise<Buffer> {
  const doc = newDoc(title);
  letterhead(doc);
  doc.font("R").fontSize(9).fillColor(GREY).text(new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date()), M, doc.y, { width: W(doc), align: "right" });
  doc.moveDown(0.6);
  const tree: Root = parseMarkdown(markdown);
  blocks(doc, tree.children);
  footers(doc, title);
  return toBuffer(doc);
}
