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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileText,
  UserPlus,
  Edit,
  Eye,
  Trash2,
  LogIn,
  LogOut,
} from "lucide-react";
import type { AuditLog, User as UserType, Patient } from "@shared/schema";

type AuditLogWithRelations = AuditLog & {
  user?: UserType;
  patient?: Patient & { user?: UserType };
};

const actionIcons: Record<string, typeof FileText> = {
  create: UserPlus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: LogIn,
  logout: LogOut,
};

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
      log.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase());

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

  const getActionBadge = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("add")) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{action}</Badge>;
    }
    if (lowerAction.includes("update") || lowerAction.includes("edit")) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{action}</Badge>;
    }
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
      return <Badge variant="destructive">{action}</Badge>;
    }
    if (lowerAction.includes("view") || lowerAction.includes("read")) {
      return <Badge variant="secondary">{action}</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities and access events
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40" data-testid="select-action-filter">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="login">Login</SelectItem>
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
              {filteredLogs.map((log) => (
                <Collapsible key={log.id} open={expandedIds.has(log.id)}>
                  <div
                    className="border rounded-md p-3 hover-elevate"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
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
                          {log.user?.firstName} {log.user?.lastName}
                        </span>
                      </div>
                      <div className="flex-1">
                        {getActionBadge(log.action)}
                        {log.resourceType && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            on {log.resourceType}
                            {log.resourceId && ` #${log.resourceId}`}
                          </span>
                        )}
                      </div>
                      {log.details && (
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
