/** Tacit platform accent tokens � use instead of client-specific red in MANU UI */
export const manuAccentClass = "text-primary";
export const manuAccentBorder = "border-primary/40";
export const manuAccentBorderStrong = "border-primary/35";
export const manuAccentBg = "bg-primary/10";
export const manuAccentBgSubtle = "bg-primary/5";
export const manuAccentRing = "ring-primary/30";
export const manuActiveChip = "border-primary bg-primary/15 text-primary";
export const manuPrimaryButton = "bg-gradient-primary font-semibold";

/** Rotating palette for generated section approval cards */
export const manuSectionCardPalette = [
  {
    card: "border-l-sky-500 bg-gradient-to-br from-sky-500/10 via-card to-card",
    header: "text-sky-700 dark:text-sky-300",
    approvedBadge: "bg-sky-600/90 hover:bg-sky-600",
    sourceChip: "bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/25",
  },
  {
    card: "border-l-violet-500 bg-gradient-to-br from-violet-500/10 via-card to-card",
    header: "text-violet-700 dark:text-violet-300",
    approvedBadge: "bg-violet-600/90 hover:bg-violet-600",
    sourceChip: "bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/25",
  },
  {
    card: "border-l-amber-500 bg-gradient-to-br from-amber-500/10 via-card to-card",
    header: "text-amber-800 dark:text-amber-300",
    approvedBadge: "bg-amber-600/90 hover:bg-amber-600",
    sourceChip: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/25",
  },
  {
    card: "border-l-teal-500 bg-gradient-to-br from-teal-500/10 via-card to-card",
    header: "text-teal-700 dark:text-teal-300",
    approvedBadge: "bg-teal-600/90 hover:bg-teal-600",
    sourceChip: "bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/25",
  },
  {
    card: "border-l-rose-500 bg-gradient-to-br from-rose-500/10 via-card to-card",
    header: "text-rose-700 dark:text-rose-300",
    approvedBadge: "bg-rose-600/90 hover:bg-rose-600",
    sourceChip: "bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/25",
  },
  {
    card: "border-l-indigo-500 bg-gradient-to-br from-indigo-500/10 via-card to-card",
    header: "text-indigo-700 dark:text-indigo-300",
    approvedBadge: "bg-indigo-600/90 hover:bg-indigo-600",
    sourceChip: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border-indigo-500/25",
  },
] as const;
