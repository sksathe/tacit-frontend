import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true,
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(document.documentElement.classList.contains("dark"));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-avatar-container")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    if (confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/");
    }
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-[1000] shrink-0 border-b border-dashboard-header-border/70 bg-dashboard-header/95 px-3 py-3 backdrop-blur-md sm:px-5 lg:px-6 dark:border-dashboard-header-border dark:bg-dashboard-header/90">
      <nav className="flex w-full max-w-none items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 text-dashboard-header-foreground">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashboard-header-foreground/20 bg-dashboard-header-foreground/8 text-dashboard-header-foreground dark:border-dashboard-rail-border dark:bg-dashboard-surface dark:text-primary">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[1.35rem] w-[1.35rem]"
              style={{ fill: "currentColor", stroke: "currentColor" }}
            >
              <circle cx="12" cy="10" r="2.5" />
              <circle cx="8" cy="20" r="2.5" />
              <circle cx="12" cy="30" r="2.5" />
              <circle cx="28" cy="10" r="2.5" />
              <circle cx="32" cy="20" r="2.5" />
              <circle cx="28" cy="30" r="2.5" />
              <circle cx="20" cy="20" r="3" />
              <line x1="12" y1="10" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="20" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="30" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="28" y1="10" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="32" y1="20" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="28" y1="30" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 leading-none">
            <div className="truncate text-base font-semibold tracking-wide sm:text-lg">Tacit Studio</div>
            <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-dashboard-header-foreground-muted">
              Knowledge Workspace
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" className="rounded-full border border-dashboard-header-foreground/24 bg-dashboard-header-foreground px-3 py-1 text-xs font-semibold text-dashboard-header shadow-sm dark:border-dashboard-rail-border dark:bg-dashboard-surface dark:text-dashboard-text-strong">
              This week
            </button>
            <button type="button" className="rounded-full border border-dashboard-header-foreground/20 bg-dashboard-header-foreground/10 px-3 py-1 text-xs font-medium text-dashboard-header-foreground dark:border-dashboard-rail-border dark:bg-transparent dark:text-dashboard-header-foreground-muted">
              This month
            </button>
          </div>

          <span className="hidden text-sm text-dashboard-header-foreground lg:inline">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashboard-header-foreground/25 bg-dashboard-header-foreground/10 text-dashboard-header-foreground transition-all hover:border-dashboard-header-foreground/40 hover:bg-dashboard-header-foreground/16 dark:border-dashboard-rail-border dark:bg-dashboard-surface dark:text-primary dark:hover:border-primary/45 dark:hover:bg-dashboard-surface-muted"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative user-avatar-container">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-dashboard-header-foreground/30 bg-dashboard-header-foreground/10 p-0.5 pr-1.5 transition-all hover:border-dashboard-header-foreground/55 hover:bg-dashboard-header-foreground/16 dark:border-dashboard-rail-border dark:bg-dashboard-surface dark:hover:border-primary/60 dark:hover:bg-dashboard-surface-muted"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dashboard-header-foreground text-sm font-bold text-dashboard-header dark:bg-primary/18 dark:text-primary">
                {userInitial}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-dashboard-header-foreground transition-transform dark:text-primary ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-[2.6rem] z-[1000] min-w-[150px] overflow-hidden rounded-xl border border-primary/30 bg-card/95 py-1 shadow-elegant dark:border-dashboard-rail-border dark:bg-dashboard-surface">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-all hover:bg-primary/10 hover:text-primary"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
