import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { LinkedInAccount } from "@/models/LinkedInAccount";
import { LinkedInPost } from "@/models/LinkedInPost";

export const LINKEDIN_MAX_CHARS = 3000;

// LinkedIn's Posts API parses `commentary` as "little text"; an unescaped reserved character
// silently cuts the post off at that point, so every reserved character must be backslash-escaped.
const RESERVED = /[\\|{}@[\]()<>#*_~]/g;

function escapeLittleText(text: string) {
  return text.replace(RESERVED, (c) => `\\${c}`);
}

// Plain "#tag" text becomes LinkedIn's hashtag template so tags stay clickable after escaping.
export function toLinkedInCommentary(text: string) {
  const parts: string[] = [];
  let last = 0;
  for (const match of text.matchAll(/(^|\s)#([\p{L}\p{N}_]+)/gu)) {
    const start = (match.index ?? 0) + match[1].length;
    parts.push(escapeLittleText(text.slice(last, start)));
    parts.push(`{hashtag|\\#|${escapeLittleText(match[2])}}`);
    last = start + 1 + match[2].length;
  }
  parts.push(escapeLittleText(text.slice(last)));
  return parts.join("");
}

export type PublishResult = { profile: string; name: string; success: boolean; error?: string; postUrn?: string };

async function publishToAccounts(content: string): Promise<PublishResult[]> {
  const accounts = await LinkedInAccount.find({}).sort({ updatedAt: -1 });
  // The same LinkedIn member connected under two profile keys must still get the post only once.
  const seen = new Set<string>();
  const connected = accounts.filter((a) => {
    if (new Date(a.expiresAt) <= new Date() || seen.has(a.linkedinId)) return false;
    seen.add(a.linkedinId);
    return true;
  });
  if (connected.length === 0) {
    return [{ profile: "-", name: "LinkedIn", success: false, error: "No connected LinkedIn accounts" }];
  }

  const commentary = toLinkedInCommentary(content);
  const results: PublishResult[] = [];
  for (let i = 0; i < connected.length; i++) {
    const account = connected[i];
    try {
      const res = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202610",
        },
        body: JSON.stringify({
          author: `urn:li:person:${account.linkedinId}`,
          // A trailing zero-width space keeps LinkedIn from rejecting the same text as a duplicate on the second account.
          commentary: i === 0 ? commentary : `${commentary}\n​`,
          visibility: "PUBLIC",
          distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
      });
      if (res.ok) {
        const postUrn = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id") ?? undefined;
        results.push({ profile: account.profileKey, name: account.name, success: true, postUrn });
      } else {
        const body = await res.text();
        let message = body;
        try {
          const json = JSON.parse(body);
          message = json.message || json.error || body;
        } catch {}
        results.push({ profile: account.profileKey, name: account.name, success: false, error: message });
      }
    } catch {
      results.push({ profile: account.profileKey, name: account.name, success: false, error: "Network error" });
    }
  }
  return results;
}

// Claims the post first so a manual publish and the scheduler can never send the same post twice.
export async function publishPost(postId: string, allowedStatuses: string[]) {
  await connectDB();
  const post = await LinkedInPost.findOneAndUpdate(
    { _id: postId, status: { $in: allowedStatuses } },
    { $set: { status: "publishing" } },
    { returnDocument: "after" }
  );
  if (!post) return { claimed: false as const };

  if (post.content.length > LINKEDIN_MAX_CHARS) {
    post.status = "failed";
    post.lastError = `Post is over ${LINKEDIN_MAX_CHARS} characters`;
    await post.save();
    return { claimed: true as const, post, results: [] as PublishResult[] };
  }

  const results = await publishToAccounts(post.content);
  const anySuccess = results.some((r) => r.success);
  post.status = anySuccess ? "posted" : "failed";
  if (anySuccess) post.postedAt = new Date();
  post.publishedUrns = results.flatMap((r) => (r.success && r.postUrn ? [r.postUrn] : []));
  const failures = results.filter((r) => !r.success);
  post.lastError = failures.length ? failures.map((f) => `${f.name}: ${f.error}`).join("; ") : undefined;
  await post.save();
  return { claimed: true as const, post, results };
}

const DUE_BATCH = 5;

export async function publishDuePosts() {
  await connectDB();
  const due = await LinkedInPost.find({ status: "scheduled", scheduledFor: { $lte: new Date() } })
    .sort({ scheduledFor: 1 })
    .limit(DUE_BATCH)
    .select("_id")
    .lean();

  const published: string[] = [];
  const failed: { id: string; error?: string }[] = [];
  for (const { _id } of due) {
    const outcome = await publishPost(String(_id), ["scheduled"]);
    if (!outcome.claimed) continue;
    if (outcome.post.status === "posted") published.push(String(_id));
    else failed.push({ id: String(_id), error: outcome.post.lastError });
  }
  return { checked: due.length, published, failed };
}

const SCHEDULER_LOCK_ID = "linkedin-scheduler";
const SCHEDULER_MIN_GAP_MS = 60_000;

// Opportunistic trigger from site traffic: runs at most once a minute across all instances,
// so scheduled posts go out on time even when the external cron is late or skipped.
export async function maybePublishDuePosts() {
  await connectDB();
  const locks = mongoose.connection.collection<{ _id: string; lastRunAt: Date }>("schedulerlocks");
  const now = new Date();
  try {
    await locks.findOneAndUpdate(
      { _id: SCHEDULER_LOCK_ID, lastRunAt: { $lt: new Date(now.getTime() - SCHEDULER_MIN_GAP_MS) } },
      { $set: { lastRunAt: now } },
      { upsert: true }
    );
  } catch (err) {
    // A duplicate-key error means another request holds the lock (ran within the last minute).
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  }
  const hasDue = await LinkedInPost.exists({ status: "scheduled", scheduledFor: { $lte: now } });
  return hasDue ? publishDuePosts() : null;
}
