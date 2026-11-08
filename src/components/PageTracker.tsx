"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "rb_vid";
const SESSION_KEY = "rb_session";
const INTERNAL_KEY = "rb_internal";
const SESSION_IDLE_MS = 30 * 60 * 1000;

type Identity = { visitorId?: string; sessionId?: string; internal?: boolean };

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function newId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// A persistent visitor ID is only kept for visitors who accepted cookies; everyone else is counted anonymously.
function identity(): Identity {
  const ls = storage();
  if (!ls) return {};
  const internal = ls.getItem(INTERNAL_KEY) === "1" || undefined;
  if (ls.getItem("cookie_consent") !== "accepted") return { internal };

  let visitorId = ls.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = newId();
    ls.setItem(VISITOR_KEY, visitorId);
  }
  let session: { id: string; last: number } | null = null;
  try {
    session = JSON.parse(ls.getItem(SESSION_KEY) || "null");
  } catch {}
  const now = Date.now();
  if (!session || now - session.last > SESSION_IDLE_MS) session = { id: newId(), last: now };
  session.last = now;
  ls.setItem(SESSION_KEY, JSON.stringify(session));
  return { visitorId, sessionId: session.id, internal };
}

function sendBeacon(url: string, data: object) {
  const body = JSON.stringify(data);
  if (!navigator.sendBeacon?.(url, body)) {
    fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

export default function PageTracker() {
  const pathname = usePathname();
  const firstView = useRef(true);
  const view = useRef<{ id?: string; visibleSince: number | null; total: number; sent: boolean; human: boolean } | null>(null);
  // Set by the first real input in this tab (mouse, touch, key). Scripts can't fake trusted events.
  const human = useRef(false);

  function confirmHuman() {
    const v = view.current;
    if (!v || v.human || !v.id) return;
    v.human = true;
    sendBeacon("/api/track/engagement", { id: v.id, human: true });
  }

  // Reports how long the current page was visible; the first report per page view is the one kept.
  function flush() {
    const v = view.current;
    if (!v || v.sent || !v.id) return;
    const total = v.total + (v.visibleSince ? Date.now() - v.visibleSince : 0);
    if (total < 500) return;
    v.sent = true;
    sendBeacon("/api/track/engagement", { id: v.id, ms: total });
  }

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      try {
        storage()?.setItem(INTERNAL_KEY, "1");
      } catch {}
      return;
    }
    if (pathname.startsWith("/api")) return;

    flush();
    const current = {
      id: undefined as string | undefined,
      visibleSince: document.visibilityState === "visible" ? Date.now() : null,
      total: 0,
      sent: false,
      human: human.current,
    };
    view.current = current;

    const params = new URLSearchParams(window.location.search);
    let referrerHost: string | undefined;
    if (firstView.current && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (host && host !== window.location.hostname.replace(/^www\./, "")) referrerHost = host;
      } catch {}
    }
    firstView.current = false;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        ...identity(),
        referrerHost,
        utmSource: params.get("utm_source") || undefined,
        utmMedium: params.get("utm_medium") || undefined,
        utmCampaign: params.get("utm_campaign") || undefined,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        human: human.current,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) current.id = data.id;
        // Input that happened while the view was being recorded still counts for it.
        if (human.current && !current.human && current.id) {
          current.human = true;
          sendBeacon("/api/track/engagement", { id: current.id, human: true });
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function onVisibility() {
      const v = view.current;
      if (!v) return;
      if (document.visibilityState === "hidden") {
        if (v.visibleSince) v.total += Date.now() - v.visibleSince;
        v.visibleSince = null;
        flush();
      } else {
        v.visibleSince = Date.now();
      }
    }
    function onInput(e: Event) {
      if (!e.isTrusted) return;
      human.current = true;
      confirmHuman();
    }
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("[data-apply-btn]");
      if (!link) return;
      sendBeacon("/api/track/event", {
        type: "apply_click",
        path: window.location.pathname,
        href: (link as HTMLAnchorElement).href,
        human: e.isTrusted,
        ...identity(),
      });
    }
    const inputs = ["pointerdown", "pointermove", "touchstart", "keydown", "wheel"] as const;
    for (const type of inputs) window.addEventListener(type, onInput, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick, true);
    return () => {
      for (const type of inputs) window.removeEventListener(type, onInput, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
