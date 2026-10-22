import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { getAnyProject } from "@/lib/work";
import { stockPhotos } from "@/lib/data/stock";
import WorkEditor from "../WorkEditor";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getAnyProject((await params).slug).catch(() => undefined);
  return { title: p?.title || "Project" };
}

export default async function EditProject({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ done?: string }> }) {
  await requireAdmin("work");
  const [{ slug }, { done }] = await Promise.all([params, searchParams]);
  const p = await getAnyProject(slug);
  if (!p) notFound();
  return (
    <WorkEditor key={p.slug} stock={stockPhotos} connected={dbConfigured()}
      flash={done === "created" ? "Added. It is on the website now." : undefined}
      project={{ slug: p.slug, title: p.title, type: p.type, location: p.location, story: p.story, alt: p.alt === `${p.title}: ${p.type}`.trim() ? "" : p.alt, photos: p.photos, visible: p.visible }} />
  );
}
