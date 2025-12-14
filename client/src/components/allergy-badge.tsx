import { AlertTriangle } from "lucide-react";

interface AllergyBadgeProps {
  allergies: string | null;
  compact?: boolean;
}

export function AllergyBadge({ allergies, compact = false }: AllergyBadgeProps) {
  if (!allergies) return null;
  
  return (
    <div 
      className={`flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      }`}
      data-testid="allergy-badge"
    >
      <AlertTriangle className={compact ? "h-3 w-3" : "h-4 w-4"} />
      <span className="font-medium">{compact ? "Allergies" : `Allergies: ${allergies}`}</span>
    </div>
  );
}
