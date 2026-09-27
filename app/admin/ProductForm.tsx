"use client";
import { useActionState } from "react";
import { upsertProduct } from "./actions";

const CATEGORIES = ["Solar", "Inverters", "Batteries", "Security", "Power quality", "Lighting"];
const IMAGES = [
  ["/stock/solar-roof.webp", "Solar panels"], ["/stock/board.webp", "Distribution board"],
  ["/stock/cctv.webp", "CCTV camera"], ["/stock/automation.webp", "Wiring and controls"],
  ["/stock/maintenance.webp", "Switchgear"], ["/stock/lagos-night.webp", "Lights at night"],
  ["/work/ibeshe-road-solar.jpg", "Our solar job"], ["/work/ikorodu-inverter.jpg", "Our inverter job"],
];

export default function ProductForm() {
  const [state, action, pending] = useActionState(upsertProduct, null as null | { error?: string; ok?: string });
  return (
    <form action={action} className="adm-form">
      <div className="field"><label htmlFor="name">Product name</label>
        <input id="name" name="name" required placeholder="e.g. 3.5kVA hybrid inverter" /></div>

      <div className="two">
        <div className="field"><label htmlFor="category">Category</label>
          <select id="category" name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label htmlFor="price">Price (₦)</label>
          <input id="price" name="price" inputMode="numeric" required placeholder="850000" /></div>
      </div>

      <div className="two">
        <div className="field"><label htmlFor="was">Old price, to show struck through (optional)</label>
          <input id="was" name="was" inputMode="numeric" placeholder="990000" /></div>
        <div className="field"><label htmlFor="image">Photo</label>
          <select id="image" name="image">{IMAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>

      <div className="field"><label htmlFor="short">One line for listings</label>
        <input id="short" name="short" placeholder="Runs a full home and charges from solar or the grid." /></div>

      <div className="field"><label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4}
          placeholder="A paragraph for the product page. Say what it suits, what it powers, and what MOJATECH does with it." /></div>

      <div className="field"><label htmlFor="bonus">Bonus line (optional)</label>
        <input id="bonus" name="bonus" placeholder="Installation included within Lagos and Ogun" /></div>

      <div className="field"><label htmlFor="includes">What the price covers, one per line</label>
        <textarea id="includes" name="includes" rows={3} placeholder={"3.5kVA inverter\nInstallation and wiring\nTesting and hand-over"} /></div>

      <div className="field"><label htmlFor="specs">Details, one per line as “Name: value”</label>
        <textarea id="specs" name="specs" rows={3} placeholder={"Capacity: 3.5kVA / 24V\nCharging: Solar and grid\nWarranty: Manufacturer's warranty applies"} /></div>

      <div className="checks">
        <label><input type="checkbox" name="freeDelivery" /> Free delivery</label>
        <label><input type="checkbox" name="inStock" defaultChecked /> In stock</label>
      </div>

      {state?.error && <p className="adm-bad">{state.error}</p>}
      {state?.ok && <p className="adm-good">{state.ok}</p>}
      <button className="btn btn-red" type="submit" disabled={pending}>{pending ? "Saving…" : "Publish product"}</button>
      <p className="adm-note">Publishing puts it on the website straight away and tells Bing about it.</p>
    </form>
  );
}
