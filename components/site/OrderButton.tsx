"use client";
import { sendEnquiry } from "@/lib/client/enquiry";

/* "Order on WhatsApp", which also tells the admin someone is ordering. */
export default function OrderButton({ href, product, price }: { href: string; product: string; price: string }) {
  return (
    <a className="btn btn-red" href={href} target="_blank" rel="noopener noreferrer"
      onClick={() => sendEnquiry({ kind: "order", fields: [["Product", product], ["Price", price]], openedAt: 0 })}>
      Order on WhatsApp
    </a>
  );
}
