"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import RegionSelector from "./RegionSelector";

export default function RegionGate() {
  const { data: session, status } = useSession();
  const [region, setRegion] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setChecked(true);
      return;
    }
    try {
      const cached = sessionStorage.getItem("user_region");
      if (cached) {
        setRegion(cached);
        setChecked(true);
        return;
      }
    } catch {}
    fetch("/api/user/region")
      .then((r) => r.json())
      .then((data) => {
        const r = data.region || null;
        setRegion(r);
        if (r) {
          try { sessionStorage.setItem("user_region", r); } catch {}
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [status]);

  if (!checked || status !== "authenticated" || region) return null;

  return (
    <RegionSelector
      onSelect={(r) => {
        setRegion(r);
        try { sessionStorage.setItem("user_region", r); } catch {}
      }}
    />
  );
}
