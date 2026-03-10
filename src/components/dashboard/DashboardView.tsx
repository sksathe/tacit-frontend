interface DashboardViewProps {
  onStartSession: () => void;
  onScheduleSession: () => void;
  onAutomateSessions: () => void;
}

export function DashboardView({ onStartSession, onScheduleSession, onAutomateSessions }: DashboardViewProps) {
  return (
    <>
      <div className="relative mb-14 text-center lg:mb-20">
        <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary">
          AI Knowledge Operations
        </div>
        <h1 className="mx-auto mb-4 max-w-[12ch] text-balance bg-gradient-primary bg-clip-text text-[2.6rem] font-extrabold leading-[1.02] text-transparent md:text-[3.6rem]">
          Welcome to Tacit Studio
        </h1>
        <p className="mx-auto max-w-[760px] text-[1.05rem] leading-relaxed text-muted-foreground md:text-[1.25rem]">
          Transform your tacit expertise into new knowledge assets. Choose an action below to get started.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Card 1: Start Tacit Session */}
        <div
          onClick={onStartSession}
          className="group relative flex min-h-[420px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-primary/35 bg-card/65 p-8 shadow-elegant transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-glow md:p-12"
        >
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl transition-all duration-500 group-hover:bg-primary/16" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-70" />
          <div className="relative z-10">
            <span className="mb-6 inline-flex items-center rounded-full border border-primary/35 bg-primary/15 px-4 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-primary">
              Capture Tacit Data
            </span>
            <div className="mb-8 block text-5xl md:text-6xl">🎙️</div>
            <h2 className="mb-5 text-[2.25rem] font-extrabold leading-[1.05] text-foreground md:text-[3.05rem]">
              Start
              <br />
              Tacit Session
            </h2>
            <p className="mb-8 max-w-[48ch] text-[1rem] leading-relaxed text-muted-foreground md:text-[1.08rem]">
              Begin a new knowledge capture session with an AI agent. Start now or schedule for later.
            </p>
            <div
              className="grid grid-cols-2 gap-3 text-[0.77rem] font-semibold uppercase tracking-[0.12em] text-primary/80 md:max-w-[420px] cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">Invite SMEs instantly</div>
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">Call-in workflow</div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onStartSession}
              className="flex-shrink-0 whitespace-nowrap rounded-lg bg-primary px-6 py-3 text-[0.92rem] font-semibold text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary-glow hover:shadow-glow"
            >
              Start Now
            </button>
            <button
              type="button"
              onClick={onScheduleSession}
              className="flex-shrink-0 whitespace-nowrap rounded-lg border border-primary/40 bg-transparent px-6 py-3 text-[0.92rem] font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
            >
              Schedule Session
            </button>
          </div>
        </div>

        {/* Card 2: Automate Knowledge Assets */}
        <div
          onClick={onAutomateSessions}
          className="group relative flex min-h-[420px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-primary/35 bg-card/65 p-8 shadow-elegant transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-glow md:p-12"
        >
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/15" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-70" />
          <div className="relative z-10">
            <span className="mb-6 inline-flex items-center rounded-full border border-primary/35 bg-primary/15 px-4 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-primary">
              Leverage Captured Data
            </span>
            <div className="mb-8 block text-5xl md:text-6xl">⚡</div>
            <h2 className="mb-5 text-[2.25rem] font-extrabold leading-[1.05] text-foreground md:text-[3.05rem]">
              Automate
              <br />
              Knowledge Assets
            </h2>
            <p className="mb-8 max-w-[48ch] text-[1rem] leading-relaxed text-muted-foreground md:text-[1.08rem]">
              Turn your past sessions into structured knowledge. Run existing automations or build a new workflow.
            </p>
            <div
              className="grid grid-cols-2 gap-3 text-[0.77rem] font-semibold uppercase tracking-[0.12em] text-primary/80 md:max-w-[470px] cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">Notebook-style workspace</div>
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">One-click automations</div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onAutomateSessions}
              className="flex-shrink-0 whitespace-nowrap rounded-lg bg-primary px-6 py-3 text-[0.92rem] font-semibold text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary-glow hover:shadow-glow"
            >
              Automate Past Sessions
            </button>
            <button
              type="button"
              onClick={onAutomateSessions}
              className="flex-shrink-0 whitespace-nowrap rounded-lg border border-primary/40 bg-transparent px-6 py-3 text-[0.92rem] font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10"
            >
              Build New Automations
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
