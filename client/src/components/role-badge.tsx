import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@shared/schema";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  doctor: {
    label: "Doctor",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  nurse: {
    label: "Nurse",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  patient: {
    label: "Patient",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.patient;
  
  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} ${className || ""}`}
      data-testid={`badge-role-${role}`}
    >
      {config.label}
    </Badge>
  );
}
