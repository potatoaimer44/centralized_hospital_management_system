import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SeverityIndicator } from "@/components/severity-indicator";
import {
  ShieldAlert,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle,
} from "lucide-react";
import type { SecurityAlert, User as UserType } from "@shared/schema";

type SecurityAlertWithRelations = SecurityAlert & {
  user?: UserType;
  resolver?: UserType;
};

export default function SecurityAlertsPage() {
  const { toast } = useToast();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: alerts, isLoading } = useQuery<SecurityAlertWithRelations[]>({
    queryKey: ["/api/security-alerts"],
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/security-alerts/${id}`, {
        isResolved: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-alerts"] });
      toast({
        title: "Success",
        description: "Alert marked as resolved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && alert.isResolved) ||
      (statusFilter === "unresolved" && !alert.isResolved);
    return matchesSeverity && matchesStatus;
  });

  const alertStats = {
    total: alerts?.length || 0,
    critical: alerts?.filter((a) => a.severity === "critical" && !a.isResolved).length || 0,
    high: alerts?.filter((a) => a.severity === "high" && !a.isResolved).length || 0,
    unresolved: alerts?.filter((a) => !a.isResolved).length || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Security Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and respond to security events
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Alerts</p>
            <p className="text-2xl font-semibold" data-testid="stat-total">
              {alertStats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400" data-testid="stat-critical">
              {alertStats.critical}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">High</p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400" data-testid="stat-high">
              {alertStats.high}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unresolved</p>
            <p className="text-2xl font-semibold" data-testid="stat-unresolved">
              {alertStats.unresolved}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Alert Log
            </CardTitle>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32" data-testid="select-severity-filter">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredAlerts && filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`${
                    alert.isResolved
                      ? "opacity-60"
                      : alert.severity === "critical"
                      ? "border-red-300 dark:border-red-800"
                      : alert.severity === "high"
                      ? "border-amber-300 dark:border-amber-800"
                      : ""
                  }`}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <SeverityIndicator severity={(alert.severity as any) || "low"} />
                          <Badge variant="outline">{alert.alertType}</Badge>
                          {alert.isResolved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground">{alert.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-mono">
                              {alert.createdAt
                                ? new Date(alert.createdAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          {alert.user && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {alert.user.firstName} {alert.user.lastName}
                              </span>
                            </div>
                          )}
                          {alert.anomalyScore && (
                            <span>Score: {alert.anomalyScore}</span>
                          )}
                        </div>
                        {alert.isResolved && alert.resolver && (
                          <p className="text-sm text-muted-foreground">
                            Resolved by {alert.resolver.firstName} {alert.resolver.lastName}
                            {alert.resolvedAt &&
                              ` on ${new Date(alert.resolvedAt).toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      {!alert.isResolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          data-testid={`button-resolve-${alert.id}`}
                        >
                          {resolveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Resolve
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Security Alerts</h3>
              <p className="text-muted-foreground">
                {severityFilter !== "all" || statusFilter !== "all"
                  ? "No alerts match your filters"
                  : "No security alerts have been detected"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
