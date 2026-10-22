import { redirect } from "next/navigation";
import { getMe, ROLES, can } from "@/lib/admin-auth";
import { ALERTS, prefsOf, type AlertKind } from "@/lib/push";
import { ownerKey } from "@/lib/arik/store";
import { dbConfigured } from "@/lib/store";
import Alerts from "@/components/admin/Alerts";
import DocSettingsForm from "./DocSettingsForm";
import { getDocSettings } from "@/lib/docs/settings";
import AccountForms from "./AccountForms";

export const metadata = { title: "Your account" };

/* Open to everyone signed in, including someone who must change a temporary
 * password first (so it does not use requireAdmin, which would send them here). */
export default async function Account({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/admin/login");
  const { first } = await searchParams;
  const kinds = (Object.keys(ALERTS) as AlertKind[]).filter((k) => !ALERTS[k].perm || can(me, ALERTS[k].perm!)).map((k) => ({ key: k, label: ALERTS[k].label, hint: ALERTS[k].hint }));
  const prefs = dbConfigured() ? await prefsOf(ownerKey(me)) : {};
  return (
    <>
      <AccountForms me={{ name: me.name, email: me.email, role: ROLES[me.role].label, master: me.master, mustChange: me.mustChange }} first={Boolean(first) || me.mustChange} />
      {!me.mustChange && dbConfigured() && (
        <div className="mja-detail">
          <Alerts kinds={kinds} prefs={prefs} />
          {me.role === "owner" && <DocSettingsForm s={await getDocSettings()} />}
        </div>
      )}
    </>
  );
}
