import { AppShell } from "@/components/app-shell";
import { SectionedTestRunner } from "@/components/tcs/sectioned-test-runner";
import { getStoredAttempt } from "@/lib/tcs-nqt-store";
import { getCurrentSection } from "@/lib/tcs-nqt";

export default async function FullMockPage({ searchParams }: { searchParams: Promise<{ attemptId?: string }> }) {
  const { attemptId } = await searchParams;

  let initialSectionId: string | undefined = undefined;
  let remainingTime: number | undefined = undefined;

  if (attemptId) {
    const attempt = await getStoredAttempt(attemptId);
    if (attempt) {
      const currentSection = getCurrentSection(attempt);
      if (currentSection) {
        initialSectionId = currentSection.id;
        const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
        const completedTimeSec = attempt.sectionResults.reduce((sum, res) => sum + res.timeTakenSec, 0);
        remainingTime = Math.max(0, currentSection.timeLimitSec - (elapsedSec - completedTimeSec));
      }
    }
  }

  return (
    <AppShell activeHref="/company-prep">
      <SectionedTestRunner 
        attemptId={attemptId} 
        initialSectionId={initialSectionId}
        initialRemainingTime={remainingTime}
      />
    </AppShell>
  );
}
