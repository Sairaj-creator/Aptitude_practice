import { AppShell } from "@/components/app-shell";
import { SectionedTestRunner } from "@/components/tcs/sectioned-test-runner";

export default async function FullMockPage({ searchParams }: { searchParams: Promise<{ attemptId?: string }> }) {
  const { attemptId } = await searchParams;
  return (
    <AppShell activeHref="/company-prep">
      <SectionedTestRunner attemptId={attemptId} />
    </AppShell>
  );
}
