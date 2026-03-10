import { createContext, useContext, ReactNode } from "react";

interface TacitSidebarContextType {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const TacitSidebarContext = createContext<TacitSidebarContextType | undefined>(undefined);

export function TacitSidebarProvider({
  children,
  openSidebar,
  closeSidebar,
  toggleSidebar,
  isSidebarOpen,
}: {
  children: ReactNode;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}) {
  return (
    <TacitSidebarContext.Provider
      value={{
        openSidebar,
        closeSidebar,
        toggleSidebar,
        isSidebarOpen,
      }}
    >
      {children}
    </TacitSidebarContext.Provider>
  );
}

export function useTacitSidebar() {
  const context = useContext(TacitSidebarContext);
  if (context === undefined) {
    throw new Error("useTacitSidebar must be used within a TacitSidebarProvider");
  }
  return context;
}
