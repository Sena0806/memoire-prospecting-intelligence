import { useState } from "react";
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
import type { SettingsState } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface SettingsTabProps {
  settings: SettingsState;
  onChange: (next: SettingsState) => void;
}

function StatusDot({ tone }: { tone: "success" | "destructive" }) {
  const Icon = tone === "success" ? CheckCircle : XCircle;
  return (
    <Icon
      className={cn(
        "h-4 w-4",
        tone === "success" ? "text-success" : "text-destructive",
      )}
    />
  );
}

function SectionCard({
  title,
  status,
  statusLabel,
  children,
  delay,
}: {
  title: string;
  status: "success" | "destructive";
  statusLabel: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="glass anim-fade-in rounded-xl p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-foreground/75">
          <StatusDot tone={status} />
          {statusLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

export function SettingsTab({ settings, onChange }: SettingsTabProps) {
  const [local, setLocal] = useState<SettingsState>(settings);
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "error">("unknown");

  const update = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) =>
    setLocal((s) => ({ ...s, [k]: v }));

  const save = () => {
    onChange(local);
    toast.success("Paramètres sauvegardés");
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${local.apiBaseUrl}/health`);
      if (res.ok) {
        setApiStatus("ok");
        toast.success("Backend connecté ✓");
      } else {
        setApiStatus("error");
        toast.error("Backend inaccessible");
      }
    } catch {
      setApiStatus("error");
      toast.error("Impossible de joindre le backend");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="anim-enter mx-auto max-w-3xl space-y-5 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Paramètres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez vos outils et configurez votre Junior-Entreprise.
        </p>
      </div>

      {/* Backend API */}
      <SectionCard
        title="Backend API"
        status={apiStatus === "ok" ? "success" : "destructive"}
        statusLabel={apiStatus === "ok" ? "Connecté" : apiStatus === "error" ? "Erreur" : "Non testé"}
        delay={0}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="api-url">URL du backend</Label>
            <Input
              id="api-url"
              value={local.apiBaseUrl}
              onChange={(e) => update("apiBaseUrl", e.target.value)}
              placeholder="http://localhost:8000"
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-foreground/40">
              En prod, remplacez par l'URL ngrok ou votre domaine.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-lg border-border/70"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? "Test en cours…" : "Tester la connexion"}
          </Button>
        </div>
      </SectionCard>

      {/* Amazon Bedrock */}
      <SectionCard
        title="Amazon Bedrock"
        status="success"
        statusLabel="Actif"
        delay={150}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">Modèle Claude</Label>
            <Select value={local.bedrockModel} onValueChange={(v) => update("bedrockModel", v)}>
              <SelectTrigger id="model" className="bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (recommandé)</SelectItem>
                <SelectItem value="Claude 3 Haiku">Claude 3 Haiku (plus rapide)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Région AWS</Label>
            <Select value={local.bedrockRegion} onValueChange={(v) => update("bedrockRegion", v)}>
              <SelectTrigger id="region" className="bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-west-2">us-west-2 (Oregon)</SelectItem>
                <SelectItem value="us-east-1">us-east-1 (Virginia)</SelectItem>
                <SelectItem value="us-east-2">us-east-2 (Ohio)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Email sending */}
      <SectionCard
        title="Envoi d'emails (Resend)"
        status="success"
        statusLabel="Configuré"
        delay={250}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-email">Adresse d'expédition</Label>
            <Input
              id="from-email"
              type="email"
              value={local.fromEmail}
              onChange={(e) => update("fromEmail", e.target.value)}
              placeholder="onboarding@resend.dev"
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-foreground/40">
              Sans domaine vérifié : utilisez onboarding@resend.dev.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-redirect">Redirection démo (facultatif)</Label>
            <Input
              id="demo-redirect"
              type="email"
              value={local.demoRedirect}
              onChange={(e) => update("demoRedirect", e.target.value)}
              placeholder="votre@email.com"
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-foreground/40">
              Si renseigné, tous les emails sont redirigés vers cette adresse avec le destinataire réel en objet — idéal pour les démonstrations.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* JE Profile */}
      <SectionCard
        title="Profil de la Junior-Entreprise"
        status="success"
        statusLabel="À jour"
        delay={350}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="je-name">Nom de la JE</Label>
              <Input
                id="je-name"
                value={local.jeName}
                onChange={(e) => update("jeName", e.target.value)}
                className="bg-background/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="je-email">Email de contact JE</Label>
              <Input
                id="je-email"
                type="email"
                value={local.jeEmail}
                onChange={(e) => update("jeEmail", e.target.value)}
                className="bg-background/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="je-pitch">Pitch par défaut</Label>
            <Textarea
              id="je-pitch"
              rows={4}
              value={local.jePitch}
              onChange={(e) => update("jePitch", e.target.value)}
              className="resize-none bg-background/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="je-sig">Signature</Label>
            <Input
              id="je-sig"
              value={local.jeSignature}
              onChange={(e) => update("jeSignature", e.target.value)}
              className="bg-background/60"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={save}
          className="rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:brightness-110"
        >
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
}
