import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./Sidebar";
import { TabNav } from "./TabNav";
import { NewCampaignTab } from "./tabs/NewCampaignTab";
import { PipelineTab } from "./tabs/PipelineTab";
import { MemoryTab } from "./tabs/MemoryTab";
import { SettingsTab } from "./tabs/SettingsTab";
import {
  defaultSettings,
  initialProspects,
  initialMemories,
  recentCampaigns,
  todayLabelFr,
} from "./data";
import type {
  ActiveCampaign,
  Campaign,
  CampaignForm,
  MemoryEntry,
  Prospect,
  ProspectStatus,
  SettingsState,
  TabKey,
} from "./types";
import type { CampaignResponse } from "@/lib/api";
import { fetchMemories, addMemory } from "@/lib/api";
import { toast } from "sonner";

// Default campaign that matches the initialProspects demo data
const DEFAULT_CAMPAIGN: ActiveCampaign = {
  name: "Aéronautique & Industrie × Grand Ouest",
  sector: "Industrie mécanique",
  area: "Nantes, Pays de la Loire",
  pitch: defaultSettings.jePitch,
  tone: "Professionnel et amical",
};

export function MemoireApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("campaign");
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [activeCampaign, setActiveCampaign] = useState<ActiveCampaign | null>(DEFAULT_CAMPAIGN);
  const [campaigns, setCampaigns] = useState<Campaign[]>(recentCampaigns);

  useEffect(() => {
    if (!settings.apiBaseUrl) return;
    setMemoriesLoading(true);
    fetchMemories(settings.apiBaseUrl)
      .then(setMemories)
      .catch(() => {
        // Silently fall back to demo data when Google Sheets is not configured
        setMemories(initialMemories);
      })
      .finally(() => setMemoriesLoading(false));
  }, [settings.apiBaseUrl]);

  const handleLaunch = (form: CampaignForm, result: CampaignResponse) => {
    const newCampaign: Campaign = {
      id: `c-${Date.now()}`,
      name: result.campaignName,
      sector: form.sector,
      area: form.area,
      date: todayLabelFr(),
      prospectCount: result.prospects.length,
    };
    setCampaigns((list) => [newCampaign, ...list]);
    setActiveCampaign({
      name: result.campaignName,
      sector: form.sector,
      area: form.area,
      pitch: form.pitch,
      tone: form.tone,
    });
    setProspects(result.prospects);
    setActiveTab("pipeline");
  };

  const handleCampaignClick = (c: Campaign) => {
    setActiveCampaign({
      name: `${c.name} — ${c.date}`,
      sector: c.sector,
      area: c.area,
      pitch: settings.jePitch,
      tone: "Professionnel et amical",
    });
    setProspects(initialProspects);
    setActiveTab("pipeline");
  };

  const updateProspect = (id: string, status: ProspectStatus) => {
    setProspects((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handleAddMemory = async (m: MemoryEntry) => {
    setMemories((list) => [m, ...list]);
    try {
      await addMemory(m, settings.apiBaseUrl);
      toast.success("Entrée ajoutée à la mémoire collective");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement";
      toast.error(`Mémoire non sauvegardée : ${msg}`);
      setMemories((list) => list.filter((e) => e.id !== m.id));
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCampaignClick={handleCampaignClick}
        campaigns={campaigns}
      />

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
          <TabNav active={activeTab} onChange={setActiveTab} />
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {todayLabelFr()}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {activeTab === "campaign" && (
            <NewCampaignTab settings={settings} onLaunch={handleLaunch} />
          )}
          {activeTab === "pipeline" && (
            <PipelineTab
              campaign={activeCampaign}
              prospects={prospects}
              settings={settings}
              onUpdateProspect={updateProspect}
              onStartCampaign={() => setActiveTab("campaign")}
            />
          )}
          {activeTab === "memory" && (
            <MemoryTab memories={memories} loading={memoriesLoading} onAdd={handleAddMemory} />
          )}
          {activeTab === "settings" && <SettingsTab settings={settings} onChange={setSettings} />}
        </div>
      </main>

      <Toaster theme="light" position="bottom-right" />
    </div>
  );
}
