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
        className="bg-card border-2 border-primary rounded-2xl p-10 max-w-[720px] w-[90%] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 bg-transparent border-none text-muted-foreground text-2xl cursor-pointer transition-colors leading-none hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-3 text-center">
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
            className={`flex flex-col items-start text-left gap-3 p-5 rounded-xl border transition-all cursor-pointer bg-background/60 hover:bg-primary/5 ${
              selectedType === "phone"
                ? "border-primary ring-2 ring-primary/40 shadow-elegant"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
              Available now
            </div>
          </button>

          {/* Virtual meeting card */}
          <button
            type="button"
            onClick={() => setSelectedType("virtual")}
            className={`flex flex-col items-start text-left gap-3 p-5 rounded-xl border transition-all cursor-pointer bg-background/60 hover:bg-primary/5 ${
              selectedType === "virtual"
                ? "border-primary ring-2 ring-primary/40 shadow-elegant"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
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
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-elegant hover:bg-primary-glow hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

