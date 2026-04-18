export type TabKey = "campaign" | "pipeline" | "memory" | "settings";

export type ProspectStatus = "draft" | "pending" | "sent" | "error";

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  company: string;
  email: string;
  status: ProspectStatus;
  emailSubject: string;
  emailBody: string;
}

export type MemoryOutcome = "signed" | "followup" | "rejected";

export interface MemoryEntry {
  id: string;
  company: string;
  contact: string;
  outcome: MemoryOutcome;
  note: string;
  addedBy: string;
  addedDate: string;
  campaignName?: string;
}

export interface Campaign {
  id: string;
  name: string;
  sector: string;
  area: string;
  date: string;
  prospectCount: number;
}

export type EmailTone =
  | "Professionnel et formel"
  | "Professionnel et amical"
  | "Direct et concis";

export interface CampaignForm {
  sector: string;
  area: string;
  count: number;
  pitch: string;
  tone: EmailTone;
}

export interface ActiveCampaign {
  name: string;
  sector: string;
  area: string;
  pitch: string;
  tone: EmailTone;
}

export interface SettingsState {
  apiBaseUrl: string;
  fromEmail: string;
  demoRedirect: string;
  bedrockModel: string;
  bedrockRegion: string;
  jeName: string;
  jePitch: string;
  jeEmail: string;
  jeSignature: string;
}
