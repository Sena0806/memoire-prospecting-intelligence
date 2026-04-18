import type { CampaignForm, MemoryEntry, Prospect, SettingsState } from "@/components/memoire/types";

export interface CampaignResponse {
  campaignName: string;
  prospects: Prospect[];
}

export async function runCampaign(
  form: CampaignForm,
  settings: SettingsState,
): Promise<CampaignResponse> {
  const res = await fetch(`${settings.apiBaseUrl}/api/run-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sector: form.sector,
      area: form.area,
      count: form.count,
      pitch: form.pitch,
      tone: form.tone,
      je_name: settings.jeName,
      je_email: settings.jeEmail,
      je_signature: settings.jeSignature,
      bedrock_model: settings.bedrockModel,
      bedrock_region: settings.bedrockRegion,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur lors de la prospection");
  }

  return res.json();
}

export async function sendEmail(
  prospect: Prospect,
  settings: SettingsState,
): Promise<void> {
  const res = await fetch(`${settings.apiBaseUrl}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to_email: prospect.email,
      from_email: settings.fromEmail,
      subject: prospect.emailSubject,
      body: prospect.emailBody,
      demo_redirect: settings.demoRedirect,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur lors de l'envoi");
  }
}

export interface SendAllResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface SendAllResponse {
  sent: number;
  failed: number;
  results: SendAllResult[];
}

export async function sendAllEmails(
  prospects: Prospect[],
  settings: SettingsState,
): Promise<SendAllResponse> {
  const res = await fetch(`${settings.apiBaseUrl}/api/send-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prospects,
      from_email: settings.fromEmail,
      demo_redirect: settings.demoRedirect,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur lors de l'envoi groupé");
  }

  return res.json();
}

export async function fetchMemories(apiBaseUrl: string): Promise<MemoryEntry[]> {
  const res = await fetch(`${apiBaseUrl}/api/memories`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur lors du chargement de la mémoire");
  }
  return res.json();
}

export async function addMemory(entry: MemoryEntry, apiBaseUrl: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/api/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...entry,
      campaignName: entry.campaignName ?? "",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur lors de l'ajout à la mémoire");
  }
}
