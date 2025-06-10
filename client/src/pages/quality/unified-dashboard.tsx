import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QualityViolations } from "@/components/quality/enhanced-violation-management";
import { QualityPenaltiesManagement } from "@/components/quality/enhanced-penalties-management";
import { QualityCorrectiveActions } from "@/components/quality/enhanced-corrective-actions";
import { QualityChecksManagement } from "@/components/quality/enhanced-quality-check-form";
import { 
  PieChart, 
  BarChart, 
  ClipboardCheck, 
  AlertTriangle, 
  ShieldAlert, 
  FileWarning,
  Check,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { QualityBadge } from "@/components/quality/quality-badge";
import { cn } from "@/lib/utils";

export default function UnifiedQualityDashboard() {
  const { t } = useTranslation();
  // Set page title for better navigation context
  document.title = `${t("sidebar.unified_dashboard")} | ${t("common.app_name") || "Production System"}`;
  const [activeTab, setActiveTab] = useState("overview");

  // Define default stats to handle loading and error states
  const defaultStats = {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    totalViolations: 0,
    openViolations: 0,
    resolvedViolations: 0,
    totalCorrectiveActions: 0,
    pendingActions: 0,
    completedActions: 0,
    totalPenalties: 0,
    activePenalties: 0,
    closedPenalties: 0
  };

  // Fetch quality statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/quality/stats"],
    queryFn: async () => {
      const response = await fetch("/api/quality/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch quality statistics");
      }
      return response.json();
    }
  });

  // Default chart colors
  const CHART_COLORS = {
    green: "#10b981",
    red: "#ef4444",
    yellow: "#f59e0b",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    gray: "#6b7280"
  };

  // Fetch violations by severity
  const { data: violations = [], isLoading: violationsLoading } = useQuery<any[]>({
    queryKey: ["/api/quality-violations"],
    retry: 3,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  // Fetch quality checks
  const { data: checks = [], isLoading: checksLoading } = useQuery<any[]>({
    queryKey: ["/api/quality-checks"],
    retry: 3,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  // Use stats from API or default values
  const statsData = stats || defaultStats;
  
  // Calculate total quality score
  const calculateQualityScore = () => {    
    const passRate = statsData.totalChecks > 0 
      ? (statsData.passedChecks / statsData.totalChecks) * 100 
      : 0;
    
    const violationResolutionRate = statsData.totalViolations > 0 
      ? (statsData.resolvedViolations / statsData.totalViolations) * 100 
      : 100;
    
    const actionCompletionRate = statsData.totalCorrectiveActions > 0 
      ? (statsData.completedActions / statsData.totalCorrectiveActions) * 100 
      : 100;
    
    // Weighted score: 60% pass rate, 25% violation resolution, 15% action completion
    return (passRate * 0.6) + (violationResolutionRate * 0.25) + (actionCompletionRate * 0.15);
  };
  
  const qualityScore = calculateQualityScore();
  
  const getQualityRating = (score: number) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "average";
    return "poor";
  };
  
  const qualityRating = getQualityRating(qualityScore);
  
  // Calculate violations by severity
  const violationsBySeverity = {
    Critical: violations.filter((v: any) => v.severity === "Critical").length,
    Major: violations.filter((v: any) => v.severity === "Major").length,
    Minor: violations.filter((v: any) => v.severity === "Minor").length
  };
  
  // Calculate checks by result
  const checksByResult = {
    Passed: checks.filter((c: any) => c.status === 'passed').length,
    Failed: checks.filter((c: any) => c.status === 'failed' || c.status === 'pending').length
  };
  
  // Recent violations for the dashboard
  const recentViolations = violations
    .sort((a: any, b: any) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
    .slice(0, 5);
  
  // Recent checks for the dashboard
  const recentChecks = checks
    .sort((a: any, b: any) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())
    .slice(0, 5);
  
  const isLoading = statsLoading || violationsLoading || checksLoading;
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("quality.unified_dashboard_title") || t("sidebar.unified_dashboard")}</h1>
          <p className="text-muted-foreground">{t("quality.comprehensive_quality_control")}</p>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="flex w-full h-auto flex-wrap md:grid md:grid-cols-5 mb-8 p-1 bg-muted rounded-md">
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center min-w-0 flex-1 md:flex-initial px-2 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <PieChart className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">{t("quality.overview")}</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="checks" 
            className="flex items-center justify-center min-w-0 flex-1 md:flex-initial px-2 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <ClipboardCheck className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">{t("quality.quality_checks")}</span>
            <span className="sm:hidden">Checks</span>
          </TabsTrigger>
          <TabsTrigger 
            value="violations" 
            className="flex items-center justify-center min-w-0 flex-1 md:flex-initial px-2 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">{t("quality.quality_violations")}</span>
            <span className="sm:hidden">Violations</span>
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="flex items-center justify-center min-w-0 flex-1 md:flex-initial px-2 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <ShieldAlert className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">{t("quality.corrective_actions")}</span>
            <span className="sm:hidden">Actions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="penalties" 
            className="flex items-center justify-center min-w-0 flex-1 md:flex-initial px-2 py-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <FileWarning className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">{t("quality.penalties")}</span>
            <span className="sm:hidden">Penalties</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <p>{t("common.loading")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.quality_rate")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="relative w-32 h-32 mb-4">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold">{Math.round(qualityScore)}%</span>
                        </div>
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={
                              qualityRating === "excellent" ? CHART_COLORS.green :
                              qualityRating === "good" ? CHART_COLORS.blue :
                              qualityRating === "average" ? CHART_COLORS.yellow :
                              CHART_COLORS.red
                            }
                            strokeWidth="10"
                            strokeDasharray={`${qualityScore * 2.83} 283`}
                            strokeDashoffset="0"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                      </div>
                      <span className="text-xl font-semibold capitalize text-center">
                        {t(`quality.${qualityRating}`)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.quality_checks")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{statsData.totalChecks}</div>
                    <div className="text-muted-foreground mb-4">{t("quality.total_checks")}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-green-500 font-semibold">
                        {statsData.passedChecks} <Check className="h-4 w-4 inline" />
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-red-500 font-semibold">
                        {statsData.failedChecks} <XCircle className="h-4 w-4 inline" />
                      </div>
                    </div>
                    <Progress 
                      value={statsData.totalChecks > 0 ? (statsData.passedChecks / statsData.totalChecks) * 100 : 0} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.violations")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{statsData.totalViolations}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-yellow-500 font-semibold">
                        {statsData.openViolations} {t("quality.open")}
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-green-500 font-semibold">
                        {statsData.resolvedViolations} {t("quality.resolved")}
                      </div>
                    </div>
                    <Progress 
                      value={statsData.totalViolations > 0 ? (statsData.resolvedViolations / statsData.totalViolations) * 100 : 100} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.penalties")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{statsData.totalPenalties}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-red-500 font-semibold">
                        {statsData.activePenalties} {t("quality.active")}
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-green-500 font-semibold">
                        {statsData.closedPenalties} {t("quality.closed")}
                      </div>
                    </div>
                    <Progress 
                      value={statsData.totalPenalties > 0 ? (statsData.closedPenalties / statsData.totalPenalties) * 100 : 100} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("quality.violations_by_severity")}</CardTitle>
                    <CardDescription>{t("quality.violations_severity_description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>{t("quality.severity_critical")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QualityBadge variant="destructive">{violationsBySeverity.Critical}</QualityBadge>
                          <span className="text-muted-foreground text-xs">
{violations.length > 0 ? Math.round((violationsBySeverity.Critical / violations.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span>{t("quality.severity_major")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QualityBadge variant="warning">
                            {violationsBySeverity.Major}
                          </QualityBadge>
                          <span className="text-muted-foreground text-xs">
                            {violations.length > 0 ? Math.round((violationsBySeverity.Major / violations.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>{t("quality.severity_minor")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QualityBadge variant="info">{violationsBySeverity.Minor}</QualityBadge>
                          <span className="text-muted-foreground text-xs">
                            {violations.length > 0 ? Math.round((violationsBySeverity.Minor / violations.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("quality.recent_activity")}</CardTitle>
                    <CardDescription>{t("quality.recent_activity_description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentViolations.length === 0 && recentChecks.length === 0 ? (
                      <p className="text-muted-foreground">No Recent Activity</p>
                    ) : (
                      <div className="space-y-4">
                        {recentViolations.slice(0, 2).map((violation: any, index: number) => (
                          <div key={`violation-${index}`} className="flex items-start gap-3 border-b pb-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <div className="font-semibold">{t("quality.violation")} #{violation.id}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-sm">
                                {violation.description?.substring(0, 60) || t("common.not_available")}...
                              </div>
                              <div className="flex mt-1">
                                <QualityBadge variant={
                                  violation.severity === "Critical" ? "destructive" : 
                                  violation.severity === "Major" ? "warning" : "info"
                                }>
                                  {violation.severity}
                                </QualityBadge>
                                <QualityBadge 
                                  variant={violation.status === "Open" ? "destructive" : 
                                         violation.status === "In Progress" ? "warning" : "success"}
                                  className="ml-2"
                                >
                                  {violation.status}
                                </QualityBadge>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {recentChecks.slice(0, 2).map((check: any, index: number) => (
                          <div key={`check-${index}`} className="flex items-start gap-3 border-b pb-3">
                            <ClipboardCheck className={`h-5 w-5 ${check.passed ? 'text-green-500' : 'text-red-500'} mt-0.5`} />
                            <div>
                              <div className="font-semibold">Quality Check #{check.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {check.notes?.substring(0, 60) || t("common.not_available")}
                                {check.notes && check.notes.length > 60 ? '...' : ''}
                              </div>
                              <div className="flex mt-1">
                                <QualityBadge variant={check.status === "Passed" ? "success" : "destructive"}>
                                  {check.status === "Passed" ? t("quality.passed") : t("quality.failed")}
                                </QualityBadge>
                                <span className="text-xs text-muted-foreground ml-2 mt-0.5">
                                  {new Date(check.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="checks">
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4">{t("quality.quality_checks")}</h2>
            <p className="text-muted-foreground mb-6">{t("quality.quality_checks_description")}</p>
            <QualityChecksManagement />
          </div>
        </TabsContent>

        <TabsContent value="violations">
          <div className="rounded-lg border p-3 sm:p-6 bg-card">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{t("quality.quality_violations")}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{t("quality.violations_description")}</p>
            <QualityViolations />
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <div className="rounded-lg border p-3 sm:p-6 bg-card">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{t("quality.corrective_actions")}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Corrective Actions Description</p>
            <QualityCorrectiveActions />
          </div>
        </TabsContent>

        <TabsContent value="penalties">
          <div className="rounded-lg border p-3 sm:p-6 bg-card">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{t("quality.penalties")}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{t("quality.penalties_description")}</p>
            <QualityPenaltiesManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}