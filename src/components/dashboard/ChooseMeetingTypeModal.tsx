import { useState } from "react";
import { X, Phone, Video } from "lucide-react";

type MeetingFlow = "start" | "schedule" | null;

export type MeetingChannel = "phone" | "virtual";

interface ChooseMeetingTypeModalProps {
  open: boolean;
  flow: MeetingFlow;
  onClose: () => void;
  /** Phone → phone session; virtual → web meeting (Zoom/Meet link) in Start/Schedule modal. */
  onContinue: (channel: MeetingChannel) => void;
}

export function ChooseMeetingTypeModal({
  open,
  flow,
  onClose,
  onContinue,
}: ChooseMeetingTypeModalProps) {
  const [selectedType, setSelectedType] = useState<"virtual" | "phone" | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleContinue = () => {
    if (!selectedType) return;
    onContinue(selectedType === "virtual" ? "virtual" : "phone");
    setSelectedType(null);
  };

  const title =
    flow === "start"
      ? "Choose meeting type to start"
      : flow === "schedule"
      ? "Choose meeting type to schedule"
      : "Choose meeting type";

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1100] flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="relative w-[90%] max-h-[90vh] max-w-[720px] overflow-y-auto rounded-2xl border border-border bg-card/95 p-10 shadow-[0_24px_70px_-26px_hsl(var(--foreground)/0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 cursor-pointer border-none bg-transparent text-2xl leading-none text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="mb-3 text-center text-2xl font-bold text-foreground md:text-3xl">
          Choose meeting type
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm md:text-base">
          Decide how you want to run this Tacit session. You can always change this later when we add
          more channels.
        </p>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Phone call card (primary option) */}
          <button
            type="button"
            onClick={() => setSelectedType("phone")}
            className={`flex cursor-pointer flex-col items-start gap-3 rounded-xl border bg-background/60 p-5 text-left transition-all hover:-translate-y-[1px] hover:bg-muted/35 ${
              selectedType === "phone"
                ? "border-ring ring-2 ring-ring/25 shadow-[0_12px_36px_-26px_hsl(var(--ring)/0.7)]"
                : "border-border hover:border-ring/35"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50 text-foreground">
                <Phone className="w-5 h-5" />
              </div>
              <div className="font-semibold text-foreground text-base md:text-lg">
                Phone call
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Use the existing Tacit phone workflow. The SME dials a number and speaks with your
              AI agent.
            </p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
              Available now
            </div>
          </button>

          {/* Virtual meeting card */}
          <button
            type="button"
            onClick={() => setSelectedType("virtual")}
            className={`flex cursor-pointer flex-col items-start gap-3 rounded-xl border bg-background/60 p-5 text-left transition-all hover:-translate-y-[1px] hover:bg-muted/35 ${
              selectedType === "virtual"
                ? "border-ring ring-2 ring-ring/25 shadow-[0_12px_36px_-26px_hsl(var(--ring)/0.7)]"
                : "border-border hover:border-ring/35"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50 text-foreground">
                <Video className="w-5 h-5" />
              </div>
              <div className="font-semibold text-foreground text-base md:text-lg">
                Virtual meeting
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Run this session over Meet, Zoom, or Teams. We&apos;ll handle invites and agenda
              prep for you.
            </p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
              Available now
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedType}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

