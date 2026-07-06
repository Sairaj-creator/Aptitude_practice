import { AppShell } from "@/components/app-shell";
import { CodingPanel } from "@/components/tcs/coding-panel";

export default function CodingPage() {
  return (
    <AppShell activeHref="/company-prep">
      <CodingPanel />
    </AppShell>
  );
}
