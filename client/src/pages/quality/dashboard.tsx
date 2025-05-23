import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle,
  FileWarning,
  ShieldAlert,
  UserMinus,
  Printer,
  Search,
  PlusCircle,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowUpDown,
  Calendar,
  Download,
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  Layers,
  SlidersHorizontal
} from "lucide-react";

// Dashboard component
export default function QualityDashboard() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(params.section || "overview");
  
  // Set the current section based on URL params
  useEffect(() => {
    if (params.section) {
      setActiveSection(params.section);
    }
  }, [params.section]);

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setLocation(`/quality/${section}`);
  };

  // Fetch all needed data
  const { data: qualityChecks, isLoading: checksLoading, refetch: refetchChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  const { data: qualityViolations, isLoading: violationsLoading, refetch: refetchViolations } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch quality violations");
      }
      return response.json();
    }
  });

  const { data: correctiveActions, isLoading: actionsLoading, refetch: refetchActions } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
      }
      return response.json();
    }
  });

  const { data: qualityPenalties, isLoading: penaltiesLoading, refetch: refetchPenalties } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch quality penalties");
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

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });

  const { data: qualityMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/reports/quality"],
    queryFn: async () => {
      const response = await fetch("/api/reports/quality");
      if (!response.ok) {
        throw new Error("Failed to fetch quality metrics");
      }
      return response.json();
    }
  });

  // Calculate overall stats
  const stats = {
    totalChecks: qualityChecks?.length || 0,
    failedChecks: qualityChecks?.filter((check) => !check.passed)?.length || 0,
    violations: qualityViolations?.length || 0,
    openViolations: qualityViolations?.filter(v => v.status === "Open")?.length || 0,
    penalties: qualityPenalties?.length || 0,
    activePenalties: qualityPenalties?.filter(p => p.status === "Active")?.length || 0,
    correctiveActions: correctiveActions?.length || 0,
    pendingActions: correctiveActions?.filter(a => !a.verifiedDate)?.length || 0,
    qualityRate: qualityMetrics?.passRate || 0
  };
  
  // Prepare chart data
  const violationsBySeverity = [
    { name: 'Critical', value: qualityViolations?.filter(v => v.severity === 'Critical')?.length || 0 },
    { name: 'Major', value: qualityViolations?.filter(v => v.severity === 'Major')?.length || 0 },
    { name: 'Minor', value: qualityViolations?.filter(v => v.severity === 'Minor')?.length || 0 }
  ];
  
  const checksByResult = [
    { name: 'Passed', value: qualityChecks?.filter(c => c.passed)?.length || 0 },
    { name: 'Failed', value: qualityChecks?.filter(c => !c.passed)?.length || 0 }
  ];

  const penaltiesByType = [
    { name: 'Warning', value: qualityPenalties?.filter(p => p.penaltyType === 'Warning')?.length || 0 },
    { name: 'Training', value: qualityPenalties?.filter(p => p.penaltyType === 'Training')?.length || 0 },
    { name: 'Financial', value: qualityPenalties?.filter(p => p.penaltyType === 'Financial')?.length || 0 },
    { name: 'Other', value: qualityPenalties?.filter(p => p.penaltyType === 'Other')?.length || 0 }
  ];

  // Colors for charts
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Determine if loading
  const isLoading = checksLoading || violationsLoading || actionsLoading || penaltiesLoading || 
    checkTypesLoading || rollsLoading || jobOrdersLoading || usersLoading || metricsLoading;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("quality.management")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {t("quality.comprehensive_quality_control")}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Select value={activeSection} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("quality.select_section")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("quality.sections")}</SelectLabel>
                <SelectItem value="overview">{t("quality.overview")}</SelectItem>
                <SelectItem value="checks">{t("quality.checks")}</SelectItem>
                <SelectItem value="violations">{t("quality.violations")}</SelectItem>
                <SelectItem value="actions">{t("quality.corrective_actions.title_short")}</SelectItem>
                <SelectItem value="penalties">{t("quality.penalties.title_short")}</SelectItem>
                <SelectItem value="check-types">{t("quality.check_types")}</SelectItem>
                <SelectItem value="reports">{t("quality.reports")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              refetchChecks();
              refetchViolations();
              refetchActions();
              refetchPenalties();
              toast({
                title: t("common.refreshed"),
                description: t("quality.data_refreshed"),
              });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Different sections based on activeSection */}
      {activeSection === "overview" && (
        <OverviewSection 
          stats={stats} 
          violationsBySeverity={violationsBySeverity}
          checksByResult={checksByResult}
          penaltiesByType={penaltiesByType}
          isLoading={isLoading}
          recentViolations={qualityViolations?.slice(0, 5) || []}
          recentChecks={qualityChecks?.slice(0, 5) || []}
        />
      )}

      {activeSection === "checks" && (
        <ChecksSection 
          checks={qualityChecks || []} 
          isLoading={isLoading}
          checkTypes={checkTypes || []}
          rolls={rolls || []}
          jobOrders={jobOrders || []}
          users={users || []}
          t={t}
          toast={toast}
          refetchChecks={refetchChecks}
        />
      )}

      {activeSection === "violations" && (
        <ViolationsSection 
          violations={qualityViolations || []} 
          isLoading={isLoading}
          users={users || []}
          checks={qualityChecks || []}
          t={t}
          toast={toast}
          refetchViolations={refetchViolations}
        />
      )}

      {activeSection === "actions" && (
        <ActionsSection 
          actions={correctiveActions || []} 
          isLoading={isLoading}
          users={users || []}
          checks={qualityChecks || []}
          t={t}
          toast={toast}
          refetchActions={refetchActions}
        />
      )}

      {activeSection === "penalties" && (
        <PenaltiesSection 
          penalties={qualityPenalties || []} 
          isLoading={isLoading}
          users={users || []}
          violations={qualityViolations || []}
          t={t}
          toast={toast}
          refetchPenalties={refetchPenalties}
        />
      )}

      {activeSection === "check-types" && (
        <CheckTypesSection 
          checkTypes={checkTypes || []} 
          isLoading={isLoading}
          t={t}
          toast={toast}
        />
      )}

      {activeSection === "reports" && (
        <ReportsSection 
          qualityMetrics={qualityMetrics || {}}
          isLoading={isLoading}
          violationsBySeverity={violationsBySeverity}
          checksByResult={checksByResult}
          penaltiesByType={penaltiesByType}
          t={t}
        />
      )}
    </div>
  );
}

