import { fromMarkdown } from "mdast-util-from-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";
import type { Root } from "mdast";

/** Markdown (how Arik writes) as a tree of headings, paragraphs, lists and tables. */
export const parseMarkdown = (md: string): Root => fromMarkdown(md, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });

/** A sensible document title: the first heading, or the first line. */
export function titleOf(md: string, fallback = "MOJATECH document") {
  const h = /^#{1,3}\s+(.+)$/m.exec(md)?.[1];
  const t = (h || md.split("\n").find((l) => l.trim()) || fallback).replace(/[*_`#>]/g, "").trim();
  return t.slice(0, 80) || fallback;
}
