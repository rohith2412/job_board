"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function LocationTracker() {
  const { data: session } = useSession();
  const sent = useRef(false);

  useEffect(() => {
    if (!session?.user?.email || sent.current) return;
    sent.current = true;
    fetch("/api/user/location", { method: "POST" }).catch(() => {});
  }, [session]);

  return null;
}
