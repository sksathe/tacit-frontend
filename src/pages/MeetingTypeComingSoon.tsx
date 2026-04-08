import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const MeetingTypeComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />

      <main className="max-w-[960px] mx-auto px-8 py-16">
        <div className="text-center mb-10">
          <h1 className="mb-4 text-3xl font-extrabold text-primary md:text-4xl">
            Virtual meetings are coming soon
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-[640px] mx-auto">
            We&apos;re adding native support for Meet, Zoom, and Teams so you can run Tacit sessions
            directly from your video calls. In the meantime, you can start today using the phone
            call workflow.
          </p>
        </div>


        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg text-sm md:text-base font-semibold bg-primary text-primary-foreground shadow-elegant hover:bg-primary-glow hover:shadow-glow transition-all"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-lg text-sm md:text-base font-medium border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Use phone call workflow instead
          </button>
        </div>
      </main>
    </div>
  );
};

export default MeetingTypeComingSoon;

