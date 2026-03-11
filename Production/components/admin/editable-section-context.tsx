"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type SectionState = {
  hasChanges: boolean;
  title: string;
};

type EditableSectionContextValue = {
  activeSectionId: string | null;
  requestEdit: (sectionId: string, sectionTitle: string, hasChanges: boolean) => boolean;
  registerSection: (sectionId: string, state: SectionState) => void;
  unregisterSection: (sectionId: string) => void;
  closeSection: (sectionId: string) => void;
};

const EditableSectionContext = createContext<EditableSectionContextValue | null>(null);

export function EditableSectionProvider({ children }: { children: React.ReactNode }) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, SectionState>>({});
  const sectionsRef = useRef<Record<string, SectionState>>(sections);
  sectionsRef.current = sections;

  const registerSection = useCallback((sectionId: string, state: SectionState) => {
    setSections((prev) => ({ ...prev, [sectionId]: state }));
  }, []);

  const unregisterSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    setActiveSectionId((id) => (id === sectionId ? null : id));
  }, []);

  const closeSection = useCallback((sectionId: string) => {
    setActiveSectionId((id) => (id === sectionId ? null : id));
  }, []);

  const requestEditStable = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by EditableSection
    (sectionId: string, _sectionTitle: string, _hasChanges: boolean): boolean => {
      if (typeof window !== "undefined") {
        const currentId = activeSectionId;
        if (currentId && currentId !== sectionId) {
          const currentState = sectionsRef.current[currentId];
          if (currentState?.hasChanges) {
            const msg = `You have unsaved changes in "${currentState.title}". Save or cancel before editing another section.`;
            if (!window.confirm(msg)) return false;
          }
        }
      }
      setActiveSectionId(sectionId);
      return true;
    },
    [activeSectionId]
  );

  const value = useMemo<EditableSectionContextValue>(
    () => ({
      activeSectionId,
      requestEdit: requestEditStable,
      registerSection,
      unregisterSection,
      closeSection,
    }),
    [activeSectionId, requestEditStable, registerSection, unregisterSection, closeSection]
  );

  return (
    <EditableSectionContext.Provider value={value}>
      {children}
    </EditableSectionContext.Provider>
  );
}

export function useEditableSectionContext() {
  const ctx = useContext(EditableSectionContext);
  return ctx;
}
