import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";
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
import type { CampaignForm, EmailTone, SettingsState } from "../types";
import { runCampaign } from "@/lib/api";
import type { CampaignResponse } from "@/lib/api";
import { toast } from "sonner";

interface NewCampaignTabProps {
  settings: SettingsState;
  onLaunch: (form: CampaignForm, result: CampaignResponse) => void;
}

const TONES: EmailTone[] = [
  "Professionnel et formel",
  "Professionnel et amical",
  "Direct et concis",
];

const STEPS = [
  "Recherche des entreprises cibles…",
  "Enrichissement des contacts…",
  "Génération des emails avec Amazon Bedrock…",
  "Finalisation de la campagne…",
];

export function NewCampaignTab({ settings, onLaunch }: NewCampaignTabProps) {
  const [sector, setSector] = useState("Industrie mécanique");
  const [area, setArea] = useState("Nantes, Pays de la Loire");
  const [count, setCount] = useState(10);
  const [pitch, setPitch] = useState(settings.jePitch);
  const [tone, setTone] = useState<EmailTone>("Professionnel et amical");
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setStepIdx(0);

    // Animate through steps while waiting for API
    const interval = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 2500);

    try {
      const result = await runCampaign({ sector, area, count, pitch, tone }, settings);
      clearInterval(interval);
      toast.success(
        <div className="flex items-center gap-3">
          <img 
            src="/illustrations/campaign-success.png" 
            alt="" 
            className="h-10 w-10 object-contain" 
            fetchPriority="low" 
            loading="lazy" 
          />
          <span>{result.prospects.length} prospects trouvés !</span>
        </div>
      );
      onLaunch({ sector, area, count, pitch, tone }, result);
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="anim-enter flex w-full justify-center">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">Lancer une campagne</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Définissez votre cible et l'agent Mémoire s'occupe du reste.
          </p>
        </div>

        <form onSubmit={submit} className="glass space-y-5 rounded-xl p-7 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="sector" className="text-foreground/80">
              Secteur d'activité
            </Label>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="ex: Industrie mécanique, Conseil en ingénierie…"
              className="h-10 bg-background/60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area" className="text-foreground/80">
              Zone géographique
            </Label>
            <Input
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="ex: Nantes, Grand Ouest, Pays de la Loire…"
              className="h-10 bg-background/60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count" className="text-foreground/80">
              Nombre de prospects (5–25)
            </Label>
            <Input
              id="count"
              type="number"
              min={5}
              max={25}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-10 bg-background/60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pitch" className="text-foreground/80">
              Pitch de la Junior-Entreprise
            </Label>
            <Textarea
              id="pitch"
              rows={4}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="resize-none bg-background/60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone" className="text-foreground/80">
              Ton de l'email
            </Label>
            <Select value={tone} onValueChange={(v) => setTone(v as EmailTone)}>
              <SelectTrigger id="tone" className="h-10 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-primary">{STEPS[stepIdx]}</p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_oklch(0.575_0.132_188_/_45%)] hover:brightness-105"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Prospection en cours…
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Lancer la Prospection
              </>
            )}
          </Button>

          <p className="pt-1 text-center text-[11px] text-foreground/45">
            Les emails sont générés par Amazon Bedrock (Claude) et personnalisés pour chaque prospect.
          </p>
        </form>
      </div>
    </div>
  );
}
