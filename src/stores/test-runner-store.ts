import { create } from "zustand";

type RunnerStore = {
  activeSectionId: string | null;
  acknowledgedWarning: boolean;
  setActiveSectionId: (sectionId: string | null) => void;
  setAcknowledgedWarning: (value: boolean) => void;
};

export const useTestRunnerStore = create<RunnerStore>((set) => ({
  activeSectionId: null,
  acknowledgedWarning: false,
  setActiveSectionId: (sectionId) => set({ activeSectionId: sectionId }),
  setAcknowledgedWarning: (value) => set({ acknowledgedWarning: value })
}));
