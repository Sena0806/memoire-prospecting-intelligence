import { Brain, Rocket, Search, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyVariant = "pipeline" | "memory-empty" | "memory-search";

interface EmptyStateProps {
  variant: EmptyVariant;
  onAction?: () => void;
}

const CONFIG: Record<
  EmptyVariant,
  {
    Icon: LucideIcon;
    imageSrc?: string;
    title: string;
    description: string;
    action: string | null;
    iconCls: string;
    ringCls: string;
  }
> = {
  pipeline: {
    Icon: Rocket,
    imageSrc: "/illustrations/empty-pipeline.png",
    title: "Aucune campagne active",
    description:
      "Lancez votre première campagne pour découvrir des prospects qualifiés et générer des emails personnalisés.",
    action: "Nouvelle Campagne",
    iconCls: "text-primary",
    ringCls: "bg-accent",
  },
  "memory-empty": {
    Icon: Brain,
    imageSrc: "/illustrations/empty-memory.png",
    title: "Mémoire collective vide",
    description:
      "Ajoutez vos premiers retours d'expérience pour enrichir la connaissance collective de l'équipe.",
    action: "Ajouter une entrée",
    iconCls: "text-primary",
    ringCls: "bg-accent",
  },
  "memory-search": {
    Icon: Search,
    title: "Aucun résultat",
    description: "Essayez de modifier votre recherche ou d'élargir les critères.",
    action: null,
    iconCls: "text-muted-foreground",
    ringCls: "bg-muted",
  },
};

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const { Icon, imageSrc, title, description, action, iconCls, ringCls } = CONFIG[variant];

  return (
    <div className="anim-fade-in col-span-full flex flex-col items-center justify-center py-24 text-center">
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt="" 
          className="mb-6 h-20 w-20 object-contain" 
          fetchPriority="low" 
          loading="lazy" 
        />
      ) : (
        <div className="relative mb-6">
          <div
            className={`absolute inset-0 -m-3 rounded-full opacity-40 ${ringCls}`}
          />
          <div
            className={`absolute inset-0 -m-6 rounded-full opacity-20 ${ringCls}`}
          />
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-full ${ringCls}`}
          >
            <Icon className={`h-9 w-9 ${iconCls}`} />
          </div>
        </div>
      )}

      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

      {action && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_oklch(0.575_0.132_188_/_40%)] hover:brightness-105"
        >
          {action}
        </Button>
      )}
    </div>
  );
}