// Overview section
function OverviewSection({ 
  stats, 
  violationsBySeverity, 
  checksByResult, 
  penaltiesByType,
  isLoading,
  recentViolations,
  recentChecks
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.quality_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.qualityRate}%</div>
              <Badge variant={stats.qualityRate > 90 ? "success" : stats.qualityRate > 75 ? "warning" : "destructive"}>
                {stats.qualityRate > 90 ? t("quality.excellent") : stats.qualityRate > 75 ? t("quality.average") : t("quality.poor")}
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
              <div className="text-2xl font-bold">{stats.violations}</div>
              <Badge variant={stats.openViolations > 0 ? "destructive" : "outline"}>
                {stats.openViolations} {t("quality.open")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.violations - stats.openViolations} {t("quality.resolved")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.corrective_actions.title_short")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.correctiveActions}</div>
              <Badge variant={stats.pendingActions > 0 ? "warning" : "outline"}>
                {stats.pendingActions} {t("quality.pending")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.correctiveActions - stats.pendingActions} {t("quality.completed")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.penalties.title_short")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.penalties}</div>
              <Badge variant={stats.activePenalties > 0 ? "destructive" : "outline"}>
                {stats.activePenalties} {t("quality.active")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.penalties - stats.activePenalties} {t("quality.closed")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("quality.violations_by_severity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <span className="text-sm text-gray-500">{t("common.loading")}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={violationsBySeverity}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {violationsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Critical' ? '#ef4444' : 
                        entry.name === 'Major' ? '#f97316' : 
                        '#f59e0b'
                      } />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/violations')}
              >
                {t("quality.view_all")}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/reports')}
              >
                {t("quality.reports")}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/violations?action=new')}
              >
                {t("quality.report_new")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("quality.checks_by_result")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <span className="text-sm text-gray-500">{t("common.loading")}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={checksByResult}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {checksByResult.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Passed' ? '#10b981' : '#ef4444'
                      } />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/checks')}
              >
                {t("quality.view_all")}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/check-types')}
              >
                {t("quality.types")}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/checks?action=new')}
              >
                {t("quality.new_check")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("quality.penalties.by_type")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <span className="text-sm text-gray-500">{t("common.loading")}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={penaltiesByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {penaltiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/penalties')}
              >
                {t("quality.view_all")}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/reports')}
              >
                {t("quality.reports")}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => setLocation('/quality/penalties?action=new')}
              >
                {t("quality.new_penalty")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("quality.recent_violations")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <span className="text-sm text-gray-500">{t("common.loading")}</span>
              </div>
            ) : recentViolations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileWarning className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{t("quality.no_violations")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentViolations.map((violation) => (
                  <div key={violation.id} className="flex items-start space-x-3 p-3 border rounded-md">
                    <Badge variant={
                      violation.severity === "Critical" ? "destructive" : 
                      violation.severity === "Major" ? "warning" : 
                      "outline"
                    } className="mt-1 whitespace-nowrap">
                      {violation.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {violation.description?.substring(0, 80)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("quality.reported_by")}: {violation.reportedBy} • {new Date(violation.reportDate).toLocaleDateString()} • 
                        <Badge variant={
                          violation.status === "Open" ? "outline" : 
                          violation.status === "In Progress" ? "secondary" : 
                          violation.status === "Resolved" ? "success" : 
                          "outline"
                        } className="ml-2">
                          {violation.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full text-sm mt-4"
                  onClick={() => setLocation('/quality/violations')}
                >
                  {t("quality.view_all_violations")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quality.recent_checks")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <span className="text-sm text-gray-500">{t("common.loading")}</span>
              </div>
            ) : recentChecks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{t("quality.no_checks")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentChecks.map((check) => (
                  <div key={check.id} className="flex items-start space-x-3 p-3 border rounded-md">
                    <Badge variant={check.passed ? "success" : "destructive"} className="mt-1 whitespace-nowrap">
                      {check.passed ? t("quality.passed") : t("quality.failed")}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t("quality.check")} #{check.id} - {check.checkTypeId}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("quality.performed_by")}: {check.performedBy} • 
                        {new Date(check.checkDate).toLocaleDateString()} • 
                        {check.rollId && <span>Roll: {check.rollId}</span>}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full text-sm mt-4"
                  onClick={() => setLocation('/quality/checks')}
                >
                  {t("quality.view_all_checks")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Checks section - placeholder for now
function ChecksSection({ checks, isLoading, checkTypes, rolls, jobOrders, users, t, toast, refetchChecks }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCheckType, setSelectedCheckType] = useState("all");
  const [isNewCheckDialogOpen, setIsNewCheckDialogOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);

  // Filter checks
  const filteredChecks = checks.filter(check => {
    // Apply search
    const searchMatch = 
      String(check.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.rollId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Apply status filter
    const statusMatch = 
      statusFilter === "all" || 
      (statusFilter === "passed" && check.passed) || 
      (statusFilter === "failed" && !check.passed);
      
    // Apply check type filter
    const typeMatch = selectedCheckType === "all" || check.checkTypeId === selectedCheckType;
    
    return searchMatch && statusMatch && typeMatch;
  });

  // Schema for creating a new check
  const checkFormSchema = z.object({
    checkTypeId: z.string({
      required_error: t("quality.check_type_required"),
    }),
    rollId: z.string().optional(),
    jobOrderId: z.number().optional(),
    performedBy: z.string({
      required_error: t("quality.performer_required"),
    }),
    checkDate: z.string({
      required_error: t("quality.date_required"),
    }),
    passed: z.boolean().default(true),
    notes: z.string().optional(),
    parameters: z.record(z.string()).optional(),
    checklistItems: z.record(z.boolean()).optional(),
  });

  // Form for creating a new check
  const checkForm = useForm({
    resolver: zodResolver(checkFormSchema),
    defaultValues: {
      checkTypeId: "",
      rollId: "",
      jobOrderId: undefined,
      performedBy: "",
      checkDate: new Date().toISOString().split('T')[0],
      passed: true,
      notes: "",
      parameters: {},
      checklistItems: {},
    },
  });

  // Handle submission of new check
  const onSubmitCheck = async (data) => {
    try {
      await apiRequest('/api/quality-checks', {
        method: 'POST',
        data
      });
      
      toast({
        title: t("quality.check_created"),
        description: t("quality.check_creation_success"),
      });
      
      setIsNewCheckDialogOpen(false);
      checkForm.reset();
      refetchChecks();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("quality.check_creation_error"),
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // View check details
  const viewCheckDetails = (check) => {
    setSelectedCheck(check);
    setIsViewDetailOpen(true);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <CardTitle>{t("quality.checks")}</CardTitle>
            <Button 
              onClick={() => setIsNewCheckDialogOpen(true)}
              className="mt-2 sm:mt-0"
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("quality.new_check")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder={t("quality.search_checks")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("quality.filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("quality.all_statuses")}</SelectItem>
                <SelectItem value="passed">{t("quality.passed")}</SelectItem>
                <SelectItem value="failed">{t("quality.failed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCheckType} onValueChange={setSelectedCheckType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("quality.filter_by_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("quality.all_types")}</SelectItem>
                {checkTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <p>{t("common.loading")}</p>
            </div>
          ) : filteredChecks.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">{t("quality.no_checks_found")}</h3>
              <p className="text-sm text-gray-500 mt-2">
                {t("quality.try_different_filters")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{t("quality.id")}</TableHead>
                    <TableHead>{t("quality.type")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("quality.roll_id")}</TableHead>
                    <TableHead>{t("quality.result")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("quality.date")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("quality.performed_by")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecks.map(check => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.id}</TableCell>
                      <TableCell>
                        {checkTypes.find(t => t.id === check.checkTypeId)?.name || check.checkTypeId}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {check.rollId || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={check.passed ? "success" : "destructive"}>
                          {check.passed ? t("quality.passed") : t("quality.failed")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(check.checkDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {check.performedBy}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewCheckDetails(check)}
                        >
                          {t("common.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Check Dialog */}
      <Dialog open={isNewCheckDialogOpen} onOpenChange={setIsNewCheckDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("quality.new_quality_check")}</DialogTitle>
            <DialogDescription>
              {t("quality.new_check_description")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...checkForm}>
            <form onSubmit={checkForm.handleSubmit(onSubmitCheck)} className="space-y-4">
              <FormField
                control={checkForm.control}
                name="checkTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.check_type")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="rollId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.roll")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_roll")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("common.none")}</SelectItem>
                        {rolls.map(roll => (
                          <SelectItem key={roll.id} value={roll.id}>{roll.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="jobOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.job_order")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_job_order")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("common.none")}</SelectItem>
                        {jobOrders.map(jo => (
                          <SelectItem key={jo.id} value={jo.id.toString()}>JO #{jo.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="performedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.performed_by")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_performer")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.username}>{user.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="checkDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="passed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t("quality.check_passed")}
                      </FormLabel>
                      <FormDescription>
                        {t("quality.check_passed_description")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.notes")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewCheckDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit">
                  {t("quality.create_check")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Check Details Dialog */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedCheck && (
            <>
              <DialogHeader>
                <DialogTitle>{t("quality.check_details")}</DialogTitle>
                <DialogDescription>
                  {t("quality.check")} #{selectedCheck.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.check_type")}</h4>
                    <p>{checkTypes.find(t => t.id === selectedCheck.checkTypeId)?.name || selectedCheck.checkTypeId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.result")}</h4>
                    <Badge variant={selectedCheck.passed ? "success" : "destructive"}>
                      {selectedCheck.passed ? t("quality.passed") : t("quality.failed")}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.date")}</h4>
                    <p>{new Date(selectedCheck.checkDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.performed_by")}</h4>
                    <p>{selectedCheck.performedBy}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.roll_id")}</h4>
                  <p>{selectedCheck.rollId || "-"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.job_order")}</h4>
                  <p>{selectedCheck.jobOrderId ? `JO #${selectedCheck.jobOrderId}` : "-"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.notes")}</h4>
                  <p className="text-sm">{selectedCheck.notes || "-"}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDetailOpen(false)}>
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ViolationsSection placeholder
function ViolationsSection({ violations, isLoading, users, checks, t, toast, refetchViolations }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.violations")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6">{t("quality.violations_description")}</p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="text-center py-10">
            <FileWarning className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_violations_found")}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {violations.map(violation => (
              <Card key={violation.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        violation.severity === "Critical" ? "destructive" : 
                        violation.severity === "Major" ? "warning" : 
                        "outline"
                      }>
                        {violation.severity}
                      </Badge>
                      <CardTitle className="text-base">
                        {t("quality.violation")} #{violation.id}
                      </CardTitle>
                    </div>
                    <Badge variant={
                      violation.status === "Open" ? "outline" : 
                      violation.status === "In Progress" ? "secondary" : 
                      violation.status === "Resolved" ? "success" : 
                      "outline"
                    }>
                      {violation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.reported_by")}: {violation.reportedBy} • {new Date(violation.reportDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{violation.description}</p>
                  {violation.qualityCheckId && (
                    <p className="text-xs text-gray-500">
                      {t("quality.related_check")}: #{violation.qualityCheckId}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ActionsSection placeholder
function ActionsSection({ actions, isLoading, users, checks, t, toast, refetchActions }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.corrective_actions.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6">{t("quality.corrective_actions.description")}</p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-10">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_actions_found")}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map(action => (
              <Card key={action.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {t("quality.corrective_action")} #{action.id}
                    </CardTitle>
                    <Badge variant={action.verifiedDate ? "success" : "outline"}>
                      {action.verifiedDate ? t("quality.verified") : t("quality.pending")}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.related_check")}: #{action.qualityCheckId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{action.action}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>{t("quality.implemented_by")}: {action.implementedBy || "-"}</span>
                    {action.implementationDate && (
                      <span>{t("quality.implementation_date")}: {new Date(action.implementationDate).toLocaleDateString()}</span>
                    )}
                    {action.verifiedBy && (
                      <span>{t("quality.verified_by")}: {action.verifiedBy}</span>
                    )}
                    {action.verifiedDate && (
                      <span>{t("quality.verification_date")}: {new Date(action.verifiedDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// PenaltiesSection placeholder
function PenaltiesSection({ penalties, isLoading, users, violations, t, toast, refetchPenalties }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.penalties.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6">{t("quality.penalties.description")}</p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}</p>
          </div>
        ) : penalties.length === 0 ? (
          <div className="text-center py-10">
            <UserMinus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_penalties_found")}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {penalties.map(penalty => (
              <Card key={penalty.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        penalty.penaltyType === "Warning" ? "outline" : 
                        penalty.penaltyType === "Training" ? "secondary" : 
                        penalty.penaltyType === "Financial" ? "destructive" : 
                        "outline"
                      }>
                        {penalty.penaltyType}
                      </Badge>
                      <CardTitle className="text-base">
                        {t("quality.penalty")} #{penalty.id}
                      </CardTitle>
                    </div>
                    <Badge variant={
                      penalty.status === "Active" ? "destructive" : 
                      penalty.status === "Pending" ? "warning" : 
                      penalty.status === "Completed" ? "success" : 
                      "outline"
                    }>
                      {penalty.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.assigned_to")}: {penalty.assignedTo} • {new Date(penalty.assignedDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{penalty.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>{t("quality.related_violation")}: #{penalty.violationId}</span>
                    {penalty.penaltyAmount && (
                      <span>{t("quality.amount")}: ${penalty.penaltyAmount}</span>
                    )}
                    {penalty.completionDate && (
                      <span>{t("quality.completion_date")}: {new Date(penalty.completionDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3 flex justify-end">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    {t("quality.print")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// CheckTypesSection placeholder
function CheckTypesSection({ checkTypes, isLoading, t, toast }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.check_types")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6">{t("quality.check_types_description")}</p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}</p>
          </div>
        ) : checkTypes.length === 0 ? (
          <div className="text-center py-10">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_check_types_found")}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {checkTypes.map(type => (
              <Card key={type.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {type.name}
                    </CardTitle>
                    <Badge variant={type.isActive ? "success" : "outline"}>
                      {type.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.id")}: {type.id} • {t("quality.stage")}: {type.targetStage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{type.description || t("quality.no_description")}</p>
                  
                  {type.parameters && type.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">{t("quality.parameters")}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {type.parameters.map((param, i) => (
                          <Badge key={i} variant="outline">{param}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {type.checklistItems && type.checklistItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{t("quality.checklist_items")}:</h4>
                      <div className="flex flex-col gap-1">
                        {type.checklistItems.map((item, i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-4 h-4 border rounded mr-2 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ReportsSection placeholder
function ReportsSection({ 
  qualityMetrics, 
  isLoading, 
  violationsBySeverity, 
  checksByResult, 
  penaltiesByType,
  t 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.reports_and_analytics")}</CardTitle>
          <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
            <Download className="h-4 w-4 mr-2" />
            {t("quality.export_report")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6">{t("quality.reports_description")}</p>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">{t("quality.quality_rate")}</p>
                      <h3 className="text-2xl font-bold">{qualityMetrics.passRate}%</h3>
                    </div>
                    <BarChart2 className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">{t("quality.total_checks")}</p>
                      <h3 className="text-2xl font-bold">{qualityMetrics.totalChecks || 0}</h3>
                    </div>
                    <ClipboardCheck className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">{t("quality.failed_checks")}</p>
                      <h3 className="text-2xl font-bold">{qualityMetrics.failedChecks || 0}</h3>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("quality.quality_checks_distribution")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={checksByResult}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {checksByResult.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'Passed' ? '#10b981' : '#ef4444'
                          } />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("quality.violations_by_severity")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={violationsBySeverity}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name={t("quality.count")}
                        fill={
                          "#8884d8"
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Check Results */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">{t("quality.detailed_check_results")}</CardTitle>
              </CardHeader>
              <CardContent>
                {!qualityMetrics.checks || qualityMetrics.checks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t("quality.no_detailed_results")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("quality.check_id")}</TableHead>
                          <TableHead>{t("quality.date")}</TableHead>
                          <TableHead>{t("quality.type")}</TableHead>
                          <TableHead>{t("quality.result")}</TableHead>
                          <TableHead>{t("quality.performed_by")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qualityMetrics.checks.slice(0, 5).map(check => (
                          <TableRow key={check.id}>
                            <TableCell>{check.id}</TableCell>
                            <TableCell>{new Date(check.date).toLocaleDateString()}</TableCell>
                            <TableCell>{check.checkType}</TableCell>
                            <TableCell>
                              <Badge variant={check.result === "Pass" ? "success" : "destructive"}>
                                {check.result}
                              </Badge>
                            </TableCell>
                            <TableCell>{check.performer}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}