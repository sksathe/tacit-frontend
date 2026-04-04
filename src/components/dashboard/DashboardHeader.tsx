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
    <header className="sticky top-0 z-[1000] border-b border-primary/20 bg-background/95 px-3 py-2.5 sm:px-6">
      <nav className="mx-auto flex max-w-[1700px] items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <span className="flex h-7 w-7 items-center justify-center text-primary">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ fill: 'currentColor', stroke: 'currentColor' }}>
              <circle cx="12" cy="10" r="2.5"/>
              <circle cx="8" cy="20" r="2.5"/>
              <circle cx="12" cy="30" r="2.5"/>
              <circle cx="28" cy="10" r="2.5"/>
              <circle cx="32" cy="20" r="2.5"/>
              <circle cx="28" cy="30" r="2.5"/>
              <circle cx="20" cy="20" r="3"/>
              <line x1="12" y1="10" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="20" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="30" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="28" y1="10" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="32" y1="20" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="28" y1="30" x2="20" y2="20" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M 12 10 Q 10 15 8 20" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 8 20 Q 10 25 12 30" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 28 10 Q 30 15 32 20" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 32 20 Q 30 25 28 30" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight sm:text-xl">Tacit Studio</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-primary/70">Knowledge Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-sm text-muted-foreground md:inline">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/5 text-primary transition-all hover:border-primary/40 hover:bg-primary/10"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative user-avatar-container">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 p-0.5 pr-1.5 transition-all hover:border-primary hover:bg-primary/15"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {userInitial}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-primary transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
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
