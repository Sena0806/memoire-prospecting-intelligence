import { cn } from "@/lib/utils";
import type { TabKey } from "./types";

interface TabNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "campaign", label: "Nouvelle Campagne" },
  { key: "pipeline", label: "Pipeline" },
  { key: "memory", label: "Mémoire" },
  { key: "settings", label: "Paramètres" },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
