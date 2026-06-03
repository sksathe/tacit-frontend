import Header from "@/components/layout/Header";
import { TACIT_AGENTS } from "@/data/agents";
import { MANU_CLIENT } from "@/types/manu";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { manuAccentBg, manuAccentBorderStrong, manuAccentClass } from "./manuTheme";

interface ManuWorkflowShellProps {
  children: ReactNode;
  stepLabel?: string;
  onBack?: () => void;
  showBackToHome?: boolean;
}

export function ManuWorkflowShell({ children, stepLabel, onBack, showBackToHome = true }: ManuWorkflowShellProps) {
  const navigate = useNavigate();
  const agent = TACIT_AGENTS.find((a) => a.id === "manu");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-primary/20 bg-[linear-gradient(90deg,hsl(var(--primary)/0.08),transparent_55%)]">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4">
            {showBackToHome && (
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate("/"))}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${manuAccentBorderStrong} ${manuAccentBg}`}
              >
                {agent?.icon ?? "📘"}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight">MANU</h1>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${manuAccentBorderStrong} ${manuAccentBg} ${manuAccentClass}`}
                  >
                    {MANU_CLIENT} POC
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{agent?.tagline}</p>
              </div>
            </div>
          </div>
          {stepLabel && (
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{stepLabel}</span>
          )}
        </div>
      </div>
      <main className="container mx-auto px-4 py-8 pb-16">{children}</main>
    </div>
  );
}

export { manuAccentClass, manuAccentBorder, manuAccentBg } from "./manuTheme";
