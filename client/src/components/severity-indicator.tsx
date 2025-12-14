import type { AlertSeverity } from "@shared/schema";

interface SeverityIndicatorProps {
  severity: AlertSeverity;
  showLabel?: boolean;
}

const severityConfig: Record<AlertSeverity, { color: string; label: string }> = {
  critical: {
    color: "bg-red-500",
    label: "Critical",
  },
  high: {
    color: "bg-amber-500",
    label: "High",
  },
  medium: {
    color: "bg-yellow-500",
    label: "Medium",
  },
  low: {
    color: "bg-gray-400",
    label: "Low",
  },
};

export function SeverityIndicator({ severity, showLabel = false }: SeverityIndicatorProps) {
  const config = severityConfig[severity] || severityConfig.low;
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      {showLabel && (
        <span className={`text-sm font-medium ${severity === "critical" ? "font-semibold" : ""}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
