import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { stockPhotos } from "@/lib/data/stock";
import WorkEditor from "../WorkEditor";

export const metadata = { title: "New project" };

export default async function NewProject() {
  await requireAdmin("work");
  return <WorkEditor stock={stockPhotos} connected={dbConfigured()} />;
}
