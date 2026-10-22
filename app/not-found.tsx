import Link from "next/link";

/* Last-resort "not found", outside both the website and the admin. It brings no
 * stylesheet of its own, so neither side's styles leak into the other. */
export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#05081f", color: "#eef0fa", textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", margin: "0 0 10px" }}>That page is not here.</h1>
        <p style={{ margin: "0 0 22px", color: "#a3a9c6" }}>It may have moved.</p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 22px", borderRadius: 999, background: "#e0262b", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Go to the website</Link>
      </div>
    </main>
  );
}
