import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { draftDailyPlan, type SlotType } from "@/lib/linkedin-spotlight";
import { LinkedInPost } from "@/models/LinkedInPost";

// Keeps the LinkedIn queue filled: every run, empty daily slots in the next two days get a drafted,
// scheduled post. Posts are scheduled well ahead, so there's time to edit or delete them first.

export type AutopilotSlot = { time: string; type: SlotType };
export type AutopilotSettings = { enabled: boolean; slots: AutopilotSlot[]; timezone: string; updatedAt?: Date };

const SETTINGS_ID = "linkedin-autopilot";
const LOOKAHEAD_MS = 48 * 60 * 60 * 1000;
const MIN_LEAD_MS = 30 * 60 * 1000;
const SLOT_MATCH_MS = 30 * 60 * 1000;
const LOCK_GAP_MS = 5 * 60 * 1000;

export const DEFAULT_SETTINGS: AutopilotSettings = {
  enabled: false,
  timezone: "America/Toronto",
  slots: [
    { time: "08:00", type: "spotlight" },
    { time: "11:00", type: "spotlight" },
    { time: "14:00", type: "roundup" },
    { time: "17:00", type: "spotlight" },
    { time: "20:00", type: "rotating" },
  ],
};

function settingsCollection() {
  return mongoose.connection.collection<AutopilotSettings & { _id: string }>("settings");
}

export async function getAutopilot(): Promise<AutopilotSettings> {
  await connectDB();
  const doc = await settingsCollection().findOne({ _id: SETTINGS_ID });
  if (!doc) return DEFAULT_SETTINGS;
  return { enabled: doc.enabled, slots: doc.slots, timezone: doc.timezone, updatedAt: doc.updatedAt };
}

export async function saveAutopilot(settings: Omit<AutopilotSettings, "updatedAt">) {
  await connectDB();
  await settingsCollection().updateOne(
    { _id: SETTINGS_ID },
    { $set: { ...settings, updatedAt: new Date() } },
    { upsert: true }
  );
}

// Minutes the zone is ahead of UTC at a given instant (e.g. -300 for Toronto in winter).
function zoneOffsetMinutes(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return Math.round((asUtc - at.getTime()) / 60000);
}

// The instant when a zone's wall clock reads `time` on the given zone-local date.
function zonedInstant(year: number, month: number, day: number, time: string, timeZone: string) {
  const [h, m] = time.split(":").map(Number);
  const guess = Date.UTC(year, month, day, h, m);
  const first = guess - zoneOffsetMinutes(new Date(guess), timeZone) * 60000;
  return new Date(guess - zoneOffsetMinutes(new Date(first), timeZone) * 60000);
}

function upcomingSlotTimes(settings: AutopilotSettings, now: Date) {
  const out: { when: Date; type: SlotType }[] = [];
  for (let d = -1; d <= 3; d++) {
    const day = new Date(now.getTime() + d * 86_400_000);
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone, year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(day)
        .map((p) => [p.type, p.value])
    );
    for (const slot of settings.slots) {
      if (!/^\d{2}:\d{2}$/.test(slot.time)) continue;
      const when = zonedInstant(Number(parts.year), Number(parts.month) - 1, Number(parts.day), slot.time, settings.timezone);
      const lead = when.getTime() - now.getTime();
      if (lead >= MIN_LEAD_MS && lead <= LOOKAHEAD_MS) out.push({ when, type: slot.type });
    }
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}

// Runs at most once per few minutes across all instances, so overlapping cron calls can't double-fill a slot.
async function takeLock(now: Date) {
  const locks = mongoose.connection.collection<{ _id: string; lastRunAt: Date }>("schedulerlocks");
  try {
    await locks.findOneAndUpdate(
      { _id: SETTINGS_ID, lastRunAt: { $lt: new Date(now.getTime() - LOCK_GAP_MS) } },
      { $set: { lastRunAt: now } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return false;
    throw err;
  }
}

export async function runAutopilot({ force = false } = {}) {
  const settings = await getAutopilot();
  if (!settings.enabled || settings.slots.length === 0) return { enabled: false, scheduled: 0 };
  const now = new Date();
  if (!force && !(await takeLock(now))) return { enabled: true, scheduled: 0, skipped: "recently ran" };

  const slots = upcomingSlotTimes(settings, now);
  if (!slots.length) return { enabled: true, scheduled: 0 };
  const taken = (await LinkedInPost.find({
    status: { $in: ["scheduled", "publishing", "posted"] },
    scheduledFor: { $gte: new Date(slots[0].when.getTime() - SLOT_MATCH_MS), $lte: new Date(slots.at(-1)!.when.getTime() + SLOT_MATCH_MS) },
  })
    .select("scheduledFor")
    .lean()) as unknown as { scheduledFor: Date }[];
  const open = slots.filter((s) => !taken.some((t) => Math.abs(new Date(t.scheduledFor).getTime() - s.when.getTime()) < SLOT_MATCH_MS));
  if (!open.length) return { enabled: true, scheduled: 0 };

  const drafts = await draftDailyPlan(open.map((s) => ({ when: s.when.toISOString(), type: s.type })));
  if (drafts.length) {
    await LinkedInPost.insertMany(
      drafts.map((d) => ({
        content: d.content,
        profile: "personal1",
        status: "scheduled",
        jobSlugs: d.jobSlugs,
        kind: d.kind,
        ...(d.ref ? { ref: d.ref } : {}),
        scheduledFor: new Date(d.when),
      }))
    );
  }
  return { enabled: true, scheduled: drafts.length, open: open.length };
}
