import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  ScrollText,
  Search,
  User,
  Clock,
  Globe,
  ChevronDown,
  LogIn,
  LogOut,
  UserPlus,
  Edit,
  Eye,
  FileText,
  Activity,
  Shield,
  Calendar,
  Building2,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import type { AuditLog, User as UserType, Patient } from "@shared/schema";

type AuditLogWithRelations = AuditLog & {
  user?: UserType;
  patient?: Patient & { user?: UserType };
};

/** Human-readable labels for action types */
const actionLabels: Record<string, string> = {
  user_signup: "User Signed Up",
  user_login: "User Logged In",
  user_logout: "User Logged Out",
  create_user: "Created User",
  update_user_role: "Changed User Role",
  create_hospital: "Created Hospital",
  create_patient: "Registered Patient",
  view_patient: "Viewed Patient",
  create_medical_record: "Created Medical Record",
  view_medical_record: "Viewed Medical Record",
  record_vital_signs: "Recorded Vital Signs",
  create_appointment: "Created Appointment",
  update_appointment_status: "Updated Appointment Status",
  create_access_request: "Created Access Request",
  approved_access_request: "Approved Access Request",
  denied_access_request: "Denied Access Request",
  create_security_alert: "Created Security Alert",
  resolve_security_alert: "Resolved Security Alert",
};

/** Icon for each action category */
function getActionIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("login")) return <LogIn className="h-4 w-4" />;
  if (lower.includes("logout")) return <LogOut className="h-4 w-4" />;
  if (lower.includes("signup")) return <UserPlus className="h-4 w-4" />;
  if (lower.includes("user")) return <User className="h-4 w-4" />;
  if (lower.includes("hospital")) return <Building2 className="h-4 w-4" />;
  if (lower.includes("patient")) return <User className="h-4 w-4" />;
  if (lower.includes("medical_record")) return <FileText className="h-4 w-4" />;
  if (lower.includes("vital")) return <Activity className="h-4 w-4" />;
  if (lower.includes("appointment")) return <Calendar className="h-4 w-4" />;
  if (lower.includes("access_request")) return <ClipboardList className="h-4 w-4" />;
  if (lower.includes("security_alert")) return <AlertTriangle className="h-4 w-4" />;
  return <Shield className="h-4 w-4" />;
}

/** Color-coded badge for each action type */
function getActionBadge(action: string) {
  const label = actionLabels[action] || action;
  const lower = action.toLowerCase();

  if (lower.includes("login") || lower.includes("signup")) {
    return (
      <Badge variant="default" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
        {label}
      </Badge>
    );
  }
  if (lower.includes("logout")) {
    return (
      <Badge variant="default" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {label}
      </Badge>
    );
  }
  if (lower.includes("create") || lower.includes("record")) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        {label}
      </Badge>
    );
  }
  if (lower.includes("update") || lower.includes("edit") || lower.includes("resolve") || lower.includes("approved")) {
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {label}
      </Badge>
    );
  }
  if (lower.includes("denied") || lower.includes("delete") || lower.includes("remove")) {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (lower.includes("view")) {
    return <Badge variant="secondary">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: logs, isLoading } = useQuery<AuditLogWithRelations[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (actionLabels[log.action] || "").toLowerCase().includes(search.toLowerCase()) ||
      log.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(search.toLowerCase());

    let matchesAction = true;
    if (actionFilter !== "all") {
      const lower = log.action.toLowerCase();
      switch (actionFilter) {
        case "auth":
          matchesAction = lower.includes("login") || lower.includes("logout") || lower.includes("signup");
          break;
        case "create":
          matchesAction = lower.includes("create") || lower.includes("record");
          break;
        case "update":
          matchesAction = lower.includes("update") || lower.includes("resolve") || lower.includes("approved") || lower.includes("denied");
          break;
        case "view":
          matchesAction = lower.includes("view");
          break;
        default:
          matchesAction = lower.includes(actionFilter.toLowerCase());
      }
    }

    return matchesSearch && matchesAction;
  });

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Count by category for summary
  const authCount = logs?.filter((l) => ["user_login", "user_logout", "user_signup"].includes(l.action)).length ?? 0;
  const createCount = logs?.filter((l) => l.action.startsWith("create_") || l.action === "record_vital_signs").length ?? 0;
  const viewCount = logs?.filter((l) => l.action.startsWith("view_")).length ?? 0;
  const updateCount = logs?.filter((l) =>
    l.action.startsWith("update_") ||
    l.action.startsWith("resolve_") ||
    l.action.endsWith("_access_request") && !l.action.startsWith("create_")
  ).length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities — sign-ups, logins, and user, doctor, nurse, and patient actions
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActionFilter("auth")}>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
              <LogIn className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{authCount}</p>
              <p className="text-xs text-muted-foreground">Auth Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActionFilter("create")}>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
              <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{createCount}</p>
              <p className="text-xs text-muted-foreground">Create Actions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActionFilter("view")}>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{viewCount}</p>
              <p className="text-xs text-muted-foreground">View Actions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActionFilter("update")}>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{updateCount}</p>
              <p className="text-xs text-muted-foreground">Update Actions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48" data-testid="select-action-filter">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="auth">Auth (Login / Signup / Logout)</SelectItem>
                <SelectItem value="create">Create Actions</SelectItem>
                <SelectItem value="update">Update / Approve / Resolve</SelectItem>
                <SelectItem value="view">View Actions</SelectItem>
                <SelectItem value="user_login">Login Only</SelectItem>
                <SelectItem value="user_signup">Signup Only</SelectItem>
                <SelectItem value="user_logout">Logout Only</SelectItem>
                <SelectItem value="medical_record">Medical Records</SelectItem>
                <SelectItem value="vital">Vital Signs</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="access_request">Access Requests</SelectItem>
                <SelectItem value="security_alert">Security Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Showing {filteredLogs.length} of {logs?.length ?? 0} log entries
              </p>
              {filteredLogs.map((log) => (
                <Collapsible key={log.id} open={expandedIds.has(log.id)}>
                  <div
                    className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex items-center gap-2 min-w-40">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-32">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {log.user?.firstName
                            ? `${log.user.firstName} ${log.user.lastName || ""}`
                            : log.userId || "System"}
                        </span>
                        {log.user?.role && (
                          <Badge variant="outline" className="text-xs">
                            {log.user.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        {getActionBadge(log.action)}
                        {log.resourceType && log.resourceType !== "auth" && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            on {log.resourceType.replace(/_/g, " ")}
                            {log.resourceId ? ` #${log.resourceId}` : ""}
                          </span>
                        )}
                      </div>
                      {(log.details || log.ipAddress || log.patient) && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(log.id)}
                            data-testid={`button-expand-${log.id}`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedIds.has(log.id) ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {log.ipAddress && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">IP:</span>
                            <span className="font-mono">{log.ipAddress}</span>
                          </div>
                        )}
                        {log.patient && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Patient:</span>
                            <span>
                              {log.patient.user?.firstName} {log.patient.user?.lastName}
                            </span>
                          </div>
                        )}
                        {log.details && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">Details:</p>
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Audit Logs</h3>
              <p className="text-muted-foreground">
                {search || actionFilter !== "all"
                  ? "No logs match your filters"
                  : "No system activities have been recorded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
