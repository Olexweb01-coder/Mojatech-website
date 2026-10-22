import Link from "next/link";
import { requireAdmin, can } from "@/lib/admin-auth";
import { unseenCount } from "@/lib/enquiries";
import { pendingReviewCount } from "@/lib/reviews";
import { configured } from "@/lib/arik/providers";
import { getArikSettings } from "@/lib/arik/store";
import { dbConfigured } from "@/lib/store";
import ArikChat from "@/components/admin/arik/ArikChat";
import RenameAssistant from "@/components/admin/arik/RenameAssistant";

/* The admin opens on Arik, the assistant. */
export async function generateMetadata() {
  const { name } = dbConfigured() ? await getArikSettings() : { name: "Arik" };
  return { title: name };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ denied?: string; welcome?: string }> }) {
  const me = await requireAdmin();
  const { denied, welcome } = await searchParams;
  const [unseen, waiting, settings] = await Promise.all([
    can(me, "enquiries") ? unseenCount().catch(() => 0) : 0,
    can(me, "reviews") ? pendingReviewCount().catch(() => 0) : 0,
    dbConfigured() ? getArikSettings() : { name: "Arik" },
  ]);

  /* Starting points, matched to what this person works on. */
  const suggestions = [
    unseen ? `Summarise my ${unseen} new enquiries and suggest replies` : can(me, "enquiries") ? "Which enquiries are still open, and what should I do next?" : "",
    "Size a solar and inverter system for a 3-bedroom flat in Lagos",
    "Remind me tomorrow at 9am to follow up on open quotes",
    "Write a friendly WhatsApp reply to a customer asking for a 5kVA quote",
    "Create a picture: a promo flyer for our solar installations, MOJATECH colours",
    waiting ? `I have ${waiting} reviews waiting. What should I check before publishing?` : "",
  ].filter(Boolean).slice(0, 6);

  return (
    <>
      {denied && <p className="mja-warn">Your role does not include that section. Ask an owner if you need it.</p>}
      {welcome && <p className="mja-good mjr-banner">Your password is set. Welcome to MOJATECH Admin.</p>}
      {me.master && <p className="mja-warn"><Link href="/admin/team"><b>Create your own account</b></Link> so you can sign in with your email, keep your own chats, and add your team.</p>}
      {!dbConfigured()
        ? <p className="mja-warn">{settings.name} needs the database. Add <b>DATABASE_URL</b> to <b>.env.local</b>, then restart.</p>
        : <ArikChat name={settings.name} firstName={me.master ? "" : me.name.split(" ")[0]} suggestions={suggestions}
            ready={configured().length > 0} canRename={can(me, "team")} />}
      {can(me, "team") && dbConfigured() && <RenameAssistant name={settings.name} />}
    </>
  );
}
