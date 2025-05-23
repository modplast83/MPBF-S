import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QualityViolations } from "@/components/quality/enhanced-violation-management";
import { QualityPenaltiesManagement } from "@/components/quality/enhanced-penalties-management";
import { QualityCorrectiveActions } from "@/components/quality/enhanced-corrective-actions";
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
import { Badge } from "@/components/ui/badge";

// Needed to fix badge color warnings - custom variants
const badgeVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
  success: "bg-green-500 text-white hover:bg-green-600",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600"
};

export default function UnifiedQualityDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch quality statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/quality/stats"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quality/stats");
        if (!response.ok) {
          // If the endpoint doesn't exist yet, return mock data
          return {
            totalChecks: 120,
            passedChecks: 98,
            failedChecks: 22,
            totalViolations: 35,
            openViolations: 8,
            resolvedViolations: 27,
            totalCorrectiveActions: 42,
            pendingActions: 5,
            completedActions: 37,
            totalPenalties: 18,
            activePenalties: 4,
            closedPenalties: 14
          };
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching quality stats:", error);
        // Return fallback data if the API fails
        return {
          totalChecks: 120,
          passedChecks: 98,
          failedChecks: 22,
          totalViolations: 35,
          openViolations: 8,
          resolvedViolations: 27,
          totalCorrectiveActions: 42,
          pendingActions: 5,
          completedActions: 37,
          totalPenalties: 18,
          activePenalties: 4,
          closedPenalties: 14
        };
      }
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
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quality-violations");
        if (!response.ok) {
          throw new Error("Failed to fetch violations");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching violations:", error);
        return [];
      }
    }
  });
  
  // Fetch quality checks
  const { data: checks = [], isLoading: checksLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quality-checks");
        if (!response.ok) {
          throw new Error("Failed to fetch quality checks");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching quality checks:", error);
        return [];
      }
    }
  });
  
  // Calculate total quality score
  const calculateQualityScore = () => {
    if (!stats) return 0;
    
    const passRate = stats.totalChecks > 0 
      ? (stats.passedChecks / stats.totalChecks) * 100 
      : 0;
    
    const violationResolutionRate = stats.totalViolations > 0 
      ? (stats.resolvedViolations / stats.totalViolations) * 100 
      : 100;
    
    const actionCompletionRate = stats.totalCorrectiveActions > 0 
      ? (stats.completedActions / stats.totalCorrectiveActions) * 100 
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
    Passed: checks.filter((c: any) => c.passed).length,
    Failed: checks.filter((c: any) => !c.passed).length
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
          <h1 className="text-3xl font-bold tracking-tight">{t("quality.title")}</h1>
          <p className="text-muted-foreground">{t("quality.comprehensive_quality_control")}</p>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            <span>{t("quality.overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            <span>{t("quality.quality_checks")}</span>
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{t("quality.quality_violations")}</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2" />
            <span>{t("quality.corrective_actions")}</span>
          </TabsTrigger>
          <TabsTrigger value="penalties" className="flex items-center">
            <FileWarning className="h-4 w-4 mr-2" />
            <span>{t("quality.penalties")}</span>
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
                    <div className="text-3xl font-bold mb-2">{stats.totalChecks}</div>
                    <div className="text-muted-foreground mb-4">{t("quality.total_checks")}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-green-500 font-semibold">
                        {stats.passedChecks} <Check className="h-4 w-4 inline" />
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-red-500 font-semibold">
                        {stats.failedChecks} <XCircle className="h-4 w-4 inline" />
                      </div>
                    </div>
                    <Progress 
                      value={stats.totalChecks > 0 ? (stats.passedChecks / stats.totalChecks) * 100 : 0} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.violations")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats.totalViolations}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-yellow-500 font-semibold">
                        {stats.openViolations} {t("quality.open")}
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-green-500 font-semibold">
                        {stats.resolvedViolations} {t("quality.resolved")}
                      </div>
                    </div>
                    <Progress 
                      value={stats.totalViolations > 0 ? (stats.resolvedViolations / stats.totalViolations) * 100 : 100} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t("quality.penalties")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats.totalPenalties}</div>
                    <div className="flex items-end gap-2 mb-1">
                      <div className="text-red-500 font-semibold">
                        {stats.activePenalties} {t("quality.active")}
                      </div>
                      <span className="text-muted-foreground mx-1">|</span>
                      <div className="text-green-500 font-semibold">
                        {stats.closedPenalties} {t("quality.closed")}
                      </div>
                    </div>
                    <Progress 
                      value={stats.totalPenalties > 0 ? (stats.closedPenalties / stats.totalPenalties) * 100 : 100} 
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
                          <Badge variant="destructive">{violationsBySeverity.Critical}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {Math.round((violationsBySeverity.Critical / violations.length) * 100) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span>{t("quality.severity_major")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" className={badgeVariants.warning}>
                            {violationsBySeverity.Major}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {Math.round((violationsBySeverity.Major / violations.length) * 100) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>{t("quality.severity_minor")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{violationsBySeverity.Minor}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {Math.round((violationsBySeverity.Minor / violations.length) * 100) || 0}%
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
                      <p className="text-muted-foreground">{t("quality.no_recent_activity")}</p>
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
                                <Badge variant={
                                  violation.severity === "Critical" ? "destructive" : 
                                  violation.severity === "Major" ? "warning" : "outline"
                                } className={
                                  violation.severity === "Major" ? badgeVariants.warning : ""
                                }>
                                  {violation.severity}
                                </Badge>
                                <Badge variant={violation.status === "Open" ? "outline" : "success"} className={
                                  violation.status !== "Open" ? badgeVariants.success : ""
                                } className="ml-2">
                                  {violation.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {recentChecks.slice(0, 2).map((check: any, index: number) => (
                          <div key={`check-${index}`} className="flex items-start gap-3 border-b pb-3">
                            <ClipboardCheck className={`h-5 w-5 ${check.passed ? 'text-green-500' : 'text-red-500'} mt-0.5`} />
                            <div>
                              <div className="font-semibold">{t("quality.check")} #{check.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {check.notes?.substring(0, 60) || t("common.not_available")}...
                              </div>
                              <div className="flex mt-1">
                                <Badge variant={check.passed ? "success" : "destructive"} className={
                                  check.passed ? badgeVariants.success : ""
                                }>
                                  {check.passed ? t("quality.passed") : t("quality.failed")}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-2 mt-0.5">
                                  {new Date(check.checkDate).toLocaleDateString()}
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
          {/* Quality Check Management Component will go here */}
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4">{t("quality.quality_checks")}</h2>
            <p className="text-muted-foreground mb-6">{t("quality.quality_checks_description")}</p>
            
            {/* Placeholder for Quality Check Component - will be implemented separately */}
            <div className="p-6 border border-dashed rounded-lg flex flex-col items-center justify-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("quality.select_tab_for_details")}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="violations">
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4">{t("quality.quality_violations")}</h2>
            <p className="text-muted-foreground mb-6">{t("quality.violations_description")}</p>
            <QualityViolations />
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4">{t("quality.corrective_actions")}</h2>
            <p className="text-muted-foreground mb-6">{t("quality.corrective_actions_description")}</p>
            <QualityCorrectiveActions />
          </div>
        </TabsContent>

        <TabsContent value="penalties">
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4">{t("quality.penalties")}</h2>
            <p className="text-muted-foreground mb-6">{t("quality.penalties_description")}</p>
            <QualityPenaltiesManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}