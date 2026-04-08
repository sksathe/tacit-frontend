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
    <header className="sticky top-0 z-[1000] shrink-0 border-b border-dashboard-header-border bg-dashboard-header px-3 py-2 sm:px-5 lg:px-6 dark:border-primary/20 dark:bg-background/95">
      <nav className="flex w-full max-w-none items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 text-primary-foreground dark:text-primary">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground dark:bg-primary/10 dark:text-primary">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ fill: "currentColor", stroke: "currentColor" }}>
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
            <div className="truncate text-sm font-bold tracking-wide sm:text-base">Tacit Studio</div>
            <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/75 dark:text-primary/70">
              Knowledge Workspace
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" className="rounded-full border border-primary-foreground/30 bg-primary-foreground px-3 py-1 text-xs font-semibold text-dashboard-header">
              This week
            </button>
            <button type="button" className="rounded-full border border-primary-foreground/28 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground/90">
              This month
            </button>
          </div>

          <span className="hidden text-sm text-primary-foreground/88 lg:inline">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary-foreground/28 bg-primary-foreground/10 text-primary-foreground transition-all hover:border-primary-foreground/45 hover:bg-primary-foreground/16 dark:border-primary/25 dark:bg-primary/5 dark:text-primary dark:hover:border-primary/40 dark:hover:bg-primary/10"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative user-avatar-container">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-primary-foreground/35 bg-primary-foreground/10 p-0.5 pr-1.5 transition-all hover:border-primary-foreground/55 hover:bg-primary-foreground/16 dark:border-primary/30 dark:bg-primary/10 dark:hover:border-primary dark:hover:bg-primary/15"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground text-sm font-bold text-dashboard-header dark:bg-primary dark:text-primary-foreground">
                {userInitial}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-primary-foreground transition-transform dark:text-primary ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-[2.6rem] z-[1000] min-w-[150px] overflow-hidden rounded-lg border border-primary/30 bg-card/95 py-1 shadow-elegant">
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
