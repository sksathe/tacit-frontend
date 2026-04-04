/** Passed when opening Start/Schedule session modals from Mission Brief or meeting chooser. */
export type SessionModalPrefill = {
  initialSessionTitle?: string;
  initialAgentId?: string;
  initialMeetingMode?: "phone" | "web";
  initialSessionNotes?: string;
};
