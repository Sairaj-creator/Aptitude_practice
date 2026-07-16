"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function PatternStatus() {
  const [data, setData] = useState<{ sections: unknown[]; source: string } | null>(null);

  useEffect(() => {
    fetch("/api/tcs-nqt/pattern")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load pattern");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Badge variant="secondary">
      {data ? `${data.sections.length} sections from ${data.source}` : "Pattern loading"}
    </Badge>
  );
}
