import { useMemo, useState } from "react";
import { Eye, LineChart, Mail, Send, SendHorizonal, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ActiveCampaign, Prospect, ProspectStatus, SettingsState } from "../types";
import { EmailPreviewDialog } from "../EmailPreviewDialog";
import { EmptyState } from "../EmptyState";
import { sendEmail, sendAllEmails } from "@/lib/api";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/useCountUp";

interface PipelineTabProps {
  campaign: ActiveCampaign | null;
  prospects: Prospect[];
  settings: SettingsState;
  onUpdateProspect: (id: string, status: ProspectStatus) => void;
  onStartCampaign?: () => void;
}

const STATUS_META: Record<
  ProspectStatus,
  { label: string; dot: string; cls: string; glow: string }
> = {
  pending: {
    label: "En attente",
    dot: "bg-warning",
    cls: "bg-warning/15 text-warning border-warning/30",
    glow: "glow-warning",
  },
  sent: {
    label: "Envoyé",
    dot: "bg-success",
    cls: "bg-success/15 text-success border-success/30",
    glow: "glow-success",
  },
  error: {
    label: "Erreur",
    dot: "bg-destructive",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    glow: "glow-destructive",
  },
  draft: {
    label: "Brouillon",
    dot: "bg-foreground/40",
    cls: "bg-muted text-muted-foreground border-border",
    glow: "",
  },
};

function StatusBadge({ status }: { status: ProspectStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        meta.cls,
        meta.glow,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function AnimatedValue({ raw }: { raw: string }) {
  const match = raw.match(/^(\d+)(%?)$/);
  const target = match ? parseInt(match[1]) : null;
  const suffix = match ? match[2] : "";
  const count = useCountUp(target ?? 0, 1400);
  if (target === null) return <>{raw}</>;
  return (
    <>
      {count}
      {suffix}
    </>
  );
}

function MetricCard({
  label,
  value,
  Icon,
  delay,
}: {
  label: string;
  value: string;
  Icon: typeof Target;
  delay: number;
}) {
  return (
    <div
      className="glass glass-hover anim-fade-in flex items-center justify-between rounded-xl px-5 py-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div
          className="anim-pop mt-1 text-2xl font-bold text-foreground"
          style={{ animationDelay: `${delay + 100}ms` }}
        >
          <AnimatedValue raw={value} />
        </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export function PipelineTab({
  campaign,
  prospects,
  settings,
  onUpdateProspect,
  onStartCampaign,
}: PipelineTabProps) {
  const [dialogProspect, setDialogProspect] = useState<Prospect | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const stats = useMemo(() => {
    const total = prospects.length;
    const sent = prospects.filter((p) => p.status === "sent").length;
    const rate = total > 0 ? `${Math.round((sent / total) * 100)}%` : "0%";
    return { total, sent, rate };
  }, [prospects]);

  const handleSendAll = async () => {
    const pending = prospects.filter((p) => p.status !== "sent");
    if (pending.length === 0) return;
    setSendingAll(true);
    try {
      const result = await sendAllEmails(prospects, settings);
      result.results.forEach((r) => {
        onUpdateProspect(r.id, r.success ? "sent" : "error");
      });
      toast.success(
        `${result.sent} email(s) envoyé(s)${result.failed > 0 ? ` · ${result.failed} erreur(s)` : ""}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    } finally {
      setSendingAll(false);
    }
  };

  const handleQuickSend = async (p: Prospect) => {
    if (p.status === "sent" || sending) return;
    setSending(p.id);
    try {
      await sendEmail(p, settings);
      onUpdateProspect(p.id, "sent");
      toast.success(`Email envoyé à ${p.firstName} ${p.lastName}`);
    } catch (err) {
      onUpdateProspect(p.id, "error");
      const msg = err instanceof Error ? err.message : "Erreur d'envoi";
      toast.error(msg);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="anim-enter space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Campagne active
          </div>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            {campaign?.name ?? "Aucune campagne"}
          </h2>
        </div>
        {prospects.some((p) => p.status !== "sent") && prospects.length > 0 && (
          <Button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="rounded-lg bg-primary font-semibold text-primary-foreground shadow-[0_4px_16px_-4px_oklch(0.575_0.132_188_/_40%)] hover:brightness-105"
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            {sendingAll ? "Envoi en cours…" : "Tout envoyer"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Prospects trouvés" value={String(stats.total)} Icon={Target} delay={0} />
        <MetricCard label="Emails envoyés" value={String(stats.sent)} Icon={Mail} delay={120} />
        <MetricCard label="Taux d'envoi" value={stats.rate} Icon={LineChart} delay={240} />
      </div>

      <div
        className="glass anim-fade-in overflow-hidden rounded-xl"
        style={{ animationDelay: "280ms" }}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="px-4 text-muted-foreground">Prénom</TableHead>
              <TableHead className="text-muted-foreground">Nom</TableHead>
              <TableHead className="text-muted-foreground">Poste</TableHead>
              <TableHead className="text-muted-foreground">Entreprise</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Statut</TableHead>
              <TableHead className="pr-4 text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <EmptyState variant="pipeline" onAction={onStartCampaign} />
                </TableCell>
              </TableRow>
            )}
            {prospects.map((p, i) => (
              <TableRow
                key={p.id}
                className="anim-fade-in border-border hover:bg-muted/40 transition-colors"
                style={{ animationDelay: `${360 + i * 45}ms` }}
              >
                <TableCell className="px-4 font-medium text-foreground">{p.firstName}</TableCell>
                <TableCell className="text-foreground">{p.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{p.position}</TableCell>
                <TableCell className="font-medium text-foreground/85">{p.company}</TableCell>
                <TableCell className="font-mono text-[12px] text-muted-foreground">
                  {p.email}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-primary"
                      onClick={() => setDialogProspect(p)}
                      title="Voir l'email"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-success/10 hover:text-success"
                      onClick={() => handleQuickSend(p)}
                      disabled={p.status === "sent" || sending === p.id}
                      title="Envoyer"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmailPreviewDialog
        prospect={dialogProspect}
        settings={settings}
        open={dialogProspect !== null}
        onOpenChange={(o) => !o && setDialogProspect(null)}
        onSent={(p) => onUpdateProspect(p.id, "sent")}
      />
    </div>
  );
}
