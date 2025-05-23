import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import enhanced quality components
import { QualityViolations } from "@/components/quality/enhanced-violation-management";
import { QualityPenaltiesManagement } from "@/components/quality/enhanced-penalties-management";
import { QualityCorrectiveActions } from "@/components/quality/enhanced-corrective-actions";
import { QualityCheckForm } from "@/components/quality/enhanced-quality-check-form";

export default function UnifiedQualityDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all required data
  const { data: qualityChecks, isLoading: checksLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  const { data: qualityViolations, isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch quality violations");
      }
      return response.json();
    }
  });

  const { data: qualityPenalties, isLoading: penaltiesLoading } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch quality penalties");
      }
      return response.json();
    }
  });

  const { data: correctiveActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
      }
      return response.json();
    }
  });

  const { data: checkTypes, isLoading: checkTypesLoading } = useQuery({
    queryKey: ["/api/quality-check-types"],
    queryFn: async () => {
      const response = await fetch("/api/quality-check-types");
      if (!response.ok) {
        throw new Error("Failed to fetch check types");
      }
      return response.json();
    }
  });

  const { data: rolls, isLoading: rollsLoading } = useQuery({
    queryKey: ["/api/rolls"],
    queryFn: async () => {
      const response = await fetch("/api/rolls");
      if (!response.ok) {
        throw new Error("Failed to fetch rolls");
      }
      return response.json();
    }
  });

  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery({
    queryKey: ["/api/job-orders"],
    queryFn: async () => {
      const response = await fetch("/api/job-orders");
      if (!response.ok) {
        throw new Error("Failed to fetch job orders");
      }
      return response.json();
    }
  });

  // Calculate statistics
  const stats = {
    totalChecks: qualityChecks?.length || 0,
    passedChecks: qualityChecks?.filter((c: any) => c.passed)?.length || 0,
    failedChecks: qualityChecks?.filter((c: any) => !c.passed)?.length || 0,
    passRate: qualityChecks?.length 
      ? Math.round((qualityChecks.filter((c: any) => c.passed).length / qualityChecks.length) * 100) 
      : 0,
    totalViolations: qualityViolations?.length || 0,
    openViolations: qualityViolations?.filter((v: any) => v.status === "Open" || v.status === "In Progress")?.length || 0,
    totalPenalties: qualityPenalties?.length || 0,
    activePenalties: qualityPenalties?.filter((p: any) => p.status === "Active" || p.status === "Pending")?.length || 0,
    totalActions: correctiveActions?.length || 0,
    pendingActions: correctiveActions?.filter((a: any) => !a.verifiedDate)?.length || 0
  };

  const isLoading = checksLoading || violationsLoading || penaltiesLoading || 
    actionsLoading || checkTypesLoading || rollsLoading || jobOrdersLoading;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <PageHeader 
        title={t("quality.management")}
        description={t("quality.comprehensive_quality_control")}
      />

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
          <TabsTrigger value="overview">{t("quality.overview")}</TabsTrigger>
          <TabsTrigger value="checks">{t("quality.checks")}</TabsTrigger>
          <TabsTrigger value="violations">{t("quality.violations")}</TabsTrigger>
          <TabsTrigger value="actions">{t("quality.corrective_actions")}</TabsTrigger>
          <TabsTrigger value="penalties">{t("quality.penalties")}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("quality.quality_rate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.passRate}%</div>
                  <Badge variant={stats.passRate > 90 ? "outline" : stats.passRate > 75 ? "secondary" : "destructive"}>
                    {stats.passRate > 90 ? t("quality.excellent") : stats.passRate > 75 ? t("quality.average") : t("quality.poor")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalChecks} {t("quality.total_checks")}, {stats.failedChecks} {t("quality.failed")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("quality.violations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalViolations}</div>
                  <Badge variant={stats.openViolations > 0 ? "destructive" : "outline"}>
                    {stats.openViolations} {t("quality.open")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalViolations - stats.openViolations} {t("quality.resolved")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("quality.corrective_actions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalActions}</div>
                  <Badge variant={stats.pendingActions > 0 ? "secondary" : "outline"}>
                    {stats.pendingActions} {t("quality.pending")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalActions - stats.pendingActions} {t("quality.completed")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("quality.penalties")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalPenalties}</div>
                  <Badge variant={stats.activePenalties > 0 ? "destructive" : "outline"}>
                    {stats.activePenalties} {t("quality.active")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalPenalties - stats.activePenalties} {t("quality.closed")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("quality.recent_activity")}</CardTitle>
              <CardDescription>{t("quality.recent_activity_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
              ) : (
                <p className="text-center text-gray-500 py-8">{t("quality.select_tab_for_details")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Checks Tab */}
        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>{t("quality.quality_checks")}</CardTitle>
              <CardDescription>{t("quality.quality_checks_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
              ) : (
                <QualityCheckForm
                  checkTypes={checkTypes || []}
                  rolls={rolls || []}
                  jobOrders={jobOrders || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Violations Tab */}
        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>{t("quality.quality_violations")}</CardTitle>
              <CardDescription>{t("quality.violations_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
              ) : (
                <QualityViolations />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>{t("quality.corrective_actions")}</CardTitle>
              <CardDescription>{t("quality.corrective_actions_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
              ) : (
                <QualityCorrectiveActions />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Penalties Tab */}
        <TabsContent value="penalties">
          <Card>
            <CardHeader>
              <CardTitle>{t("quality.quality_penalties")}</CardTitle>
              <CardDescription>{t("quality.penalties_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">{t("common.loading")}</div>
              ) : (
                <QualityPenaltiesManagement />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}