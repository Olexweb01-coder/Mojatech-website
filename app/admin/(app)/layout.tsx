import { redirect } from "next/navigation";
import { after } from "next/server";
import { maybeTick } from "@/lib/schedule";
import { getMe, can, ROLES } from "@/lib/admin-auth";
import Shell from "@/components/admin/Shell";
import { unseenCount } from "@/lib/enquiries";
import { pendingReviewCount } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/* Everything behind sign-in shares this frame. The menu only lists the sections
 * this person's role can open. (Each page checks again on its own.) */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/admin/login");
  /* Reminders also go out whenever someone is using the admin, between scheduler runs. */
  after(() => maybeTick());
  const [unseen, waiting] = await Promise.all([
    can(me, "enquiries") ? unseenCount().catch(() => 0) : 0,
    can(me, "reviews") ? pendingReviewCount().catch(() => 0) : 0,
  ]);
  return (
    <Shell badges={{ "/admin/enquiries": unseen, "/admin/reviews": waiting }}
      perms={me.mustChange ? [] : ROLES[me.role].perms}
      me={{ name: me.master ? "Owner (master password)" : me.name, role: ROLES[me.role].label }}>
      {children}
    </Shell>
  );
}
