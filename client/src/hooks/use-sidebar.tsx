import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      toggle: () => set((state) => ({ expanded: !state.expanded })),
      setExpanded: (expanded) => set({ expanded }),
    }),
    {
      name: "sidebar-state",
    }
  )
);
