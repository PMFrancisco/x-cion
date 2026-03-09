"use client";

import { createContext, useContext, useState } from "react";

interface MobileDrawerContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextType>({
  open: false,
  setOpen: () => {},
});

export function MobileDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileDrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileDrawerContext.Provider>
  );
}

export function useMobileDrawer() {
  return useContext(MobileDrawerContext);
}
