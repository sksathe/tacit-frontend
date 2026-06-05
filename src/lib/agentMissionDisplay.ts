import { getDispatchProfile } from "@/features/dispatch/catalog";
import type { TacitAgent } from "@/data/agents";
import { EAGLE_LOGISTICS_MISSION_OPTIONS } from "@/lib/eagleLogisticsMissions";
import { MANU_MISSIONS } from "@/data/manuMissions";

export type AgentCardDisplay = {
  modeChips: string[];
  missionLines: string;
  inLines: string;
  outLines: string;
};

function joinDot(items: string[], max = 3): string {
  const slice = items.slice(0, max);
  const joined = slice.join(" · ");
  if (items.length > max) return `${joined} · …`;
  return joined;
}

export function getAgentCardDisplay(agent: TacitAgent): AgentCardDisplay {
  const profile = getDispatchProfile(agent.id);

  if (agent.id === "eagle") {
    return {
      modeChips: ["Execute"],
      missionLines: joinDot(EAGLE_LOGISTICS_MISSION_OPTIONS.map((o) => o.title)),
      inLines: "PDF · PNG · JPEG",
      outLines: "Structured fields · Line items · JSON / Excel export",
    };
  }

  if (agent.id === "manu") {
    const primary = MANU_MISSIONS[0];
    return {
      modeChips: ["Execute"],
      missionLines: joinDot(MANU_MISSIONS.map((m) => m.title)),
      inLines: "Source document bundle",
      outLines: joinDot(primary?.outputs ?? ["Manual draft", "Traceability matrix", "Compliance checklist"]),
    };
  }

  const modeChips = profile?.modes?.slice(0, 2).map((m) => m.label) ?? [];
  const missionLines =
    profile?.outputContracts?.slice(0, 2).map((o) => o.label).join(" · ") ??
    joinDot(agent.specialties);
  const inLines = "Meeting link · Session recording · Stakeholder notes";
  const outLines =
    profile?.outputContracts?.slice(0, 3).map((o) => o.label).join(" · ") ??
    "Mission brief · Action items · Audit artifacts";

  return { modeChips, missionLines, inLines, outLines };
}
