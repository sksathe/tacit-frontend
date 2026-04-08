export type DispatchStepId =
  | "agent"
  | "mode"
  | "mission"
  | "input"
  | "outputContract"
  | "review"
  | "execution"
  | "outputReview"
  /** Eagle: single-screen upload → extract (logistics API); skips mode/mission wizard */
  | "eagleWorkspace";

/** Pre-launch wizard steps (hybrid mission brief). */
export const STEP_ORDER: DispatchStepId[] = [
  "agent",
  "mode",
  "mission",
  "input",
  "outputContract",
  "review",
];

/** Eagle: choose agent → upload & extract only (no mode / mission / launch wizard). */
export const STEP_ORDER_EAGLE: DispatchStepId[] = ["agent", "eagleWorkspace"];

/** Shown after the user launches from the review step. */
export const POST_LAUNCH_STEP_ORDER: DispatchStepId[] = ["execution", "outputReview"];

export const STEP_LABELS: Record<DispatchStepId, string> = {
  agent: "Agent",
  mode: "Mode",
  mission: "Mission",
  input: "Input",
  outputContract: "Output",
  review: "Review",
  execution: "Execution",
  outputReview: "Output review",
  eagleWorkspace: "Document",
};

export type MissionLaunchRecord = {
  id: string;
  agentId: string;
  modeId: string | null;
  missionTitle: string;
  createdAt: number;
};

const LAUNCH_STORAGE_KEY = "tacit-mission-launches";
const MAX_STORED_LAUNCHES = 12;

export function loadRecentLaunches(): MissionLaunchRecord[] {
  try {
    const raw = localStorage.getItem(LAUNCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MissionLaunchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistRecentLaunches(list: MissionLaunchRecord[]) {
  try {
    localStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED_LAUNCHES)));
  } catch {
    /* ignore */
  }
}

export type DispatchState = {
  currentStep: DispatchStepId;
  agentId: string | null;
  modeId: string | null;
  missionTitle: string;
  missionBrief: string;
  inputNotes: string;
  outputContractId: string | null;
  launched: boolean;
  /** Past session chosen for transcript-style automation (document execution path). */
  linkedSessionId: string | null;
};

export const initialDispatchState: DispatchState = {
  currentStep: "agent",
  agentId: null,
  modeId: null,
  missionTitle: "",
  missionBrief: "",
  inputNotes: "",
  outputContractId: null,
  launched: false,
  linkedSessionId: null,
};

export type DispatchAction =
  | { type: "SET_STEP"; step: DispatchStepId }
  | { type: "SELECT_AGENT"; agentId: string }
  | { type: "SELECT_MODE"; modeId: string | null }
  | {
      type: "SET_MISSION";
      missionTitle?: string;
      missionBrief?: string;
    }
  | { type: "SET_INPUT_NOTES"; inputNotes: string }
  | { type: "SET_OUTPUT_CONTRACT"; outputContractId: string | null }
  | { type: "SET_LINKED_SESSION"; sessionId: string | null }
  | { type: "NEW_MISSION" }
  | { type: "APPLY_RECENT"; payload: MissionLaunchRecord }
  | { type: "GO_BACK" }
  | { type: "GO_FORWARD" };

export function orderedSteps(state: DispatchState): DispatchStepId[] {
  if (state.agentId === "eagle") {
    return STEP_ORDER_EAGLE;
  }
  const pre = STEP_ORDER;
  return state.launched ? [...pre, ...POST_LAUNCH_STEP_ORDER] : pre;
}

function clampStepToOrder(state: DispatchState): DispatchStepId {
  const ord = orderedSteps(state);
  if (ord.includes(state.currentStep)) return state.currentStep;
  if (state.agentId === "eagle") return "eagleWorkspace";
  if (state.currentStep === "outputContract") return "input";
  return ord[0] ?? "agent";
}

export function dispatchReducer(state: DispatchState, action: DispatchAction): DispatchState {
  switch (action.type) {
    case "NEW_MISSION":
      return { ...initialDispatchState };
    case "SET_STEP": {
      const next = { ...state, currentStep: action.step };
      const step = clampStepToOrder(next);
      return step === next.currentStep ? next : { ...next, currentStep: step };
    }
    case "SELECT_AGENT": {
      const next: DispatchState = {
        ...state,
        agentId: action.agentId,
        modeId: null,
        linkedSessionId: null,
        ...(action.agentId === "eagle" ? { outputContractId: null } : {}),
      };
      if (action.agentId === "eagle") {
        return { ...next, currentStep: "eagleWorkspace" };
      }
      if (state.agentId === "eagle" && action.agentId !== "eagle") {
        return { ...next, currentStep: "agent" };
      }
      const step = clampStepToOrder({ ...next, currentStep: state.currentStep });
      return step === next.currentStep ? next : { ...next, currentStep: step };
    }
    case "SELECT_MODE":
      return { ...state, modeId: action.modeId, linkedSessionId: null };
    case "SET_MISSION":
      return {
        ...state,
        ...(action.missionTitle !== undefined ? { missionTitle: action.missionTitle } : {}),
        ...(action.missionBrief !== undefined ? { missionBrief: action.missionBrief } : {}),
      };
    case "SET_INPUT_NOTES":
      return { ...state, inputNotes: action.inputNotes };
    case "SET_OUTPUT_CONTRACT":
      return { ...state, outputContractId: action.outputContractId };
    case "SET_LINKED_SESSION":
      return { ...state, linkedSessionId: action.sessionId };
    case "APPLY_RECENT": {
      const { agentId, modeId, missionTitle } = action.payload;
      if (agentId === "eagle") {
        return {
          ...initialDispatchState,
          agentId: "eagle",
          modeId,
          missionTitle,
          linkedSessionId: null,
          currentStep: "eagleWorkspace",
        };
      }
      return {
        ...initialDispatchState,
        agentId,
        modeId,
        missionTitle,
        linkedSessionId: null,
        currentStep: modeId ? "mission" : "mode",
      };
    }
    case "GO_FORWARD": {
      const ord = orderedSteps(state);
      const idx = ord.indexOf(state.currentStep);
      if (idx < 0) return state;
      if (state.currentStep === "review" && !state.launched) {
        return {
          ...state,
          launched: true,
          currentStep: "execution",
        };
      }
      if (idx >= ord.length - 1) return state;
      return { ...state, currentStep: ord[idx + 1] };
    }
    case "GO_BACK": {
      if (state.agentId === "eagle" && state.currentStep === "eagleWorkspace") {
        return { ...state, currentStep: "agent", agentId: null, modeId: null };
      }
      const ord = orderedSteps(state);
      const idx = ord.indexOf(state.currentStep);
      if (idx <= 0) return state;
      if (state.currentStep === "execution") return state;
      if (state.currentStep === "outputReview") {
        return { ...state, currentStep: "execution" };
      }
      return { ...state, currentStep: ord[idx - 1] };
    }
    default:
      return state;
  }
}
