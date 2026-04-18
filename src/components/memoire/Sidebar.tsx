import { BarChart3, Brain, FilePlus2, Settings as SettingsIcon, Sparkles } from "lucide-react";
import type { Campaign, TabKey } from "./types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCampaignClick: (campaign: Campaign) => void;
  campaigns: Campaign[];
}

const navItems: { key: TabKey; label: string; Icon: typeof FilePlus2 }[] = [
  { key: "campaign", label: "Nouvelle Campagne", Icon: FilePlus2 },
  { key: "pipeline", label: "Pipeline", Icon: BarChart3 },
  { key: "memory", label: "Mémoire", Icon: Brain },
  { key: "settings", label: "Paramètres", Icon: SettingsIcon },
];

export function Sidebar({ activeTab, onTabChange, onCampaignClick, campaigns }: SidebarProps) {
  return (
    <aside className="sidebar-mesh flex h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="anim-pulse-ring flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[17px] font-bold leading-none tracking-tight text-foreground">
              Mémoire
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Prospecting Intelligence
            </div>
          </div>
        </div>
        <hr className="gold-rule mt-4" />
      </div>

      {/* Nav */}
      <nav className="px-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onTabChange(key)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-primary"
                        : "text-muted-foreground/70 group-hover:text-foreground/70",
                    )}
                  />
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Recent campaigns */}
      <div className="mt-6 px-5">
        <hr className="gold-rule mb-4" />
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Campagnes récentes
        </h3>
        <ul className="space-y-0.5">
          {campaigns.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onCampaignClick(c)}
                className="group w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                <div className="text-[13px] font-medium text-foreground/80 group-hover:text-primary">
                  {c.name}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{c.date}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
                  <span>{c.prospectCount} prospects</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom team card */}
      <div className="relative mt-auto overflow-hidden p-4">
        {/* Optional decorative texture */}
        <img
          src="/illustrations/sidebar-texture.png"
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-50 mix-blend-multiply dark:mix-blend-screen"
          fetchPriority="low"
          loading="lazy"
        />

        <div className="relative z-10 rounded-lg border border-border bg-muted/60 px-4 py-3 backdrop-blur-sm">
          <div className="text-sm font-semibold text-foreground">Équipe 2025–2026</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            4 campagnes · 67 prospects · 3 clients
          </div>
        </div>
        <div className="relative z-10 mt-3 px-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">
          Propulsé par AWS Bedrock
        </div>
      </div>
    </aside>
  );
}
