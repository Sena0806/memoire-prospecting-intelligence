import type { Campaign, MemoryEntry, Prospect, SettingsState } from "./types";

export const DEFAULT_PITCH =
  "Centrale Nantes Études est une Junior-Entreprise d'ingénierie qui accompagne les entreprises dans leurs projets techniques : études mécaniques, analyses de données, développement logiciel.";

export const initialProspects: Prospect[] = [
  {
    id: "p1",
    firstName: "Jean-Marc",
    lastName: "Lefèvre",
    position: "Directeur Technique",
    company: "Daher Aéronautique",
    email: "jm.lefevre@daher.com",
    status: "pending",
    emailSubject: "Collaboration technique — Centrale Nantes Études",
    emailBody:
      "Bonjour Jean-Marc,\n\nVotre rôle de Directeur Technique chez Daher Aéronautique m'a particulièrement interpellé.\n\nCentrale Nantes Études accompagne les entreprises aéronautiques sur leurs études d'ingénierie. Nos élèves-ingénieurs interviennent en mode projet avec un livrable clair et un budget maîtrisé.\n\nSeriez-vous disponible pour un échange de 15 min ?\n\nL'équipe commerciale — Centrale Nantes Études",
  },
  {
    id: "p2",
    firstName: "Sophie",
    lastName: "Martin",
    position: "Responsable Innovation",
    company: "Manitou Group",
    email: "s.martin@manitou.com",
    status: "sent",
    emailSubject: "Partenariat innovation — Centrale Nantes Études",
    emailBody:
      "Bonjour Sophie,\n\nL'innovation que vous portez chez Manitou Group résonne avec les missions que nous menons.\n\nNous pourrions apporter une contribution utile sur vos projets techniques.\n\nL'équipe commerciale — Centrale Nantes Études",
  },
];

export const initialMemories: MemoryEntry[] = [
  {
    id: "m1",
    company: "Manitou Group",
    contact: "Sophie Martin",
    outcome: "signed",
    note: "Mission réalisée en 2024 : étude de faisabilité pour l'automatisation d'une ligne d'assemblage. Budget : 4 500€. Contact très réactif, préfère les échanges par email. Recontacter en septembre pour le nouveau projet usine 4.0.",
    addedBy: "Équipe 2024-2025",
    addedDate: "Mars 2025",
    campaignName: "Mécanique × Pays de la Loire",
  },
  {
    id: "m2",
    company: "Daher Aéronautique",
    contact: "Jean-Marc Lefèvre",
    outcome: "followup",
    note: "Premier contact en janvier 2025, intéressé par une étude thermique. A demandé un devis mais n'a pas donné suite. Relancer en Q3 avec la nouvelle offre simulation numérique.",
    addedBy: "Équipe 2024-2025",
    addedDate: "Février 2025",
    campaignName: "Aéronautique × Grand Ouest",
  },
  {
    id: "m3",
    company: "Naval Group",
    contact: "François Petit",
    outcome: "rejected",
    note: "Contacté 3 fois en 2024. Processus d'achat trop lourd pour des missions JE (seuil 10k€ minimum). Ne pas recontacter sauf si changement de politique.",
    addedBy: "Équipe 2023-2024",
    addedDate: "Juin 2024",
    campaignName: "Défense × Nantes",
  },
  {
    id: "m4",
    company: "Lacroix Electronics",
    contact: "Pierre Moreau",
    outcome: "signed",
    note: "2 missions réalisées : audit qualité (2023) et optimisation supply chain (2024). Très satisfait. Contact fidèle, ambassadeur potentiel. Proposer un partenariat annuel.",
    addedBy: "Équipe 2023-2024",
    addedDate: "Décembre 2024",
    campaignName: "Électronique × Grand Ouest",
  },
  {
    id: "m5",
    company: "Airbus Atlantic",
    contact: "Nathalie Laurent",
    outcome: "followup",
    note: "Rencontrée au forum entreprises ECN en novembre 2025. Intérêt pour des analyses de données sur la fatigue matériaux. En attente de validation budget interne.",
    addedBy: "Équipe 2025-2026",
    addedDate: "Novembre 2025",
    campaignName: "Forum ECN 2025",
  },
];

export const recentCampaigns: Campaign[] = [
  {
    id: "c1",
    name: "Mécanique × Nantes",
    sector: "Mécanique",
    area: "Nantes",
    date: "12 avr. 2026",
    prospectCount: 18,
  },
  {
    id: "c2",
    name: "Tech × Rennes",
    sector: "Tech",
    area: "Rennes",
    date: "28 mars 2026",
    prospectCount: 24,
  },
  {
    id: "c3",
    name: "Conseil × Grand Ouest",
    sector: "Conseil",
    area: "Grand Ouest",
    date: "15 mars 2026",
    prospectCount: 12,
  },
];

export const defaultSettings: SettingsState = {
  apiBaseUrl: "https://memoire-prospecting-intelligence-production.up.railway.app",
  fromEmail: "onboarding@resend.dev",
  demoRedirect: "",
  bedrockModel: "Claude 3.5 Sonnet",
  bedrockRegion: "us-west-2",
  jeName: "Centrale Nantes Études",
  jePitch:
    "Centrale Nantes Études est la Junior-Entreprise de Centrale Nantes. Nous accompagnons les entreprises sur leurs études d'ingénierie : mécanique, data, simulation et développement logiciel. Nos consultants — élèves-ingénieurs sélectionnés — délivrent des livrables professionnels encadrés par notre équipe permanente.",
  jeEmail: "contact@centralenantes-etudes.fr",
  jeSignature: "L'équipe commerciale — Centrale Nantes Études",
};

export function todayLabelFr(): string {
  const months = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
