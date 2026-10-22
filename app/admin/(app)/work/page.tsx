import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { listAllProjects, ensureWorkSeeded } from "@/lib/work";
import WorkList, { type Item } from "./WorkList";

export const metadata = { title: "Work" };

export default async function Work({ searchParams }: { searchParams: Promise<{ done?: string; name?: string }> }) {
  await requireAdmin("work");
  const connected = dbConfigured();
  if (connected) await ensureWorkSeeded().catch((e) => console.error("work seeding failed", e));
  const all = await listAllProjects().catch(() => []);
  const { done, name } = await searchParams;
  const items: Item[] = all.map((p) => ({ slug: p.slug, title: p.title, type: p.type, img: p.img, visible: p.visible, photos: p.photos.length }));
  return <WorkList initial={items} connected={connected} flash={done === "deleted" ? `Deleted${name ? ` ${name}` : ""}.` : undefined} />;
}
