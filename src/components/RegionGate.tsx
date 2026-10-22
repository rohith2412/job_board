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
    fetch("/api/user/region")
      .then((r) => r.json())
      .then((data) => {
        setRegion(data.region || null);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [status]);

  if (!checked || status !== "authenticated" || region) return null;

  return <RegionSelector onSelect={(r) => setRegion(r)} />;
}
