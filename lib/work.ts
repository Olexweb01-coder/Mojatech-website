import { sql, dbConfigured, kvGet, kvSet, toSlug, RESERVED } from "@/lib/store";
import { work as samples } from "@/lib/data/company";

/* The work gallery: projects with photos, shown on the home page and /work.
 * Until the admin's Work page is opened once (which imports them), the website
 * shows the projects written into the code. */

export type Project = {
  slug: string; title: string; type: string; location: string; story: string; alt: string;
  photos: string[]; img: string; visible: boolean;
};

type Row = { slug: string; title: string; type: string; location: string; story: string; alt: string; photos: string[]; visible: boolean };

const SEEDED = "work_seeded";

/** A project gets its own page when there is more to see than the card shows. */
export const hasPage = (p: Project) => Boolean(p.story) || p.photos.length > 1;

const fromSample = (w: (typeof samples)[number]): Project => ({
  slug: toSlug(w.title), title: w.title, type: w.type, location: "", story: "", alt: w.alt, photos: [w.img], img: w.img, visible: true,
});

const toProject = (r: Row): Project => ({
  ...r, photos: r.photos || [], img: r.photos?.[0] || "/stock/solar-roof.webp",
  alt: r.alt || `${r.title}: ${r.type}`.trim(),
});

async function rows(): Promise<Project[]> {
  return (await sql<Row>("SELECT * FROM projects ORDER BY position, created_at DESC")).map(toProject);
}

/** For the website: visible projects in the admin's order. */
export async function listProjects(): Promise<Project[]> {
  if (!dbConfigured()) return samples.map(fromSample);
  try {
    const all = await rows();
    if (!all.length && !(await kvGet<boolean>(SEEDED))) return samples.map(fromSample);
    return all.filter((p) => p.visible);
  } catch (e) {
    console.error("work: database unavailable, showing the built-in projects", e);
    return samples.map(fromSample);
  }
}

export async function getProject(slug: string) {
  return (await listProjects()).find((p) => p.slug === slug);
}

export async function listAllProjects(): Promise<Project[]> {
  if (!dbConfigured()) return samples.map(fromSample);
  return rows();
}

export async function getAnyProject(slug: string) {
  if (!dbConfigured()) return samples.map(fromSample).find((p) => p.slug === slug);
  const r = await sql<Row>("SELECT * FROM projects WHERE slug = $1", [slug]);
  return r[0] ? toProject(r[0]) : undefined;
}

export async function ensureWorkSeeded() {
  if (!dbConfigured() || (await kvGet<boolean>(SEEDED))) return;
  const n = await sql<{ n: string }>("SELECT count(*)::text AS n FROM projects");
  if (Number(n[0].n) === 0) {
    for (const [i, w] of samples.entries()) {
      await sql(
        `INSERT INTO projects (slug, title, type, alt, photos, position) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (slug) DO NOTHING`,
        [toSlug(w.title), w.title, w.type, w.alt, [w.img], i]);
    }
  }
  await kvSet(SEEDED, true);
}

export async function freeProjectSlug(base: string) {
  const root = toSlug(base);
  const taken = new Set((await sql<{ slug: string }>("SELECT slug FROM projects WHERE slug = $1 OR slug LIKE $2", [root, root + "-%"])).map((r) => r.slug));
  if (!taken.has(root) && !RESERVED.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}

export type ProjectInput = Omit<Project, "img">;

export async function createProject(p: ProjectInput) {
  await sql(
    `INSERT INTO projects (slug, title, type, location, story, alt, photos, visible, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE((SELECT min(position) FROM projects), 0) - 1)`,
    [p.slug, p.title, p.type, p.location, p.story, p.alt, p.photos, p.visible]);
  await kvSet(SEEDED, true);
}

/** Returns the photos the project no longer uses. */
export async function updateProject(p: ProjectInput) {
  const before = await getAnyProject(p.slug);
  await sql(
    `UPDATE projects SET title = $2, type = $3, location = $4, story = $5, alt = $6, photos = $7, visible = $8, updated_at = now() WHERE slug = $1`,
    [p.slug, p.title, p.type, p.location, p.story, p.alt, p.photos, p.visible]);
  return (before?.photos || []).filter((x) => !p.photos.includes(x));
}

export async function deleteProject(slug: string) {
  const r = await sql<{ photos: string[] }>("DELETE FROM projects WHERE slug = $1 RETURNING photos", [slug]);
  await kvSet(SEEDED, true);
  return r[0]?.photos || [];
}

export async function setProjectVisible(slug: string, visible: boolean) {
  await sql("UPDATE projects SET visible = $2, updated_at = now() WHERE slug = $1", [slug, visible]);
}

export async function reorderProjects(slugs: string[]) {
  await sql(
    `UPDATE projects p SET position = o.i FROM unnest($1::text[]) WITH ORDINALITY AS o(slug, i) WHERE p.slug = o.slug`, [slugs]);
}
