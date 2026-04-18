import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MemoryEntry, MemoryOutcome } from "./types";

interface AddMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (memory: MemoryEntry) => void;
  addedBy?: string;
}

export function AddMemoryDialog({
  open,
  onOpenChange,
  onAdd,
  addedBy = "Équipe 2025-2026",
}: AddMemoryDialogProps) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [outcome, setOutcome] = useState<MemoryOutcome>("followup");
  const [note, setNote] = useState("");

  const reset = () => {
    setCompany("");
    setContact("");
    setOutcome("followup");
    setNote("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `m${Date.now()}`,
      company,
      contact,
      outcome,
      note,
      addedBy,
      addedDate: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Nouvelle entrée mémoire
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-company">Entreprise</Label>
            <Input
              id="m-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-contact">Contact</Label>
            <Input
              id="m-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-outcome">Résultat</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as MemoryOutcome)}>
              <SelectTrigger id="m-outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signed">✅ Client signé</SelectItem>
                <SelectItem value="followup">⏳ Relance prévue</SelectItem>
                <SelectItem value="rejected">❌ Pas intéressé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-note">Note</Label>
            <Textarea
              id="m-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="rounded-lg bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_oklch(0.575_0.132_188_/_40%)] hover:brightness-105"
            >
              Ajouter à la mémoire
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
