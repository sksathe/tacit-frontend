import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ManuFlowController } from "@/components/manu/ManuFlowController";
import { ManuMissionPicker } from "@/components/manu/ManuMissionPicker";
import { useManuFlow } from "@/components/manu/useManuFlow";

export interface ManuMissionBriefPanelProps {
  onMissionTitleChange?: (title: string | null) => void;
}

export function ManuMissionBriefPanel({ onMissionTitleChange }: ManuMissionBriefPanelProps) {
  const flow = useManuFlow("embedded");
  const { missionId, missionTitle, clearMission } = flow;

  useEffect(() => {
    onMissionTitleChange?.(missionId ? missionTitle : null);
  }, [missionId, missionTitle, onMissionTitleChange]);

  if (!missionId) {
    return (
      <div className="mission-brief-v4__manu-workspace">
        <ManuMissionPicker variant="mission-brief" onSelect={flow.handleMissionSelect} />
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
