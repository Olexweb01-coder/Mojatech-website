import { requireAdmin, ROLES } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { listMembers, recentActivity } from "@/lib/team";
import { when } from "@/lib/time";
import { siteUrl } from "@/lib/seo";
import TeamManager from "./TeamManager";

export const metadata = { title: "Team" };

export default async function Team({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const me = await requireAdmin("team");
  const connected = dbConfigured();
  const [members, activity] = connected ? await Promise.all([listMembers(), recentActivity()]) : [[], []];
  const { done } = await searchParams;
  return (
    <TeamManager
      me={{ id: me.id, master: me.master }}
      connected={connected}
      loginUrl={`${siteUrl}/admin`}
      roles={Object.entries(ROLES).map(([k, v]) => ({ key: k as keyof typeof ROLES, label: v.label, hint: v.hint }))}
      members={members.map((m) => ({ ...m, seen: m.lastSeen ? when(m.lastSeen) : m.lastLogin ? when(m.lastLogin) : null }))}
      activity={activity.map((a) => ({ ...a, when: when(a.at) }))}
      flash={done === "me" ? "Your account is ready. From now on, sign in with your email." : undefined}
    />
  );
}
