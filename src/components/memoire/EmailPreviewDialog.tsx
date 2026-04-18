import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import type { Prospect, SettingsState } from "./types";
import { sendEmail } from "@/lib/api";
import { toast } from "sonner";

interface EmailPreviewDialogProps {
  prospect: Prospect | null;
  settings: SettingsState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: (prospect: Prospect) => void;
}

export function EmailPreviewDialog({
  prospect,
  settings,
  open,
  onOpenChange,
  onSent,
}: EmailPreviewDialogProps) {
  const [sending, setSending] = useState(false);

  if (!prospect) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmail(prospect, settings);
      toast.success(`Email envoyé à ${prospect.firstName} ${prospect.lastName}`);
      onSent(prospect);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'envoi";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Aperçu de l'email</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-muted-foreground">De</span>
            <span className="font-mono text-[12px] text-foreground/80">{settings.fromEmail}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-muted-foreground">À</span>
            <span className="font-mono text-[12px] font-medium text-foreground">
              {prospect.email}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-muted-foreground">Objet</span>
            <span className="font-semibold text-foreground">{prospect.emailSubject}</span>
          </div>
          <div className="border-t border-border pt-3">
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground/85">
              {prospect.emailBody}
            </pre>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Généré par Amazon Bedrock · Envoi via Resend
        </p>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || prospect.status === "sent"}
            className="rounded-lg bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_oklch(0.575_0.132_188_/_40%)] hover:brightness-105"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Approuver et Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
