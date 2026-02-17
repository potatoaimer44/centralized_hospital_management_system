import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Brain,
  Sparkles,
  ScanSearch,
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

  const [aiResult, setAiResult] = useState<{
    summary: string;
    anomalies: { alertType: string; severity: string; description: string; anomalyScore: number }[];
    totalLogsAnalyzed: number;
    timeRange: string;
    alertsCreated: number;
  } | null>(null);
  const [aiHours, setAiHours] = useState("24");

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

  const analyzeMutation = useMutation({
    mutationFn: async (hours: number) => {
      const response = await apiRequest("POST", "/api/ai/analyze-logs", { hours });
      return response.json();
    },
    onSuccess: (data) => {
      setAiResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/security-alerts"] });
      toast({
        title: "AI Analysis Complete",
        description: `Analyzed ${data.totalLogsAnalyzed} logs. Found ${data.anomalies.length} anomalies.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "AI analysis failed",
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

      {/* AI Anomaly Detection */}
      <Card className="border-violet-200 dark:border-violet-900">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-600" />
                AI Anomaly Detection
              </CardTitle>
              <CardDescription>
                Analyze recent audit logs for suspicious activity using AI
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={aiHours} onValueChange={setAiHours}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Last 6 hours</SelectItem>
                  <SelectItem value="12">Last 12 hours</SelectItem>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="48">Last 48 hours</SelectItem>
                  <SelectItem value="168">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => analyzeMutation.mutate(parseInt(aiHours))}
                disabled={analyzeMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4 mr-2" />
                    Run AI Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyzeMutation.isPending ? (
            <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-sm">Analyzing audit logs...</p>
                <p className="text-xs text-muted-foreground">
                  The AI is scanning for anomalies. This may take a few seconds.
                </p>
              </div>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 mb-1">
                      AI Summary
                    </p>
                    <p className="text-sm text-violet-900 dark:text-violet-100">
                      {aiResult.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-violet-600 dark:text-violet-400">
                      <span>{aiResult.totalLogsAnalyzed} logs analyzed</span>
                      <span>{aiResult.timeRange}</span>
                      <span>{aiResult.anomalies.length} anomalies detected</span>
                      {aiResult.alertsCreated > 0 && (
                        <Badge className="bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200 text-xs">
                          {aiResult.alertsCreated} alerts created
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomalies */}
              {aiResult.anomalies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Detected Anomalies:</p>
                  {aiResult.anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        anomaly.severity === "critical"
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                          : anomaly.severity === "high"
                          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                          : "border-muted bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <SeverityIndicator severity={anomaly.severity as any} />
                        <Badge variant="outline" className="text-xs">{anomaly.alertType}</Badge>
                        <span className="text-xs font-mono text-muted-foreground ml-auto">
                          Score: {(anomaly.anomalyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm">{anomaly.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {aiResult.anomalies.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">No anomalies detected</p>
                  <p className="text-xs">All activity appears normal.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ScanSearch className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Click "Run AI Analysis" to scan audit logs for suspicious activity.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
