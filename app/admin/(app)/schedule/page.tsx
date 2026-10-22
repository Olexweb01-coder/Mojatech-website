import { requireAdmin, can } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { ownerKey } from "@/lib/arik/store";
import { listItems, toLagosInput, ITEM_KINDS, REPEATS, REMIND } from "@/lib/schedule";
import { recipients, ALERTS, prefsOf, type AlertKind } from "@/lib/push";
import Alerts from "@/components/admin/Alerts";
import ScheduleBoard from "./ScheduleBoard";

export const metadata = { title: "Schedule" };

export default async function Schedule({ searchParams }: { searchParams: Promise<{ title?: string; enquiry?: string }> }) {
  const me = await requireAdmin();
  if (!dbConfigured()) return <p className="mja-warn">The schedule needs the database. Add <b>DATABASE_URL</b> to <b>.env.local</b>, then restart.</p>;
  const owner = ownerKey(me);
  const [items, people, prefs] = await Promise.all([listItems(owner), recipients(), prefsOf(owner)]);
  const { title, enquiry } = await searchParams;
  const kinds = (Object.keys(ALERTS) as AlertKind[]).filter((k) => !ALERTS[k].perm || can(me, ALERTS[k].perm!)).map((k) => ({ key: k, label: ALERTS[k].label, hint: ALERTS[k].hint }));
  const nameOf = new Map(people.map((p) => [p.owner, p.owner === owner ? "You" : p.name]));
  return (
    <>
      <Alerts kinds={kinds} prefs={prefs} compact />
      <ScheduleBoard
        me={owner}
        items={items.map((i) => ({ ...i, local: toLagosInput(i.startsAt), who: i.assignee === "everyone" ? "Everyone" : nameOf.get(i.assignee) || "Someone" }))}
        people={[{ value: owner, label: "Me" }, { value: "everyone", label: "Everyone" }, ...people.filter((p) => p.owner !== owner && p.owner !== "master").map((p) => ({ value: p.owner, label: p.name }))]}
        kinds={Object.entries(ITEM_KINDS)} repeats={Object.entries(REPEATS)} reminds={REMIND}
        prefill={title || enquiry ? { title: title || "", enquiryId: enquiry || "" } : undefined}
      />
    </>
  );
}
