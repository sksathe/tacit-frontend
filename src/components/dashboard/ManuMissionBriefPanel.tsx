import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MANU_MISSIONS } from "@/data/manuMissions";
import { ManuFlowController } from "@/components/manu/ManuFlowController";
import { ManuMissionPicker } from "@/components/manu/ManuMissionPicker";
import { useManuFlow } from "@/components/manu/useManuFlow";

export interface ManuMissionBriefPanelProps {
  onMissionTitleChange?: (title: string | null) => void;
  onMissionSelect?: (missionId: string, missionTitle: string) => void;
  resumeRunId?: string | null;
  resumeMissionId?: string | null;
  onResumeComplete?: () => void;
}

export function ManuMissionBriefPanel({
  onMissionTitleChange,
  onMissionSelect,
  resumeRunId,
  resumeMissionId,
  onResumeComplete,
}: ManuMissionBriefPanelProps) {
  const flow = useManuFlow("embedded");
  const { missionId, missionTitle, clearMission, resumeRun } = flow;

  useEffect(() => {
    onMissionTitleChange?.(missionId ? missionTitle : null);
  }, [missionId, missionTitle, onMissionTitleChange]);

  useEffect(() => {
    if (!resumeRunId || !resumeMissionId) return;
    void resumeRun(resumeRunId, resumeMissionId).finally(() => {
      onResumeComplete?.();
    });
  }, [resumeRunId, resumeMissionId, resumeRun, onResumeComplete]);

  if (!missionId) {
    return (
      <div className="mission-brief-v4__manu-workspace">
        <ManuMissionPicker
          variant="mission-brief"
          onSelect={(id) => {
            flow.handleMissionSelect(id);
            const title = MANU_MISSIONS.find((m) => m.id === id)?.title ?? id;
            onMissionSelect?.(id, title);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mission-brief-v4__manu-workspace">
      <div className="mission-brief-v4__eagle-mission-row">
        <div className="mission-brief-v4__eagle-mission-chip">
          <span className="mission-brief-v4__eagle-mission-chip-label">Mission</span>
          <span>{missionTitle}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-primary/35 bg-primary/5 text-sm"
          onClick={clearMission}
        >
          Change mission
        </Button>
      </div>
      <ManuFlowController flow={flow} />
    </div>
  );
}
