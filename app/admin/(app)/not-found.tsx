import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mja-empty">
      <h2 className="mja-h3">That isn&apos;t here</h2>
      <p className="mja-muted">It may have been deleted, or the link is out of date.</p>
      <Link href="/admin/products" className="mja-btn line">Back to products</Link>
    </div>
  );
}
