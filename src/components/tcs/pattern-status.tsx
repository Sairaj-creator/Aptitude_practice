"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export function PatternStatus() {
  const { data } = useQuery({
    queryKey: ["tcs-nqt-pattern"],
    queryFn: async () => {
      const response = await fetch("/api/tcs-nqt/pattern");
      if (!response.ok) throw new Error("Failed to load pattern");
      return response.json() as Promise<{ sections: unknown[]; source: string }>;
    }
  });

  return (
    <Badge variant="secondary">
      {data ? `${data.sections.length} sections from ${data.source}` : "Pattern loading"}
    </Badge>
  );
}
