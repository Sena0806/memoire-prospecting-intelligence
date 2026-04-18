import { useMemo, useState } from "react";
import { Loader2, Plus, Search, User2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MemoryEntry, MemoryOutcome } from "../types";
import { AddMemoryDialog } from "../AddMemoryDialog";
import { EmptyState } from "../EmptyState";

interface MemoryTabProps {
  memories: MemoryEntry[];
  loading?: boolean;
  onAdd: (m: MemoryEntry) => void;
}

const OUTCOME_META: Record<MemoryOutcome, { label: string; cls: string; glow: string }> = {
  signed: {
    label: "✅ Client signé",
    cls: "bg-success/15 text-success border-success/30",
    glow: "glow-success",
  },
  followup: {
    label: "⏳ Relance prévue",
    cls: "bg-warning/15 text-warning border-warning/30",
    glow: "glow-warning",
  },
  rejected: {
    label: "❌ Pas intéressé",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    glow: "",
  },
};

export function MemoryTab({ memories, loading = false, onAdd }: MemoryTabProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memories;
    return memories.filter((m) =>
      [m.company, m.contact, m.note, m.campaignName ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [memories, query]);

  const isEmpty = memories.length === 0;
  const isSearchEmpty = !isEmpty && filtered.length === 0;

  return (
    <div className="anim-enter relative">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">Mémoire collective</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La connaissance accumulée par toutes les équipes, instantanément consultable.
        </p>
      </div>

      {!isEmpty && (
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher… (entreprise, contact, note)"
            className="h-11 bg-card pl-10"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement de la mémoire…
        </div>
      ) : isEmpty ? (
        <EmptyState variant="memory-empty" onAction={() => setOpen(true)} />
      ) : isSearchEmpty ? (
        <EmptyState variant="memory-search" />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20 lg:grid-cols-2">
          {filtered.map((m, i) => {
            const meta = OUTCOME_META[m.outcome];
            return (
              <div
                key={m.id}
                className="glass glass-hover anim-fade-in rounded-xl p-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-foreground">{m.company}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{m.contact}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      meta.cls,
                      meta.glow,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                {m.campaignName && (
                  <div className="mt-3 inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.campaignName}
                  </div>
                )}

                <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{m.note}</p>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <User2 className="h-3 w-3" />
                  <span>Ajouté par {m.addedBy}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
                  <span>{m.addedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_-2px_oklch(0.575_0.132_188_/_50%)] hover:brightness-105"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddMemoryDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={(m) => {
          onAdd(m);
          setOpen(false);
        }}
      />
    </div>
  );
}
